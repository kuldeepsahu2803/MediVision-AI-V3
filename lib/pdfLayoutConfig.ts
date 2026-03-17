
export const PDF_LAYOUT_CONFIG = {
  atomicPhrases: [
    "By Mouth",
    "Three times a day",
    "Twice a day",
    "Once a day",
    "Four times a day",
    "Before meals",
    "After meals",
    "At bedtime",
    "As needed",
    "Every 4 hours",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "Sublingual",
    "Intramuscular",
    "Intravenous",
    "Subcutaneous",
    "Topical",
    "Inhalation"
  ],
  tableRules: {
    medicationPlan: {
      columnWeights: {
        0: 0.30, // Medication
        1: 0.15, // Amount
        2: 0.20, // How Often
        3: 0.15, // Method
        4: 0.20  // Guidance
      },
      minWidths: {
        0: 80,
        1: 40,
        2: 60,
        3: 50,
        4: 60
      }
    }
  },
  alertThresholds: {
    lowConfidence: 0.7,
    highRisk: 0.9
  }
};
