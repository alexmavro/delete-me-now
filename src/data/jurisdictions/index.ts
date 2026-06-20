import { SmartPack, Service } from '../../types';

// Slug prefixes for EU-headquartered brokers in the Datenanfragen dataset.
// `startsWith` catches country-suffixed variants (acxiom, acxiom-gb would both
// match; the intent is the broker-family, and the `s.regions.includes('EU')`
// guard is deliberately NOT applied here — a UK Acxiom entity is still an EU
// broker for practical purposes. If that trade-off ever bites, tighten later.)
const EU_BROKER_SLUG_PREFIXES = [
  'acxiom',
  'az-direct',
  'arvato-',
  'bisnode',
  'crif',
  'deutsche-post-adress',
  'deutsche-post-direkt',
  'dnb-',
  'dud-',
  'experian-',
  'riverty',
  'schober',
  'xaxis',
];

export const SMART_PACKS: SmartPack[] = [
  {
    id: 'standard',
    label: 'Standard Pack',
    description: '~200 top verified targets',
    longDescription:
      'A curated set of roughly 200 widely-used services whose contact details have been independently verified. This is the recommended starting point for most users.',
    match: (s: Service) =>
      (s.confidence === 'Verified' || s.confidence === 'Community') &&
      !s.categories.includes('Imported'),
  },
  {
    id: 'data-brokers',
    label: 'Data Brokers',
    description: 'US & global broker list',
    longDescription:
      'Data brokers collect and sell personal information, often without your direct knowledge. This pack targets known brokers so you can request deletion of shadow profiles.',
    match: (s: Service) => s.categories.includes('Data Broker'),
  },
  {
    id: 'eu-brokers',
    label: 'EU Brokers',
    description: 'EU-native broker sweep',
    longDescription:
      'EU-headquartered data brokers and credit agencies that profile individuals without direct customer relationships — Schober, Acxiom DE, AZ Direct, CRIF, Bisnode, Experian EU, Deutsche Post Direkt, Bertelsmann/arvato, Dun & Bradstreet, Xaxis. The EU equivalent of the US Big-Ass-List.',
    match: (s: Service) => EU_BROKER_SLUG_PREFIXES.some((prefix) => s.slug.startsWith(prefix)),
  },
  {
    id: 'eu-adtech',
    label: 'EU Ad-Tech',
    description: 'GDPR-relevant ad networks',
    longDescription:
      'Advertising technology companies operating in the EU that track users across websites. Under GDPR, you have the right to demand they stop processing your data.',
    match: (s: Service) =>
      s.categories.includes('Ad Tech') &&
      (s.regions.includes('EU') || s.regions.includes('DE') || s.regions.includes('Global')),
  },
  {
    id: 'social-media',
    label: 'Social Media',
    description: 'Major platforms',
    longDescription:
      'Social media platforms accumulate vast amounts of personal data including posts, messages, contacts, and behavioural patterns. Use this pack to exercise your data rights across all major social networks.',
    match: (s: Service) => s.categories.includes('Social'),
  },
  {
    id: 'telecom',
    label: 'Telecom',
    description: 'Phone & internet providers',
    longDescription:
      'Telecommunications providers hold call records, location data, and browsing history. This pack covers mobile carriers, ISPs, and related infrastructure companies.',
    match: (s: Service) => s.categories.includes('Telecom'),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Tracking & analytics services',
    longDescription:
      'Analytics services are embedded in websites and apps to monitor user behaviour. They often operate invisibly, building detailed profiles of your online activity.',
    match: (s: Service) => s.categories.includes('Analytics'),
  },
  {
    id: 'health-insurance',
    label: 'Health & Insurance',
    description: 'Health & insurance data holders',
    longDescription:
      'Health and insurance companies process some of the most sensitive personal data, including medical records and risk assessments. Under GDPR, this data receives special protection.',
    match: (s: Service) =>
      s.categories.includes('Health') || s.categories.includes('Insurance'),
  },
];

export const INTENT_PACKS: SmartPack[] = [
  {
    id: 'finance-exposure',
    label: 'Finance & Brokers',
    description: 'Financial data holders + data brokers',
    longDescription:
      'Banks, insurers, credit agencies, and data brokers that hold your financial information or sell it to third parties. These companies have your transaction history, credit scores, and risk profiles.',
    match: (s: Service) =>
      s.categories.some((c) => c === 'Finance' || c === 'Insurance' || c === 'Data Broker'),
  },
  {
    id: 'online-footprint',
    label: 'Online Footprint',
    description: 'Social platforms + trackers',
    longDescription:
      'Social media platforms, analytics services, and ad-tech companies that track your online activity. These companies build profiles from your posts, browsing behavior, and app usage.',
    match: (s: Service) =>
      s.categories.some((c) => c === 'Social' || c === 'Analytics' || c === 'Ad Tech'),
  },
  {
    id: 'full-cleanup',
    label: 'Full Cleanup',
    description: 'Every service in the directory',
    longDescription:
      'Selects every service in the directory — the widest net. Use this when you want to send deletion requests to everyone who might have your data.',
    match: (s: Service) => !s.categories.includes('Imported'),
  },
];

export const JURISDICTION_LABELS: Record<string, string> = {
  GDPR: 'GDPR (European Union)',
  CCPA: 'CCPA (California / USA)',
  UK_GDPR: 'UK GDPR (United Kingdom)',
  LGPD: 'LGPD (Brazil)',
};
