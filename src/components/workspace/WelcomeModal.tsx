import { useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function focusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  ).filter((el) => el.offsetParent !== null);
}

// First-run welcome dialog. Focus-trapped (WCAG 2.4.3): initial focus inside,
// Tab/Shift+Tab contained, focus restored on close.
export function WelcomeModal({ isOpen, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    prevFocused.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const f = focusables(containerRef.current);
      (f[0] ?? containerRef.current)?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(containerRef.current);
      if (f.length === 0) { e.preventDefault(); containerRef.current?.focus(); return; }
      const first = f[0], last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !containerRef.current?.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      prevFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-canvas-sunken/80 backdrop-blur-[3px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-[min(580px,92vw)] bg-canvas-elevated border border-rule-strong rounded-[20px] shadow-card p-9 animate-rise-in outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-ink-tertiary hover:bg-canvas-sunken hover:text-ink-primary"
        >✕</button>

        <div className="grid sm:grid-cols-[168px_1fr] gap-6 items-center">
          <svg viewBox="0 0 240 214" className="w-[150px] sm:w-[168px] mx-auto text-ink-primary" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 200 H118" opacity=".35" />
            <path d="M66 138 L52 198 M66 138 L84 198" />
            <path d="M66 138 V84" />
            <path d="M66 96 L50 128" />
            <path d="M66 96 H132" />
            <circle cx="66" cy="64" r="18" />
            <circle cx="60" cy="63" r="1.9" fill="currentColor" stroke="none" />
            <circle cx="72" cy="63" r="1.9" fill="currentColor" stroke="none" />
            <path d="M60 73 H72" strokeWidth="3" />
            <path d="M46 60 a20 15 0 0 1 40 0 Z" fill="currentColor" stroke="none" />
            <path d="M42 60 H90" />
            <path d="M132 120 V198" strokeWidth="5" />
            <g transform="translate(101 53) scale(0.62)">
              <polygon points="33,4.5 67,4.5 95.5,33 95.5,67 67,95.5 33,95.5 4.5,67 4.5,33" fill="#0d9488" stroke="#0b0e12" strokeWidth="5" strokeLinejoin="round" />
              <g fill="#0b0e12" stroke="none">
                <rect x="31" y="33" width="8.5" height="29" rx="4.25" /><rect x="41" y="28" width="8.5" height="34" rx="4.25" /><rect x="51" y="31" width="8.5" height="31" rx="4.25" /><rect x="61" y="36" width="8.5" height="26" rx="4.25" /><rect x="28.5" y="50" width="43" height="30" rx="12" /><rect x="19" y="52" width="9" height="25" rx="4.5" transform="rotate(-33 23.5 64.5)" />
              </g>
            </g>
          </svg>

          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-accent mb-2.5">Welcome</div>
            <h2 className="font-display text-[25px] leading-[1.1] mb-2.5">Let's make them<br />forget you.</h2>
            <p className="text-[14.5px] text-ink-secondary leading-relaxed">Pick the companies hoarding your data. We draft the legal deletion letters. You send.</p>
            <p className="text-[13px] text-ink-tertiary mt-1.5">No account, no server — it all stays in this browser.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-[9px] px-4 py-2.5 text-[14px] font-medium transition-colors"
            >
              Get started →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
