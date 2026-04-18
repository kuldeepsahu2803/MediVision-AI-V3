import { AuditEntry } from '@/shared/types/audit.types';
import { SyncMetadata } from '@/shared/types/sync.types';

export interface LabResult {
  panel: string;
  test: string;
  loinc?: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  status: 'Normal' | 'Low' | 'High' | 'Critical';
  interpretation?: string;
}

export interface BloodTestReport {
  id: string;
  patientName: string;
  patientAge?: string;
  patientGender?: 'Male' | 'Female' | 'Other';
  date: string;
  timestamp: string;
  results: LabResult[];
  aiInsights?: string[];
  medicationConflicts?: string[];
  imageUrls?: string[];
  status: 'AI-Extracted' | 'User-Corrected' | 'Clinically-Verified';
  auditTrail?: AuditEntry[];
  sync?: SyncMetadata;
}
