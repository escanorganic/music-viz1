/**
 * MemoryManager - Centralized memory management and optimization
 * Handles cleanup, monitoring, and optimization of memory usage
 */
class MemoryManager {
    constructor() {
        this.pools = new Map();
        this.cleanupCallbacks = [];
        this.lastCleanup = 0;
        this.cleanupInterval = 30000; // 30 seconds
        this.memoryWarningThreshold = 0.8; // 80% of heap limit
        this.isMonitoring = false;

        // Pre-allocated arrays for reuse
        this.tempArrays = {
            float32_256: new Float32Array(256),
            float32_512: new Float32Array(512),
            float32_1024: new Float32Array(1024)
        };

        // Cached color objects to avoid allocation
        this.colorCache = new Map();
    }

    /**
     * Register a pool for management
     * @param {string} name - Pool identifier
     * @param {ObjectPool} pool - Pool instance
     */
    registerPool(name, pool) {
        this.pools.set(name, pool);
    }

    /**
     * Get a pre-allocated Float32Array
     * @param {number} size - Required size (256, 512, or 1024)
     * @returns {Float32Array} Pre-allocated array
     */
    getTempFloat32Array(size) {
        const key = `float32_${size}`;
        if (this.tempArrays[key]) {
            return this.tempArrays[key];
        }
        // Create new if size not pre-allocated
        this.tempArrays[key] = new Float32Array(size);
        return this.tempArrays[key];
    }

    /**
     * Get a cached color object
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @param {number} a - Alpha (0-255)
     * @returns {Object} Color object
     */
    getColor(r, g, b, a = 255) {
        const key = `${r},${g},${b},${a}`;
        if (!this.colorCache.has(key)) {
            // Limit cache size
            if (this.colorCache.size > 1000) {
                const firstKey = this.colorCache.keys().next().value;
                this.colorCache.delete(firstKey);
            }
            this.colorCache.set(key, { r, g, b, a });
        }
        return this.colorCache.get(key);
    }

    /**
     * Register a cleanup callback
     * @param {Function} callback - Cleanup function
     */
    onCleanup(callback) {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Force immediate garbage collection hint
     * Note: This is just a hint, actual GC is controlled by the engine
     */
    suggestGC() {
        // Clear temporary references
        for (const key in this.tempArrays) {
            this.tempArrays[key].fill(0);
        }
    }

    /**
     * Perform periodic cleanup
     * @param {number} currentTime - Current timestamp
     */
    update(currentTime) {
        if (currentTime - this.lastCleanup > this.cleanupInterval) {
            this.performCleanup();
            this.lastCleanup = currentTime;
        }
    }

    /**
     * Execute cleanup procedures
     */
    performCleanup() {
        // Run registered cleanup callbacks
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            } catch (e) {
                console.warn('Cleanup callback error:', e);
            }
        }

        // Log pool stats in debug mode
        if (window.DEBUG_MODE) {
            this.logStats();
        }
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory stats
     */
    getStats() {
        const stats = {
            pools: {},
            colorCacheSize: this.colorCache.size
        };

        this.pools.forEach((pool, name) => {
            stats.pools[name] = pool.getStats();
        });

        // Add performance.memory if available (Chrome only)
        if (performance.memory) {
            stats.heapUsed = performance.memory.usedJSHeapSize;
            stats.heapTotal = performance.memory.totalJSHeapSize;
            stats.heapLimit = performance.memory.jsHeapSizeLimit;
            stats.heapUsagePercent = (stats.heapUsed / stats.heapLimit) * 100;
        }

        return stats;
    }

    /**
     * Log memory statistics
     */
    logStats() {
        const stats = this.getStats();
        console.log('Memory Stats:', stats);
    }

    /**
     * Check if memory usage is critical
     * @returns {boolean} True if memory is critically high
     */
    isMemoryCritical() {
        if (performance.memory) {
            const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            return usage > this.memoryWarningThreshold;
        }
        return false;
    }

    /**
     * Start memory monitoring
     * @param {number} interval - Check interval in ms
     */
    startMonitoring(interval = 5000) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        this.monitoringInterval = setInterval(() => {
            if (this.isMemoryCritical()) {
                console.warn('Memory usage critical, forcing cleanup');
                this.performCleanup();
                this.suggestGC();
            }
        }, interval);
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.isMonitoring = false;
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.stopMonitoring();
        this.pools.forEach(pool => pool.clear());
        this.pools.clear();
        this.colorCache.clear();
        this.cleanupCallbacks.length = 0;
    }
}

// Global memory manager instance
const memoryManager = new MemoryManager();

// Register global pools
memoryManager.registerPool('particles', particlePool);
memoryManager.registerPool('bars', barPool);
