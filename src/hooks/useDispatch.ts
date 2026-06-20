import { useCallback, useEffect, useMemo, useState } from 'react';
import { Service, RequestStatus, GeneratedEmail, UserProfile } from '../types';
import { getBestEmail } from '../utils/contacts';
import { buildMailtoUrl, buildGmailUrl, buildEmlContent, downloadEml } from '../utils/email';
import { downloadBatchZip, BatchResult } from '../utils/zip';
import { storage } from '../utils/storage';
import { Translations } from '../locales';

export type SendVia = 'mail' | 'gmail' | 'eml';

const STORAGE_KEY = 'sendVia';

const isSendVia = (v: unknown): v is SendVia => v === 'mail' || v === 'gmail' || v === 'eml';

function loadSendVia(): SendVia {
  const v = storage.get<string>(STORAGE_KEY);
  if (isSendVia(v)) return v;
  // Unprefixed `eb.sendVia` may exist on a user's machine; rewrite under the
  // `storage` prefix so a future `storage.clear()` covers it uniformly.
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('eb.sendVia');
      if (isSendVia(raw)) {
        storage.set(STORAGE_KEY, raw);
        window.localStorage.removeItem('eb.sendVia');
        return raw;
      }
    }
  } catch (err) {
    console.warn('useDispatch: raw-key migration failed', err);
  }
  return 'mail';
}

export interface UseDispatchArgs {
  selected: Service[];
  profile: UserProfile;
  getEmail: (s: Service) => GeneratedEmail;
  // Same shape as getEmail but produces the firmer follow-up letter (auto
  // AGGRESSIVE for IGNORED). Caller owns generation so all template logic
  // stays in App.tsx alongside the per-row handleFollowUp.
  getFollowUpEmail: (s: Service) => GeneratedEmail;
  markSent: (id: string) => void;
  markFollowUpSent: (id: string) => void;
  // For locale-keyed user-readable error verbs. The raw Error.message is
  // appended in console.warn but never shown to the user.
  t: Translations;
}

// Discriminator: a single attestation card serves both first sends and
// follow-ups; the confirm path advances different lifecycle states.
export type DispatchKind = 'send' | 'followUp';

export interface PendingAttestation {
  serviceId: string;
  kind: DispatchKind;
  via: SendVia;
  // True when window.open returned null (popup blocker / iframe / sandboxed).
  // Lets the UI render an explicit "your browser blocked it; allow popups
  // and click No, retry" hint instead of the bare "did it open?" question.
  popupBlocked: boolean;
}

export interface UseDispatchResult {
  sendVia: SendVia;
  setSendVia: (v: SendVia) => void;
  pendingQueue: Service[];
  ignoredQueue: Service[];
  pendingAttestation: PendingAttestation | null;
  sendNext: () => void;
  sendNextFollowUp: () => void;
  confirmSend: () => void;
  rejectSend: () => void;
  isZipping: boolean;
  lastBatch: BatchResult | null;
  downloadAll: () => Promise<void>;
  downloadSingle: (s: Service, to: string) => void;
  clearFailed: () => void;
  // User-facing error string for storage-quota / sandboxed-iframe / Blob
  // URL throws; the rail surfaces this so a failed click isn't silent.
  lastError: string | null;
  clearError: () => void;
}

