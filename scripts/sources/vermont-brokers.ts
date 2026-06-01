/**
 * Vermont Secretary of State data-broker registry adapter.
 *
 * Registry: https://sos.vermont.gov/corporations/other-services/data-brokers/
 * Legal basis: Vt. Stat. tit. 9 §2446. First state-level broker
 * registry (2018), still the longest-running one.
 * License: public record under Vermont public records law.
 * Refresh: annually around Jan-Feb.
 *
 * Expected CSV columns:
 *   data_broker (or `name`)
 *   email
 *   address
 *   website
 *   registration_year
 *
 * Like California, columns drift between annual files. The reader is
 * lenient and falls back across sensible aliases.
 */

import * as fs from 'fs';
import { parseCsv } from './csv';
import { slugify, stripBom, type ExternalBroker } from './util';

export function loadVermontBrokers(csvPath: string): ExternalBroker[] {
  if (!fs.existsSync(csvPath)) {
    console.log(`Vermont broker CSV not found at ${csvPath}, skipping`);
    return [];
  }
  const text = stripBom(fs.readFileSync(csvPath, 'utf8'));
  const rows = parseCsv(text);
  const out: ExternalBroker[] = [];
  for (const row of rows) {
    const name = (row.data_broker || row.name || row.broker_name || '').trim();
    if (!name) continue;
    const email = (row.email || row.contact_email || '').trim() || undefined;
    const url = (row.website || row.url || '').trim() || undefined;
    const postalAddress = (row.address || row.mailing_address || '').trim() || undefined;
    const externalId = (row.registration_year || '').trim() || undefined;
    const slug = slugify(name);
    if (!slug) continue;
    out.push({
      id: `vt-${slug}`,
      name,
      slug,
      url,
      email,
      postalAddress,
      source: 'vt-broker-registry',
      headquarterCountry: 'US',
      externalId,
    });
  }
  console.log(`Vermont broker registry: parsed ${out.length} entries`);
  return out;
}
