// Get canvas and context
const canvas = document.getElementById('projectile-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;  // Increased width
canvas.height = 600; // Increased height

// Physics constants
const SCALE = 10; // Reduced scale (pixels per meter) to zoom out
const BALL_RADIUS = 5;
const TRAIL_LENGTH = 200; // Increased trail length for longer paths

// Simulation state
let isSimulating = false;
let time = 0;
let trail = [];

// Projectile properties
const projectile = {
    x: 0,
    y: canvas.height / SCALE - 2,
    vx: 0,
    vy: 0,
    mass: 10, // kg (shotput mass)
    radius: 0.15, // m (shotput radius)
    dragCoefficient: 0.47 // for a sphere
};

// Get control elements
const angleSlider = document.getElementById('angle');
const velocitySlider = document.getElementById('initial-velocity');
const gravitySlider = document.getElementById('gravity');
const heightSlider = document.getElementById('height');
const bouncinessSlider = document.getElementById('bounciness');
const launchButton = document.getElementById('start');
const resetButton = document.getElementById('reset');

// Get display elements
const angleValue = document.getElementById('angle-value');
const velocityValue = document.getElementById('velocity-value');
const gravityValue = document.getElementById('gravity-value');
const heightValue = document.getElementById('height-value');
const bouncinessValue = document.getElementById('bounciness-value');
const timeDisplay = document.getElementById('time');
const rangeDisplay = document.getElementById('range');
const maxHeightDisplay = document.getElementById('max-height');
const horizontalVelocityDisplay = document.getElementById('horizontal-velocity');
const verticalVelocityDisplay = document.getElementById('vertical-velocity');
const totalVelocityDisplay = document.getElementById('total-velocity');
const xPositionDisplay = document.getElementById('x-position');
const yPositionDisplay = document.getElementById('y-position');
const distanceDisplay = document.getElementById('distance');

// Update display values
function updateDisplayValues() {
    angleValue.textContent = `${parseFloat(angleSlider.value).toFixed(1)}°`;
    velocityValue.textContent = `${parseFloat(velocitySlider.value).toFixed(1)} m/s`;
    gravityValue.textContent = `${parseFloat(gravitySlider.value).toFixed(1)} m/s²`;
    heightValue.textContent = `${parseFloat(heightSlider.value).toFixed(1)} m`;
    bouncinessValue.textContent = `${parseFloat(bouncinessSlider.value).toFixed(1)}`;
}

// Launch projectile
function launch() {
    if (isSimulating) return;
    
    const angle = parseFloat(angleSlider.value) * Math.PI / 180;
    const velocity = parseFloat(velocitySlider.value);
    const height = parseFloat(heightSlider.value);
    
    projectile.x = 0;
    projectile.y = canvas.height / SCALE - height;
    projectile.vx = velocity * Math.cos(angle);
    projectile.vy = -velocity * Math.sin(angle);
    
    isSimulating = true;
    time = 0;
    trail = [];
}

// Reset simulation
function reset() {
    isSimulating = false;
    time = 0;
    trail = [];
    projectile.x = 0;
    projectile.y = canvas.height / SCALE - parseFloat(heightSlider.value);
    projectile.vx = 0;
    projectile.vy = 0;
    
    // Reset displays
    updateDisplays();
}

// Update displays
function updateDisplays() {
    timeDisplay.textContent = time.toFixed(1);
    rangeDisplay.textContent = projectile.x.toFixed(1);
    maxHeightDisplay.textContent = (canvas.height / SCALE - Math.min(...trail.map(p => p.y))).toFixed(1);
    horizontalVelocityDisplay.textContent = projectile.vx.toFixed(1);
    verticalVelocityDisplay.textContent = projectile.vy.toFixed(1);
    totalVelocityDisplay.textContent = Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy).toFixed(1);
    xPositionDisplay.textContent = projectile.x.toFixed(1);
    yPositionDisplay.textContent = (canvas.height / SCALE - projectile.y).toFixed(1);
    distanceDisplay.textContent = Math.sqrt(projectile.x * projectile.x + Math.pow(canvas.height / SCALE - projectile.y, 2)).toFixed(1);
}

// Update simulation
function update(deltaTime) {
    if (!isSimulating) return;
    
    const gravity = parseFloat(gravitySlider.value);
    const bounciness = parseFloat(bouncinessSlider.value);
    
    // Update velocity
    projectile.vy += gravity * deltaTime;
    
    // Update position
    projectile.x += projectile.vx * deltaTime;
    projectile.y += projectile.vy * deltaTime;
    
    // Add point to trail
    trail.push({ x: projectile.x, y: projectile.y });
    if (trail.length > TRAIL_LENGTH) {
        trail.shift();
    }
    
    // Check for ground collision with bounce
    if (projectile.y > canvas.height / SCALE) {
        projectile.y = canvas.height / SCALE;
        projectile.vy = -projectile.vy * bounciness;
        projectile.vx *= 0.95; // Add some horizontal friction
        
        // Stop simulation if velocity is very low
        if (Math.abs(projectile.vy) < 0.1 && Math.abs(projectile.vx) < 0.1) {
            isSimulating = false;
        }
    }
    
    // Update displays
    updateDisplays();
    
    time += deltaTime;
}

// Draw simulation
function draw() {
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (every 5 meters)
    for (let x = 0; x < canvas.width / SCALE; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x * SCALE, 0);
        ctx.lineTo(x * SCALE, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal grid lines (every 5 meters)
    for (let y = 0; y < canvas.height / SCALE; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y * SCALE);
        ctx.lineTo(canvas.width, y * SCALE);
        ctx.stroke();
    }
    
    // Draw trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        if (i === 0) {
            ctx.moveTo(point.x * SCALE, point.y * SCALE);
        } else {
            ctx.lineTo(point.x * SCALE, point.y * SCALE);
        }
    }
    ctx.stroke();
    
    // Draw projectile
    ctx.beginPath();
    ctx.arc(projectile.x * SCALE, projectile.y * SCALE, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw velocity vector
    if (isSimulating) {
        const scale = 0.5;
        ctx.beginPath();
        ctx.moveTo(projectile.x * SCALE, projectile.y * SCALE);
        ctx.lineTo(
            projectile.x * SCALE + projectile.vx * SCALE * scale,
            projectile.y * SCALE + projectile.vy * SCALE * scale
        );
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Animation loop
function animate() {
    update(1/60);
    draw();
    requestAnimationFrame(animate);
}

// Event listeners
angleSlider.addEventListener('input', updateDisplayValues);
velocitySlider.addEventListener('input', updateDisplayValues);
gravitySlider.addEventListener('input', updateDisplayValues);
heightSlider.addEventListener('input', updateDisplayValues);
bouncinessSlider.addEventListener('input', updateDisplayValues);
launchButton.addEventListener('click', launch);
resetButton.addEventListener('click', reset);

// Initialize
updateDisplayValues();
animate(); 