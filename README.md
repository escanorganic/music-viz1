# music-viz1

Real-time music visualization with frequency band isolation for drums, vocals, bass, and highs.

## Features

- **Real-time audio analysis** using Web Audio API and p5.sound
- **Frequency band isolation** for different musical components:
  - Drums (kick, snare, hi-hats)
  - Vocals (fundamental and harmonics)
  - Bass (sub-bass and bass guitar)
  - Highs (cymbals, sparkle, air)
- **Memory-optimized** with object pooling and garbage collection management
- **Responsive layout** adapts to window size

## Usage

1. Open `index.html` in a modern browser
2. Click "Start Visualization" to enable microphone access
3. Play music near your microphone to see the visualization

### Controls

- **Toggle buttons**: Click to show/hide individual visualizers
- **Keyboard shortcuts**:
  - `1` - Toggle Drums
  - `2` - Toggle Vocals
  - `3` - Toggle Bass
  - `4` - Toggle Highs
  - `D` - Toggle debug mode

## Project Structure

```
music-viz1/
├── index.html              # Entry point with p5.js imports
├── src/
│   ├── sketch.js           # Main p5.js sketch
│   ├── audio/
│   │   ├── AudioAnalyzer.js    # FFT analysis and band isolation
│   │   └── FrequencyBands.js   # Frequency range definitions
│   ├── visualizers/
│   │   ├── BaseVisualizer.js   # Abstract base class
│   │   ├── DrumVisualizer.js   # Pulse and ripple effects
│   │   ├── VocalVisualizer.js  # Wave patterns
│   │   ├── BassVisualizer.js   # Deep pulsing shapes
│   │   └── HighsVisualizer.js  # Shimmer and sparkle
│   └── utils/
│       ├── ObjectPool.js       # Memory-efficient object pooling
│       └── MemoryManager.js    # GC management and monitoring
└── assets/                 # Static assets (if needed)
```

## Memory Optimization

- Object pooling for particles and visualizer bars
- Pre-allocated typed arrays for FFT data
- Color caching to reduce allocations
- Periodic cleanup and monitoring
- Frame skipping support for low-end devices

## Dependencies

- [p5.js](https://p5js.org/) - Creative coding library
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - Audio analysis
