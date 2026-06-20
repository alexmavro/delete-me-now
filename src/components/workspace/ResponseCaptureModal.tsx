import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Service, ResponseStatus } from '../../types';
import { Translations } from '../../locales';

interface Props {
  isOpen: boolean;
  service: Service | null;
  onClose: () => void;
  onSubmit: (replyText: string, classification: ResponseStatus) => void;
  t: Translations;
}

export function ResponseCaptureModal({ isOpen, service, onClose, onSubmit, t }: Props) {
  const [text, setText] = useState('');
  const [classification, setClassification] = useState<ResponseStatus>('fulfilled');

  // Text resets blank on each open; pre-seeding from service.notes would
  // overwrite hand-written audit notes. Classification re-seeds from the
  // existing responseStatus so re-captures start on the right option.
  useEffect(() => {
    if (isOpen) {
      setText('');
      setClassification(service?.responseStatus ?? 'fulfilled');
    }
  }, [isOpen, service]);

  if (!service) return null;

  const submit = () => {
    onSubmit(text, classification);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.responseCaptureTitle} closeLabel={t.responseCaptureClose}>
      <div className="space-y-5 text-ink-primary">
        <p className="font-sans text-[16px] leading-relaxed text-ink-secondary">
          {t.responseCaptureBody(service.name)}
        </p>

        <fieldset>
          <legend className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-secondary mb-2">
            {t.responseCaptureClassifyLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['fulfilled', 'partial', 'refused', 'no-response'] as ResponseStatus[]).map((c) => (
              <label
                key={c}
                className={`font-sans text-[14px] px-3 py-2 border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
                  classification === c
                    ? 'border-accent bg-accent-soft/50 text-ink-primary'
                    : 'border-rule-strong text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <input
                  type="radio"
                  name="response-classification"
                  value={c}
                  checked={classification === c}
                  onChange={() => setClassification(c)}
                  className="sr-only"
                />
                {t.responseCaptureClassify[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-secondary mb-2 block">
            {t.responseCaptureNotesLabel}
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={t.responseCaptureNotesPlaceholder}
            className="w-full font-mono text-[13px] text-ink-primary bg-canvas-sunken/60 border border-rule-strong p-3 resize-y focus:outline-none focus-visible:border-accent transition-colors"
          />
          <span className="font-sans text-[13px] text-ink-tertiary mt-1.5 block">
            {t.responseCaptureNotesHint}
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-rule-soft">
          <button
            type="button"
            onClick={onClose}
            className="font-sans font-medium text-[15px] text-ink-primary border border-rule-strong hover:border-ink-primary transition-colors px-4 py-2 flex-1 min-w-[140px]"
          >
            {t.responseCaptureCancel}
          </button>
          <button
            type="button"
            onClick={submit}
            className="font-sans font-medium text-[15px] text-canvas bg-ink-primary hover:opacity-90 transition-opacity px-4 py-2 flex-1 min-w-[140px]"
          >
            {t.responseCaptureSave}
          </button>
        </div>
      </div>
    </Modal>
  );
}
