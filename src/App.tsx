import { useCallback, useEffect, useMemo, useState } from 'react';
import { RequestStatus, Service, ResponseStatus, GeneratedEmail, SmartPackId } from './types';
import { useProfile } from './hooks/useProfile';
import { useServices } from './hooks/useServices';
import { useTheme } from './hooks/useTheme';
import { useDispatch } from './hooks/useDispatch';
import { getTranslations } from './locales';
import { generateEmail, generateFollowUpEmail, generateDpaComplaint } from './templates';
import { buildMailtoUrl } from './utils/email';
import { getDpaForCountry } from './data/dpa';
import { controllerLanguage } from './utils/controller-language';
import { dpaLanguage } from './utils/dpa-language';
import { isEeaCountry, controllerFacts } from './utils/derive-jurisdiction';
import { SMART_PACKS, INTENT_PACKS } from './data/jurisdictions';
import { LANG_TO_BCP47 } from './utils/user-country';

import { Sidebar, View } from './components/workspace/Sidebar';
import { Overview, OverviewStats } from './components/workspace/Overview';
import { TargetTable } from './components/workspace/TargetTable';
import { WelcomeModal } from './components/workspace/WelcomeModal';
import { Footer } from './components/workspace/Footer';
import { ProfilePanel } from './components/workspace/ProfilePanel';
import { LetterPreview } from './components/workspace/LetterPreview';
import { CommandPalette } from './components/workspace/CommandPalette';
import { MobileDrawer } from './components/workspace/MobileDrawer';
import { EscalateBanner } from './components/workspace/EscalateBanner';
import { ResponseCaptureModal } from './components/workspace/ResponseCaptureModal';
import { AttestationBar } from './components/workspace/AttestationBar';
import { SelectionWizard } from './components/workspace/SelectionWizard';
import { Icon } from './components/ui/Icon';
import { storage } from './utils/storage';

const VIEW_TITLE_KEY: Record<View, keyof import('./locales/en').Translations> = {
  overview: 'viewOverview',
  all: 'viewAll',
  sent: 'viewSent',
  awaiting: 'viewAwaiting',
  attention: 'viewAttention',
};

const SENT_SET = [RequestStatus.SENT, RequestStatus.FOLLOW_UP_SENT];
const ATTENTION_SET = [RequestStatus.IGNORED, RequestStatus.ESCALATION_READY, RequestStatus.ESCALATED];

const INTENT_PACK_IDS = INTENT_PACKS.map((p) => p.id);
const PACK_IDS = SMART_PACKS.map((p) => p.id);

const BROWSE_PAGE = 200;

