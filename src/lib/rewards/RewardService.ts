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
   * Calculates eligible rewards based on player skill and level tier
   */
  public static calculateRewards(telemetry: GameTelemetry, level: LevelConfig): { nimReward: number; energyReward: number } {
    // Multipliers
    const accuracyMult = 0.8 + (telemetry.accuracy / 100) * 0.4; // 0.8x to 1.2x
    const comboMult = 1.0 + Math.min(telemetry.highestCombo - 1, 6) * 0.15; // up to ~1.9x
    const winBonus = telemetry.won ? 1.0 : 0.25; // 25% if lost, 100% if won

    const rawNim = level.baseRewardNim * accuracyMult * comboMult * winBonus;
    const nimReward = Number(rawNim.toFixed(3));

    const rawEnergy = level.baseRewardEnergy * accuracyMult * comboMult * winBonus;
    const energyReward = Math.round(rawEnergy);

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
