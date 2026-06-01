/**
 * Privacy Rights Clearinghouse data-broker adapter.
 *
 * Source: https://privacyrights.org/data-brokers (~600 US-focused brokers,
 * hand-maintained since 2014 by a 501(c)(3) consumer-rights nonprofit).
 *
 * Confidence tier: Community. PRC is the longest-running public broker
 * list outside the statutory CA/VT registries; coverage overlaps with
 * California for nationwide players and adds long-tail people-search /
 * background-check vendors that haven't filed in CA. Statutory `Verified`
 * stays reserved for legally compelled registries (Cal. Civ. Code
 * §1798.99.82, Vt. Stat. tit. 9 §2446).
 *
 * The CSV is curator-maintained at `_data_sources/prc-brokers.csv`; the
 * curator drops an updated export manually.
 *
 * Expected CSV columns (parser is lenient against rename):
 *   name              : broker / company legal name
 *   url               : company URL, optional
 *   email             : privacy / opt-out contact, optional
 *   postal            : postal address, optional
 *   opt_out_url       : direct opt-out form if PRC tracks one
 *   category          : PRC's broker classification (people-search,
 *                       background-check, marketing, etc.), optional
 *
 * Skips cleanly on missing file, read failure, or parse error. The build
 * still produces the registry-sans-PRC dataset rather than crashing.
 */

import * as fs from 'fs';
import { parseCsv } from './csv';
import { slugify, stripBom, type ExternalBroker } from './util';

export function loadPrcBrokers(csvPath: string): ExternalBroker[] {
  if (!fs.existsSync(csvPath)) {
    console.log(`PRC broker CSV not found at ${csvPath}, skipping`);
    return [];
  }
  let text: string;
  try {
    text = stripBom(fs.readFileSync(csvPath, 'utf8'));
  } catch (err) {
    console.warn(`PRC broker CSV read failed at ${csvPath}: ${(err as Error).message}, skipping`);
    return [];
  }
  let rows: Array<Record<string, string>>;
  try {
    rows = parseCsv(text);
  } catch (err) {
    console.warn(`PRC broker CSV parse failed at ${csvPath}: ${(err as Error).message}, skipping`);
    return [];
  }
  const out: ExternalBroker[] = [];
  const seenSlugs = new Set<string>();
  let skippedNoName = 0;
  let skippedBadSlug = 0;
  let duplicateSlugs = 0;
  for (const row of rows) {
    const name = (row.name || row.company || row.broker_name || '').trim();
    if (!name) { skippedNoName++; continue; }
    const slug = slugify(name);
    if (!slug) { skippedBadSlug++; continue; }
    if (seenSlugs.has(slug)) {
      duplicateSlugs++;
      console.warn(`prc-brokers: duplicate slug '${slug}' for ${name}, keeping first occurrence`);
      continue;
    }
    seenSlugs.add(slug);
    // PRC tracks an opt-out URL alongside (or instead of) a privacy email.
    // Stash it in `url` if no company URL was supplied. The runtime will
    // surface it on the row, which is the actionable thing for a US
    // long-tail broker that doesn't expose a contact email.
    const email = (row.email || row.privacy_email || row.contact || '').trim() || undefined;
    const companyUrl = (row.url || row.website || '').trim() || undefined;
    const optOutUrl = (row.opt_out_url || row.optout_url || '').trim() || undefined;
    const url = companyUrl || optOutUrl;
    const postalAddress = (row.postal || row.address || '').trim() || undefined;
    out.push({
      id: `prc-${slug}`,
      name,
      slug,
      url,
      email,
      postalAddress,
      source: 'prc-brokers',
      headquarterCountry: 'US',
    });
  }
  console.log(
    `PRC broker list: parsed ${out.length} entries (skipped ${skippedNoName} no-name, ${skippedBadSlug} bad-slug, ${duplicateSlugs} duplicates)`,
  );
  return out;
}
