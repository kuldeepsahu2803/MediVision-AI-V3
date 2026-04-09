export interface FdaVerification {
  verified: boolean;
  standardName?: string;
  brandName?: string;
  genericName?: string;
  rxcui?: string;
  warnings?: string[];
  contraindications?: string[];
  lastChecked?: string;
}

// --- New RxNorm Verification Types ---

export type VerificationColor = 'cyan' | 'amber' | 'rose' | 'gray' | 'emerald';
export type VerificationStatus = 'ai_transcription' | 'tentative_match' | 'database_match' | 'low_confidence' | 'invalid_strength' | 'human_verified';

export type ClinicalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface ClinicalAlert {
  id: string;
  type: 'DDI' | 'TREND' | 'CRITICAL' | 'AYURVEDIC';
  severity: ClinicalSeverity;
  message: string;
  action?: string;
  triggeredAt: string;
  resolved: boolean;
  relatedIds?: string[]; // IDs of prescriptions or lab reports that triggered this
  metadata?: any;
}

export interface ClinicalInsight {
  id: string;
  userId: string;
  alerts: ClinicalAlert[];
  summary: string;
  riskScores: {
    kidney: number; // 0-100
    liver: number;
    heart: number;
    diabetes: number;
    thyroid: number;
  };
  generatedAt: string;
}

export interface RxNormCandidate {
  rxcui: string;
  name: string;
  score: number;
  source: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  color: VerificationColor;
  normalizedName: string;
  rxcui?: string;
  standardName?: string;
  confidenceScore: number;
  candidates: RxNormCandidate[];
  issues: string[]; // e.g., "Strength mismatch", "Spelling corrected"
  lastChecked: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route?: string;
  rxcui?: string;
  confidence?: number;
  reasoning?: string; // AI's logic for extraction
  verification?: VerificationResult; 
  coordinates?: number[]; 
  humanConfirmed?: boolean; // Mandatory for safety sign-off
}

export interface AiSuggestions {
  criticalAlerts?: string[];
  generalRecommendations?: string[];
}

export interface AuditEntry {
  field: string;
  originalValue: any;
  newValue: any;
  userId: string;
  timestamp: string;
}

export interface PrescriptionData {
  id: string;
  patientName: string;
  patientNameConfidence?: number;
  patientAge?: string;
  patientAgeConfidence?: number;
  patientAddress?: string;
  patientAddressConfidence?: number;
  doctorName: string;
  doctorNameConfidence?: number;
  clinicName?: string;
  clinicNameConfidence?: number;
  date: string; // The extracted date written on the prescription
  dateConfidence?: number;
  timestamp?: string; // The actual time the record was created/scanned
  medication: Medicine[];
  notes?: string;
  notesConfidence?: number;
  translatedNotes?: string; // Multilingual support: Translation of regional notes
  patientSummary?: string; // Plain language patient education summary
  warnings?: string[];
  status: 'AI-Extracted' | 'User-Corrected' | 'Clinically-Verified';
  auditTrail?: AuditEntry[];
  aiSuggestions?: AiSuggestions;
  charts?: {
    line: string;
    bar: string;
  };
  imageQuality?: 'Good' | 'Fair' | 'Poor';
  imageQualityMessage?: string | null;
  imageUrls?: string[];
}

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
}
