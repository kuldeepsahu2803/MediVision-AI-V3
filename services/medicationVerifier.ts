import { Medicine, VerificationResult } from '../types.ts';
import { normalizeMedicationName } from '../lib/normalization.ts';
import { searchRxNormCandidates, validateStrengthForDrug } from './rxNormService.ts';
import { getCachedVerification, cacheVerification } from '../lib/verificationCache.ts';
import { logMetric } from '../lib/metrics.ts';
import { reReadHandwriting } from './geminiService.ts';

/**
 * The Brain of the Clinical Safety System.
 * Determines if a drug is AI Guess, Tentative, or Database Match.
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
    status: 'ai_transcription',
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

    // Multi-Pass Fallback Matching
    if ((candidates.length === 0 || candidates[0].score < 75) && normalizedName.length > 3) {
      const relaxedName = normalizeMedicationName(currentName, 'relaxed');
      if (relaxedName !== normalizedName) {
        logMetric('fallback_retry', { original: normalizedName, relaxed: relaxedName });
        const fallbackCandidates = await searchRxNormCandidates(relaxedName);
        if (fallbackCandidates.length > 0 && (candidates.length === 0 || fallbackCandidates[0].score > candidates[0].score)) {
          candidates = fallbackCandidates;
          normalizedName = relaxedName;
          result.issues.push("Clinical noise filtering applied.");
        }
      }
    }

    // Coordinate-Aware Re-Reading (If still uncertain)
    if ((candidates.length === 0 || candidates[0].score < 70) && imageBase64 && med.coordinates) {
      logMetric('re_read_trigger', { medName: currentName });
      const refinedName = await reReadHandwriting(imageBase64, med.coordinates);
      if (refinedName && refinedName !== "Illegible / Confidence Too Low" && refinedName !== currentName) {
        const refinedNormalized = normalizeMedicationName(refinedName, 'strict');
        const refinedCandidates = await searchRxNormCandidates(refinedNormalized);
        if (refinedCandidates.length > 0 && (candidates.length === 0 || refinedCandidates[0].score > candidates[0].score)) {
          candidates = refinedCandidates;
          normalizedName = refinedNormalized;
          currentName = refinedName;
          result.issues.push("AI Refinement pass performed.");
        }
      } else if (refinedName === "Illegible / Confidence Too Low") {
          result.status = 'low_confidence';
          result.color = 'rose';
          result.issues.push("Ink detected but transcription is ambiguous.");
      }
    }

    result.candidates = candidates;

    if (candidates.length === 0) {
        if (result.status !== 'low_confidence') {
            result.status = 'ai_transcription';
            result.color = 'gray';
            result.issues.push("Drug not found in RxNorm database.");
        }
    } else {
        const topCandidate = candidates[0];
        result.rxcui = topCandidate.rxcui;
        result.standardName = topCandidate.name;
        result.confidenceScore = topCandidate.score;

        // SAFE CONFIDENCE GATING (95/70 Rule)
        if (topCandidate.score >= 95) {
            result.status = 'database_match';
            result.color = 'cyan';
            
            // Fail-closed strength check
            if (med.dosage && med.dosage !== 'N/A') {
                const isStrengthValid = await validateStrengthForDrug(topCandidate.rxcui, med.dosage);
                if (!isStrengthValid) {
                    result.status = 'invalid_strength';
                    result.color = 'rose';
                    result.issues.push(`Strength verification failed against RxNorm SCDF.`);
                }
            }
        } else if (topCandidate.score >= 70) {
            result.status = 'tentative_match';
            result.color = 'amber';
            result.issues.push("Spelling variant detected. Verify against original ink.");
        } else {
            result.status = 'low_confidence';
            result.color = 'rose';
            result.issues.push("Match confidence below clinical threshold.");
        }
    }

    // 5. Cache Result (only if not an error path)
    await cacheVerification(normalizedName, result);
    
    logMetric('verification_complete', { 
        medName: currentName, 
        status: result.status, 
        score: result.confidenceScore
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
            verification,
            humanConfirmed: false // Always reset on new verification pass
        };
    });

    const results = await limitConcurrency(tasks, 5);
    return results;
};