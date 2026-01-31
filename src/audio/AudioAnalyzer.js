/**
 * AudioAnalyzer - Real-time audio analysis with frequency band isolation
 * Uses p5.sound's FFT for frequency analysis
 */
class AudioAnalyzer {
    constructor(fftSize = 1024, smoothing = 0.8) {
        this.fftSize = fftSize;
        this.smoothing = smoothing;
        this.fft = null;
        this.mic = null;
        this.isInitialized = false;
        this.isListening = false;

        // Pre-calculated bin ranges for performance
        this.binRanges = null;

        // Cached energy values to avoid allocation
        this.energyCache = {
            drums: { low: 0, mid: 0, high: 0, combined: 0 },
            vocals: { low: 0, mid: 0, high: 0, combined: 0 },
            bass: { sub: 0, main: 0, combined: 0 },
            highs: { instruments: 0, air: 0, combined: 0 }
        };

        // Smoothed values for visualization
        this.smoothedEnergy = {
            drums: 0,
            vocals: 0,
            bass: 0,
            highs: 0
        };

        // Peak detection
        this.peakThreshold = 0.7;
        this.peakDecay = 0.95;
        this.peaks = {
            drums: { value: 0, isPeak: false },
            vocals: { value: 0, isPeak: false },
            bass: { value: 0, isPeak: false },
            highs: { value: 0, isPeak: false }
        };

        // History for beat detection (circular buffer)
        this.historySize = 43; // ~0.7 seconds at 60fps
        this.historyIndex = 0;
        this.energyHistory = {
            drums: new Float32Array(this.historySize),
            bass: new Float32Array(this.historySize)
        };
    }

    /**
     * Initialize the audio analyzer
     * Must be called after user interaction due to browser autoplay policies
     */
    async init() {
        if (this.isInitialized) return true;

        try {
            // Initialize p5.sound FFT
            this.fft = new p5.FFT(this.smoothing, this.fftSize);

            // Initialize microphone input
            this.mic = new p5.AudioIn();

            // Calculate bin ranges for frequency bands
            this.binRanges = calculateAllBinRanges(
                getAudioContext().sampleRate,
                this.fftSize
            );

            this.isInitialized = true;
            console.log('AudioAnalyzer initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AudioAnalyzer:', error);
            return false;
        }
    }

