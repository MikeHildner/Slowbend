import { useRef, useState, type DragEvent } from "react";

interface FileDropProps {
  onFile: (file: File) => void;
  compact?: boolean;
}

export default function FileDrop({ onFile, compact = false }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="audio/*"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return (
      <>
        {input}
        <button className="file-btn" onClick={() => inputRef.current?.click()}>
          Load different file…
        </button>
      </>
    );
  }

  return (
    <div
      className={`dropzone${dragOver ? " drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {input}
      <p className="dropzone-title">Drop an audio file here</p>
      <p className="dropzone-sub">or click to browse — MP3, WAV, M4A, FLAC, OGG</p>
    </div>
  );
}
