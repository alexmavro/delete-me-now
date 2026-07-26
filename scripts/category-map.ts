/**
 * Maps Datenanfragen.de category tags to our ServiceCategory values.
 * A single Datenanfragen tag can map to multiple of our categories.
 */

// One upstream tag, one category. Earlier revisions folded distinct tags
// together — `political party` and `public body` both became `Government`,
// `church` and `nonprofit` both became `Other` — which buried a quarter of
// the directory in a bucket nobody can act on and merged bodies that answer
// an erasure request very differently. Multi-category entries survive only
// where both labels are substantively true: a credit agency really is a data
// broker, because it profiles people who never signed up with it.
//
// The tag vocabulary is Datenanfragen's and is small (18 values in the
// current snapshot). Only tags that actually occur are listed; a tag with no
// entry here falls through to 'Uncategorised' rather than being invented.
export const CATEGORY_MAP: Record<string, string[]> = {
  'addresses': ['Data Broker'],
  'credit agency': ['Credit Agency', 'Data Broker'],
  'collection agency': ['Debt Collection'],
  'commerce': ['Shopping'],
  'finance': ['Finance'],
  'insurance': ['Insurance'],
  'social media': ['Social'],
  'telecommunication': ['Telecom'],
  'utility': ['Utility'],
  'travel': ['Travel'],
  'entertainment': ['Entertainment'],
  'school': ['Education'],
  'public body': ['Public Body'],
  'political party': ['Political Party'],
  'church': ['Religious'],
  'nonprofit': ['Nonprofit'],
  'ads': ['Ad Tech'],
  'health': ['Health'],
};

/**
 * Given an array of Datenanfragen category strings, return our ServiceCategory[] (deduped).
 */
export function mapCategories(datenanfragenCategories: string[]): string[] {
  const result = new Set<string>();
  for (const cat of datenanfragenCategories) {
    const mapped = CATEGORY_MAP[cat];
    if (mapped) {
      for (const c of mapped) result.add(c);
    }
  }
  if (result.size === 0) result.add('Uncategorised');
  return [...result];
}
