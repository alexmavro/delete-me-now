import { ServiceCategory } from '../types';

export const CATEGORY_TOOLTIPS: Record<ServiceCategory, string> = {
  'Data Broker': 'Collects and sells your personal information to third parties — insurers, employers, advertisers. You probably never gave them your data directly.',
  'Ad Tech': 'Tracks your browsing across websites to build advertising profiles and serve targeted ads.',
  'Analytics': 'Embedded in apps and websites to monitor how you use them — page views, clicks, session duration.',
  'Social': 'Platforms storing your posts, messages, connections, and behavioral patterns.',
  'Finance': 'Banks, payment processors, and financial services holding your transaction history and account data.',
  'Insurance': 'Insurers and underwriters processing your health, property, or liability data for risk assessment.',
  'Health': 'Healthcare providers, pharmacies, and health apps handling medical records and wellness data.',
  'Telecom': 'Phone carriers and internet providers with access to call records, location data, and browsing history.',
  'Shopping': 'Online retailers and marketplaces storing your purchase history, addresses, and payment methods.',
  'Travel': 'Airlines, hotels, and booking platforms holding your travel history, passport details, and preferences.',
  'Entertainment': 'Streaming services, gaming platforms, and media companies tracking your viewing and listening habits.',
  'News & Media': 'Publishers and news outlets collecting reading habits, subscriptions, and comment history.',
  'Education': 'Schools, universities, and e-learning platforms holding academic records and learning activity.',
  'Cloud & Hosting': 'Cloud infrastructure and hosting providers that may process or store data on behalf of other services.',
  'Government': 'Public-sector bodies processing citizen data under legal mandate — tax, identity, social services.',
  'IoT & Smart Home': 'Connected devices and smart-home platforms collecting sensor data, usage patterns, and voice recordings.',
  'Utility': 'Essential services — energy, water, waste — holding your account and consumption data.',
  'Other': 'Services that don\'t fit a specific category. Review individually.',
  'Imported': 'Manually added by you. No external data available.',
};
