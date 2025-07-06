// Vita Classical Shade Guide colors
const vitaShades = {
    'A1': '#f4f1eb', 'A2': '#f0ead8', 'A3': '#e6d5b8', 'A3.5': '#e0cfa8',
    'A4': '#d9c898', 'B1': '#f2f0e6', 'B2': '#efebdc', 'B3': '#e8dfcc',
    'B4': '#e1d6bc', 'C1': '#f1f0ea', 'C2': '#ede8dc', 'C3': '#e6ddd0',
    'C4': '#dfd6c4', 'D1': '#f0efeb', 'D2': '#eceae0', 'D3': '#e5e2d8',
    'D4': '#ded9cb'
};
let currentShade = 'A1';
let currentColor = vitaShades['A1'];
let uploadedImage = null;
let useSegmentation = false;
// Initialize the application
function init() {
    initializeShadeGuide();
    setupEventListeners();
    updateToothVisualization();
    updateShadeInfo('A1');
    addSegmentationToggle();
}
// Initialize the shade guide
function initializeShadeGuide() {
    const shadeGrid = document.getElementById('shadeGrid');
    shadeGrid.innerHTML = '';
    Object.entries(vitaShades).forEach(([shade, color]) => {
        const shadeElement = document.createElement('div');
        shadeElement.className = 'shade-sample';
        shadeElement.style.backgroundColor = color;
        shadeElement.textContent = shade;
        shadeElement.onclick = () => selectShade(shade, color);
        shadeElement.dataset.shade = shade;
        if (shade === 'A1') {
            shadeElement.classList.add('selected');
        }
        shadeGrid.appendChild(shadeElement);
    });
}
// Setup event listeners
function setupEventListeners() {
    const imageInput = document.getElementById('imageInput');
    const resetBtn = document.getElementById('resetBtn');
    const uploadArea = document.querySelector('.upload-area');
    imageInput.addEventListener('change', handleImageUpload);
    resetBtn.addEventListener('click', resetUpload);
    // Make upload area clickable
    uploadArea.addEventListener('click', function(e) {
        if (e.target.classList.contains('upload-input')) return;
        imageInput.click();
    });
    // Control listeners
    document.getElementById('customColor').addEventListener('change', function() {
        currentShade = 'custom';
        currentColor = this.value;
        document.querySelectorAll('.shade-sample').forEach(el => {
            el.classList.remove('selected');
        });
        updateToothVisualization();
        updateImageVisualization();
        updateShadeInfo('Custom');
    });
    document.getElementById('opacity').addEventListener('input', function() {
        document.getElementById('opacityValue').textContent = this.value;
        updateToothVisualization();
    });
    document.getElementById('brightness').addEventListener('input', function() {
        document.getElementById('brightnessValue').textContent = this.value;
        updateToothVisualization();
    });
    document.getElementById('saturation').addEventListener('input', function() {
        document.getElementById('saturationValue').textContent = this.value;
        updateToothVisualization();
    });
    // Image overlay controls
    document.getElementById('toothOpacity').addEventListener('input', function() {
        document.getElementById('toothOpacityValue').textContent = this.value;
        updateImageVisualization();
    });
    document.getElementById('shadeIntensity').addEventListener('input', function() {
        document.getElementById('shadeIntensityValue').textContent = this.value;
        updateImageVisualization();
    });
    document.getElementById('blendMode').addEventListener('change', function() {
        updateImageVisualization();
    });
    // Drag and drop functionality
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.style.borderColor = '#007bff';
        uploadSection.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
    });
    uploadSection.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadSection.style.borderColor = '#6c757d';
        uploadSection.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
    });
    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.style.borderColor = '#6c757d';
        uploadSection.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });
}
// Switch between visualization tabs
function switchTab(tabName, event) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
}
// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}
// Handle image file processing
function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImage = e.target.result;
        displayImagePreview(uploadedImage);
        analyzeImage(uploadedImage);
    };
    reader.readAsDataURL(file);
}
// Display image preview
function displayImagePreview(imageSrc) {
    const imagePreview = document.getElementById('imagePreview');
    const resetBtn = document.getElementById('resetBtn');
    const uploadContent = document.querySelector('.upload-content');
    const beforeImage = document.getElementById('beforeImage');
    const noImageMessage = document.getElementById('noImageMessage');
    const beforeAfterContainer = document.getElementById('beforeAfterContainer');
    const overlayControls = document.getElementById('overlayControls');
    imagePreview.src = imageSrc;
    imagePreview.style.display = 'block';
    resetBtn.style.display = 'block';
    uploadContent.style.display = 'none';
    // Setup before/after comparison
    beforeImage.src = imageSrc;
    noImageMessage.style.display = 'none';
    beforeAfterContainer.style.display = 'flex';
    overlayControls.style.display = 'grid';
    // Initialize the after image
    updateImageVisualization();
}
// Update image visualization with shade overlay
function updateImageVisualization() {
    if (!uploadedImage) return;
    const canvas = document.getElementById('afterImage');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw original image
        ctx.drawImage(img, 0, 0);
        // Get current shade color
        const customColor = document.getElementById('customColor').value;
        const finalColor = currentShade === 'custom' ? customColor : currentColor;
        // Get control values
        const toothOpacity = document.getElementById('toothOpacity').value / 100;
        const shadeIntensity = document.getElementById('shadeIntensity').value / 100;
        const blendMode = document.getElementById('blendMode').value;
        // Apply shade overlay to tooth areas
        applyShadeOverlay(ctx, canvas.width, canvas.height, finalColor, toothOpacity, shadeIntensity, blendMode);
    };
    img.src = uploadedImage;
}
// Apply shade overlay to detected tooth areas
function applyShadeOverlay(ctx, width, height, shadeColor, opacity, intensity, blendMode) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    // Convert shade color to RGB
    const shadeRgb = hexToRgb(shadeColor);
    if (!shadeRgb) return;
    // Detect tooth areas and apply shading
    const centerX = width / 2;
    const centerY = height / 2;
    const toothRegionWidth = width * 0.6;
    const toothRegionHeight = height * 0.4;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Calculate distance from center
            const distanceFromCenter = Math.sqrt(
                Math.pow((x - centerX) / toothRegionWidth, 2) + 
                Math.pow((y - centerY) / toothRegionHeight, 2)
            );
            // Check if pixel is in tooth-like color range and region
            const brightness = (r + g + b) / 3;
            const isToothLike = brightness > 100 && brightness < 240 && distanceFromCenter < 1;
            if (isToothLike) {
                // Apply shade based on blend mode
                let newR, newG, newB;
                switch (blendMode) {
                    case 'multiply':
                        newR = (r * shadeRgb.r / 255) * intensity + r * (1 - intensity);
                        newG = (g * shadeRgb.g / 255) * intensity + g * (1 - intensity);
                        newB = (b * shadeRgb.b / 255) * intensity + b * (1 - intensity);
                        break;
                    case 'overlay':
                        newR = r < 128 ? (2 * r * shadeRgb.r / 255) : (255 - 2 * (255 - r) * (255 - shadeRgb.r) / 255);
                        newG = g < 128 ? (2 * g * shadeRgb.g / 255) : (255 - 2 * (255 - g) * (255 - shadeRgb.g) / 255);
                        newB = b < 128 ? (2 * b * shadeRgb.b / 255) : (255 - 2 * (255 - b) * (255 - shadeRgb.b) / 255);
                        newR = newR * intensity + r * (1 - intensity);
                        newG = newG * intensity + g * (1 - intensity);
                        newB = newB * intensity + b * (1 - intensity);
                        break;
                    case 'soft-light':
                        newR = r * (1 - intensity) + (r + shadeRgb.r) / 2 * intensity;
                        newG = g * (1 - intensity) + (g + shadeRgb.g) / 2 * intensity;
                        newB = b * (1 - intensity) + (b + shadeRgb.b) / 2 * intensity;
                        break;
                    case 'color':
                    default:
                        newR = shadeRgb.r * intensity + r * (1 - intensity);
                        newG = shadeRgb.g * intensity + g * (1 - intensity);
                        newB = shadeRgb.b * intensity + b * (1 - intensity);
                        break;
                }
                // Apply opacity
                data[idx] = Math.round(newR * opacity + r * (1 - opacity));
                data[idx + 1] = Math.round(newG * opacity + g * (1 - opacity));
                data[idx + 2] = Math.round(newB * opacity + b * (1 - opacity));
            }
        }
    }
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
}
// Reset upload
function resetUpload() {
    const imagePreview = document.getElementById('imagePreview');
    const resetBtn = document.getElementById('resetBtn');
    const uploadContent = document.querySelector('.upload-content');
    const imageInput = document.getElementById('imageInput');
    const analysisSection = document.getElementById('analysisSection');
    const noImageMessage = document.getElementById('noImageMessage');
    const beforeAfterContainer = document.getElementById('beforeAfterContainer');
    const overlayControls = document.getElementById('overlayControls');
    imagePreview.style.display = 'none';
    resetBtn.style.display = 'none';
    uploadContent.style.display = 'flex';
    imageInput.value = '';
    analysisSection.classList.remove('active');
    // Reset image visualization
    noImageMessage.style.display = 'block';
    beforeAfterContainer.style.display = 'none';
    overlayControls.style.display = 'none';
    // Reset auto-matched highlighting
    document.querySelectorAll('.shade-sample').forEach(el => {
        el.classList.remove('auto-matched');
    });
    uploadedImage = null;
}
// Analyze image and detect tooth color
function analyzeImage(imageSrc) {
    const processing = document.getElementById('processing');
    processing.classList.add('active');
    if (useSegmentation && typeof analyzeImageWithSegmentation === 'function') {
        analyzeImageWithSegmentation(imageSrc, (colors, region, canvas, ctx) => {
            setTimeout(() => {
                const matchedShade = findClosestShade(colors.dominant);
                displayAnalysisResults(colors, matchedShade);
                // Optionally visualize region
                visualizeRegionOnCanvas(region, canvas, ctx);
                processing.classList.remove('active');
            }, 1200);
        });
    } else {
        // Original center-region method
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const sampleSize = Math.min(canvas.width, canvas.height) / 4;
            const imageData = ctx.getImageData(
                centerX - sampleSize/2, 
                centerY - sampleSize/2, 
                sampleSize, 
                sampleSize
            );
            const colors = analyzeImageData(imageData);
            setTimeout(() => {
                const matchedShade = findClosestShade(colors.dominant);
                displayAnalysisResults(colors, matchedShade);
                processing.classList.remove('active');
            }, 1200);
        };
        img.src = imageSrc;
    }
}
// Analyze image data to extract colors
function analyzeImageData(imageData) {
    const data = imageData.data;
    const pixels = [];
    const colorCount = {};
    // Sample pixels and filter out very dark/light pixels (likely shadows/highlights)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        // Filter out extreme values that are likely not tooth color
        if (brightness > 50 && brightness < 250) {
            pixels.push({ r, g, b });
            const colorKey = `${Math.floor(r/10)*10},${Math.floor(g/10)*10},${Math.floor(b/10)*10}`;
            colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
        }
    }
    // Calculate average color
    const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length;
    const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length;
    const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length;
    // Find dominant color
    const dominantColorKey = Object.keys(colorCount).reduce((a, b) => 
        colorCount[a] > colorCount[b] ? a : b
    );
    const [domR, domG, domB] = dominantColorKey.split(',').map(Number);
    return {
        average: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
        dominant: { r: domR, g: domG, b: domB }
    };
}
// Find closest shade match
function findClosestShade(color) {
    let minDistance = Infinity;
    let closestShade = 'A1';
    Object.entries(vitaShades).forEach(([shade, hex]) => {
        const shadeRgb = hexToRgb(hex);
        const distance = colorDistance(color, shadeRgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestShade = shade;
        }
    });
    return {
        shade: closestShade,
        confidence: Math.max(60, Math.min(95, 100 - (minDistance / 10)))
    };
}
// Convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
// Calculate color distance
function colorDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff*rDiff + gDiff*gDiff + bDiff*bDiff);
}
// RGB to hex conversion
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
// Display analysis results
function displayAnalysisResults(colors, matchResult) {
    const analysisSection = document.getElementById('analysisSection');
    const matchedShade = document.getElementById('matchedShade');
    const confidenceScore = document.getElementById('confidenceScore');
    const dominantColor = document.getElementById('dominantColor');
    const averageColor = document.getElementById('averageColor');
    // Show analysis section
    analysisSection.classList.add('active');
    // Update matched shade
    matchedShade.textContent = matchResult.shade;
    confidenceScore.textContent = Math.round(matchResult.confidence) + '%';
    // Update color samples
    const domHex = rgbToHex(colors.dominant.r, colors.dominant.g, colors.dominant.b);
    const avgHex = rgbToHex(colors.average.r, colors.average.g, colors.average.b);
    dominantColor.style.backgroundColor = domHex;
    dominantColor.textContent = domHex.toUpperCase();
    averageColor.style.backgroundColor = avgHex;
    averageColor.textContent = avgHex.toUpperCase();
    // Auto-select the matched shade
    selectShade(matchResult.shade, vitaShades[matchResult.shade]);
    // Highlight the auto-matched shade
    document.querySelectorAll('.shade-sample').forEach(el => {
        el.classList.remove('auto-matched');
        if (el.dataset.shade === matchResult.shade) {
            el.classList.add('auto-matched');
        }
    });
}
// Select a shade
function selectShade(shade, color) {
    currentShade = shade;
    currentColor = color;
    // Update UI
    document.querySelectorAll('.shade-sample').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedElement = document.querySelector('[data-shade="' + shade + '"]');
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
    // Update tooth visualization
    updateToothVisualization();
    // Update image visualization
    updateImageVisualization();
    // Update shade information
    updateShadeInfo(shade);
}
// Update tooth visualization
function updateToothVisualization() {
    const tooth = document.getElementById('tooth');
    const opacity = document.getElementById('opacity').value / 100;
    const brightness = document.getElementById('brightness').value;
    const saturation = document.getElementById('saturation').value;
    const customColor = document.getElementById('customColor').value;
    const finalColor = currentShade === 'custom' ? customColor : currentColor;
    tooth.style.background = `linear-gradient(135deg, ${finalColor}, ${adjustColor(finalColor, -20)})`;
    tooth.style.opacity = opacity;
    tooth.style.filter = `brightness(${brightness}%) saturate(${saturation}%)`;
}
// Adjust color brightness
function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    R = Math.max(0, Math.min(255, R));
    G = Math.max(0, Math.min(255, G));
    B = Math.max(0, Math.min(255, B));
    return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}
