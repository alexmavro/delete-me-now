import { Service, UserProfile } from '../../types';
import { Translations } from '../../locales';
import { Modal } from '../ui/Modal';
import { generateEmail } from '../../templates';
import { controllerLanguage } from '../../utils/controller-language';
import { getBestEmail } from '../../utils/contacts';

interface Props {
  service: Service | null;
  profile: UserProfile;
  onClose: () => void;
  onSend: (s: Service) => void;
  t: Translations;
}

const LANG_NAMES: Record<string, string> = {
  EN: 'English', DE: 'Deutsch', FR: 'Français', ES: 'Español', IT: 'Italiano',
};

// The letter preview. This is where the tool earns its credibility — the
// user sees what will actually get sent and it has to look like a piece of
// correspondence that would survive being forwarded to a lawyer. Rendered
// on a parchment-ish elevated card against the dark canvas, set in mono
// (typewriter) with a docket code header.
export function LetterPreview({ service, profile, onClose, onSend, t }: Props) {
  if (!service) return null;

  const lang = controllerLanguage(
    service.headquarterCountry,
    profile.language,
    !!profile.alwaysWriteInMyLanguage,
  );
  const email = generateEmail(service.name, profile, {
    category: service.categories[0],
    languageOverride: lang,
  });
  const to = getBestEmail(service.contacts) ?? '—';

  const intent = profile.intent ?? 'ERASURE';
  const articleCode = intent === 'SAR' ? 'ART. 15' : 'ART. 17';
  const docket = `${profile.jurisdiction.replace('_', '-')}-${articleCode.replace(/\W/g, '').replace('ART', '')} · ${lang} · ${profile.templateStyle}`;
  const langLabel = LANG_NAMES[lang] ?? lang;
  const langNote = profile.alwaysWriteInMyLanguage
    ? t.previewLanguageOverride(langLabel)
    : service.headquarterCountry
    ? t.previewLanguageController(langLabel, service.headquarterCountry)
    : t.previewLanguageFallback(langLabel);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${service.name}: ${intent === 'SAR' ? t.previewTitleSar : t.previewTitleErasure}`}
      maxWidth="max-w-[760px]"
      overlayTone="vignette"
      closeLabel={t.previewClose}
    >
      <div className="space-y-6">
        {/* Docket header — functional metadata about the form. */}
        <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-secondary flex flex-wrap items-center gap-x-3 gap-y-2 pb-4 border-b border-rule">
          <span className="text-ink-primary">FORM {docket}</span>
          <span className="text-ink-tertiary">·</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
          <span className="text-ink-tertiary">·</span>
          <span className="text-honey">{t.previewDraftBadge}</span>
          <span className="ml-auto text-ink-secondary normal-case tracking-normal text-[14px]">{langNote}</span>
        </div>

        <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2.5 font-mono">
          <span className="text-ink-tertiary uppercase tracking-[0.14em] text-[13px]">{t.previewFieldTo}</span>
          <span className="text-ink-primary truncate text-[17px]">{to}</span>
          <span className="text-ink-tertiary uppercase tracking-[0.14em] text-[13px]">{t.previewFieldFrom}</span>
          <span className="text-ink-primary truncate text-[17px]">{profile.email || '—'}</span>
          <span className="text-ink-tertiary uppercase tracking-[0.14em] text-[13px]">{t.previewFieldSubject}</span>
          <span className="text-ink-primary font-sans text-[17px] leading-snug">{email.subject}</span>
        </div>

        {/* The letter itself — rendered on a parchment-adjacent card. */}
        <div className="bg-[#F4EFE3] text-[#1A1814] border border-rule-strong p-8 font-mono text-[15px] leading-[1.75] whitespace-pre-wrap max-h-[50vh] overflow-y-auto shadow-inner">
          {email.body}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-rule">
          {to !== '—' && (
            <button type="button"
              onClick={() => { onSend(service); onClose(); }}
              className="font-sans font-medium text-[17px] text-ink-primary border-b-2 border-honey hover:text-honey transition-colors pb-0.5 px-0.5"
            >
              {t.previewOpenInMailClient} →
            </button>
          )}
          <button type="button"
            onClick={onClose}
            className="font-sans text-[16px] text-ink-tertiary hover:text-ink-primary transition-colors ml-auto"
          >
            {t.previewClose}
          </button>
        </div>
      </div>
    </Modal>
  );
}
