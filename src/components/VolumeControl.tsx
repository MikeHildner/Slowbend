interface VolumeControlProps {
  /** percent, 0–100 */
  volume: number;
  muted: boolean;
  disabled: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export default function VolumeControl({
  volume,
  muted,
  disabled,
  onVolumeChange,
  onMuteToggle,
}: VolumeControlProps) {
  const effectivelySilent = muted || volume === 0;
  return (
    <div className="volume-control">
      <button
        className="volume-btn"
        onClick={onMuteToggle}
        disabled={disabled}
        title={muted ? "Unmute" : "Mute"}
      >
        {effectivelySilent ? "🔇" : volume < 50 ? "🔉" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={muted ? 0 : volume}
        disabled={disabled}
        aria-label="Volume"
        onChange={(e) => onVolumeChange(Number(e.target.value))}
      />
    </div>
  );
}