// Update shade information
function updateShadeInfo(shade) {
    const shadeCode = document.getElementById('shadeCode');
    const hueInfo = document.getElementById('hueInfo');
    const chromaInfo = document.getElementById('chromaInfo');
    const valueInfo = document.getElementById('valueInfo');
    shadeCode.textContent = shade;
    // Parse shade information
    const hue = shade.charAt(0);
    const chroma = shade.slice(1);
    const hueDescriptions = {
        'A': 'Reddish Brown',
        'B': 'Reddish Yellow',
        'C': 'Gray',
        'D': 'Reddish Gray'
    };
    const chromaDescriptions = {
        '1': 'Low Saturation',
        '2': 'Medium Saturation',
        '3': 'High Saturation',
        '3.5': 'Very High Saturation',
        '4': 'Maximum Saturation'
    };
    hueInfo.textContent = `${hue} (${hueDescriptions[hue] || 'Unknown'})`;
    chromaInfo.textContent = `${chroma} (${chromaDescriptions[chroma] || 'Unknown'})`;
    // Value determination based on shade
    const lightShades = ['A1', 'B1', 'C1', 'D1'];
    const mediumShades = ['A2', 'B2', 'C2', 'D2'];
    const darkShades = ['A3', 'B3', 'C3', 'D3', 'A3.5'];
    const veryDarkShades = ['A4', 'B4', 'C4', 'D4'];
    if (lightShades.includes(shade)) {
        valueInfo.textContent = 'Light';
    } else if (mediumShades.includes(shade)) {
        valueInfo.textContent = 'Medium';
    } else if (darkShades.includes(shade)) {
        valueInfo.textContent = 'Dark';
    } else if (veryDarkShades.includes(shade)) {
        valueInfo.textContent = 'Very Dark';
    } else {
        valueInfo.textContent = 'Custom';
    }
}
// Initialize the application
init();

function addSegmentationToggle() {
    const container = document.querySelector('.container');
    const toggleDiv = document.createElement('div');
    toggleDiv.style.textAlign = 'center';
    toggleDiv.style.margin = '20px 0';
    toggleDiv.innerHTML = `
        <label style="font-weight:bold;">
            <input type="checkbox" id="segmentationToggle"> Use Color Segmentation (Experimental)
        </label>
    `;
    container.insertBefore(toggleDiv, container.children[1]);
    document.getElementById('segmentationToggle').addEventListener('change', function() {
        useSegmentation = this.checked;
        if (uploadedImage) {
            analyzeImage(uploadedImage);
        }
    });
}

function visualizeRegionOnCanvas(region, canvas, ctx) {
    // Draw a semi-transparent overlay on the detected region
    if (!region || !canvas || !ctx) return;
    const overlay = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < overlay.data.length; i += 4) {
        overlay.data[i + 3] = 0; // fully transparent by default
    }
    for (const idx of region) {
        const i = idx * 4;
        overlay.data[i] = 0;
        overlay.data[i + 1] = 255;
        overlay.data[i + 2] = 0;
        overlay.data[i + 3] = 80; // semi-transparent green
    }
    ctx.putImageData(overlay, 0, 0);
} 