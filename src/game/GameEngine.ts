import * as THREE from 'three';
import { SceneManager } from './rendering/SceneManager';
import { SplinePath } from './path/SplinePath';
import { BallChain } from './entities/BallChain';
import { Shooter } from './entities/Shooter';
import { ShootingSystem } from './systems/ShootingSystem';
import { MatchSystem } from './systems/MatchSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { AudioManager } from './audio/AudioManager';
import { Ball } from './entities/Ball';
import { StateMachine } from './GameState';
import { GameState, LevelConfig, SphereColor } from './types';
import { LEVELS } from './data/levels';

export interface HUDUpdateData {
  score: number;
  combo: number;
  remainingBalls: number;
  totalBalls: number;
  levelName: string;
  levelId: number;
  targetScore: number;
  currentBallColor: SphereColor;
  nextBallColor: SphereColor;
  progressPercent: number;
}

export type HUDCallback = (data: HUDUpdateData) => void;

export class GameEngine {
  public sceneManager: SceneManager;
  public splinePath: SplinePath | null = null;
  public ballChain: BallChain | null = null;
  public shooter: Shooter;
  public shootingSystem: ShootingSystem;
  public particleSystem: ParticleSystem;
  public scoreSystem: ScoreSystem;
  public audioManager: AudioManager;
  public stateMachine: StateMachine;

  public currentLevel: LevelConfig = LEVELS[0];
  private currentTrackMesh: THREE.Group | null = null;

  // Spawning timer
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.38;

  // Animation frame
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // React callbacks
  private onHUDUpdate: HUDCallback | null = null;

  // Canvas element
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.sceneManager = new SceneManager(canvas);
    this.shooter = new Shooter();
    this.sceneManager.scene.add(this.shooter.group);

    this.shootingSystem = new ShootingSystem(this.sceneManager.scene);
    this.particleSystem = new ParticleSystem();
    this.sceneManager.scene.add(this.particleSystem.group);

    this.scoreSystem = new ScoreSystem();
    this.audioManager = AudioManager.getInstance();
    this.stateMachine = new StateMachine('TITLE');

    this.setupInputs();
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public setHUDCallback(cb: HUDCallback) {
    this.onHUDUpdate = cb;
  }

  public loadLevel(level: LevelConfig) {
    this.currentLevel = level;

    // 1. Clean up existing track & chain
    if (this.currentTrackMesh) {
      this.sceneManager.scene.remove(this.currentTrackMesh);
    }
    if (this.ballChain) {
      this.sceneManager.scene.remove(this.ballChain.sceneGroup);
      this.ballChain.clear();
    }

    // 2. Initialize new spline path & 3D track
    this.splinePath = new SplinePath(level.curvePoints);
    this.currentTrackMesh = this.splinePath.createTrackMesh();
    this.sceneManager.scene.add(this.currentTrackMesh);

    // 3. Initialize new ball chain with starting train
    this.ballChain = new BallChain(this.splinePath);
    this.ballChain.maxBallsToSpawn = level.totalBalls;
    this.ballChain.populateInitialChain(Math.min(18, level.totalBalls), level.colorPool);
    this.ballChain.onCascadeMatch = (matchingBalls: Ball[]) => {
      this.handleMatch(matchingBalls, true);
    };
    this.sceneManager.scene.add(this.ballChain.sceneGroup);

    // 4. Configure shooter
    this.shooter.setAvailableColors(level.colorPool);
    this.shooter.resetAmmo();

    // 5. Reset systems
    this.shootingSystem.clear();
    this.particleSystem.clear();
    this.scoreSystem.reset();
    this.spawnTimer = 0;

    this.emitHUD();
  }

  public prepareGame(level: LevelConfig) {
    this.loadLevel(level);
    this.stateMachine.setState('LOADING');
  }

  public readyCountdown() {
    this.stateMachine.setState('READY');
  }

  public start() {
    this.stateMachine.setState('PLAYING');
    this.lastTime = performance.now();
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  public pause() {
    if (this.stateMachine.getState() === 'PLAYING') {
      this.stateMachine.setState('PAUSED');
    }
  }

  public resume() {
    if (this.stateMachine.getState() === 'PAUSED') {
      this.stateMachine.setState('PLAYING');
      this.lastTime = performance.now();
    }
  }

  public restart() {
    this.loadLevel(this.currentLevel);
    this.start();
  }

  private gameLoop = (currentTime: number) => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.1); // clamp against tab switching lag

    const state = this.stateMachine.getState();

    if (state === 'PLAYING') {
      this.update(dt);
    } else if (state === 'READY') {
      // 3D world is ready, countdown is active, turret follows player aim, chain waiting
      this.shooter.update(dt);
      this.particleSystem.update(dt);
    } else if ((state === 'TITLE' || state === 'BOOT' || state === 'LOADING') && this.ballChain) {
      // Continuously roll balls in demo mode so scene is ALWAYS moving and vibrant
      this.ballChain.isSpawningFinished = false;
      this.ballChain.totalSpawned = 0;
      this.ballChain.feedTailBall(this.currentLevel.colorPool);
      const { reachedEnd } = this.ballChain.update(dt, 1.8);
      if (reachedEnd) {
        this.ballChain.populateInitialChain(Math.min(22, this.currentLevel.totalBalls), this.currentLevel.colorPool);
      }
      this.shooter.update(dt);
    }

