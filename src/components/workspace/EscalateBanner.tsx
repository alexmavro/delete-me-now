import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Service, GeneratedEmail } from '../../types';
import { Translations } from '../../locales';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  complaint: GeneratedEmail | null;
  dpaUrl: string | null;
  // True when window.open / anchor.click threw on the mailto: or DPA URL
  // handoff (sandboxed iframe contexts). Drives the inline "didn't open"
  // recovery hints in the banner.
  mailtoFailed: boolean;
  dpaFailed: boolean;
  onConfirm: () => void;
  t: Translations;
}

// Escalation handoff banner. Browsers commonly block mailto: + the
// secondary https window.open in the same gesture; the old auto-mark
// path silently lied to the user when both popups failed. This modal
// stages the complaint text + DPA URL as copyable strings and only
// marks the service ESCALATED when the user explicitly confirms — the
// click on "Mark as filed" is the attestation, not the popup.
export function EscalateBanner({
  isOpen,
  onClose,
  service,
  complaint,
  dpaUrl,
  mailtoFailed,
  dpaFailed,
  onConfirm,
  t,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<'mailto' | 'dpa' | null>(null);
  // copyFailedKey is sticky until the next attempt — silent re-clicks were
  // the failure mode we're closing.
  const [copyFailedKey, setCopyFailedKey] = useState<'mailto' | 'dpa' | null>(null);

  if (!service || !complaint) return null;

  const draftText = `Subject: ${complaint.subject}\n\n${complaint.body}`;

  const copy = async (text: string, key: 'mailto' | 'dpa') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailedKey(null);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch (err) {
      // Insecure context (HTTP), permissions denial, or no clipboard API.
      // Surface so the user knows to select-and-copy manually.
      console.warn('EscalateBanner: clipboard write failed', err);
      setCopiedKey(null);
      setCopyFailedKey(key);
    }
  };

  // DPA section comes FIRST: the user already has the draft (we generated
  // it from their context), so the DPA URL is the new artifact this modal
  // exists to surface. Visual order matches action order.
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.escalateBlockedTitle} closeLabel={t.escalateBlockedClose}>
      <div className="space-y-5 text-ink-primary">
        <p className="font-sans text-[16px] leading-relaxed text-ink-secondary">
          {t.escalateBlockedBody(service.name)}
        </p>

        {dpaUrl && (
          <section>
            <header className="flex items-baseline gap-3 mb-2">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-secondary">
                {t.escalateBlockedDpaLabel}
              </h3>
              <button
                type="button"
                onClick={() => copy(dpaUrl, 'dpa')}
                className="ml-auto font-sans font-medium text-[14px] text-ink-primary border-b border-honey hover:text-honey transition-colors"
              >
                {copiedKey === 'dpa' ? t.escalateBlockedCopied : t.escalateBlockedCopyDpa}
              </button>
            </header>
            <p className="font-mono text-[13px] text-ink-secondary bg-canvas-sunken/60 border border-rule p-3 break-all">
              <a href={dpaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-honey">
                {dpaUrl}
              </a>
            </p>
            {dpaFailed && (
              <p role="alert" className="font-sans text-[13px] text-critical mt-1.5 leading-snug">
                {t.escalateBlockedDpaFailed}
              </p>
            )}
            {copyFailedKey === 'dpa' && (
              <p role="alert" className="font-sans text-[13px] text-critical mt-1.5 leading-snug">
                {t.escalateBlockedCopyFailed}
              </p>
            )}
          </section>
        )}

        <section>
          <header className="flex items-baseline gap-3 mb-2">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-secondary">
              {t.escalateBlockedDraftLabel}
            </h3>
            <button
              type="button"
              onClick={() => copy(draftText, 'mailto')}
              className="ml-auto font-sans font-medium text-[14px] text-ink-primary border-b border-honey hover:text-honey transition-colors"
            >
              {copiedKey === 'mailto' ? t.escalateBlockedCopied : t.escalateBlockedCopyDraft}
            </button>
          </header>
          {/* tabIndex=0 + aria-label so keyboard / SR users can focus the
              draft block to read or select-all manually if clipboard
              fails. Kept as <pre> to preserve template line wrapping. */}
          <pre
            tabIndex={0}
            aria-label={t.escalateBlockedDraftLabel}
            className="font-mono text-[13px] text-ink-secondary bg-canvas-sunken/60 border border-rule p-3 max-h-[180px] overflow-auto whitespace-pre-wrap break-words focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey focus-visible:outline-offset-2"
          >{draftText}</pre>
          {mailtoFailed && (
            <p role="alert" className="font-sans text-[13px] text-critical mt-1.5 leading-snug">
              {t.escalateBlockedMailtoFailed}
            </p>
          )}
          {copyFailedKey === 'mailto' && (
            <p role="alert" className="font-sans text-[13px] text-critical mt-1.5 leading-snug">
              {t.escalateBlockedCopyFailed}
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-rule-soft">
          <button
            type="button"
            onClick={onClose}
            className="font-sans font-medium text-[15px] text-ink-primary border border-rule-strong hover:border-ink-primary transition-colors px-4 py-2 flex-1 min-w-[140px]"
          >
            {t.escalateBlockedNotYet}
          </button>
          {/* Confirm uses ink-primary, not critical: this is a constructive
              "I sent it" attestation, not a destructive action. Reserve red
              for genuine errors and irreversible deletes. */}
          <button
            type="button"
            onClick={onConfirm}
            className="font-sans font-medium text-[15px] text-canvas bg-ink-primary hover:opacity-90 transition-opacity px-4 py-2 flex-1 min-w-[140px]"
          >
            {t.escalateBlockedConfirm}
          </button>
        </div>
      </div>
    </Modal>
  );
}
