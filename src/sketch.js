/**
 * Main p5.js sketch - Music Visualizer
 * Real-time audio analysis with frequency band isolation
 */

// Global state
let audioAnalyzer;
let visualizers = {};
let isStarted = false;
let lastFrameTime = 0;
let deltaTime = 0;

// Debug mode
window.DEBUG_MODE = false;

// p5.js setup
function setup() {
    // Create canvas in the container
    const container = document.getElementById('app-container');
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(container);

    // Set rendering options for performance
    pixelDensity(1); // Reduce pixel density for performance
    frameRate(60);

    // Initialize audio analyzer
    audioAnalyzer = new AudioAnalyzer(1024, 0.8);

    // Initialize visualizers
    visualizers = {
        drums: new DrumVisualizer(),
        vocals: new VocalVisualizer(),
        bass: new BassVisualizer(),
        highs: new HighsVisualizer()
    };

    // Layout visualizers
    layoutVisualizers();

    // Setup UI controls
    setupControls();

    // Start memory monitoring
    memoryManager.startMonitoring(10000);

    // Register cleanup callback
    memoryManager.onCleanup(() => {
        // Clean up dead particles from visualizers
        for (const viz of Object.values(visualizers)) {
            if (viz.activeParticles) {
                viz.activeParticles = viz.activeParticles.filter(p => p.active);
            }
        }
    });

    console.log('Music Visualizer initialized');
}

/**
 * Layout visualizers in a 2x2 grid
 */
function layoutVisualizers() {
    const padding = 20;
    const halfWidth = (width - padding * 3) / 2;
    const halfHeight = (height - padding * 3) / 2;

    // Top left - Drums
    visualizers.drums.setBounds(
        padding,
        padding,
        halfWidth,
        halfHeight
    );

    // Top right - Vocals
    visualizers.vocals.setBounds(
        padding * 2 + halfWidth,
        padding,
        halfWidth,
        halfHeight
    );

    // Bottom left - Bass
    visualizers.bass.setBounds(
        padding,
        padding * 2 + halfHeight,
        halfWidth,
        halfHeight
    );

    // Bottom right - Highs
    visualizers.highs.setBounds(
        padding * 2 + halfWidth,
        padding * 2 + halfHeight,
        halfWidth,
        halfHeight
    );
}

/**
 * Setup UI controls
 */
function setupControls() {
    // Start button
    const startBtn = document.getElementById('start-btn');
    const overlay = document.getElementById('start-overlay');
    const controls = document.getElementById('controls');

    startBtn.addEventListener('click', async () => {
        const success = await audioAnalyzer.startListening();
        if (success) {
            isStarted = true;
            overlay.classList.add('hidden');
            controls.classList.remove('hidden');
        } else {
            alert('Failed to access microphone. Please allow microphone access and try again.');
        }
    });

    // Toggle buttons
    document.getElementById('toggle-drums').addEventListener('click', () => {
        const enabled = visualizers.drums.toggle();
        document.getElementById('toggle-drums').style.opacity = enabled ? 1 : 0.5;
    });

    document.getElementById('toggle-vocals').addEventListener('click', () => {
        const enabled = visualizers.vocals.toggle();
        document.getElementById('toggle-vocals').style.opacity = enabled ? 1 : 0.5;
    });

    document.getElementById('toggle-bass').addEventListener('click', () => {
        const enabled = visualizers.bass.toggle();
        document.getElementById('toggle-bass').style.opacity = enabled ? 1 : 0.5;
    });

    document.getElementById('toggle-highs').addEventListener('click', () => {
        const enabled = visualizers.highs.toggle();
        document.getElementById('toggle-highs').style.opacity = enabled ? 1 : 0.5;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case '1':
                visualizers.drums.toggle();
                break;
            case '2':
                visualizers.vocals.toggle();
                break;
            case '3':
                visualizers.bass.toggle();
                break;
            case '4':
                visualizers.highs.toggle();
                break;
            case 'd':
                window.DEBUG_MODE = !window.DEBUG_MODE;
                break;
        }
    });
}

/**
 * p5.js draw loop
 */
function draw() {
    // Calculate delta time
    const currentTime = millis();
    deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // Clear background
    background(10, 10, 15);

    if (!isStarted) {
        drawStartScreen();
        return;
    }

    // Update audio analysis
    audioAnalyzer.update();

    // Get energy values
    const energies = audioAnalyzer.getEnergies();
    const peaks = audioAnalyzer.getPeaks();

    // Update visualizers
    visualizers.drums.update(energies.drums, peaks.drums, deltaTime);
    visualizers.vocals.update(energies.vocals, peaks.vocals, deltaTime);
    visualizers.bass.update(energies.bass, peaks.bass, deltaTime);
    visualizers.highs.update(energies.highs, peaks.highs, deltaTime);

    // Draw visualizers
    visualizers.drums.draw(window);
    visualizers.vocals.draw(window);
    visualizers.bass.draw(window);
    visualizers.highs.draw(window);

    // Update memory manager
    memoryManager.update(currentTime);

    // Debug info
    if (window.DEBUG_MODE) {
        drawDebugInfo(energies);
    }
}

/**
 * Draw start screen animation
 */
function drawStartScreen() {
    // Animated background
    const t = millis() * 0.001;

    noStroke();
    for (let i = 0; i < 5; i++) {
        const alpha = 20 - i * 3;
        const size = 100 + i * 50 + Math.sin(t + i) * 20;

        fill(100, 100, 255, alpha);
        ellipse(width / 2, height / 2, size, size);
    }
}

/**
 * Draw debug information
 */
function drawDebugInfo(energies) {
    const debugDiv = document.getElementById('debug-info');

    const stats = memoryManager.getStats();
    const fps = Math.round(frameRate());

    let html = `FPS: ${fps}<br>`;
    html += `Drums: ${(energies.drums * 100).toFixed(1)}%<br>`;
    html += `Vocals: ${(energies.vocals * 100).toFixed(1)}%<br>`;
    html += `Bass: ${(energies.bass * 100).toFixed(1)}%<br>`;
    html += `Highs: ${(energies.highs * 100).toFixed(1)}%<br>`;

    if (stats.heapUsagePercent) {
        html += `Heap: ${stats.heapUsagePercent.toFixed(1)}%<br>`;
    }

    html += `Particles: ${stats.pools.particles?.active || 0}<br>`;

    debugDiv.innerHTML = html;
}

/**
 * Handle window resize
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    layoutVisualizers();
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    if (audioAnalyzer) {
        audioAnalyzer.dispose();
    }

    for (const viz of Object.values(visualizers)) {
        viz.dispose();
    }

    memoryManager.dispose();
});
