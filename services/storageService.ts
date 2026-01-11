
import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData } from '../types.ts';
import { getPDFFile } from '../lib/pdfUtils.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
  const response = await fetch(dataURL);
  return await response.blob();
};

export interface UploadResult {
    imagePath: string | null;
    pdfPath: string | null;
}

export const uploadPrescriptionAssets = async (userId: string, data: PrescriptionData): Promise<UploadResult> => {
    let imagePath = null;
    let pdfPath = null;
    
    // Use UUID if available, otherwise use temp ID for filename to prevent collisions
    const safeId = isUUID(data.id) ? data.id : `temp_${Date.now()}`;

    // 1. Upload Image to Supabase Storage
    if (data.imageUrls && data.imageUrls.length > 0) {
        try {
            const url = data.imageUrls[0];
            if (url.startsWith('data:') || url.startsWith('blob:')) {
                const blob = await dataURLToBlob(url);
                const fileName = `${userId}/${safeId}_image.png`;
                
                const { error: uploadError } = await supabase.storage
                    .from('prescriptions')
                    .upload(fileName, blob, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    console.error("Supabase Storage Error (Image):", uploadError);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('prescriptions')
                        .getPublicUrl(fileName);
                    imagePath = publicUrlData.publicUrl;
                }
            } else {
                // Already a remote URL
                imagePath = url;
            }
        } catch (e) {
            console.error("Image upload exception:", e);
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
            console.error("Supabase Storage Error (PDF):", pdfError);
        } else {
            const { data: pdfUrlData } = supabase.storage
                .from('reports')
                .getPublicUrl(pdfName);
            pdfPath = pdfUrlData.publicUrl;
        }
    } catch (e) {
        console.error("PDF generation/upload exception:", e);
    }

    return { imagePath, pdfPath };
};
