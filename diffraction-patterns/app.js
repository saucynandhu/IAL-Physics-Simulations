// Canvas setup
const canvas = document.getElementById('diffraction-canvas');
const ctx = canvas.getContext('2d');

// Control elements
const patternType = document.getElementById('pattern-type');
const wavelength = document.getElementById('wavelength');
const slitWidth = document.getElementById('slit-width');
const slitSeparation = document.getElementById('slit-separation');
const screenDistance = document.getElementById('screen-distance');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');

// Display elements
const wavelengthValue = document.getElementById('wavelength-value');
const slitWidthValue = document.getElementById('slit-width-value');
const slitSeparationValue = document.getElementById('slit-separation-value');
const screenDistanceValue = document.getElementById('screen-distance-value');
const wavelengthDisplay = document.getElementById('wavelength-display');
const slitWidthDisplay = document.getElementById('slit-width-display');
const slitSeparationDisplay = document.getElementById('slit-separation-display');
const screenDistanceDisplay = document.getElementById('screen-distance-display');
const centralWidth = document.getElementById('central-width');
const firstMinimum = document.getElementById('first-minimum');
const fringeSpacing = document.getElementById('fringe-spacing');

// Simulation parameters
let isRunning = false;
let animationId = null;

// Resize canvas to fit container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Update display values
function updateDisplayValues() {
    wavelengthValue.textContent = `λ = ${wavelength.value} nm`;
    slitWidthValue.textContent = `${slitWidth.value} μm`;
    slitSeparationValue.textContent = `${slitSeparation.value} μm`;
    screenDistanceValue.textContent = `${screenDistance.value} m`;
    
    wavelengthDisplay.textContent = `λ = ${wavelength.value} nm`;
    slitWidthDisplay.textContent = `${slitWidth.value} μm`;
    slitSeparationDisplay.textContent = `${slitSeparation.value} μm`;
    screenDistanceDisplay.textContent = `${screenDistance.value} m`;
    
    // Calculate and display frequency
    const frequency = (3e8 / (wavelength.value * 1e-9)) / 1e12; // Convert to THz
    document.getElementById('frequency-display').textContent = `ν = ${frequency.toFixed(2)} THz`;
}

// Calculate intensity for single slit
function singleSlitIntensity(x, wavelength, slitWidth, screenDistance) {
    const k = 2 * Math.PI / (wavelength * 1e-9); // Convert nm to m
    const a = slitWidth * 1e-6; // Convert μm to m
    const L = screenDistance;
    const beta = k * a * x / (2 * L);
    
    if (beta === 0) return 1;
    return Math.pow(Math.sin(beta) / beta, 2);
}

// Calculate intensity for double slit
function doubleSlitIntensity(x, wavelength, slitWidth, slitSeparation, screenDistance) {
    const singleSlit = singleSlitIntensity(x, wavelength, slitWidth, screenDistance);
    const k = 2 * Math.PI / (wavelength * 1e-9);
    const d = slitSeparation * 1e-6;
    const L = screenDistance;
    const delta = k * d * x / L;
    
    return singleSlit * Math.pow(Math.cos(delta / 2), 2);
}

// Calculate intensity for circular aperture
function circularApertureIntensity(x, wavelength, apertureDiameter, screenDistance) {
    const k = 2 * Math.PI / (wavelength * 1e-9);
    const a = apertureDiameter * 1e-6 / 2; // Convert μm to m and get radius
    const L = screenDistance;
    const r = Math.sqrt(x * x + L * L);
    const theta = Math.atan2(x, L);
    const ka = k * a;
    const kasin = ka * Math.sin(theta);
    
    if (kasin === 0) return 1;
    return Math.pow(2 * Math.besselj1(kasin) / kasin, 2);
}

