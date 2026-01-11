
import { PrescriptionData, AiSuggestions } from '../types.ts';

/**
 * Interface representing clinical reference information for a pharmaceutical agent.
 */
export interface DrugReference {
  category: string;
  description: string;
  precautions: string;
  usageNotes: string;
}

/**
 * SECURE: Calls the server-side proxy instead of using the API Key in-browser.
 */
const callClinicalProxy = async (action: string, payload: any, config?: any) => {
    const response = await fetch(`/api/clinical/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, config })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Clinical API error');
    }
    return response.json();
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  const imageParts = images.map(img => ({
    inlineData: { data: img.base64Data, mimeType: img.mimeType },
  }));

  const textPart = {
    text: `You are "MediVision Extractor". Produce a JSON object matching the clinical schema for patientName, doctorName, date, medication (name, dosage, frequency, route, coordinates), and notes.`
  };

  const result = await callClinicalProxy('analyze', { parts: [...imageParts, textPart] }, { responseMimeType: 'application/json' });
  return JSON.parse(result.text);
};

export const reReadHandwriting = async (imageBase64: string, coordinates: number[]): Promise<string> => {
  const [ymin, xmin, ymax, xmax] = coordinates;
  const imagePart = { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } };
  const textPart = { text: `Transcribe medication name at coordinates y:[${ymin}, ${ymax}], x:[${xmin}, ${xmax}]. Output drug name only.` };

  const result = await callClinicalProxy('reread', { parts: [imagePart, textPart] });
  return result.text?.trim() || "N/A";
};

export const getDrugReferenceInfo = async (drugName: string): Promise<DrugReference> => {
    const result = await callClinicalProxy('reference', `Provide general reference for: ${drugName}.`, { responseMimeType: 'application/json' });
    return JSON.parse(result.text);
};

export const getTreatmentSuggestions = async (prescription: PrescriptionData): Promise<AiSuggestions> => {
    const result = await callClinicalProxy('reference', `Analyze risks for: ${JSON.stringify(prescription.medication)}`, { responseMimeType: 'application/json' });
    return JSON.parse(result.text);
};
