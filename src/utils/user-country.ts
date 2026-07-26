import { Jurisdiction, Language, EU_REGIONS } from '../types';

export const SUPPORTED_COUNTRIES = [
  'AT', 'AU', 'BE', 'BG', 'BR', 'CA', 'CH', 'CY', 'CZ',
  'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR',
  'HU', 'IE', 'IS', 'IT', 'JP', 'LI', 'LT', 'LU', 'LV',
  'MT', 'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SG',
  'SI', 'SK', 'US',
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

// Endonyms, not translations — a French speaker looking for German letters
// scans for "Deutsch", not "allemand".
export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'DE', label: 'Deutsch' },
  { value: 'FR', label: 'Français' },
  { value: 'ES', label: 'Español' },
  { value: 'IT', label: 'Italiano' },
];

export const LANGUAGE_LABEL: Record<Language, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.value, l.label]),
) as Record<Language, string>;

export function isSupportedCountry(code: unknown): code is SupportedCountry {
  return typeof code === 'string' && (SUPPORTED_COUNTRIES as readonly string[]).includes(code);
}

const COUNTRY_TO_JURISDICTION: Record<string, Jurisdiction> = {
  US: 'CCPA',
  GB: 'UK_GDPR',
  BR: 'LGPD',
};

export function countryToJurisdiction(code: string): Jurisdiction {
  return COUNTRY_TO_JURISDICTION[code.toUpperCase()] ?? 'GDPR';
}

const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  DE: 'DE', AT: 'DE', CH: 'DE', LI: 'DE',
  FR: 'FR', BE: 'FR', LU: 'FR',
  IT: 'IT',
  ES: 'ES',
};

export function countryToLanguage(code: string): Language {
  return COUNTRY_TO_LANGUAGE[code.toUpperCase()] ?? 'EN';
}

const EU_SET: ReadonlySet<string> = new Set(EU_REGIONS);

export function isEuCountry(code: string): boolean {
  return EU_SET.has(code.toUpperCase());
}

export const LANG_TO_BCP47: Record<string, string> = {
  EN: 'en', DE: 'de', FR: 'fr', ES: 'es', IT: 'it',
};

// Cache one DisplayNames instance per locale — construction is expensive (ICU data loading).
const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: string): Intl.DisplayNames {
  let fmt = displayNamesCache.get(locale);
  if (!fmt) {
    fmt = new Intl.DisplayNames([locale], { type: 'region' });
    displayNamesCache.set(locale, fmt);
  }
  return fmt;
}

export function getCountryName(code: string, uiLanguage: string): string {
  const locale = LANG_TO_BCP47[uiLanguage] ?? 'en';
  try {
    return getDisplayNames(locale).of(code) ?? code;
  } catch (err) {
    console.warn(`[user-country] getCountryName failed for "${code}":`, err);
    return code;
  }
}

export function getSortedCountries(uiLanguage: string): { code: string; name: string }[] {
  const locale = LANG_TO_BCP47[uiLanguage] ?? 'en';
  const fmt = getDisplayNames(locale);
  return SUPPORTED_COUNTRIES
    .map((code) => ({ code, name: fmt.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
