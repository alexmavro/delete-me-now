/**
 * scripts/import-services.ts
 *
 * Imports the Datenanfragen.de company database and generates an enriched
 * services JSON file with multi-category tagging, regional data, contact
 * hierarchy, and DPA mapping.
 *
 * Usage: npx tsx scripts/import-services.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { mapCategories } from './category-map';
import { getDpaForCountry, DPA_DIRECTORY } from './dpa-directory';
import { loadCaliforniaBrokers } from './sources/california-brokers';
import { loadVermontBrokers } from './sources/vermont-brokers';
import { loadEuBrokers } from './sources/eu-brokers';
import { loadPrcBrokers } from './sources/prc-brokers';
import type { ExternalBroker } from './sources/util';

// The package is ESM, so there is no ambient __dirname to resolve against.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const REPO_URL = 'https://github.com/datenanfragen/data.git';
const TEMP_DIR = path.join(scriptDir, '../_upstream_data');
const OUTPUT_FILE = path.join(scriptDir, '../generated-services.json');
const DPA_OUTPUT_FILE = path.join(scriptDir, '../generated-dpa-directory.json');
const RECOMMENDATIONS_OUTPUT = path.join(scriptDir, '../generated-recommendations.json');

// Optional broker registry CSVs. If present, merged after Datenanfragen.
// California: cppa.ca.gov/data_broker_registry/ — download
// `complete-reg-data-brokers.csv` and save it as `ca-brokers.csv`.
// Vermont: registered brokers are published through the Secretary of State's
// business-filings portal, which serves no bulk export.
// Missing files are skipped, not an error.
const CA_BROKERS_CSV = path.join(scriptDir, '../_data_sources/ca-brokers.csv');
const VT_BROKERS_CSV = path.join(scriptDir, '../_data_sources/vt-brokers.csv');
// EEA shortlist sourced from public DPA enforcement actions and GDPRhub
// case index. Curator-maintained, lower coverage than the statutory
// CA/VT registries, but pulls in EEA-resident brokers those can't see.
const EU_BROKERS_CSV = path.join(scriptDir, '../_data_sources/eu-brokers.csv');
// Privacy Rights Clearinghouse data-broker list (US, ~600 entries,
// hand-maintained nonprofit since 2014). Adds people-search +
// background-check long-tail beyond the CA/VT statutory registries.
const PRC_BROKERS_CSV = path.join(scriptDir, '../_data_sources/prc-brokers.csv');

// Map Datenanfragen country folder names to our Region codes
const COUNTRY_TO_REGION: Record<string, string> = {
  de: 'DE', fr: 'FR', it: 'IT', es: 'ES', nl: 'NL', be: 'BE', at: 'AT',
  pl: 'PL', se: 'SE', dk: 'DK', fi: 'FI', ie: 'IE', pt: 'PT', gr: 'GR',
  cz: 'CZ', ro: 'RO', hu: 'HU', hr: 'HR', sk: 'SK', si: 'SI', bg: 'BG',
  lt: 'LT', lv: 'LV', ee: 'EE', cy: 'CY', lu: 'LU', mt: 'MT',
  gb: 'UK', us: 'US', br: 'BR', ch: 'CH', no: 'NO',
};

const EU_COUNTRY_CODES = new Set([
  'de', 'fr', 'it', 'es', 'nl', 'be', 'at', 'pl', 'se', 'dk',
  'fi', 'ie', 'pt', 'gr', 'cz', 'ro', 'hu', 'hr', 'sk', 'si',
  'bg', 'lt', 'lv', 'ee', 'cy', 'lu', 'mt',
]);

// Known DPO/privacy email patterns
const DPO_PATTERNS = [
  /^dpo@/i, /^datenschutz@/i, /^privacy@/i, /^dpo\./i,
  /^data\.protection@/i, /^dataprotection@/i, /^gdpr@/i,
  /^dpd@/i, /^datenschutzbeauftragt/i,
];

function isDpoEmail(email: string): boolean {
  return DPO_PATTERNS.some((p) => p.test(email));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getAllFiles(dirPath: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full));
    else results.push(full);
  }
  return results;
}

interface ServiceOutput {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  url?: string;
  privacyPolicyUrl?: string;
  categories: string[];
  regions: string[];
  headquarterCountry?: string;
  contacts: {
    dpo?: string;
    privacy?: string;
    general?: string;
    postalAddress?: string;
  };
  confidence: string;
  source: string;
  lastVerified?: string;
  relevantDpa?: string;
  dpaComplaintUrl?: string;
  alsoKnownAs?: string[];
  needsIdDocument?: boolean;
  declaredRequestRoute?: string;
  registryName?: string;
  registeredSince?: string;
}

// Datenanfragen sources are an array of `{url, last-checked}` objects (the
// hyphenated key matches their YAML frontmatter). Pick the most recent
// last-checked across the array as the entry's verification timestamp.
function pickLastVerified(sources: unknown): string | undefined {
  if (!Array.isArray(sources)) return undefined;
  // Lexicographic max relies on YYYY-MM-DD ordering; reject anything that
  // doesn't start with that shape so a future schema drift to YYYY/MM/DD
  // produces undefined rather than silently mis-ordering rows.
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
  let best: string | undefined;
  for (const s of sources) {
    if (!s || typeof s !== 'object') continue;
    const lc = (s as Record<string, unknown>)['last-checked'];
    if (typeof lc !== 'string' || !ISO_DATE.test(lc)) continue;
    if (!best || lc > best) best = lc;
  }
  return best;
}

/**
 * Refuses an import that would drop registry rows the shipped dataset already
 * has. Set REGISTRY_SHRINK_OK=1 to override when the loss is intended.
 */
