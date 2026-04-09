
import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData, BloodTestReport, ClinicalInsight } from '../types.ts';
import * as localDB from './localDatabaseService.ts';
import * as storageService from './storageService.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Saves a clinical insight.
 */
export const saveClinicalInsight = async (insight: ClinicalInsight): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return;

  const payload = {
    user_id: user.id,
    alerts: insight.alerts,
    summary: insight.summary,
    risk_scores: insight.riskScores,
    generated_at: insight.generatedAt
  };

  const { error } = await supabase.from('clinical_insights').insert([payload]);
  if (error) {
    console.error("Clinical Insight Save Error:", error);
    throw new Error(`Failed to save clinical insight: ${error.message}`);
  }
};

/**
 * Retrieves the latest clinical insight.
 */
export const getLatestClinicalInsight = async (): Promise<ClinicalInsight | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('clinical_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    id: row.id,
    userId: row.user_id,
    alerts: row.alerts,
    summary: row.summary,
    riskScores: row.risk_scores,
    generatedAt: row.generated_at
  };
};

/**
 * Saves a prescription. 
 * If user is logged in: uploads assets -> saves to Cloud DB.
 * If user is guest: saves to Local DB.
 */
export const savePrescription = async (data: PrescriptionData): Promise<void> => {
  // Use getSession for broader compatibility as per engineering requirement
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    console.log("User not logged in, saving to local DB");
    await localDB.saveToLocalDB(data);
    return;
  }

  console.log(`Saving prescription for user: ${user.id}`);

  // 1. Upload Assets (Image & PDF)
  const { imagePath, pdfPath } = await storageService.uploadPrescriptionAssets(user.id, data);

  // 2. Prepare Data for Postgres
  const { imageUrls, ...cleanData } = data;
  
  // Safely parse date to avoid "Invalid time value" errors
  let formattedDate: string;
  try {
    const parsedDate = data.date ? new Date(data.date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date encountered: "${data.date}". Falling back to current time.`);
      formattedDate = new Date().toISOString();
    } else {
      formattedDate = parsedDate.toISOString();
    }
  } catch (e) {
    formattedDate = new Date().toISOString();
  }
  
  const payload: any = {
    user_id: user.id,
    patient_name: data.patientName || 'Unknown',
    date: formattedDate,
    status: data.status,
    full_data: cleanData,
    image_path: imagePath,
    pdf_path: pdfPath
  };

  let query;

  if (isUUID(data.id)) {
    // UPDATE: ID is a UUID, so we treat it as an existing record.
    payload.id = data.id;
    query = supabase.from('prescriptions').upsert(payload);
  } else {
    // INSERT: ID is temporary (e.g. 'rx-123'), let Supabase generate a new UUID.
    query = supabase.from('prescriptions').insert([payload]);
  }

  const { error: dbError } = await query;

  if (dbError) {
      console.error("Database Save Error:", dbError);
      throw new Error(`Failed to save prescription: ${dbError.message}`);
  }
};

/**
 * Retrieves all prescriptions.
 * If user is logged in: fetches from Cloud DB.
 * If user is guest: fetches from Local DB.
 */
export const getAllPrescriptions = async (): Promise<PrescriptionData[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    return await localDB.getFromLocalDB();
  }

  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }

  return data.map((row: any) => {
    const pData = row.full_data;
    return {
      ...pData,
      id: row.id, // Must use the DB UUID
      status: row.status,
      imageUrls: row.image_path ? [row.image_path] : (pData.imageUrls || []),
      pdfUrl: row.pdf_path,
      timestamp: row.created_at // Use server timestamp for accurate history
    };
  });
};

/**
 * Deletes a prescription.
 * If user is logged in: deletes from Cloud DB.
 * If user is guest: deletes from Local DB.
 */
export const deletePrescription = async (id: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    await localDB.deleteFromLocalDB(id);
    return;
  }

  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
      console.error("Delete failed:", error);
      throw error;
  }
};

/**
 * Saves a lab report.
 */
export const saveLabReport = async (data: BloodTestReport): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    // For now, we don't have local DB for lab reports, but we could add it
    console.warn("User not logged in, lab reports currently require cloud account");
    return;
  }

  // 1. Upload Assets
  const { imagePath, pdfPath } = await storageService.uploadLabReportAssets(user.id, data);

  // 2. Prepare Payload
  const { imageUrls, ...cleanData } = data;
  
  const payload: any = {
    user_id: user.id,
    patient_name: data.patientName || 'Unknown',
    date: data.date || new Date().toISOString(),
    status: data.status,
    full_data: cleanData,
    image_path: imagePath,
    pdf_path: pdfPath
  };

  let query;
  if (isUUID(data.id)) {
    payload.id = data.id;
    query = supabase.from('lab_reports').upsert(payload);
  } else {
    query = supabase.from('lab_reports').insert([payload]);
  }

  const { error } = await query;
  if (error) {
    console.error("Lab Report Save Error:", error);
    throw new Error(`Failed to save lab report: ${error.message}`);
  }
};

/**
 * Retrieves all lab reports.
 */
export const getAllLabReports = async (): Promise<BloodTestReport[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('lab_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching lab reports:", error);
    return [];
  }

  return data.map((row: any) => ({
    ...row.full_data,
    id: row.id,
    status: row.status,
    imageUrls: row.image_path ? [row.image_path] : (row.full_data.imageUrls || []),
    pdfUrl: row.pdf_path,
    timestamp: row.created_at
  }));
};

/**
 * Deletes a lab report.
 */
export const deleteLabReport = async (id: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return;

  const { error } = await supabase
    .from('lab_reports')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error("Lab report delete failed:", error);
    throw error;
  }
};
