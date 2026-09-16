import { SfxType } from '../types/arcade';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ambientSoundEnabled: boolean = true;
  private isDashboard: boolean = false;
  private ambientRunning: boolean = false;
  private autoResumeAttached: boolean = false;

  // Ambient Audio Nodes
  private ambientMasterGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private humLfo: OscillatorNode | null = null;
  private humLfoGain: GainNode | null = null;

  private fanSource: AudioBufferSourceNode | null = null;
  private fanFilter: BiquadFilterNode | null = null;
  private fanGain: GainNode | null = null;

  private ambientTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for tab visibility changes to pause/resume ambient
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAmbientAudio();
        } else if (this.isDashboard && this.ambientSoundEnabled && this.soundEnabled) {
          this.resumeAmbientAudio();
        }
      });
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.pauseAmbientAudio();
    } else if (this.isDashboard && this.ambientSoundEnabled) {
      this.startAmbientArcade();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setAmbientSoundEnabled(enabled: boolean) {
    this.ambientSoundEnabled = enabled;
    if (!enabled) {
      this.pauseAmbientAudio();
    } else if (this.isDashboard && this.soundEnabled) {
      this.startAmbientArcade();
    }
  }

  public isAmbientEnabled(): boolean {
    return this.ambientSoundEnabled;
  }

  public isAmbientPlaying(): boolean {
    return this.ambientRunning;
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.ensureAutoResume();
    return this.ctx;
  }

  private ensureAutoResume() {
    if (this.autoResumeAttached || typeof window === 'undefined') return;
    this.autoResumeAttached = true;

    const resumeHandler = () => {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            if (this.isDashboard && this.ambientSoundEnabled && this.soundEnabled && !this.ambientRunning) {
              this.buildAndStartAmbientNodes();
            }
          }).catch(() => {});
        } else if (this.isDashboard && this.ambientSoundEnabled && this.soundEnabled && !this.ambientRunning) {
          this.buildAndStartAmbientNodes();
        }
      }
    };

    window.addEventListener('pointerdown', resumeHandler, { passive: true });
    window.addEventListener('keydown', resumeHandler, { passive: true });
    window.addEventListener('touchstart', resumeHandler, { passive: true });
  }

  /**
   * Set whether the user is on the dashboard vs playing in an active cabinet.
   * Plays faint cabinet hums and coin machine jingles when active.
   */
  public setDashboardMode(isDashboard: boolean) {
    this.isDashboard = isDashboard;
    if (isDashboard) {
      this.startAmbientArcade();
    } else {
      this.stopAmbientArcade();
    }
  }

  /**
   * Starts procedural ambient arcade noise: faint 60Hz transformer CRT hum,
   * cooling fan air wash, and periodic distant coin drops / attract chimes.
   */
  public startAmbientArcade() {
    this.isDashboard = true;
    if (!this.soundEnabled || !this.ambientSoundEnabled) return;
    if (this.ambientRunning) return;

    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      // Will auto-start upon first user interaction
      return;
    }

    this.buildAndStartAmbientNodes();
  }

  private buildAndStartAmbientNodes() {
    if (!this.ctx || this.ambientRunning) return;
    const ctx = this.ctx;

    try {
      this.ambientRunning = true;
      const now = ctx.currentTime;

      // 1. Master Ambient Gain with smooth fade-in
      this.ambientMasterGain = ctx.createGain();
      this.ambientMasterGain.gain.setValueAtTime(0.0001, now);
      // Gentle target gain (subtle room presence)
      this.ambientMasterGain.gain.exponentialRampToValueAtTime(0.24, now + 1.2);
      this.ambientMasterGain.connect(ctx.destination);

      // 2. Faint Cabinet Power Hum (60Hz CRT transformer mains resonance)
      this.humFilter = ctx.createBiquadFilter();
      this.humFilter.type = 'lowpass';
      this.humFilter.frequency.setValueAtTime(140, now);

      this.humGain = ctx.createGain();
      this.humGain.gain.setValueAtTime(0.032, now); // Faint analog hum

      this.humOsc1 = ctx.createOscillator();
      this.humOsc1.type = 'sine';
      this.humOsc1.frequency.setValueAtTime(59.9, now); // 60Hz mains hum with detune

      this.humOsc2 = ctx.createOscillator();
      this.humOsc2.type = 'sine';
      this.humOsc2.frequency.setValueAtTime(119.8, now); // 2nd harmonic

      // Organic low-frequency breathing LFO for filter cutoff
      this.humLfo = ctx.createOscillator();
      this.humLfo.frequency.setValueAtTime(0.12, now); // Slow 8.3s sweep
      this.humLfoGain = ctx.createGain();
      this.humLfoGain.gain.setValueAtTime(25, now);

      this.humLfo.connect(this.humLfoGain);
      this.humLfoGain.connect(this.humFilter.frequency);

      this.humOsc1.connect(this.humFilter);
      this.humOsc2.connect(this.humFilter);
      this.humFilter.connect(this.humGain);
      this.humGain.connect(this.ambientMasterGain);

      this.humOsc1.start(now);
      this.humOsc2.start(now);
      this.humLfo.start(now);

      // 3. Cabinet Cooling Fans / Room Air Flow (filtered brown noise loop)
      const bufferSize = Math.floor(ctx.sampleRate * 2.5);
      const fanBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = fanBuffer.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = lastVal * 0.94 + white * 0.06;
        data[i] = lastVal;
      }

      this.fanSource = ctx.createBufferSource();
      this.fanSource.buffer = fanBuffer;
      this.fanSource.loop = true;

      this.fanFilter = ctx.createBiquadFilter();
      this.fanFilter.type = 'bandpass';
      this.fanFilter.frequency.setValueAtTime(420, now);
      this.fanFilter.Q.setValueAtTime(0.8, now);

      this.fanGain = ctx.createGain();
      this.fanGain.gain.setValueAtTime(0.016, now); // Gentle white noise breeze

      this.fanSource.connect(this.fanFilter);
      this.fanFilter.connect(this.fanGain);
      this.fanGain.connect(this.ambientMasterGain);

      this.fanSource.start(now);

      // 4. Start periodic coin machine jingles & distant attract bleeps
      this.scheduleNextAmbientJingle();
    } catch {
      this.ambientRunning = false;
    }
  }

  /**
   * Schedules randomized distant arcade events:
   * - Metallic coin/token slot drop
   * - Token hopper payout clatter
   * - Faint attract-mode arpeggios from adjacent cabinets
   */
  private scheduleNextAmbientJingle() {
    if (this.ambientTimeoutId) {
      clearTimeout(this.ambientTimeoutId);
      this.ambientTimeoutId = null;
    }

    if (!this.ambientRunning || !this.soundEnabled || !this.ambientSoundEnabled) {
      return;
    }

    // Random interval between 5.5 and 12 seconds
    const delayMs = 5500 + Math.random() * 6500;
    this.ambientTimeoutId = setTimeout(() => {
      if (this.ambientRunning && this.ambientMasterGain && this.ctx) {
        this.triggerRandomAmbientEvent();
        this.scheduleNextAmbientJingle();
      }
    }, delayMs);
  }

  private triggerRandomAmbientEvent() {
    if (!this.ctx || !this.ambientMasterGain || !this.ambientRunning) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const roll = Math.random();

    try {
      if (roll < 0.42) {
        // 1. Coin Machine / Token Drop into metal slot
        this.synthesizeCoinSlotDrop(ctx, now);
      } else if (roll < 0.75) {
        // 2. Distant Arcade Cabinet Attract-Mode Chime
        this.synthesizeDistantAttractChime(ctx, now);
      } else {
        // 3. Token Dispenser / Coin Hopper Cascade
        this.synthesizeTokenHopperRattle(ctx, now);
      }
    } catch {
      // Ignore transient audio node errors
    }
  }

  /**
   * Synthesizes realistic dual-strike metallic token drop with hollow chassis resonance.
   */
  private synthesizeCoinSlotDrop(ctx: AudioContext, startTime: number) {
    if (!this.ambientMasterGain) return;

    // Strike 1 (brass coin edge hitting slot funnel)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2940 + (Math.random() * 200 - 100), startTime);
    gain1.gain.setValueAtTime(0.038, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);
    osc1.connect(gain1);
    gain1.connect(this.ambientMasterGain);
    osc1.start(startTime);
    osc1.stop(startTime + 0.07);

    // Strike 2 (second coin bounce 35ms later)
    const t2 = startTime + 0.035;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3480 + (Math.random() * 200 - 100), t2);
    gain2.gain.setValueAtTime(0.032, t2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.06);
    osc2.connect(gain2);
    gain2.connect(this.ambientMasterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.06);

    // Metallic chassis thud (resonance inside coin door)
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(210, t2);
    thud.frequency.exponentialRampToValueAtTime(80, t2 + 0.05);
    thudGain.gain.setValueAtTime(0.025, t2);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.05);
    thud.connect(thudGain);
    thudGain.connect(this.ambientMasterGain);
    thud.start(t2);
    thud.stop(t2 + 0.05);
  }

  /**
   * Synthesizes faint 8-bit pentatonic attract-mode arpeggios as if heard across the arcade hall.
   */
  private synthesizeDistantAttractChime(ctx: AudioContext, startTime: number) {
    if (!this.ambientMasterGain) return;

    // Distant mellow bandpass filter (makes it sound like a cabinet 20ft away)
    const distanceFilter = ctx.createBiquadFilter();
    distanceFilter.type = 'bandpass';
    distanceFilter.frequency.setValueAtTime(950, startTime);
    distanceFilter.Q.setValueAtTime(1.2, startTime);
    distanceFilter.connect(this.ambientMasterGain);

    const motifs = [
      [523.25, 659.25, 783.99, 1046.50], // C-E-G-C ascending
      [880.0, 783.99, 659.25, 523.25],   // A-G-E-C descending
      [587.33, 880.0, 1174.66],          // D-A-D fanfare
      [659.25, 783.99, 987.77, 1318.51], // E-G-B-E crystal
    ];

    const chosen = motifs[Math.floor(Math.random() * motifs.length)];
    const noteDuration = 0.07;

    chosen.forEach((freq, i) => {
      const t = startTime + i * noteDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.016, t); // Very faint background presence
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration * 1.2);

      osc.connect(gain);
      gain.connect(distanceFilter);

      osc.start(t);
      osc.stop(t + noteDuration * 1.2);
    });
  }

  /**
   * Synthesizes 3-4 rapid token clinks like a coin changer dropping brass credits.
   */
  private synthesizeTokenHopperRattle(ctx: AudioContext, startTime: number) {
    if (!this.ambientMasterGain) return;

    const clinkCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < clinkCount; i++) {
      const t = startTime + i * (0.05 + Math.random() * 0.03);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 2600 + Math.random() * 900;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.024, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.ambientMasterGain);

      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  private pauseAmbientAudio() {
    this.stopAmbientArcade();
  }

  private resumeAmbientAudio() {
    if (this.isDashboard && this.ambientSoundEnabled && this.soundEnabled) {
      this.startAmbientArcade();
    }
  }

  /**
   * Stops ambient arcade noise with a smooth fade-out.
   */
  public stopAmbientArcade() {
    if (this.ambientTimeoutId) {
      clearTimeout(this.ambientTimeoutId);
      this.ambientTimeoutId = null;
    }

    if (!this.ambientRunning && !this.ambientMasterGain) {
      this.ambientRunning = false;
      return;
    }

    this.ambientRunning = false;

    if (this.ctx && this.ambientMasterGain) {
      try {
        const now = this.ctx.currentTime;
        this.ambientMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

        const hum1 = this.humOsc1;
        const hum2 = this.humOsc2;
        const lfo = this.humLfo;
        const fan = this.fanSource;
        const master = this.ambientMasterGain;

        setTimeout(() => {
          try {
            hum1?.stop();
            hum1?.disconnect();
            hum2?.stop();
            hum2?.disconnect();
            lfo?.stop();
            lfo?.disconnect();
            fan?.stop();
            fan?.disconnect();
            master?.disconnect();
          } catch {
            // Ignore already stopped node errors
          }
        }, 400);
      } catch {
        // Ignore ramp errors
      }
    }

    this.humOsc1 = null;
    this.humOsc2 = null;
    this.humLfo = null;
    this.humLfoGain = null;
    this.humFilter = null;
    this.humGain = null;
    this.fanSource = null;
    this.fanFilter = null;
    this.fanGain = null;
    this.ambientMasterGain = null;
  }

  public play(type: SfxType) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (type) {
        case 'coin': {
          // Explicit arcade coin deposit (Insert Coin sound)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(2800, now);
          gain1.gain.setValueAtTime(0.16, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(3400, now + 0.04);
          gain2.gain.setValueAtTime(0.14, now + 0.04);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.04);
          osc2.stop(now + 0.18);
          break;
        }

        case 'ambient_chime': {
          this.synthesizeDistantAttractChime(ctx, now);
          break;
        }

        case 'select': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(880, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'start': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
          osc.frequency.setValueAtTime(392.0, now + 0.16); // G4
          osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
        }

        case 'point': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'jump': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }

        case 'laser': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'hit': {
          // Noise burst
          const bufferSize = ctx.sampleRate * 0.12;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.linearRampToValueAtTime(100, now + 0.12);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start(now);
          break;
        }

        case 'gameover': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(250, now + 0.18);
          osc.frequency.linearRampToValueAtTime(180, now + 0.36);
          osc.frequency.linearRampToValueAtTime(90, now + 0.6);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
          break;
        }

        case 'level': {
          const notes = [440, 554.37, 659.25, 880];
          notes.forEach((freq, idx) => {
            const noteOsc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            const t = now + idx * 0.08;
            noteOsc.type = 'triangle';
            noteOsc.frequency.setValueAtTime(freq, t);
            noteGain.gain.setValueAtTime(0.12, t);
            noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            noteOsc.connect(noteGain);
            noteGain.connect(ctx.destination);
            noteOsc.start(t);
            noteOsc.stop(t + 0.14);
          });
          break;
        }

        case 'clear': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.07);
          osc.frequency.setValueAtTime(783.99, now + 0.14);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
          break;
        }

        case 'pause': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(330, now + 0.08);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'fanfare': {
          const melody = [
            { f: 261.63, d: 0.09 }, // C4
            { f: 329.63, d: 0.09 }, // E4
            { f: 392.0, d: 0.09 },  // G4
            { f: 523.25, d: 0.12 }, // C5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.35 }, // G5 (sustained)
          ];
          let offset = 0;
          melody.forEach((note) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + offset;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, t);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + note.d);
            offset += note.d * 0.85;
          });
          break;
        }
      }
    } catch {
      // Ignore audio glitches if context was blocked
    }
  }
}

export const soundManager = new SoundSynthesizer();
