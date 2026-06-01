import { useEffect, useMemo, useRef, useState } from 'react';
import { Service } from '../../types';
import { Translations } from '../../locales';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selected: Service[];
  unselected: Service[];
  onJumpToCaseFile: (id: string) => void;
  onAddToCaseFile: (id: string) => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  t: Translations;
}

type Item =
  | { kind: 'action'; id: string; label: string; hint: string; run: () => void }
  | { kind: 'service-selected'; id: string; label: string; hint: string; run: () => void }
  | { kind: 'service-add'; id: string; label: string; hint: string; run: () => void };

export function CommandPalette({
  isOpen,
  onClose,
  selected,
  unselected,
  onJumpToCaseFile,
  onAddToCaseFile,
  onOpenProfile,
  onToggleTheme,
  theme,
  t,
}: Props) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Reset query + cursor each time the palette opens. Capture previously-focused
  // element so we can restore focus on close (mirrors Modal.tsx pattern).
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setCursor(0);
      // Defer to RAF so input is mounted before focus.
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => {
        cancelAnimationFrame(raf);
        // Restore focus only if no action moved focus elsewhere (e.g. jump-to
        // entry placed focus on a case-file article). If activeElement is body,
        // nothing else has claimed focus and we can return it to the trigger.
        if (document.activeElement === document.body) {
          previouslyFocused.current?.focus?.();
        }
      };
    }
    return undefined;
  }, [isOpen]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (s: Service) =>
      !q || s.name.toLowerCase().includes(q) || (s.headquarterCountry?.toLowerCase().includes(q) ?? false);

    const actions: Item[] = [
      {
        kind: 'action',
        id: 'open-profile',
        label: t.paletteActionOpenProfile,
        hint: t.paletteActionOpenProfileHint,
        run: () => {
          onClose();
          onOpenProfile();
        },
      },
      {
        kind: 'action',
        id: 'toggle-theme',
        label: theme === 'dark' ? t.paletteActionLightTheme : t.paletteActionDarkTheme,
        hint: t.paletteActionThemeHint,
        run: () => {
          onToggleTheme();
          onClose();
        },
      },
    ];

    const inCase: Item[] = selected
      .filter(matches)
      .slice(0, 8)
      .map((s) => ({
        kind: 'service-selected',
        id: s.id,
        label: s.name,
        hint: t.paletteJumpToHint,
        run: () => {
          onJumpToCaseFile(s.id);
          onClose();
        },
      }));

    const addable: Item[] = unselected
      .filter(matches)
      .slice(0, 8)
      .map((s) => ({
        kind: 'service-add',
        id: s.id,
        label: s.name,
        hint: t.paletteAddToCaseFileHint,
        run: () => {
          onAddToCaseFile(s.id);
          onClose();
        },
      }));

    if (q) return [...inCase, ...addable, ...actions.filter((a) => a.label.toLowerCase().includes(q))];
    return [...actions, ...inCase, ...addable];
  }, [query, selected, unselected, theme, t, onClose, onJumpToCaseFile, onAddToCaseFile, onOpenProfile, onToggleTheme]);

  // Keep cursor inside bounds when items change.
  useEffect(() => {
    if (cursor >= items.length) setCursor(Math.max(0, items.length - 1));
  }, [items.length, cursor]);

  // Scroll active item into view.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!isOpen) return null;

  // Mac shows the command symbol; everywhere else, Ctrl. Done at render so
  // the right glyph appears for the user's actual platform.
  // navigator.platform is deprecated; prefer userAgentData when available,
  // fall back to platform-string only as a last resort.
  const isMac = (() => {
    if (typeof navigator === 'undefined') return false;
    const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
    if (uad?.platform) return /mac/i.test(uad.platform);
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || '');
  })();
  const shortcutGlyph = isMac ? '⌘K' : 'Ctrl K';

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(items.length - 1, c + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setCursor(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setCursor(Math.max(0, items.length - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[cursor];
      if (item) item.run();
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-canvas-sunken/85 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.paletteTitle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="bg-canvas-elevated border border-rule-strong w-full max-w-[640px] flex flex-col shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] animate-rise-in"
      >
        <div className="border-b border-rule px-5 py-4 flex items-center gap-3">
          <span aria-hidden="true" className="font-mono text-[14px] text-ink-tertiary uppercase tracking-[0.14em]">
            {shortcutGlyph}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder={t.palettePlaceholder}
            className="flex-1 bg-transparent border-0 text-[18px] text-ink-primary placeholder:text-ink-tertiary outline-none font-sans"
            aria-label={t.paletteTitle}
          />
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-6 text-[15px] text-ink-secondary font-sans">{t.paletteEmpty}</p>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            aria-label={t.paletteTitle}
            className="max-h-[60vh] overflow-y-auto py-2"
          >
            {items.map((item, idx) => {
              const active = idx === cursor;
              const tag =
                item.kind === 'action'
                  ? t.paletteTagAction
                  : item.kind === 'service-selected'
                  ? t.paletteTagJump
                  : t.paletteTagAdd;
              return (
                <li
                  key={`${item.kind}:${item.id}`}
                  data-index={idx}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => item.run()}
                  className={`px-5 py-2.5 flex items-baseline gap-3 cursor-pointer ${
                    active ? 'bg-canvas-sunken' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] w-12 shrink-0 ${
                      active ? 'text-honey' : 'text-ink-tertiary'
                    }`}
                  >
                    {tag}
                  </span>
                  <span className="font-sans text-[16px] text-ink-primary flex-1 truncate">{item.label}</span>
                  <span className="font-mono text-[12px] text-ink-tertiary shrink-0">{item.hint}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-rule px-5 py-2.5 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.14em] text-ink-tertiary">
          <span>{t.paletteFootHint}</span>
          <span>esc {t.paletteFootClose}</span>
        </div>
      </div>
    </div>
  );
}
