const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

/**
 * TT-CSIRT Coat of Arms Technical Image-Quality Cleanup Script
 * 
 * Objectives:
 * 1. Eliminate residual white background in all outer areas and enclosed negative spaces:
 *    - Lower right space between Cocrico, Tobago island, shield, and motto ribbon
 *    - Lower left space between Scarlet Ibis, Trinidad island, shield, and motto ribbon
 *    - Upper right supporter space between Cocrico leg/tail and shield
 *    - Upper left supporter space between Scarlet Ibis leg/tail and shield
 *    - The four enclosed quadrant apertures inside the ship wheel crest
 * 2. Defringe and decontaminate edges to eliminate white/pale halos against the #B42318 red masthead.
 * 3. 100% Heraldic and Artwork Preservation:
 *    - Chevronel argent (white chevron on the shield) is 100% preserved and fully opaque.
 *    - Columbus ships' sails and cresting waves are 100% preserved.
 *    - Scarlet Ibis and Cocrico plumage, beaks, and legs are 100% preserved.
 *    - Motto banner ("Together We Aspire, Together We Achieve") and ribbon folds are 100% preserved.
 *    - Official colors, line weights, and fine contours are untouched.
 * 4. Optical Centering & Frame Tightening:
 *    - Crops away asymmetrical dead canvas padding (144px top vs 259px bottom in original)
 *    - Provides a clean, symmetrical 16px border so the asset renders with maximum visual presence
 *      and balance on both desktop and mobile viewports.
 */

const inputPath = path.resolve(__dirname, '../src/assets/Coat_of_arms_MoF.original.png');
const outputPath = path.resolve(__dirname, '../src/assets/Coat_of_arms_MoF.png');
const outputFooterPath = path.resolve(__dirname, '../src/assets/coat_of_arms_footer.png');

console.log('Reading source Coat of Arms from:', inputPath);
const srcBuf = fs.readFileSync(inputPath);
const orig = PNG.sync.read(srcBuf);
const w = orig.width;
const h = orig.height;
console.log(`Source dimensions: ${w}x${h}`);

// 1. Define seeds for flood-fill background isolation
// - Perimeter borders
const seeds = [
  ...Array.from({ length: w }, (_, x) => [x, 0]),
  ...Array.from({ length: w }, (_, x) => [x, h - 1]),
  ...Array.from({ length: h }, (_, y) => [0, y]),
  ...Array.from({ length: h }, (_, y) => [w - 1, y]),
  // Verified enclosed negative spaces within the Coat of Arms geometry:
  [1084, 1014], // Lower right negative space (between Cocrico, island, shield, banner)
  [518, 982],   // Lower left negative space (between Ibis, island, shield, banner)
  [1128, 722],  // Upper right supporter negative space (between Cocrico leg/tail and shield)
  [500, 728],   // Upper left supporter negative space (between Ibis leg/tail and shield)
  [773, 348],   // Ship wheel quadrant: top-left
  [817, 348],   // Ship wheel quadrant: top-right
  [818, 370],   // Ship wheel quadrant: bottom-right
  [775, 372],   // Ship wheel quadrant: bottom-left
];

// Step 1: Flood fill deep background with safe threshold 245
const isBg = new Uint8Array(w * h);
const bgQueue = [];
for (const [sx, sy] of seeds) {
  const idx = sy * w + sx;
  if (!isBg[idx]) {
    isBg[idx] = 1;
    bgQueue.push(idx);
  }
}

let bqh = 0;
while (bqh < bgQueue.length) {
  const curr = bgQueue[bqh++];
  const cx = curr % w;
  const cy = (curr / w) | 0;
  
  const neighbors = [];
  if (cx > 0) neighbors.push(curr - 1);
  if (cx < w - 1) neighbors.push(curr + 1);
  if (cy > 0) neighbors.push(curr - w);
  if (cy < h - 1) neighbors.push(curr + w);

  for (const n of neighbors) {
    if (!isBg[n]) {
      const np = n * 4;
      // Background pixels have high brightness across all channels
      if (orig.data[np] >= 245 && orig.data[np + 1] >= 245 && orig.data[np + 2] >= 245) {
        isBg[n] = 1;
        bgQueue.push(n);
      }
    }
  }
}
console.log(`Identified background pixels: ${bgQueue.length} (${((bgQueue.length / (w * h)) * 100).toFixed(2)}%)`);

// Step 2: Multi-layer distance transform to isolate fringe transition pixels (1..3 pixels from background)
const dist = new Int8Array(w * h).fill(-1);
for (let i = 0; i < w * h; i++) {
  if (isBg[i]) dist[i] = 0;
}

let front = [];
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x;
    if (dist[idx] === 0) {
      if (x > 0 && dist[idx - 1] === -1) { dist[idx - 1] = 1; front.push(idx - 1); }
      if (x < w - 1 && dist[idx + 1] === -1) { dist[idx + 1] = 1; front.push(idx + 1); }
      if (y > 0 && dist[idx - w] === -1) { dist[idx - w] = 1; front.push(idx - w); }
      if (y < h - 1 && dist[idx + w] === -1) { dist[idx + w] = 1; front.push(idx + w); }
    }
  }
}

for (let d = 2; d <= 4; d++) {
  const nextFront = [];
  for (const curr of front) {
    const cx = curr % w;
    const cy = (curr / w) | 0;
    const neighbors = [];
    if (cx > 0) neighbors.push(curr - 1);
    if (cx < w - 1) neighbors.push(curr + 1);
    if (cy > 0) neighbors.push(curr - w);
    if (cy < h - 1) neighbors.push(curr + w);

    for (const n of neighbors) {
      if (dist[n] === -1) {
        dist[n] = d;
        nextFront.push(n);
      }
    }
  }
  front = nextFront;
}

