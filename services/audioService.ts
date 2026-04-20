
class AudioService {
  private music: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
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

  async playSfx(type: 'click' | 'success' | 'danger' | 'pop' | 'reveal' | 'vote' | 'transition') {
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
      case 'transition':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  }
}

export const audioService = new AudioService();
