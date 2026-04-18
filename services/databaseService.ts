
import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData } from '@/features/prescriptions';
import { BloodTestReport } from '@/features/blood-tests';
import { ClinicalInsight } from '@/features/clinical-intelligence';
import * as localDB from './localDatabaseService.ts';
import * as storageService from './storageService.ts';
import * as syncService from './syncService.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: any) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

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
    if (error.message.includes('clinical_insights')) {
      throw new Error(`Clinical Insights table not found. Please run the setup script in Supabase SQL Editor.`);
    }
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
 * Offline-first: Saves to local DB then enqueues for synchronization.
 */
export const savePrescription = async (data: PrescriptionData, forceCloud: boolean = false): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user || !forceCloud) {
    console.log("Routing prescription save via SyncManager");
    await syncService.syncManager.enqueue('prescription', isUUID(data.id) ? 'update' : 'create', data);
    return;
  }

  console.log(`Performing Cloud Sync for prescription: ${data.id}`);

  // 1. Upload Assets (Image & PDF)
  const { imagePath, pdfPath } = await storageService.uploadPrescriptionAssets(user.id, data);

  // 2. Prepare Data for Postgres
  const cleanData = { ...data };
  delete (cleanData as any).imageUrls;
  
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
  } catch {
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
      if (dbError.message.includes('prescriptions')) {
        throw new Error(`Prescriptions table not found. Please run the setup script in Supabase SQL Editor.`);
      }
      throw new Error(`Failed to save prescription: ${dbError.message}`);
  }
};

/**
 * Retrieves all prescriptions.
 * Merges Cloud and Local data to ensure unsynced drafts are visible.
 */
export const getAllPrescriptions = async (): Promise<PrescriptionData[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const localItems = await localDB.getFromLocalDB();
  
  if (!user) {
    return localItems;
  }

  // Fetch from Cloud
  const { data: cloudData, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching prescriptions:", error);
    return localItems;
  }

  const cloudItems: PrescriptionData[] = cloudData.map((row: any) => {
    const pData = row.full_data;
    return {
      ...pData,
      id: row.id,
      status: row.status,
      imageUrls: row.image_path ? [row.image_path] : (pData.imageUrls || []),
      pdfUrl: row.pdf_path,
      timestamp: row.created_at
    };
  });

  // MERGE LOGIC:
  // 1. Start with Cloud Items.
  // 2. Overlay Local Items that are NOT synced or have conflicts.
  // 3. Add Local Items that don't exist in Cloud yet.
  
  const mergedMap = new Map<string, PrescriptionData>();
  
  cloudItems.forEach(item => mergedMap.set(item.id, item));
  
  localItems.forEach(item => {
    const existing = mergedMap.get(item.id);
    // If local version is newer or has sync metadata, prefer it
    if (!existing || item.sync?.status !== 'synced') {
        mergedMap.set(item.id, item);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const dateA = new Date(a.timestamp || a.date).getTime();
    const dateB = new Date(b.timestamp || b.date).getTime();
    return dateB - dateA;
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
export const saveLabReport = async (data: BloodTestReport, forceCloud: boolean = false): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user || !forceCloud) {
    console.log("Routing lab report save via SyncManager");
    await syncService.syncManager.enqueue('lab', isUUID(data.id) ? 'update' : 'create', data);
    return;
  }

  console.log(`Performing Cloud Sync for lab report: ${data.id}`);

  // 1. Upload Assets
  const { imagePath, pdfPath } = await storageService.uploadLabReportAssets(user.id, data);

  // 2. Prepare Payload
  const cleanData = { ...data };
  delete (cleanData as any).imageUrls;
  
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
    if (error.message.includes('lab_reports')) {
      throw new Error(`Lab Reports table not found. Please run the setup script in Supabase SQL Editor.`);
    }
    throw new Error(`Failed to save lab report: ${error.message}`);
  }
};

/**
 * Retrieves all lab reports.
 */
export const getAllLabReports = async (): Promise<BloodTestReport[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const localItems = await localDB.getLabsFromLocalDB();
  
  if (!user) {
    return localItems;
  }

  const { data: cloudData, error } = await supabase
    .from('lab_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching lab reports:", error);
    return localItems;
  }

  const cloudItems: BloodTestReport[] = cloudData.map((row: any) => ({
    ...row.full_data,
    id: row.id,
    status: row.status,
    imageUrls: row.image_path ? [row.image_path] : (row.full_data.imageUrls || []),
    pdfUrl: row.pdf_path,
    timestamp: row.created_at
  }));

  const mergedMap = new Map<string, BloodTestReport>();
  cloudItems.forEach(item => mergedMap.set(item.id, item));
  localItems.forEach(item => {
    const existing = mergedMap.get(item.id);
    if (!existing || item.sync?.status !== 'synced') {
        mergedMap.set(item.id, item);
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const dateA = new Date(a.timestamp || a.date).getTime();
    const dateB = new Date(b.timestamp || b.date).getTime();
    return dateB - dateA;
  });
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
