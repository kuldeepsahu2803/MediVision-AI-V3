
import { normalizeMedicationName } from '../lib/normalization';

// Mock test suite structure since we don't have a Jest runner in the environment
// In a real repo, this would be run via `npm test`

const runTests = () => {
    console.group('Running Verification Tests');

    // Test 1: Normalization
    try {
        const input = "Amoxiclav 625 mg Tab";
        const expected = "AMOXICLAV";
        const result = normalizeMedicationName(input);
        if (result === expected) {
            console.log('✅ Normalization: Success');
        } else {
            console.error(`❌ Normalization: Failed. Expected ${expected}, got ${result}`);
        }
    } catch (e) {
        console.error('❌ Normalization: Error', e);
    }

    // Test 2: Whitespace Cleanup
    try {
        const input = "  Paracetamol   ";
        const expected = "PARACETAMOL";
        const result = normalizeMedicationName(input);
        if (result === expected) {
            console.log('✅ Whitespace: Success');
        } else {
            console.error(`❌ Whitespace: Failed. Expected "${expected}", got "${result}"`);
        }
    } catch (e) {
        console.error('❌ Whitespace: Error', e);
    }

    // Test 3: Form Removal
    try {
        const input = "Metformin Hydrochloride Tablets IP";
        // 'Tablets' is in FORM_TERMS
        const normalized = normalizeMedicationName(input);
        if (!normalized.includes('TABLET')) {
             console.log('✅ Form Removal: Success');
        } else {
             console.error(`❌ Form Removal: Failed. Got ${normalized}`);
        }
    } catch (e) {
        console.error('❌ Form Removal: Error', e);
    }

    console.groupEnd();
};

// Auto-run if executed in a browser console for quick validation
if (typeof window !== 'undefined') {
    (window as any).runVerificationTests = runTests;
}

export default runTests;
