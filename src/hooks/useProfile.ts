import { useState, useEffect, useCallback } from 'react';
import { UserProfile, Language, Jurisdiction, TemplateStyle, RequestIntent, Gender } from '../types';
import { storage } from '../utils/storage';
import { sanitizeHeader } from '../utils/email';

function parseLocale(): { lang: string; region: string } {
  const tag = (navigator.language || 'en').toLowerCase();
  const [lang = 'en', region = ''] = tag.split('-');
  return { lang, region };
}

function detectLanguage(): Language {
  const { lang } = parseLocale();
  const map: Record<string, Language> = { de: 'DE', fr: 'FR', es: 'ES', it: 'IT' };
  return map[lang] ?? 'EN';
}

// BCP-47 region-aware. Defaults to GDPR (most-protective) when jurisdiction
// is ambiguous; user can override. Canada uses PIPEDA-shaped GDPR, Portugal
// is GDPR (not LGPD despite Portuguese language).
function detectJurisdiction(): Jurisdiction {
  const { lang, region } = parseLocale();
  if (region === 'gb') return 'UK_GDPR';
  if (region === 'us') return 'CCPA';
  if (lang === 'pt' && region === 'br') return 'LGPD';
  return 'GDPR';
}

function makeDefaultProfile(): UserProfile {
  return {
    fullName: '',
    email: '',
    address: '',
    phone: '',
    isEuCitizen: false,
    templateStyle: 'LEGAL',
    language: detectLanguage(),
    jurisdiction: detectJurisdiction(),
    alwaysWriteInMyLanguage: false,
    intent: 'ERASURE',
    gender: 'N',
  };
}

// Free-text profile fields that flow into mail headers and .eml content.
// Any new user-entered string field MUST be added here; both parseProfile
// and setProfile run through this to block CRLF header injection.
const HEADER_BOUND_KEYS = ['fullName', 'email', 'address', 'phone'] as const;
type HeaderBoundKey = (typeof HEADER_BOUND_KEYS)[number];

function sanitizeHeaderBound(updates: Partial<UserProfile>): Partial<UserProfile> {
  const next: Partial<UserProfile> = { ...updates };
  for (const key of HEADER_BOUND_KEYS) {
    const v = updates[key];
    if (typeof v === 'string') {
      (next as Record<HeaderBoundKey, string>)[key] = sanitizeHeader(v);
    }
  }
  return next;
}

const VALID_LANGUAGES: readonly Language[] = ['EN', 'DE', 'FR', 'ES', 'IT'];
const VALID_JURISDICTIONS: readonly Jurisdiction[] = ['GDPR', 'CCPA', 'UK_GDPR', 'LGPD'];
const VALID_STYLES: readonly TemplateStyle[] = ['SIMPLE', 'LEGAL', 'AGGRESSIVE'];
const VALID_INTENTS: readonly RequestIntent[] = ['ERASURE', 'SAR'];
const VALID_GENDERS: readonly Gender[] = ['F', 'M', 'N'];

// Parse + validate stored profile. Schema drift, devtools edits, or cross-
// build corruption can smuggle bad values (missing jurisdiction, unknown
// language/style) that silently break the letter pipeline. Each field is
// coerced to a known-good value; invalid fields fall back to the default
// and are logged once so they show up in the devtools console.
function parseProfile(raw: unknown): UserProfile {
  const fallback = makeDefaultProfile();
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  const warn = (field: string, value: unknown) =>
    // eslint-disable-next-line no-console
    console.warn(`[profile] invalid ${field}=${String(value)} in stored profile; reset to default`);

  const language: Language = VALID_LANGUAGES.includes(r.language as Language)
    ? (r.language as Language)
    : (warn('language', r.language), fallback.language);
  const jurisdiction: Jurisdiction = VALID_JURISDICTIONS.includes(r.jurisdiction as Jurisdiction)
    ? (r.jurisdiction as Jurisdiction)
    : (warn('jurisdiction', r.jurisdiction), fallback.jurisdiction);
  const templateStyle: TemplateStyle = VALID_STYLES.includes(r.templateStyle as TemplateStyle)
    ? (r.templateStyle as TemplateStyle)
    : (warn('templateStyle', r.templateStyle), fallback.templateStyle);
  const intent: RequestIntent = VALID_INTENTS.includes(r.intent as RequestIntent)
    ? (r.intent as RequestIntent)
    : (r.intent == null ? 'ERASURE' : (warn('intent', r.intent), 'ERASURE'));
  const gender: Gender = VALID_GENDERS.includes(r.gender as Gender)
    ? (r.gender as Gender)
    : (r.gender == null ? 'N' : (warn('gender', r.gender), 'N'));

  const rawStrings = {
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    email: typeof r.email === 'string' ? r.email : '',
    address: typeof r.address === 'string' ? r.address : '',
    phone: typeof r.phone === 'string' ? r.phone : '',
  };
  const cleanStrings = sanitizeHeaderBound(rawStrings) as typeof rawStrings;
  return {
    ...cleanStrings,
    isEuCitizen: r.isEuCitizen === true,
    templateStyle,
    language,
    jurisdiction,
    country: typeof r.country === 'string' ? r.country : undefined,
    alwaysWriteInMyLanguage: r.alwaysWriteInMyLanguage === true,
    intent,
    gender,
  };
}

export function useProfile() {
  const [profile, setProfileRaw] = useState<UserProfile>(() => {
    const raw = storage.get<unknown>('profile');
    return raw == null ? makeDefaultProfile() : parseProfile(raw);
  });

  useEffect(() => {
    storage.set('profile', profile);
  }, [profile]);

  const setProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileRaw((prev) => ({ ...prev, ...sanitizeHeaderBound(updates) }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileRaw(makeDefaultProfile());
  }, []);

  // Pragmatic shape check; real validation is the mail server's job.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid =
    profile.fullName.trim() !== '' && EMAIL_RE.test(profile.email.trim());

  return { profile, setProfile, resetProfile, isValid };
}
