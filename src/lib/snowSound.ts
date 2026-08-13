// High-Fidelity Procedural Web Audio API Winter Wind & Soft Snowfall Synthesizer

class SnowSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private bandpassFilter1: BiquadFilterNode | null = null;
  private bandpassFilter2: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private isPlaying = false;
  private volume = 0.25;
  private lfoTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generates 4 seconds of continuous pink/brown noise for cozy winter atmosphere
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.04;
    }

    return buffer;
  }

  // Synthesize soft, subtle frost/ice pings (snowflakes hitting window pane)
  private triggerFrostPing() {
    if (!this.ctx || !this.isPlaying || this.ctx.state !== "running") return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const freq = 2800 + Math.random() * 2200;
      const pingVol = (0.003 + Math.random() * 0.008) * (this.volume / 0.25);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.015);

      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 4;

      gain.gain.setValueAtTime(pingVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {}
  }

  public start(initialVolume = 0.25) {
    if (this.isPlaying) return;
    this.volume = initialVolume;

    try {
      const ctx = this.initContext();
      this.isPlaying = true;

      // Master Gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);

      const noiseBuffer = this.createNoiseBuffer(ctx);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      // 1. Deep Lowpass Filter for cozy room warmth (140Hz)
      this.lowpassFilter = ctx.createBiquadFilter();
      this.lowpassFilter.type = "lowpass";
      this.lowpassFilter.frequency.setValueAtTime(140, ctx.currentTime);

      const lowpassGain = ctx.createGain();
      lowpassGain.gain.value = 0.6;

      // 2. Dual Bandpass Filters for sweeping mountain wind
      this.bandpassFilter1 = ctx.createBiquadFilter();
      this.bandpassFilter1.type = "bandpass";
      this.bandpassFilter1.frequency.setValueAtTime(280, ctx.currentTime);
      this.bandpassFilter1.Q.setValueAtTime(3.5, ctx.currentTime);

      this.bandpassFilter2 = ctx.createBiquadFilter();
      this.bandpassFilter2.type = "bandpass";
      this.bandpassFilter2.frequency.setValueAtTime(560, ctx.currentTime);
      this.bandpassFilter2.Q.setValueAtTime(4.0, ctx.currentTime);

      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.45;

      // Connect noise source to filters
      this.noiseSource.connect(this.lowpassFilter);
      this.lowpassFilter.connect(lowpassGain);
      lowpassGain.connect(this.masterGain);

      this.noiseSource.connect(this.bandpassFilter1);
      this.noiseSource.connect(this.bandpassFilter2);
      this.bandpassFilter1.connect(this.windGain);
      this.bandpassFilter2.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      this.noiseSource.start(0);

      // Smooth Dual LFO Modulation for gentle, breathing alpine wind
      let angle1 = 0;
      let angle2 = Math.PI / 4;

      this.lfoTimer = setInterval(() => {
        if (!this.ctx || !this.bandpassFilter1 || !this.bandpassFilter2) return;
        angle1 += 0.03;
        angle2 += 0.02;

        const freq1 = 240 + Math.sin(angle1) * 90 + Math.cos(angle2 * 0.7) * 40;
        const freq2 = 480 + Math.cos(angle2) * 160 + Math.sin(angle1 * 0.5) * 60;

        this.bandpassFilter1.frequency.setTargetAtTime(freq1, this.ctx.currentTime, 0.2);
        this.bandpassFilter2.frequency.setTargetAtTime(freq2, this.ctx.currentTime, 0.25);
      }, 120);

      // Soft frost pings
      this.pingTimer = setInterval(() => {
        if (Math.random() > 0.45) {
          this.triggerFrostPing();
        }
      }, 200);
    } catch {
      this.isPlaying = false;
    }
  }

  public stop() {
    if (!this.isPlaying) return;

    if (this.lfoTimer) {
      clearInterval(this.lfoTimer);
      this.lfoTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.masterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        setTimeout(() => {
          this.noiseSource?.stop();
          this.noiseSource?.disconnect();
          this.noiseSource = null;
          this.lowpassFilter?.disconnect();
          this.lowpassFilter = null;
          this.bandpassFilter1?.disconnect();
          this.bandpassFilter1 = null;
          this.bandpassFilter2?.disconnect();
          this.bandpassFilter2 = null;
          this.masterGain?.disconnect();
          this.masterGain = null;
          this.isPlaying = false;
        }, 450);
      } catch {
        this.isPlaying = false;
      }
    } else {
      this.isPlaying = false;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const snowSynth = new SnowSynthesizer();
