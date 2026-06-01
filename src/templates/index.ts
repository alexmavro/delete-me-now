import { UserProfile, GeneratedEmail, TemplateStyle, Jurisdiction, ServiceCategory, Language } from '../types';
import { generateGdprEmail } from './gdpr';
import { generateCcpaEmail } from './ccpa';
import { generateUkGdprEmail } from './uk-gdpr';
import { generateLgpdEmail } from './lgpd';
import { generateSarEmail } from './sar';

export { generateFollowUpEmail } from './follow-up';
export { generateDpaComplaint } from './dpa-complaint';
export { isSarSupported } from './sar';

const SPECULATIVE_CATEGORIES: ServiceCategory[] = ['Data Broker', 'Ad Tech'];

export interface GenerateOptions {
  styleOverride?: TemplateStyle;
  /** Category of the target service — used to auto-apply the speculative clause */
  category?: ServiceCategory;
  /** Override profile.language for controller-jurisdiction routing */
  languageOverride?: Language;
}

/** Extend UserProfile with internal includeSpeculative flag for templates */
type EffectiveProfile = UserProfile & { includeSpeculative: boolean };

export function generateEmail(
  serviceName: string,
  profile: UserProfile,
  options: GenerateOptions = {},
): GeneratedEmail {
  const style = options.styleOverride ?? profile.templateStyle;
  const includeSpeculative = options.category
    ? SPECULATIVE_CATEGORIES.includes(options.category)
    : false;

  const effectiveProfile: EffectiveProfile = {
    ...profile,
    includeSpeculative,
    language: options.languageOverride ?? profile.language,
  };

  // SAR (Art. 15) is a peer letter, not a style variant. It bypasses the
  // per-jurisdiction erasure generator entirely. Callers that pass intent=SAR
  // for a jurisdiction without SAR support get a loud throw — callers should
  // gate on `isSarSupported(jurisdiction)` before routing here.
  if (profile.intent === 'SAR') {
    return generateSarEmail(serviceName, effectiveProfile, profile.jurisdiction);
  }

  const generators: Record<Jurisdiction, () => GeneratedEmail> = {
    GDPR:    () => generateGdprEmail(serviceName, effectiveProfile, style),
    CCPA:    () => generateCcpaEmail(serviceName, effectiveProfile, style),
    UK_GDPR: () => generateUkGdprEmail(serviceName, effectiveProfile, style),
    LGPD:    () => generateLgpdEmail(serviceName, effectiveProfile, style),
  };
  return generators[profile.jurisdiction]();
}
