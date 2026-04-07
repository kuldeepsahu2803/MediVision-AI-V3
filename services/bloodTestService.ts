import { GoogleGenAI, Type } from "@google/genai";
import Papa from 'papaparse';
import { LabResult, BloodTestReport } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Unit Normalization Map
const UNIT_CONVERSION: Record<string, Record<string, number>> = {
  'glucose': { 'mmol/L': 18, 'mg/dL': 1 },
  'creatinine': { 'umol/L': 0.0113, 'mg/dL': 1 },
  'hemoglobin': { 'g/L': 0.1, 'g/dL': 1 },
};

function normalizeValue(test: string, value: number, unit: string): { value: number, unit: string } {
  const normalizedTest = test.toLowerCase();
  for (const [key, conversions] of Object.entries(UNIT_CONVERSION)) {
    if (normalizedTest.includes(key)) {
      if (conversions[unit]) {
        return { value: value * conversions[unit], unit: Object.keys(conversions).find(u => conversions[u] === 1) || unit };
      }
    }
  }
  return { value, unit };
}

export async function loadReferenceRanges(): Promise<any[]> {
  try {
    const response = await fetch('/data/blood_test_reference_ranges_v2.csv');
    if (!response.ok) throw new Error('Failed to load reference ranges');
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
      });
    });
  } catch (error) {
    console.error('Error loading reference ranges');
    return [];
  }
}

export async function analyzeBloodReport(
  images: { data: string, mimeType: string }[],
  currentMeds: string[] = []
): Promise<BloodTestReport> {
  const refRanges = await loadReferenceRanges();
  
  const prompt = `
    Extract all lab results from this blood test report.
    For each test, identify:
    - Panel (e.g., CBC, CMP, Lipid)
    - Test Name
    - Value
    - Unit
    - Reference Range (if provided in the report)

    Also, extract patient demographics:
    - Patient Name
    - Age (Extract numeric value if possible, e.g., "35" from "35 years")
    - Gender (Male/Female/Other)
    - Date of Report

    Analyze the results against these current medications: ${currentMeds.join(', ')}.
    Identify any potential conflicts or risks, specifically checking for:
    1. Drug-Lab interactions.
    2. Potential conflicts with common Ayurvedic or herbal supplements if mentioned.
    3. Risks associated with the patient's age and gender.
    
    Return the data in the following JSON format:
    {
      "patientName": "...",
      "patientAge": "...",
      "patientGender": "Male/Female/Other",
      "date": "YYYY-MM-DD",
      "results": [
        {
          "panel": "...",
          "test": "...",
          "value": 0.0,
          "unit": "...",
          "refLow": 0.0,
          "refHigh": 0.0,
          "interpretation": "..."
        }
      ],
      "aiInsights": ["..."],
      "medicationConflicts": ["..."]
    }
    
    DISCLAIMER: AI analysis for informational purposes only. Consult a licensed clinician.
  `;

  const contents = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          ...contents
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          patientAge: { type: Type.STRING },
          patientGender: { type: Type.STRING },
          date: { type: Type.STRING },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                panel: { type: Type.STRING },
                test: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                refLow: { type: Type.NUMBER },
                refHigh: { type: Type.NUMBER },
                interpretation: { type: Type.STRING }
              }
            }
          },
          aiInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          medicationConflicts: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  
  // Post-process to match LOINC and status with demographic awareness
  if (data.results) {
    const age = parseInt(data.patientAge) || 30; // Default to adult if unknown
    const isChild = age < 18;

    data.results = data.results.map((res: any) => {
      // Unit Normalization
      const normalized = normalizeValue(res.test, res.value, res.unit);
      res.value = normalized.value;
      res.unit = normalized.unit;

      const match = refRanges.find(r => 
        r.Test && (r.Test.toLowerCase().includes(res.test.toLowerCase()) || 
        res.test.toLowerCase().includes(r.Test.toLowerCase()))
      );
      
      let status: 'Normal' | 'Low' | 'High' | 'Critical' = 'Normal';
      
      // Demographic-aware ranges
      let low, high;
      if (isChild) {
        low = res.refLow || match?.ChildLow;
        high = res.refHigh || match?.ChildHigh;
      } else {
        const genderKey = data.patientGender === 'Female' ? 'AdultFemale' : 'AdultMale';
        low = res.refLow || match?.[`${genderKey}Low`];
        high = res.refHigh || match?.[`${genderKey}High`];
      }

      // Fallback to generic adult male if still undefined
      low = low ?? match?.AdultMaleLow;
      high = high ?? match?.AdultMaleHigh;
      
      if (low !== undefined && res.value < low) status = 'Low';
      if (high !== undefined && res.value > high) status = 'High';
      
      // Critical check using CSV thresholds
      const critLow = match?.CriticalLow;
      const critHigh = match?.CriticalHigh;

      if (critLow !== undefined && res.value <= critLow) status = 'Critical';
      if (critHigh !== undefined && res.value >= critHigh) status = 'Critical';

      return {
        ...res,
        loinc: match?.LOINC,
        refLow: low,
        refHigh: high,
        status
      };
    });
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    patientName: data.patientName || 'Unknown Patient',
    patientAge: data.patientAge,
    patientGender: data.patientGender,
    date: data.date || new Date().toISOString().split('T')[0],
    results: data.results || [],
    aiInsights: data.aiInsights || [],
    medicationConflicts: data.medicationConflicts || [],
    imageUrls: [],
    status: 'AI-Extracted'
  };
}
