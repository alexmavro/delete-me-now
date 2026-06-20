import { UserProfile, SmartPackId } from '../../types';
import { Translations } from '../../locales';
import { JURISDICTION_LABELS } from '../../data/jurisdictions';
import { Logo } from '../ui/Logo';
import { Icon, IconName } from '../ui/Icon';

export type View = 'overview' | 'all' | 'sent' | 'awaiting' | 'attention';

interface NavCounts {
  total: number;
  selected: number;
  sent: number;
  awaiting: number;
  attention: number;
}

interface PackLink {
  id: SmartPackId;
  label: string;
}

interface Props {
  view: View;
  onSetView: (v: View) => void;
  counts: NavCounts;
  packs: PackLink[];
  onSelectPack: (id: SmartPackId) => void;
  profile: UserProfile;
  onOpenProfile: () => void;
  t: Translations;
}

function NavItem({
  icon, label, count, active, onClick,
}: { icon?: IconName; label: string; count?: number; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
        active
          ? 'bg-accent-soft text-accent font-medium'
          : 'text-ink-secondary hover:bg-canvas-sunken hover:text-ink-primary'
      }`}
    >
      {icon && <Icon name={icon} size={16} className="opacity-90 shrink-0" />}
      <span className="text-[13.5px] truncate">{label}</span>
      {count !== undefined && (
        <span className={`ml-auto text-[12px] tabular-nums ${active ? 'text-accent' : 'text-ink-tertiary'}`}>
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}

export function Sidebar({ view, onSetView, counts, packs, onSelectPack, profile, onOpenProfile, t }: Props) {
  return (
    <aside className="hidden lg:flex flex-col bg-canvas-elevated border-r border-rule px-3 py-3.5">
      <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-1.5">
        <Logo size={26} />
        <b className="text-[14.5px] font-semibold tracking-[-0.02em]">Delete Me Now</b>
      </div>

      <button
        type="button"
        onClick={() => onSetView('all')}
        className="flex items-center gap-2 mx-0.5 mt-3 mb-2 px-3 py-2 rounded-lg border border-rule-strong bg-canvas-elevated shadow-sm text-[13px] font-medium hover:border-accent hover:text-accent transition-colors"
      >
        <Icon name="plus" size={15} /> {t.sidebarAddTargets}
      </button>

      <nav className="mt-1">
        <NavItem icon="overview" label={t.viewOverview} active={view === 'overview'} onClick={() => onSetView('overview')} />
        <NavItem icon="list" label={t.viewAll} count={counts.total} active={view === 'all'} onClick={() => onSetView('all')} />
      </nav>

      <div className="mt-3">
        <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-tertiary">{t.sidebarProgress}</div>
        <NavItem icon="send" label={t.viewSent} count={counts.sent} active={view === 'sent'} onClick={() => onSetView('sent')} />
        <NavItem icon="clock" label={t.viewAwaiting} count={counts.awaiting} active={view === 'awaiting'} onClick={() => onSetView('awaiting')} />
        <NavItem icon="alert" label={t.viewAttention} count={counts.attention} active={view === 'attention'} onClick={() => onSetView('attention')} />
      </div>

      {packs.length > 0 && (
        <div className="mt-3">
          <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-tertiary">{t.sidebarQuickLists}</div>
          {packs.map((p) => (
            <NavItem key={p.id} label={p.label} onClick={() => onSelectPack(p.id)} />
          ))}
        </div>
      )}

      <div className="flex-1" />

      <button
        type="button"
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 p-2 rounded-lg border border-transparent hover:border-rule hover:bg-canvas-sunken transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-accent text-white grid place-items-center text-[12px] font-semibold shrink-0">
          {initials(profile.fullName) ?? <Icon name="user" size={14} />}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium truncate">{profile.fullName.trim() || t.sidebarSetProfile}</span>
          <span className="block text-[11.5px] text-ink-tertiary truncate">{JURISDICTION_LABELS[profile.jurisdiction]}</span>
        </span>
        <Icon name="settings" size={15} className="ml-auto text-ink-tertiary shrink-0" />
      </button>
    </aside>
  );
}

export function initials(name: string): string | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || null;
}
