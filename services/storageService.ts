import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData } from '@/features/prescriptions';
import { BloodTestReport } from '@/features/blood-tests';
import { getPDFFile } from '../lib/pdfUtils.ts';
import { getLabPDFBlob } from '../lib/labPdfUtils.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: any) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const dataURLToBlob = async (url: string): Promise<Blob> => {
  if (url.startsWith('blob:')) {
    const response = await fetch(url);
    return await response.blob();
  }
  
  const parts = url.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export interface UploadResult {
    imagePath: string | null;
    pdfPath: string | null;
}

export const uploadPrescriptionAssets = async (userId: string, data: PrescriptionData): Promise<UploadResult> => {
    let imagePath = null;
    let pdfPath = null;
    
    const safeId = isUUID(data.id) ? data.id : `temp_${Date.now()}`;

    // 1. Upload Image
    if (data.imageUrls && data.imageUrls.length > 0) {
        const url = data.imageUrls[0];
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            try {
                const blob = await dataURLToBlob(url);
                const fileName = `${userId}/${safeId}_image.png`;
                
                const { error: uploadError } = await supabase.storage
                    .from('prescriptions')
                    .upload(fileName, blob, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    if (uploadError.message.includes('Bucket not found')) {
                        throw new Error(`Storage bucket 'prescriptions' not found. Please create it in the Supabase Dashboard.`);
                    }
                    throw new Error(`Cloud image storage failed: ${uploadError.message}`);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('prescriptions')
                        .getPublicUrl(fileName);
                    imagePath = publicUrlData.publicUrl;
                }
            } catch (convError: any) {
                console.warn("Conversion or upload failed, keeping original URL", convError);
                imagePath = url;
            }
        } else {
            imagePath = url;
        }
    }

    // 2. Generate and Upload PDF
    try {
        const pdfFile = await getPDFFile(data);
        const pdfName = `${userId}/${safeId}_report.pdf`;
        
        const { error: pdfError } = await supabase.storage
            .from('reports')
            .upload(pdfName, pdfFile, {
                contentType: 'application/pdf',
                upsert: true
            });
            
        if (pdfError) {
            if (pdfError.message.includes('Bucket not found')) {
                throw new Error(`Storage bucket 'reports' not found. Please create it in the Supabase Dashboard.`);
            }
            throw new Error(`PDF report storage failed: ${pdfError.message}`);
        } else {
            const { data: pdfUrlData } = supabase.storage
                .from('reports')
                .getPublicUrl(pdfName);
            pdfPath = pdfUrlData.publicUrl;
        }
    } catch (err: any) {
        console.error("Clinical document storage failed:", err);
        // We allow the process to continue even if PDF storage fails, as metadata is more critical
    }

    return { imagePath, pdfPath };
};

export const uploadLabReportAssets = async (userId: string, data: BloodTestReport): Promise<UploadResult> => {
    let imagePath = null;
    let pdfPath = null;
    
    const safeId = isUUID(data.id) ? data.id : `temp_${Date.now()}`;

    // 1. Upload Image
    if (data.imageUrls && data.imageUrls.length > 0) {
        const url = data.imageUrls[0];
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            try {
                const blob = await dataURLToBlob(url);
                const fileName = `${userId}/${safeId}_lab_image.png`;
                
                const { error: uploadError } = await supabase.storage
                    .from('lab_reports')
                    .upload(fileName, blob, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    if (uploadError.message.includes('Bucket not found')) {
                        console.error("Storage bucket 'lab_reports' not found. Please create it in the Supabase Dashboard.");
                    } else {
                        console.error("Lab image upload error:", uploadError);
                    }
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('lab_reports')
                        .getPublicUrl(fileName);
                    imagePath = publicUrlData.publicUrl;
                }
            } catch (convError: any) {
                console.warn("Lab image conversion failed", convError);
                imagePath = url;
            }
        } else {
            imagePath = url;
        }
    }

    // 2. Generate and Upload PDF
    try {
        const pdfBlob = getLabPDFBlob(data);
        const pdfName = `${userId}/${safeId}_lab_report.pdf`;
        
        const { error: pdfError } = await supabase.storage
            .from('lab_reports')
            .upload(pdfName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
            });
            
        if (pdfError) {
            if (pdfError.message.includes('Bucket not found')) {
                console.error("Storage bucket 'lab_reports' not found. Please create it in the Supabase Dashboard.");
            } else {
                console.error("Lab PDF upload error:", pdfError);
            }
        } else {
            const { data: pdfUrlData } = supabase.storage
                .from('lab_reports')
                .getPublicUrl(pdfName);
            pdfPath = pdfUrlData.publicUrl;
        }
    } catch {
        console.error("Lab PDF generation/upload failed");
    }

    return { imagePath, pdfPath };
};
