import { LevelConfig, GameTelemetry } from '../types';

export class ScoreSystem {
  public currentScore: number = 0;
  public currentCombo: number = 1;
  public highestCombo: number = 1;
  public totalMatches: number = 0;
  public cascadeReactions: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public startTime: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.currentScore = 0;
    this.currentCombo = 1;
    this.highestCombo = 1;
    this.totalMatches = 0;
    this.cascadeReactions = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.startTime = performance.now();
  }

  public registerShot() {
    this.shotsFired++;
  }

  public registerHit(isSameColorAdjacent: boolean = false): number {
    this.shotsHit++;
    const points = isSameColorAdjacent ? 150 : 50;
    this.currentScore += points;
    return points;
  }

  /**
   * Called when a match occurs.
   * isCascade: true if triggered by gap collapse rather than direct projectile impact!
   */
  public addMatch(ballCount: number, isCascade: boolean): { pointsAdded: number; comboMultiplier: number } {
    if (isCascade) {
      this.currentCombo++;
      this.cascadeReactions++;
      if (this.currentCombo > this.highestCombo) {
        this.highestCombo = this.currentCombo;
      }
    } else {
      this.currentCombo = 1;
    }

    this.totalMatches++;

    // Base score: 100 per ball, plus bonus for 4+ balls
    let base = ballCount * 100;
    if (ballCount > 3) {
      base += (ballCount - 3) * 150;
    }

    const pointsAdded = base * this.currentCombo;
    this.currentScore += pointsAdded;

    return { pointsAdded, comboMultiplier: this.currentCombo };
  }

  public getAccuracy(): number {
    if (this.shotsFired === 0) return 100;
    return Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100));
  }

  public getTelemetry(level: LevelConfig, won: boolean): GameTelemetry {
    const durationMs = Math.round(performance.now() - this.startTime);
    return {
      startTime: this.startTime,
      durationMs,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      matchesMade: this.totalMatches,
      cascadeCombos: this.cascadeReactions,
      highestCombo: this.highestCombo,
      score: this.currentScore,
      accuracy: this.getAccuracy(),
      levelId: level.id,
      won,
    };
  }
}
