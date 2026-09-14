import { describe, it, expect } from 'vitest';
import { MatchSystem } from '../MatchSystem';
import { Ball } from '../../entities/Ball';

describe('MatchSystem', () => {
  function createTestBalls(colors: ('ruby' | 'sapphire' | 'amber')[]): Ball[] {
    return colors.map((color, i) => {
      const b = new Ball(`test_${i}`, color, i * 1.1);
      return b;
    });
  }

  it('detects a standard match-3 of contiguous same color', () => {
    // ruby, sapphire, sapphire, sapphire, ruby
    const balls = createTestBalls(['ruby', 'sapphire', 'sapphire', 'sapphire', 'ruby']);
    const match = MatchSystem.checkMatchAtIndex(balls, 2);

    expect(match.isMatch).toBe(true);
    expect(match.matchingBalls.length).toBe(3);
    expect(match.color).toBe('sapphire');
    expect(match.startIndex).toBe(1);
    expect(match.endIndex).toBe(3);
  });

  it('detects 4-in-a-row match', () => {
    const balls = createTestBalls(['amber', 'amber', 'amber', 'amber', 'ruby']);
    const match = MatchSystem.checkMatchAtIndex(balls, 0);

    expect(match.isMatch).toBe(true);
    expect(match.matchingBalls.length).toBe(4);
    expect(match.color).toBe('amber');
  });

  it('does NOT match 2 contiguous balls', () => {
    const balls = createTestBalls(['ruby', 'ruby', 'sapphire', 'amber']);
    const match = MatchSystem.checkMatchAtIndex(balls, 0);

    expect(match.isMatch).toBe(false);
    expect(match.matchingBalls.length).toBe(0);
  });

  it('does NOT match across a physical gap (> 1.4 units)', () => {
    const b1 = new Ball('b1', 'ruby', 0);
    const b2 = new Ball('b2', 'ruby', 1.1);
    const b3 = new Ball('b3', 'ruby', 4.0); // Large gap!

    const balls = [b1, b2, b3];
    const match = MatchSystem.checkMatchAtIndex(balls, 0);

    expect(match.isMatch).toBe(false);
  });

  it('findAllMatches identifies all matching clusters in chain', () => {
    // [ruby, ruby, ruby, sapphire, amber, amber, amber]
    const balls = createTestBalls(['ruby', 'ruby', 'ruby', 'sapphire', 'amber', 'amber', 'amber']);
    const matches = MatchSystem.findAllMatches(balls);

    expect(matches.length).toBe(2);
    expect(matches[0].color).toBe('ruby');
    expect(matches[1].color).toBe('amber');
  });
});
