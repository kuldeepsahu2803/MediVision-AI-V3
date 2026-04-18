
import { PDF_LAYOUT_CONFIG } from '@/lib/pdfLayoutConfig.ts';

const SYMBOL_MAP: Record<string, string> = {
  '⅙': '1/6',
  '⅛': '1/8',
  '¼': '1/4',
  '⅓': '1/3',
  '½': '1/2',
  '⅔': '2/3',
  '¾': '3/4',
  '✓': 'OK',
  '⚠': 'WARN',
  '👁': 'REV',
  '•': '-',
  '–': '-',
  '—': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  'minims': 'minims', // Keep as is, but could map to 'm' if needed
};

/**
 * Normalizes clinical text for PDF rendering.
 * 1. Handles object serialization to prevent [object Object].
 * 2. Maps non-standard symbols to PDF-safe equivalents.
 * 3. Injects non-breaking markers into atomic phrases.
 */
export const normalizeForPDF = (text: any, fallback = 'N/A'): string => {
  if (text === null || typeof text === 'undefined') return fallback;
  
  // Handle object serialization
  if (typeof text === 'object') {
    try {
      // If it's a verification object, we might want a specific string
      if (text.status) return text.status.replace(/_/g, ' ');
      return JSON.stringify(text);
    } catch {
      return '[Complex Data]';
    }
  }

  let str = String(text).trim();
  if (str === '' || str.toLowerCase() === 'n/a') return fallback;

  // 1. Symbol Mapping
  Object.entries(SYMBOL_MAP).forEach(([symbol, replacement]) => {
    str = str.split(symbol).join(replacement);
  });

  // 2. Atomic Phrase Protection (using non-breaking space \u00A0)
  PDF_LAYOUT_CONFIG.atomicPhrases.forEach(phrase => {
    const protectedPhrase = phrase.split(' ').join('\u00A0');
    // Use a global case-insensitive replacement
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    str = str.replace(regex, protectedPhrase);
  });

  // 3. Strip control characters and non-printable ASCII (if not using Unicode font yet)
  // For now, we keep it strict until we confirm Unicode font embedding
  // eslint-disable-next-line no-control-regex
  str = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  return str;
};

/**
 * Validates a generated PDF text stream for replacement characters.
 */
export const validatePDFText = (text: string): boolean => {
  if (!text) return true;
  return !text.includes('\uFFFD');
};
