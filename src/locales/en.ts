export const en = {
  // App
  appName: 'Delete Me Now',
  appTagline: 'Automated rights enactment',
  footerQuote: 'Privacy is a right. Treat it like one.',
  resetData: 'Reset everything',
  resetConfirm: 'This will clear all your data and progress. Are you sure?',

  // Steps
  stepProfile: 'Profile',
  stepDiscovery: 'Discovery',
  stepExecution: 'Execution',

  // Profile Step
  profileTitle: 'Your details',
  profileSubtitle: 'These go in your emails. They stay in your browser.',
  profileNotice:
    'This tool generates Article 17 erasure requests. Your data stays local. We make the drafts, you send them.',
  fieldFullName: 'Full name',
  fieldEmail: 'Email address',
  fieldEmailNote: 'Companies will reply here.',
  fieldEmailInvalid: 'That doesn’t look like a valid email.',
  fieldAddress: 'Address',
  fieldAddressNote: 'Adds credibility. Helps companies locate your record.',
  fieldPhone: 'Phone',
  fieldLanguage: 'Email language',
  intentLabel: 'What do you want to do?',
  intentErasureLabel: 'Delete my data',
  intentErasureNote: 'Ask each company to erase your personal data under Article 17.',
  intentSarLabel: 'See what they have first',
  intentSarNote: 'Ask for a copy of your data under Article 15 first, then decide what to delete. The smarter legal order.',
  intentSarUnavailable: 'Not yet available for this jurisdiction.',
  alwaysMyLanguageLabel: 'Always write in my chosen language',
  alwaysMyLanguageNote: "Off by default: each letter goes out in the company's home-country language (German company, German letter). Tick to force your language.",

  genderLabel: 'Gender',
  genderNote: 'Shapes the German, French and Spanish self-references in your letters (e.g. Bürger / Bürgerin, résident / résidente, cómodo / cómoda). No effect on English or Italian.',
  genderFeminine: 'Feminine',
  genderMasculine: 'Masculine',
  genderNonBinary: 'Non-binary',
  previewLanguageController: (lang: string, country: string) => `Writing in ${lang}. Company HQ is ${country}.`,
  previewLanguageOverride: (lang: string) => `Writing in ${lang}. Always-my-language is on.`,
  previewLanguageFallback: (lang: string) => `Writing in ${lang}. No company HQ on record.`,
  fieldJurisdiction: 'Privacy law',
  fieldJurisdictionNote: 'Which regulation applies to you?',
  euCitizenLabel: 'I am an EU / EEA resident',
  euCitizenNote:
    'Your requests will invoke Article 17 (erasure) or Article 15 (access), depending on what you picked above. Companies have 30 days to respond, extendable to 90 for complex cases.',
  templateStyleLabel: 'Default email tone',
  templateSimple: 'Friendly. For companies you still kind of like.',
  templateLegal: 'Legal. Professional and firm.',
  templateAggressive: 'Aggressive. For data brokers and repeat offenders.',
  proceedToDiscovery: 'Pick your targets →',

  // Discovery Step
  discoveryTitle: 'Select targets',
  discoverySubtitle: 'Choose who gets a deletion request.',
  searchPlaceholder: 'Search companies...',
  searchSyntaxHint: 'e.g. tag:broker · region:DE · risk:high',
  // Tri-state curation breadth. Standard is the default; well-known is
  // the "companies you've heard of" short-circuit; broad opts in the
  // long tail of brokers + adtech.
  breadthLabel: 'Show',
  breadthVerified: 'Well-known',
  breadthStandard: 'Standard',
  breadthSpeculative: 'Broad',
  breadthHint: 'Standard hides obvious data brokers and ad-tech vendors. Switch to Broad to send precautionary requests to those too.',
  categoryAll: 'All categories',
  regionAll: 'All regions',
  speculativeLabel: "Include companies I may not have an account with",
  speculativeNote:
    'Send precautionary requests to data brokers who may have your data even without a direct relationship. Better safe than sorry.',
  responsibleUseNote:
    "This is a scalpel, not a shotgun. Speculative mode is for data brokers, not your local bakery. Don't blast small businesses who clearly don't have your data.",
  broadModeAdvisory: 'Broad mode active',
  orphanLabel: 'removed upstream',
  orphanHint: 'This entry is no longer in the bundled dataset. Your saved tracker remains, but no contact updates will reach it.',
  dataStorageTitle: 'Where the info here is stored',
  dataStorageBody1:
    "It's saved like a bookmark. Close the tab, restart your laptop, come back next month, still here.",
  dataStorageBody2:
    "A file on your machine, nothing else. Clear your browser data, switch device, or use private mode, and the file's gone with it. The Reset button does the same on purpose.",
  smartPacksLabel: 'Quick select',
  packStandard: 'Standard pack',
  packStandardDesc: '~200 top verified targets',
  packBrokers: 'Data brokers',
  packBrokersDesc: 'US and global broker list',
  packEuAdtech: 'EU ad-tech',
  packEuAdtechDesc: 'GDPR-relevant ad networks',
  packSocial: 'Social media',
  packSocialDesc: 'Major platforms',
  selectAll: 'Select all',
  deselectAll: 'Deselect all',
  importList: 'Import CSV',
  importHelpTitle: 'Import format',
  importHelpCsv: 'CSV/TXT: one row per company. Columns: Name, Email, Category (optional)',
  importHelpJson: 'JSON: array of objects with name and email fields',
  directoryLabel: 'Directory',
  directoryAvailable: 'available',
  directoryInCaseFile: 'in case file',
  queueLabel: 'Queue',
  emptyDirectory: 'No matching entries.',
  emptyQueue: 'Queue is empty. Add companies from the directory.',
  noEmailWarning: 'No email on record. Needs a paper letter, or remove it.',
  proceedToExecution: 'Proceed to execution →',
  selectedCount: (n: number) => `${n} selected`,

  // Execution
  executionTitle: 'Send requests',
  executionSubtitle: "Let's get this done.",
  statsSent: 'Sent',
  statsPending: 'Pending',
  statsSkipped: 'Skipped',
  tabMailClient: 'Email client',
  tabGmail: 'Gmail',
  tabDownload: 'Download',
  toneLabel: 'Email tone',
  toneSimple: 'Friendly',
  toneLegal: 'Legal',
  toneAggressive: 'Aggressive',
  actionOpenDraft: 'Open draft',
  actionPreview: 'Preview',
  actionSkip: 'Skip',
  actionSendNext: 'Open next draft',
  actionDownloadAll: 'Download all (ZIP)',
  actionDownloadSingle: 'Download .eml',
  previewTitle: 'Email preview',
  previewClose: 'Close',
  allDone: 'Drafts ready. Your turn.',

  // Footer
  footerLocalOnly: 'Local only.',
  footerCallsLabel: 'network calls made this session.',
  footerVerifyHint: 'Verify in your DevTools, Network panel.',
  footerDatasetVerified: (date: string) => `Dataset verified ${date}.`,

  // Recommendations
  recommendedTitle: 'Recommended for you',
  recommendedAddAll: 'Add all recommended',
  recommendedCategoryAffinity: 'You selected {count} {category} services. Here are more:',

  // Jurisdiction Explainers
  jurisdictionExplainerGDPR: "Under GDPR, companies have 30 days to respond, extendable once to 90 for complex cases. Fines: up to 4% of global revenue. Not that anyone's counting.",
  jurisdictionExplainerCCPA: 'CCPA gives you 45 days. The California Privacy Protection Agency handles complaints.',
  jurisdictionExplainerUK_GDPR: 'Same as EU GDPR in practice. The ICO is your supervisory authority.',
  jurisdictionExplainerLGPD: "Brazil's LGPD gives 15 days for access requests. Erasure has no statutory deadline, but the ANPD expects no undue delay.",

  // Country field
  fieldCountry: 'Country',
  fieldCountryNote: 'Helps us recommend services relevant to you.',

  // Placeholders (localized examples)
  placeholderFullName: 'Jane Smith',
  placeholderEmail: 'jane@example.com',
  placeholderAddress: '12 Garden Lane, Manchester',
  placeholderPhone: '+44 7700 900000',

  // --- Workspace ---

  // TopBar
  topbarInFlight: 'in flight',
  topbarOverdue: 'overdue',
  topbarNextAction: (name: string) => `next: ${name}`,
  topbarSetProfile: 'Add your identity →',
  topbarThemeToLight: 'Switch to light theme',
  topbarThemeToDark: 'Switch to dark theme',

  // CaseFile, header + sections
  caseFileTitle: 'Your case file',
  caseFileSubtitle:
    'Every company you are asking to delete you, or to disclose what they hold. Pending and responded items at the top need your input. The quiet ones sit below.',
  sectionPending: 'Ready to send',
  sectionPendingNote: 'Draft letters waiting for your click.',
  sectionInFlight: 'In flight',
  sectionInFlightNote: 'Clock is on them.',
  sectionResponded: 'They responded',
  sectionRespondedNote: 'Decide how to close these.',
  sectionClosed: 'Closed',
  sectionClosedNote: 'Kept here for your records.',

  // CaseFile, empty state
  emptyCaseTitle: 'Nothing in your case file yet.',
  emptyCaseBody:
    'Pick companies from the directory. Add your name and email in your profile. Your drafts will appear here, ready to send.',
  emptyCaseHint: 'Start with the directory →',

  // CaseFile, escalation hero
  heroEscalationLabel: 'Art. 77 · Escalation ready',
  heroEscalationTitle: (n: number) =>
    n === 1
      ? '1 company ignored you. File a complaint.'
      : `${n} companies ignored you. File complaints.`,
  heroEscalationBody:
    "The legal reply window passed. They didn't answer. Time to complain to the regulator. This is where they stop getting away with it.",
  heroEscalationAction: 'File complaint',

  // Entry, time lines
  lineSent: (d: number) => (d === 0 ? 'Draft opened today.' : d === 1 ? 'Draft opened yesterday.' : `Draft opened ${d} days ago.`),
  lineDeadline: (d: number) => (d === 1 ? 'They have 1 day left to respond.' : `They have ${d} days left to respond.`),
  lineOverdue: (d: number) =>
    d === 0
      ? 'Deadline reached today.'
      : d === 1
      ? 'Overdue by 1 day.'
      : `Overdue by ${d} days.`,

  // Entry, actions
  actionMarkResponded: 'Mark responded',
  actionFollowUp: 'Send follow-up',
  // Same handler as actionFollowUp; different label discloses the
  // automatic tone escalation when the controller has been ignoring you.
  actionFollowUpFirm: 'Send firm follow-up',
  actionEscalateResume: 'Resume escalation',
  escalationResumeHint: 'drafted, not filed',
  actionClose: 'Close',
  actionRemove: 'Remove',

  // Status badges
  badgePending: 'pending',
  badgeSent: 'draft sent',
  badgeWaiting: 'waiting',
  badgeFollowUp: 'follow-up sent',
  badgeResponded: 'responded',
  badgePartial: 'partial',
  badgeIgnored: 'ignored',
  badgeEscalationReady: 'escalate',
  badgeEscalated: 'escalated',
  badgeClosed: 'closed',
  badgeSkipped: 'skipped',

  // Companion rail
  companionRailLabel: 'Identity and dispatch',
  railIdentity: 'Identity',
  railIdentityEmpty: 'Add your name and email before sending anything. These are the only details that go into your letters.',
  railEditIdentity: 'Edit',
  railOpenProfile: 'Set up identity',
  railPosture: 'Posture',
  railPostureIntent: 'Intent',
  railPostureJurisdiction: 'Law',
  railPostureTone: 'Tone',
  railDispatch: 'Dispatch',
  railDispatchEmpty: 'No drafts ready. Add a company and your identity, and drafts will land here.',
  railDispatchSendHint: 'open',
  railDispatchMore: (n: number) => `+${n} more`,

  // Dispatch — send-via picker
  dispatchSendViaLabel: 'Send via',
  dispatchSendViaMail: 'Mail client',
  dispatchSendViaGmail: 'Gmail',
  dispatchSendViaEml: 'Save .eml',
  dispatchSendNext: 'Send next →',
  dispatchSendNextWith: (n: number) => `Send next → (${n})`,
  dispatchDownloadAll: 'Download all (.zip)',
  dispatchDownloadingZip: 'Packing…',
  dispatchSingleEml: 'Save .eml',

  // Dispatch — attestation prompt
  attestationPromptMail: 'Did your mail client open?',
  attestationPromptGmail: 'Did the Gmail compose tab open?',
  attestationPromptEml: 'Did the .eml file save?',
  attestationPopupBlocked: 'Your browser blocked the popup. Allow popups for this site, then click No, retry.',
  attestationYes: 'Yes, sent',
  attestationNo: 'No, retry',

  // Dispatch — batch result
  downloadBatchSummary: (ok: number, total: number) =>
    ok === total
      ? `${ok} of ${total} packed.`
      : `${ok} of ${total} packed. ${total - ok} failed. Re-run Download all to retry.`,
  downloadFailedTag: 'failed',
  downloadFailedDismiss: 'Dismiss',

  // Dispatch — stats strip
  railProgressLabel: 'Progress',
  statPending: 'pending',
  statInFlight: 'in flight',
  statResponded: 'responded',
  statEscalation: 'escalate',
  statClosed: 'closed',

  // All-done banner (no pending, no escalation, at least one closed/responded)
  allDoneTitle: 'All clear. Your part is done.',
  allDoneBody: "Every letter on your list is out, answered, or closed. You can come back later. Anything new will surface here. Or download your case file as proof.",
  allDoneStampLabel: 'PROCESSED',

  // Per-row save .eml action
  actionSaveEml: 'Save .eml',

  // Per-service notes (free-text local audit trail)
  notesLabel: 'Your notes',
  notesPlaceholder: 'e.g. they asked for ID copy, claimed exemption under Art. 23',
  notesAddCta: 'Add note',
  notesEditCta: 'Edit',
  notesSave: 'Save',
  notesCancel: 'Cancel',

  // Response capture modal
  responseCaptureTitle: 'Capture their reply',
  responseCaptureClose: 'Close',
  responseCaptureBody: (name: string) =>
    `Paste what ${name} sent back. The text stays local, on this device, and helps you remember the case six months from now.`,
  responseCaptureClassifyLabel: 'How did they respond?',
  responseCaptureClassify: {
    fulfilled: 'Fulfilled',
    partial: 'Partial',
    refused: 'Refused',
    'no-response': 'No reply',
  } as Record<'fulfilled' | 'partial' | 'refused' | 'no-response', string>,
  responseCaptureNotesLabel: 'Reply text or notes',
  responseCaptureNotesPlaceholder: 'Paste their reply here, or note what happened.',
  responseCaptureNotesHint: 'Stored locally. Never sent.',
  responseCaptureCancel: 'Cancel',
  responseCaptureSave: 'Save reply',
  actionCaptureResponse: 'Capture reply →',

  // Escalation handoff banner — popup-block tolerant
  escalateBlockedTitle: 'File the complaint',
  escalateBlockedClose: 'Close',
  escalateBlockedBody: (name: string) =>
    `We tried to open your mail client and the regulator's complaint page for ${name}. If a window didn't open, your browser blocked the popups. Copy the draft and the link below, send the email, lodge the complaint, then mark this filed.`,
  escalateBlockedDraftLabel: 'Mailto draft',
  escalateBlockedDpaLabel: 'Regulator complaint URL',
  escalateBlockedCopyDraft: 'Copy draft',
  escalateBlockedCopyDpa: 'Copy URL',
  escalateBlockedCopied: 'Copied',
  escalateBlockedNotYet: 'Not yet',
  escalateBlockedConfirm: 'Mark as filed',
  escalateBlockedCopyFailed: 'Copy blocked. Select the text and use Cmd/Ctrl+C.',
  escalateBlockedMailtoFailed: "Your mail client didn't open. Copy the draft and paste into webmail.",
  escalateBlockedDpaFailed: "The regulator's page didn't open. Copy the URL and paste into a new tab.",

  // Dispatch surface error
  dispatchErrorPrefix: 'Dispatch error',
  dispatchErrorDismiss: 'Dismiss',
  dispatchErrorOpening: "Couldn't open the message",
  dispatchErrorPackaging: "Couldn't package the batch",
  dispatchErrorSaving: "Couldn't save the file",

  // Big-batch advisory — private mail providers (Gmail, GMX, ProtonMail,
  // Outlook personal) rate-limit outbound per hour. 30-50 letters per batch
  // is the comfortable ceiling before they start flagging your account.
  dispatchBatchAdvisory: (n: number) =>
    `Heads up: ${n} drafts queued. Private mail providers cap outbound per hour. Send in batches of 30 to 50 to avoid being flagged as spam.`,

  // Bulk re-ask — IGNORED queue gets a firmer (AGGRESSIVE) follow-up.
  dispatchReaskTitle: 'Never replied',
  dispatchReaskHint: 'Controllers who never replied get a firmer second letter, one click per send.',
  dispatchReaskNext: (n: number) => `Send firm follow-up → (${n})`,
  dispatchProfileGate: 'Complete your profile first',
  attestationKindFollowUp: 'Follow-up',

  railNextDeadlines: 'Next deadlines',
  railRemaining: (d: number) => (d === 1 ? '1 day left' : `${d} days left`),
  railOverdue: (d: number) => (d === 0 ? 'due today' : d === 1 ? '1 day overdue' : `${d} days overdue`),

  // Letter preview
  previewTitleErasure: 'Erasure draft',
  previewTitleSar: 'Access request draft',
  previewOpenInMailClient: 'Open in mail client',
  previewDraftBadge: 'draft',
  previewFieldTo: 'To',
  previewFieldFrom: 'From',
  previewFieldSubject: 'Subject',

  // Profile modal
  profileDone: 'Back to case file',

  // Directory list
  directoryOverflowHint: (n: number) => `${n} more. Narrow your search.`,
  directoryBulkAdded: (n: number) => `${n} added to case file`,
  actionBarLabel: 'Bulk actions',
  actionBarSelectedCount: (n: number) => `${n} selected`,
  actionBarSendAll: 'Send all',
  actionBarSaveBatch: 'Save .eml batch',
  actionBarDeselectAll: 'Deselect',

  // Command palette (Cmd/Ctrl+K)
  paletteTitle: 'Command palette',
  palettePlaceholder: 'Jump to a company, or type an action...',
  paletteEmpty: 'Nothing matches. Try fewer letters.',
  paletteJumpToHint: 'jump',
  paletteAddToCaseFileHint: 'add',
  paletteTagAction: 'do',
  paletteTagJump: 'open',
  paletteTagAdd: 'add',
  paletteTagRecall: 'list',
  paletteActionOpenProfile: 'Open profile',
  paletteActionOpenProfileHint: 'edit identity',
  paletteActionDarkTheme: 'Switch to dark theme',
  paletteActionLightTheme: 'Switch to light theme',
  paletteActionThemeHint: 'theme',
  paletteManageSearches: 'Manage saved lists',
  paletteManageSearchesHint: 'rename, delete',
  paletteRecallSearch: (name: string) => `Recall list: ${name}`,
  paletteRecallSearchHint: (n: number) => `${n} selected`,
  paletteFootHint: '↑↓ to move · ↵ to choose',
  paletteFootClose: 'close',

  // Saved searches (filter + selection snapshots, local-only)
  savedSearchOpenManager: 'Saved lists',
  savedSearchCount: (n: number) => `${n} saved`,
  savedSearchesTitle: 'Saved lists',
  savedSearchesListLabel: 'Your lists',
  savedSearchesEmpty: 'Nothing saved yet. Name the view above and it lands here.',
  savedSearchSaveLabel: 'Save current view',
  savedSearchSaveBody: (n: number) =>
    n === 0
      ? 'Save your current filters as a named list. Recall it from this modal or the command palette.'
      : `Save your filters and ${n} selected ${n === 1 ? 'company' : 'companies'} as a named list.`,
  savedSearchNamePlaceholder: 'EU sweep, mum’s brokers, work email scrub...',
  savedSearchSaveAction: 'Save',
  savedSearchEntryCount: (n: number) => (n === 1 ? '1 selected' : `${n} selected`),
  savedSearchRename: 'Rename',
  savedSearchDelete: 'Delete',
  savedSearchDeleteConfirm: 'Sure?',

  // Faceted filter rail
  facetsLabel: 'Narrow',
  facetJurisdiction: 'Jurisdiction',
  facetJurisdictionAll: 'All',
  facetJurisdictionGdpr: 'GDPR',
  facetJurisdictionUk: 'UK GDPR',
  facetJurisdictionCcpa: 'CCPA',
  facetJurisdictionLgpd: 'LGPD',
  facetJurisdictionOther: 'Other',
  facetContact: 'Reach',
  facetContactAny: 'Any',
  facetContactDpo: 'Has DPO',
  facetContactPrivacy: 'Privacy email',
  facetContactPostal: 'Postal',
  facetContactHasAny: 'Has any',
  facetConfidence: 'Confidence',
  facetMultiHint: 'any of',
  facetConfidenceVerified: 'Verified',
  facetConfidenceCommunity: 'Community',
  facetConfidenceInferred: 'Inferred',
  facetConfidenceManual: 'Manual',
  facetRisk: 'Type',
  facetRiskAll: 'All',
  facetRiskBroker: 'Broker',
  facetRiskAdTech: 'Ad tech',
  facetRiskConsumer: 'Service',
  facetClearAll: 'Clear filters',
};

export type Translations = typeof en;
