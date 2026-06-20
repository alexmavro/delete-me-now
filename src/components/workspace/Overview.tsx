import { Icon, IconName } from '../ui/Icon';
import { Translations } from '../../locales';

export interface OverviewStats {
  sent: number;
  awaiting: number;
  resolved: number;
  attention: number;
  inFlight: number;
  notStarted: number;
  total: number;
}

function Kpi({ label, value, icon, tone, hint }: { label: string; value: number; icon: IconName; tone: string; hint: string }) {
  return (
    <div className="bg-canvas-elevated border border-rule rounded-[13px] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12.5px] text-ink-secondary">{label}</span>
        <span className={`w-[30px] h-[30px] rounded-lg grid place-items-center ${tone}`}><Icon name={icon} size={15} /></span>
      </div>
      <div className="text-[27px] font-semibold tracking-[-0.03em] leading-none">{value}</div>
      <div className="text-[12px] text-ink-tertiary mt-1.5">{hint}</div>
    </div>
  );
}

export function Overview({ stats, t }: { stats: OverviewStats; t: Translations }) {
  const resolvedPct = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const seg = (n: number) => (stats.total ? `${(n / stats.total) * 100}%` : '0%');

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <Kpi label={t.kpiSent} value={stats.sent} icon="send" tone="bg-accent-soft text-accent" hint={t.kpiSentHint} />
        <Kpi label={t.kpiAwaiting} value={stats.awaiting} icon="clock" tone="bg-honey-quiet text-honey" hint={t.kpiAwaitingHint} />
        <Kpi label={t.kpiResolved} value={stats.resolved} icon="check" tone="bg-positive-wash text-positive" hint={t.kpiResolvedHint} />
        <Kpi label={t.kpiAttention} value={stats.attention} icon="alert" tone="bg-critical-wash text-critical" hint={t.kpiAttentionHint} />
      </div>

      {stats.total > 0 && (
        <div className="bg-canvas-elevated border border-rule rounded-[13px] p-5 shadow-sm mb-5">
          <div className="flex items-baseline justify-between mb-3">
            <b className="text-[14px] font-semibold">{t.kpiResolved}</b>
            <span className="text-[13px] text-ink-secondary">{stats.resolved} / {stats.total} · {resolvedPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-canvas-sunken overflow-hidden flex">
            <span className="h-full bg-positive" style={{ width: seg(stats.resolved) }} />
            <span className="h-full bg-accent" style={{ width: seg(stats.inFlight) }} />
            <span className="h-full bg-critical" style={{ width: seg(stats.attention) }} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[12.5px] text-ink-secondary">
            <Legend dot="bg-positive" label={t.progressResolved} />
            <Legend dot="bg-accent" label={t.progressInFlight} />
            <Legend dot="bg-critical" label={t.progressAttention} />
            <Legend dot="bg-canvas-sunken border border-rule-strong" label={t.progressNotStarted} />
          </div>
        </div>
      )}
    </>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />{label}
    </span>
  );
}
