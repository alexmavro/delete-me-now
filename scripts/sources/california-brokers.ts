/**
 * California Attorney General data-broker registry adapter.
 *
 * Registry: https://oag.ca.gov/data-broker
 * Legal basis: Cal. Civ. Code §1798.99.82 (Delete Act, 2023+ scheme).
 * License: public record under California Public Records Act. Cite the
 * AG's office. Refresh: annually around Feb-Mar.
 *
 * Expected CSV columns (subject to drift, verify against the live
 * download before each refresh):
 *   business_name (or `name`)
 *   email           : privacy contact, if published
 *   url             : broker website
 *   address         : postal
 *   registration_id : CA-assigned identifier (preferred for stable id)
 *
 * The script tolerates either 'business_name' or 'name' as the company
 * field, and reads other columns leniently because the AG's CSV schema
 * has changed twice since 2020.
 */

import * as fs from 'fs';
import { parseCsv } from './csv';
import { slugify, stripBom, type ExternalBroker } from './util';

export function loadCaliforniaBrokers(csvPath: string): ExternalBroker[] {
  if (!fs.existsSync(csvPath)) {
    console.log(`California broker CSV not found at ${csvPath}, skipping`);
    return [];
  }
  const text = stripBom(fs.readFileSync(csvPath, 'utf8'));
  const rows = parseCsv(text);
  const out: ExternalBroker[] = [];
  for (const row of rows) {
    const name = (row.business_name || row.name || '').trim();
    if (!name) continue;
    // CA registry doesn't always publish a contact email — that's fine,
    // the importer treats email-less rows as "needs paper letter" but
    // still surfaces them in the directory so users can add their own.
    const email = (row.email || row.privacy_email || '').trim() || undefined;
    const url = (row.url || row.website || '').trim() || undefined;
    const postalAddress = (row.address || row.business_address || '').trim() || undefined;
    const externalId = (row.registration_id || row.broker_id || '').trim() || undefined;
    const slug = slugify(name);
    if (!slug) continue;
    // Prefer registry-assigned id when present (stable across years even
    // when the broker renames slightly); fall back to slug. Sanitised id
    // can come out empty if the registration column is non-alphanumeric;
    // fall through to slug in that case rather than emitting `ca-`.
    const sanitisedExternal = externalId
      ? externalId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : '';
    const idTail = sanitisedExternal || slug;
    out.push({
      id: `ca-${idTail}`,
      name,
      slug,
      url,
      email,
      postalAddress,
      source: 'ca-broker-registry',
      headquarterCountry: 'US',
      externalId,
    });
  }
  console.log(`California broker registry: parsed ${out.length} entries`);
  return out;
}
