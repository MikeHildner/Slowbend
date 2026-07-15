# Slowbend

A practice tool for musicians: load an audio file, loop sections, slow it down
without changing pitch, and shift pitch (semitones + cents) without changing
tempo.

## Features

- Load MP3 / WAV / M4A / FLAC / OGG (drag & drop or file picker)
- Waveform view — click to seek, drag to create a loop region, drag its edges
  to adjust, double-click it to remove
- Tempo 25%–200% with no pitch change
- Pitch ±12 semitones plus ±100 cents fine adjustment, with no tempo change
- Play / pause / stop, Space-bar play/pause, volume with mute
- Installable PWA: works fully offline after the first visit (audio never
  leaves the device — files are decoded entirely in the browser)

## Tech

- [Vite](https://vite.dev) + React + TypeScript
- [signalsmith-stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch)
  (MIT) — WASM/AudioWorklet time-stretch and pitch-shift engine
- [wavesurfer.js](https://wavesurfer.xyz) v7 in visualization-only mode
  (playback runs entirely through the AudioWorklet; wavesurfer renders peaks
  and loop regions, with the cursor driven from the engine clock)

The core audio path lives in [src/audio/PlaybackEngine.ts](src/audio/PlaybackEngine.ts),
which owns the AudioContext and is the single source of truth for playback time.

## Development

```sh
npm install
npm run dev     # dev server on http://localhost:5173/slowbend/
npm run build   # typecheck + production build to dist/
npm run icons   # regenerate PNG app icons from public/icon.svg
npm run deploy  # build + publish to hildner.org/slowbend (needs .env.deploy)
```

## Roadmap

- Android/iOS via Capacitor
- Saved loops per song, gradual speed-up trainer, count-in
- Latency-compensated playhead
