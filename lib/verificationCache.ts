import { VerificationResult } from '../types.ts';

const CACHE_KEY_PREFIX = 'rx_verify_';
const CACHE_TTL_DAYS = 7;

export const initVerificationCache = async () => {
    // No-op for localStorage implementation
    return Promise.resolve();
};

export const getCachedVerification = async (normalizedName: string): Promise<VerificationResult | null> => {
  try {
      const key = CACHE_KEY_PREFIX + normalizedName;
      const itemStr = localStorage.getItem(key);
      
      if (itemStr) {
          const record = JSON.parse(itemStr);
          const now = Date.now();
          const daysDiff = (now - record.timestamp) / (1000 * 3600 * 24);
          
          if (daysDiff < CACHE_TTL_DAYS) {
              return record.data as VerificationResult;
          } else {
              // Expired
              localStorage.removeItem(key);
          }
      }
  } catch (e) {
      console.warn("Cache read failed", e);
  }
  return null;
};

export const cacheVerification = async (normalizedName: string, result: VerificationResult) => {
  try {
      const key = CACHE_KEY_PREFIX + normalizedName;
      const record = {
          normalizedName,
          data: result,
          timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
      console.warn("Cache write failed", e);
  }
};