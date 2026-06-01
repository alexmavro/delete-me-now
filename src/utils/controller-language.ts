import { Language } from '../types';

// ISO-3166 alpha-2 country → letter language. Only controller HQs that map
// to one of our five UI locales (EN/DE/FR/ES/IT) are listed; all others
// fall through to the user's profile language.
//
// BE is mixed Dutch/French/German; FR is the default first pass, matching the
// official corporate register in Wallonia/Brussels, not Flanders. Per-service
// override is a future enhancement.
//
// Anglophone HQs map explicitly to EN so a French or Italian user doesn't
// send French/Italian letters to Meta, Google, Microsoft, etc. — which are
// the dataset's highest-volume targets. Without this, the profile-language
// fallback would produce wrong-register letters for the bulk of the queue.
const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  DE: 'DE', AT: 'DE', CH: 'DE', LI: 'DE',
  FR: 'FR', BE: 'FR', LU: 'FR', MC: 'FR',
  IT: 'IT', SM: 'IT', VA: 'IT',
  ES: 'ES',
  US: 'EN', GB: 'EN', IE: 'EN', CA: 'EN', AU: 'EN',
  NZ: 'EN', IN: 'EN', SG: 'EN', ZA: 'EN', MT: 'EN',
};

export function controllerLanguage(
  headquarterCountry: string | undefined,
  profileLanguage: Language,
  alwaysWriteInMyLanguage: boolean,
): Language {
  if (alwaysWriteInMyLanguage) return profileLanguage;
  if (!headquarterCountry) return profileLanguage;
  const code = headquarterCountry.trim().toUpperCase();
  if (!code) return profileLanguage;
  return COUNTRY_TO_LANGUAGE[code] ?? profileLanguage;
}
