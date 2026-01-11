
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

export type VerificationColor = 'green' | 'yellow' | 'red' | 'gray';
export type VerificationStatus = 'verified' | 'partial_match' | 'invalid_strength' | 'unverified';

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
  // Deprecating fdaVerification in favor of strict verification
  fdaVerification?: FdaVerification;
  verification?: VerificationResult; 
  coordinates?: number[]; 
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
