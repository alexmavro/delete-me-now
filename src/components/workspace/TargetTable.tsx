import { ReactNode } from 'react';
import { Service } from '../../types';
import { statusMeta, TONE_DOT } from '../../utils/status-display';

interface Props {
  rows: Service[];
  mode: 'browse' | 'manage';
  onToggle: (id: string) => void;
  onPreview: (s: Service) => void;
  // Manage mode: the right-aligned per-row action (Send / Follow up / ...).
  renderAction?: (s: Service) => ReactNode;
  cap?: number;
  empty: ReactNode;
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

export function TargetTable({ rows, mode, onToggle, onPreview, renderAction, cap, empty }: Props) {
  const shown = cap ? rows.slice(0, cap) : rows;
  const overflow = cap ? Math.max(0, rows.length - cap) : 0;

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
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onPreview(s)} className="flex items-center gap-3 text-left group">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-canvas-sunken border border-rule grid place-items-center text-[12px] font-semibold text-ink-secondary shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium leading-tight group-hover:text-accent transition-colors truncate">{s.name}</span>
                      {s.url && <span className="block text-[12px] text-ink-tertiary truncate">{s.url.replace(/^https?:\/\//, '')}</span>}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary hidden md:table-cell capitalize">{s.categories[0] ?? '—'}</td>
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
      {overflow > 0 && (
        <p className="px-5 py-4 text-[13px] text-ink-tertiary">
          {overflow.toLocaleString()} more — refine your search to narrow the list.
        </p>
      )}
    </div>
  );
}
