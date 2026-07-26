import { useEffect, useMemo, useState } from 'react';
import {
  Service,
  ServiceCategory,
  SmartPack,
  ServiceFilter,
  UserProfile,
  Region,
} from '../../types';
import { Translations } from '../../locales/en';
import { Modal } from '../ui/Modal';
import { INTENT_PACKS, SMART_PACKS, JURISDICTION_LABELS } from '../../data/jurisdictions';
import { CATEGORY_TOOLTIPS } from '../../utils/category-tooltips';
import { getSortedCountries, LANGUAGE_LABEL } from '../../utils/user-country';

const ALL_PACKS: SmartPack[] = [...INTENT_PACKS, ...SMART_PACKS];

// Offered as region choices. The full Region union includes every EU member
// state, which is a 30-entry dropdown nobody reads; these are the ones with
// enough rows behind them to be worth narrowing by.
const REGION_CHOICES: Region[] = ['EU', 'DE', 'AT', 'CH', 'UK', 'US', 'FR', 'IT', 'ES', 'NL'];

const SAMPLE_SIZE = 8;

const INPUT_CLS =
  'w-full bg-canvas border border-rule-strong rounded-[9px] px-3 py-2 text-[14px] outline-none focus:border-accent transition-colors';

interface SelectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  filter: ServiceFilter;
  setFilter: (updates: Partial<ServiceFilter>) => void;
  resetFilter: () => void;
  /** Rows matching the live filter that the user has not already added. */
  candidates: Service[];
  selectMany: (ids: readonly string[]) => number;
  profile: UserProfile;
  setCountry: (code: string) => void;
  onDone: (added: number) => void;
  t: Translations;
}

