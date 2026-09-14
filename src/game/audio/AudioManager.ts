export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;

  // Background Music (mountain.mp3)
  private bgm: HTMLAudioElement | null = null;
  private bgmMode: 'menu' | 'game' = 'menu';
  private readonly MENU_BGM_VOL = 0.08; // Soft and atmospheric for the menu
  private readonly GAME_BGM_VOL = 0.005; // Drastically reduced background bed during active gameplay
  private bgmInitialized: boolean = false;
  private fadeInterval: number | null = null;

  private constructor() {
    // Initialize background music and user interaction listeners
    this.initBgm();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Initializes mountain.mp3 background music with infinite repeating loop
   * and handles browser autoplay restrictions gracefully.
   */
  public initBgm() {
    if (this.bgmInitialized || typeof window === 'undefined') return;
    this.bgmInitialized = true;

    try {
      this.bgm = new Audio('/mountain.mp3');
      this.bgm.loop = true;
      this.bgm.preload = 'auto';
      this.bgm.volume = this.getTargetBgmVolume();

      // Attempt autoplay on page / app entry
      const playPromise = this.bgm.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy until user gesture
          const unlockAudio = () => {
            if (this.bgm && this.bgm.paused && !this.isMuted) {
              this.bgm.play().catch(() => {});
            }
            this.initCtx();
            ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
              window.removeEventListener(evt, unlockAudio);
            });
          };

          ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
            window.addEventListener(evt, unlockAudio, { passive: true });
          });
        });
      }
    } catch {
      // Handled for headless / unsupported environments
    }
  }

  private getTargetBgmVolume(): number {
    if (this.isMuted) return 0;
    return this.bgmMode === 'game' ? this.GAME_BGM_VOL : this.MENU_BGM_VOL;
  }

  /**
   * Set BGM mode:
   * - 'menu': Pleasant ambient background music (0.08)
   * - 'game': Drastically reduced background bed (0.005) so gameplay and targeted hit SFX stand out loudly
   */
  public setBgmMode(mode: 'menu' | 'game') {
    this.bgmMode = mode;
    this.fadeBgmTo(this.getTargetBgmVolume(), 150);
  }

  private fadeBgmTo(targetVolume: number, durationMs: number = 350) {
    if (!this.bgm) return;
    if (this.fadeInterval !== null) {
      window.clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const startVol = this.bgm.volume;
    const diff = targetVolume - startVol;
    if (Math.abs(diff) < 0.01) {
      this.bgm.volume = targetVolume;
      return;
    }

    const steps = 15;
    const stepTime = durationMs / steps;
    let stepCount = 0;

    this.fadeInterval = window.setInterval(() => {
      stepCount++;
      if (!this.bgm) {
        if (this.fadeInterval !== null) window.clearInterval(this.fadeInterval);
        return;
      }
      const newVol = Math.max(0, Math.min(1, startVol + diff * (stepCount / steps)));
      this.bgm.volume = newVol;

      if (stepCount >= steps) {
        if (this.fadeInterval !== null) window.clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.bgm.volume = targetVolume;
      }
    }, stepTime);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgm) {
      if (muted) {
        this.bgm.volume = 0;
      } else {
        this.bgm.volume = this.getTargetBgmVolume();
        if (this.bgm.paused) {
          this.bgm.play().catch(() => {});
        }
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.bgm && !this.isMuted) {
      this.bgm.volume = this.getTargetBgmVolume();
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Snappy laser chirp when shooting
   */
  public playShoot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Satisfying mechanical click when swapping balls
   */
  public playSwap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.30, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Loud, punchy physical impact sound when ball hits or targets a sphere on the chain.
   * Features a crisp mechanical marble impact, resonant sphere thump, and loud targeted harmonic ping.
   */
  public playHit(isTargetedMatch: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Layer 1: Loud, crisp high-transient click/clack (physical marble impact)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

    clickGain.gain.setValueAtTime(0.70, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // Layer 2: Resonant hollow sphere body thud (punchy tactile impact)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(420, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    bodyGain.gain.setValueAtTime(0.55, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.12);

    // Layer 3: If ball is targeted at matching color, trigger a loud energetic dual-harmonic ping
    if (isTargetedMatch) {
      // Primary chime tone (720Hz -> 1080Hz)
      const pingOsc1 = this.ctx.createOscillator();
      const pingGain1 = this.ctx.createGain();
      pingOsc1.type = 'sine';
      pingOsc1.frequency.setValueAtTime(720, now);
      pingOsc1.frequency.exponentialRampToValueAtTime(1080, now + 0.18);

      pingGain1.gain.setValueAtTime(0.75, now);
      pingGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      pingOsc1.connect(pingGain1);
      pingGain1.connect(this.ctx.destination);
      pingOsc1.start(now);
      pingOsc1.stop(now + 0.18);

      // Bright overtone harmonic (1440Hz -> 2160Hz)
      const pingOsc2 = this.ctx.createOscillator();
      const pingGain2 = this.ctx.createGain();
      pingOsc2.type = 'triangle';
      pingOsc2.frequency.setValueAtTime(1440, now);
      pingOsc2.frequency.exponentialRampToValueAtTime(2160, now + 0.14);

      pingGain2.gain.setValueAtTime(0.45, now);
      pingGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      pingOsc2.connect(pingGain2);
      pingGain2.connect(this.ctx.destination);
      pingOsc2.start(now);
      pingOsc2.stop(now + 0.14);
    }
  }

  /**
   * Musical bell chime chord that scales up in frequency with combo multiplier!
   */
  public playMatch(combo: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Musical scale: C5, D5, E5, G5, A5, C6, E6, G6
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1567.98];
    const baseFreq = pentatonic[Math.min(combo - 1, pentatonic.length - 1)];

    const now = this.ctx.currentTime;

    // Play 2 harmonic tones
    [1, 1.5].forEach((mult, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, now);

      gain.gain.setValueAtTime(this.masterVolume * 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  /**
   * Rewarding major arpeggio fanfare for clearing level
   */
  public playLevelWin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.masterVolume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * Dramatic drone for game over
   */
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

    gain.gain.setValueAtTime(this.masterVolume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}
