// Constants
const G = 9.81; // Gravity (m/s²)
const SCALE = 50; // Scale factor for visualization
const BOB_RADIUS = 0.1; // Radius of pendulum bob (m)
const ROD_RADIUS = 0.01; // Radius of the rod (m)
const PENDULUM_LENGTH = 2; // Length of pendulum (m)
const PIVOT_HEIGHT = 3; // Height of pivot point (m)
const SUPPORT_WIDTH = 0.1; // Width of support beams
const SUPPORT_HEIGHT = 0.1; // Height of support beams
const SUPPORT_LENGTH = 1; // Length of support beams
const TRAIL_LENGTH = 100; // Number of points in the trail
const TRAIL_COLOR = 0x3498db; // Color of the trail (matching bob)

// Simulation state
let pendulum = {
    length: PENDULUM_LENGTH,
    mass: 1,
    angleX: 30 * Math.PI / 180,
    angleY: 0,
    velocityX: 0,
    velocityY: 0,
    damping: 0.01,
    time: 0
};

// Three.js setup
let scene, camera, renderer, bob, pendulumRod, supportBeams, controls;
let positionChart, energyChart;
let isRunning = false;
let animationId;
let trailPoints = [];
let trailLine;

// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3 * SCALE, 2 * SCALE, 3 * SCALE);
    camera.lookAt(0, PIVOT_HEIGHT * SCALE, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('pendulum-canvas'),
        antialias: true 
    });
    renderer.setSize(document.querySelector('.visualization').clientWidth, document.querySelector('.visualization').clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    scene.add(mainLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Create support beams
    const supportGeometry = new THREE.BoxGeometry(SUPPORT_WIDTH * SCALE, SUPPORT_HEIGHT * SCALE, SUPPORT_LENGTH * SCALE);
    const supportMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c3e50,
        shininess: 30
    });
    
    // Create two support beams
    supportBeams = new THREE.Group();
    
    // Left support beam
    const leftBeam = new THREE.Mesh(supportGeometry, supportMaterial);
    leftBeam.position.set(-SUPPORT_LENGTH/2 * SCALE, PIVOT_HEIGHT * SCALE, 0);
    leftBeam.castShadow = true;
    supportBeams.add(leftBeam);
    
    // Right support beam
    const rightBeam = new THREE.Mesh(supportGeometry, supportMaterial);
    rightBeam.position.set(SUPPORT_LENGTH/2 * SCALE, PIVOT_HEIGHT * SCALE, 0);
    rightBeam.castShadow = true;
    supportBeams.add(rightBeam);
    
    scene.add(supportBeams);

    // Create pendulum rod
    const rodGeometry = new THREE.CylinderGeometry(ROD_RADIUS * SCALE, ROD_RADIUS * SCALE, PENDULUM_LENGTH * SCALE, 16);
    const rodMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        shininess: 100,
        emissive: 0x330000
    });
    pendulumRod = new THREE.Mesh(rodGeometry, rodMaterial);
    pendulumRod.castShadow = true;
    scene.add(pendulumRod);

    // Create pendulum bob
    const bobGeometry = new THREE.SphereGeometry(BOB_RADIUS * SCALE, 32, 32);
    const bobMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        shininess: 100
    });
    bob = new THREE.Mesh(bobGeometry, bobMaterial);
    bob.castShadow = true;
    scene.add(bob);

    // Create trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({ 
        color: TRAIL_COLOR,
        transparent: true,
        opacity: 0.6
    });
    trailLine = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trailLine);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(5 * SCALE, 10);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2 * SCALE;
    controls.maxDistance = 10 * SCALE;
    controls.maxPolarAngle = Math.PI / 2;
}

