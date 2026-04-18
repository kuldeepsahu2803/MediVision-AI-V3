import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { JSDOM } from 'jsdom';
import { PrescriptionData } from '@/features/prescriptions';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    configurable: true
});
(global as any).atob = dom.window.atob;
(global as any).btoa = dom.window.btoa;
(global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;

import { FEATURE_FLAGS } from '../lib/featureFlags.ts';

async function runValidation() {
    console.log('🚀 Starting PDF Integrity Validation...');
    
    const fixturesPath = path.join(process.cwd(), 'scripts', 'test-fixtures.json');
    const fixtures: PrescriptionData[] = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
    
    // We need to import the generator. Since it's a Vite project, we might need to use tsx to run this script.
    // However, pdfUtils.ts might have browser-only imports (like logoBase64 from pdfAssets).
    
    try {
        const { generateDoc } = await import('../lib/pdfUtils.ts');
        const { validatePDFText } = await import('../services/pdfNormalizationService.ts');

        for (const fixture of fixtures) {
            console.log(`\nChecking Report: ${fixture.id}`);
            
            const doc = await generateDoc(fixture);
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            
            const parser = new PDFParse({ data: pdfBuffer });
            const textResult = await parser.getText();
            const text = textResult.text;
            
            console.log('--- Extracted Text Preview ---');
            console.log(text.substring(0, 200) + '...');
            
            if (text.includes('\uFFFD')) {
                console.log('DEBUG: Found replacement character at index:', text.indexOf('\uFFFD'));
                const context = text.substring(Math.max(0, text.indexOf('\uFFFD') - 20), text.indexOf('\uFFFD') + 20);
                console.log('DEBUG: Context around replacement character:', context);
            }
            console.log('------------------------------');

            const isValid = validatePDFText(text);
            
            if (!isValid) {
                console.error(`❌ VALIDATION FAILED for ${fixture.id}: Replacement characters detected.`);
                process.exit(1);
            } else {
                console.log(`✅ VALIDATION PASSED for ${fixture.id}`);
            }
            
            // Additional checks
            if (fixture.medication.some(m => m.dosage === '1/2 tablet')) {
                if (text.includes('1/2')) {
                    console.log('✅ Normalization verified: "1/2" found in text.');
                } else {
                    console.warn('⚠️ Normalization warning: "1/2" not found in text. Check if it was mapped to something else.');
                }
            }
        }
        
        console.log('\n✨ All PDF integrity checks passed!');
    } catch (error) {
        console.error('💥 Critical error during PDF validation:', error);
        process.exit(1);
    }
}

runValidation();
