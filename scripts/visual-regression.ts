
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { JSDOM } from 'jsdom';
import { Canvas, loadImage } from 'skia-canvas';
import pixelmatch from 'pixelmatch';

// Mock browser environment for jsPDF
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as any;
global.document = dom.window.document;
(dom.window as any).requestAnimationFrame = (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 16) as any;
(dom.window as any).cancelAnimationFrame = (id: number) => clearTimeout(id as any);
Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true
});
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.requestAnimationFrame = (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 16) as any;
global.cancelAnimationFrame = (id: number) => clearTimeout(id as any);

const GOLDEN_DIR = path.join(process.cwd(), 'tests/goldens');
const DIFF_DIR = path.join(process.cwd(), 'tests/diffs');

if (!fs.existsSync(GOLDEN_DIR)) fs.mkdirSync(GOLDEN_DIR, { recursive: true });
if (!fs.existsSync(DIFF_DIR)) fs.mkdirSync(DIFF_DIR, { recursive: true });

async function runVisualRegression() {
    console.log('📸 Starting Visual Regression Testing...');
    
    try {
        const { generateDoc } = await import('../lib/pdfUtils.ts');
        const fixtures = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/test-fixtures.json'), 'utf-8'));

        for (const fixture of fixtures) {
            console.log(`\nProcessing: ${fixture.id}`);
            
            const doc = await generateDoc(fixture);
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            
            // Render PDF to Image using skia-canvas and pdf-parse's internal pdfjs
            // Actually, we'll use pdf-parse to get the images or just use pdfjs-dist directly
            const parser = new PDFParse({ data: pdfBuffer });
            const screenshot = await parser.getScreenshot({ scale: 2 });
            
            console.log(`DEBUG: Screenshot for ${fixture.id}:`, {
                pagesCount: screenshot.pages?.length,
                firstPageType: typeof screenshot.pages?.[0]?.data,
                firstPageLength: screenshot.pages?.[0]?.data?.length,
                magicBytes: Buffer.from(screenshot.pages?.[0]?.data?.slice(0, 8)).toString('hex')
            });

            if (screenshot.pages.length === 0) {
                console.error(`❌ No pages rendered for ${fixture.id}`);
                continue;
            }

            const page = screenshot.pages[0];
            const currentImagePath = path.join(DIFF_DIR, `${fixture.id}-current.png`);
            const goldenImagePath = path.join(GOLDEN_DIR, `${fixture.id}-golden.png`);
            const diffImagePath = path.join(DIFF_DIR, `${fixture.id}-diff.png`);

            // Save current version
            fs.writeFileSync(currentImagePath, Buffer.from(page.data));
            console.log(`DEBUG: Saved current image to ${currentImagePath}`);

            if (!fs.existsSync(goldenImagePath)) {
                console.log(`✨ No golden image found. Saving current as golden for ${fixture.id}`);
                fs.writeFileSync(goldenImagePath, Buffer.from(page.data));
                continue;
            }

            // Compare with golden
            console.log(`DEBUG: Loading golden from ${goldenImagePath}`);
            const goldenImage = await loadImage(goldenImagePath);
            
            console.log(`DEBUG: Loading current from ${currentImagePath}`);
            const currentImage = await loadImage(currentImagePath);

            const { width, height } = goldenImage;
            const canvas = new Canvas(width, height);
            const ctx = canvas.getContext('2d');
            
            const diffCanvas = new Canvas(width, height);
            const diffCtx = diffCanvas.getContext('2d');
            const diffData = diffCtx.createImageData(width, height);

            // Draw images to get pixel data
            ctx.drawImage(goldenImage, 0, 0);
            const goldenData = ctx.getImageData(0, 0, width, height).data;
            
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(currentImage, 0, 0);
            const currentData = ctx.getImageData(0, 0, width, height).data;

            const numDiffPixels = pixelmatch(
                goldenData,
                currentData,
                diffData.data,
                width,
                height,
                { threshold: 0.1 }
            );

            if (numDiffPixels > 0) {
                console.error(`❌ Visual regression detected for ${fixture.id}! ${numDiffPixels} pixels differ.`);
                diffCtx.putImageData(diffData, 0, 0);
                await diffCanvas.saveAs(diffImagePath);
                process.exit(1);
            } else {
                console.log(`✅ Visual regression check passed for ${fixture.id}`);
            }
        }

        console.log('\n✨ Visual regression testing complete!');
    } catch (error) {
        console.error('💥 Critical error during visual regression:', error);
        process.exit(1);
    }
}

runVisualRegression();