export default function App() {
  const { profile, setProfile, setCountry, isValid } = useProfile();
  const services = useServices();
  const { advanceLifecycle, setStagedEscalation } = services;
  const { theme, toggle: toggleTheme } = useTheme();
  const t = getTranslations(profile.language);

  const [view, setView] = useState<View>('overview');
  const [preview, setPreview] = useState<Service | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !storage.get<boolean>('seenWelcome'));
  const [escalation, setEscalation] = useState<{
    service: Service; complaint: GeneratedEmail; dpaUrl: string | null; mailtoFailed: boolean; dpaFailed: boolean;
  } | null>(null);
  const [respondingTo, setRespondingTo] = useState<Service | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<number | null>(null);
  // How many browse rows are rendered. Raised by "show more" rather than
  // being a fixed ceiling with no way past it.
  const [browseCap, setBrowseCap] = useState(BROWSE_PAGE);

  useEffect(() => {
    document.documentElement.lang = LANG_TO_BCP47[profile.language] ?? 'en';
  }, [profile.language]);

  useEffect(() => {
    if (!profile.jurisdiction) return;
    advanceLifecycle(profile.jurisdiction);
  }, [profile.jurisdiction, advanceLifecycle]);

  // Cmd/Ctrl+K palette, suppressed while any other modal owns the screen.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) return;
      if (paletteOpen) { e.preventDefault(); setPaletteOpen(false); return; }
      if (profileOpen || preview || escalation || respondingTo || welcomeOpen) return;
      e.preventDefault();
      setPaletteOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [profileOpen, paletteOpen, preview, escalation, respondingTo, welcomeOpen]);

  const closeWelcome = useCallback(() => {
    setWelcomeOpen(false);
    storage.set('seenWelcome', true);
    if (!isValid) setProfileOpen(true);
  }, [isValid]);

  const getServiceEmail = useCallback((s: Service) => {
    const lang = controllerLanguage(s.headquarterCountry, profile.language, !!profile.alwaysWriteInMyLanguage);
    return generateEmail(s.name, profile, {
      category: s.categories[0],
      languageOverride: lang,
      controller: controllerFacts(s),
    });
  }, [profile]);

  const getFollowUpServiceEmail = useCallback((s: Service) => {
    const lang = controllerLanguage(s.headquarterCountry, profile.language, !!profile.alwaysWriteInMyLanguage);
    const style = s.status === RequestStatus.IGNORED ? 'AGGRESSIVE' : profile.templateStyle;
    return generateFollowUpEmail({
      companyName: s.name, fullName: profile.fullName, email: profile.email,
      originalDate: s.lastContacted || new Date().toISOString(), jurisdiction: profile.jurisdiction,
      language: lang, style, dpaName: s.relevantDpa,
    });
  }, [profile]);

  const dispatch = useDispatch({
    selected: services.selected, profile, getEmail: getServiceEmail, getFollowUpEmail: getFollowUpServiceEmail,
    markSent: services.markSent, markFollowUpSent: services.markFollowUpSent, t,
  });

  const handleSend = useCallback((s: Service) => {
    if (!isValid) { setProfileOpen(true); return; }
    dispatch.sendOne(s);
  }, [isValid, dispatch]);

  const handleFollowUp = useCallback((s: Service) => {
    if (!isValid) { setProfileOpen(true); return; }
    dispatch.sendOneFollowUp(s);
  }, [isValid, dispatch]);

  const handleEscalate = useCallback((s: Service) => {
    // A controller with no EU establishment falls outside the one-stop-shop,
    // so under Art. 77 the competent authority is the complainant's own — not
    // the regulator where the company happens to be filed. Without this, a
    // German user chasing a Californian broker was sent to the CPPA, which
    // has no power over their GDPR rights.
    const invokingEuLaw = profile.jurisdiction === 'GDPR' || profile.jurisdiction === 'UK_GDPR';
    const controllerNotEeaEstablished = !isEeaCountry(s.headquarterCountry);
    const ownDpa =
      invokingEuLaw && controllerNotEeaEstablished && profile.country
        ? getDpaForCountry(profile.country)
        : undefined;
    const dpa = ownDpa ?? (s.headquarterCountry ? getDpaForCountry(s.headquarterCountry) : undefined);
    const complaint = generateDpaComplaint({
      companyName: s.name, fullName: profile.fullName, email: profile.email,
      originalDate: s.lastContacted || new Date().toISOString(), jurisdiction: profile.jurisdiction,
      language: dpaLanguage(dpa, profile.language), dpaName: dpa?.name || s.relevantDpa || 'Data Protection Authority',
      companyAddress: s.contacts.postalAddress,
    });
    const dpaUrl = dpa?.complaintUrl && /^https?:\/\//i.test(dpa.complaintUrl) ? dpa.complaintUrl : null;
    let mailtoFailed = false;
    try { window.open(buildMailtoUrl('', complaint)); } catch (err) { console.warn('handleEscalate: mailto threw', err); mailtoFailed = true; }
    let dpaFailed = false;
    if (dpaUrl) {
      try {
        const a = document.createElement('a');
        a.href = dpaUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click();
      } catch (err) { console.warn('handleEscalate: DPA anchor threw', err); dpaFailed = true; }
    }
    setEscalation({ service: s, complaint, dpaUrl, mailtoFailed, dpaFailed });
    setStagedEscalation(s.id, { subject: complaint.subject, body: complaint.body, dpaUrl, stagedAt: new Date().toISOString() });
  }, [profile, setStagedEscalation]);

  const handleResumeEscalation = useCallback((s: Service) => {
    const staged = s.stagedEscalation;
    if (!staged) { handleEscalate(s); return; }
    setEscalation({ service: s, complaint: { subject: staged.subject, body: staged.body }, dpaUrl: staged.dpaUrl, mailtoFailed: false, dpaFailed: false });
  }, [handleEscalate]);

  const confirmEscalation = useCallback(() => {
    if (!escalation) return;
    services.markEscalated(escalation.service.id);
    setEscalation(null);
  }, [escalation, services.markEscalated]);

  const handleOpenResponseCapture = useCallback((id: string) => {
    const target = services.services.find((s) => s.id === id);
    if (target) setRespondingTo(target);
  }, [services.services]);

  const { captureResponse } = services;
  const handleSaveResponse = useCallback((replyText: string, classification: ResponseStatus) => {
    if (!respondingTo) return;
    captureResponse(respondingTo.id, replyText, classification);
  }, [respondingTo, captureResponse]);

  const handleJumpToService = useCallback((id: string) => {
    services.setFilter({ search: '' }); // else a live search filter can hide the jump target
    setView('overview');
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-service-id="${CSS.escape(id)}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [services]);

  const breakdown = useMemo(() => {
    const c = (st: RequestStatus) => services.selected.filter((s) => s.status === st).length;
    return {
      pending: c(RequestStatus.PENDING),
      sent: c(RequestStatus.SENT) + c(RequestStatus.FOLLOW_UP_SENT),
      waiting: c(RequestStatus.WAITING),
      resolved: c(RequestStatus.RESPONDED) + c(RequestStatus.PARTIAL) + c(RequestStatus.CLOSED),
      attention: c(RequestStatus.IGNORED) + c(RequestStatus.ESCALATION_READY) + c(RequestStatus.ESCALATED),
    };
  }, [services.selected]);

  const overviewStats: OverviewStats = {
    sent: breakdown.sent, awaiting: breakdown.waiting, resolved: breakdown.resolved, attention: breakdown.attention,
    inFlight: breakdown.sent + breakdown.waiting, notStarted: breakdown.pending, total: services.selected.length,
  };

  const q = services.filter.search.trim().toLowerCase();
  // Same name-or-brand rule browse uses, so a company you found by its brand
  // is still findable by that brand once it's on your list.
  const matchName = (s: Service) =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    (s.alsoKnownAs ?? []).some((b) => b.toLowerCase().includes(q));

  const manageRows = useMemo(() => {
    let rows = services.selected;
    if (view === 'sent') rows = rows.filter((s) => SENT_SET.includes(s.status));
    else if (view === 'awaiting') rows = rows.filter((s) => s.status === RequestStatus.WAITING);
    else if (view === 'attention') rows = rows.filter((s) => ATTENTION_SET.includes(s.status));
    return rows.filter(matchName);
  }, [services.selected, view, q]);

  const handleSelectPack = useCallback((id: SmartPackId) => {
    const pack = [...INTENT_PACKS, ...SMART_PACKS].find((p) => p.id === id);
    if (pack) services.selectByPredicate(pack.match);
    setView('overview');
  }, [services]);

  const { selectMany, filteredUnselected } = services;
  const handleSelectShown = useCallback(() => {
    const added = selectMany(filteredUnselected.slice(0, browseCap).map((s) => s.id));
    setAddedNotice(added);
  }, [selectMany, filteredUnselected, browseCap]);

  // A stale cap would keep showing 600 rows after the user narrows the search
  // to twelve, so every filter change starts the count over.
  useEffect(() => {
    setBrowseCap(BROWSE_PAGE);
  }, [services.filter]);

  const rowAction = (s: Service) => {
    const cls = 'inline-flex items-center gap-1 text-[13px] rounded-[7px] px-3 py-1.5 border border-rule-strong text-ink-secondary hover:border-accent hover:text-accent transition-colors';
    switch (s.status) {
      case RequestStatus.PENDING:
      case RequestStatus.SKIPPED:
        return <button className={cls} onClick={() => handleSend(s)}>Send →</button>;
      case RequestStatus.SENT:
      case RequestStatus.WAITING:
      case RequestStatus.FOLLOW_UP_SENT:
        return <button className={cls} onClick={() => handleFollowUp(s)}>Follow up</button>;
      case RequestStatus.IGNORED:
      case RequestStatus.ESCALATION_READY:
        return <button className={cls} onClick={() => (s.stagedEscalation ? handleResumeEscalation(s) : handleEscalate(s))}>Escalate</button>;
      case RequestStatus.ESCALATED:
        return <button className={cls} onClick={() => handleOpenResponseCapture(s.id)}>Log reply</button>;
      case RequestStatus.RESPONDED:
      case RequestStatus.PARTIAL:
        return <button className={cls} onClick={() => services.closeRequest(s.id)}>Close</button>;
      default:
        return null;
    }
  };

  // Counted over unselected rows so the number is what the pack would add,
  // not how many exist. Recomputed only when the service list itself changes.
  const packLinks = useMemo(() => {
    const build = (ids: SmartPackId[]) =>
      ids.map((id) => {
        const pack = [...INTENT_PACKS, ...SMART_PACKS].find((x) => x.id === id);
        return {
          id,
          label: t.packCopy[id].label,
          count: pack ? services.services.filter((s) => !s.selected && pack.match(s)).length : 0,
        };
      });
    return { intent: build(INTENT_PACK_IDS), smart: build(PACK_IDS) };
  }, [services.services, t]);

  const counts = {
    total: services.services.length,
    selected: services.selected.length,
    sent: breakdown.sent,
    awaiting: breakdown.waiting,
    attention: breakdown.attention,
  };

  const browse = view === 'all';
  const rows = browse ? services.filteredUnselected : manageRows;

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-[252px_1fr] bg-canvas text-ink-primary overflow-hidden">
      <Sidebar
        view={view} onSetView={setView} counts={counts}
        intentPacks={packLinks.intent} packs={packLinks.smart} onSelectPack={handleSelectPack}
        onStartWizard={() => setWizardOpen(true)}
        profile={profile} onOpenProfile={() => setProfileOpen(true)}
        t={t}
      />

      <main className="flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-5 md:px-7 py-3.5 border-b border-rule">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="lg:hidden w-[34px] h-[34px] grid place-items-center rounded-[9px] border border-rule-strong bg-canvas-elevated shadow-sm text-ink-secondary hover:text-ink-primary hover:border-ink-tertiary transition-colors shrink-0"
          >
            <Icon name="menu" size={16} />
          </button>
          <h1 className="text-[19px] font-semibold tracking-[-0.025em]">{t[VIEW_TITLE_KEY[view]] as string}</h1>
          {browse && <span className="text-[13px] text-ink-tertiary hidden sm:inline">{services.filteredUnselected.length.toLocaleString()} companies</span>}
          <div className="flex-1" />
          <label className="flex items-center gap-2 bg-canvas-elevated border border-rule-strong rounded-[9px] px-3 py-2 shadow-sm w-[180px] md:w-[240px] focus-within:border-accent transition-colors">
            <Icon name="search" size={14} className="text-ink-tertiary shrink-0" />
            <input
              value={services.filter.search}
              onChange={(e) => services.setFilter({ search: e.target.value })}
              placeholder={t.searchPlaceholder}
              title={t.searchSyntaxHint}
              className="flex-1 bg-transparent outline-none text-[13.5px] min-w-0"
              aria-label="Search companies"
            />
          </label>
          <button
            type="button" onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.topbarThemeToLight : t.topbarThemeToDark}
            className="w-[34px] h-[34px] grid place-items-center rounded-[9px] border border-rule-strong bg-canvas-elevated shadow-sm text-ink-secondary hover:text-ink-primary hover:border-ink-tertiary transition-colors shrink-0"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
        </header>

        {services.persistFailed && (
          <div
            role="alert"
            className="px-5 md:px-7 py-2.5 bg-critical-wash border-b border-rule text-[13.5px] text-critical"
          >
            {t.storageFailed}
          </div>
        )}

        {addedNotice !== null && (
          <div
            role="status"
            className="flex items-center gap-3 px-5 md:px-7 py-2.5 bg-accent-soft border-b border-rule text-[13.5px] text-accent"
          >
            <span>{t.wizardAdded(addedNotice)}</span>
            <button
              type="button"
              onClick={() => setAddedNotice(null)}
              className="ml-auto text-ink-tertiary hover:text-ink-primary"
            >
              {t.dispatchErrorDismiss}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6">
          {view === 'overview' && <Overview stats={overviewStats} t={t} />}

          {dispatch.lastError && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-[10px] bg-critical-wash border border-critical/30 text-[13.5px]">
              <span className="text-critical">{dispatch.lastError}</span>
              <button className="ml-auto text-ink-tertiary hover:text-ink-primary" onClick={dispatch.clearError}>Dismiss</button>
            </div>
          )}

          <div className="bg-canvas-elevated border border-rule rounded-[14px] shadow-sm overflow-hidden">
            {!browse && services.selected.length > 0 && (
              <div className="flex items-center gap-3.5 px-4 py-2.5 bg-accent-soft border-b border-rule">
                <span className="text-[13.5px] font-medium text-accent">{t.bulkShown(manageRows.length, services.selected.length)}</span>
                <div className="flex-1" />
                <button className="text-[13px] text-ink-secondary hover:text-ink-primary disabled:opacity-40" disabled={!isValid || dispatch.isZipping || dispatch.pendingQueue.length === 0} onClick={dispatch.downloadAll}>{t.bulkSaveEml}</button>
                <button className="text-[13px] text-ink-secondary hover:text-ink-primary" onClick={services.deselectAll}>{t.bulkDeselectAll}</button>
                <button
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 text-[13.5px] font-medium shadow-sm disabled:opacity-40 transition-colors"
                  disabled={!isValid || dispatch.pendingQueue.length === 0 || !!dispatch.pendingAttestation}
                  onClick={dispatch.sendNext}
                >
                  <Icon name="send" size={14} /> {t.bulkSend(dispatch.pendingQueue.length)}
                </button>
              </div>
            )}

            {dispatch.pendingAttestation && (
              <AttestationBar
                name={services.selected.find((s) => s.id === dispatch.pendingAttestation!.serviceId)?.name ?? 'this request'}
                popupBlocked={dispatch.pendingAttestation.popupBlocked}
                onConfirm={dispatch.confirmSend}
                onReject={dispatch.rejectSend}
                t={t}
              />
            )}

            <TargetTable
              rows={rows}
              mode={browse ? 'browse' : 'manage'}
              cap={browse ? browseCap : undefined}
              onShowMore={browse ? () => setBrowseCap((c) => c + BROWSE_PAGE) : undefined}
              onSelectShown={browse ? handleSelectShown : undefined}
              t={t}
              onToggle={services.toggle}
              onPreview={setPreview}
              renderAction={browse ? undefined : rowAction}
              empty={
                <div>
                  <p className="text-[20px] font-semibold tracking-[-0.02em]">{browse ? t.emptyBrowse : t.emptyManage}</p>
                  <p className="text-ink-secondary mt-2 text-[14px] max-w-[34ch]">
                    {browse ? t.emptyBrowseHint : t.emptyManageHint}
                  </p>
                  {!browse && (
                    <button onClick={() => setView('all')} className="mt-4 inline-flex items-center gap-2 text-accent text-[13.5px] font-medium">
                      <Icon name="plus" size={15} /> {t.emptyBrowseAction}
                    </button>
                  )}
                </div>
              }
            />
          </div>
        </div>

        <Footer t={t} datasetVerifiedAt={services.datasetVerifiedAt} />
      </main>

      <MobileDrawer
        isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}
        view={view} onSetView={setView} counts={counts}
        intentPacks={packLinks.intent} packs={packLinks.smart} onSelectPack={handleSelectPack}
        onStartWizard={() => { setDrawerOpen(false); setWizardOpen(true); }}
        profile={profile} onOpenProfile={() => setProfileOpen(true)}
        t={t}
      />
      <WelcomeModal isOpen={welcomeOpen} onClose={closeWelcome} />
      <SelectionWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        services={services.services}
        filter={services.filter}
        setFilter={services.setFilter}
        resetFilter={services.resetFilter}
        candidates={services.filteredUnselected}
        selectMany={services.selectMany}
        profile={profile}
        setCountry={setCountry}
        onDone={(added) => {
          setWizardOpen(false);
          setAddedNotice(added);
          setView('overview');
        }}
        t={t}
      />
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} setProfile={setProfile} setCountry={setCountry} t={t} />
      <LetterPreview service={preview} profile={profile} onClose={() => setPreview(null)} onSend={handleSend} t={t} />
      <ResponseCaptureModal isOpen={!!respondingTo} service={respondingTo} onClose={() => setRespondingTo(null)} onSubmit={handleSaveResponse} t={t} />
      <EscalateBanner
        isOpen={!!escalation} onClose={() => setEscalation(null)} service={escalation?.service ?? null}
        complaint={escalation?.complaint ?? null} dpaUrl={escalation?.dpaUrl ?? null}
        mailtoFailed={escalation?.mailtoFailed ?? false} dpaFailed={escalation?.dpaFailed ?? false}
        onConfirm={confirmEscalation} t={t}
      />
      <CommandPalette
        isOpen={paletteOpen} onClose={() => setPaletteOpen(false)}
        selected={services.selected} unselected={services.filteredUnselected}
        onJumpToService={handleJumpToService} onAddToSelection={services.toggle}
        onOpenProfile={() => setProfileOpen(true)} onToggleTheme={toggleTheme} theme={theme} t={t}
      />
    </div>
  );
}
