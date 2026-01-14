import { supabase } from '../lib/supabaseClient.ts';
import { PrescriptionData } from '../types.ts';
import { getPDFFile } from '../lib/pdfUtils.ts';

// Helper to check if string is a valid UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const dataURLToBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(',');
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
                const blob = dataURLToBlob(url);
                const fileName = `${userId}/${safeId}_image.png`;
                
                const { error: uploadError } = await supabase.storage
                    .from('prescriptions')
                    .upload(fileName, blob, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
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
            throw new Error(`PDF report storage failed: ${pdfError.message}`);
        } else {
            const { data: pdfUrlData } = supabase.storage
                .from('reports')
                .getPublicUrl(pdfName);
            pdfPath = pdfUrlData.publicUrl;
        }
    } catch (e: any) {
        console.error("Clinical document storage failed:", e);
        // We allow the process to continue even if PDF storage fails, as metadata is more critical
    }

    return { imagePath, pdfPath };
};