// Step 3: Nearest solid foreground mapping for matte color bleeding (defringing)
const nearestSolid = new Int32Array(w * h).fill(-1);
const solidQueue = [];
for (let i = 0; i < w * h; i++) {
  if (dist[i] >= 4) {
    nearestSolid[i] = i;
    solidQueue.push(i);
  }
}

let sqh = 0;
while (sqh < solidQueue.length) {
  const curr = solidQueue[sqh++];
  const cx = curr % w;
  const cy = (curr / w) | 0;
  const neighbors = [];
  if (cx > 0) neighbors.push(curr - 1);
  if (cx < w - 1) neighbors.push(curr + 1);
  if (cy > 0) neighbors.push(curr - w);
  if (cy < h - 1) neighbors.push(curr + w);

  for (const n of neighbors) {
    if (dist[n] > 0 && dist[n] < 4 && nearestSolid[n] === -1) {
      nearestSolid[n] = nearestSolid[curr];
      solidQueue.push(n);
    }
  }
}

// Step 4: Construct cleaned, defringed full-resolution image
const cleanedFull = new PNG({ width: w, height: h });
let transparentCount = 0;
let defringedCount = 0;
let preservedSolidCount = 0;

for (let i = 0; i < w * h; i++) {
  const p = i * 4;
  if (dist[i] === 0) {
    // 100% transparent background
    cleanedFull.data[p] = 0;
    cleanedFull.data[p + 1] = 0;
    cleanedFull.data[p + 2] = 0;
    cleanedFull.data[p + 3] = 0;
    transparentCount++;
  } else if (dist[i] >= 1 && dist[i] <= 3) {
    // Boundary transition pixel: defringe via alpha matting + color decontamination
    const r_obs = orig.data[p], g_obs = orig.data[p + 1], b_obs = orig.data[p + 2];
    const solidIdx = nearestSolid[i] !== -1 ? nearestSolid[i] : i;
    const sp = solidIdx * 4;
    const r_fg = orig.data[sp], g_fg = orig.data[sp + 1], b_fg = orig.data[sp + 2];

    const fg_lum = 0.299 * r_fg + 0.587 * g_fg + 0.114 * b_fg;
    const obs_lum = 0.299 * r_obs + 0.587 * g_obs + 0.114 * b_obs;

    let alpha = (255 - obs_lum) / Math.max(15, 255 - fg_lum);
    if (alpha < 0.06) {
      // Residual background haze
      cleanedFull.data[p] = 0;
      cleanedFull.data[p + 1] = 0;
      cleanedFull.data[p + 2] = 0;
      cleanedFull.data[p + 3] = 0;
      transparentCount++;
    } else {
      alpha = Math.min(1.0, alpha);
      cleanedFull.data[p] = r_fg;
      cleanedFull.data[p + 1] = g_fg;
      cleanedFull.data[p + 2] = b_fg;
      cleanedFull.data[p + 3] = Math.round(alpha * 255);
      defringedCount++;
    }
  } else {
    // 100% solid interior artwork pixel (unmodified original RGB)
    cleanedFull.data[p] = orig.data[p];
    cleanedFull.data[p + 1] = orig.data[p + 1];
    cleanedFull.data[p + 2] = orig.data[p + 2];
    cleanedFull.data[p + 3] = 255;
    preservedSolidCount++;
  }
}

console.log(`Cleaned image statistics:`);
console.log(`- Transparent background: ${transparentCount}`);
console.log(`- Defringed transition: ${defringedCount}`);
console.log(`- Preserved solid interior: ${preservedSolidCount}`);

// Step 5: Determine exact bounding box of the artwork
let minX = w, maxX = 0, minY = h, maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4;
    if (cleanedFull.data[p + 3] > 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const artW = maxX - minX + 1;
const artH = maxY - minY + 1;
console.log(`Artwork bounding box: [${minX}, ${minY}] to [${maxX}, ${maxY}] (${artW}x${artH})`);

// Step 6: Create tight, symmetrically framed output
// Symmetrical padding of 16px ensures anti-aliased subpixels are not clipped by viewport boundaries
const PADDING = 16;
const cropX = Math.max(0, minX - PADDING);
const cropY = Math.max(0, minY - PADDING);
const cropW = Math.min(w - cropX, artW + PADDING * 2);
const cropH = Math.min(h - cropY, artH + PADDING * 2);

console.log(`Cropping symmetrically to ${cropW}x${cropH} at offset (${cropX}, ${cropY})`);
const outputPng = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropX + x;
    const srcY = cropY + y;
    const srcP = (srcY * w + srcX) * 4;
    const dstP = (y * cropW + x) * 4;

    outputPng.data[dstP] = cleanedFull.data[srcP];
    outputPng.data[dstP + 1] = cleanedFull.data[srcP + 1];
    outputPng.data[dstP + 2] = cleanedFull.data[srcP + 2];
    outputPng.data[dstP + 3] = cleanedFull.data[srcP + 3];
  }
}

// Write to primary header asset
const outBuf = PNG.sync.write(outputPng, { deflateLevel: 9 });
fs.writeFileSync(outputPath, outBuf);
console.log(`Successfully wrote cleaned asset to: ${outputPath} (${outBuf.length} bytes)`);

// Also update footer asset for consistent quality
fs.writeFileSync(outputFooterPath, outBuf);
console.log(`Successfully updated footer asset at: ${outputFooterPath}`);

console.log('Technical image-quality cleanup completed successfully.');
