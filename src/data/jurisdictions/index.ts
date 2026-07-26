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
    match: (s: Service) =>
      s.confidence === 'Verified' && !s.categories.includes('Imported'),
  },
  {
    id: 'data-brokers',
    match: (s: Service) => s.categories.includes('Data Broker'),
  },
  {
    id: 'eu-brokers',
    match: (s: Service) => EU_BROKER_SLUG_PREFIXES.some((prefix) => s.slug.startsWith(prefix)),
  },
  {
    id: 'eu-adtech',
    match: (s: Service) =>
      s.categories.includes('Ad Tech') &&
      (s.regions.includes('EU') || s.regions.includes('DE') || s.regions.includes('Global')),
  },
  {
    id: 'social-media',
    match: (s: Service) => s.categories.includes('Social'),
  },
  {
    id: 'telecom',
    match: (s: Service) => s.categories.includes('Telecom'),
  },
  {
    id: 'credit-debt',
    match: (s: Service) =>
      s.categories.some((c) => c === 'Credit Agency' || c === 'Debt Collection'),
  },
  {
    id: 'public-body',
    match: (s: Service) => s.categories.includes('Public Body'),
  },
  {
    id: 'health-insurance',
    match: (s: Service) =>
      s.categories.includes('Health') || s.categories.includes('Insurance'),
  },
];

export const INTENT_PACKS: SmartPack[] = [
  {
    id: 'finance-exposure',
    match: (s: Service) =>
      s.categories.some(
        (c) =>
          c === 'Finance' ||
          c === 'Insurance' ||
          c === 'Data Broker' ||
          c === 'Credit Agency' ||
          c === 'Debt Collection',
      ),
  },
  {
    id: 'online-footprint',
    match: (s: Service) =>
      s.categories.some((c) => c === 'Social' || c === 'Ad Tech' || c === 'Entertainment'),
  },
  {
    id: 'full-cleanup',
    match: (s: Service) => !s.categories.includes('Imported'),
  },
];

export const JURISDICTION_LABELS: Record<string, string> = {
  GDPR: 'GDPR (European Union)',
  CCPA: 'CCPA (California / USA)',
  UK_GDPR: 'UK GDPR (United Kingdom)',
  LGPD: 'LGPD (Brazil)',
};
