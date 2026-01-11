
/**
 * Normalization Module
 * Responsibilities:
 * 1. Uppercase text
 * 2. Remove dosage noise (e.g. "500mg" from name if it leaked)
 * 3. Remove form noise (e.g. "Tablet", "Cap")
 * 4. Cleanup whitespace
 */

const FORM_TERMS = ['TAB', 'TABLET', 'CAP', 'CAPSULE', 'INJ', 'INJECTION', 'SYP', 'SYRUP', 'OINT', 'OINTMENT', 'CRM', 'CREAM', 'SOL', 'SOLUTION', 'DROPS', 'TABS', 'CAPS'];
const ROUTE_TERMS = ['ORAL', 'TOPICAL', 'IV', 'IM', 'SC', 'PO', 'SUBCUTANEOUS', 'INTRAVENOUS', 'INTRAMUSCULAR'];
const CLINICAL_SUFFIXES = ['HCL', 'IP', 'USP', 'BP', 'EP', 'PH.EUR', 'ANHYDROUS'];

export const normalizeMedicationName = (rawName: string, level: 'strict' | 'relaxed' = 'strict'): string => {
  if (!rawName) return '';

  let normalized = rawName.toUpperCase();

  // 1. Remove common separators
  normalized = normalized.replace(/[-–—,]/g, ' ');

  // 2. Remove numeric strengths if they accidentally leaked into the name field
  normalized = normalized.replace(/\d+\s*(MG|MCG|G|ML|IU|%|PERCENT|MILLIGRAM|MICROGRAM)?/g, '');

  // 3. Remove Form Terms
  const formRegex = new RegExp(`\\b(${FORM_TERMS.join('|')})\\b`, 'g');
  normalized = normalized.replace(formRegex, '');
  
  // 4. Remove Route Terms
  const routeRegex = new RegExp(`\\b(${ROUTE_TERMS.join('|')})\\b`, 'g');
  normalized = normalized.replace(routeRegex, '');

  // 5. Phase 2: Fallback Matching - Remove clinical suffixes if relaxed
  if (level === 'relaxed') {
    const suffixRegex = new RegExp(`\\b(${CLINICAL_SUFFIXES.join('|')})\\b`, 'g');
    normalized = normalized.replace(suffixRegex, '');
    // Take first two words if string is long and likely has noise
    const words = normalized.trim().split(/\s+/);
    if (words.length > 2) {
      normalized = words.slice(0, 2).join(' ');
    }
  }

  // 6. Cleanup Whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 7. Handle Special Chars (remove anything that isn't alphanumeric or space)
  normalized = normalized.replace(/[^A-Z0-9 ]/g, '');

  return normalized;
};

export const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const u = unit.toUpperCase().trim();
  
  // Enhanced mapping for RxNorm alignment (Phase 1)
  if (['MG', 'MILLIGRAM', 'MILLIGRAMS'].includes(u)) return 'milligram';
  if (['MCG', 'MICROGRAM', 'MICROGRAMS', 'UG', 'μG'].includes(u)) return 'microgram';
  if (['G', 'GM', 'GRAM', 'GRAMS'].includes(u)) return 'gram';
  if (['ML', 'MILLILITER', 'MILLILITERS'].includes(u)) return 'milliliter';
  if (['IU', 'UNIT', 'UNITS', 'INTERNATIONAL UNITS', 'INTERNATIONAL UNIT'].includes(u)) return 'international unit';
  if (['MG/ML', 'MG PER ML', 'MG/MILLILITER'].includes(u)) return 'milligram per milliliter';
  
  return u.toLowerCase();
};
