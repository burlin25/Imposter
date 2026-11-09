
class AudioService {
  private music: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private isStarted: boolean = false;
  
  // High-quality chill mystery theme
  private musicUrl: string = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c352c1bdc2.mp3'; // Lofi chill track
  private lobbyMusicUrl: string = 'https://cdn.pixabay.com/audio/2022/01/21/audio_31743c589f.mp3'; // More upbeat lobby track

  private currentMusic: HTMLAudioElement | null = null;

  constructor() {
    this.isMusicMuted = localStorage.getItem('game_music_muted') === 'true';
    this.isSfxMuted = localStorage.getItem('game_sfx_muted') === 'true';
  }

  private async initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.75;
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 20;
      this.compressor.ratio.value = 8;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async unlock() {
    if (this.isStarted) return;
    await this.initContext();
    await this.playMusic('lobby');
    this.isStarted = true;
    console.debug("Audio System Unlocked");
  }

  toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    localStorage.setItem('game_music_muted', String(this.isMusicMuted));
    if (this.currentMusic) {
      this.currentMusic.muted = this.isMusicMuted;
      if (!this.isMusicMuted) this.currentMusic.play().catch(() => {});
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

  async playMusic(type: 'lobby' | 'game' = 'game') {
    const url = type === 'lobby' ? this.lobbyMusicUrl : this.musicUrl;
    
    if (this.currentMusic) {
      if (this.currentMusic.src === url) {
        if (!this.isMusicMuted && this.currentMusic.paused) {
          this.currentMusic.play().catch(() => {});
        }
        return;
      }
      // Fade out current music
      const oldMusic = this.currentMusic;
      let vol = oldMusic.volume;
      const fadeOut = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          clearInterval(fadeOut);
          oldMusic.pause();
        } else {
          oldMusic.volume = vol;
        }
      }, 50);
    }
    
    this.currentMusic = new Audio(url);
    this.currentMusic.loop = true;
    this.currentMusic.volume = 0.2;
    this.currentMusic.muted = this.isMusicMuted;
    this.currentMusic.crossOrigin = "anonymous";
    
    console.debug(`Attempting to play music: ${type} (${url})`);
    
    try {
      await this.currentMusic.play();
      console.debug("Music playback started successfully");
    } catch (e) {
      console.warn("Music playback failed or was blocked:", e);
    }
  }

  private playTone(
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    endFrequency = frequency,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.015, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private playNoise(start: number, duration: number, volume: number, filterFrequency: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferLength = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
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
    source.stop(start + duration + 0.02);
  }

  async playSfx(type: 'click' | 'success' | 'danger' | 'pop' | 'reveal' | 'vote' | 'transition' | 'join' | 'countdown' | 'win') {
    if (this.isSfxMuted) return;
    await this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch(type) {
      case 'click':
        this.playTone(1500, now, 0.025, 0.045, 'square', 650);
        this.playTone(2200, now + 0.012, 0.035, 0.02, 'sine', 1400);
        break;
      case 'pop':
        this.playTone(320, now, 0.09, 0.08, 'sine', 900);
        this.playNoise(now, 0.045, 0.025, 2600);
        break;
      case 'vote':
        this.playTone(340, now, 0.18, 0.07, 'triangle', 90);
        this.playTone(680, now + 0.04, 0.12, 0.035, 'sine', 180);
        break;
      case 'reveal':
        this.playTone(80, now, 1.1, 0.09, 'sawtooth', 42);
        this.playTone(220, now + 0.18, 0.9, 0.06, 'sine', 880);
        this.playTone(330, now + 0.22, 0.75, 0.035, 'sine', 1320);
        this.playNoise(now, 0.7, 0.018, 1800);
        break;
      case 'success':
        [523, 659, 784, 1047].forEach((frequency, index) => {
          this.playTone(frequency, now + index * 0.07, 0.42, 0.055, 'sine');
        });
        break;
      case 'danger':
        this.playTone(130, now, 0.42, 0.075, 'sawtooth', 55);
        this.playTone(92, now + 0.18, 0.4, 0.055, 'square', 42);
        this.playNoise(now, 0.3, 0.022, 900);
        break;
      case 'transition':
        this.playTone(180, now, 0.55, 0.065, 'sine', 720);
        this.playTone(360, now + 0.08, 0.48, 0.035, 'triangle', 1440);
        break;
      case 'join':
        this.playTone(392, now, 0.12, 0.05, 'sine');
        this.playTone(659, now + 0.1, 0.22, 0.06, 'sine');
        break;
      case 'countdown':
        this.playTone(880, now, 0.08, 0.055, 'square');
        break;
      case 'win':
        [392, 494, 587, 784, 988].forEach((frequency, index) => {
          this.playTone(frequency, now + index * 0.09, 0.5, 0.06, 'sine');
        });
        break;
    }
  }
}

export const audioService = new AudioService();