export function SelectionWizard({
  isOpen,
  onClose,
  services,
  filter,
  setFilter,
  resetFilter,
  candidates,
  selectMany,
  profile,
  setCountry,
  onDone,
  t,
}: SelectionWizardProps) {
  const [packId, setPackId] = useState<string | null>(null);
  // Asking someone their country twice is worse than not asking, so the step
  // only exists for people who haven't already answered it in their profile.
  const needsCountry = !profile.country;
  const steps = needsCountry ? ['country', 'goal', 'refine', 'review'] : ['goal', 'refine', 'review'];
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const pack = packId ? ALL_PACKS.find((p) => p.id === packId) : undefined;

  // Browse hides brokers and ad-tech behind the default breadth, on the view
  // that writing to a company you have no account with is speculative. Picking
  // a pack called "Data brokers" IS that opt-in, so the wizard shows the full
  // set — otherwise the card advertises 631 and the review hands back 37.
  useEffect(() => {
    if (isOpen) setFilter({ breadthMode: 'speculative' });
  }, [isOpen, setFilter]);

  const packCounts = useMemo(() => {
    const out: Record<string, number> = {};
    // Counted over unselected rows only, so the number matches what pressing
    // the card would actually add rather than including rows already on the list.
    for (const p of ALL_PACKS) out[p.id] = services.filter((s) => !s.selected && p.match(s)).length;
    return out;
  }, [services]);

  const preview = useMemo(
    () => (pack ? candidates.filter(pack.match) : candidates),
    [candidates, pack],
  );

  const publicBodyCount = useMemo(
    () => preview.filter((s) => s.categories.includes('Public Body')).length,
    [preview],
  );
  const needsIdCount = useMemo(() => preview.filter((s) => s.needsIdDocument).length, [preview]);

  const categoriesInUse = useMemo(() => {
    const seen = new Set<ServiceCategory>();
    for (const s of services) for (const c of s.categories) seen.add(c);
    return [...seen].sort();
  }, [services]);

  const close = () => {
    resetFilter();
    setPackId(null);
    setStepIndex(0);
    onClose();
  };

  const commit = () => {
    const added = selectMany(preview.map((s) => s.id));
    resetFilter();
    setPackId(null);
    setStepIndex(0);
    onDone(added);
  };

  const canAdvance = step === 'country' ? !!profile.country : step === 'goal' ? !!packId : true;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t.wizardTitle}
      maxWidth="max-w-[680px]"
      closeLabel={t.wizardCancel}
    >
      <p className="text-[12.5px] uppercase tracking-[0.08em] text-ink-tertiary mb-4">
        {t.wizardStepOf(stepIndex + 1, steps.length)}
      </p>

      {step === 'country' && (
        <section className="space-y-3">
          <h3 className="text-[17px] font-semibold">{t.wizardCountryTitle}</h3>
          <p className="text-[14px] text-ink-secondary">{t.wizardCountryBody}</p>
          <select
            value={profile.country ?? ''}
            onChange={(e) => e.target.value && setCountry(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">{t.fieldCountryPlaceholder}</option>
            {getSortedCountries(profile.language).map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          {profile.country && (
            <p className="text-[14px] text-accent">
              {t.countryDerived(
                JURISDICTION_LABELS[profile.jurisdiction] ?? profile.jurisdiction,
                LANGUAGE_LABEL[profile.language] ?? profile.language,
                profile.isEuCitizen,
              )}
            </p>
          )}
        </section>
      )}

      {step === 'goal' && (
        <section className="space-y-3">
          <h3 className="text-[17px] font-semibold">{t.wizardGoalTitle}</h3>
          <p className="text-[14px] text-ink-secondary">{t.wizardGoalBody}</p>
          <ul className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
            {ALL_PACKS.map((p) => {
              const active = p.id === packId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPackId(p.id)}
                    className={`w-full text-left rounded-[10px] border p-3 transition-colors ${
                      active
                        ? 'border-accent bg-accent/5'
                        : 'border-rule-strong hover:border-ink-tertiary'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[14.5px] font-medium">{t.packCopy[p.id].label}</span>
                      <span className="text-[12.5px] text-ink-tertiary shrink-0">
                        {t.wizardGoalCount(packCounts[p.id] ?? 0)}
                      </span>
                    </span>
                    <span className="block text-[13px] text-ink-secondary mt-1">
                      {t.packCopy[p.id].body}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 'refine' && (
        <section className="space-y-4">
          <h3 className="text-[17px] font-semibold">{t.wizardRefineTitle}</h3>
          <p className="text-[14px] text-ink-secondary">{t.wizardRefineBody}</p>

          <label className="block space-y-1">
            <span className="text-[13px] text-ink-secondary">{t.wizardRefineCategory}</span>
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter({ category: e.target.value as ServiceFilter['category'] })
              }
              className={INPUT_CLS}
            >
              <option value="All">{t.wizardRefineAny}</option>
              {categoriesInUse.map((c) => (
                <option key={c} value={c} title={CATEGORY_TOOLTIPS[c]}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[13px] text-ink-secondary">{t.wizardRefineRegion}</span>
            <select
              value={filter.region}
              onChange={(e) => setFilter({ region: e.target.value as ServiceFilter['region'] })}
              className={INPUT_CLS}
            >
              <option value="All">{t.wizardRefineAny}</option>
              {REGION_CHOICES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex gap-2.5 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={filter.contactAvailability === 'has-dpo'}
              onChange={(e) =>
                setFilter({ contactAvailability: e.target.checked ? 'has-dpo' : 'Any' })
              }
              className="mt-1 accent-accent"
            />
            <span>
              <span className="block text-[14px]">{t.wizardRefineDpoOnly}</span>
              <span className="block text-[12.5px] text-ink-tertiary">{t.wizardRefineDpoNote}</span>
            </span>
          </label>

          <label className="flex gap-2.5 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={filter.confidenceTiers.includes('Verified')}
              onChange={(e) => setFilter({ confidenceTiers: e.target.checked ? ['Verified'] : [] })}
              className="mt-1 accent-accent"
            />
            <span>
              <span className="block text-[14px]">{t.wizardRefineVerifiedOnly}</span>
              <span className="block text-[12.5px] text-ink-tertiary">
                {t.wizardRefineVerifiedNote}
              </span>
            </span>
          </label>
        </section>
      )}

      {step === 'review' && (
        <section className="space-y-3">
          <h3 className="text-[17px] font-semibold">{t.wizardReviewTitle}</h3>
          {preview.length === 0 ? (
            <p className="text-[14px] text-ink-secondary">{t.wizardReviewEmpty}</p>
          ) : (
            <>
              <p className="text-[14px] text-ink-secondary">{t.wizardReviewSample}</p>
              <ul className="space-y-1">
                {preview.slice(0, SAMPLE_SIZE).map((s) => (
                  <li key={s.id} className="text-[14px] flex items-baseline gap-2">
                    <span>{s.name}</span>
                    <span className="text-[12px] text-ink-tertiary">{s.categories[0]}</span>
                  </li>
                ))}
              </ul>
              {preview.length > SAMPLE_SIZE && (
                <p className="text-[13px] text-ink-tertiary">
                  {t.wizardReviewMore(preview.length - SAMPLE_SIZE)}
                </p>
              )}
              {publicBodyCount > 0 && (
                <p className="text-[13px] text-ink-secondary border-l-2 border-rule-strong pl-3">
                  {t.wizardPublicBodyWarning}
                </p>
              )}
              {needsIdCount > 0 && (
                <p className="text-[13px] text-ink-tertiary">{t.wizardIdWarning(needsIdCount)}</p>
              )}
            </>
          )}
        </section>
      )}

      <div className="flex items-center gap-2 pt-5 mt-5 border-t border-rule">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            className="text-[14px] rounded-[9px] px-3.5 py-2 border border-rule-strong text-ink-secondary hover:border-ink-tertiary transition-colors"
          >
            {t.wizardBack}
          </button>
        )}
        <div className="flex-1" />
        {step === 'review' ? (
          <button
            type="button"
            disabled={preview.length === 0}
            onClick={commit}
            className="text-[14px] rounded-[9px] px-4 py-2 bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.wizardCommit(preview.length)}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStepIndex((i) => i + 1)}
            className="text-[14px] rounded-[9px] px-4 py-2 bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.wizardNext}
          </button>
        )}
      </div>
    </Modal>
  );
}
