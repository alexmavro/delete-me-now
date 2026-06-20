import { useEffect } from 'react';
import { UserProfile, SmartPackId } from '../../types';
import { Translations } from '../../locales';
import { JURISDICTION_LABELS } from '../../data/jurisdictions';
import { Logo } from '../ui/Logo';
import { isAnyModalOpen } from '../ui/Modal';
import { Icon, IconName } from '../ui/Icon';
import type { View } from './Sidebar';
import { initials } from './Sidebar';

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
  isOpen: boolean;
  onClose: () => void;
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
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
        active
          ? 'bg-accent-soft text-accent font-medium'
          : 'text-ink-secondary hover:bg-canvas-sunken hover:text-ink-primary'
      }`}
    >
      {icon && <Icon name={icon} size={16} className="opacity-90 shrink-0" />}
      <span className="text-[14px] truncate">{label}</span>
      {count !== undefined && (
        <span className={`ml-auto text-[12px] tabular-nums ${active ? 'text-accent' : 'text-ink-tertiary'}`}>
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}

export function MobileDrawer({ isOpen, onClose, view, onSetView, counts, packs, onSelectPack, profile, onOpenProfile, t }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAnyModalOpen()) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigate = (v: View) => { onSetView(v); onClose(); };
  const selectPack = (id: SmartPackId) => { onSelectPack(id); onClose(); };
  const openProfile = () => { onOpenProfile(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside role="dialog" aria-modal="true" aria-label={t.drawerCloseLabel} className="absolute left-0 top-0 bottom-0 w-[280px] bg-canvas-elevated flex flex-col px-3 py-3.5 animate-rise-in overflow-y-auto">
        <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
          <div className="flex items-center gap-2.5">
            <Logo size={26} />
            <b className="text-[14.5px] font-semibold tracking-[-0.02em]">Delete Me Now</b>
          </div>
          <button type="button" onClick={onClose} aria-label={t.drawerCloseLabel} className="text-ink-tertiary hover:text-ink-primary p-1">
            <Icon name="x" size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('all')}
          className="flex items-center gap-2 mx-0.5 mt-3 mb-2 px-3 py-2 rounded-lg border border-rule-strong bg-canvas-elevated shadow-sm text-[13px] font-medium hover:border-accent hover:text-accent transition-colors"
        >
          <Icon name="plus" size={15} /> {t.sidebarAddTargets}
        </button>

        <nav className="mt-1">
          <NavItem icon="overview" label={t.viewOverview} active={view === 'overview'} onClick={() => navigate('overview')} />
          <NavItem icon="list" label={t.viewAll} count={counts.total} active={view === 'all'} onClick={() => navigate('all')} />
        </nav>

        <div className="mt-3">
          <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-tertiary">{t.sidebarProgress}</div>
          <NavItem icon="send" label={t.viewSent} count={counts.sent} active={view === 'sent'} onClick={() => navigate('sent')} />
          <NavItem icon="clock" label={t.viewAwaiting} count={counts.awaiting} active={view === 'awaiting'} onClick={() => navigate('awaiting')} />
          <NavItem icon="alert" label={t.viewAttention} count={counts.attention} active={view === 'attention'} onClick={() => navigate('attention')} />
        </div>

        {packs.length > 0 && (
          <div className="mt-3">
            <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-tertiary">{t.sidebarQuickLists}</div>
            {packs.map((p) => (
              <NavItem key={p.id} label={p.label} onClick={() => selectPack(p.id)} />
            ))}
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={openProfile}
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
    </div>
  );
}
