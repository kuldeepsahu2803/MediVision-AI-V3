
import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData } from '../types.ts';
import * as localDB from './localDatabaseService.ts';
import * as storageService from './storageService.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Saves a prescription. 
 * If user is logged in: uploads assets -> saves to Cloud DB.
 * If user is guest: saves to Local DB.
 */
export const savePrescription = async (data: PrescriptionData): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
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
  
  const payload: any = {
    user_id: user.id,
    patient_name: data.patientName || 'Unknown',
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
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
  const { data: { user } } = await supabase.auth.getUser();
  
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
  const { data: { user } } = await supabase.auth.getUser();
  
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
