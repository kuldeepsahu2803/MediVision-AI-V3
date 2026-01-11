
import { Medicine, VerificationResult } from '../types.ts';
import { normalizeMedicationName } from '../lib/normalization.ts';
import { searchRxNormCandidates, validateStrengthForDrug } from './rxNormService.ts';
import { getCachedVerification, cacheVerification } from '../lib/verificationCache.ts';
import { logMetric } from '../lib/metrics.ts';
import { reReadHandwriting } from './geminiService.ts';

/**
 * The Brain of the Verification System.
 * Determines if a drug is Green, Yellow, or Red.
 */
export const verifyMedication = async (med: Medicine, imageBase64?: string): Promise<VerificationResult> => {
  const startTime = performance.now();
  let currentName = med.name;
  let normalizedName = normalizeMedicationName(currentName, 'strict');
  
  logMetric('verification_start', { medName: med.name, normalizedName });

  // 1. Check Cache
  const cached = await getCachedVerification(normalizedName);
  if (cached) {
      logMetric('cache_hit', { medName: med.name, latency: performance.now() - startTime });
      return cached;
  }

  logMetric('cache_miss', { medName: med.name });

  let result: VerificationResult = {
    status: 'unverified',
    color: 'gray',
    normalizedName,
    confidenceScore: 0,
    candidates: [],
    issues: [],
    lastChecked: new Date().toISOString()
  };

  try {
    // 2. Initial RxNorm Search
    let candidates = await searchRxNormCandidates(normalizedName);

    // Phase 2: Multi-Pass Fallback Matching
    if ((candidates.length === 0 || candidates[0].score < 75) && normalizedName.length > 3) {
      const relaxedName = normalizeMedicationName(currentName, 'relaxed');
      if (relaxedName !== normalizedName) {
        logMetric('fallback_retry', { original: normalizedName, relaxed: relaxedName });
        const fallbackCandidates = await searchRxNormCandidates(relaxedName);
        if (fallbackCandidates.length > 0 && (candidates.length === 0 || fallbackCandidates[0].score > candidates[0].score)) {
          candidates = fallbackCandidates;
          normalizedName = relaxedName;
          result.issues.push("Applied clinical noise filtering for matching.");
        }
      }
    }

    // Phase 4: Coordinate-Aware Re-Reading (If still uncertain)
    if ((candidates.length === 0 || candidates[0].score < 50) && imageBase64 && med.coordinates) {
      logMetric('re_read_trigger', { medName: currentName });
      const refinedName = await reReadHandwriting(imageBase64, med.coordinates);
      if (refinedName && refinedName !== "N/A" && refinedName !== currentName) {
        const refinedNormalized = normalizeMedicationName(refinedName, 'strict');
        const refinedCandidates = await searchRxNormCandidates(refinedNormalized);
        if (refinedCandidates.length > 0 && (candidates.length === 0 || refinedCandidates[0].score > candidates[0].score)) {
          candidates = refinedCandidates;
          normalizedName = refinedNormalized;
          currentName = refinedName;
          result.issues.push("Re-read handwriting for improved clarity.");
        }
      }
    }

    result.candidates = candidates;

    if (candidates.length === 0) {
        result.status = 'unverified';
        result.color = 'yellow';
        result.issues.push("Drug not found in RxNorm database.");
    } else {
        const topCandidate = candidates[0];
        result.rxcui = topCandidate.rxcui;
        result.standardName = topCandidate.name;
        result.confidenceScore = topCandidate.score;

        if (topCandidate.score >= 75) {
            result.status = 'verified';
            result.color = 'green';
            
            // Phase 1: Validating against canonical units
            if (med.dosage && med.dosage !== 'N/A') {
                const isStrengthValid = await validateStrengthForDrug(topCandidate.rxcui, med.dosage);
                if (!isStrengthValid) {
                    result.status = 'invalid_strength';
                    result.color = 'red';
                    result.issues.push(`Strength '${med.dosage}' not found for ${topCandidate.name}`);
                    logMetric('strength_validation_fail', { medName: currentName, rxcui: topCandidate.rxcui, dosage: med.dosage });
                }
            }
        } else {
            result.status = 'partial_match';
            result.color = 'yellow';
            result.issues.push("Low confidence match. Please verify spelling.");
        }
    }

    // 5. Cache Result
    await cacheVerification(normalizedName, result);
    
    const latency = performance.now() - startTime;
    logMetric('verification_complete', { 
        medName: currentName, 
        status: result.status, 
        color: result.color,
        score: result.confidenceScore,
        latency 
    });
    
    return result;

  } catch (e) {
      logMetric('rxnorm_api_error', { medName: currentName, error: String(e) });
      return result;
  }
};

/**
 * Concurrency Limiter Helper
 */
const limitConcurrency = (tasks: (() => Promise<any>)[], limit: number) => {
    const results: any[] = [];
    const executing: Promise<any>[] = [];
    
    let i = 0;
    const enqueue = (): Promise<void> => {
        if (i === tasks.length) return Promise.resolve();
        
        const taskIndex = i++;
        const p = tasks[taskIndex]().then(result => {
            results[taskIndex] = result;
        });
        
        executing.push(p);
        
        const clean = () => executing.splice(executing.indexOf(p), 1);
        p.then(clean).catch(clean);

        let r = Promise.resolve();
        if (executing.length >= limit) {
            r = Promise.race(executing).then(() => enqueue());
        } else {
            r = enqueue();
        }
        return r;
    };
    
    return enqueue().then(() => Promise.all(executing)).then(() => results);
};

/**
 * Batch verify a prescription with concurrency limits
 */
export const verifyPrescriptionMeds = async (medications: Medicine[], imageBase64?: string): Promise<Medicine[]> => {
    const tasks = medications.map(med => async () => {
        const verification = await verifyMedication(med, imageBase64);
        return {
            ...med,
            verification
        };
    });

    // Limit to 5 concurrent requests to be safe
    const results = await limitConcurrency(tasks, 5);
    return results;
};
