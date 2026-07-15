export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds * 10) % 10);
  return `${m}:${String(s).padStart(2, "0")}.${tenths}`;
}

interface TransportProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  disabled: boolean;
  onPlayPause: () => void;
  onStop: () => void;
}

export default function Transport({
  isPlaying,
  currentTime,
  duration,
  disabled,
  onPlayPause,
  onStop,
}: TransportProps) {
  return (
    <div className="transport">
      <button
        className="transport-btn primary"
        onClick={onPlayPause}
        disabled={disabled}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button
        className="transport-btn"
        onClick={onStop}
        disabled={disabled}
        title="Stop"
      >
        ⏹
      </button>
      <div className="time-display">
        <span className="time-current">{formatTime(currentTime)}</span>
        <span className="time-sep"> / </span>
        <span className="time-total">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
