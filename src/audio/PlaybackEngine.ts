import SignalsmithStretch, { type StretchNode } from "signalsmith-stretch";

export interface LoopRegion {
  start: number;
  end: number;
}

/**
 * Owns the AudioContext and the signalsmith-stretch worklet node.
 * Single source of truth for playback time; the UI polls `currentTime`.
 *
 * Notes on the underlying node:
 * - `schedule({...})` applies immediately and preserves unspecified fields.
 * - Plain `start()` resets the input position to 0, so resume uses `start({})`.
 * - Looping is disabled by scheduling loopStart === loopEnd.
 */
export class PlaybackEngine {
  private ctx: AudioContext;
  private node: StretchNode;
  private gain: GainNode;

  private rate = 1;
  private semitones = 0;
  private loop: LoopRegion | null = null;
  private loopEnabled = true;

  private playing = false;
  /** playback position while paused/stopped */
  private position = 0;
  /** last inputTime reported by the worklet, and when we received it */
  private lastInputTime = 0;
  private lastInputStamp = 0;

  duration = 0;
  onEnded: (() => void) | null = null;

  private constructor(ctx: AudioContext, node: StretchNode, gain: GainNode) {
    this.ctx = ctx;
    this.node = node;
    this.gain = gain;
  }

  /** Must be called from a user gesture (autoplay policy). */
  static async create(): Promise<PlaybackEngine> {
    const ctx = new AudioContext();
    const node = await SignalsmithStretch(ctx);
    const gain = ctx.createGain();
    node.connect(gain);
    gain.connect(ctx.destination);
    const engine = new PlaybackEngine(ctx, node, gain);
    await node.setUpdateInterval(0.05, (t) => engine.handleTimeUpdate(t));
    return engine;
  }

  async decode(file: Blob): Promise<AudioBuffer> {
    const data = await file.arrayBuffer();
    return this.ctx.decodeAudioData(data);
  }

  async load(buffer: AudioBuffer): Promise<void> {
    await this.node.stop();
    this.playing = false;
    await this.node.dropBuffers();
    const channels: Float32Array[] = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }
    this.duration = await this.node.addBuffers(channels);
    this.loop = null;
    this.position = 0;
    this.lastInputTime = 0;
    this.lastInputStamp = performance.now();
    // keep current tempo/pitch across file loads; clear any old loop
    await this.node.schedule({
      input: 0,
      rate: this.rate,
      semitones: this.semitones,
      loopStart: 0,
      loopEnd: 0,
    });
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentTime(): number {
    if (!this.playing) return this.position;
    let t =
      this.lastInputTime +
      ((performance.now() - this.lastInputStamp) / 1000) * this.rate;
    const loop = this.activeLoop();
    if (loop && t >= loop.end) {
      t = loop.start + ((t - loop.start) % (loop.end - loop.start));
    }
    return Math.min(Math.max(t, 0), this.duration);
  }

  async play(): Promise<void> {
    if (this.playing || this.duration === 0) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.activeLoop() && this.position >= this.duration - 0.01) {
      await this.seek(0);
    }
    this.lastInputTime = this.position;
    this.lastInputStamp = performance.now();
    this.playing = true;
    await this.node.start({});
  }

  async pause(): Promise<void> {
    if (!this.playing) return;
    this.position = this.currentTime;
    this.playing = false;
    await this.node.stop();
    // pin the node to the exact position we report, so resume matches the UI
    await this.node.schedule({ input: this.position });
  }

  async stop(): Promise<void> {
    const home = this.activeLoop()?.start ?? 0;
    if (this.playing) {
      this.playing = false;
      await this.node.stop();
    }
    await this.seek(home);
  }

  async seek(seconds: number): Promise<void> {
    const t = Math.min(Math.max(seconds, 0), this.duration);
    this.position = t;
    this.lastInputTime = t;
    this.lastInputStamp = performance.now();
    await this.node.schedule({ input: t });
  }

  /** rate: 1 == original tempo, 0.5 == half speed; pitch is unaffected */
  async setTempo(rate: number): Promise<void> {
    this.rate = rate;
    await this.node.schedule({ rate });
  }

  /** total pitch shift in semitones; fractional part = cents */
  async setPitch(semitones: number): Promise<void> {
    this.semitones = semitones;
    await this.node.schedule({ semitones });
  }

  /** v: 0..1; ramped briefly to avoid clicks */
  setVolume(v: number): void {
    const clamped = Math.min(Math.max(v, 0), 1);
    this.gain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  async setLoop(loop: LoopRegion | null): Promise<void> {
    this.loop = loop;
    await this.applyLoop();
  }

  async setLoopEnabled(enabled: boolean): Promise<void> {
    this.loopEnabled = enabled;
    await this.applyLoop();
  }

  async destroy(): Promise<void> {
    await this.node.stop();
    this.node.disconnect();
    this.gain.disconnect();
    await this.ctx.close();
  }

  private activeLoop(): LoopRegion | null {
    if (this.loopEnabled && this.loop && this.loop.end > this.loop.start) {
      return this.loop;
    }
    return null;
  }

  private async applyLoop(): Promise<void> {
    const loop = this.activeLoop();
    await this.node.schedule(
      loop ? { loopStart: loop.start, loopEnd: loop.end } : { loopStart: 0, loopEnd: 0 },
    );
  }

  private handleTimeUpdate(inputTime: number): void {
    if (!this.playing) return;
    this.lastInputTime = inputTime;
    this.lastInputStamp = performance.now();
    if (!this.activeLoop() && inputTime >= this.duration - 0.03) {
      this.playing = false;
      this.position = this.duration;
      void this.node.stop();
      void this.node.schedule({ input: this.duration });
      this.onEnded?.();
    }
  }
}
