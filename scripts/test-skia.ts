
import { Canvas, loadImage } from 'skia-canvas';
import fs from 'fs';

async function test() {
    try {
        const canvas = new Canvas(100, 100);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        const buffer = await canvas.toBuffer('png');
        console.log('Canvas toBuffer success, length:', buffer.length);
        const img = await loadImage(buffer);
        console.log('loadImage success');
    } catch (e) {
        console.error('Test failed:', e);
    }
}
test();
