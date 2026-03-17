
import { loadImage } from 'skia-canvas';
import fs from 'fs';

async function test() {
    try {
        const path = 'tests/diffs/test-report-001-current.png';
        if (!fs.existsSync(path)) {
            console.error('File not found');
            return;
        }
        const buffer = fs.readFileSync(path);
        console.log('File read, length:', buffer.length);
        const img = await loadImage(buffer);
        console.log('loadImage success');
    } catch (e) {
        console.error('Test failed:', e);
    }
}
test();
