
class AudioService {
  private music: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private isStarted: boolean = false;
  
  // High-quality Mystery Trap theme
  private musicUrl: string = 'https://cdn.pixabay.com/audio/2024/02/08/audio_824599988a.mp3';

  constructor() {
    this.isMusicMuted = localStorage.getItem('game_music_muted') === 'true';
    this.isSfxMuted = localStorage.getItem('game_sfx_muted') === 'true';
  }

  private async initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Unlocks audio on first user interaction.
   * This is crucial for modern browsers.
   */
  async unlock() {
    if (this.isStarted) return;
    await this.initContext();
    await this.playMusic();
    this.isStarted = true;
    console.debug("Audio System Unlocked");
  }

  toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    localStorage.setItem('game_music_muted', String(this.isMusicMuted));
    if (this.music) {
      this.music.muted = this.isMusicMuted;
      if (!this.isMusicMuted) this.music.play().catch(() => {});
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

  async playMusic() {
    if (this.music) {
      if (!this.isMusicMuted && this.music.paused) {
        this.music.play().catch(() => {});
      }
      return;
    }
    
    this.music = new Audio(this.musicUrl);
    this.music.loop = true;
    this.music.volume = 0.3;
    this.music.muted = this.isMusicMuted;
    this.music.crossOrigin = "anonymous";
    
    try {
      await this.music.play();
    } catch (e) {
      console.debug("Music autoplay blocked. Waiting for interaction.");
    }
  }

  async playSfx(type: 'click' | 'success' | 'danger' | 'pop' | 'reveal' | 'vote') {
    if (this.isSfxMuted) return;
    await this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;

    switch(type) {
      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      case 'vote':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'reveal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(783, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'danger':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }
}

export const audioService = new AudioService();
