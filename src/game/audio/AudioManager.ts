export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.6;

  // Background Music (mountain.mp3)
  private bgm: HTMLAudioElement | null = null;
  private bgmMode: 'menu' | 'game' = 'menu';
  private readonly MENU_BGM_VOL = 0.24; // Subtle, atmospheric, not too loud
  private readonly GAME_BGM_VOL = 0.10; // Ducked down during active gameplay
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
    const base = this.bgmMode === 'game' ? this.GAME_BGM_VOL : this.MENU_BGM_VOL;
    return Math.max(0, Math.min(1, base * (this.masterVolume / 0.6)));
  }

  /**
   * Set BGM mode:
   * - 'menu': Normal subtle background music volume
   * - 'game': Slightly reduced volume so active game sounds and ball hits shine
   */
  public setBgmMode(mode: 'menu' | 'game') {
    this.bgmMode = mode;
    this.fadeBgmTo(this.getTargetBgmVolume(), 400);
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

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
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

    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Satisfying physical impact sound when ball hits or targets a sphere on the chain.
   * Features a crisp mechanical marble click layered with a resonant sphere body thump.
   */
  public playHit(isTargetedMatch: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Layer 1: Crisp high-transient click/clack (physical contact)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(950, now);
    clickOsc.frequency.exponentialRampToValueAtTime(260, now + 0.04);

    clickGain.gain.setValueAtTime(this.masterVolume * 0.55, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.04);

    // Layer 2: Resonant hollow sphere body thud
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(340, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(85, now + 0.1);

    bodyGain.gain.setValueAtTime(this.masterVolume * 0.45, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.1);

    // Layer 3: If adjacent color matches (targeted hit), add an energetic harmonic ping
    if (isTargetedMatch) {
      const pingOsc = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      pingOsc.type = 'sine';
      pingOsc.frequency.setValueAtTime(580, now);
      pingOsc.frequency.exponentialRampToValueAtTime(880, now + 0.14);

      pingGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      pingOsc.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      pingOsc.start(now);
      pingOsc.stop(now + 0.14);
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

      gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
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

      gain.gain.setValueAtTime(this.masterVolume * 0.4, startTime);
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

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}
