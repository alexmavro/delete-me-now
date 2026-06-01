import { Jurisdiction } from '../types';

// Single source of truth for statutory response-window days per jurisdiction.
// Consumed by the follow-up template for letter copy.
export const DEADLINE_DAYS: Record<Jurisdiction, number> = {
  GDPR: 30,
  CCPA: 45,
  UK_GDPR: 30,
  LGPD: 15,
};
