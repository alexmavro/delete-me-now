// === Request Lifecycle ===

export enum RequestStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  SKIPPED = 'SKIPPED',
  WAITING = 'WAITING',
  RESPONDED = 'RESPONDED',
  PARTIAL = 'PARTIAL',
  IGNORED = 'IGNORED',
  FOLLOW_UP_SENT = 'FOLLOW_UP_SENT',
  ESCALATION_READY = 'ESCALATION_READY',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

export type ResponseStatus = 'fulfilled' | 'partial' | 'refused' | 'no-response';

// === Geography ===

export type Region =
  | 'Global'
  | 'EU'
  | 'DE' | 'FR' | 'IT' | 'ES' | 'NL' | 'BE' | 'AT' | 'PL' | 'SE' | 'DK'
  | 'FI' | 'IE' | 'PT' | 'GR' | 'CZ' | 'RO' | 'HU' | 'HR' | 'SK' | 'SI'
  | 'BG' | 'LT' | 'LV' | 'EE' | 'CY' | 'LU' | 'MT'
  | 'US' | 'UK' | 'BR' | 'CH' | 'NO' | 'IS' | 'LI';

// EU member states only. IS, LI, NO, CH are EEA/adjacent but not EU;
// kept out of this set so "is-EU-citizen" logic stays strict. GDPR via EEA
// applies to IS/LI/NO through the EEA Agreement; those users select jurisdiction=GDPR manually.
export const EU_REGIONS: Region[] = [
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
  'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'HR', 'SK', 'SI',
  'BG', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT',
];

// === Service Classification ===

// Every value below is carried by at least one row in the shipped dataset,
// except `Imported`, which only ever comes from a service the user adds by
// hand. A category nothing can match is a filter that always returns empty
// and a pack that always selects nothing, so new values earn their place by
// having an upstream tag behind them.
export type ServiceCategory =
  | 'Social'
  | 'Shopping'
  | 'Utility'
  | 'Data Broker'
  | 'Ad Tech'
  | 'Finance'
  | 'Credit Agency'
  | 'Debt Collection'
  | 'Insurance'
  | 'Travel'
  | 'Telecom'
  | 'Health'
  | 'Public Body'
  | 'Political Party'
  | 'Education'
  | 'Religious'
  | 'Nonprofit'
  | 'Entertainment'
  | 'Uncategorised'
  | 'Imported';

export type ConfidenceLevel = 'Verified' | 'Community' | 'Inferred' | 'Manual';

export type DataSource =
  | 'datarequests'
  | 'exodus'
  | 'easyprivacy'
  | 'manual'
  // California Attorney General data-broker registry (Cal. Civ. Code §1798.99.82).
  // Public record under California Public Records Act. Annually refreshed.
  | 'ca-broker-registry'
  // Vermont Secretary of State data-broker registry (Vt. Stat. tit. 9 §2446).
  // Public record. Annually refreshed.
  | 'vt-broker-registry'
  // Curator-maintained EEA data-broker shortlist sourced from public DPA
  // enforcement actions and GDPRhub case index. Community confidence.
  | 'eu-brokers'
  // Privacy Rights Clearinghouse data-broker list (US-focused, hand-
  // maintained since 2014 at privacyrights.org/data-brokers). Community
  // confidence — not a statutory disclosure obligation, but a long-running
  // public-interest dataset with stable curation.
  | 'prc-brokers';

// === Service: Static Data (from JSON import) ===

export interface ServiceContacts {
  dpo?: string;
  privacy?: string;
  general?: string;
  postalAddress?: string;
}

export interface ServiceRecord {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  registrationId?: string;
  url?: string;
  privacyPolicyUrl?: string;
  categories: ServiceCategory[];
  regions: Region[];
  headquarterCountry?: string;
  contacts: ServiceContacts;
  confidence: ConfidenceLevel;
  source: DataSource;
  lastVerified?: string;
  relevantDpa?: string;
  dpaComplaintUrl?: string;
  /** Brands this entity operates. Searched alongside `name`. */
  alsoKnownAs?: string[];
  /** This company demands proof of identity before it will act. */
  needsIdDocument?: boolean;
  /** The request route the company filed with its regulator, quoted verbatim. */
  declaredRequestRoute?: string;
  /** Which register that declaration sits in. */
  registryName?: string;
  registeredSince?: string;
}

// === Service: User State (localStorage only) ===

