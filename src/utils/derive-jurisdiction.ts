import { FacetJurisdiction, Service } from '../types';

// Country → jurisdiction mapping for the faceted filter rail. Keyed off
// `headquarterCountry` (alpha-2) on the controller; surfaces which of the
// four template regimes a row would route to under default settings.
//
// Explicit mappings: US → CCPA, GB/UK → UK_GDPR, BR → LGPD, EEA → GDPR.
// Anything outside these (JP, AU, IN, CN, missing/typo) → 'Other'. We
// deliberately do NOT default unmapped HQs to GDPR: they may be subject to
// GDPR when targeting EU residents, but the facet count would otherwise
// silently inflate the GDPR bucket with controllers that aren't actually
// EEA-resident.
const EEA_CODES: ReadonlySet<string> = new Set([
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
  'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'HR', 'SK', 'SI',
  'BG', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT',
  'IS', 'LI', 'NO', // EEA non-EU members; GDPR via EEA Agreement.
]);

export function getJurisdiction(s: Service): FacetJurisdiction {
  const cc = (s.headquarterCountry || '').toUpperCase();
  if (cc === 'US') return 'CCPA';
  if (cc === 'GB' || cc === 'UK') return 'UK_GDPR';
  if (cc === 'BR') return 'LGPD';
  if (EEA_CODES.has(cc)) return 'GDPR';
  return 'Other';
}
