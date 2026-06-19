import { describe, it, expect } from 'vitest';
import { computePattern } from './pattern-matching';
import { scoreGuess } from './entropy-calculation';

/**
 * Cross-check: the encoded entropy path must group remaining words by exactly
 * the same patterns as the reference computePattern. We verify indirectly by
 * checking entropy/expectedRemaining against a hand-rolled reference.
 */
function referenceScore(guess: string, remaining: string[]) {
  const counts = new Map<number, number>();
  for (const actual of remaining) {
    const p = computePattern(guess, actual);
    counts.set(p, (counts.get(p) || 0) + 1);
  }
  const n = remaining.length;
  let entropy = 0;
  let expectedRemaining = 0;
  for (const c of counts.values()) {
    const prob = c / n;
    entropy += prob * Math.log2(1 / prob);
    expectedRemaining += prob * c;
  }
  return { entropy, expectedRemaining };
}

describe('scoreGuess (encoded) matches the reference', () => {
  const remaining = [
    'jazzy', 'fuzzy', 'dizzy', 'mummy', 'level',
    'apple', 'crane', 'slate', 'abbey', 'every',
  ];

  it('produces identical entropy and expectedRemaining for tricky guesses', () => {
    for (const guess of ['jazzy', 'fuzzy', 'mummy', 'crane', 'eerie']) {
      const ref = referenceScore(guess, remaining);
      const got = scoreGuess(guess, remaining);
      expect(got.entropy).toBeCloseTo(ref.entropy, 10);
      expect(got.expectedRemaining).toBeCloseTo(ref.expectedRemaining, 10);
    }
  });
});
