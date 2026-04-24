// Get canvas and context
const springCanvas = document.getElementById('spring-canvas');
const springCtx = springCanvas.getContext('2d');

// Set canvas size
springCanvas.width = 600;
springCanvas.height = 400;

// Physics constants
const SCALE = 100; // pixels per meter
const SPRING_WIDTH = 20;
const MASS_SIZE = 30;
const SPRING_COILS = 10;
const EQUILIBRIUM_Y = springCanvas.height / 2;

// Simulation state
let isSimulating = false;
let time = 0;
let lastTime = 0;

// Spring-mass system properties
const system = {
    mass: 1,
    springConstant: 100,
    damping: 1,
    gravity: 9.81,
    position: 0,
    velocity: 0,
    acceleration: 0,
    naturalLength: 0.5, // meters
    extension: 0,
    plasticDeformation: 0,
    maxExtension: 0.8, // maximum extension before plastic deformation
    yieldPoint: 0.6, // extension at which plastic deformation begins
    plasticDeformationRate: 0.1, // rate of plastic deformation
    history: [], // store force-extension data points
    energyHistory: [], // store energy data points
    isMoving: true, // track if spring is still moving
    movementThreshold: 0.001, // threshold for considering movement negligible
    forceThreshold: 0.01, // threshold for considering force negligible
    velocityThreshold: 0.001 // threshold for considering velocity negligible
};

// Get control elements
const massSlider = document.getElementById('mass');
const springConstantSlider = document.getElementById('spring-constant');
const dampingSlider = document.getElementById('damping');
const gravitySlider = document.getElementById('gravity');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');

// Get display elements
const massValue = document.getElementById('mass-value');
const springConstantValue = document.getElementById('spring-constant-value');
const dampingValue = document.getElementById('damping-value');
const gravityValue = document.getElementById('gravity-value');
const extensionDisplay = document.getElementById('extension');
const forceDisplay = document.getElementById('force');
const periodDisplay = document.getElementById('period');
const kineticEnergyDisplay = document.getElementById('kinetic-energy');
const potentialEnergyDisplay = document.getElementById('potential-energy');
const totalEnergyDisplay = document.getElementById('total-energy');
const velocityDisplay = document.getElementById('velocity');
const accelerationDisplay = document.getElementById('acceleration');
const timeDisplay = document.getElementById('time');

// Initialize elastic limit graph
const elasticLimitChart = new Chart(
    document.getElementById('elastic-limit-graph'),
    {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Hooke\'s Law Region',
                    data: [
                        {x: 0, y: 0},
                        {x: 0.02, y: 4},
                        {x: 0.04, y: 8},
                        {x: 0.06, y: 12}
                    ],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3
                },
                {
                    label: 'Elastic Limit',
                    data: [
                        {x: 0.06, y: 12},
                        {x: 0.08, y: 14},
                        {x: 0.10, y: 15}
                    ],
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 3
                },
                {
                    label: 'Plastic Deformation',
                    data: [
                        {x: 0.10, y: 15},
                        {x: 0.12, y: 15.5},
                        {x: 0.14, y: 15.8}
                    ],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Extension (m)'
                    },
                    min: 0,
                    max: 0.15
                },
                y: {
                    title: {
                        display: true,
                        text: 'Force (N)'
                    },
                    min: 0,
                    max: 20
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    }
);

// Update display values
function updateDisplayValues() {
    massValue.textContent = `${massSlider.value} kg`;
    springConstantValue.textContent = `${springConstantSlider.value} N/m`;
    dampingValue.textContent = dampingSlider.value;
    gravityValue.textContent = `${gravitySlider.value} m/s²`;
}

// Calculate forces
function calculateForces() {
    let springForce;
    
    // Check for plastic deformation
    if (Math.abs(system.extension) > system.yieldPoint) {
        // Calculate plastic deformation
        const deformation = Math.abs(system.extension) - system.yieldPoint;
        system.plasticDeformation += deformation * system.plasticDeformationRate;
        
        // Reduce spring constant due to plastic deformation
        const effectiveSpringConstant = system.springConstant * (1 - system.plasticDeformation);
        springForce = -effectiveSpringConstant * system.extension;
    } else {
        springForce = -system.springConstant * system.extension;
    }
    
    // Calculate mass-dependent damping
    const massDampingFactor = Math.sqrt(system.mass);
    const dampingForce = -system.damping * massDampingFactor * system.velocity;
    const gravityForce = system.mass * system.gravity;
    
    let totalForce = springForce + dampingForce + gravityForce;
    
    // Round very small forces to zero to prevent oscillation
    if (Math.abs(totalForce) < system.forceThreshold) {
        totalForce = 0;
    }
    
    // Only store data point if force is significant or it's a new state
    if (Math.abs(totalForce) >= system.forceThreshold || 
        system.history.length === 0 || 
        Math.abs(system.extension - system.history[system.history.length - 1].extension) > system.movementThreshold) {
        system.history.push({
            extension: system.extension,
            force: totalForce,
            mass: system.mass
        });
    }
    
    return totalForce;
}

