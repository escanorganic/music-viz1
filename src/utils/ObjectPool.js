/**
 * ObjectPool - Memory-efficient object pooling system
 * Reduces GC pressure by reusing objects instead of creating new ones
 */
class ObjectPool {
    constructor(factory, initialSize = 50, maxSize = 500) {
        this.factory = factory;
        this.maxSize = maxSize;
        this.pool = [];
        this.activeCount = 0;

        // Pre-allocate initial objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Acquire an object from the pool
     * @returns {Object} A pooled object ready for use
     */
    acquire() {
        this.activeCount++;

        if (this.pool.length > 0) {
            return this.pool.pop();
        }

        // Pool exhausted, create new object
        return this.factory();
    }

    /**
     * Release an object back to the pool
     * @param {Object} obj - The object to release
     */
    release(obj) {
        this.activeCount = Math.max(0, this.activeCount - 1);

        if (this.pool.length < this.maxSize) {
            // Reset object if it has a reset method
            if (typeof obj.reset === 'function') {
                obj.reset();
            }
            this.pool.push(obj);
        }
        // If pool is full, let GC handle it
    }

    /**
     * Release multiple objects at once
     * @param {Array} objects - Array of objects to release
     */
    releaseAll(objects) {
        for (let i = 0; i < objects.length; i++) {
            this.release(objects[i]);
        }
    }

    /**
     * Get pool statistics
     * @returns {Object} Pool stats
     */
    getStats() {
        return {
            available: this.pool.length,
            active: this.activeCount,
            maxSize: this.maxSize
        };
    }

    /**
     * Clear the pool
     */
    clear() {
        this.pool.length = 0;
        this.activeCount = 0;
    }
}

/**
 * Particle object for visualization
 * Designed for pooling with reset capability
 */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1;
        this.maxLife = 1;
        this.size = 5;
        this.color = { r: 255, g: 255, b: 255, a: 255 };
        this.active = false;
    }

    init(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.active = true;
    }

    update(deltaTime = 1) {
        if (!this.active) return false;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime * 0.016; // Normalize to ~60fps

        if (this.life <= 0) {
            this.active = false;
            return false;
        }

        return true;
    }

    draw(p) {
        if (!this.active) return;

        const alpha = (this.life / this.maxLife) * this.color.a;
        p.noStroke();
        p.fill(this.color.r, this.color.g, this.color.b, alpha);
        p.ellipse(this.x, this.y, this.size * (this.life / this.maxLife));
    }
}

/**
 * VisualizerBar object for frequency visualization
 */
class VisualizerBar {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 0;
        this.targetHeight = 0;
        this.color = { r: 255, g: 255, b: 255 };
        this.smoothing = 0.3;
    }

    init(x, y, width, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.color = color;
        this.height = 0;
        this.targetHeight = 0;
    }

    update(targetHeight) {
        this.targetHeight = targetHeight;
        // Smooth interpolation for fluid animation
        this.height += (this.targetHeight - this.height) * this.smoothing;
    }

    draw(p) {
        p.noStroke();
        p.fill(this.color.r, this.color.g, this.color.b);
        p.rect(this.x, this.y - this.height, this.width, this.height, 2);
    }
}

// Global pool instances
const particlePool = new ObjectPool(() => new Particle(), 100, 1000);
const barPool = new ObjectPool(() => new VisualizerBar(), 64, 256);