// Initialize charts
function initCharts() {
    // Position chart
    const positionCtx = document.getElementById('position-graph').getContext('2d');
    positionChart = new Chart(positionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'X Position',
                data: [],
                borderColor: '#e74c3c',
                fill: false
            }, {
                label: 'Y Position',
                data: [],
                borderColor: '#2ecc71',
                fill: false
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (s)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Position (m)'
                    }
                }
            }
        }
    });
    
    // Energy chart
    const energyCtx = document.getElementById('energy-graph').getContext('2d');
    energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Kinetic Energy',
                data: [],
                borderColor: '#e74c3c',
                fill: false
            }, {
                label: 'Potential Energy',
                data: [],
                borderColor: '#2ecc71',
                fill: false
            }, {
                label: 'Total Energy',
                data: [],
                borderColor: '#3498db',
                fill: false
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (s)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Energy (J)'
                    }
                }
            }
        }
    });
}

// Update pendulum physics
function updatePendulum(deltaTime) {
    // Calculate accelerations
    const accelX = -(G / pendulum.length) * Math.sin(pendulum.angleX) - pendulum.damping * pendulum.velocityX;
    const accelY = -(G / pendulum.length) * Math.sin(pendulum.angleY) - pendulum.damping * pendulum.velocityY;
    
    // Update velocities
    pendulum.velocityX += accelX * deltaTime;
    pendulum.velocityY += accelY * deltaTime;
    
    // Update angles
    pendulum.angleX += pendulum.velocityX * deltaTime;
    pendulum.angleY += pendulum.velocityY * deltaTime;
    
    // Update time
    pendulum.time += deltaTime;
}

// Update visualization
function updateVisualization() {
    // Calculate bob position
    const x = pendulum.length * Math.sin(pendulum.angleX) * Math.cos(pendulum.angleY);
    const y = -pendulum.length * Math.cos(pendulum.angleX);
    const z = pendulum.length * Math.sin(pendulum.angleX) * Math.sin(pendulum.angleY);
    
    // Calculate pivot point
    const pivotY = PIVOT_HEIGHT * SCALE;
    
    // Update bob position
    const bobPosition = new THREE.Vector3(
        x * SCALE,
        pivotY + y * SCALE,
        z * SCALE
    );
    bob.position.copy(bobPosition);
    
    // Update pendulum rod
    const rodStart = new THREE.Vector3(0, pivotY, 0);
    const rodEnd = bobPosition.clone();
    const rodCenter = new THREE.Vector3().addVectors(rodStart, rodEnd).multiplyScalar(0.5);
    
    pendulumRod.position.copy(rodCenter);
    
    // Calculate direction from pivot to bob
    const direction = new THREE.Vector3().subVectors(rodEnd, rodStart).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    pendulumRod.quaternion.copy(quaternion);
    
    // Update trail
    trailPoints.push(bobPosition.clone());
    if (trailPoints.length > TRAIL_LENGTH) {
        trailPoints.shift();
    }
    
    const positions = new Float32Array(trailPoints.length * 3);
    for (let i = 0; i < trailPoints.length; i++) {
        positions[i * 3] = trailPoints[i].x;
        positions[i * 3 + 1] = trailPoints[i].y;
        positions[i * 3 + 2] = trailPoints[i].z;
    }
    
    trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailLine.geometry.attributes.position.needsUpdate = true;
    
    // Update data display
    document.getElementById('time').textContent = pendulum.time.toFixed(2);
    document.getElementById('x-position').textContent = x.toFixed(2);
    document.getElementById('y-position').textContent = y.toFixed(2);
    document.getElementById('z-position').textContent = z.toFixed(2);
    
    // Calculate and update energy
    const kineticEnergy = 0.5 * pendulum.mass * (Math.pow(pendulum.velocityX * pendulum.length, 2) + 
                                                Math.pow(pendulum.velocityY * pendulum.length, 2));
    const potentialEnergy = pendulum.mass * G * (pendulum.length - y);
    const totalEnergy = kineticEnergy + potentialEnergy;
    
    document.getElementById('kinetic-energy').textContent = kineticEnergy.toFixed(2);
    document.getElementById('potential-energy').textContent = potentialEnergy.toFixed(2);
    document.getElementById('total-energy').textContent = totalEnergy.toFixed(2);
    
    // Update charts
    updateCharts(x, y, kineticEnergy, potentialEnergy, totalEnergy);
}

