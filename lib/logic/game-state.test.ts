import { describe, it, expect } from 'vitest';
import {
  isGameWon,
  getRemainingAttempts,
  shouldShowOptimalOpeners,
  validateGuess,
} from './game-state';
import { createGuessResult } from './word-filtering';
import { MAX_GUESSES } from '../constants';
import type { GuessResult } from '../types';

const allGreen = (word: string): GuessResult =>
  createGuessResult(word, ['correct', 'correct', 'correct', 'correct', 'correct']);
const allGray = (word: string): GuessResult =>
  createGuessResult(word, ['absent', 'absent', 'absent', 'absent', 'absent']);

describe('isGameWon', () => {
  it('is false with no guesses', () => {
    expect(isGameWon([])).toBe(false);
  });

  it('is true only when the last guess is all green', () => {
    expect(isGameWon([allGray('crane')])).toBe(false);
    expect(isGameWon([allGray('crane'), allGreen('slate')])).toBe(true);
  });
});

describe('getRemainingAttempts', () => {
  it('counts down from MAX_GUESSES and never goes negative', () => {
    expect(getRemainingAttempts([])).toBe(MAX_GUESSES);
    expect(getRemainingAttempts([allGray('crane')])).toBe(MAX_GUESSES - 1);
    const overflow = Array.from({ length: MAX_GUESSES + 2 }, () => allGray('crane'));
    expect(getRemainingAttempts(overflow)).toBe(0);
  });
});

describe('shouldShowOptimalOpeners', () => {
  it('is true only before the first guess', () => {
    expect(shouldShowOptimalOpeners([])).toBe(true);
    expect(shouldShowOptimalOpeners([allGray('crane')])).toBe(false);
  });
});

describe('validateGuess', () => {
  const dict = ['crane', 'slate', 'trace'];

  it('accepts a valid, unused, 5-letter dictionary word', () => {
    expect(validateGuess('crane', [], dict, false)).toEqual({ valid: true });
  });

  it('rejects when the game is already complete', () => {
    expect(validateGuess('crane', [], dict, true)).toEqual({
      valid: false,
      error: 'Game is already complete',
    });
  });

  it('rejects words that are not exactly 5 letters', () => {
    expect(validateGuess('cat', [], dict, false).valid).toBe(false);
  });

  it('rejects words outside the dictionary', () => {
    expect(validateGuess('zzzzz', [], dict, false)).toEqual({
      valid: false,
      error: 'Word not in dictionary',
    });
  });

  it('rejects a word that was already guessed', () => {
    expect(validateGuess('crane', [allGray('crane')], dict, false)).toEqual({
      valid: false,
      error: 'Word already guessed',
    });
  });

  it('rejects once the maximum number of guesses is reached', () => {
    const maxed = Array.from({ length: MAX_GUESSES }, () => allGray('slate'));
    expect(validateGuess('trace', maxed, dict, false)).toEqual({
      valid: false,
      error: 'Maximum guesses reached',
    });
  });
});
