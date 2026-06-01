/**
 * Curator-maintained EEA data-broker shortlist.
 *
 * Sources: public DPA enforcement actions and the GDPRhub case index
 * (https://gdprhub.eu/). The CSV is hand-collected and updated when a new
 * cross-border broker surfaces in a published decision. Lower coverage than
 * the statutory CA/VT registries, but pulls in EEA-resident brokers those
 * registries can't see.
 *
 * Confidence tier: Community. Statutory `Verified` is reserved for legally
 * compelled registries (Cal. Civ. Code §1798.99.82, Vt. Stat. tit. 9 §2446).
 *
 * Expected CSV columns (parser is lenient against rename):
 *   name              : company / broker legal name
 *   country           : alpha-2 ISO code, e.g. DE / FR / AT
 *   email             : privacy / DPO contact, optional
 *   postal            : postal address, optional
 *   url               : company URL, optional
 *   source_url        : link to the DPA decision or GDPRhub entry
 *
 * Skips cleanly on missing file, read failure, or parse error. The build
 * still produces the registry-sans-EU dataset rather than crashing.
 */

import * as fs from 'fs';
import { parseCsv } from './csv';
import { slugify, stripBom, type ExternalBroker } from './util';

export function loadEuBrokers(csvPath: string): ExternalBroker[] {
  if (!fs.existsSync(csvPath)) {
    console.log(`EU broker CSV not found at ${csvPath}, skipping`);
    return [];
  }
  let text: string;
  try {
    text = stripBom(fs.readFileSync(csvPath, 'utf8'));
  } catch (err) {
    console.warn(`EU broker CSV read failed at ${csvPath}: ${(err as Error).message}, skipping`);
    return [];
  }
  let rows: Array<Record<string, string>>;
  try {
    rows = parseCsv(text);
  } catch (err) {
    console.warn(`EU broker CSV parse failed at ${csvPath}: ${(err as Error).message}, skipping`);
    return [];
  }
  const out: ExternalBroker[] = [];
  const seenSlugs = new Set<string>();
  let skippedNoName = 0;
  let skippedBadSlug = 0;
  let duplicateSlugs = 0;
  for (const row of rows) {
    const name = (row.name || row.company || '').trim();
    if (!name) { skippedNoName++; continue; }
    const slug = slugify(name);
    if (!slug) { skippedBadSlug++; continue; }
    if (seenSlugs.has(slug)) {
      duplicateSlugs++;
      console.warn(`eu-brokers: duplicate slug '${slug}' for ${name}, keeping first occurrence`);
      continue;
    }
    seenSlugs.add(slug);
    // No 'EU' literal fallback. Emit undefined so downstream branches
    // honestly on "country unknown" instead of silently bucketing as EEA.
    const rawCountry = (row.country || row.hq_country || '').trim().toUpperCase();
    const country = rawCountry || undefined;
    const email = (row.email || row.privacy_email || '').trim() || undefined;
    const url = (row.url || row.website || '').trim() || undefined;
    const postalAddress = (row.postal || row.address || '').trim() || undefined;
    out.push({
      id: `eu-${slug}`,
      name,
      slug,
      url,
      email,
      postalAddress,
      source: 'eu-brokers',
      headquarterCountry: country ?? '',
    });
  }
  console.log(
    `EU broker shortlist: parsed ${out.length} entries (skipped ${skippedNoName} no-name, ${skippedBadSlug} bad-slug, ${duplicateSlugs} duplicates)`,
  );
  return out;
}
