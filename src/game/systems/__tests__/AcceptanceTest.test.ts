import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BallChain, ChainSegment } from '../../entities/BallChain';
import { SplinePath } from '../../path/SplinePath';
import { MatchSystem } from '../MatchSystem';
import { SphereColor } from '../../types';

describe('Zuma Acceptance Test (Prompt Specification Item 31)', () => {
  const testCurvePoints: [number, number, number][] = [
    [0, 0, 0],
    [5, 0, 5],
    [10, 0, 10],
    [15, 0, 15],
    [20, 0, 20],
    [25, 0, 25],
    [30, 0, 30],
  ];

  function createChainWithColors(colors: SphereColor[]): { chain: BallChain; path: SplinePath } {
    const path = new SplinePath(testCurvePoints);
    const chain = new BallChain(path);
    chain.clear();

    const seg = new ChainSegment();
    seg.headDistance = 1.0 + (colors.length - 1) * chain.ballDiameter;

    for (let i = 0; i < colors.length; i++) {
      const b = chain.acquireBall(colors[i], 1.0 + i * chain.ballDiameter);
      b.state = 'ROLLING';
      seg.balls.push(b);
    }

    seg.updateBallDistances(chain.ballDiameter);
    chain.segments = [seg];
    chain.syncFlattenedBalls();

    return { chain, path };
  }

  it('runs exact scenario: 🔴 🔴 🔵 🔵 🟢 🟢 + shoot 🔴 -> 🔴 🔴 🔴 disappears -> 🔵 🔵 🟢 🟢 collapse and continue', () => {
    // Colors: ruby (🔴), sapphire (🔵), emerald (🟢)
    const initialColors: SphereColor[] = ['ruby', 'ruby', 'sapphire', 'sapphire', 'emerald', 'emerald'];
    const { chain, path } = createChainWithColors(initialColors);

    expect(chain.balls.length).toBe(6);
    expect(chain.balls.map((b) => b.color)).toEqual(['ruby', 'ruby', 'sapphire', 'sapphire', 'emerald', 'emerald']);

    // Shoot 🔴 into the red group
    // Red group is at tail (index 0 and 1, distance ~ 1.0 and 2.1)
    const hitPosition = path.getPointAtDistance(chain.balls[1].pathDistance + 0.2);
    const { insertedIndex, ball: insertedBall } = chain.insertBall('ruby', hitPosition);

    // Verify insertion preserves order and increases count to 7
    expect(chain.balls.length).toBe(7);
    expect(insertedBall.color).toBe('ruby');

    // The chain is now 🔴 🔴 🔴 🔵 🔵 🟢 🟢
    const colorsAfterInsert = chain.balls.map((b) => b.color);
    expect(colorsAfterInsert).toEqual(['ruby', 'ruby', 'ruby', 'sapphire', 'sapphire', 'emerald', 'emerald']);

    // Check Match-3 at inserted index
    const match = MatchSystem.checkMatchAtIndex(chain.balls, insertedIndex);
    expect(match.isMatch).toBe(true);
    expect(match.matchingBalls.length).toBe(3);
    expect(match.color).toBe('ruby');

    // Remove matching balls (🔴 🔴 🔴)
    chain.removeBalls(match.matchingBalls);

    // Result must become: 🔵 🔵 🟢 🟢
    const remainingColors = chain.balls.map((b) => b.color);
    expect(remainingColors).toEqual(['sapphire', 'sapphire', 'emerald', 'emerald']);
    expect(chain.balls.length).toBe(4);

    // Update chain forward motion along spline
    const updateResult = chain.update(0.016, 2.0);
    expect(updateResult.reachedEnd).toBe(false);

    // Verify balls are still path-constrained and spaced consistently by ballDiameter
    for (let i = 1; i < chain.balls.length; i++) {
      const diff = chain.balls[i].pathDistance - chain.balls[i - 1].pathDistance;
      expect(Math.abs(diff - chain.ballDiameter)).toBeLessThan(0.05);
    }
  });

  it('runs cascade chain reaction test: 🔵 🔵 🔴 🔴 🔴 🔵 -> destroy 🔴 🔴 🔴 -> gap closes -> 🔵 🔵 🔵 explodes', () => {
    const initialColors: SphereColor[] = ['sapphire', 'sapphire', 'ruby', 'ruby', 'ruby', 'sapphire'];
    const { chain } = createChainWithColors(initialColors);

    expect(chain.balls.length).toBe(6);

    // Match the 3 red balls at index 2
    const match = MatchSystem.checkMatchAtIndex(chain.balls, 2);
    expect(match.isMatch).toBe(true);
    expect(match.matchingBalls.length).toBe(3);
    expect(match.color).toBe('ruby');

    // Remove red balls
    chain.removeBalls(match.matchingBalls);

    // Now chain has 2 segments: [sapphire, sapphire] and [sapphire]
    expect(chain.segments.length).toBe(2);
    expect(chain.balls.length).toBe(3);

    let cascadeTriggered = false;
    chain.onCascadeMatch = (matchingBalls) => {
      cascadeTriggered = true;
      expect(matchingBalls.length).toBe(3);
      expect(matchingBalls[0].color).toBe('sapphire');
    };

    // Run update steps with dt to let magnetic pull close the gap
    for (let step = 0; step < 30; step++) {
      chain.update(0.05, 1.0);
      if (chain.segments.length === 1) break;
    }

    // Gap should have closed and triggered cascade match
    expect(chain.segments.length).toBe(1);
    expect(cascadeTriggered).toBe(true);
  });

  it('maintains strict equidistant spacing within contiguous segments', () => {
    const { chain } = createChainWithColors(['amber', 'amber', 'emerald', 'sapphire', 'ruby']);

    chain.update(0.1, 3.0);

    for (let i = 1; i < chain.balls.length; i++) {
      const spacing = chain.balls[i].pathDistance - chain.balls[i - 1].pathDistance;
      expect(Math.abs(spacing - chain.ballDiameter)).toBeLessThan(0.001);
    }
  });

  it('moves backward on hit (recoil knockback), but advances forward when missed', () => {
    const { chain, path } = createChainWithColors(['amber', 'ruby', 'emerald', 'sapphire']);
    const initialHead = chain.getHead()!.pathDistance;

    // 1. Missed shot (no hit) -> Chain advances forward normally
    chain.update(0.1, 2.0);
    const forwardHead = chain.getHead()!.pathDistance;
    expect(forwardHead).toBeGreaterThan(initialHead);

    // 2. Ball hits the chain -> Trailing balls and chain move BACKWARD
    const hitPoint = path.getPointAtDistance(chain.balls[1].pathDistance + 0.1);
    chain.insertBall('amber', hitPoint);

    // Chain should have negative knockback velocity pushing it backward
    expect(chain.knockbackVelocity).toBeLessThan(0);

    // Update with dt to let knockback roll chain backward
    chain.update(0.05, 2.0);
    expect(chain.knockbackVelocity).toBeLessThanOrEqual(0);
  });

  it('ensures the severed cut segment rolls backward down the track to meet the rear segment at the back', () => {
    // 2 rear balls (amber), 3 middle balls (ruby), 2 front balls (sapphire)
    const initialColors: SphereColor[] = ['amber', 'amber', 'ruby', 'ruby', 'ruby', 'sapphire', 'sapphire'];
    const { chain } = createChainWithColors(initialColors);

    // Destroy the 3 ruby balls in the middle
    const match = MatchSystem.checkMatchAtIndex(chain.balls, 2);
    expect(match.isMatch).toBe(true);
    chain.removeBalls(match.matchingBalls);

    expect(chain.segments.length).toBe(2);
    const rearSeg = chain.segments[0];
    const frontCut = chain.segments[1];

    const initialCutHeadDist = frontCut.headDistance;

    // Small update step (dt = 0.02s) with baseSpeed = 0.5
    chain.update(0.02, 0.5);

    // The front cut must have moved BACKWARD along the track towards the rear segment
    expect(frontCut.headDistance).toBeLessThan(initialCutHeadDist);
  });
});

