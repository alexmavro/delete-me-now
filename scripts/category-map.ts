/**
 * Maps Datenanfragen.de category tags to our ServiceCategory values.
 * A single Datenanfragen tag can map to multiple of our categories.
 */

export const CATEGORY_MAP: Record<string, string[]> = {
  // Datenanfragen uses space-separated tags, not underscores
  // Include both forms for safety
  'address_dealer': ['Data Broker'],
  'addresses': ['Data Broker'],
  'credit_agency': ['Finance', 'Data Broker'],
  'credit agency': ['Finance', 'Data Broker'],
  'commerce': ['Shopping'],
  'finance': ['Finance'],
  'insurance': ['Insurance'],
  'social_media': ['Social'],
  'social media': ['Social'],
  'telecommunication': ['Telecom'],
  'utility': ['Utility'],
  'mobility': ['Travel'],
  'travel': ['Travel'],
  'entertainment': ['Entertainment'],
  'tech': ['Cloud & Hosting'],
  'education': ['Education'],
  'school': ['Education'],
  'public_body': ['Government'],
  'public body': ['Government'],
  'tracking': ['Ad Tech'],
  'ads': ['Ad Tech'],
  'health': ['Health'],

  // Less common tags
  'collection_agency': ['Finance'],
  'collection agency': ['Finance'],
  'consulting': ['Other'],
  'church': ['Other'],
  'political_party': ['Government'],
  'political party': ['Government'],
  'nonprofit': ['Other'],
  'newspaper': ['News & Media'],
  'broker': ['Data Broker'],
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
  if (result.size === 0) result.add('Other');
  return [...result];
}
