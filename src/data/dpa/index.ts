import { DpaInfo, Language } from '../../types';
import DPA_RAW from '../../../generated-dpa-directory.json';

const VALID_LANGUAGES: ReadonlySet<string> = new Set(['EN', 'DE', 'FR', 'ES', 'IT']);
// Drop non-UI language codes — `dpaLanguage()` only renders templates in
// EN/DE/FR/ES/IT, so a DPA listing NO/IS as native languages still routes
// through one of these in the template pipeline.
function normalizeLanguages(raw: unknown): Language[] {
  if (!Array.isArray(raw)) return ['EN'];
  return raw.filter((l): l is Language => typeof l === 'string' && VALID_LANGUAGES.has(l));
}

const dpaDirectory: Record<string, DpaInfo> = {};

for (const [code, entry] of Object.entries(DPA_RAW as Record<string, unknown>)) {
  if (!entry || typeof entry !== 'object') continue;
  const e = entry as Record<string, unknown>;
  if (typeof e.name !== 'string' || typeof e.country !== 'string' || typeof e.complaintUrl !== 'string') {
    // eslint-disable-next-line no-console
    console.warn(`[dpa] skipping malformed entry for ${code}`);
    continue;
  }
  const langs = normalizeLanguages(e.languages);
  dpaDirectory[code] = {
    name: e.name,
    country: e.country,
    complaintUrl: e.complaintUrl,
    languages: langs.length > 0 ? langs : ['EN'],
  };
}

export function getDpaForCountry(countryCode: string): DpaInfo | undefined {
  return dpaDirectory[countryCode.toUpperCase()];
}

export { dpaDirectory };
