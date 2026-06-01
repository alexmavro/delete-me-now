import { DpaInfo, Language } from '../types';

// Valid UI/template languages (mirror of Language union). Used to filter
// `DpaInfo.languages` down to what the template pipeline can actually render.
const UI_LANGUAGES: readonly Language[] = ['EN', 'DE', 'FR', 'ES', 'IT'];

function isUiLanguage(code: string): code is Language {
  return (UI_LANGUAGES as readonly string[]).includes(code);
}

// Pick the letter language for a DPA complaint:
//   1. If the user's profile language is among the DPA's accepted languages, use it — most ergonomic for the user and still acceptable to the DPA.
//   2. Otherwise pick the DPA's first listed UI-supported language (usually the authority's native operating language, with EN second).
//   3. Fall back to EN if nothing matches (should be rare — most DPAs list EN).
//
// Rationale: a German-speaking user complaining to CNIL gets a French letter
// today (DPA native), but the profile-language check means a French-speaking
// user complaining to CNIL stays in French, and a user with any EN profile
// complaining to CNIL uses EN (CNIL accepts EN). Controller-language routing
// doesn't apply here — the recipient is the authority, not the controller.
export function dpaLanguage(
  dpa: DpaInfo | undefined,
  profileLanguage: Language,
): Language {
  if (!dpa) return profileLanguage;
  const accepted = dpa.languages.filter(isUiLanguage);
  if (accepted.length === 0) return 'EN';
  if (accepted.includes(profileLanguage)) return profileLanguage;
  return accepted[0];
}
