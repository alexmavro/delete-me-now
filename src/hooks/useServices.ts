import { useState, useEffect, useMemo, useCallback } from 'react';
import { Service, ServiceFilter, RequestStatus, ResponseStatus, SmartPackId, EU_REGIONS, Region, StagedEscalation, ConfidenceLevel, FacetContact, FacetRisk, FacetJurisdiction } from '../types';
import { INITIAL_SERVICES } from '../data/services';
import { SMART_PACKS } from '../data/jurisdictions';
import { storage } from '../utils/storage';
import { getBestEmail } from '../utils/contacts';
import { autoAdvanceStatus } from '../utils/request-lifecycle';
import { parseQuery, categoryMatches } from '../utils/search-query';
import { getJurisdiction } from '../utils/derive-jurisdiction';

// Storage trust boundary. Stored values can drift if the RequestStatus enum
// gets a member removed/renamed; this allowlist quarantines the damage to
// the rehydration step instead of letting an unknown status leak into the
// lifecycle/dispatch path.
const VALID_STATUSES: ReadonlySet<RequestStatus> = new Set(Object.values(RequestStatus));
const isValidStatus = (s: unknown): s is RequestStatus =>
  typeof s === 'string' && VALID_STATUSES.has(s as RequestStatus);

// Same trust-boundary discipline for the staged-escalation payload: a
// malformed/tampered shape would render an empty body and silently fail the
// copy buttons in the banner. Drop to undefined on shape mismatch.
function isValidStagedEscalation(v: unknown): v is StagedEscalation {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.subject === 'string' &&
    typeof o.body === 'string' &&
    typeof o.stagedAt === 'string' &&
    (o.dpaUrl === null || typeof o.dpaUrl === 'string')
  );
}

function mergeWithSaved(saved: Service[]): Service[] {
  return INITIAL_SERVICES.map((init) => {
    const match = saved.find((s) => s.id === init.id);
    if (!match) return init;
    // Merge ONLY user-state fields (ServiceState). Canonical fields (name,
    // contacts, relevantDpa, etc.) stay authoritative from INITIAL_SERVICES so
    // upstream corrections (e.g. fixed DPO address) reach existing users.
    return {
      ...init,
      selected: !!match.selected,
      status: isValidStatus(match.status) ? match.status : init.status,
      lastContacted: match.lastContacted,
      responseStatus: match.responseStatus,
      responseDate: match.responseDate,
      notes: match.notes,
      stagedEscalation: isValidStagedEscalation(match.stagedEscalation)
        ? match.stagedEscalation
        : undefined,
    };
  }).concat(
    // Rows in localStorage that no longer match an INITIAL_SERVICES entry.
    // User-created (source==='manual') stay as-is; upstream removals get
    // tagged so the UI can surface "removed upstream" rather than letting
    // the user wonder why their tracker entry no longer maps to a real
    // company. The flag is recomputed every hydration — the matched-row
    // branch above spreads `...init` first, so a stale persisted flag is
    // dropped if upstream re-adds the company.
    saved
      .filter((s) => !INITIAL_SERVICES.find((i) => i.id === s.id))
      .map((s) => (s.source === 'manual' ? s : { ...s, isOrphan: true })),
  );
}

const DEFAULT_FILTER: ServiceFilter = {
  search: '',
  category: 'All',
  region: 'All',
  includeSpeculative: false,
  verifiedOnly: false,
  jurisdiction: 'All',
  contactAvailability: 'Any',
  confidenceTiers: [],
  riskTier: 'All',
};

function matchesContactFacet(s: Service, facet: FacetContact): boolean {
  if (facet === 'Any') return true;
  const c = s.contacts;
  if (facet === 'has-dpo') return !!c.dpo;
  if (facet === 'has-privacy') return !!c.privacy;
  if (facet === 'has-postal') return !!c.postalAddress;
  // 'has-any': at least one reachable channel
  return !!(c.dpo || c.privacy || c.general || c.postalAddress);
}