// Update charts with new data
function updateCharts(x, y, kinetic, potential, total) {
    const time = pendulum.time;
    
    // Update position chart
    positionChart.data.labels.push(time);
    positionChart.data.datasets[0].data.push(x);
    positionChart.data.datasets[1].data.push(y);
    
    // Update energy chart
    energyChart.data.labels.push(time);
    energyChart.data.datasets[0].data.push(kinetic);
    energyChart.data.datasets[1].data.push(potential);
    energyChart.data.datasets[2].data.push(total);
    
    // Remove old data points if more than 200
    if (positionChart.data.labels.length > 200) {
        positionChart.data.labels.shift();
        energyChart.data.labels.shift();
        positionChart.data.datasets.forEach(dataset => dataset.data.shift());
        energyChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    positionChart.update('none'); // Disable animation for better performance
    energyChart.update('none');
}

// Animation loop
function animate() {
    if (!isRunning) return;
    
    const deltaTime = 1/60; // Fixed time step
    updatePendulum(deltaTime);
    updateVisualization();
    
    // Update controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
    
    animationId = requestAnimationFrame(animate);
}

// Event listeners
document.getElementById('start').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        animate();
    }
});

document.getElementById('reset').addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationId);
    
    // Reset pendulum state
    pendulum = {
        length: PENDULUM_LENGTH,
        mass: parseFloat(document.getElementById('mass').value),
        angleX: parseFloat(document.getElementById('initial-angle-x').value) * Math.PI / 180,
        angleY: parseFloat(document.getElementById('initial-angle-y').value) * Math.PI / 180,
        velocityX: 0,
        velocityY: 0,
        damping: parseFloat(document.getElementById('damping').value),
        time: 0
    };
    
    // Clear trail
    trailPoints = [];
    trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    
    // Reset charts
    positionChart.data.labels = [];
    energyChart.data.labels = [];
    positionChart.data.datasets.forEach(dataset => dataset.data = []);
    energyChart.data.datasets.forEach(dataset => dataset.data = []);
    positionChart.update();
    energyChart.update();
    
    // Reset visualization
    updateVisualization();
    renderer.render(scene, camera);
});

// Control input handlers
document.getElementById('pendulum-length').addEventListener('input', (e) => {
    const newLength = parseFloat(e.target.value);
    pendulum.length = Math.max(newLength, PENDULUM_LENGTH);
    document.getElementById('length-value').textContent = `${pendulum.length.toFixed(2)} m`;
});

document.getElementById('initial-angle-x').addEventListener('input', (e) => {
    pendulum.angleX = parseFloat(e.target.value) * Math.PI / 180;
    document.getElementById('angle-x-value').textContent = `${e.target.value}°`;
});

document.getElementById('initial-angle-y').addEventListener('input', (e) => {
    pendulum.angleY = parseFloat(e.target.value) * Math.PI / 180;
    document.getElementById('angle-y-value').textContent = `${e.target.value}°`;
});

document.getElementById('mass').addEventListener('input', (e) => {
    pendulum.mass = parseFloat(e.target.value);
    document.getElementById('mass-value').textContent = `${e.target.value} kg`;
});

document.getElementById('damping').addEventListener('input', (e) => {
    pendulum.damping = parseFloat(e.target.value);
    document.getElementById('damping-value').textContent = e.target.value;
});

// Handle window resize
window.addEventListener('resize', () => {
    const width = document.querySelector('.visualization').clientWidth;
    const height = document.querySelector('.visualization').clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Initialize simulation
window.addEventListener('load', () => {
    initThreeJS();
    initCharts();
    updateVisualization();
    renderer.render(scene, camera);
}); 