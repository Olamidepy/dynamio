import { Ball } from '../entities/Ball';
import { SphereColor } from '../types';

export interface MatchResult {
  isMatch: boolean;
  matchingBalls: Ball[];
  color: SphereColor | null;
  startIndex: number;
  endIndex: number;
}

export class MatchSystem {
  /**
   * Checks if the ball at insertedIndex is part of a 3+ contiguous run of the same color
   */
  public static checkMatchAtIndex(balls: Ball[], targetIndex: number): MatchResult {
    if (balls.length < 3 || targetIndex < 0 || targetIndex >= balls.length) {
      return {
        isMatch: false,
        matchingBalls: [],
        color: null,
        startIndex: -1,
        endIndex: -1,
      };
    }

    const targetColor = balls[targetIndex].color;
    let start = targetIndex;
    let end = targetIndex;

    // Scan backward along the chain for same color
    while (start > 0 && balls[start - 1].color === targetColor) {
      // Also ensure distance between balls is approximately contiguous (within 1.3 units)
      const dist = Math.abs(balls[start].pathDistance - balls[start - 1].pathDistance);
      if (dist > 1.4) break; // Gap exists, cannot match across gap
      start--;
    }

    // Scan forward along the chain for same color
    while (end < balls.length - 1 && balls[end + 1].color === targetColor) {
      const dist = Math.abs(balls[end + 1].pathDistance - balls[end].pathDistance);
      if (dist > 1.4) break;
      end++;
    }

    const count = end - start + 1;
    if (count >= 3) {
      const matching = balls.slice(start, end + 1);
      return {
        isMatch: true,
        matchingBalls: matching,
        color: targetColor,
        startIndex: start,
        endIndex: end,
      };
    }

    return {
      isMatch: false,
      matchingBalls: [],
      color: null,
      startIndex: -1,
      endIndex: -1,
    };
  }

  /**
   * Evaluates all contiguous clusters in the chain to find any 3+ matches (useful after gap collapse)
   */
  public static findAllMatches(balls: Ball[]): MatchResult[] {
    const results: MatchResult[] = [];
    if (balls.length < 3) return results;

    let i = 0;
    while (i < balls.length) {
      const match = this.checkMatchAtIndex(balls, i);
      if (match.isMatch) {
        results.push(match);
        i = match.endIndex + 1;
      } else {
        i++;
      }
    }

    return results;
  }
}
