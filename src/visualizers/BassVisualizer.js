/**
 * BassVisualizer - Visualizes bass/sub-bass frequencies
 * Features deep pulsing shapes and low-frequency rumble effects
 */
class BassVisualizer extends BaseVisualizer {
    constructor() {
        super(
            'Bass',
            VisualizerGroups.BASS.primaryColor,
            VisualizerGroups.BASS.accentColor
        );

        // Bass-specific state
        this.pulseScale = 1;
        this.targetScale = 1;
        this.rumbleOffset = 0;

        // Concentric rings
        this.ringCount = 5;
        this.ringPhases = new Float32Array(this.ringCount);
        for (let i = 0; i < this.ringCount; i++) {
            this.ringPhases[i] = i * 0.5;
        }

        // Vertical bars for spectrum display
        this.barCount = 16;
        this.barHeights = new Float32Array(this.barCount);
        this.targetBarHeights = new Float32Array(this.barCount);
    }

    onUpdate(energy, peaks, deltaTime) {
        // Update pulse scale
        this.targetScale = 1 + energy * 0.5;
        this.pulseScale += (this.targetScale - this.pulseScale) * 0.2;

        // Update rumble effect
        this.rumbleOffset = Math.sin(Date.now() * 0.01) * energy * 3;

        // Update ring phases
        for (let i = 0; i < this.ringCount; i++) {
            this.ringPhases[i] += 0.02 + energy * 0.05;
        }

        // Update bar heights with decay
        for (let i = 0; i < this.barCount; i++) {
            // Simulate frequency distribution (more energy in lower bars)
            const frequencyWeight = 1 - (i / this.barCount) * 0.5;
            this.targetBarHeights[i] = energy * frequencyWeight * (0.7 + Math.random() * 0.3);
            this.barHeights[i] += (this.targetBarHeights[i] - this.barHeights[i]) * 0.3;
        }
    }

    drawVisualization(p) {
        const centerX = this.x + this.width / 2 + this.rumbleOffset;
        const centerY = this.y + this.height / 2;

        // Draw concentric rings
        this._drawRings(p, centerX, centerY);

        // Draw vertical bars
        this._drawBars(p);

        // Draw center mass
        this._drawCenterMass(p, centerX, centerY);
    }

    _drawRings(p, centerX, centerY) {
        const baseRadius = Math.min(this.width, this.height) * 0.3;

        p.noFill();
        p.strokeWeight(2);

        for (let i = 0; i < this.ringCount; i++) {
            const phase = this.ringPhases[i];
            const radiusOffset = Math.sin(phase) * 10;
            const radius = (baseRadius + i * 15 + radiusOffset) * this.pulseScale;
            const alpha = 150 - i * 25;

            // Gradient from primary to accent color
            const t = i / this.ringCount;
            const r = p.lerp(this.color.r, this.accentColor.r, t);
            const g = p.lerp(this.color.g, this.accentColor.g, t);
            const b = p.lerp(this.color.b, this.accentColor.b, t);

            p.stroke(r, g, b, alpha * this.smoothedEnergy);
            p.ellipse(centerX, centerY, radius * 2, radius * 2);
        }
    }

    _drawBars(p) {
        const barWidth = (this.width - 40) / this.barCount;
        const maxHeight = this.height * 0.4;
        const baseY = this.y + this.height - 20;

        p.noStroke();

        for (let i = 0; i < this.barCount; i++) {
            const x = this.x + 20 + i * barWidth;
            const height = this.barHeights[i] * maxHeight;

            // Gradient based on bar position
            const t = i / this.barCount;
            const r = p.lerp(this.color.r, this.accentColor.r, t);
            const g = p.lerp(this.color.g, this.accentColor.g, t);
            const b = p.lerp(this.color.b, this.accentColor.b, t);

            // Bar glow
            p.fill(r, g, b, 50);
            p.rect(x - 2, baseY - height - 5, barWidth - 2, height + 10, 2);

            // Main bar
            p.fill(r, g, b, 200);
            p.rect(x, baseY - height, barWidth - 4, height, 2);

            // Highlight
            p.fill(255, 255, 255, 50);
            p.rect(x, baseY - height, (barWidth - 4) * 0.3, height, 2);
        }
    }

    _drawCenterMass(p, centerX, centerY) {
        const size = 30 + this.smoothedEnergy * 40;

        // Outer glow
        p.noStroke();
        p.fill(this.accentColor.r, this.accentColor.g, this.accentColor.b, 30);
        p.ellipse(centerX, centerY, size * 2, size * 2);

        // Main mass with slight deformation
        p.fill(this.color.r, this.color.g, this.color.b, 180);

        p.beginShape();
        const points = 32;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const deform = 1 + Math.sin(angle * 4 + Date.now() * 0.005) * this.smoothedEnergy * 0.2;
            const r = size * deform;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            p.curveVertex(x, y);
        }
        p.endShape(p.CLOSE);

        // Inner core
        p.fill(255, 255, 255, 80);
        p.ellipse(centerX, centerY, size * 0.3, size * 0.3);
    }
}
