class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicType: 'lobby' | 'game' = 'lobby';
  private musicStep = 0;
  private isMusicMuted = false;
  private isSfxMuted = false;
  private isStarted = false;

  constructor() {
    this.isMusicMuted = localStorage.getItem('game_music_muted') === 'true';
    this.isSfxMuted = localStorage.getItem('game_sfx_muted') === 'true';
  }

  private async initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.82;
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.01;
      this.compressor.release.value = 0.3;
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  async unlock() {
    await this.initContext();
    if (!this.isStarted) {
      this.isStarted = true;
      await this.playMusic('lobby');
    }
  }

  toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    localStorage.setItem('game_music_muted', String(this.isMusicMuted));
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(this.isMusicMuted ? 0.0001 : 0.1, now, 0.08);
    } else if (!this.isMusicMuted && this.isStarted) {
      this.playMusic(this.musicType);
    }
    return this.isMusicMuted;
  }

  toggleSfxMute(): boolean {
    this.isSfxMuted = !this.isSfxMuted;
    localStorage.setItem('game_sfx_muted', String(this.isSfxMuted));
    return this.isSfxMuted;
  }

  getMusicMuted(): boolean { return this.isMusicMuted; }
  getSfxMuted(): boolean { return this.isSfxMuted; }

  private stopMusic() {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx) {
      const oldGain = this.musicGain;
      const now = this.ctx.currentTime;
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setTargetAtTime(0.0001, now, 0.12);
      window.setTimeout(() => oldGain.disconnect(), 600);
      this.musicGain = null;
    }
  }

  async playMusic(type: 'lobby' | 'game' = 'game') {
    await this.initContext();
    this.musicType = type;
    if (this.isMusicMuted || !this.ctx || !this.masterGain) return;
    if (this.musicGain) this.stopMusic();

    this.musicStep = 0;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(type === 'lobby' ? 0.11 : 0.08, this.ctx.currentTime + 0.8);
    this.musicGain.connect(this.masterGain);
    this.scheduleMusicBar();
  }

  private scheduleMusicBar() {
    if (!this.ctx || !this.musicGain || this.isMusicMuted) return;
    const now = this.ctx.currentTime + 0.04;
    const lobbyRoots = [220, 261.63, 293.66, 246.94];
    const gameRoots = [110, 123.47, 146.83, 98];
    const roots = this.musicType === 'lobby' ? lobbyRoots : gameRoots;
    const root = roots[this.musicStep % roots.length];
    const chord = [root, root * 1.25, root * 1.5];

    chord.forEach((frequency, index) => {
      this.playTone(frequency, now + index * 0.03, 2.05, 0.024, 'sine', frequency * 0.98, this.musicGain);
    });
    [root * 2, root * 2.5, root * 3, root * 2.5].forEach((frequency, index) => {
      this.playTone(frequency, now + 0.25 + index * 0.42, 0.22, 0.016, 'triangle', frequency * 0.92, this.musicGain);
    });

    this.musicStep += 1;
    this.musicTimer = window.setTimeout(() => this.scheduleMusicBar(), 1900);
  }

  private playTone(
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    endFrequency = frequency,
    destination: AudioNode | null = this.masterGain,
  ) {
    if (!this.ctx || !destination) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.025, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private playNoise(start: number, duration: number, volume: number, filterFrequency: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferLength = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  async playSfx(type: 'click' | 'success' | 'danger' | 'pop' | 'reveal' | 'vote' | 'transition' | 'join' | 'countdown' | 'win') {
    if (this.isSfxMuted) return;
    await this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (type) {
      case 'click':
        this.playTone(900, now, 0.045, 0.022, 'sine', 620);
        break;
      case 'pop':
        this.playTone(280, now, 0.11, 0.04, 'sine', 620);
        break;
      case 'vote':
        this.playTone(330, now, 0.2, 0.035, 'triangle', 110);
        this.playTone(660, now + 0.05, 0.13, 0.018, 'sine', 220);
        break;
      case 'reveal':
        this.playTone(90, now, 0.9, 0.05, 'sine', 48);
        this.playTone(220, now + 0.16, 0.75, 0.035, 'sine', 660);
        this.playNoise(now, 0.45, 0.008, 1200);
        break;
      case 'success':
        [523, 659, 784].forEach((frequency, index) => {
          this.playTone(frequency, now + index * 0.08, 0.35, 0.035, 'sine');
        });
        break;
      case 'danger':
        this.playTone(120, now, 0.36, 0.04, 'triangle', 65);
        this.playTone(90, now + 0.14, 0.28, 0.028, 'sine', 48);
        this.playNoise(now, 0.2, 0.008, 650);
        break;
      case 'transition':
        this.playTone(180, now, 0.5, 0.035, 'sine', 540);
        this.playTone(360, now + 0.08, 0.4, 0.018, 'triangle', 900);
        break;
      case 'join':
        this.playTone(392, now, 0.14, 0.03, 'sine');
        this.playTone(659, now + 0.1, 0.2, 0.04, 'sine');
        break;
      case 'countdown':
        this.playTone(660, now, 0.08, 0.03, 'sine');
        break;
      case 'win':
        [392, 494, 587, 784].forEach((frequency, index) => {
          this.playTone(frequency, now + index * 0.09, 0.42, 0.04, 'sine');
        });
        break;
    }
  }
}

export const audioService = new AudioService();
