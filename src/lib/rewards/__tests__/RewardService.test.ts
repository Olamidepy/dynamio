import { describe, it, expect } from 'vitest';
import { RewardService } from '../RewardService';
import { GameTelemetry, LevelConfig } from '../../../game/types';
import { LEVELS } from '../../../game/data/levels';

describe('RewardService & Anti-Cheat', () => {
  const sampleLevel: LevelConfig = LEVELS[0];

  const validTelemetry: GameTelemetry = {
    startTime: 1000,
    endTime: 25000,
    durationMs: 24000,
    shotsFired: 15,
    shotsHit: 13,
    matchesMade: 5,
    cascadeCombos: 2,
    highestCombo: 3,
    score: 3600,
    accuracy: 87,
    levelId: 1,
    won: true,
  };

  it('validates a legitimate game session', () => {
    const result = RewardService.validateSession(validTelemetry, sampleLevel);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects an impossible speedrun duration (< 3.5s)', () => {
    const cheated = { ...validTelemetry, durationMs: 1200 };
    const result = RewardService.validateSession(cheated, sampleLevel);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Suspiciously fast');
  });

  it('rejects sessions with zero shots fired', () => {
    const cheated = { ...validTelemetry, shotsFired: 0 };
    const result = RewardService.validateSession(cheated, sampleLevel);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('zero shots');
  });

  it('rejects combo values exceeding level balls', () => {
    const cheated = { ...validTelemetry, highestCombo: 999 };
    const result = RewardService.validateSession(cheated, sampleLevel);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Combo value exceeds');
  });

  it('generates valid claim ticket and enforces single-use consumption', () => {
    const ticket = RewardService.generateClaimTicket(validTelemetry, sampleLevel);
    expect(ticket.isValid).toBe(true);
    expect(ticket.nimReward).toBeGreaterThan(0);
    expect(ticket.energyReward).toBeGreaterThan(0);

    // First consumption succeeds
    const firstConsume = RewardService.consumeTicket(ticket.ticketId);
    expect(firstConsume).toBe(true);

    // Replay attempt fails
    const replayAttempt = RewardService.consumeTicket(ticket.ticketId);
    expect(replayAttempt).toBe(false);
  });
});
