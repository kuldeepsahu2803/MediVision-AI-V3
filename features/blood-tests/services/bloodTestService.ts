import { GoogleGenAI, Type } from "@google/genai";
import Papa from 'papaparse';
import { BloodTestReport } from '@/features/blood-tests';

// Initialize Gemini directly in the frontend
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clinical API Key (GEMINI_API_KEY) is not configured. Please check your environment settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// Unit Normalization Map
const UNIT_CONVERSION: Record<string, Record<string, number>> = {
  'glucose': { 'mmol/L': 18, 'mg/dL': 1 },
  'creatinine': { 'umol/L': 0.0113, 'mg/dL': 1 },
  'hemoglobin': { 'g/L': 0.1, 'g/dL': 1 },
  'cholesterol': { 'mmol/L': 38.67, 'mg/dL': 1 }, // Total Cholesterol
  'hdl': { 'mmol/L': 38.67, 'mg/dL': 1 },         // HDL Cholesterol
  'ldl': { 'mmol/L': 38.67, 'mg/dL': 1 },         // LDL Cholesterol
  'triglycerides': { 'mmol/L': 88.57, 'mg/dL': 1 },
  'bun': { 'mmol/L': 2.801, 'mg/dL': 1 },
  'urea': { 'mmol/L': 2.801, 'mg/dL': 1 },
  'calcium': { 'mmol/L': 4.008, 'mEq/L': 2.004, 'mg/dL': 1 },
  'magnesium': { 'mmol/L': 2.43, 'mEq/L': 1.215, 'mg/dL': 1 },
  'iron': { 'umol/L': 5.58, 'ug/dL': 1 },
  't4': { 'nmol/L': 0.0777, 'ug/dL': 1 },           // Thyroxine (T4)
  't3': { 'nmol/L': 65.1, 'ng/dL': 1, 'ng/mL': 100 }, // Triiodothyronine (T3)
  'testosterone': { 'nmol/L': 28.8, 'ng/dL': 1 },
  'ast': { 'ukat/L': 60, 'U/L': 1 },
  'alt': { 'ukat/L': 60, 'U/L': 1 },
  'alp': { 'ukat/L': 60, 'U/L': 1 },
  'ggt': { 'ukat/L': 60, 'U/L': 1 },
  'amylase': { 'ukat/L': 60, 'U/L': 1 },
  'lipase': { 'ukat/L': 60, 'U/L': 1 },
};

function standardizeUnitStr(unit: string): string {
  if (!unit) return '';
  const upper = unit.trim().toUpperCase();
  
  if (['MMOL/L', 'MMOL/LITRE', 'MMOL/LITER'].includes(upper)) return 'mmol/L';
  if (['MG/DL', 'MG/100ML', 'MG%'].includes(upper)) return 'mg/dL';
  if (['UMOL/L', 'UMOL/LITRE', 'UMOL/LITER', 'μMOL/L', 'µMOL/L'].includes(upper)) return 'umol/L';
  if (['G/DL', 'G/100ML', 'GM/DL'].includes(upper)) return 'g/dL';
  if (['G/L', 'G/LITRE', 'G/LITER'].includes(upper)) return 'g/L';
  if (['MEQ/L', 'MEQ/LITRE', 'MEQ/LITER'].includes(upper)) return 'mEq/L';
  if (['UI/L', 'U/L', 'U/LITRE', 'U/LITER', 'IU/L', 'IU/LITRE', 'IU/LITER'].includes(upper)) return 'U/L';
  if (['UKAT/L', 'UKAT/LITRE', 'UKAT/LITER', 'μKAT/L', 'µKAT/L'].includes(upper)) return 'ukat/L';
  if (['NMOL/L', 'NMOL/LITRE', 'NMOL/LITER'].includes(upper)) return 'nmol/L';
  if (['NG/DL', 'NG/100ML'].includes(upper)) return 'ng/dL';
  if (['NG/ML'].includes(upper)) return 'ng/mL';
  if (['UG/DL', 'MCG/DL', 'μG/DL', 'µG/DL'].includes(upper)) return 'ug/dL';
  if (['UG/L', 'MCG/L', 'UG/LITRE', 'UG/LITER', 'MCG/LITRE', 'MCG/LITER'].includes(upper)) return 'ug/L';
  if (['UIU/ML', 'UIU/MLITRE', 'UIU/MLITER', 'UIU/M_L', 'μIU/ML', 'µIU/ML', 'MIU/L'].includes(upper)) return 'uIU/mL';
  
  return unit;
}

function normalizeValue(test: string, value: number, unit: string): { value: number, unit: string } {
  const normalizedTest = test.toLowerCase();
  const stdUnit = standardizeUnitStr(unit);
  
  for (const [key, conversions] of Object.entries(UNIT_CONVERSION)) {
    let isMatch: boolean;
    
    if (key === 'hemoglobin') {
      isMatch = normalizedTest.includes('hemoglobin') || normalizedTest.includes(' hb ') || normalizedTest.endsWith(' hb') || normalizedTest.startsWith('hb ') || normalizedTest === 'hb';
    } else if (key === 'cholesterol') {
      // Avoid matching sub-fractions as total cholesterol
      isMatch = normalizedTest.includes('cholesterol') && !normalizedTest.includes('hdl') && !normalizedTest.includes('ldl');
    } else {
      isMatch = normalizedTest.includes(key);
    }
    
    if (isMatch) {
      if (conversions[stdUnit]) {
        const targetUnit = Object.keys(conversions).find(u => conversions[u] === 1) || stdUnit;
        return { value: value * conversions[stdUnit], unit: targetUnit };
      }
    }
  }
  return { value, unit: stdUnit || unit };
}

let cachedRefRanges: any[] | null = null;

export async function loadReferenceRanges(): Promise<any[]> {
  if (cachedRefRanges) return cachedRefRanges;
  try {
    const response = await fetch('/data/blood_test_reference_ranges_v2.csv');
    if (!response.ok) throw new Error('Failed to load reference ranges');
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          cachedRefRanges = results.data;
          resolve(results.data);
        },
      });
    });
  } catch (error) {
    console.error('Error loading reference ranges:', error);
    return [];
  }
}

export async function analyzeBloodReport(
  images: { data: string, mimeType: string }[],
  currentMeds: string[] = []
): Promise<BloodTestReport> {
  const ai = getAi();
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
    model: "gemini-3.1-flash-preview",
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

  const text = response.text;
  if (!text) throw new Error("Empty response from AI engine");
  
  const data = JSON.parse(text);
  
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
