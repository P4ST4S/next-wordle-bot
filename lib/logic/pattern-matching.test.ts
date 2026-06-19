import { describe, it, expect } from 'vitest';
import {
  computePattern,
  decodePattern,
  isWinningPattern,
  countCorrectPositions,
} from './pattern-matching';

/**
 * Helper: encode a [0,1,2] array into a base-3 pattern number (same convention
 * as computePattern: position 0 is the least significant digit).
 */
function encode(values: number[]): number {
  let pattern = 0;
  let multiplier = 1;
  for (const v of values) {
    pattern += v * multiplier;
    multiplier *= 3;
  }
  return pattern;
}

describe('computePattern', () => {
  it('returns all-green (242) when guess equals actual', () => {
    expect(computePattern('audio', 'audio')).toBe(242);
    expect(isWinningPattern(computePattern('audio', 'audio'))).toBe(true);
  });

  it('returns all-gray (0) when no letters match', () => {
    expect(computePattern('fghjk', 'aaaaa')).toBe(0);
  });

  it('marks a present (yellow) letter in the wrong position', () => {
    // guess "rxxxx" vs actual "xxxxr":
    // pos1..3 'x'==='x' -> green. pos0 'r' matches the leftover 'r' (at actual
    // pos4) -> yellow; pos4 'x' matches the leftover 'x' (at actual pos0) -> yellow.
    expect(computePattern('rxxxx', 'xxxxr')).toBe(encode([1, 2, 2, 2, 1]));
  });

  it('prioritizes green over yellow for a duplicate letter', () => {
    // guess "allee" vs actual "apple": the first 'l' is green, second 'l' gray
    // a(green) l(green) l(gray) e(yellow) e(green)
    // actual: a p p l e
    // pos0 a==a green; pos1 l!=p; pos2 l!=p; pos3 e!=l; pos4 e==e green
    // remaining actual letters after greens: p,p,l
    // pos1 l -> present (l in remaining) yellow; pos2 l -> remaining l consumed -> gray
    // pos3 e -> e already consumed by green at pos4 -> gray
    expect(computePattern('allee', 'apple')).toBe(encode([2, 1, 0, 0, 2]));
  });

  it('does not over-allocate yellows once occurrences are consumed by greens', () => {
    // guess "eevee" vs actual "level" (l e v e l): the two 'e' (pos1, pos3) are
    // both exact matches -> green. No 'e' remains, so the guess's other 'e's
    // (pos0, pos4) are gray.
    expect(computePattern('eevee', 'level')).toBe(encode([0, 2, 2, 2, 0]));
  });

  it('throws on non-5-letter input', () => {
    expect(() => computePattern('abc', 'audio')).toThrow();
    expect(() => computePattern('audio', 'abcdef')).toThrow();
  });
});

describe('decodePattern', () => {
  it('is the inverse of the base-3 encoding', () => {
    for (const values of [
      [0, 0, 0, 0, 0],
      [2, 2, 2, 2, 2],
      [2, 1, 0, 0, 2],
      [1, 0, 2, 1, 0],
    ]) {
      expect(decodePattern(encode(values))).toEqual(values);
    }
  });
});

describe('countCorrectPositions', () => {
  it('counts the green positions', () => {
    expect(countCorrectPositions(encode([2, 1, 0, 2, 0]))).toBe(2);
    expect(countCorrectPositions(242)).toBe(5);
    expect(countCorrectPositions(0)).toBe(0);
  });
});
