// Parse a Directory search query into structured tag filters + free text.
// Recognizes `tag:broker` / `region:DE` / `cat:social` / `risk:high`.
// Anything else is plain free-text matched against the service name.
//
// Examples:
//   "facebook" → { tags: {}, text: "facebook" }
//   "tag:broker" → { tags: { tag: "broker" }, text: "" }
//   "region:DE adtech" → { tags: { region: "DE" }, text: "adtech" }
//   "tag:broker tag:adtech" → tags["tag"] = last value wins ("adtech")
//
// Tag values are lowercased except `region` which uppercases to match the
// Region union ('DE', 'UK', etc.). Free text is lowercased at match time.

export interface ParsedQuery {
  tags: Partial<{
    tag: string;
    region: string;
    cat: string;
    risk: string;
  }>;
  text: string;
}

const TAG_KEYS: ReadonlySet<string> = new Set(['tag', 'region', 'cat', 'risk']);

export function parseQuery(raw: string): ParsedQuery {
  const tags: ParsedQuery['tags'] = {};
  const textParts: string[] = [];
  for (const tok of raw.trim().split(/\s+/)) {
    if (!tok) continue;
    const colon = tok.indexOf(':');
    if (colon > 0) {
      const key = tok.slice(0, colon).toLowerCase();
      const val = tok.slice(colon + 1);
      // Recognized key + non-empty value → tag. Recognized key + empty
      // value (`tag:`) → fall through to free text so it isn't silently
      // dropped. Unrecognized keys also fall through.
      if (TAG_KEYS.has(key) && val.length > 0) {
        tags[key as keyof ParsedQuery['tags']] = key === 'region' ? val.toUpperCase() : val.toLowerCase();
        continue;
      }
    }
    textParts.push(tok);
  }
  return { tags, text: textParts.join(' ').toLowerCase() };
}

// Match a parsed-query tag against a category list (case-insensitive,
// substring). E.g. tag:broker matches both 'Data Broker' and 'AdTech-Broker';
// cat:social matches 'Social Media'.
export function categoryMatches(categories: readonly string[], needle: string): boolean {
  const n = needle.toLowerCase();
  return categories.some((c) => c.toLowerCase().includes(n));
}
