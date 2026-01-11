// lib/drugDatabase.ts

import { Medicine } from '../types.ts';

// --- Mock Drug Database ---
// This simulates a real drug database like RxNorm.
// It includes standardized names, RxCUI codes, and safe dosage ranges.

interface DrugInfo {
  standardName: string;
  rxcui: string;
  dosageRange: { min: number; max: number; unit: 'mg' | 'mcg' | 'iu' };
}

const drugDB: Record<string, DrugInfo> = {
  // Keyed by lowercase drug name for easy lookup
  'lisinopril': { standardName: 'Lisinopril', rxcui: '203521', dosageRange: { min: 2.5, max: 40, unit: 'mg' } },
  'zestril': { standardName: 'Lisinopril', rxcui: '203521', dosageRange: { min: 2.5, max: 40, unit: 'mg' } },
  'metformin': { standardName: 'Metformin', rxcui: '860975', dosageRange: { min: 500, max: 2550, unit: 'mg' } },
  'glucophage': { standardName: 'Metformin', rxcui: '860975', dosageRange: { min: 500, max: 2550, unit: 'mg' } },
  'amoxicillin': { standardName: 'Amoxicillin', rxcui: '197361', dosageRange: { min: 250, max: 1000, unit: 'mg' } },
  'amoxil': { standardName: 'Amoxicillin', rxcui: '197361', dosageRange: { min: 250, max: 1000, unit: 'mg' } },
  'atorvastatin': { standardName: 'Atorvastatin', rxcui: '83367', dosageRange: { min: 10, max: 80, unit: 'mg' } },
  'lipitor': { standardName: 'Atorvastatin', rxcui: '83367', dosageRange: { min: 10, max: 80, unit: 'mg' } },
  'warfarin': { standardName: 'Warfarin', rxcui: '11289', dosageRange: { min: 1, max: 10, unit: 'mg' } },
  'coumadin': { standardName: 'Warfarin', rxcui: '11289', dosageRange: { min: 1, max: 10, unit: 'mg' } },
  'aspirin': { standardName: 'Aspirin', rxcui: '1191', dosageRange: { min: 81, max: 650, unit: 'mg' } },
};

// --- Mock Drug Interaction Data ---
// Key is a sorted combination of two RxCUI codes.

const interactionsDB: Record<string, { severity: string, description: string }> = {
  '11289,1191': { // Warfarin + Aspirin
    severity: 'High',
    description: 'Increased risk of bleeding. Concurrent use should be avoided or closely monitored.'
  },
  '203521,1191': { // Lisinopril + Aspirin
    severity: 'Medium',
    description: 'NSAIDs may reduce the antihypertensive effect of ACE inhibitors. Monitor blood pressure.'
  }
};

// --- Exported Functions ---

/**
 * Retrieves standardized drug information.
 * @param name - The brand or generic name of the drug.
 * @returns DrugInfo object or null if not found.
 */
export const getDrugInfo = (name: string): DrugInfo | null => {
  if (!name) return null;
  return drugDB[name.toLowerCase()] || null;
};

/**
 * Validates a given dosage string against the drug's safe range.
 * @param drugName - The name of the drug.
 * @param dosage - The dosage string (e.g., "500mg").
 * @returns A warning string if the dosage is out of range, otherwise null.
 */
export const validateDosage = (drugName: string, dosage: string): string | null => {
  const drugInfo = getDrugInfo(drugName);
  if (!drugInfo || !dosage) return null;

  const match = dosage.match(/(\d+(\.\d+)?)\s*(mg|mcg|iu)/i);
  if (!match) return null; // Cannot parse dosage

  const value = parseFloat(match[1]);
  const unit = match[3].toLowerCase();

  if (unit !== drugInfo.dosageRange.unit) {
    return `Warning: Typical unit is ${drugInfo.dosageRange.unit}, but found ${unit}.`;
  }

  if (value < drugInfo.dosageRange.min) {
    return `Warning: Dosage is below the typical minimum of ${drugInfo.dosageRange.min}${unit}.`;
  }
  if (value > drugInfo.dosageRange.max) {
    return `Warning: Dosage exceeds the typical maximum of ${drugInfo.dosageRange.max}${unit}.`;
  }

  return null;
};

/**
 * Checks for interactions between a list of medications.
 * @param medications - An array of Medicine objects.
 * @returns An array of interaction objects.
 */
export const checkInteractions = (medications: Medicine[]): { drugs: string[], severity: string, description: string }[] => {
  const interactions = [];
  const medList = medications.filter(m => m.rxcui); // Only check meds with known RxCUI

  for (let i = 0; i < medList.length; i++) {
    for (let j = i + 1; j < medList.length; j++) {
      const rxcui1 = medList[i].rxcui!;
      const rxcui2 = medList[j].rxcui!;
      
      const key = [rxcui1, rxcui2].sort().join(',');
      
      if (interactionsDB[key]) {
        interactions.push({
          drugs: [medList[i].name, medList[j].name],
          ...interactionsDB[key]
        });
      }
    }
  }
  return interactions;
};