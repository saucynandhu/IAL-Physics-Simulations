// Get canvas and context
const canvas = document.getElementById('stokes-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Physics constants
const SCALE = 100; // pixels per meter
const GRAVITY = 9.81; // m/s²
const PI = Math.PI;

// Simulation state
let isSimulating = false;
let time = 0;
let trail = [];

// Sphere properties
const sphere = {
    x: canvas.width / 2,
    y: 50,
    radius: 5, // mm
    density: 7800, // kg/m³ (steel)
    velocity: 0,
    acceleration: 0
};

// Fluid properties
const fluid = {
    viscosity: 1, // Pa·s
    density: 1000 // kg/m³ (water)
};

// Get control elements
const radiusSlider = document.getElementById('sphere-radius');
const viscositySlider = document.getElementById('viscosity');
const fluidDensitySlider = document.getElementById('fluid-density');
const sphereDensitySlider = document.getElementById('sphere-density');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');

// Get display elements
const radiusValue = document.getElementById('radius-value');
const viscosityValue = document.getElementById('viscosity-value');
const fluidDensityValue = document.getElementById('fluid-density-value');
const sphereDensityValue = document.getElementById('sphere-density-value');
const timeDisplay = document.getElementById('time');
const positionDisplay = document.getElementById('position');
const velocityDisplay = document.getElementById('velocity');
const gravityForceDisplay = document.getElementById('gravity-force');
const buoyancyForceDisplay = document.getElementById('buoyancy-force');
const dragForceDisplay = document.getElementById('drag-force');
const terminalVelocityDisplay = document.getElementById('terminal-velocity');
const reynoldsNumberDisplay = document.getElementById('reynolds-number');
const dragCoefficientDisplay = document.getElementById('drag-coefficient');

// Update display values
function updateDisplayValues() {
    radiusValue.textContent = `${parseFloat(radiusSlider.value).toFixed(1)} mm`;
    viscosityValue.textContent = `${parseFloat(viscositySlider.value).toFixed(1)} Pa·s`;
    fluidDensityValue.textContent = `${parseFloat(fluidDensitySlider.value).toFixed(0)} kg/m³`;
    sphereDensityValue.textContent = `${parseFloat(sphereDensitySlider.value).toFixed(0)} kg/m³`;
}

// Calculate forces
function calculateForces() {
    const r = sphere.radius / 1000; // convert mm to m
    const volume = (4/3) * PI * Math.pow(r, 3);
    const mass = volume * sphere.density;
    
    // Gravity force
    const gravityForce = mass * GRAVITY;
    
    // Buoyancy force
    const buoyancyForce = volume * fluid.density * GRAVITY;
    
    // Drag force (Stokes Law)
    const dragForce = 6 * PI * fluid.viscosity * r * Math.abs(sphere.velocity);
    
    return {
        gravity: gravityForce,
        buoyancy: buoyancyForce,
        drag: dragForce
    };
}

// Calculate terminal velocity
function calculateTerminalVelocity() {
    const r = sphere.radius / 1000; // convert mm to m
    const g = GRAVITY;
    const ρs = sphere.density;
    const ρf = fluid.density;
    const η = fluid.viscosity;
    
    return (2 * Math.pow(r, 2) * g * (ρs - ρf)) / (9 * η);
}

// Calculate Reynolds number
function calculateReynoldsNumber() {
    const r = sphere.radius / 1000; // convert mm to m
    const v = Math.abs(sphere.velocity);
    const ρ = fluid.density;
    const η = fluid.viscosity;
    
    return (2 * r * v * ρ) / η;
}

// Start simulation
function start() {
    if (isSimulating) return;
    
    sphere.radius = parseFloat(radiusSlider.value);
    sphere.density = parseFloat(sphereDensitySlider.value);
    fluid.viscosity = parseFloat(viscositySlider.value);
    fluid.density = parseFloat(fluidDensitySlider.value);
    
    sphere.y = 50;
    sphere.velocity = 0;
    time = 0;
    trail = [];
    
    isSimulating = true;
}

// Reset simulation
function reset() {
    isSimulating = false;
    time = 0;
    sphere.y = 50;
    sphere.velocity = 0;
    trail = [];
    updateDisplays();
}

// Update displays
function updateDisplays() {
    const forces = calculateForces();
    const terminalVelocity = calculateTerminalVelocity();
    const reynoldsNumber = calculateReynoldsNumber();
    
    timeDisplay.textContent = time.toFixed(1);
    positionDisplay.textContent = ((canvas.height - sphere.y) / SCALE).toFixed(1);
    velocityDisplay.textContent = sphere.velocity.toFixed(1);
    gravityForceDisplay.textContent = forces.gravity.toFixed(3);
    buoyancyForceDisplay.textContent = forces.buoyancy.toFixed(3);
    dragForceDisplay.textContent = forces.drag.toFixed(3);
    terminalVelocityDisplay.textContent = terminalVelocity.toFixed(3);
    reynoldsNumberDisplay.textContent = reynoldsNumber.toFixed(3);
    
    // Calculate drag coefficient (Cd = 24/Re for Stokes flow)
    const dragCoefficient = reynoldsNumber > 0 ? 24 / reynoldsNumber : 0;
    dragCoefficientDisplay.textContent = dragCoefficient.toFixed(3);
}

// Update simulation
function update(deltaTime) {
    if (!isSimulating) return;
    
    const forces = calculateForces();
    const netForce = forces.gravity - forces.buoyancy - forces.drag;
    const mass = (4/3) * PI * Math.pow(sphere.radius/1000, 3) * sphere.density;
    
    sphere.acceleration = netForce / mass;
    sphere.velocity += sphere.acceleration * deltaTime;
    sphere.y += sphere.velocity * SCALE * deltaTime;
    
    // Add point to trail
    trail.push({ y: sphere.y });
    if (trail.length > 100) {
        trail.shift();
    }
    
    // Check for bottom collision
    if (sphere.y > canvas.height - sphere.radius) {
        sphere.y = canvas.height - sphere.radius;
        sphere.velocity = 0;
        isSimulating = false;
    }
    
    updateDisplays();
    time += deltaTime;
}

// Draw simulation
function draw() {
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw fluid
    ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (every 0.5 meters)
    for (let x = 0; x < canvas.width; x += 0.5 * SCALE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal grid lines (every 0.5 meters)
    for (let y = 0; y < canvas.height; y += 0.5 * SCALE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        if (i === 0) {
            ctx.moveTo(canvas.width / 2, point.y);
        } else {
            ctx.lineTo(canvas.width / 2, point.y);
        }
    }
    ctx.stroke();
    
    // Draw sphere
    ctx.beginPath();
    ctx.arc(canvas.width / 2, sphere.y, sphere.radius, 0, PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw velocity vector
    if (isSimulating) {
        const scale = 0.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, sphere.y);
        ctx.lineTo(
            canvas.width / 2,
            sphere.y + sphere.velocity * SCALE * scale
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
radiusSlider.addEventListener('input', updateDisplayValues);
viscositySlider.addEventListener('input', updateDisplayValues);
fluidDensitySlider.addEventListener('input', updateDisplayValues);
sphereDensitySlider.addEventListener('input', updateDisplayValues);
startButton.addEventListener('click', start);
resetButton.addEventListener('click', reset);

// Initialize
updateDisplayValues();
animate(); 