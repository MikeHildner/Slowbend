interface PitchControlProps {
  semitones: number;
  cents: number;
  disabled: boolean;
  onChange: (semitones: number, cents: number) => void;
}

export default function PitchControl({
  semitones,
  cents,
  disabled,
  onChange,
}: PitchControlProps) {
  const total = semitones + cents / 100;
  const sign = total > 0 ? "+" : "";

  return (
    <div className="control-card">
      <div className="control-header">
        <span className="control-title">Pitch</span>
        <span className="control-value">
          {sign}
          {semitones} st {cents !== 0 ? `${cents > 0 ? "+" : ""}${cents} ¢` : ""}
        </span>
      </div>
      <div className="control-row">
        <button
          disabled={disabled || semitones <= -12}
          onClick={() => onChange(semitones - 1, cents)}
        >
          − st
        </button>
        <button
          disabled={disabled || semitones >= 12}
          onClick={() => onChange(semitones + 1, cents)}
        >
          + st
        </button>
        <button
          disabled={disabled || (semitones === 0 && cents === 0)}
          onClick={() => onChange(0, 0)}
        >
          Reset
        </button>
      </div>
      <label className="cents-label">
        Fine (cents)
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={cents}
          disabled={disabled}
          onChange={(e) => onChange(semitones, Number(e.target.value))}
        />
      </label>
    </div>
  );
}