// Update simulation
function update(deltaTime) {
    if (!isSimulating) return;
    
    // Update system properties
    system.mass = parseFloat(massSlider.value);
    system.springConstant = parseFloat(springConstantSlider.value);
    system.damping = parseFloat(dampingSlider.value);
    system.gravity = parseFloat(gravitySlider.value);
    
    // Calculate forces and update motion
    const force = calculateForces();
    system.acceleration = force / system.mass;
    system.velocity += system.acceleration * deltaTime;
    
    // Apply stronger damping to reduce bounce
    system.velocity *= 0.95;
    
    // Round very small velocities to zero
    if (Math.abs(system.velocity) < system.velocityThreshold) {
        system.velocity = 0;
    }
    
    // Update position with bounds checking
    const newPosition = system.position + system.velocity * deltaTime;
    if (Math.abs(newPosition) < system.maxExtension) {
        system.position = newPosition;
    } else {
        system.position = Math.sign(newPosition) * system.maxExtension;
        system.velocity = 0;
    }
    
    system.extension = system.position;
    
    // Check if movement is negligible
    if (Math.abs(system.velocity) < system.movementThreshold && 
        Math.abs(system.acceleration) < system.movementThreshold) {
        system.isMoving = false;
    } else {
        system.isMoving = true;
    }
    
    // Calculate energies
    const kineticEnergy = 0.5 * system.mass * system.velocity * system.velocity;
    const potentialEnergy = 0.5 * system.springConstant * system.extension * system.extension;
    const totalEnergy = kineticEnergy + potentialEnergy;
    
    // Store energy data point
    system.energyHistory.push({
        time: time,
        kinetic: kineticEnergy,
        potential: potentialEnergy,
        total: totalEnergy
    });
    
    // Update displays
    extensionDisplay.textContent = system.extension.toFixed(3);
    forceDisplay.textContent = force.toFixed(2);
    periodDisplay.textContent = (2 * Math.PI * Math.sqrt(system.mass / system.springConstant)).toFixed(2);
    kineticEnergyDisplay.textContent = kineticEnergy.toFixed(2);
    potentialEnergyDisplay.textContent = potentialEnergy.toFixed(2);
    totalEnergyDisplay.textContent = totalEnergy.toFixed(2);
    velocityDisplay.textContent = system.velocity.toFixed(3);
    accelerationDisplay.textContent = system.acceleration.toFixed(3);
    timeDisplay.textContent = time.toFixed(2);
    
    // No dynamic graph updates - using static educational graph
    
    // Only increment time if the spring is still moving
    if (system.isMoving) {
        time += deltaTime;
    }
}

// Draw spring-mass system
function draw() {
    // Clear canvas
    springCtx.fillStyle = '#ffffff';
    springCtx.fillRect(0, 0, springCanvas.width, springCanvas.height);
    
    // Draw ceiling
    springCtx.fillStyle = '#2c3e50';
    springCtx.fillRect(0, 0, springCanvas.width, 20);
    
    // Calculate spring position
    const springLength = system.naturalLength + system.extension;
    const springTop = 20;
    const springBottom = EQUILIBRIUM_Y + system.position * SCALE;
    
    // Draw spring
    springCtx.beginPath();
    springCtx.strokeStyle = '#3498db';
    springCtx.lineWidth = 2;
    
    const coilHeight = (springBottom - springTop) / SPRING_COILS;
    const coilWidth = SPRING_WIDTH;
    
    springCtx.moveTo(springCanvas.width / 2, springTop);
    
    for (let i = 0; i < SPRING_COILS; i++) {
        const y = springTop + i * coilHeight;
        springCtx.bezierCurveTo(
            springCanvas.width / 2 + coilWidth, y + coilHeight / 4,
            springCanvas.width / 2 + coilWidth, y + coilHeight * 3/4,
            springCanvas.width / 2, y + coilHeight
        );
    }
    
    springCtx.stroke();
    
    // Draw mass
    springCtx.fillStyle = '#e74c3c';
    springCtx.beginPath();
    springCtx.arc(springCanvas.width / 2, springBottom + MASS_SIZE / 2, MASS_SIZE / 2, 0, Math.PI * 2);
    springCtx.fill();
    springCtx.strokeStyle = '#c0392b';
    springCtx.lineWidth = 2;
    springCtx.stroke();
    
    // Draw equilibrium line
    springCtx.strokeStyle = '#95a5a6';
    springCtx.setLineDash([5, 5]);
    springCtx.beginPath();
    springCtx.moveTo(0, EQUILIBRIUM_Y);
    springCtx.lineTo(springCanvas.width, EQUILIBRIUM_Y);
    springCtx.stroke();
    springCtx.setLineDash([]);
}

// Start simulation
function start() {
    if (isSimulating) return;
    isSimulating = true;
    lastTime = performance.now();
    animate();
}

// Reset simulation
function reset() {
    isSimulating = false;
    time = 0;
    system.position = 0;
    system.velocity = 0;
    system.acceleration = 0;
    system.extension = 0;
    system.plasticDeformation = 0;
    system.history = []; // Clear history
    system.energyHistory = []; // Clear energy history
    system.isMoving = true; // Reset movement state
    
    // No graph reset needed - using static educational graph
    
    // Reset displays
    extensionDisplay.textContent = "0.00";
    forceDisplay.textContent = "0.00";
    periodDisplay.textContent = "0.00";
    kineticEnergyDisplay.textContent = "0.00";
    potentialEnergyDisplay.textContent = "0.00";
    totalEnergyDisplay.textContent = "0.00";
    velocityDisplay.textContent = "0.00";
    accelerationDisplay.textContent = "0.00";
    timeDisplay.textContent = "0.00";
}

// Animation loop
function animate() {
    if (!isSimulating) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    update(deltaTime);
    draw();
    requestAnimationFrame(animate);
}

// Event listeners
massSlider.addEventListener('input', updateDisplayValues);
springConstantSlider.addEventListener('input', updateDisplayValues);
dampingSlider.addEventListener('input', updateDisplayValues);
gravitySlider.addEventListener('input', updateDisplayValues);
startButton.addEventListener('click', start);
resetButton.addEventListener('click', reset);

// Initialize
updateDisplayValues();
draw(); 