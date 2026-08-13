// Procedural Web Audio API Rain & Distant Rolling Thunder Synthesizer

class RainSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private dropTimer: ReturnType<typeof setInterval> | null = null;
  private thunderTimer: ReturnType<typeof setInterval> | null = null;
  private volume = 0.35;

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

  // Generates 4 seconds of continuous pink noise for rain ambience
  private createRainNoiseBuffer(ctx: AudioContext): AudioBuffer {
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
      data[i] = pink * 0.05;
    }

    return buffer;
  }

  // Synthesize individual raindrop impact ping
  private triggerRaindropPing() {
    if (!this.ctx || !this.isPlaying || this.ctx.state !== "running") return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const dropFilter = this.ctx.createBiquadFilter();

      const freq = 1400 + Math.random() * 2200;
      const dropVol = (0.01 + Math.random() * 0.035) * (this.volume / 0.35);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.025);

      dropFilter.type = "bandpass";
      dropFilter.frequency.value = freq;
      dropFilter.Q.value = 3;

      dropGain.gain.setValueAtTime(dropVol, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(dropFilter);
      dropFilter.connect(dropGain);
      dropGain.connect(this.gainNode || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // Synthesize realistic distant rolling thunder rumble
  public triggerThunder() {
    if (!this.ctx || !this.isPlaying || this.ctx.state !== "running") return;

    try {
      const now = this.ctx.currentTime;
      const thunderGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Lowpass filter for deep sub-bass thunder rumble (40Hz - 90Hz)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.exponentialRampToValueAtTime(35, now + 2.4);

      // Create noise buffer for thunder body
      const bufferSize = this.ctx.sampleRate * 2.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const thunderSource = this.ctx.createBufferSource();
      thunderSource.buffer = buffer;

      const thunderVol = (0.08 + Math.random() * 0.12) * (this.volume / 0.35);

      // Soft envelope (crack -> rolling reverberation)
      thunderGain.gain.setValueAtTime(0.001, now);
      thunderGain.gain.exponentialRampToValueAtTime(thunderVol, now + 0.06);
      thunderGain.gain.exponentialRampToValueAtTime(thunderVol * 0.6, now + 0.4);
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      thunderSource.connect(filter);
      filter.connect(thunderGain);
      thunderGain.connect(this.gainNode || this.ctx.destination);

      thunderSource.start(now);

      // Dispatch custom event for visual lightning flash
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rain-thunder-strike"));
      }
    } catch {}
  }

  public start(initialVolume = 0.35) {
    if (this.isPlaying) return;
    this.volume = initialVolume;

    try {
      const ctx = this.initContext();
      this.isPlaying = true;

      // Master Rain Gain
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);

      // Lowpass filter simulates rain outside windows/roof
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(1000, ctx.currentTime);

      // Continuous Pink Noise Buffer Source
      const noiseBuffer = this.createRainNoiseBuffer(ctx);
      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      // Connect nodes
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      this.noiseNode.start(0);

      // Trigger periodic organic raindrop pings
      this.dropTimer = setInterval(() => {
        if (Math.random() > 0.3) {
          this.triggerRaindropPing();
        }
      }, 90);

      // Trigger random distant rolling thunder every 14 - 24 seconds
      const scheduleThunder = () => {
        if (!this.isPlaying) return;
        const delay = 14000 + Math.random() * 10000;
        this.thunderTimer = setTimeout(() => {
          if (this.isPlaying) {
            this.triggerThunder();
            scheduleThunder();
          }
        }, delay) as unknown as ReturnType<typeof setInterval>;
      };

      // Initial quick thunder strike after 4 seconds
      setTimeout(() => {
        if (this.isPlaying) {
          this.triggerThunder();
          scheduleThunder();
        }
      }, 4000);
    } catch {
      this.isPlaying = false;
    }
  }

  public stop() {
    if (!this.isPlaying) return;

    if (this.dropTimer) {
      clearInterval(this.dropTimer);
      this.dropTimer = null;
    }

    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer as unknown as ReturnType<typeof setTimeout>);
      this.thunderTimer = null;
    }

    if (this.gainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        setTimeout(() => {
          this.noiseNode?.stop();
          this.noiseNode?.disconnect();
          this.noiseNode = null;
          this.filterNode?.disconnect();
          this.filterNode = null;
          this.gainNode?.disconnect();
          this.gainNode = null;
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
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const rainSynth = new RainSynthesizer();
