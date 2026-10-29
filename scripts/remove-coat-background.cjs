const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.resolve(__dirname, '../src/assets/Coat_of_arms_MoF.original.png');
const outputPath = path.resolve(__dirname, '../src/assets/Coat_of_arms_MoF.png');

console.log('Reading original Coat of Arms from:', inputPath);
const buffer = fs.readFileSync(inputPath);
const png = PNG.sync.read(buffer);

const w = png.width;
const h = png.height;
console.log(`Dimensions: ${w}x${h}`);

// 1. Inspect edge pixels
let minR = 255, minG = 255, minB = 255;
for (let x = 0; x < w; x++) {
  const topIdx = (x) << 2;
  const botIdx = ((h - 1) * w + x) << 2;
  minR = Math.min(minR, png.data[topIdx], png.data[botIdx]);
  minG = Math.min(minG, png.data[topIdx+1], png.data[botIdx+1]);
  minB = Math.min(minB, png.data[topIdx+2], png.data[botIdx+2]);
}
for (let y = 0; y < h; y++) {
  const leftIdx = (y * w) << 2;
  const rightIdx = (y * w + (w - 1)) << 2;
  minR = Math.min(minR, png.data[leftIdx], png.data[rightIdx]);
  minG = Math.min(minG, png.data[leftIdx+1], png.data[rightIdx+1]);
  minB = Math.min(minB, png.data[leftIdx+2], png.data[rightIdx+2]);
}
console.log(`Edge pixel color check - min values: R=${minR}, G=${minG}, B=${minB}`);

// 2. Conservative edge-connected flood-fill
const THRESHOLD = 250;
const visited = new Uint8Array(w * h);
const queue = new Int32Array(w * h);
let head = 0;
let tail = 0;

const push = (x, y) => {
  const idx = y * w + x;
  if (!visited[idx]) {
    const pIdx = idx << 2;
    if (png.data[pIdx] >= THRESHOLD && png.data[pIdx+1] >= THRESHOLD && png.data[pIdx+2] >= THRESHOLD) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  }
};

// Seed all perimeter pixels
for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}

while (head < tail) {
  const curr = queue[head++];
  const cx = curr % w;
  const cy = (curr / w) | 0;

  if (cx > 0) push(cx - 1, cy);
  if (cx < w - 1) push(cx + 1, cy);
  if (cy > 0) push(cx, cy - 1);
  if (cy < h - 1) push(cx, cy + 1);
}

console.log(`Connected background pixels identified: ${tail} of ${w * h} (${((tail / (w * h)) * 100).toFixed(2)}%)`);

// 3. Set background alpha to 0 while preserving foreground RGB and internal white pixels
let transparentCount = 0;
let opaqueForegroundCount = 0;
let preservedInternalWhiteCount = 0;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x;
    const pIdx = idx << 2;

    if (visited[idx]) {
      png.data[pIdx + 3] = 0; // Transparent background
      transparentCount++;
    } else {
      opaqueForegroundCount++;
      if (png.data[pIdx] >= THRESHOLD && png.data[pIdx+1] >= THRESHOLD && png.data[pIdx+2] >= THRESHOLD) {
        preservedInternalWhiteCount++;
      }
    }
  }
}

console.log(`Verification:`);
console.log(`- Transparent background pixels (alpha=0): ${transparentCount}`);
console.log(`- Opaque foreground pixels (alpha=255): ${opaqueForegroundCount}`);
console.log(`- Preserved internal white pixels: ${preservedInternalWhiteCount}`);

// 4. Encode lossless PNG
const outOptions = {
  deflateLevel: 9,
  deflateStrategy: 3,
  filterType: -1,
  colorType: 6, // RGBA
  inputColorType: 6
};

const outputBuffer = PNG.sync.write(png, outOptions);
fs.writeFileSync(outputPath, outputBuffer);
console.log(`Wrote lossless RGBA PNG to ${outputPath} (${outputBuffer.length} bytes)`);

// 5. Verification of written file
const reloaded = PNG.sync.read(fs.readFileSync(outputPath));
console.log(`Reloaded PNG verification:`);
console.log(`- Dimensions: ${reloaded.width}x${reloaded.height}`);
console.log(`- Corner (0,0) alpha: ${reloaded.data[3]}`);
console.log(`- Center (800,800) RGB+A: ${reloaded.data[(800*w+800)*4]}, ${reloaded.data[(800*w+800)*4+1]}, ${reloaded.data[(800*w+800)*4+2]}, ${reloaded.data[(800*w+800)*4+3]}`);
console.log('Background removal complete.');
