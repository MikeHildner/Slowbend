import { useCallback, useEffect, useRef, useState } from "react";
import { PlaybackEngine, type LoopRegion } from "./audio/PlaybackEngine";
import { computePeaks } from "./audio/peaks";
import FileDrop from "./components/FileDrop";
import Logo from "./components/Logo";
import Waveform from "./components/Waveform";
import Transport from "./components/Transport";
import TempoControl from "./components/TempoControl";
import PitchControl from "./components/PitchControl";
import VolumeControl from "./components/VolumeControl";

export default function App() {
  const engineRef = useRef<PlaybackEngine | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [semitones, setSemitones] = useState(0);
  const [cents, setCents] = useState(0);
  const [loop, setLoop] = useState<LoopRegion | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);

  // re-render the time display while playing
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [isPlaying]);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      if (!engineRef.current) {
        engineRef.current = await PlaybackEngine.create();
        engineRef.current.onEnded = () => setIsPlaying(false);
        if (import.meta.env.DEV) {
          (window as unknown as { __engine: PlaybackEngine }).__engine =
            engineRef.current;
        }
      }
      const engine = engineRef.current;
      const buffer = await engine.decode(file);
      await engine.load(buffer);
      setPeaks(computePeaks(buffer));
      setDuration(engine.duration);
      setFileName(file.name);
      setIsPlaying(false);
      setLoop(null);
      // tempo/pitch settings intentionally persist across file loads
    } catch (err) {
      console.error(err);
      setError(
        `Could not load "${file.name}" — it may not be a supported audio format.`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.duration === 0) return;
    if (engine.isPlaying) {
      void engine.pause();
      setIsPlaying(false);
    } else {
      void engine.play();
      setIsPlaying(true);
    }
  }, []);

  const handleStop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    void engine.stop();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((t: number) => {
    void engineRef.current?.seek(t);
  }, []);

  const handleTempo = useCallback((percent: number) => {
    setTempo(percent);
    void engineRef.current?.setTempo(percent / 100);
  }, []);

  const handlePitch = useCallback((st: number, c: number) => {
    setSemitones(st);
    setCents(c);
    void engineRef.current?.setPitch(st + c / 100);
  }, []);

  const handleLoopChange = useCallback((region: LoopRegion | null) => {
    setLoop(region);
    void engineRef.current?.setLoop(region);
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    setMuted(false); // dragging the slider always unmutes
    engineRef.current?.setVolume(v / 100);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      engineRef.current?.setVolume(next ? 0 : volume / 100);
      return next;
    });
  }, [volume]);

  const handleLoopEnabled = useCallback((enabled: boolean) => {
    setLoopEnabled(enabled);
    void engineRef.current?.setLoopEnabled(enabled);
  }, []);

  // Space bar: play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement;
      if (["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
      handlePlayPause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePlayPause]);

  const engine = engineRef.current;
  const hasFile = peaks !== null && duration > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Logo size={38} />
          <h1>Slowbend</h1>
        </div>
        <p className="tagline">slow it down · change the pitch · loop it</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {!hasFile ? (
        <FileDrop onFile={handleFile} />
      ) : (
        <main className="player">
          <div className="file-row">
            <span className="file-name" title={fileName ?? ""}>
              {fileName}
            </span>
            <FileDrop onFile={handleFile} compact />
          </div>

          <Waveform
            peaks={peaks}
            duration={duration}
            getTime={() => engineRef.current?.currentTime ?? 0}
            onSeek={handleSeek}
            loop={loop}
            loopEnabled={loopEnabled}
            onLoopChange={handleLoopChange}
          />
          <p className="hint">
            Drag on the waveform to set a loop · drag its edges to adjust ·
            double-click it to remove · click elsewhere to seek
          </p>

          <Transport
            isPlaying={isPlaying}
            currentTime={engine?.currentTime ?? 0}
            duration={duration}
            disabled={!hasFile}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
          >
            <VolumeControl
              volume={volume}
              muted={muted}
              disabled={!hasFile}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
            />
          </Transport>

          <div className="controls">
            <TempoControl tempo={tempo} disabled={!hasFile} onChange={handleTempo} />
            <PitchControl
              semitones={semitones}
              cents={cents}
              disabled={!hasFile}
              onChange={handlePitch}
            />
            <div className="control-card">
              <div className="control-header">
                <span className="control-title">Loop</span>
                <span className="control-value">
                  {loop ? (loopEnabled ? "on" : "off") : "none"}
                </span>
              </div>
              <div className="control-row">
                <button
                  disabled={!loop}
                  onClick={() => handleLoopEnabled(!loopEnabled)}
                >
                  {loopEnabled ? "Disable" : "Enable"}
                </button>
                <button disabled={!loop} onClick={() => handleLoopChange(null)}>
                  Clear
                </button>
              </div>
              <p className="control-note">
                {loop
                  ? `${loop.start.toFixed(2)}s – ${loop.end.toFixed(2)}s`
                  : "Drag on the waveform to create a loop."}
              </p>
            </div>
          </div>
        </main>
      )}

      {loading && <div className="loading-overlay">Decoding audio…</div>}
    </div>
  );
}