export interface ServiceState {
  selected: boolean;
  status: RequestStatus;
  lastContacted?: string;
  responseStatus?: ResponseStatus;
  responseDate?: string;
  notes?: string;
  /**
   * Survives a closed EscalateBanner so the user can resume the draft instead
   * of regenerating it. Cleared on confirm (markEscalated).
   */
  stagedEscalation?: StagedEscalation;
  /**
   * Set at hydration when a saved row no longer matches an INITIAL_SERVICES
   * entry (upstream removed the company). User-created rows are exempt.
   */
  isOrphan?: boolean;
}

export interface StagedEscalation {
  subject: string;
  body: string;
  dpaUrl: string | null;
  stagedAt: string;
}

// === Service: Combined (used in UI) ===

export interface Service extends ServiceRecord, ServiceState {}

// === DPA Directory ===

export interface DpaInfo {
  name: string;
  country: string;
  complaintUrl: string;
  languages: Language[];
}

// === Templates & Locales ===

export type TemplateStyle = 'SIMPLE' | 'LEGAL' | 'AGGRESSIVE';

export type Language = 'EN' | 'DE' | 'FR' | 'ES' | 'IT';

export type Jurisdiction = 'GDPR' | 'CCPA' | 'UK_GDPR' | 'LGPD';

// What the user wants to do with each selected service.
// ERASURE (Art. 17 GDPR / § 1798.105 CCPA / UK-GDPR Art. 17 / LGPD Art. 18) — default.
// SAR (Art. 15 GDPR / UK-GDPR Art. 15) — "see what they have first." Legally smarter sequence.
export type RequestIntent = 'ERASURE' | 'SAR';

// User's gender, surfaced in self-references in the generated letters.
// F = feminine — "Bürgerin", "résidente", "cómoda"
// M = masculine — "Bürger", "résident", "cómodo"
// N = non-binary — uses the gender-inclusive written form: DE "Bürger:in"
//     (Doppelpunkt-Schreibweise, modern DACH standard), FR "résident·e"
//     (point médian, Académie-style inclusif), ES "cómodo/a".
// Default: 'N'. Letters in EN and IT are grammatically gender-invariant;
// this flag has no rendered effect for those languages.
export type Gender = 'F' | 'M' | 'N';

// === User Profile ===

export interface UserProfile {
  fullName: string;
  email: string;
  address?: string;
  phone?: string;
  isEuCitizen: boolean;
  templateStyle: TemplateStyle;
  language: Language;
  jurisdiction: Jurisdiction;
  country?: string;
  /** When true, every letter is written in `language` regardless of controller HQ. */
  alwaysWriteInMyLanguage?: boolean;
  /** Which right to invoke: Art. 17 erasure (default) or Art. 15 access (SAR). */
  intent?: RequestIntent;
  /** Grammatical gender for self-references in DE/FR/ES letters. Default 'N'. */
  gender?: Gender;
}

// === Filtering & Discovery ===

// 'Other' for non-EEA HQs that don't map to one of the four covered regimes
// (JP, AU, IN, CN, etc.) — keeps the GDPR count honest about the rows it
// actually represents instead of laundering "subject to GDPR when targeting
// EU residents" theory into a deterministic bucket.
export type FacetJurisdiction = 'All' | Jurisdiction | 'Other';
export type FacetContact = 'Any' | 'has-dpo' | 'has-privacy' | 'has-postal' | 'has-any';
export type FacetRisk = 'All' | 'broker' | 'ad-tech' | 'consumer';

export type BreadthMode = 'standard' | 'verified' | 'speculative';

export interface ServiceFilter {
  search: string;
  category: ServiceCategory | 'All';
  region: Region | 'All';
  breadthMode: BreadthMode;
  jurisdiction: FacetJurisdiction;
  contactAvailability: FacetContact;
  confidenceTiers: ConfidenceLevel[];
  riskTier: FacetRisk;
}

// === Smart Packs ===

export type SmartPackId =
  | 'standard'
  | 'data-brokers'
  | 'eu-brokers'
  | 'eu-adtech'
  | 'social-media'
  | 'telecom'
  | 'credit-debt'
  | 'public-body'
  | 'health-insurance'
  | 'finance-exposure'
  | 'online-footprint'
  | 'full-cleanup';

// Copy lives in the locale files under `packCopy`, keyed by id, so a pack's
// name and explanation translate like every other string in the app.
export interface SmartPack {
  id: SmartPackId;
  match: (service: Service) => boolean;
}

// === Email Generation ===

export interface GeneratedEmail {
  subject: string;
  body: string;
}

// === Recommendations ===

export interface CountryRecommendation {
  countryCode: string;
  serviceIds: string[];
  description: string;
}
