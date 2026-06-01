import { RequestStatus } from '../types';

// Lifecycle status → short label + tone. Tone→colour is resolved in the component (TONE_DOT).
export type StatusTone = 'ready' | 'sent' | 'pending' | 'waiting' | 'alert' | 'done';

export function statusMeta(status: RequestStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case RequestStatus.PENDING:          return { label: 'Ready', tone: 'ready' };
    case RequestStatus.SENT:             return { label: 'Sent', tone: 'sent' };
    case RequestStatus.WAITING:          return { label: 'Awaiting reply', tone: 'waiting' };
    case RequestStatus.FOLLOW_UP_SENT:   return { label: 'Followed up', tone: 'sent' };
    case RequestStatus.IGNORED:          return { label: 'No reply', tone: 'alert' };
    case RequestStatus.ESCALATION_READY: return { label: 'Escalate now', tone: 'alert' };
    case RequestStatus.ESCALATED:        return { label: 'Filed with DPA', tone: 'alert' };
    case RequestStatus.RESPONDED:        return { label: 'Resolved', tone: 'done' };
    case RequestStatus.PARTIAL:          return { label: 'Partial', tone: 'pending' };
    case RequestStatus.CLOSED:           return { label: 'Closed', tone: 'done' };
    case RequestStatus.SKIPPED:          return { label: 'Skipped', tone: 'waiting' };
  }
}

export const TONE_DOT: Record<StatusTone, string> = {
  ready:   'bg-ink-tertiary',
  sent:    'bg-positive',
  pending: 'bg-honey',
  waiting: 'bg-ink-tertiary',
  alert:   'bg-critical',
  done:    'bg-positive',
};