export function useDispatch({
  selected,
  profile,
  getEmail,
  getFollowUpEmail,
  markSent,
  markFollowUpSent,
  t,
}: UseDispatchArgs): UseDispatchResult {
  const [sendVia, setSendViaState] = useState<SendVia>(loadSendVia);
  const [pendingAttestation, setPendingAttestation] = useState<PendingAttestation | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [lastBatch, setLastBatch] = useState<BatchResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Map call sites to locale-keyed user-readable phrasings.
  // Raw Error detail goes to console.warn only.
  const reportError = useCallback(
    (where: 'sendNext' | 'downloadAll' | 'downloadSingle', err: unknown) => {
      console.warn(`useDispatch.${where}:`, err);
      const userMsg =
        where === 'downloadAll' ? t.dispatchErrorPackaging
        : where === 'downloadSingle' ? t.dispatchErrorSaving
        : t.dispatchErrorOpening;
      setLastError(userMsg);
    },
    [t],
  );
  const clearError = useCallback(() => setLastError(null), []);

  // Persist sendVia preference via the shared `storage` wrapper so a
  // hypothetical "reset everything" flow purges all keys uniformly.
  const setSendVia = useCallback((v: SendVia) => {
    setSendViaState(v);
    storage.set(STORAGE_KEY, v);
  }, []);

  const pendingQueue = useMemo(
    () =>
      selected.filter(
        (s) => s.status === RequestStatus.PENDING && !!getBestEmail(s.contacts),
      ),
    [selected],
  );

  // Bulk re-ask queue: services the controller never replied to. Auto-advance
  // moves SENT→WAITING→IGNORED after the jurisdiction's reply window. Anything
  // already FOLLOW_UP_SENT is excluded so the cursor doesn't loop. Also
  // require `lastContacted`; without it the follow-up letter would say
  // "I sent my erasure request on [today]" which is a literal lie in a
  // legal document.
  const ignoredQueue = useMemo(
    () =>
      selected.filter(
        (s) =>
          s.status === RequestStatus.IGNORED &&
          !!s.lastContacted &&
          !!getBestEmail(s.contacts),
      ),
    [selected],
  );

  // If the current attestation target left `selected` (deselected) OR its
  // status flipped away from the kind-relevant state via another path
  // (multi-tab, future sync), clear the prompt. Never strand the UI on a
  // ghost row.
  useEffect(() => {
    if (!pendingAttestation) return;
    const target = selected.find((s) => s.id === pendingAttestation.serviceId);
    if (!target) {
      setPendingAttestation(null);
      return;
    }
    const expected =
      pendingAttestation.kind === 'send'
        ? RequestStatus.PENDING
        : RequestStatus.IGNORED;
    if (target.status !== expected) {
      setPendingAttestation(null);
    }
  }, [pendingAttestation, selected]);

  // Shared open/save body for sendNext + sendNextFollowUp. Wrapped in
  // useCallback so the lint rule guards both call sites' deps; if a future
  // edit drops `sendVia` from a caller's deps, this won't silently use stale
  // values because dispatchOne itself memoizes on those same deps.
  const dispatchOne = useCallback(
    (next: Service, email: GeneratedEmail, kind: DispatchKind) => {
      const to = getBestEmail(next.contacts);
      if (!to) return;
      if (sendVia === 'eml') {
        try {
          const safe = next.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          const prefix = kind === 'followUp' ? 'FOLLOWUP' : 'DELETE';
          const content = buildEmlContent(to, profile.email, email);
          downloadEml(`${prefix}_${safe}.eml`, content);
          setPendingAttestation({ serviceId: next.id, kind, via: 'eml', popupBlocked: false });
        } catch (err) {
          reportError(sendVia === 'eml' ? 'downloadSingle' : 'sendNext', err);
        }
        return;
      }
      const url = sendVia === 'gmail' ? buildGmailUrl(to, email) : buildMailtoUrl(to, email);
      let win: Window | null = null;
      let threw = false;
      try {
        if (sendVia === 'gmail') {
          win = window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          win = window.open(url);
        }
      } catch (err) {
        threw = true;
        // Don't surface as a user-facing error; popupBlocked on the
        // attestation card already carries the signal.
        console.warn('useDispatch.sendNext:', err);
      }
      // mailto: always returns null (even on success), so only throws and
      // gmail null-returns are reliable blocked signals.
      const popupBlocked = threw || (sendVia === 'gmail' && win === null);
      setPendingAttestation({ serviceId: next.id, kind, via: sendVia, popupBlocked });
    },
    [sendVia, profile.email, reportError],
  );

  const sendNext = useCallback(() => {
    if (pendingAttestation) return;
    const next = pendingQueue[0];
    if (!next) return;
    if (!getBestEmail(next.contacts)) return;
    const email = getEmail(next);
    // Each fresh send-next attempt clears the stale batch banner; leaving
    // a "2 of 7 failed" line above an unrelated single send is misleading.
    if (lastBatch) setLastBatch(null);
    if (lastError) setLastError(null);
    dispatchOne(next, email, 'send');
  }, [pendingAttestation, pendingQueue, getEmail, lastBatch, lastError, dispatchOne]);

  const sendNextFollowUp = useCallback(() => {
    if (pendingAttestation) return;
    const next = ignoredQueue[0];
    if (!next) return;
    const email = getFollowUpEmail(next);
    if (lastBatch) setLastBatch(null);
    if (lastError) setLastError(null);
    dispatchOne(next, email, 'followUp');
  }, [pendingAttestation, ignoredQueue, getFollowUpEmail, lastBatch, lastError, dispatchOne]);

  const confirmSend = useCallback(() => {
    if (!pendingAttestation) return;
    if (pendingAttestation.kind === 'followUp') {
      markFollowUpSent(pendingAttestation.serviceId);
    } else {
      markSent(pendingAttestation.serviceId);
    }
    setPendingAttestation(null);
    setLastError(null);
  }, [pendingAttestation, markSent, markFollowUpSent]);

  const rejectSend = useCallback(() => {
    setPendingAttestation(null);
  }, []);

  const downloadAll = useCallback(async () => {
    if (pendingQueue.length === 0) return;
    setIsZipping(true);
    setLastBatch(null);
    setLastError(null);
    try {
      const result = await downloadBatchZip(
        pendingQueue,
        profile,
        (s) => getEmail(s),
      );
      setLastBatch(result);
      // <a download> cancel is unobservable, so we auto-mark ok services
      // SENT. Per-row attestation for 50+ services would be hostile UX;
      // the batch summary lets users spot and fix any wrong counts.
      result.ok.forEach((id) => markSent(id));
    } catch (err) {
      // Top-level packaging failure (jszip itself died, or the blob URL was
      // revoked before download). Surface as a synthetic all-failed batch
      // so the UI still has something to render, plus the error toast.
      const reason = err instanceof Error ? err.message : 'unknown error';
      setLastBatch({
        ok: [],
        failed: pendingQueue.map((s) => ({ id: s.id, name: s.name, reason })),
      });
      reportError('downloadAll', err);
    } finally {
      setIsZipping(false);
    }
  }, [pendingQueue, profile, getEmail, markSent, reportError]);

  const downloadSingle = useCallback(
    (s: Service, to: string) => {
      if (pendingAttestation) return;
      try {
        const email = getEmail(s);
        const safe = s.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const content = buildEmlContent(to, profile.email, email);
        downloadEml(`DELETE_${safe}.eml`, content);
        // Ask before marking SENT; <a download> cancel is unobservable.
        if (lastBatch) setLastBatch(null);
        if (lastError) setLastError(null);
        setPendingAttestation({ serviceId: s.id, kind: 'send', via: 'eml', popupBlocked: false });
      } catch (err) {
        reportError('downloadSingle', err);
      }
    },
    [pendingAttestation, getEmail, profile.email, lastBatch, lastError, reportError],
  );

  const clearFailed = useCallback(() => setLastBatch(null), []);

  return {
    sendVia,
    setSendVia,
    pendingQueue,
    ignoredQueue,
    pendingAttestation,
    sendNext,
    sendNextFollowUp,
    confirmSend,
    rejectSend,
    isZipping,
    lastBatch,
    downloadAll,
    downloadSingle,
    clearFailed,
    lastError,
    clearError,
  };
}
