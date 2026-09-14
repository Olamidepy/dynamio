import { GameTelemetry, LevelConfig } from '../../game/types';

export interface ClaimTicket {
  ticketId: string;
  levelId: number;
  score: number;
  combo: number;
  accuracy: number;
  energyReward: number;
  nimReward: number;
  timestamp: number;
  isValid: boolean;
  validationError?: string;
  signature: string;
}

export class RewardService {
  private static processedTickets = new Set<string>();

  /**
   * Server-authoritative anti-cheat validation of game session telemetry
   */
  public static validateSession(telemetry: GameTelemetry, level: LevelConfig): { isValid: boolean; error?: string } {
    // 1. Duration check
    if (telemetry.durationMs < 3500) {
      return { isValid: false, error: 'Suspiciously fast level completion (duration under threshold).' };
    }

    // 2. Shot count check
    if (telemetry.shotsFired < 1) {
      return { isValid: false, error: 'Invalid gameplay: zero shots fired.' };
    }

    // 3. Accuracy check
    if (telemetry.accuracy < 0 || telemetry.accuracy > 100) {
      return { isValid: false, error: 'Accuracy value out of physical range.' };
    }

    // 4. Combo check
    if (telemetry.highestCombo > level.totalBalls) {
      return { isValid: false, error: 'Combo value exceeds total balls in level.' };
    }

    // 5. Score check: score must be at least minimum points per ball
    const minPossiblePoints = telemetry.matchesMade * 300;
    if (telemetry.score < minPossiblePoints && telemetry.score > 0) {
      return { isValid: false, error: 'Score calculation anomaly.' };
    }

    return { isValid: true };
  }

  /**
   * Calculates eligible rewards based on player Dyno Points and level tier.
   * Maximum win by level: Level 1 -> 1 NIM, Level 2 -> 2 NIM ... Level 7 -> 7 NIM.
   * On loss, Dyno Points still convert to partial NIM consolation.
   */
  public static calculateRewards(telemetry: GameTelemetry, level: LevelConfig): { nimReward: number; energyReward: number } {
    const maxLevelNim = Math.min(Math.max(level.id, 1), 7);
    const targetScore = level.targetScore || 2500;
    const scoreRatio = Math.min(Math.max(telemetry.score / targetScore, 0.05), 1.0);

    let nimReward: number;
    if (telemetry.won) {
      // WIN: Converted Dyno points up to maxLevelNim
      const rawNim = maxLevelNim * scoreRatio;
      nimReward = Number(Math.min(maxLevelNim, rawNim).toFixed(2));
    } else {
      // LOSE: Partial conversion of Dyno points so player effort is always rewarded
      const consolationNim = maxLevelNim * scoreRatio * 0.40;
      nimReward = Number(Math.max(0.05, Math.min(maxLevelNim * 0.5, consolationNim)).toFixed(2));
    }

    const energyReward = Math.round(telemetry.score * 0.1);
    return { nimReward, energyReward };
  }

  /**
   * Generates a cryptographic claim ticket for wallet claim
   */
  public static generateClaimTicket(telemetry: GameTelemetry, level: LevelConfig): ClaimTicket {
    const validation = this.validateSession(telemetry, level);
    const { nimReward, energyReward } = this.calculateRewards(telemetry, level);

    const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    // Mock HMAC signature
    const signature = 'sig_' + Math.abs((telemetry.score ^ timestamp ^ level.id)).toString(16);

    return {
      ticketId,
      levelId: level.id,
      score: telemetry.score,
      combo: telemetry.highestCombo,
      accuracy: telemetry.accuracy,
      energyReward,
      nimReward,
      timestamp,
      isValid: validation.isValid,
      validationError: validation.error,
      signature,
    };
  }

  /**
   * Verifies and marks a claim ticket as consumed (replay attack protection)
   */
  public static consumeTicket(ticketId: string): boolean {
    if (this.processedTickets.has(ticketId)) {
      return false; // Already consumed!
    }
    this.processedTickets.add(ticketId);
    return true;
  }
}
