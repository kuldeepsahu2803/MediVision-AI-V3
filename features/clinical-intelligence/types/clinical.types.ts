export type ClinicalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

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
  testTrends?: {
    test: string;
    unit: string;
    data: { date: string; value: number }[];
  }[];
  generatedAt: string;
}
