import { Service, RequestStatus, ServiceCategory, Region, ConfidenceLevel, DataSource } from '../../types';
import GENERATED_DB from '../../../generated-services.json';

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'Social', 'Shopping', 'Utility', 'Data Broker', 'Ad Tech',
  'Finance', 'Credit Agency', 'Debt Collection', 'Insurance', 'Travel',
  'Telecom', 'Health', 'Public Body', 'Political Party', 'Education',
  'Religious', 'Nonprofit', 'Entertainment', 'Uncategorised', 'Imported',
]);

const VALID_REGIONS: ReadonlySet<string> = new Set([
  'Global', 'EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
  'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'HR', 'SK', 'SI', 'BG', 'LT',
  'LV', 'EE', 'CY', 'LU', 'MT', 'US', 'UK', 'BR', 'CH', 'NO', 'IS', 'LI',
]);

const VALID_SOURCES: ReadonlySet<string> = new Set([
  'datarequests', 'exodus', 'easyprivacy', 'manual',
  'ca-broker-registry', 'vt-broker-registry', 'eu-brokers', 'prc-brokers',
]);

// Validator drop counters — surface any silent schema drift in dev console
// rather than letting an unknown source/category/confidence land mis-labeled.
const ingestionStats = {
  unknownSource: 0,
  unknownConfidence: 0,
  droppedCategories: 0,
  droppedRegions: 0,
};

function mapConfidence(raw: unknown): ConfidenceLevel {
  const str = String(raw ?? '');
  if (str === 'High') return 'Verified';
  if (str === 'Medium') return 'Community';
  if (str === 'Low') return 'Inferred';
  if (str === 'Verified' || str === 'Community' || str === 'Inferred' || str === 'Manual') {
    return str;
  }
  // Default to 'Community' rather than 'Verified' — an unknown confidence
  // becoming the highest-trust label would actively mislabel low-quality
  // entries as Verified, which the Standard Pack matcher then surfaces.
  ingestionStats.unknownConfidence++;
  return 'Community';
}

// JSON ingestion is a trust boundary. The generated dataset can drift —
// scraper bugs, upstream typos, new categories not in our union — and a stray
// value silently lands in `Service.categories`/`Service.regions`/`Service.source`,
// then breaks downstream filters and smart-pack matchers without a TS error.
// Validate at the boundary; fall back to known-good defaults for stragglers.
function parseStringArray(
  raw: unknown,
  valid: ReadonlySet<string>,
  fallback: string,
  dropBucket: 'droppedCategories' | 'droppedRegions',
): string[] {
  if (!Array.isArray(raw)) return [fallback];
  const filtered: string[] = [];
  for (const v of raw) {
    if (typeof v === 'string' && valid.has(v)) filtered.push(v);
    else ingestionStats[dropBucket]++;
  }
  return filtered.length > 0 ? filtered : [fallback];
}

function parseSource(raw: unknown): DataSource {
  if (typeof raw === 'string' && VALID_SOURCES.has(raw)) return raw as DataSource;
  ingestionStats.unknownSource++;
  return 'manual';
}

function parseContacts(raw: unknown, emailFallback: unknown): Service['contacts'] {
  if (!raw || typeof raw !== 'object') {
    return { general: typeof emailFallback === 'string' ? emailFallback : undefined };
  }
  // Validate each known string field rather than rubber-stamp the whole
  // object — wrong contact fields silently land letters at the wrong inbox.
  const c = raw as Record<string, unknown>;
  const out: Service['contacts'] = {};
  if (typeof c.dpo === 'string') out.dpo = c.dpo;
  if (typeof c.privacy === 'string') out.privacy = c.privacy;
  if (typeof c.general === 'string') out.general = c.general;
  if (typeof c.postalAddress === 'string') out.postalAddress = c.postalAddress;
  return out;
}

const generatedServices: Service[] = (GENERATED_DB as Record<string, unknown>[]).map((s) => {
  const fallbackCategory = typeof s['category'] === 'string' && VALID_CATEGORIES.has(s['category'])
    ? (s['category'] as ServiceCategory)
    : 'Uncategorised';
  const fallbackRegion = typeof s['region'] === 'string' && VALID_REGIONS.has(s['region'])
    ? (s['region'] as Region)
    : 'Global';

  return {
    id: String(s['id'] ?? `gen-${s['name']}`),
    name: String(s['name'] ?? ''),
    slug: String(s['slug'] ?? String(s['name'] ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
    legalName: typeof s['legalName'] === 'string' ? s['legalName'] : undefined,
    registrationId: typeof s['registrationId'] === 'string' ? s['registrationId'] : undefined,
    url: typeof s['url'] === 'string' ? s['url'] : undefined,
    privacyPolicyUrl: typeof s['privacyPolicyUrl'] === 'string' ? s['privacyPolicyUrl'] : undefined,
    categories: parseStringArray(s['categories'], VALID_CATEGORIES, fallbackCategory, 'droppedCategories') as ServiceCategory[],
    regions: parseStringArray(s['regions'], VALID_REGIONS, fallbackRegion, 'droppedRegions') as Region[],
    headquarterCountry: typeof s['headquarterCountry'] === 'string' ? s['headquarterCountry'] : undefined,
    contacts: parseContacts(s['contacts'], s['email']),
    confidence: mapConfidence(s['confidence']),
    source: parseSource(s['source']),
    lastVerified: typeof s['lastVerified'] === 'string' ? s['lastVerified'] : undefined,
    relevantDpa: typeof s['relevantDpa'] === 'string' ? s['relevantDpa'] : undefined,
    dpaComplaintUrl: typeof s['dpaComplaintUrl'] === 'string' ? s['dpaComplaintUrl'] : undefined,
    alsoKnownAs: Array.isArray(s['alsoKnownAs'])
      ? (s['alsoKnownAs'] as unknown[]).filter((v): v is string => typeof v === 'string')
      : undefined,
    needsIdDocument: s['needsIdDocument'] === true ? true : undefined,
    declaredRequestRoute: typeof s['declaredRequestRoute'] === 'string' ? s['declaredRequestRoute'] : undefined,
    registryName: typeof s['registryName'] === 'string' ? s['registryName'] : undefined,
    registeredSince: typeof s['registeredSince'] === 'string' ? s['registeredSince'] : undefined,
    selected: false,
    status: RequestStatus.PENDING,
    notes: typeof s['notes'] === 'string' ? s['notes'] : undefined,
  };
});

if (
  ingestionStats.unknownSource ||
  ingestionStats.unknownConfidence ||
  ingestionStats.droppedCategories ||
  ingestionStats.droppedRegions
) {
  console.warn('services: dataset validators dropped values', ingestionStats);
}

export const INITIAL_SERVICES: Service[] = generatedServices;
