
import { FdaVerification } from '../types';

const BASE_URL = 'https://api.fda.gov/drug/label.json';

// Simple in-memory cache to prevent spamming the API for the same drug in one session
const cache: Record<string, FdaVerification | null> = {};

/**
 * Searches the openFDA database for a drug name (brand or generic).
 * @param drugName The name of the drug to search.
 * @param signal Optional AbortSignal to cancel the request.
 * @returns FdaVerification object or null if not found.
 */
export const searchFdaDrug = async (drugName: string, signal?: AbortSignal): Promise<FdaVerification | null> => {
  const cleanName = drugName.trim().toLowerCase();
  if (!cleanName || cleanName.length < 3) return null;

  if (cache[cleanName]) {
    return cache[cleanName];
  }

  try {
    // Construct query: search brand OR generic name
    // We use .exact match via quoting to increase relevance, but openFDA syntax is specific.
    // openfda.brand_name:"NAME" matches exact words.
    const query = `search=openfda.brand_name:"${cleanName}"+OR+openfda.generic_name:"${cleanName}"&limit=1`;
    const response = await fetch(`${BASE_URL}?${query}`, { signal });

    if (!response.ok) {
      if (response.status === 404) {
        // Not found is a valid result (drug might not be in FDA DB or spelling is off)
        cache[cleanName] = { verified: false, lastChecked: new Date().toISOString() };
        return cache[cleanName];
      }
      throw new Error(`FDA API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const openfda = result.openfda || {};

      const verification: FdaVerification = {
        verified: true,
        standardName: openfda.brand_name?.[0] || openfda.generic_name?.[0] || cleanName,
        brandName: openfda.brand_name?.[0],
        genericName: openfda.generic_name?.[0],
        rxcui: openfda.rxcui?.[0],
        // Boxed warnings are critical
        warnings: result.boxed_warning || result.warnings || [],
        // Contraindications are vital
        contraindications: result.contraindications || [],
        lastChecked: new Date().toISOString(),
      };

      cache[cleanName] = verification;
      return verification;
    }

    return null;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
        // Request cancelled, ignore
        return null;
    }
    console.warn("OpenFDA fetch failed:", e);
    return null;
  }
};

/**
 * Fetches drug name suggestions from openFDA.
 * @param query Input text to search for.
 * @returns Array of partial FdaVerification objects with names.
 */
export const getDrugSuggestions = async (query: string): Promise<Partial<FdaVerification>[]> => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2) return [];

    try {
        // Use a wildcard search for prefix matching
        const searchQuery = `openfda.brand_name:${cleanQuery}*+OR+openfda.generic_name:${cleanQuery}*`;
        const response = await fetch(`${BASE_URL}?search=${searchQuery}&limit=10`);

        if (!response.ok) return [];

        const data = await response.json();
        const results = data.results || [];

        return results.map((r: any) => {
            const openfda = r.openfda || {};
            return {
                standardName: openfda.brand_name?.[0] || openfda.generic_name?.[0],
                brandName: openfda.brand_name?.[0],
                genericName: openfda.generic_name?.[0],
            };
        }).filter((item: any) => item.standardName);

    } catch (e) {
        console.warn("OpenFDA suggestions failed:", e);
        return [];
    }
};
