import { CountryRecommendation } from '../../types';
import RECS_RAW from '../../../generated-recommendations.json';

const recommendations: CountryRecommendation[] = (RECS_RAW as Record<string, unknown>[])
  .map((r): CountryRecommendation | null => {
    if (!r || typeof r !== 'object') return null;
    const code = typeof r.countryCode === 'string' ? r.countryCode.trim() : '';
    if (!code) {
      console.warn('recommendations: dropping entry with empty countryCode', r);
      return null;
    }
    const ids = Array.isArray(r.serviceIds) ? r.serviceIds.filter((x): x is string => typeof x === 'string') : [];
    return {
      countryCode: code,
      serviceIds: ids,
      description: String(r.description ?? ''),
    };
  })
  .filter((r): r is CountryRecommendation => r !== null);

export function getRecommendationsForCountry(countryCode: string): string[] {
  const rec = recommendations.find(
    (r) => r.countryCode.toUpperCase() === countryCode.toUpperCase(),
  );
  return rec?.serviceIds ?? [];
}

export { recommendations };
