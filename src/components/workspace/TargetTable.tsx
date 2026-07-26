import { ReactNode } from 'react';
import { Service, ServiceCategory } from '../../types';
import { Translations } from '../../locales/en';
import { statusMeta, TONE_DOT } from '../../utils/status-display';
import { CATEGORY_TOOLTIPS } from '../../utils/category-tooltips';

interface Props {
  rows: Service[];
  mode: 'browse' | 'manage';
  onToggle: (id: string) => void;
  onPreview: (s: Service) => void;
  // Manage mode: the right-aligned per-row action (Send / Follow up / ...).
  renderAction?: (s: Service) => ReactNode;
  cap?: number;
  /** Raise the cap. Absent means the cap is a hard ceiling. */
  onShowMore?: () => void;
  /** Add every currently-rendered row in one go. */
  onSelectShown?: () => void;
  empty: ReactNode;
  t: Translations;
}

function CategoryChip({ category }: { category?: ServiceCategory }) {
  if (!category) return <span>—</span>;
  const tip = CATEGORY_TOOLTIPS[category];
  return (
    <span className="relative group/tip cursor-default" title={tip}>
      <span>{category}</span>
      {tip && (
        <span className="invisible group-hover/tip:visible absolute left-0 bottom-full mb-1.5 z-20 w-[260px] px-3 py-2 text-[12.5px] leading-relaxed text-ink-primary bg-canvas-elevated border border-rule-strong rounded-[9px] shadow-card pointer-events-none">
          {tip}
        </span>
      )}
    </span>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block w-[17px] h-[17px] rounded-[5px] border-[1.5px] align-middle transition-colors ${
        on ? 'bg-accent border-accent' : 'border-rule-strong bg-canvas-elevated'
      }`}
    >
      {on && (
        <span className="absolute left-[4.5px] top-[1px] w-[4.5px] h-[9px] border-white border-r-2 border-b-2 rotate-45" />
      )}
    </span>
  );
}

export function TargetTable({
  rows, mode, onToggle, onPreview, renderAction, cap, onShowMore, onSelectShown, empty, t,
}: Props) {
  const shown = cap ? rows.slice(0, cap) : rows;
  const overflow = cap ? Math.max(0, rows.length - cap) : 0;
  const selectableShown = shown.filter((s) => !s.selected).length;

  if (rows.length === 0) {
    return <div className="px-6 py-16 grid place-items-center text-center">{empty}</div>;
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" aria-label="Select" className="w-[42px]" />
            <th scope="col" className="text-left font-medium text-[11.5px] text-ink-tertiary px-4 py-2.5">Company</th>
            <th scope="col" className="text-left font-medium text-[11.5px] text-ink-tertiary px-4 py-2.5 hidden md:table-cell">Type</th>
            {mode === 'manage' && <th scope="col" className="text-left font-medium text-[11.5px] text-ink-tertiary px-4 py-2.5">Status</th>}
            <th scope="col" aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {shown.map((s) => {
            const meta = mode === 'manage' ? statusMeta(s.status) : null;
            return (
              <tr
                key={s.id}
                data-service-id={s.id}
                className={`border-b border-rule transition-colors scroll-mt-4 ${s.selected ? 'bg-accent-soft' : 'hover:bg-canvas-sunken'}`}
              >
                <td className="pl-4 py-3">
                  <button type="button" onClick={() => onToggle(s.id)} aria-label={s.selected ? `Remove ${s.name}` : `Add ${s.name}`} className="block">
                    <Checkbox on={s.selected} />
                  </button>
                </td>
                {/* Definite width so the truncating brand line inside can't
                    widen the column and push the later columns off-screen. */}
                <td className="px-4 py-3 max-w-0 w-full">
                  <button type="button" onClick={() => onPreview(s)} className="flex items-center gap-3 text-left group w-full min-w-0">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-canvas-sunken border border-rule grid place-items-center text-[12px] font-semibold text-ink-secondary shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium leading-tight group-hover:text-accent transition-colors truncate">
                        {s.name}
                        {s.needsIdDocument && (
                          <span className="ml-2 align-middle text-[10.5px] uppercase tracking-[0.05em] text-ink-tertiary border border-rule-strong rounded px-1 py-px">
                            {t.needsIdBadge}
                          </span>
                        )}
                      </span>
                      {s.alsoKnownAs?.length ? (
                        <span className="block text-[12px] text-ink-tertiary truncate">
                          {t.brandAliasNote(s.alsoKnownAs.slice(0, 3).join(', '))}
                        </span>
                      ) : (
                        s.url && <span className="block text-[12px] text-ink-tertiary truncate">{s.url.replace(/^https?:\/\//, '')}</span>
                      )}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary hidden md:table-cell">
                  <CategoryChip category={s.categories[0]} />
                </td>
                {mode === 'manage' && meta && (
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-secondary">
                      <span className={`w-[7px] h-[7px] rounded-full ${TONE_DOT[meta.tone]}`} />
                      {meta.label}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-right whitespace-nowrap">{renderAction?.(s)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(overflow > 0 || onSelectShown) && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-rule">
          {onSelectShown && selectableShown > 0 && (
            <button
              type="button"
              onClick={onSelectShown}
              className="text-[13px] rounded-[9px] px-3 py-1.5 border border-rule-strong text-ink-secondary hover:border-accent hover:text-accent transition-colors"
            >
              {t.tableSelectShown(selectableShown)}
            </button>
          )}
          <div className="flex-1" />
          {overflow > 0 && (
            <>
              <span className="text-[13px] text-ink-tertiary">{t.tableMoreCount(overflow)}</span>
              {onShowMore && (
                <button
                  type="button"
                  onClick={onShowMore}
                  className="text-[13px] rounded-[9px] px-3 py-1.5 border border-rule-strong text-ink-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {t.tableShowMore}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