    // Always render 3D scene & ambient camera/particles
    this.sceneManager.render(dt);
  };

  private update(dt: number) {
    if (!this.splinePath || !this.ballChain) return;

    // 1. Update Shooter
    this.shooter.update(dt);

    // 2. Continuously feed new balls into the chain until totalBalls is reached
    if (!this.ballChain.isSpawningFinished) {
      this.ballChain.feedTailBall(this.currentLevel.colorPool);
    }

    // 3. Move chain & check game over (reached endpoint)
    const { reachedEnd } = this.ballChain.update(dt, this.currentLevel.speed);
    if (reachedEnd) {
      this.triggerGameOver();
      return;
    }

    // 4. Update Projectiles & Check Collisions
    const hitResult = this.shootingSystem.update(dt, this.ballChain);
    if (hitResult) {
      const idx = hitResult.insertedIndex;
      const bColor = hitResult.insertedBall.color;
      const balls = this.ballChain.balls;
      const isSameColorAdjacent =
        (idx > 0 && balls[idx - 1].color === bColor) ||
        (idx < balls.length - 1 && balls[idx + 1].color === bColor);

      this.scoreSystem.registerHit(isSameColorAdjacent);
      this.audioManager.playHit(isSameColorAdjacent);

      // Check match-3 at insertion point
      const match = MatchSystem.checkMatchAtIndex(
        this.ballChain.balls,
        hitResult.insertedIndex
      );

      if (match.isMatch) {
        this.handleMatch(match.matchingBalls, false);
      }
    }

    // 5. Update visual particles
    this.particleSystem.update(dt);

    // 6. Check WIN condition
    if (
      this.ballChain.isSpawningFinished &&
      this.ballChain.balls.length === 0 &&
      this.shootingSystem.projectiles.length === 0
    ) {
      this.triggerLevelComplete();
      return;
    }

    // 7. Update HUD periodically
    this.emitHUD();
  }

  private handleMatch(ballsToRemove: any[], isCascade: boolean) {
    if (!this.ballChain) return;
    const count = ballsToRemove.length;
    const color = ballsToRemove[0].color;

    // 1. Remove balls & get 3D centers
    const centers = this.ballChain.removeBalls(ballsToRemove);

    // 2. Emit explosive particles
    centers.forEach((center) => {
      this.particleSystem.emitExplosion(center, color, 14);
    });

    // 3. Audio & Score
    const { comboMultiplier } = this.scoreSystem.addMatch(count, isCascade);
    this.audioManager.playMatch(comboMultiplier);

    // 4. Camera shake
    this.sceneManager.cameraManager.triggerShake(0.18 + Math.min(comboMultiplier * 0.05, 0.4));
  }

  private triggerGameOver() {
    this.stateMachine.setState('GAME_OVER');
    this.audioManager.playGameOver();
    this.emitHUD();
  }

  private triggerLevelComplete() {
    this.stateMachine.setState('LEVEL_COMPLETE');
    this.audioManager.playLevelWin();
    this.emitHUD();
  }

  public fireCurrentBall(): boolean {
    if (this.stateMachine.getState() !== 'PLAYING') return false;
    if (!this.shooter.canShoot()) return false;

    const color = this.shooter.consumeBall();
    const origin = this.shooter.getFireOrigin();
    const direction = this.shooter.aimDirection;

    this.shootingSystem.fire(origin, direction, color);
    this.scoreSystem.registerShot();
    this.audioManager.playShoot();
    this.emitHUD();
    return true;
  }

  public swapBall(): boolean {
    if (this.stateMachine.getState() !== 'PLAYING') return false;
    const swapped = this.shooter.swapBalls();
    if (swapped) {
      this.audioManager.playSwap();
      this.emitHUD();
    }
    return swapped;
  }

  private emitHUD() {
    if (!this.onHUDUpdate || !this.ballChain) return;

    const remaining = this.ballChain.balls.length + (this.ballChain.maxBallsToSpawn - this.ballChain.totalSpawned);
    const progress = Math.min(100, Math.round(((this.currentLevel.totalBalls - remaining) / this.currentLevel.totalBalls) * 100));

    this.onHUDUpdate({
      score: this.scoreSystem.currentScore,
      combo: this.scoreSystem.currentCombo,
      remainingBalls: remaining,
      totalBalls: this.currentLevel.totalBalls,
      levelName: this.currentLevel.name,
      levelId: this.currentLevel.id,
      targetScore: this.currentLevel.targetScore,
      currentBallColor: this.shooter.currentBallColor,
      nextBallColor: this.shooter.nextBallColor,
      progressPercent: Math.max(0, progress),
    });
  }

  private setupInputs() {
    // Mouse move -> aim
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const targetPoint = this.sceneManager.getAimIntersection(normX, normY);
      this.shooter.updateAim(targetPoint);
    });

    // Mouse click -> shoot
    this.canvas.addEventListener('click', (e) => {
      if (e.button === 0) {
        this.fireCurrentBall();
      }
    });

    // Right click -> swap
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.swapBall();
    });

    // Keyboard controls: Space to swap
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.swapBall();
      }
    });

    // Touch controls
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = this.canvas.getBoundingClientRect();
          const normX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
          const normY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
          const targetPoint = this.sceneManager.getAimIntersection(normX, normY);
          this.shooter.updateAim(targetPoint);
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener('touchend', (e) => {
      // Tap/release to shoot
      if (e.changedTouches.length > 0) {
        this.fireCurrentBall();
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
      const height = this.canvas.parentElement?.clientHeight || window.innerHeight;
      this.sceneManager.resize(width, height);
    });
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.sceneManager.dispose();
  }
}
