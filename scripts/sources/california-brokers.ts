/**
 * California data-broker registry adapter.
 *
 * Registry: https://cppa.ca.gov/data_broker_registry/ (file
 * `complete-reg-data-brokers.csv`). The Delete Act moved the register from
 * the Attorney General to the Privacy Protection Agency, which also renamed
 * every column, so both header vocabularies are accepted below.
 * Legal basis: Cal. Civ. Code §1798.99.82.
 * License: public record under the California Public Records Act. Cite the
 * agency. Refresh: annually around Feb-Mar.
 *
 * Accepted CSV columns (either vocabulary, `parseCsv` lowercases and
 * underscores headers before they reach this file):
 *   name    : data_broker_name | business_name | name
 *   email   : email_address    | email | privacy_email
 *   url     : website_url      | url | website
 *   postal  : physical_address | address | business_address
 *   id      : registration_id  | broker_id   (absent from the CPPA export;
 *             falls back to the slug, which is unique across the register)
 */

import * as fs from 'fs';
import { parseCsv } from './csv';
import { slugify, stripBom, type ExternalBroker } from './util';

// The register publishes every address as `privacy [at] example.com` to
// frustrate scrapers. Left as-is, all 549 rows carry an unsendable address
// and the entire register is inert. The whole file uses this one spelling.
// Letters quote this declaration verbatim, so it is kept only where it is
// short enough to quote. A handful of registrants pasted an entire privacy
// policy into the field (the longest runs to 19,400 characters); truncating
// would misquote a statement being cited against them, and a letter carrying
// the full blob is unreadable. Dropped entries simply lose the quotation.
const MAX_QUOTABLE_ROUTE = 400;

function quotableRoute(raw: string | undefined): string | undefined {
  const route = (raw || '').trim();
  return route && route.length <= MAX_QUOTABLE_ROUTE ? route : undefined;
}

// The register publishes M/D/YYYY, which a letter quoting it would render as
// an ambiguous date for every reader outside the US. Anything that doesn't
// parse is dropped rather than guessed at, since a wrong date in a legal
// citation is worse than no date.
function toIsoDate(raw: string | undefined): string | undefined {
  const m = (raw || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, month, day, year] = m;
  if (+month < 1 || +month > 12 || +day < 1 || +day > 31) return undefined;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function deobfuscateEmail(raw: string): string | undefined {
  const email = raw.replace(/\s*\[\s*at\s*\]\s*/gi, '@').trim();
  return /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email) ? email : undefined;
}

export function loadCaliforniaBrokers(csvPath: string): ExternalBroker[] {
  if (!fs.existsSync(csvPath)) {
    console.log(`California broker CSV not found at ${csvPath}, skipping`);
    return [];
  }
  const text = stripBom(fs.readFileSync(csvPath, 'utf8'));
  const rows = parseCsv(text);
  const out: ExternalBroker[] = [];
  let unreadableEmails = 0;
  for (const row of rows) {
    const name = (row.data_broker_name || row.business_name || row.name || '').trim();
    if (!name) continue;
    // CA registry doesn't always publish a contact email — that's fine,
    // the importer treats email-less rows as "needs paper letter" but
    // still surfaces them in the directory so users can add their own.
    const rawEmail = (row.email_address || row.email || row.privacy_email || '').trim();
    const email = rawEmail ? deobfuscateEmail(rawEmail) : undefined;
    if (rawEmail && !email) unreadableEmails++;
    const url = (row.website_url || row.url || row.website || '').trim() || undefined;
    const postalAddress =
      (row.physical_address || row.address || row.business_address || '').trim() || undefined;
    const externalId = (row.registration_id || row.broker_id || '').trim() || undefined;
    // Filed under Cal. Civ. Code §1798.99.82. Some rows give a bare domain,
    // some a sentence; both are usable as-is because the point is that the
    // company chose the wording, not that it parses cleanly.
    const declaredRequestRoute = quotableRoute(
      row.how_a_consumer_may_opt_out_of_sale_or_submit_requests_under_the_ccpa || row.opt_out,
    );
    const registeredSince = toIsoDate(row.date_added);
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
      declaredRequestRoute,
      registryName: 'California Privacy Protection Agency data broker register',
      registeredSince,
    });
  }
  console.log(`California broker registry: parsed ${out.length} entries`);
  // A spike here means the register changed its anti-scrape spelling and
  // those rows just lost their only email channel.
  if (unreadableEmails > 0) {
    console.warn(
      `California broker registry: ${unreadableEmails} email(s) did not resolve to a valid address — check the register's obfuscation format`,
    );
  }
  return out;
}
