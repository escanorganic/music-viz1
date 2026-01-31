/**
 * BaseVisualizer - Abstract base class for all visualizers
 * Provides common functionality and interface
 */
class BaseVisualizer {
    constructor(name, color, accentColor) {
        this.name = name;
        this.color = color;
        this.accentColor = accentColor;
        this.enabled = true;
        this.opacity = 1;

        // Position and size (set by layout)
        this.x = 0;
        this.y = 0;
        this.width = 100;
        this.height = 100;

        // Animation state
        this.energy = 0;
        this.smoothedEnergy = 0;
        this.smoothingFactor = 0.2;

        // Particles for effects (using pool)
        this.activeParticles = [];
        this.maxParticles = 50;

        // Performance optimization
        this.frameSkip = 0;
        this.frameCounter = 0;
    }

    /**
     * Set visualizer bounds
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    setBounds(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Update visualizer state
     * @param {number} energy - Current energy level (0-1)
     * @param {Object} peaks - Peak detection data
     * @param {number} deltaTime - Time since last frame
     */
    update(energy, peaks, deltaTime) {
        if (!this.enabled) return;

        // Frame skipping for performance
        this.frameCounter++;
        if (this.frameSkip > 0 && this.frameCounter % this.frameSkip !== 0) {
            return;
        }

        this.energy = energy;
        this.smoothedEnergy += (energy - this.smoothedEnergy) * this.smoothingFactor;

        // Update particles
        this._updateParticles(deltaTime);

        // Spawn particles on peaks
        if (peaks && peaks.isPeak) {
            this._onPeak(energy);
        }

        // Custom update logic
        this.onUpdate(energy, peaks, deltaTime);
    }

    /**
     * Override in subclasses for custom update logic
     */
    onUpdate(energy, peaks, deltaTime) {
        // Override in subclasses
    }

    /**
     * Called when a peak is detected
     * @param {number} energy - Peak energy
     */
    _onPeak(energy) {
        // Spawn particles based on energy
        const particleCount = Math.floor(energy * 5);
        for (let i = 0; i < particleCount && this.activeParticles.length < this.maxParticles; i++) {
            this._spawnParticle();
        }
    }

    /**
     * Spawn a new particle from the pool
     */
    _spawnParticle() {
        const particle = particlePool.acquire();
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;

        particle.init(
            this.x + this.width / 2,
            this.y + this.height / 2,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1 + Math.random(),
            3 + Math.random() * 5,
            { ...this.accentColor, a: 200 }
        );

        this.activeParticles.push(particle);
    }

    /**
     * Update all active particles
     * @param {number} deltaTime - Time since last frame
     */
    _updateParticles(deltaTime) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];

            if (!particle.update(deltaTime)) {
                // Particle died, return to pool
                particlePool.release(particle);
                this.activeParticles.splice(i, 1);
            }
        }
    }

    /**
     * Draw the visualizer
     * @param {p5} p - p5.js instance
     */
    draw(p) {
        if (!this.enabled) return;

        p.push();

        // Apply opacity
        if (this.opacity < 1) {
            p.drawingContext.globalAlpha = this.opacity;
        }

        // Draw background
        this.drawBackground(p);

        // Draw main visualization
        this.drawVisualization(p);

        // Draw particles
        this.drawParticles(p);

        // Draw label
        this.drawLabel(p);

        p.pop();
    }

    /**
     * Draw visualizer background
     * Override in subclasses for custom backgrounds
     */
    drawBackground(p) {
        p.noStroke();
        p.fill(20, 20, 25, 150);
        p.rect(this.x, this.y, this.width, this.height, 8);
    }

    /**
     * Draw main visualization
     * Override in subclasses
     */
    drawVisualization(p) {
        // Override in subclasses
    }

    /**
     * Draw particles
     */
    drawParticles(p) {
        for (const particle of this.activeParticles) {
            particle.draw(p);
        }
    }

    /**
     * Draw visualizer label
     */
    drawLabel(p) {
        p.fill(255, 255, 255, 150);
        p.noStroke();
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.text(this.name, this.x + 10, this.y + 10);

        // Energy indicator
        p.fill(this.color.r, this.color.g, this.color.b, 200);
        p.text(Math.round(this.smoothedEnergy * 100) + '%', this.x + 10, this.y + 25);
    }

    /**
     * Toggle visualizer on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Clean up resources
     */
    dispose() {
        // Return all particles to pool
        for (const particle of this.activeParticles) {
            particlePool.release(particle);
        }
        this.activeParticles.length = 0;
    }
}