// Draw the diffraction pattern
function drawPattern() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Get current parameters
    const wl = parseFloat(wavelength.value);
    const sw = parseFloat(slitWidth.value);
    const ss = parseFloat(slitSeparation.value);
    const sd = parseFloat(screenDistance.value);
    
    // Draw pattern
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Scale factor for better visualization
    const scaleFactor = 0.0005;
    
    for (let x = 0; x < width; x++) {
        const relativeX = (x - centerX) * scaleFactor;
        let intensity;
        
        switch (patternType.value) {
            case 'single-slit':
                intensity = singleSlitIntensity(relativeX, wl, sw, sd);
                break;
            case 'double-slit':
                intensity = doubleSlitIntensity(relativeX, wl, sw, ss, sd);
                break;
            case 'circular':
                intensity = circularApertureIntensity(relativeX, wl, sw, sd);
                break;
        }
        
        // Enhanced intensity scaling for better visibility
        // Apply gamma correction and increase brightness
        intensity = Math.pow(intensity, 0.7) * 1.5; // Gamma correction and brightness boost
        intensity = Math.min(intensity, 1); // Clamp to maximum brightness
        
        // Convert intensity to color (white to black)
        const color = Math.floor(intensity * 255);
        
        // Draw vertical line
        for (let y = 0; y < height; y++) {
            const i = (y * width + x) * 4;
            data[i] = color;     // R
            data[i + 1] = color; // G
            data[i + 2] = color; // B
            data[i + 3] = 255;   // A
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw diffraction orders
    drawDiffractionOrders(wl, sw, ss, sd, scaleFactor);
    
    // Calculate and update pattern characteristics
    updatePatternCharacteristics(wl, sw, ss, sd);
    
    if (isRunning) {
        animationId = requestAnimationFrame(drawPattern);
    }
}

// Draw diffraction orders
function drawDiffractionOrders(wavelength, slitWidth, slitSeparation, screenDistance, scaleFactor) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Convert parameters to SI units
    const wl = wavelength * 1e-9; // nm to m
    const sw = slitWidth * 1e-6;  // μm to m
    const ss = slitSeparation * 1e-6; // μm to m
    const L = screenDistance;
    
    // Calculate positions for orders
    const orders = [];
    const maxOrders = 5; // Show up to 5th order
    
    for (let m = -maxOrders; m <= maxOrders; m++) {
        let x;
        if (patternType.value === 'single-slit') {
            // For single slit, positions of minima
            x = centerX + (m * wl * L / sw) / scaleFactor;
        } else if (patternType.value === 'double-slit') {
            // For double slit, positions of maxima
            x = centerX + (m * wl * L / ss) / scaleFactor;
        } else {
            // For circular aperture, positions of minima
            x = centerX + (m * 1.22 * wl * L / sw) / scaleFactor;
        }
        
        if (x >= 0 && x <= width) {
            orders.push({ x, m });
        }
    }
    
    // Draw order markers
    orders.forEach(order => {
        // Draw outer glow
        ctx.beginPath();
        ctx.arc(order.x, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        
        // Draw main dot
        ctx.beginPath();
        ctx.arc(order.x, centerY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
        
        // Draw inner highlight
        ctx.beginPath();
        ctx.arc(order.x, centerY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw order number with glow
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Draw text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw the number
        ctx.fillStyle = '#ffffff';
        ctx.fillText(order.m.toString(), order.x, centerY - 20);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    });
}

// Update pattern characteristics
function updatePatternCharacteristics(wavelength, slitWidth, slitSeparation, screenDistance) {
    const wl = wavelength * 1e-9; // Convert nm to m
    const sw = slitWidth * 1e-6;  // Convert μm to m
    const ss = slitSeparation * 1e-6; // Convert μm to m
    const L = screenDistance;
    
    // Calculate central maximum width
    const centralWidthValue = 2 * wl * L / sw;
    centralWidth.textContent = `${(centralWidthValue * 1000).toFixed(2)} mm`;
    
    // Calculate first minimum position
    const firstMinimumValue = wl * L / sw;
    firstMinimum.textContent = `${(firstMinimumValue * 1000).toFixed(2)} mm`;
    
    // Calculate fringe spacing (for double slit)
    const fringeSpacingValue = wl * L / ss;
    fringeSpacing.textContent = `${(fringeSpacingValue * 1000).toFixed(2)} mm`;
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
    if (isRunning) {
        drawPattern();
    }
});

patternType.addEventListener('change', () => {
    if (isRunning) {
        drawPattern();
    }
});

wavelength.addEventListener('input', () => {
    updateDisplayValues();
    if (isRunning) {
        drawPattern();
    }
});

slitWidth.addEventListener('input', () => {
    updateDisplayValues();
    if (isRunning) {
        drawPattern();
    }
});

slitSeparation.addEventListener('input', () => {
    updateDisplayValues();
    if (isRunning) {
        drawPattern();
    }
});

screenDistance.addEventListener('input', () => {
    updateDisplayValues();
    if (isRunning) {
        drawPattern();
    }
});

startButton.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        startButton.textContent = 'Pause';
        drawPattern();
    } else {
        isRunning = false;
        startButton.textContent = 'Start Simulation';
        cancelAnimationFrame(animationId);
    }
});

resetButton.addEventListener('click', () => {
    isRunning = false;
    startButton.textContent = 'Start Simulation';
    cancelAnimationFrame(animationId);
    
    // Reset parameters to default values
    wavelength.value = 550;
    slitWidth.value = 20;
    slitSeparation.value = 50;
    screenDistance.value = 1;
    
    updateDisplayValues();
    drawPattern();
});

// Initialize
resizeCanvas();
updateDisplayValues();
drawPattern(); 