/**
 * HighsVisualizer - Visualizes high frequency content (cymbals, hi-hats, sparkle)
 * Features shimmering particles and star-like effects
 */
class HighsVisualizer extends BaseVisualizer {
    constructor() {
        super(
            'Highs',
            VisualizerGroups.HIGHS.primaryColor,
            VisualizerGroups.HIGHS.accentColor
        );

        // Increase particle limit for sparkle effect
        this.maxParticles = 100;

        // Stars/sparkle points
        this.starCount = 20;
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: 0,
                y: 0,
                size: 0,
                targetSize: 0,
                alpha: 0,
                targetAlpha: 0,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.05 + Math.random() * 0.1
            });
        }

        // Line connections
        this.connectionDistance = 80;

        // Shimmer wave
        this.shimmerPhase = 0;
    }

    setBounds(x, y, width, height) {
        super.setBounds(x, y, width, height);

        // Redistribute stars when bounds change
        for (let i = 0; i < this.starCount; i++) {
            this.stars[i].x = x + Math.random() * width;
            this.stars[i].y = y + Math.random() * height;
        }
    }

    onUpdate(energy, peaks, deltaTime) {
        // Update shimmer
        this.shimmerPhase += 0.03 + energy * 0.05;

        // Update stars
        for (const star of this.stars) {
            // Twinkle effect
            star.twinklePhase += star.twinkleSpeed;
            const twinkle = (Math.sin(star.twinklePhase) + 1) * 0.5;

            // Size based on energy and twinkle
            star.targetSize = (3 + energy * 15) * twinkle;
            star.size += (star.targetSize - star.size) * 0.2;

            // Alpha based on energy
            star.targetAlpha = 50 + energy * 200 * twinkle;
            star.alpha += (star.targetAlpha - star.alpha) * 0.3;

            // Slight drift
            star.x += (Math.random() - 0.5) * energy * 2;
            star.y += (Math.random() - 0.5) * energy * 2;

            // Wrap around bounds
            if (star.x < this.x) star.x = this.x + this.width;
            if (star.x > this.x + this.width) star.x = this.x;
            if (star.y < this.y) star.y = this.y + this.height;
            if (star.y > this.y + this.height) star.y = this.y;
        }

        // Spawn extra particles on peaks
        if (peaks && peaks.isPeak && energy > 0.4) {
            this._spawnSparkles(energy);
        }
    }

    _spawnSparkles(energy) {
        const count = Math.floor(energy * 8);
        for (let i = 0; i < count && this.activeParticles.length < this.maxParticles; i++) {
            const particle = particlePool.acquire();

            // Random position within bounds
            const x = this.x + Math.random() * this.width;
            const y = this.y + Math.random() * this.height;

            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;

            particle.init(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.5 + Math.random() * 0.5,
                2 + Math.random() * 4,
                { r: 255, g: 255, b: 255, a: 255 }
            );

            this.activeParticles.push(particle);
        }
    }

    drawVisualization(p) {
        // Draw connections between nearby stars
        this._drawConnections(p);

        // Draw stars
        this._drawStars(p);

        // Draw shimmer wave
        this._drawShimmer(p);
    }

    _drawConnections(p) {
        p.strokeWeight(1);

        for (let i = 0; i < this.stars.length; i++) {
            for (let j = i + 1; j < this.stars.length; j++) {
                const star1 = this.stars[i];
                const star2 = this.stars[j];

                const dx = star2.x - star1.x;
                const dy = star2.y - star1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.connectionDistance) {
                    const alpha = (1 - dist / this.connectionDistance) * this.smoothedEnergy * 100;
                    p.stroke(this.accentColor.r, this.accentColor.g, this.accentColor.b, alpha);
                    p.line(star1.x, star1.y, star2.x, star2.y);
                }
            }
        }
    }

    _drawStars(p) {
        p.noStroke();

        for (const star of this.stars) {
            if (star.alpha < 5) continue;

            // Outer glow
            p.fill(this.accentColor.r, this.accentColor.g, this.accentColor.b, star.alpha * 0.3);
            p.ellipse(star.x, star.y, star.size * 3, star.size * 3);

            // Main star
            p.fill(this.color.r, this.color.g, this.color.b, star.alpha);
            this._drawStar(p, star.x, star.y, star.size, star.size * 0.4, 4);

            // Bright center
            p.fill(255, 255, 255, star.alpha);
            p.ellipse(star.x, star.y, star.size * 0.3, star.size * 0.3);
        }
    }

    _drawStar(p, x, y, radius1, radius2, npoints) {
        const angle = Math.PI * 2 / npoints;
        const halfAngle = angle / 2;

        p.beginShape();
        for (let a = -Math.PI / 2; a < Math.PI * 1.5; a += angle) {
            let sx = x + Math.cos(a) * radius1;
            let sy = y + Math.sin(a) * radius1;
            p.vertex(sx, sy);
            sx = x + Math.cos(a + halfAngle) * radius2;
            sy = y + Math.sin(a + halfAngle) * radius2;
            p.vertex(sx, sy);
        }
        p.endShape(p.CLOSE);
    }

    _drawShimmer(p) {
        // Horizontal shimmer wave
        const waveY = this.y + this.height / 2;
        const amplitude = this.smoothedEnergy * 20;

        p.noFill();
        p.strokeWeight(1);

        for (let layer = 0; layer < 3; layer++) {
            const alpha = 100 - layer * 30;
            const yOffset = layer * 10;

            p.stroke(this.accentColor.r, this.accentColor.g, this.accentColor.b, alpha * this.smoothedEnergy);

            p.beginShape();
            for (let x = this.x; x <= this.x + this.width; x += 5) {
                const normalizedX = (x - this.x) / this.width;
                const y = waveY + yOffset + Math.sin(this.shimmerPhase + normalizedX * 10) * amplitude;
                p.curveVertex(x, y);
            }
            p.endShape();
        }
    }
}
