class StandingWave {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.time = 0;
        this.isRunning = false;
        this.animationId = null;
        
        // Wave parameters
        this.length = 1; // meters
        this.tension = 50; // N
        this.massPerLength = 0.01; // kg/m
        this.harmonic = 1;
        this.amplitude = 0.1; // meters
        
        // Initialize points
        this.initializePoints();
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
    }
    
    initializePoints() {
        this.points = [];
        const numPoints = 200;
        for (let i = 0; i <= numPoints; i++) {
            this.points.push({
                x: (i / numPoints) * this.length,
                y: 0
            });
        }
    }
    
    calculateWaveProperties() {
        // Calculate wave speed
        const waveSpeed = Math.sqrt(this.tension / this.massPerLength);
        
        // Calculate wavelength
        const wavelength = 2 * this.length / this.harmonic;
        
        // Calculate frequency
        const frequency = waveSpeed / wavelength;
        
        return {
            waveSpeed,
            wavelength,
            frequency
        };
    }
    
    update() {
        const { frequency } = this.calculateWaveProperties();
        
        // Update points
        this.points.forEach((point, i) => {
            const x = point.x;
            // Standing wave equation: y = A * sin(kx) * cos(ωt)
            const k = (2 * Math.PI * this.harmonic) / this.length;
            const omega = 2 * Math.PI * frequency;
            point.y = this.amplitude * Math.sin(k * x) * Math.cos(omega * this.time);
        });
        
        this.time += 0.016; // Approximately 60fps
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set up coordinate system
        ctx.save();
        ctx.translate(0, height / 2);
        ctx.scale(width / this.length, -height / (2 * this.amplitude));
        
        // Draw string
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        this.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 0.01;
        ctx.stroke();
        
        // Draw nodes
        const nodeCount = this.harmonic + 1;
        const nodeSpacing = this.length / (nodeCount - 1);
        ctx.fillStyle = '#e74c3c';
        for (let i = 0; i < nodeCount; i++) {
            const x = i * nodeSpacing;
            ctx.beginPath();
            ctx.arc(x, 0, 0.01, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.animate);
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    reset() {
        this.stop();
        this.time = 0;
        this.initializePoints();
        this.draw();
    }
    
    updateParameters(params) {
        Object.assign(this, params);
        this.initializePoints();
        this.draw();
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wave-canvas');
    const simulation = new StandingWave(canvas);
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        simulation.draw();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Control elements
    const lengthInput = document.getElementById('string-length');
    const tensionInput = document.getElementById('tension');
    const massInput = document.getElementById('mass-per-length');
    const harmonicInput = document.getElementById('harmonic');
    const amplitudeInput = document.getElementById('amplitude');
    const startButton = document.getElementById('start');
    const resetButton = document.getElementById('reset');
    
    // Display elements
    const lengthValue = document.getElementById('length-value');
    const tensionValue = document.getElementById('tension-value');
    const massValue = document.getElementById('mass-value');
    const harmonicValue = document.getElementById('harmonic-value');
    const amplitudeValue = document.getElementById('amplitude-value');
    const frequencyDisplay = document.getElementById('frequency');
    const wavelengthDisplay = document.getElementById('wavelength');
    const waveSpeedDisplay = document.getElementById('wave-speed');
    const nodeCountDisplay = document.getElementById('node-count');
    const antinodeCountDisplay = document.getElementById('antinode-count');
    
    // Update displays
    function updateDisplays() {
        const { frequency, wavelength, waveSpeed } = simulation.calculateWaveProperties();
        
        frequencyDisplay.textContent = frequency.toFixed(2);
        wavelengthDisplay.textContent = wavelength.toFixed(2);
        waveSpeedDisplay.textContent = waveSpeed.toFixed(2);
        nodeCountDisplay.textContent = simulation.harmonic + 1;
        antinodeCountDisplay.textContent = simulation.harmonic;
    }
    
    // Event listeners
    lengthInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        lengthValue.textContent = `${value} m`;
        simulation.updateParameters({ length: value });
        updateDisplays();
    });
    
    tensionInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        tensionValue.textContent = `${value} N`;
        simulation.updateParameters({ tension: value });
        updateDisplays();
    });
    
    massInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        massValue.textContent = `${value} kg/m`;
        simulation.updateParameters({ massPerLength: value });
        updateDisplays();
    });
    
    harmonicInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        harmonicValue.textContent = value;
        simulation.updateParameters({ harmonic: value });
        updateDisplays();
    });
    
    amplitudeInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        amplitudeValue.textContent = `${value} m`;
        simulation.updateParameters({ amplitude: value });
    });
    
    startButton.addEventListener('click', () => {
        if (simulation.isRunning) {
            simulation.stop();
            startButton.textContent = 'Start';
        } else {
            simulation.start();
            startButton.textContent = 'Stop';
        }
    });
    
    resetButton.addEventListener('click', () => {
        simulation.reset();
        startButton.textContent = 'Start';
    });
    
    // Initial display update
    updateDisplays();
}); 