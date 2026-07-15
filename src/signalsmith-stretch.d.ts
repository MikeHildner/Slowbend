declare module "signalsmith-stretch" {
  export interface StretchSchedule {
    /** AudioContext output time for this change (seconds); omit to apply now */
    output?: number;
    /** whether the node is processing/playing */
    active?: boolean;
    /** position in the input buffer (seconds) */
    input?: number;
    /** playback rate, e.g. 0.5 == half speed (pitch unchanged) */
    rate?: number;
    /** pitch shift in semitones (fractional values = cents) */
    semitones?: number;
    tonalityHz?: number;
    formantSemitones?: number;
    formantCompensation?: boolean;
    formantBaseHz?: number;
    /** auto-loop region (seconds); disabled when loopStart === loopEnd */
    loopStart?: number;
    loopEnd?: number;
  }

  export interface StretchNode extends AudioWorkletNode {
    /** current playback position (seconds) within the stored input audio */
    inputTime: number;
    start(schedule?: StretchSchedule): Promise<unknown>;
    start(
      when?: number,
      offset?: number,
      duration?: number,
      rate?: number,
      semitones?: number,
    ): Promise<unknown>;
    stop(when?: number): Promise<unknown>;
    schedule(schedule: StretchSchedule, adjustPrevious?: boolean): Promise<unknown>;
    /** append channel buffers (one Float32Array per channel, equal lengths); resolves to new buffer end time in seconds */
    addBuffers(sampleBuffers: Float32Array[]): Promise<number>;
    dropBuffers(toSeconds?: number): Promise<{ start: number; end: number } | void>;
    latency(): Promise<number>;
    configure(config: {
      blockMs?: number | null;
      intervalMs?: number;
      splitComputation?: boolean;
      preset?: "default" | "cheaper";
    }): Promise<unknown>;
    setUpdateInterval(seconds: number, callback?: (inputTime: number) => void): Promise<unknown>;
  }

  export default function SignalsmithStretch(
    audioContext: AudioContext,
    channelOptions?: AudioWorkletNodeOptions,
  ): Promise<StretchNode>;
}
