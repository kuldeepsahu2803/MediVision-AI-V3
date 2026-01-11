
import { RxNormCandidate } from '../types.ts';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

// --- Resilience Utilities ---

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds cooldown

  isOpen(): boolean {
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.reset(); // Half-open/Reset attempt
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }

  reset() {
    this.failures = 0;
  }
}

const circuitBreaker = new CircuitBreaker();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = 3, backoff = 500): Promise<Response> => {
  if (circuitBreaker.isOpen()) {
    throw new Error("Circuit Breaker Open: RxNorm API is unstable.");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`API Error ${response.status}`);
      }
      
      if (!response.ok) {
        return response;
      }

      circuitBreaker.reset();
      return response;
    } catch (e) {
      if (i === retries - 1) {
        circuitBreaker.recordFailure();
        throw e;
      }
      const delay = backoff * Math.pow(2, i) + Math.random() * 100;
      await wait(delay);
    }
  }
  throw new Error("Max retries exceeded");
};

/**
 * Phase 2: RxNorm Interaction API integration
 * Fetches interactions between a set of RxCUIs.
 */
export const getDrugInteractions = async (rxcuis: string[]): Promise<any[]> => {
  if (rxcuis.length < 2) return [];
  
  try {
    const rxcuiQuery = rxcuis.join('+');
    const url = `${RXNORM_BASE_URL}/interaction/list.json?rxcuis=${rxcuiQuery}`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      return [];
    }

    // Fix: Read as text first to handle "Not found" plain text responses
    const responseText = await response.text();
    if (!responseText || responseText.trim() === 'Not found') {
      return [];
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.warn("Failed to parse RxNorm interaction JSON:", parseError);
      return [];
    }

    const interactions: any[] = [];
    
    // Parse complex RxNav interaction structure
    const fullGroups = data.fullInteractionTypeGroup || [];
    fullGroups.forEach((group: any) => {
      const types = group.fullInteractionType || [];
      types.forEach((type: any) => {
        const drugs = type.minConcept.map((c: any) => c.name);
        const description = type.interactionPair[0]?.description || "No description available.";
        const severity = type.interactionPair[0]?.severity || "N/A";
        
        interactions.push({ drugs, description, severity });
      });
    });
    
    return interactions;
  } catch (e) {
    console.error("Failed to fetch interactions:", e);
    return [];
  }
};

/**
 * Calls RxNorm approximateTerm API to find candidates for a misspelled or variant name.
 */
export const searchRxNormCandidates = async (term: string): Promise<RxNormCandidate[]> => {
  if (!term || term.length < 3) return [];

  try {
    const url = `${RXNORM_BASE_URL}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=4`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) return [];

    const responseText = await response.text();
    if (!responseText || responseText.trim() === 'Not found') return [];

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return [];
    }

    if (!data.approximateGroup?.candidate) return [];

    const candidates = await Promise.all(data.approximateGroup.candidate.map(async (c: any) => ({
      rxcui: c.rxcui,
      name: await resolveRxCuiName(c.rxcui),
      score: parseInt(c.score, 10),
      source: 'RxNorm'
    })));

    return candidates.filter((c: any) => c.score > 10);
  } catch (error) {
    console.error("RxNorm Search Failed:", error);
    return [];
  }
};

const resolveRxCuiName = async (rxcui: string): Promise<string> => {
  try {
    const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`;
    const response = await fetchWithRetry(url, 2);
    
    if (!response.ok) return 'Unknown Drug';

    const responseText = await response.text();
    if (!responseText || responseText.trim() === 'Not found') return 'Unknown Drug';

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return 'Unknown Drug';
    }

    return data.properties?.name || 'Unknown Drug';
  } catch {
    return 'Unknown Drug';
  }
};

export const validateStrengthForDrug = async (rxcui: string, strength: string): Promise<boolean> => {
  if (!strength) return true;
  const numericMatch = strength.match(/(\d+)/);
  if (!numericMatch) return true;
  const targetStrength = numericMatch[1];

  try {
    const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/allrelated.json`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) return true; 

    const responseText = await response.text();
    if (!responseText || responseText.trim() === 'Not found') return true;

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return true;
    }

    const conceptGroups = data.allRelatedGroup?.conceptGroup || [];
    
    for (const group of conceptGroups) {
      if (['SCD', 'SCDF'].includes(group.tty)) {
        if (group.conceptProperties) {
          for (const prop of group.conceptProperties) {
             if (prop.name.includes(targetStrength)) return true;
          }
        }
      }
    }
    return false;
  } catch (e) {
    return true; // Fail open
  }
};
