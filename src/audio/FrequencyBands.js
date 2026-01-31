/**
 * FrequencyBands - Defines frequency ranges for different audio components
 * Based on typical musical instrument frequency ranges
 */
const FrequencyBands = {
    // Sub-bass and bass drum fundamentals
    SUB_BASS: {
        name: 'Sub Bass',
        min: 20,
        max: 60,
        color: { r: 128, g: 0, b: 255 } // Purple
    },

    // Bass guitar, kick drum body
    BASS: {
        name: 'Bass',
        min: 60,
        max: 250,
        color: { r: 255, g: 0, b: 100 } // Magenta
    },

    // Drums (kick, snare body, toms)
    DRUMS_LOW: {
        name: 'Drums Low',
        min: 60,
        max: 200,
        color: { r: 255, g: 50, b: 50 } // Red
    },

    // Snare snap, high toms
    DRUMS_MID: {
        name: 'Drums Mid',
        min: 200,
        max: 2000,
        color: { r: 255, g: 100, b: 50 } // Orange
    },

    // Hi-hats, cymbals
    DRUMS_HIGH: {
        name: 'Drums High',
        min: 2000,
        max: 8000,
        color: { r: 255, g: 200, b: 50 } // Yellow
    },

    // Vocal fundamental frequencies
    VOCALS_LOW: {
        name: 'Vocals Low',
        min: 80,
        max: 300,
        color: { r: 50, g: 200, b: 255 } // Cyan
    },

    // Vocal presence range
    VOCALS_MID: {
        name: 'Vocals Mid',
        min: 300,
        max: 2000,
        color: { r: 100, g: 150, b: 255 } // Light Blue
    },

    // Vocal sibilance and air
    VOCALS_HIGH: {
        name: 'Vocals High',
        min: 2000,
        max: 8000,
        color: { r: 150, g: 100, b: 255 } // Purple-Blue
    },

    // Guitar, keys lower range
    INSTRUMENTS_LOW: {
        name: 'Instruments Low',
        min: 80,
        max: 400,
        color: { r: 50, g: 255, b: 100 } // Green
    },

    // Guitar, piano mid range
    INSTRUMENTS_MID: {
        name: 'Instruments Mid',
        min: 400,
        max: 2000,
        color: { r: 100, g: 255, b: 150 } // Light Green
    },

    // Lead instruments, synths
    INSTRUMENTS_HIGH: {
        name: 'Instruments High',
        min: 2000,
        max: 6000,
        color: { r: 150, g: 255, b: 200 } // Mint
    },

    // Brilliance, air, sparkle
    AIR: {
        name: 'Air',
        min: 8000,
        max: 20000,
        color: { r: 255, g: 255, b: 255 } // White
    }
};

/**
 * Grouped frequency bands for visualization
 */
const VisualizerGroups = {
    DRUMS: {
        name: 'Drums',
        bands: ['DRUMS_LOW', 'DRUMS_MID', 'DRUMS_HIGH'],
        weights: [0.5, 0.3, 0.2], // Emphasis on kick/snare
        primaryColor: { r: 255, g: 80, b: 50 },
        accentColor: { r: 255, g: 150, b: 100 }
    },

    VOCALS: {
        name: 'Vocals',
        bands: ['VOCALS_LOW', 'VOCALS_MID', 'VOCALS_HIGH'],
        weights: [0.2, 0.5, 0.3], // Emphasis on presence
        primaryColor: { r: 100, g: 150, b: 255 },
        accentColor: { r: 180, g: 200, b: 255 }
    },

    BASS: {
        name: 'Bass',
        bands: ['SUB_BASS', 'BASS'],
        weights: [0.4, 0.6],
        primaryColor: { r: 200, g: 0, b: 200 },
        accentColor: { r: 255, g: 100, b: 255 }
    },

    HIGHS: {
        name: 'Highs',
        bands: ['INSTRUMENTS_HIGH', 'AIR'],
        weights: [0.6, 0.4],
        primaryColor: { r: 100, g: 255, b: 200 },
        accentColor: { r: 200, g: 255, b: 255 }
    }
};

/**
 * Calculate FFT bin range for a frequency band
 * @param {Object} band - Frequency band definition
 * @param {number} sampleRate - Audio sample rate (typically 44100)
 * @param {number} fftSize - FFT size (typically 1024 or 2048)
 * @returns {Object} Start and end bin indices
 */
function getBinRange(band, sampleRate = 44100, fftSize = 1024) {
    const binFrequency = sampleRate / fftSize;
    return {
        start: Math.floor(band.min / binFrequency),
        end: Math.ceil(band.max / binFrequency)
    };
}

/**
 * Pre-calculate bin ranges for all bands
 * @param {number} sampleRate - Audio sample rate
 * @param {number} fftSize - FFT size
 * @returns {Map} Map of band names to bin ranges
 */
function calculateAllBinRanges(sampleRate = 44100, fftSize = 1024) {
    const ranges = new Map();

    for (const [name, band] of Object.entries(FrequencyBands)) {
        ranges.set(name, getBinRange(band, sampleRate, fftSize));
    }

    return ranges;
}
