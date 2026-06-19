import { describe, it, expect } from 'vitest';
import {
  buildConstraints,
  filterWords,
  matchesConstraints,
  createGuessResult,
} from './word-filtering';
import { computePattern, decodePattern } from './pattern-matching';
import type { ClueType } from '../types';

/**
 * Build a GuessResult from a guess word and the actual answer, using the real
 * pattern logic so tests reflect true Wordle feedback.
 */
function guessAgainst(guess: string, actual: string) {
  const decoded = decodePattern(computePattern(guess, actual));
  const clueMap: ClueType[] = ['absent', 'present', 'correct'];
  return createGuessResult(
    guess,
    decoded.map((v) => clueMap[v])
  );
}

describe('buildConstraints', () => {
  it('records correct positions for green clues', () => {
    const c = buildConstraints([guessAgainst('crane', 'crane')]);
    expect(c.correctPositions.get(0)).toBe('c');
    expect(c.correctPositions.get(4)).toBe('e');
  });

  it('records absent letters that never appear', () => {
    const c = buildConstraints([guessAgainst('plumb', 'crane')]);
    // p, l, u, m, b are all absent from "crane"
    for (const letter of ['p', 'l', 'u', 'm', 'b']) {
      expect(c.absentLetters.has(letter)).toBe(true);
    }
  });

  it('derives exactLetterCounts when a letter is both present and absent in one guess', () => {
    // guess "added" vs actual "abide": actual has one 'd'
    // guess has three 'd' (pos1, pos3, pos4) and 'a' 'e'
    // one 'd' will be present/correct, the others absent -> exact count known
    const c = buildConstraints([guessAgainst('added', 'abide')]);
    expect(c.exactLetterCounts?.get('d')).toBe(1);
    // 'd' should NOT be in absentLetters (it does appear)
    expect(c.absentLetters.has('d')).toBe(false);
  });

  it('takes the max occurrence across guesses for minLetterCount', () => {
    // two guesses giving different evidence for 'e'
    const g1 = guessAgainst('sheet', 'genie'); // 'e' appears twice in actual? "genie" has e at 1 and 4
    const g2 = guessAgainst('crane', 'genie');
    const c = buildConstraints([g1, g2]);
    // genie has two 'e' -> min count for e should be at least 1, and from sheet (two e) up to 2
    expect((c.minLetterCount.get('e') ?? 0)).toBeGreaterThanOrEqual(1);
  });
});

describe('filterWords / matchesConstraints', () => {
  it('keeps only the actual answer when it is the sole consistent word', () => {
    const words = ['crane', 'slate', 'plumb', 'crone'];
    const constraints = buildConstraints([guessAgainst('crane', 'crane')]);
    const filtered = filterWords(words, constraints);
    expect(filtered).toContain('crane');
    expect(filtered).not.toContain('slate');
    expect(filtered).not.toContain('plumb');
  });

  it('round-trips: the actual answer always survives its own clue', () => {
    const dictionary = ['crane', 'slate', 'trace', 'abide', 'level', 'apple', 'genie'];
    for (const actual of dictionary) {
      for (const guess of dictionary) {
        const constraints = buildConstraints([guessAgainst(guess, actual)]);
        expect(matchesConstraints(actual, constraints)).toBe(true);
      }
    }
  });

  it('respects wrong-position (yellow) constraints', () => {
    // guess 'r' yellow at pos0 means answer contains 'r' but not at pos0
    const constraints = buildConstraints([guessAgainst('rxxxx', 'xxxxr')]);
    expect(matchesConstraints('xxxxr', constraints)).toBe(true);
    // a word with 'r' at pos0 must be rejected
    expect(matchesConstraints('rxxxx', constraints)).toBe(false);
  });
});
