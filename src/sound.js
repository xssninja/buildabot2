// 8-bit Retro Audio Synthesizer using native Web Audio API (Zero external assets needed)
class SoundEngine {
  constructor() {
    this.ctx = null;
    const hasStorage = typeof localStorage !== 'undefined';
    this.muted = hasStorage ? (localStorage.getItem('buildabot_muted') === 'true') : false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('buildabot_muted', this.muted);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playBeep(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.05) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context error handling
    }
  }

  // Click / Select part
  playSelect() {
    this.playBeep(587.33, 'triangle', 0.06, 0.08); // D5
    setTimeout(() => this.playBeep(880, 'sine', 0.08, 0.06), 40); // A5
  }

  // Swap / Randomize
  playReroll() {
    const freqs = [330, 440, 554, 659];
    freqs.forEach((f, idx) => {
      setTimeout(() => this.playBeep(f, 'square', 0.04, 0.03), idx * 35);
    });
  }

  // Cute robot purr / chirp
  playPurr() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore audio errors
    }
  }

  // Compile / Success Fanfare
  playSuccess() {
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    melody.forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'sine', 0.18, 0.09), idx * 80);
    });
  }
}

export const sound = new SoundEngine();