    /**
     * Start listening to microphone input
     */
    async startListening() {
        if (!this.isInitialized) {
            const success = await this.init();
            if (!success) return false;
        }

        try {
            await this.mic.start();
            this.fft.setInput(this.mic);
            this.isListening = true;
            console.log('Started listening to microphone');
            return true;
        } catch (error) {
            console.error('Failed to start microphone:', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.mic && this.isListening) {
            this.mic.stop();
            this.isListening = false;
        }
    }

    /**
     * Get energy for a specific frequency band
     * @param {string} bandName - Name of the frequency band
     * @returns {number} Energy value (0-255)
     */
    getBandEnergy(bandName) {
        if (!this.fft || !this.binRanges) return 0;

        const range = this.binRanges.get(bandName);
        if (!range) return 0;

        const spectrum = this.fft.analyze();
        let sum = 0;
        const count = range.end - range.start;

        for (let i = range.start; i < range.end && i < spectrum.length; i++) {
            sum += spectrum[i];
        }

        return count > 0 ? sum / count : 0;
    }

    /**
     * Update all frequency band energies
     * Call this once per frame
     */
    update() {
        if (!this.fft || !this.isListening) return;

        // Analyze spectrum
        const spectrum = this.fft.analyze();

        // Update drum energies
        this.energyCache.drums.low = this._getAverageEnergy(spectrum, 'DRUMS_LOW');
        this.energyCache.drums.mid = this._getAverageEnergy(spectrum, 'DRUMS_MID');
        this.energyCache.drums.high = this._getAverageEnergy(spectrum, 'DRUMS_HIGH');
        this.energyCache.drums.combined = this._calculateWeightedEnergy(
            [this.energyCache.drums.low, this.energyCache.drums.mid, this.energyCache.drums.high],
            VisualizerGroups.DRUMS.weights
        );

        // Update vocal energies
        this.energyCache.vocals.low = this._getAverageEnergy(spectrum, 'VOCALS_LOW');
        this.energyCache.vocals.mid = this._getAverageEnergy(spectrum, 'VOCALS_MID');
        this.energyCache.vocals.high = this._getAverageEnergy(spectrum, 'VOCALS_HIGH');
        this.energyCache.vocals.combined = this._calculateWeightedEnergy(
            [this.energyCache.vocals.low, this.energyCache.vocals.mid, this.energyCache.vocals.high],
            VisualizerGroups.VOCALS.weights
        );

        // Update bass energies
        this.energyCache.bass.sub = this._getAverageEnergy(spectrum, 'SUB_BASS');
        this.energyCache.bass.main = this._getAverageEnergy(spectrum, 'BASS');
        this.energyCache.bass.combined = this._calculateWeightedEnergy(
            [this.energyCache.bass.sub, this.energyCache.bass.main],
            VisualizerGroups.BASS.weights
        );

        // Update highs energies
        this.energyCache.highs.instruments = this._getAverageEnergy(spectrum, 'INSTRUMENTS_HIGH');
        this.energyCache.highs.air = this._getAverageEnergy(spectrum, 'AIR');
        this.energyCache.highs.combined = this._calculateWeightedEnergy(
            [this.energyCache.highs.instruments, this.energyCache.highs.air],
            VisualizerGroups.HIGHS.weights
        );

        // Update smoothed values
        const smoothFactor = 0.3;
        this.smoothedEnergy.drums += (this.energyCache.drums.combined - this.smoothedEnergy.drums) * smoothFactor;
        this.smoothedEnergy.vocals += (this.energyCache.vocals.combined - this.smoothedEnergy.vocals) * smoothFactor;
        this.smoothedEnergy.bass += (this.energyCache.bass.combined - this.smoothedEnergy.bass) * smoothFactor;
        this.smoothedEnergy.highs += (this.energyCache.highs.combined - this.smoothedEnergy.highs) * smoothFactor;

        // Update beat detection history
        this._updateHistory();

        // Detect peaks/beats
        this._detectPeaks();
    }

    /**
     * Get average energy from spectrum for a frequency band
     * @private
     */
    _getAverageEnergy(spectrum, bandName) {
        const range = this.binRanges.get(bandName);
        if (!range) return 0;

        let sum = 0;
        let count = 0;

        for (let i = range.start; i < range.end && i < spectrum.length; i++) {
            sum += spectrum[i];
            count++;
        }

        return count > 0 ? sum / count / 255 : 0; // Normalize to 0-1
    }

    /**
     * Calculate weighted energy from multiple bands
     * @private
     */
    _calculateWeightedEnergy(energies, weights) {
        let sum = 0;
        for (let i = 0; i < energies.length; i++) {
            sum += energies[i] * weights[i];
        }
        return sum;
    }

    /**
     * Update energy history for beat detection
     * @private
     */
    _updateHistory() {
        this.energyHistory.drums[this.historyIndex] = this.energyCache.drums.combined;
        this.energyHistory.bass[this.historyIndex] = this.energyCache.bass.combined;
        this.historyIndex = (this.historyIndex + 1) % this.historySize;
    }

    /**
     * Detect peaks/beats in the audio
     * @private
     */
    _detectPeaks() {
        const categories = ['drums', 'vocals', 'bass', 'highs'];

        for (const cat of categories) {
            const current = this.smoothedEnergy[cat];
            const peak = this.peaks[cat];

            // Decay previous peak
            peak.value *= this.peakDecay;

            // Check for new peak
            if (current > peak.value && current > this.peakThreshold) {
                peak.value = current;
                peak.isPeak = true;
            } else {
                peak.isPeak = false;
            }
        }
    }

    /**
     * Get current energy values
     * @returns {Object} Energy values for all categories
     */
    getEnergies() {
        return {
            drums: this.smoothedEnergy.drums,
            vocals: this.smoothedEnergy.vocals,
            bass: this.smoothedEnergy.bass,
            highs: this.smoothedEnergy.highs,
            raw: this.energyCache
        };
    }

    /**
     * Get peak/beat information
     * @returns {Object} Peak data for all categories
     */
    getPeaks() {
        return this.peaks;
    }

    /**
     * Get the raw spectrum data
     * @returns {Uint8Array} Raw FFT spectrum
     */
    getSpectrum() {
        return this.fft ? this.fft.analyze() : null;
    }

    /**
     * Get waveform data
     * @returns {Float32Array} Waveform data
     */
    getWaveform() {
        return this.fft ? this.fft.waveform() : null;
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.stopListening();
        this.fft = null;
        this.mic = null;
        this.isInitialized = false;
    }
}