function matchesRiskFacet(s: Service, facet: FacetRisk): boolean {
  if (facet === 'All') return true;
  if (facet === 'broker') return s.categories.includes('Data Broker');
  if (facet === 'ad-tech') return s.categories.includes('Ad Tech');
  // 'consumer' = every non-broker non-ad-tech row. A row with both
  // `Data Broker` AND `Ad Tech` categories is counted under broker
  // (first match in the bucket loop below), so the four chips don't sum
  // to All; that's expected once you have dual-category rows.
  return !s.categories.includes('Data Broker') &&
    !s.categories.includes('Ad Tech');
}

export function useServices() {
  const [services, setServicesRaw] = useState<Service[]>(() => {
    const saved = storage.get<Service[]>('services');
    return saved ? mergeWithSaved(saved) : INITIAL_SERVICES;
  });

  const [filter, setFilterRaw] = useState<ServiceFilter>(DEFAULT_FILTER);

  useEffect(() => {
    storage.set('services', services);
  }, [services]);

  const setFilter = useCallback((updates: Partial<ServiceFilter>) => {
    setFilterRaw((prev) => ({ ...prev, ...updates }));
  }, []);

  const isSpeculative = (s: Service) =>
    s.categories.includes('Data Broker') || s.categories.includes('Ad Tech') || s.confidence === 'Inferred';

  // Region matcher used by both the dropdown filter and the tag-search
  // path so EU expansion stays in one place. Unknown region codes
  // (typo, future region) return true so an invalid `region:zz` doesn't
  // silently zero the directory — better to ignore than to delete.
  const KNOWN_REGIONS: ReadonlySet<string> = new Set([
    'Global', 'EU',
    'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
    'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'HR', 'SK', 'SI',
    'BG', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT',
    'US', 'UK', 'BR', 'CH', 'NO', 'IS', 'LI',
  ]);
  function regionMatches(regions: readonly Region[], r: string): boolean {
    if (!KNOWN_REGIONS.has(r)) return true;
    if (r === 'EU') {
      return regions.includes('EU') || regions.some((rg) => (EU_REGIONS as readonly Region[]).includes(rg));
    }
    return regions.includes(r as Region);
  }

  // Parse the search box once per filter change rather than per service.
  // Recognizes tag:/region:/cat:/risk: prefixes; falls back to free-text
  // name matching for everything else.
  const parsedQuery = useMemo(() => parseQuery(filter.search), [filter.search]);

  // Filter pipe — see compose-order note on `verifiedOnly` + `includeSpeculative`.
  // verifiedOnly fires first (only Verified-confidence rows survive), then
  // !includeSpeculative kills any remaining isSpeculative rows. This means
  // a Verified-confidence data-broker passes verifiedOnly but gets dropped
  // unless the user also opts in to Broad mode. The Directory's segmented
  // control enforces these as mutually exclusive — both true is unreachable
  // through the UI, but the hook stays defensive for future paths.
  // Predicate split out so facetCounts can probe each axis under the OTHER
  // axes. That's how live counts stay honest when one facet narrows the
  // dataset (count(jurisdiction=GDPR) shifts as user toggles has-dpo).
  // skipFacet allows excluding a single axis from the predicate so we can
  // count its members under everything else.
  type FacetAxis = 'jurisdiction' | 'contact' | 'confidence' | 'risk';
  const matchesFilter = useCallback(
    (s: Service, skip?: FacetAxis): boolean => {
      if (s.selected) return false;
      if (filter.verifiedOnly && s.confidence !== 'Verified') return false;
      if (!filter.includeSpeculative && isSpeculative(s)) return false;
      if (filter.category !== 'All' && !s.categories.includes(filter.category)) return false;
      if (filter.region !== 'All' && !regionMatches(s.regions, filter.region)) return false;
      if (parsedQuery.tags.tag && !categoryMatches(s.categories, parsedQuery.tags.tag)) return false;
      if (parsedQuery.tags.cat && !categoryMatches(s.categories, parsedQuery.tags.cat)) return false;
      if (parsedQuery.tags.region && !regionMatches(s.regions, parsedQuery.tags.region)) return false;
      if (parsedQuery.tags.risk) {
        const r = parsedQuery.tags.risk;
        const high = isSpeculative(s);
        if (r === 'high' && !high) return false;
        if (r === 'low' && high) return false;
      }
      if (parsedQuery.text && !s.name.toLowerCase().includes(parsedQuery.text)) return false;
      if (skip !== 'jurisdiction' && filter.jurisdiction !== 'All' &&
        getJurisdiction(s) !== filter.jurisdiction) return false;
      if (skip !== 'contact' && !matchesContactFacet(s, filter.contactAvailability)) return false;
      if (skip !== 'confidence' && filter.confidenceTiers.length > 0 &&
        !filter.confidenceTiers.includes(s.confidence)) return false;
      if (skip !== 'risk' && !matchesRiskFacet(s, filter.riskTier)) return false;
      return true;
    },
    [filter, parsedQuery],
  );

  const filteredUnselected = useMemo(
    () => services.filter((s) => matchesFilter(s)),
    [services, matchesFilter],
  );

  // Per-facet counts under the OTHER current filters. Count for facet X's
  // value v = how many rows would match if facet X were set to v while all
  // other axes stayed at their current value. Drives the live-count badges
  // in FacetRail. O(N × axes); fine on 2,924 rows.
  const facetCounts = useMemo(() => {
    const jurisdiction: Record<FacetJurisdiction, number> = {
      All: 0, GDPR: 0, UK_GDPR: 0, CCPA: 0, LGPD: 0, Other: 0,
    };
    const contact: Record<FacetContact, number> = {
      Any: 0, 'has-dpo': 0, 'has-privacy': 0, 'has-postal': 0, 'has-any': 0,
    };
    const confidence: Record<ConfidenceLevel, number> = {
      Verified: 0, Community: 0, Inferred: 0, Manual: 0,
    };
    const risk: Record<FacetRisk, number> = {
      All: 0, broker: 0, 'ad-tech': 0, consumer: 0,
    };
    for (const s of services) {
      if (matchesFilter(s, 'jurisdiction')) {
        jurisdiction.All += 1;
        jurisdiction[getJurisdiction(s)] += 1;
      }
      if (matchesFilter(s, 'contact')) {
        contact.Any += 1;
        if (s.contacts.dpo) contact['has-dpo'] += 1;
        if (s.contacts.privacy) contact['has-privacy'] += 1;
        if (s.contacts.postalAddress) contact['has-postal'] += 1;
        if (s.contacts.dpo || s.contacts.privacy || s.contacts.general || s.contacts.postalAddress) {
          contact['has-any'] += 1;
        }
      }
      if (matchesFilter(s, 'confidence')) {
        confidence[s.confidence] += 1;
      }
      if (matchesFilter(s, 'risk')) {
        risk.All += 1;
        if (s.categories.includes('Data Broker')) risk.broker += 1;
        else if (s.categories.includes('Ad Tech')) risk['ad-tech'] += 1;
        else risk.consumer += 1;
      }
    }
    return { jurisdiction, contact, confidence, risk };
  }, [services, matchesFilter]);

  const selected = useMemo(() => services.filter((s) => s.selected), [services]);

  const toggle = useCallback((id: string) => {
    setServicesRaw((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  }, []);

  // Bulk-select primitive. Works on a caller-provided id list (the visible
  // filtered slice), not the full dataset, so it's well-behaved when the
  // user is filtered to e.g. a single jurisdiction. Returns the actual
  // newly-selected count (not the requested length) so the caller's
  // announcement chip stays honest when the list contains stale ids or
  // already-selected rows that don't move. Shift contract is "add only";
  // shift never deselects (mirrors Finder / Gmail / GitHub).
  const selectMany = useCallback((ids: readonly string[]): number => {
    if (ids.length === 0) return 0;
    const idSet = new Set(ids);
    let added = 0;
    setServicesRaw((prev) => {
      // Reset on every updater invocation. React 18 StrictMode invokes
      // state updaters twice in dev, and concurrent rendering may re-run
      // an interrupted updater. Without this reset, `added` would
      // accumulate across re-runs and lie to the announce chip.
      added = 0;
      return prev.map((s) => {
        if (idSet.has(s.id) && !s.selected) {
          added++;
          return { ...s, selected: true };
        }
        return s;
      });
    });
    return added;
  }, []);

  const selectPack = useCallback((packId: SmartPackId) => {
    const pack = SMART_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setServicesRaw((prev) =>
      prev.map((s) => (pack.match(s) ? { ...s, selected: true } : s)),
    );
  }, []);

  const selectAll = useCallback(() => {
    setServicesRaw((prev) => prev.map((s) => ({ ...s, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setServicesRaw((prev) => prev.map((s) => ({ ...s, selected: false })));
  }, []);

  const addCustom = useCallback((name: string, email?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      console.warn('addCustom: refusing empty name');
      return;
    }
    const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      console.warn('addCustom: refusing name that yields empty slug:', trimmedName);
      return;
    }
    const newService: Service = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      slug,
      categories: ['Imported'],
      regions: ['Global'],
      contacts: { general: email },
      confidence: 'Manual',
      source: 'manual',
      selected: true,
      status: RequestStatus.PENDING,
      notes: 'Manually added',
    };
    setServicesRaw((prev) => [newService, ...prev]);
  }, []);

  const importServices = useCallback((incoming: Service[]) => {
    setServicesRaw((prev) => {
      const existingNames = new Set(prev.map((s) => s.name.trim().toLowerCase()));
      const unique = incoming.filter((s) => !existingNames.has(s.name.trim().toLowerCase()));
      return [...unique, ...prev];
    });
  }, []);

  // Status-transition mutators below all clear stagedEscalation when leaving
  // ESCALATION_READY: the persisted draft is meaningful only while the row is
  // ready to escalate. Closing, marking responded, etc. invalidate the draft.
  const updateStatus = useCallback((id: string, status: RequestStatus) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              ...(status === RequestStatus.SENT ? { lastContacted: new Date().toISOString() } : {}),
              ...(status === RequestStatus.ESCALATION_READY ? {} : { stagedEscalation: undefined }),
            }
          : s,
      ),
    );
  }, []);

  const resetServices = useCallback(() => {
    setServicesRaw(INITIAL_SERVICES);
  }, []);

  const markSent = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: RequestStatus.SENT,
              lastContacted: new Date().toISOString(),
              stagedEscalation: undefined,
            }
          : s,
      ),
    );
  }, []);

  const markResponded = useCallback((id: string, responseStatus: ResponseStatus) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: RequestStatus.RESPONDED,
              responseStatus,
              responseDate: new Date().toISOString(),
              stagedEscalation: undefined,
            }
          : s,
      ),
    );
  }, []);

  const markPartial = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: RequestStatus.PARTIAL,
              responseDate: new Date().toISOString(),
              stagedEscalation: undefined,
            }
          : s,
      ),
    );
  }, []);

  const markIgnored = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: RequestStatus.IGNORED, stagedEscalation: undefined }
          : s,
      ),
    );
  }, []);

  const markFollowUpSent = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: RequestStatus.FOLLOW_UP_SENT,
              lastContacted: new Date().toISOString(),
              stagedEscalation: undefined,
            }
          : s,
      ),
    );
  }, []);

  // Free-text local note per service (audit trail: "they asked for ID
  // copy", "claimed exemption under Art. 23"). Trimmed; empty string
  // clears it. Sanitization is deliberately not applied — notes are
  // local-only for the user, never flow into mailto/header surfaces.
  const setNotes = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, notes: trimmed === '' ? undefined : trimmed } : s,
      ),
    );
  }, []);

  // Combined response-capture mutator: store the reply text in notes,
  // record date + classification, and advance to RESPONDED (or PARTIAL
  // when the controller satisfied only part of the request).
  // Asymmetry vs setNotes (intentional): captureResponse never CLEARS
  // notes — empty/whitespace text preserves prior notes (the user might
  // be capturing a phone-call response with no pasted text, but their
  // hand-written audit note still matters). To clear, use NotesBlock's
  // explicit empty-save path through setNotes.
  const captureResponse = useCallback(
    (id: string, replyText: string, classification: ResponseStatus) => {
      const trimmed = replyText.trim();
      const status =
        classification === 'partial' ? RequestStatus.PARTIAL : RequestStatus.RESPONDED;
      setServicesRaw((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status,
                responseStatus: classification,
                responseDate: new Date().toISOString(),
                notes: trimmed === '' ? s.notes : trimmed,
                stagedEscalation: undefined,
              }
            : s,
        ),
      );
    },
    [],
  );

  const markEscalated = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: RequestStatus.ESCALATED, stagedEscalation: undefined }
          : s,
      ),
    );
  }, []);

  // Persist a drafted DPA complaint so the user can resume after closing the
  // EscalateBanner without confirming. Cleared on markEscalated (filed) or
  // explicit clearStagedEscalation (user starts over).
  const setStagedEscalation = useCallback(
    (id: string, payload: StagedEscalation) => {
      setServicesRaw((prev) =>
        prev.map((s) => (s.id === id ? { ...s, stagedEscalation: payload } : s)),
      );
    },
    [],
  );

  const clearStagedEscalation = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) => (s.id === id ? { ...s, stagedEscalation: undefined } : s)),
    );
  }, []);

  const closeRequest = useCallback((id: string) => {
    setServicesRaw((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: RequestStatus.CLOSED, stagedEscalation: undefined }
          : s,
      ),
    );
  }, []);

  const advanceLifecycle = useCallback((jurisdiction: string) => {
    setServicesRaw((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (!s.lastContacted) return s;
        const advanced = autoAdvanceStatus(s.status, s.lastContacted, jurisdiction);
        if (advanced !== s.status) {
          changed = true;
          return { ...s, status: advanced };
        }
        return s;
      });
      return changed ? next : prev;
    });
  }, []);

  const stats = useMemo(() => ({
    total: selected.length,
    sent: selected.filter((s) => s.status === RequestStatus.SENT).length,
    pending: selected.filter((s) => s.status === RequestStatus.PENDING).length,
    skipped: selected.filter((s) => s.status === RequestStatus.SKIPPED).length,
    withEmail: selected.filter((s) => getBestEmail(s.contacts)).length,
    waiting: selected.filter((s) => s.status === RequestStatus.WAITING).length,
    overdue: selected.filter((s) => s.status === RequestStatus.IGNORED).length,
    responded: selected.filter((s) => s.status === RequestStatus.RESPONDED).length,
    followUpSent: selected.filter((s) => s.status === RequestStatus.FOLLOW_UP_SENT).length,
    escalationReady: selected.filter((s) => s.status === RequestStatus.ESCALATION_READY).length,
  }), [selected]);

  return {
    services,
    filter,
    setFilter,
    filteredUnselected,
    selected,
    toggle,
    selectPack,
    selectAll,
    selectMany,
    deselectAll,
    addCustom,
    importServices,
    updateStatus,
    resetServices,
    markSent,
    markResponded,
    markPartial,
    markIgnored,
    markFollowUpSent,
    markEscalated,
    setStagedEscalation,
    clearStagedEscalation,
    closeRequest,
    advanceLifecycle,
    setNotes,
    captureResponse,
    facetCounts,
    stats,
  };
}
