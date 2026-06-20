import { Translations } from '../../locales';

interface AttestationBarProps {
  name: string;
  popupBlocked: boolean;
  onConfirm: () => void;
  onReject: () => void;
  t: Translations;
}

export function AttestationBar({ name, popupBlocked, onConfirm, onReject, t }: AttestationBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-honey-quiet border-b border-rule">
      <span className="text-[13.5px]">
        {t.attestationPrompt(name)}
        {popupBlocked && <span className="text-honey"> {t.attestationPopupHint}</span>}
      </span>
      <div className="flex-1" />
      <button className="text-[13px] text-ink-secondary hover:text-ink-primary" onClick={onReject}>{t.attestationReject}</button>
      <button className="bg-positive text-white rounded-lg px-3.5 py-1.5 text-[13px] font-medium" onClick={onConfirm}>{t.attestationConfirm}</button>
    </div>
  );
}
