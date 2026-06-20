import React, { useEffect, useRef } from 'react';

// Module-level stack of currently-open modal refs. Only the top entry
// owns keyboard handling so two stacked modals don't both eat Escape.
const MODAL_STACK: React.MutableRefObject<HTMLDivElement | null>[] = [];

export function isAnyModalOpen(): boolean {
  return MODAL_STACK.length > 0;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-[720px]"
  overlayTone?: 'dark' | 'vignette';
  closeLabel?: string;
}

// WCAG 2.1 SC 2.4.3 focus-trapped modal. Tab/Shift+Tab contained; focus
// restored on close; Escape and click-outside both dismiss.
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-[720px]',
  overlayTone = 'dark',
  closeLabel = 'Close',
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Stash the latest onClose in a ref so the effect doesn't re-run on every
  // parent render. Otherwise an inline `onClose` from App.tsx is a fresh
  // reference each render, the effect tears down + remounts on every keystroke
  // (because setProfile triggers App re-render), and focus snaps back to
  // the close button mid-typing. WCAG-compliant focus-trap with a kill bug.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    MODAL_STACK.push(containerRef);

    // Defer to requestAnimationFrame so focus lands after React commit + layout,
    // avoiding the collectFocusables offsetParent edge case where css hasn't
    // flushed yet.
    const raf = requestAnimationFrame(() => {
      const focusables = collectFocusables(containerRef.current);
      (focusables[0] ?? containerRef.current)?.focus();
    });

    const isTopmost = () => MODAL_STACK[MODAL_STACK.length - 1] === containerRef;

    const handleKey = (e: KeyboardEvent) => {
      // Only the top-most open modal handles the keys. Stacked modals
      // (e.g. ProfilePanel on top of LetterPreview) would otherwise have
      // both Escape handlers fire at once.
      if (!isTopmost()) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = collectFocusables(containerRef.current);
      if (focusables.length === 0) {
        e.preventDefault();
        containerRef.current?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !containerRef.current?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKey);
      const idx = MODAL_STACK.indexOf(containerRef);
      if (idx !== -1) MODAL_STACK.splice(idx, 1);
      // Restore focus to the element that opened the modal.
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayCls =
    overlayTone === 'vignette'
      ? 'bg-canvas/90 backdrop-blur-[2px]'
      : 'bg-canvas-sunken/85 backdrop-blur-[2px]';
  const overlayTopPad = overlayTone === 'vignette' ? 'pt-[3vh] md:pt-[6vh]' : 'pt-[4vh] md:pt-[8vh]';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center ${overlayTopPad} px-4 ${overlayCls} animate-fade-in`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`bg-canvas-elevated border border-rule-strong w-full ${maxWidth} max-h-[88vh] flex flex-col shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] animate-rise-in outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 md:px-8 pt-5 md:pt-7 pb-4 md:pb-5 border-b border-rule">
          <h3 className="font-display text-[22px] md:text-[26px] text-ink-primary leading-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="font-sans text-[26px] md:text-[30px] text-ink-secondary hover:text-ink-primary leading-none w-9 h-9 md:w-10 md:h-10 flex items-center justify-center transition-colors shrink-0"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-7 min-h-0">{children}</div>
      </div>
    </div>
  );
}

function collectFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const sel =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
  );
}
