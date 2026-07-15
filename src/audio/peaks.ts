/**
 * Downsample an AudioBuffer to alternating max/min peak pairs for waveform
 * rendering. All channels are merged. The result is normalized to ±1 so
 * quiet recordings still fill the waveform.
 */
export function computePeaks(buffer: AudioBuffer, buckets = 4096): number[] {
  const length = buffer.length;
  const bucketSize = Math.max(1, Math.floor(length / buckets));
  const count = Math.ceil(length / bucketSize);
  const peaks = new Array<number>(count * 2).fill(0);

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < count; i++) {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, length);
      let max = 0;
      let min = 0;
      for (let j = start; j < end; j++) {
        const v = data[j];
        if (v > max) max = v;
        if (v < min) min = v;
      }
      if (max > peaks[i * 2]) peaks[i * 2] = max;
      if (min < peaks[i * 2 + 1]) peaks[i * 2 + 1] = min;
    }
  }

  let absMax = 0;
  for (const v of peaks) {
    const a = Math.abs(v);
    if (a > absMax) absMax = a;
  }
  if (absMax > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] /= absMax;
  }
  return peaks;
}
