import { jsPDF } from 'jspdf';

/**
 * Base64 encoded Noto Sans font (Regular).
 * In a production environment, this would be the full TTF-to-Base64 string.
 * For this implementation, we use a placeholder that will be replaced by the actual asset.
 */
const NOTO_SANS_REGULAR_B64 = 'AAEAAAARAQAABAAQR0RFR...placeholder_long_enough_to_trigger_registration_logic_for_testing_purposes_1234567890'; // Placeholder for actual Base64 data

/**
 * Registers custom Unicode-capable fonts to the jsPDF instance.
 */
export const registerCustomFonts = (doc: jsPDF) => {
  try {
    // Only attempt registration if the Base64 string looks plausible (length > 1000 for a real font)
    // For this placeholder, we'll skip to avoid jsPDF internal errors
    if (NOTO_SANS_REGULAR_B64.length > 1000) {
        doc.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_REGULAR_B64);
        doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    } else {
        // Fallback: Use standard fonts if the custom asset isn't loaded
        console.info('Noto Sans asset not loaded, using system font fallbacks.');
    }
  } catch (error) {
    console.error('Failed to register custom fonts:', error);
  }
};
