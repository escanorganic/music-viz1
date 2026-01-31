/**
 * VocalVisualizer - Visualizes vocal frequencies
 * Features flowing wave patterns and organic shapes
 */
class VocalVisualizer extends BaseVisualizer {
    constructor() {
        super(
            'Vocals',
            VisualizerGroups.VOCALS.primaryColor,
            VisualizerGroups.VOCALS.accentColor
        );

        // Wave state
        this.wavePhase = 0;
        this.waveAmplitude = 0;
        this.targetAmplitude = 0;

        // Multiple wave layers for depth
        this.waveLayers = 3;

        // Points for the wave (pre-allocated)
        this.wavePoints = 64;
        this.waveData = new Float32Array(this.wavePoints);

        // Smooth transitions
        this.smoothingFactor = 0.15;
    }

    onUpdate(energy, peaks, deltaTime) {
        // Update wave phase
        this.wavePhase += 0.05 + energy * 0.1;

        // Update amplitude
        this.targetAmplitude = energy * (this.height * 0.35);
        this.waveAmplitude += (this.targetAmplitude - this.waveAmplitude) * this.smoothingFactor;

        // Update wave data with smooth noise
        for (let i = 0; i < this.wavePoints; i++) {
            const targetValue = Math.sin(this.wavePhase + i * 0.15) * this.waveAmplitude;
            this.waveData[i] += (targetValue - this.waveData[i]) * 0.2;
        }
    }

    drawVisualization(p) {
        const centerY = this.y + this.height / 2;

        // Draw multiple wave layers
        for (let layer = 0; layer < this.waveLayers; layer++) {
            const layerOffset = (layer - 1) * 15;
            const layerAlpha = 200 - layer * 50;
            const layerPhaseOffset = layer * 0.5;

            this._drawWaveLayer(p, centerY + layerOffset, layerAlpha, layerPhaseOffset, layer);
        }

        // Draw center line indicator
        this._drawCenterIndicator(p, centerY);
    }

    _drawWaveLayer(p, baseY, alpha, phaseOffset, layerIndex) {
        const stepX = this.width / (this.wavePoints - 1);

        // Create gradient effect with multiple lines
        p.noFill();
        p.strokeWeight(3 - layerIndex * 0.5);

        p.beginShape();
        for (let i = 0; i < this.wavePoints; i++) {
            const x = this.x + i * stepX;
            const waveValue = this.waveData[i] * Math.sin(this.wavePhase * 0.5 + phaseOffset + i * 0.1);
            const y = baseY + waveValue;

            // Color gradient along wave
            const colorProgress = i / this.wavePoints;
            const r = p.lerp(this.color.r, this.accentColor.r, colorProgress);
            const g = p.lerp(this.color.g, this.accentColor.g, colorProgress);
            const b = p.lerp(this.color.b, this.accentColor.b, colorProgress);

            p.stroke(r, g, b, alpha);
            p.curveVertex(x, y);
        }
        p.endShape();

        // Draw glow points at peaks
        if (layerIndex === 0) {
            this._drawPeakGlows(p, baseY, phaseOffset);
        }
    }

    _drawPeakGlows(p, baseY, phaseOffset) {
        const stepX = this.width / (this.wavePoints - 1);

        p.noStroke();
        for (let i = 0; i < this.wavePoints; i += 8) {
            const x = this.x + i * stepX;
            const waveValue = this.waveData[i] * Math.sin(this.wavePhase * 0.5 + phaseOffset + i * 0.1);
            const y = baseY + waveValue;

            const glowSize = Math.abs(waveValue) * 0.15 + 5;

            // Outer glow
            p.fill(this.accentColor.r, this.accentColor.g, this.accentColor.b, 30);
            p.ellipse(x, y, glowSize * 2, glowSize * 2);

            // Inner bright point
            p.fill(255, 255, 255, 100 + this.smoothedEnergy * 100);
            p.ellipse(x, y, glowSize * 0.5, glowSize * 0.5);
        }
    }

    _drawCenterIndicator(p, centerY) {
        // Animated center orb
        const orbSize = 10 + this.smoothedEnergy * 20;
        const orbX = this.x + this.width / 2;

        p.noStroke();
        p.fill(this.accentColor.r, this.accentColor.g, this.accentColor.b, 50);
        p.ellipse(orbX, centerY, orbSize * 2, orbSize * 2);

        p.fill(this.color.r, this.color.g, this.color.b, 200);
        p.ellipse(orbX, centerY, orbSize, orbSize);

        p.fill(255, 255, 255, 150);
        p.ellipse(orbX, centerY, orbSize * 0.4, orbSize * 0.4);
    }
}
