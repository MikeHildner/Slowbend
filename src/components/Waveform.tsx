import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/plugins/regions";
import type { LoopRegion } from "../audio/PlaybackEngine";

const LOOP_COLOR_ON = "rgba(240, 138, 36, 0.28)";
const LOOP_COLOR_OFF = "rgba(160, 160, 170, 0.18)";

interface WaveformProps {
  peaks: number[];
  duration: number;
  getTime: () => number;
  onSeek: (seconds: number) => void;
  loop: LoopRegion | null;
  loopEnabled: boolean;
  onLoopChange: (loop: LoopRegion | null) => void;
}

export default function Waveform({
  peaks,
  duration,
  getTime,
  onSeek,
  loop,
  loopEnabled,
  onLoopChange,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const loopEnabledRef = useRef(loopEnabled);
  const callbacksRef = useRef({ getTime, onSeek, onLoopChange });
  callbacksRef.current = { getTime, onSeek, onLoopChange };
  loopEnabledRef.current = loopEnabled;

  // (Re)build wavesurfer whenever a new file's peaks arrive.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ws = WaveSurfer.create({
      container,
      height: 150,
      peaks: [peaks],
      duration,
      normalize: false,
      waveColor: "#5b6478",
      progressColor: "#8fa3cc",
      cursorColor: "#f0f2f5",
      cursorWidth: 2,
      interact: true,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;
    regions.enableDragSelection({
      color: loopEnabledRef.current ? LOOP_COLOR_ON : LOOP_COLOR_OFF,
    });

    ws.on("interaction", (newTime: number) => {
      callbacksRef.current.onSeek(newTime);
    });

    regions.on("region-created", (region: Region) => {
      // single loop region: a new drag replaces the old one
      for (const other of regions.getRegions()) {
        if (other !== region) other.remove();
      }
      callbacksRef.current.onLoopChange({ start: region.start, end: region.end });
    });

    regions.on("region-updated", (region: Region) => {
      callbacksRef.current.onLoopChange({ start: region.start, end: region.end });
    });

    regions.on("region-double-clicked", (region: Region) => {
      region.remove();
      callbacksRef.current.onLoopChange(null);
    });

    let raf = 0;
    const tick = () => {
      ws.setTime(callbacksRef.current.getTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      regionsRef.current = null;
      ws.destroy();
    };
  }, [peaks, duration]);

  // Reflect external loop clearing (e.g. "Clear loop" button).
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions) return;
    if (loop === null && regions.getRegions().length > 0) {
      regions.clearRegions();
    }
  }, [loop]);

  // Dim the region while looping is toggled off.
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions) return;
    const color = loopEnabled ? LOOP_COLOR_ON : LOOP_COLOR_OFF;
    for (const region of regions.getRegions()) {
      region.setOptions({ color });
    }
    regions.enableDragSelection({ color });
  }, [loopEnabled]);

  return <div className="waveform" ref={containerRef} />;
}
