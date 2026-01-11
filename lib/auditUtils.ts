// lib/auditUtils.ts

import { PrescriptionData, AuditEntry, Medicine } from '../types.ts';

// Deep comparison for objects and arrays to avoid unnecessary audit logs
const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
};

export const generateAuditTrail = (
  originalData: PrescriptionData,
  updatedData: PrescriptionData,
  userId: string
): AuditEntry[] => {
  const entries: AuditEntry[] = [];
  const timestamp = new Date().toISOString();

  const createEntry = (field: string, originalValue: any, newValue: any) => {
    entries.push({ field, originalValue, newValue, userId, timestamp });
  };

  // Check top-level fields
  const fieldsToCompare: (keyof PrescriptionData)[] = [
    'patientName', 'patientAge', 'patientAddress', 'doctorName', 'clinicName', 'date', 'notes'
  ];

  fieldsToCompare.forEach(field => {
    const originalValue = originalData[field] as any;
    const updatedValue = updatedData[field] as any;
    if (originalValue !== updatedValue) {
      // FIX: Cast field to string to satisfy createEntry's `field: string` parameter.
      createEntry(field as string, originalValue, updatedValue);
    }
  });
  
  // Check medication changes
  const originalMeds = originalData.medication || [];
  const updatedMeds = updatedData.medication || [];

  // Check for added/removed medications
  if (originalMeds.length !== updatedMeds.length) {
    const originalMedNames = originalMeds.map(m => m.name).join(', ');
    const updatedMedNames = updatedMeds.map(m => m.name).join(', ');
    createEntry('medicationList', `[${originalMedNames}]`, `[${updatedMedNames}]`);
  } else {
    // Check for changes within existing medications
    for (let i = 0; i < updatedMeds.length; i++) {
        const originalMed = originalMeds[i];
        const updatedMed = updatedMeds[i];

        if (!isDeepEqual(originalMed, updatedMed)) {
            const changes = (Object.keys(updatedMed) as (keyof Medicine)[])
                .filter(key => originalMed[key] !== updatedMed[key])
                // FIX: Explicitly convert values to strings to prevent runtime errors with symbols or other types.
                .map(key => `${String(key)}:'${String(originalMed[key])}'->'${String(updatedMed[key])}'`)
                .join(', ');
            
            createEntry(`medication[${i}] (${updatedMed.name})`, `Original state of ${originalMed.name}`, `Changes: ${changes}`);
        }
    }
  }

  return entries;
};
