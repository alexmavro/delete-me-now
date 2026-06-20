import { useNetworkActivity } from '../../hooks/useNetworkActivity';
import { Translations } from '../../locales';

interface Props {
  t: Translations;
  datasetVerifiedAt?: string;
}

export function Footer({ t, datasetVerifiedAt }: Props) {
  const { outbound } = useNetworkActivity();

  return (
    <footer className="border-t border-rule mt-auto">
      <div className="max-w-[1440px] mx-auto px-7 py-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-ink-secondary font-sans">
        <span className="flex items-center gap-2.5" aria-live="polite">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              outbound === 0 ? 'bg-positive' : 'bg-critical'
            }`}
            aria-hidden="true"
          />
          <span>
            {t.footerLocalOnly} <span className="font-mono text-ink-primary tabular-nums">{outbound}</span> {t.footerCallsLabel}
          </span>
        </span>
        <span className="text-ink-tertiary hidden sm:inline">·</span>
        <span className="text-ink-tertiary">
          {t.footerVerifyHint}
        </span>
        {datasetVerifiedAt && (
          <>
            <span className="text-ink-tertiary hidden sm:inline">·</span>
            <span className="text-ink-tertiary">
              {t.footerDatasetVerified(datasetVerifiedAt.slice(0, 10))}
            </span>
          </>
        )}
        <span className="ml-auto text-ink-tertiary font-mono text-[14px] tracking-[0.14em]">
          Open source
        </span>
      </div>
    </footer>
  );
}
