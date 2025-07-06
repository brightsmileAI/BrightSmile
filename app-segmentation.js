// Color Segmentation Tooth Detection (Alternative Approach)
// This script provides an alternative to the center-region method by segmenting the largest tooth-like region in the image.

import * as bodyPix from '@tensorflow-models/body-pix';

function analyzeImageWithSegmentation(imageSrc, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // 1. Create mask of tooth-like pixels
        const mask = createToothMask(imageData);
        // 2. Find largest connected region in mask
        const region = findLargestRegion(mask, canvas.width, canvas.height);
        // 3. Analyze color in this region
        const colors = analyzeRegionColors(imageData, region);
        callback(colors, region, canvas, ctx);
    };
    img.src = imageSrc;
}

function createToothMask(imageData) {
    const data = imageData.data;
    const mask = new Uint8Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        const saturation = getSaturation(r, g, b);
        // Tooth-like: bright, not too saturated
        if (brightness > 100 && brightness < 245 && saturation < 60) {
            mask[i / 4] = 1;
        } else {
            mask[i / 4] = 0;
        }
    }
    return mask;
}

function getSaturation(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) return 0;
    return ((max - min) / max) * 100;
}

// Flood fill to find largest region
function findLargestRegion(mask, width, height) {
    const visited = new Uint8Array(mask.length);
    let maxRegion = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (mask[idx] && !visited[idx]) {
                const region = [];
                const stack = [idx];
                visited[idx] = 1;
                while (stack.length) {
                    const current = stack.pop();
                    region.push(current);
                    const cx = current % width;
                    const cy = Math.floor(current / width);
                    // 4-connected neighbors
                    [
                        [cx - 1, cy], [cx + 1, cy],
                        [cx, cy - 1], [cx, cy + 1]
                    ].forEach(([nx, ny]) => {
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nidx = ny * width + nx;
                            if (mask[nidx] && !visited[nidx]) {
                                visited[nidx] = 1;
                                stack.push(nidx);
                            }
                        }
                    });
                }
                if (region.length > maxRegion.length) {
                    maxRegion = region;
                }
            }
        }
    }
    return maxRegion;
}

function analyzeRegionColors(imageData, region) {
    const data = imageData.data;
    let sumR = 0, sumG = 0, sumB = 0;
    const colorCount = {};
    for (const idx of region) {
        const i = idx * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        sumR += r;
        sumG += g;
        sumB += b;
        const colorKey = `${Math.floor(r/10)*10},${Math.floor(g/10)*10},${Math.floor(b/10)*10}`;
        colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
    }
    const avgR = sumR / region.length;
    const avgG = sumG / region.length;
    const avgB = sumB / region.length;
    // Find dominant color
    const dominantColorKey = Object.keys(colorCount).reduce((a, b) => colorCount[a] > colorCount[b] ? a : b);
    const [domR, domG, domB] = dominantColorKey.split(',').map(Number);
    return {
        average: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
        dominant: { r: domR, g: domG, b: domB }
    };
}

async function runSegmentation(imageElement) {
    const net = await bodyPix.load();
    const segmentation = await net.segmentPersonParts(imageElement);
    // segmentation.data is a mask, you can extract mouth/teeth region
}

// Example usage:
// analyzeImageWithSegmentation(imageSrc, (colors, region, canvas, ctx) => {
//     // Use colors.average, colors.dominant, region (array of pixel indices)
//     // Optionally visualize region on canvas
// }); 