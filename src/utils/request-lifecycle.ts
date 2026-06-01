import { RequestStatus } from '../types';

// LGPD Art. 19 sets 15 days for *access* requests. Erasure under Art. 18 has
// no statutory hard deadline; the ANPD expects "no undue delay". We use 15
// across the board as our internal nudge; the UI is honest about the rule.
const RESPONSE_DEADLINE_DAYS: Record<string, number> = {
  GDPR: 30,
  CCPA: 45,
  UK_GDPR: 30,
  LGPD: 15,
};

const FOLLOW_UP_ESCALATION_DAYS = 14;

function getResponseDeadlineDays(jurisdiction: string): number {
  return RESPONSE_DEADLINE_DAYS[jurisdiction] ?? 30;
}

export function getDaysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) {
    // Returning 0 (fresh) keeps a corrupted timestamp from auto-flipping
    // the row to IGNORED on bad data; the warn provides the breadcrumb.
    console.warn('getDaysSince: invalid ISO date', isoDate);
    return 0;
  }
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function getDaysRemaining(lastContacted: string, jurisdiction: string): number {
  const deadline = getResponseDeadlineDays(jurisdiction);
  return deadline - getDaysSince(lastContacted);
}

export function isOverdue(lastContacted: string, jurisdiction: string): boolean {
  return getDaysRemaining(lastContacted, jurisdiction) <= 0;
}

export function autoAdvanceStatus(
  status: RequestStatus,
  lastContacted?: string,
  jurisdiction?: string,
): RequestStatus {
  if (!lastContacted || !jurisdiction) return status;

  if (
    (status === RequestStatus.SENT || status === RequestStatus.WAITING) &&
    isOverdue(lastContacted, jurisdiction)
  ) {
    return RequestStatus.IGNORED;
  }

  if (
    status === RequestStatus.FOLLOW_UP_SENT &&
    getDaysSince(lastContacted) >= FOLLOW_UP_ESCALATION_DAYS
  ) {
    return RequestStatus.ESCALATION_READY;
  }

  // Promote SENT → WAITING only after the first day. Otherwise a freshly-sent
  // letter flips state on first effect-run, making the SENT badge functionally
  // unreachable in normal flow.
  if (status === RequestStatus.SENT && getDaysSince(lastContacted) >= 1) {
    return RequestStatus.WAITING;
  }

  return status;
}