function assertNoRegistryRegression(loaded: ExternalBroker[]): void {
  if (!fs.existsSync(OUTPUT_FILE)) return;

  let shipped: { source?: string }[];
  try {
    shipped = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  } catch {
    return; // Unreadable existing dataset is not evidence of anything.
  }

  const countBySource = (rows: { source?: string }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.source && r.source !== 'datarequests' && r.source !== 'manual') {
        m.set(r.source, (m.get(r.source) || 0) + 1);
      }
    }
    return m;
  };

  const before = countBySource(shipped);
  const after = countBySource(loaded.map((b) => ({ source: b.source })));
  const lost = [...before.entries()].filter(([src, n]) => (after.get(src) || 0) < n);
  if (lost.length === 0) return;

  const detail = lost.map(([src, n]) => `${src}: ${n} → ${after.get(src) || 0}`).join(', ');
  if (process.env.REGISTRY_SHRINK_OK === '1') {
    console.warn(`\nRegistry rows shrinking (${detail}) — proceeding, REGISTRY_SHRINK_OK is set.`);
    return;
  }
  console.error(
    `\nRefusing to write: this import loses registry rows (${detail}).\n` +
      `The source CSVs in _data_sources/ are missing or unreadable. Restore them\n` +
      `(see scripts/import-services.ts for where each comes from), or re-run with\n` +
      `REGISTRY_SHRINK_OK=1 if the loss is intended.`,
  );
  process.exit(1);
}

