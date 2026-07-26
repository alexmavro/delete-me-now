import React, { useMemo } from 'react';
import { UserProfile, Language, Jurisdiction, TemplateStyle, RequestIntent, Gender } from '../../types';
import { Translations } from '../../locales';
import { Modal } from '../ui/Modal';
import { isSarSupported } from '../../templates';
import { JURISDICTION_LABELS } from '../../data/jurisdictions';
import { getSortedCountries, LANGUAGES, LANGUAGE_LABEL } from '../../utils/user-country';

const INPUT_CLS =
  'w-full bg-canvas border border-rule-strong px-4 py-3 text-[18px] leading-normal text-ink-primary font-sans focus:border-accent focus:bg-canvas-elevated outline-none transition-colors aria-[invalid=true]:border-critical';
const INPUT_MONO_CLS = INPUT_CLS.replace('font-sans', 'font-mono').replace('text-[18px]', 'text-[17px]');

// Mirrors the regex in useProfile; surfaces validation inline as the user types.
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
  setCountry: (code: string) => void;
  t: Translations;
}

const TEMPLATE_STYLES: { value: TemplateStyle; labelKey: keyof Translations }[] = [
  { value: 'SIMPLE',     labelKey: 'templateSimple' },
  { value: 'LEGAL',      labelKey: 'templateLegal' },
  { value: 'AGGRESSIVE', labelKey: 'templateAggressive' },
];

const JURISDICTIONS = Object.entries(JURISDICTION_LABELS) as [Jurisdiction, string][];

const SECTION_LABEL_CLS =
  'font-mono text-[14px] uppercase tracking-[0.14em] text-ink-secondary mb-4';

