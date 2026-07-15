interface TempoControlProps {
  /** percent, 100 = original speed */
  tempo: number;
  disabled: boolean;
  onChange: (tempo: number) => void;
}

export default function TempoControl({ tempo, disabled, onChange }: TempoControlProps) {
  return (
    <div className="control-card">
      <div className="control-header">
        <span className="control-title">Tempo</span>
        <span className="control-value">{tempo}%</span>
      </div>
      <input
        type="range"
        min={25}
        max={200}
        step={1}
        value={tempo}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="control-row">
        <button disabled={disabled} onClick={() => onChange(Math.max(25, tempo - 1))}>
          −1
        </button>
        <button disabled={disabled} onClick={() => onChange(Math.min(200, tempo + 1))}>
          +1
        </button>
        <button disabled={disabled || tempo === 100} onClick={() => onChange(100)}>
          Reset
        </button>
      </div>
    </div>
  );
}