function main() {
  console.log('Starting database import...');

  // 1. Clone or pull. execFileSync with argv array (not template-literal
  // shell) so a future change to REPO_URL or TEMP_DIR can't grow into a
  // command-injection surface.
  if (fs.existsSync(TEMP_DIR)) {
    console.log('Updating existing Datenanfragen repository...');
    try {
      execFileSync('git', ['pull'], { cwd: TEMP_DIR, stdio: 'inherit' });
    } catch (err) {
      console.warn('git pull failed, re-cloning:', err instanceof Error ? err.message : err);
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      execFileSync('git', ['clone', '--depth', '1', REPO_URL, TEMP_DIR], { stdio: 'inherit' });
    }
  } else {
    console.log('Cloning Datenanfragen repository...');
    execFileSync('git', ['clone', '--depth', '1', REPO_URL, TEMP_DIR], { stdio: 'inherit' });
  }

  // 2. Parse companies
  const companiesDir = path.join(TEMP_DIR, 'companies');
  const files = getAllFiles(companiesDir).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} company files`);

  const services: ServiceOutput[] = [];
  let skippedFiles = 0;
  let skippedNoContact = 0;
  let skippedNoName = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);

      // Must have at least a name
      if (!data.name) { skippedNoName++; continue; }

      // Categories: map ALL Datenanfragen categories, not just the first
      const datenanfragenCats: string[] = Array.isArray(data.categories) ? data.categories : [];
      const categories = mapCategories(datenanfragenCats);

      // Regions + HQ country from relevant-countries field
      // (Datenanfragen stores companies flat, not in country subdirs)
      const relevantCountries: string[] = Array.isArray(data['relevant-countries']) ? data['relevant-countries'] : [];
      const countryCode = relevantCountries[0]; // first = HQ country
      const regions = new Set<string>();
      for (const rc of relevantCountries) {
        const r = COUNTRY_TO_REGION[rc];
        if (r) regions.add(r);
        if (EU_COUNTRY_CODES.has(rc)) regions.add('EU');
      }
      if (regions.size === 0) regions.add('Global');

      // Contacts: build hierarchy
      const contacts: ServiceOutput['contacts'] = {};
      const email = data.email ? String(data.email).trim() : undefined;
      if (email) {
        if (isDpoEmail(email)) {
          contacts.dpo = email;
        } else if (email.toLowerCase().includes('privacy') || email.toLowerCase().includes('datenschutz')) {
          contacts.privacy = email;
        } else {
          contacts.general = email;
        }
      }
      if (data.address) {
        contacts.postalAddress = String(data.address).trim();
      }

      // At least one contact method required
      if (!contacts.dpo && !contacts.privacy && !contacts.general) { skippedNoContact++; continue; }

      // Upstream grades every record as tested (a request was actually sent
      // and answered), verified (contacts confirmed against a cited source),
      // or scraped (machine-extracted, nobody checked). The first two are
      // trustworthy; scraped contacts are a guess, so they carry the tier
      // that keeps them out of the default breadth and inside speculative
      // mode. An earlier revision OR'd in "has any source", which every
      // record satisfies, collapsing all three grades into Verified and
      // silently turning the confidence filters into no-ops.
      let confidence: string;
      if (data.quality === 'verified' || data.quality === 'tested') {
        confidence = 'Verified';
      } else if (data.quality === 'scraped') {
        confidence = 'Inferred';
      } else {
        confidence = 'Community';
      }

      // DPA mapping from HQ country
      const hqCountry = countryCode?.toUpperCase();
      const dpa = hqCountry ? getDpaForCountry(hqCountry) : undefined;

      const slug = data.slug || slugify(data.name);
      const id = `dr-${countryCode || 'gl'}-${slug}`;

      // People search for the brand on their bank statement, not the legal
      // entity that answers the letter — nobody looks up "1&1 Mail & Media
      // GmbH" to reach GMX. Upstream records the brands each entity runs, so
      // carry them as search aliases; the row itself stays the legal entity.
      const alsoKnownAs = (Array.isArray(data.runs) ? data.runs : [])
        .map((r: unknown) => String(r).trim())
        .filter((r: string) => r && r !== data.name);

      const service: ServiceOutput = {
        id,
        name: data.name,
        slug,
        url: data.web || undefined,
        categories,
        regions: [...regions],
        headquarterCountry: hqCountry,
        contacts,
        confidence,
        source: 'datarequests',
        alsoKnownAs: alsoKnownAs.length > 0 ? alsoKnownAs : undefined,
        needsIdDocument: data['needs-id-document'] === true ? true : undefined,
        lastVerified: pickLastVerified(data.sources),
        relevantDpa: dpa?.name,
        dpaComplaintUrl: dpa?.complaintUrl,
      };

      services.push(service);

      // Stats
    } catch (err) {
      // JSON parse error, encoding issue, or schema drift in upstream
      // Datenanfragen. Surface so a sudden cluster of failures is visible
      // rather than silently shipping a thinned dataset.
      skippedFiles++;
      console.warn(`import-services: skipping ${file}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`Parsed ${services.length} services. Skipped: ${skippedFiles} unparseable, ${skippedNoName} missing name, ${skippedNoContact} no contact method.`);

  // 3. Merge external registries (CA + VT broker registries). Skipped
  //    cleanly when the CSVs aren't present locally; the build still
  //    produces a valid generated-services.json from Datenanfragen alone.
  //
  //    Merge semantics: if a registry row collides (by slug) with an
  //    existing Datenanfragen entry, ENRICH the existing entry by filling
  //    missing fields (email, postal address, URL) from the registry.
  //    Statutory disclosure (Verified-by-construction) outranks community
  //    data on the missing fields specifically; we do NOT clobber fields
  //    Datenanfragen already populated, so DPO addresses survive. New
  //    rows (no Datenanfragen match) are appended fresh. Counters track
  //    enrichments + drops + new adds for the final stats line.
  const externalBrokers: ExternalBroker[] = [
    ...loadCaliforniaBrokers(CA_BROKERS_CSV),
    ...loadVermontBrokers(VT_BROKERS_CSV),
    ...loadEuBrokers(EU_BROKERS_CSV),
    ...loadPrcBrokers(PRC_BROKERS_CSV),
  ];
  // Day-precision is enough; per-row last-checked carries the real signal
  // for Datenanfragen rows, this stamp only matters for registry-only rows.
  const registryImportedAt = new Date().toISOString().slice(0, 10);
  console.log(`\nLoaded ${externalBrokers.length} entries from external broker registries`);

  // The source CSVs are gitignored, so a fresh clone has none and this import
  // would quietly rewrite the dataset without them — dropping every registry
  // broker and leaving a plausible-looking file behind. Refuse instead: an
  // import that silently deletes hundreds of targets is the worst outcome here.
  assertNoRegistryRegression(externalBrokers);

  const bySlug = new Map<string, ServiceOutput>();
  for (const s of services) bySlug.set(s.slug.toLowerCase(), s);
  let enriched = 0;
  let appended = 0;
  let registryDuplicates = 0;
  let registryNoContact = 0;
  let euVsStatutoryDropped = 0;
  const registryEnrichedFrom: Record<string, number> = {};
  for (const eb of externalBrokers) {
    const key = eb.slug.toLowerCase();
    const existing = bySlug.get(key);
    if (existing) {
      // Skip cross-source enrichment of statutory rows. If the merge loop
      // already appended a CA/VT row earlier in this iteration and a
      // later EU shortlist row collides on slug, refuse to fold curator-
      // sourced contacts into a row tagged `Verified`+`ca-broker-registry`
      // (that would launder Community-tier data into a statutory badge).
      // Datenanfragen-primary rows (source: 'datarequests') stay the
      // designated enrichment target; EU vs CA/VT are independent imports.
      if (existing.source !== 'datarequests') {
        // Logged separately so the curator can spot Community-tier curator
        // data that wanted to enrich a statutory row (and was correctly
        // refused) vs same-source registry-vs-registry collisions.
        euVsStatutoryDropped++;
        console.warn(
          `merge: refused to enrich ${existing.source} row '${existing.slug}' with ${eb.source} data (would launder Community-tier into Verified badge)`,
        );
        continue;
      }
      // Slug collision against a Datenanfragen entry. Datenanfragen-keyed
      // entry stays primary; we enrich missing contact fields rather than
      // drop the registry data. Datenanfragen rows always have at least
      // one contact (filtered upstream), so the registry email upgrades a
      // generic-only address to a privacy-specific one when Datenanfragen
      // lacks privacy/dpo. Tagging as `privacy` is statutorily justified
      // for CA/VT (Cal. Civ. Code §1798.99.82(b)(2), Vt. Stat. tit. 9
      // §2446 require brokers to publish a dedicated consumer-rights
      // address); for the curator-sourced EU shortlist the curator
      // selects DPA-disclosed addresses, same intent.
      let touched = false;
      if (!existing.contacts.privacy && !existing.contacts.dpo && eb.email) {
        existing.contacts.privacy = eb.email;
        touched = true;
      }
      if (!existing.contacts.postalAddress && eb.postalAddress) {
        existing.contacts.postalAddress = eb.postalAddress;
        touched = true;
      }
      if (!existing.url && eb.url) {
        existing.url = eb.url;
        touched = true;
      }
      // Track the registry enriched the entry; do NOT change `source`
      // (it stays datarequests so audit trail is honest about origin).
      if (touched) {
        enriched++;
        registryEnrichedFrom[eb.source] = (registryEnrichedFrom[eb.source] || 0) + 1;
      } else {
        registryDuplicates++;
      }
      continue;
    }
    // Fresh row, no Datenanfragen counterpart. Add as standalone service.
    const contacts: ServiceOutput['contacts'] = {};
    if (eb.email) contacts.privacy = eb.email;
    if (eb.postalAddress) contacts.postalAddress = eb.postalAddress;
    // Refuse to ship rows with no actionable channel (no email, no postal,
    // no URL even). Datenanfragen rows are gated upstream; the registry
    // fresh-append branch wasn't, so a curator typo could publish a
    // name-only ghost entry. Counted separately so the curator can spot
    // the drop in the merge stats.
    if (!eb.email && !eb.postalAddress && !eb.url) {
      registryNoContact++;
      continue;
    }
    // Source-aware confidence + region.
    // - Statutory registries (CA/VT): Verified by construction.
    // - PRC: Community (curator-maintained nonprofit, not a legal
    //   disclosure obligation).
    // - EU shortlist: Community, region derived from headquarter country
    //   (case-folded against the lowercase-keyed map), with EEA-fallback
    //   when the country code is unmapped.
    const isStatutory = eb.source === 'ca-broker-registry' || eb.source === 'vt-broker-registry';
    const isUsBroker = isStatutory || eb.source === 'prc-brokers';
    const ccLower = (eb.headquarterCountry || '').toLowerCase();
    const mappedRegion = ccLower ? COUNTRY_TO_REGION[ccLower] : undefined;
    if (eb.source === 'eu-brokers' && !mappedRegion) {
      // Two distinct curator-fixable problems: missing country (left blank
      // in the CSV) vs unmapped code (typo or non-EEA HQ). Log both, with
      // distinguishing copy so the curator knows which row to look at.
      if (!ccLower) {
        console.warn(`eu-brokers: missing country for '${eb.name}', falling back to region 'EU'`);
      } else {
        console.warn(`eu-brokers: unmapped country '${eb.headquarterCountry}' for '${eb.name}', falling back to region 'EU'`);
      }
    }
    // Registration state is where a broker filed paperwork, not the limit of
    // whose data it trades. Tagging these US-only hid them from any EU user
    // who narrowed by region, which is exactly who Art. 3(2)(b) lets write.
    const regions = isUsBroker ? ['US', 'Global'] : [mappedRegion || 'EU'];
    services.push({
      id: eb.id,
      name: eb.name,
      slug: eb.slug,
      url: eb.url,
      categories: ['Data Broker'],
      regions,
      headquarterCountry: eb.headquarterCountry || undefined,
      contacts,
      confidence: isStatutory ? 'Verified' : 'Community',
      source: eb.source,
      declaredRequestRoute: eb.declaredRequestRoute,
      registryName: eb.registryName,
      registeredSince: eb.registeredSince,
      // Stamp at import time. Registry CSVs are downloaded manually on an
      // annual cadence (no per-row `last-checked` like Datenanfragen has),
      // so the import run is the verification event for these rows.
      lastVerified: registryImportedAt,
      relevantDpa: undefined,
      dpaComplaintUrl: undefined,
    });
    bySlug.set(key, services[services.length - 1]);
    appended++;
  }
  console.log(
    `Registry merge: ${appended} new entries, ${enriched} Datenanfragen entries enriched, ${registryDuplicates} registry-vs-registry duplicates dropped, ${euVsStatutoryDropped} EU-vs-statutory drops, ${registryNoContact} dropped for missing contact`,
  );
  if (Object.keys(registryEnrichedFrom).length > 0) {
    console.log(`  enrichment by source: ${JSON.stringify(registryEnrichedFrom)}`);
  }

  // 4a. Final dedup pass on slug. Ordering above already enforces "merge,
  //    not drop" for collisions, so this is defensive — catches any
  //    duplicate slugs introduced by other code paths (e.g. Datenanfragen
  //    repo containing two entries with the same slug). First-seen wins.
  const seen = new Map<string, ServiceOutput>();
  for (const s of services) {
    const key = s.slug.toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }
  const unique = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));

  // 4b. Write outputs
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));
  console.log(`\nGenerated ${unique.length} services → ${OUTPUT_FILE}`);

  // DPA directory
  fs.writeFileSync(DPA_OUTPUT_FILE, JSON.stringify(DPA_DIRECTORY, null, 2));
  console.log(`DPA directory → ${DPA_OUTPUT_FILE}`);

  // Country recommendations (top services per country by count)
  const countryServices = new Map<string, string[]>();
  for (const s of unique) {
    for (const r of s.regions) {
      if (r !== 'Global' && r !== 'EU') {
        const list = countryServices.get(r) || [];
        list.push(s.id);
        countryServices.set(r, list);
      }
    }
  }
  const recommendations = [...countryServices.entries()].map(([countryCode, serviceIds]) => ({
    countryCode,
    serviceIds: serviceIds.slice(0, 100), // top 100 per country
    description: `Common services in ${countryCode}`,
  }));
  fs.writeFileSync(RECOMMENDATIONS_OUTPUT, JSON.stringify(recommendations, null, 2));
  console.log(`Recommendations → ${RECOMMENDATIONS_OUTPUT}`);

  // Counted over what actually shipped rather than the parse loop's running
  // tallies, which stop before the registry merge and so report a broker
  // count that ignores every registry row the merge just appended.
  const tally = (pick: (s: ServiceOutput) => string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const s of services) for (const v of pick(s)) m.set(v, (m.get(v) || 0) + 1);
    return m;
  };

  console.log('\nCategory distribution:');
  [...tally((s) => s.categories).entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  console.log('\nConfidence distribution:');
  [...tally((s) => [s.confidence]).entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([tier, count]) => console.log(`  ${tier}: ${count}`));

  console.log('\nRegion distribution (top 15):');
  [...tally((s) => s.regions).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([region, count]) => console.log(`  ${region}: ${count}`));
}

main();