export function ProfilePanel({ isOpen, onClose, profile, setProfile, setCountry, t }: Props) {
  const sarAvailable = isSarSupported(profile.jurisdiction);
  const countries = useMemo(() => getSortedCountries(profile.language), [profile.language]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.profileTitle} maxWidth="max-w-[720px]" closeLabel={t.previewClose}>
      <div className="space-y-10">
        <p className="text-[17px] text-ink-secondary leading-relaxed font-sans max-w-[58ch]">
          {t.profileSubtitle}
        </p>

        {/* Country — primary selector, cascades jurisdiction + language + EU status */}
        <div className="space-y-3">
          <Field label={t.fieldWhereAreYou} note={!profile.country ? t.fieldWhereAreYouNote : undefined}>
            <select
              value={profile.country ?? ''}
              onChange={(e) => {
                if (e.target.value) setCountry(e.target.value);
                else setProfile({ country: undefined });
              }}
              className={INPUT_CLS}
            >
              <option value="">{t.fieldCountryPlaceholder}</option>
              {countries.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </Field>
          {profile.country && (
            <p className="text-[15px] text-accent font-sans">
              {t.countryDerived(
                JURISDICTION_LABELS[profile.jurisdiction] ?? profile.jurisdiction,
                LANGUAGE_LABEL[profile.language] ?? profile.language,
                profile.isEuCitizen,
              )}
            </p>
          )}
        </div>

        {/* Identity */}
        <div className="space-y-7">
          <Field label={t.fieldFullName} required>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ fullName: e.target.value })}
              placeholder={t.placeholderFullName}
              className={INPUT_CLS}
            />
          </Field>

          <Field
            label={t.fieldEmail}
            required
            note={
              profile.email && !isValidEmail(profile.email)
                ? t.fieldEmailInvalid
                : t.fieldEmailNote
            }
          >
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
              placeholder={t.placeholderEmail}
              aria-invalid={!!profile.email && !isValidEmail(profile.email)}
              className={INPUT_MONO_CLS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-6">
            <Field label={t.fieldAddress} note={t.fieldAddressNote}>
              <input
                type="text"
                value={profile.address ?? ''}
                onChange={(e) => setProfile({ address: e.target.value })}
                placeholder={t.placeholderAddress}
                className={INPUT_CLS}
              />
            </Field>
            <Field label={t.fieldPhone}>
              <input
                type="tel"
                value={profile.phone ?? ''}
                onChange={(e) => setProfile({ phone: e.target.value })}
                placeholder={t.placeholderPhone}
                className={INPUT_MONO_CLS}
              />
            </Field>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-7 pt-7 border-t border-rule">
          <div>
            <p className={SECTION_LABEL_CLS}>{t.genderLabel}</p>
            <p className="text-[15px] text-ink-secondary mt-[-0.5rem] mb-4 font-sans leading-relaxed">
              {t.genderNote}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {(['F', 'M', 'N'] as Gender[]).map((g) => {
                const labelKey: keyof Translations =
                  g === 'F' ? 'genderFeminine' : g === 'M' ? 'genderMasculine' : 'genderNonBinary';
                const active = (profile.gender ?? 'N') === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setProfile({ gender: g })}
                    aria-pressed={active}
                    className={`font-sans text-[15px] px-4 py-2.5 border transition-colors ${
                      active
                        ? 'border-accent text-accent bg-accent-soft/50'
                        : 'border-rule-strong text-ink-secondary hover:border-accent/60 hover:text-ink-primary'
                    }`}
                  >
                    {t[labelKey] as string}
                  </button>
                );
              })}
            </div>
          </div>

          <CheckboxRow
            checked={!!profile.alwaysWriteInMyLanguage}
            onChange={(v) => setProfile({ alwaysWriteInMyLanguage: v })}
            label={t.alwaysMyLanguageLabel}
            note={t.alwaysMyLanguageNote}
          />
        </div>

        {/* Advanced — jurisdiction / language / EU-citizen overrides */}
        <details className="group details-card border border-rule-strong bg-canvas-elevated max-w-full">
          <summary className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-secondary px-5 py-3 cursor-pointer flex items-center gap-2 list-none hover:text-ink-primary transition-colors motion-reduce:transition-none">
            <span aria-hidden="true" className="text-accent transition-transform motion-reduce:transition-none group-open:rotate-90 inline-block w-3">›</span>
            {t.fieldAdvanced}
          </summary>
          <div className="px-5 pt-1 pb-5 space-y-6">
            <p className="text-[14px] text-ink-tertiary font-sans">{t.fieldAdvancedNote}</p>
            <div className="grid grid-cols-2 gap-6">
              <Field label={t.fieldJurisdiction}>
                <select
                  value={profile.jurisdiction}
                  onChange={(e) => setProfile({ jurisdiction: e.target.value as Jurisdiction })}
                  className={INPUT_CLS}
                >
                  {JURISDICTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label={t.fieldLanguage}>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ language: e.target.value as Language })}
                  className={INPUT_CLS}
                >
                  {LANGUAGES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <CheckboxRow
              checked={profile.isEuCitizen}
              onChange={(v) => setProfile({ isEuCitizen: v })}
              label={t.euCitizenLabel}
              note={t.euCitizenNote}
            />
          </div>
        </details>

        {/* Intent */}
        <div className="pt-7 border-t border-rule">
          <p className={SECTION_LABEL_CLS}>{t.intentLabel}</p>
          <div className="grid grid-cols-2 gap-4">
            {([
              { v: 'ERASURE' as RequestIntent, label: t.intentErasureLabel, note: t.intentErasureNote, disabled: false },
              { v: 'SAR' as RequestIntent, label: t.intentSarLabel, note: t.intentSarNote, disabled: !sarAvailable },
            ]).map(({ v, label, note, disabled }) => {
              const active = profile.intent === v;
              return (
                <label
                  key={v}
                  className={`block p-5 border cursor-pointer transition-colors ${
                    disabled
                      ? 'border-rule-soft bg-canvas-sunken opacity-40 cursor-not-allowed'
                      : active
                      ? 'border-accent bg-accent-soft/50'
                      : 'border-rule-strong hover:border-accent/60 hover:bg-canvas'
                  }`}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={v}
                    checked={active}
                    disabled={disabled}
                    onChange={() => !disabled && setProfile({ intent: v })}
                    className="sr-only"
                  />
                  <p className="font-display text-[20px] text-ink-primary leading-snug">
                    {label}
                  </p>
                  <p className={`text-[16px] mt-2 leading-relaxed font-sans ${active ? 'text-ink-secondary' : 'text-ink-tertiary'}`}>
                    {disabled ? t.intentSarUnavailable : note}
                  </p>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tone — hidden for SAR (sar.ts ignores templateStyle, so the
            control would be a lie). Re-renders when intent changes. */}
        {profile.intent !== 'SAR' && (
          <div className="pt-7 border-t border-rule">
            <p className={SECTION_LABEL_CLS}>{t.templateStyleLabel}</p>
            <div className="flex flex-wrap gap-2.5">
              {TEMPLATE_STYLES.map(({ value, labelKey }) => (
                <button type="button"
                  key={value}
                  onClick={() => setProfile({ templateStyle: value })}
                  className={`font-mono text-[14px] uppercase tracking-[0.14em] px-4 py-2.5 border transition-colors ${
                    profile.templateStyle === value
                      ? 'border-accent text-accent bg-accent-soft/50'
                      : 'border-rule-strong text-ink-secondary hover:border-accent/60 hover:text-ink-primary'
                  }`}
                >
                  {t[labelKey] as string}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Where the info entered here is stored. Lives at the bottom as a
            calm reassurance, collapsed by default. <details> stays keyboard +
            screen-reader accessible without extra JS. */}
        <details className="group details-card border border-rule-strong bg-canvas-elevated max-w-[58ch]">
          <summary className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-secondary px-5 py-3 cursor-pointer flex items-center gap-2 list-none hover:text-ink-primary transition-colors motion-reduce:transition-none">
            <span aria-hidden="true" className="text-accent transition-transform motion-reduce:transition-none group-open:rotate-90 inline-block w-3">›</span>
            {t.dataStorageTitle}
          </summary>
          <div className="px-5 pt-1 pb-4 text-[15px] font-sans leading-relaxed">
            <p className="text-ink-primary mb-2">{t.dataStorageBody1}</p>
            <p className="text-ink-secondary">{t.dataStorageBody2}</p>
          </div>
        </details>

        <div className="flex justify-end pt-7 border-t border-rule">
          <button type="button"
            onClick={onClose}
            className="font-sans font-medium text-[17px] text-ink-primary border-b-2 border-accent hover:text-accent transition-colors pb-1 px-1"
          >
            {t.profileDone} →
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  note,
  required,
  children,
}: {
  label: string;
  note?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[14px] uppercase tracking-[0.14em] text-ink-secondary mb-3">
        {label}
        {required && <span className="text-accent ml-1.5 normal-case">*</span>}
      </span>
      {children}
      {note && (
        <span className="block text-[15px] text-ink-secondary mt-2 font-sans leading-relaxed">
          {note}
        </span>
      )}
    </label>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note: string;
}) {
  return (
    <label className="flex items-start gap-3.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 shrink-0 accent-accent w-[18px] h-[18px]"
      />
      <span className="font-sans leading-relaxed">
        <span className="block text-[17px] text-ink-primary">{label}</span>
        <span className="block text-[15px] text-ink-secondary mt-1">{note}</span>
      </span>
    </label>
  );
}
