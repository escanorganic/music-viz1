/**
 * DrumVisualizer - Visualizes drum/percussion frequencies
 * Features pulsing circles and impact ripples
 */
class DrumVisualizer extends BaseVisualizer {
    constructor() {
        super(
            'Drums',
            VisualizerGroups.DRUMS.primaryColor,
            VisualizerGroups.DRUMS.accentColor
        );

        // Drum-specific state
        this.pulseSize = 0;
        this.targetPulseSize = 0;
        this.ripples = [];
        this.maxRipples = 5;

        // Reusable ripple objects
        for (let i = 0; i < this.maxRipples; i++) {
            this.ripples.push({
                active: false,
                x: 0,
                y: 0,
                size: 0,
                maxSize: 0,
                alpha: 0
            });
        }

        // Bar visualization
        this.bars = [];
        this.barCount = 8;
    }

    onUpdate(energy, peaks, deltaTime) {
        // Update pulse
        this.targetPulseSize = energy * (this.height * 0.4);
        this.pulseSize += (this.targetPulseSize - this.pulseSize) * 0.3;

        // Trigger ripple on peak
        if (peaks && peaks.isPeak && energy > 0.5) {
            this._triggerRipple(energy);
        }

        // Update ripples
        for (const ripple of this.ripples) {
            if (ripple.active) {
                ripple.size += (ripple.maxSize - ripple.size) * 0.1;
                ripple.alpha *= 0.92;

                if (ripple.alpha < 5) {
                    ripple.active = false;
                }
            }
        }
    }

    _triggerRipple(energy) {
        // Find inactive ripple
        for (const ripple of this.ripples) {
            if (!ripple.active) {
                ripple.active = true;
                ripple.x = this.x + this.width / 2;
                ripple.y = this.y + this.height / 2;
                ripple.size = this.pulseSize;
                ripple.maxSize = this.pulseSize + energy * 100;
                ripple.alpha = 200;
                break;
            }
        }
    }

    drawVisualization(p) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Draw ripples
        for (const ripple of this.ripples) {
            if (ripple.active) {
                p.noFill();
                p.stroke(this.accentColor.r, this.accentColor.g, this.accentColor.b, ripple.alpha);
                p.strokeWeight(2);
                p.ellipse(ripple.x, ripple.y, ripple.size, ripple.size);
            }
        }

        // Draw main pulse circle
        p.noStroke();

        // Outer glow
        const glowSize = this.pulseSize * 1.3;
        p.fill(this.color.r, this.color.g, this.color.b, 30);
        p.ellipse(centerX, centerY, glowSize, glowSize);

        // Main circle
        p.fill(this.color.r, this.color.g, this.color.b, 150 + this.smoothedEnergy * 100);
        p.ellipse(centerX, centerY, this.pulseSize, this.pulseSize);

        // Inner bright core
        const coreSize = this.pulseSize * 0.3;
        p.fill(255, 255, 255, 100 + this.smoothedEnergy * 150);
        p.ellipse(centerX, centerY, coreSize, coreSize);

        // Draw frequency bars around circle
        this._drawFrequencyBars(p, centerX, centerY);
    }

    _drawFrequencyBars(p, centerX, centerY) {
        const radius = this.pulseSize * 0.6 + 20;
        const barWidth = 8;
        const maxBarHeight = 40;

        for (let i = 0; i < this.barCount; i++) {
            const angle = (i / this.barCount) * Math.PI * 2 - Math.PI / 2;
            const barHeight = this.smoothedEnergy * maxBarHeight * (0.5 + Math.random() * 0.5);

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            p.stroke(this.accentColor.r, this.accentColor.g, this.accentColor.b, 200);
            p.strokeWeight(barWidth);
            p.line(x1, y1, x2, y2);
        }
    }
}
