import { ServiceCategory } from '../types';

export const CATEGORY_TOOLTIPS: Record<ServiceCategory, string> = {
  'Data Broker': 'Collects and sells your personal information to third parties — insurers, employers, advertisers. You probably never gave them your data directly.',
  'Ad Tech': 'Tracks your browsing across websites to build advertising profiles and serve targeted ads.',
  'Credit Agency': 'Scores your creditworthiness for lenders, landlords and employers. Built from data you never handed them directly, and the score follows you.',
  'Debt Collection': 'Buys or chases unpaid debts, holding payment histories passed on by the original company.',
  'Social': 'Platforms storing your posts, messages, connections, and behavioral patterns.',
  'Finance': 'Banks, payment processors, and financial services holding your transaction history and account data.',
  'Insurance': 'Insurers and underwriters processing your health, property, or liability data for risk assessment.',
  'Health': 'Healthcare providers, pharmacies, and health apps handling medical records and wellness data.',
  'Telecom': 'Phone carriers and internet providers with access to call records, location data, and browsing history.',
  'Shopping': 'Online retailers and marketplaces storing your purchase history, addresses, and payment methods.',
  'Travel': 'Airlines, hotels, and booking platforms holding your travel history, passport details, and preferences.',
  'Entertainment': 'Streaming services, gaming platforms, and media companies tracking your viewing and listening habits.',
  'Education': 'Schools, universities, and e-learning platforms holding academic records and learning activity.',
  'Public Body': 'Government departments, courts and municipal authorities. Much of what they hold is kept under a legal duty, so erasure is often refused — asking what they hold usually gets further.',
  'Political Party': 'Parties holding membership records, donation histories and campaign contact lists. Unlike public authorities, they rarely have grounds to refuse an erasure request.',
  'Religious': 'Churches and religious bodies holding membership, sacramental and donation records.',
  'Nonprofit': 'Charities and associations holding supporter, donor and campaign contact data.',
  'Utility': 'Essential services — energy, water, waste — holding your account and consumption data.',
  'Uncategorised': 'The source directory lists no category for this company. Worth a look before you send.',
  'Imported': 'Manually added by you. No external data available.',
};
