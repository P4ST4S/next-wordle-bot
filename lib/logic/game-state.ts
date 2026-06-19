/**
 * Game State Helpers
 *
 * Pure functions over the list of guesses. Filtering / remaining-word logic
 * lives in `solver.ts` (run in the worker), not here.
 */

import type { GuessResult } from '../types';
import { MAX_GUESSES } from '../constants';

/**
 * Check if the game is won (last guess was all green).
 */
export function isGameWon(guesses: GuessResult[]): boolean {
  if (guesses.length === 0) return false;
  const lastGuess = guesses[guesses.length - 1];
  return lastGuess.clues.every((clue) => clue.clue === 'correct');
}

/**
 * Number of guesses still available.
 */
export function getRemainingAttempts(guesses: GuessResult[]): number {
  return Math.max(0, MAX_GUESSES - guesses.length);
}

/**
 * Whether to show pre-computed optimal openers (no guesses made yet).
 */
export function shouldShowOptimalOpeners(guesses: GuessResult[]): boolean {
  return guesses.length === 0;
}

/**
 * Validate a guess before adding it.
 *
 * @param word - The word being guessed
 * @param guesses - Guesses made so far
 * @param validWords - Set of all valid words
 * @param isComplete - Whether the game is already over
 */
export function validateGuess(
  word: string,
  guesses: GuessResult[],
  validWords: string[],
  isComplete: boolean
): { valid: boolean; error?: string } {
  if (isComplete) {
    return { valid: false, error: 'Game is already complete' };
  }

  if (word.length !== 5) {
    return { valid: false, error: 'Word must be exactly 5 letters' };
  }

  if (!validWords.includes(word.toLowerCase())) {
    return { valid: false, error: 'Word not in dictionary' };
  }

  if (guesses.some((g) => g.word === word.toLowerCase())) {
    return { valid: false, error: 'Word already guessed' };
  }

  if (guesses.length >= MAX_GUESSES) {
    return { valid: false, error: 'Maximum guesses reached' };
  }

  return { valid: true };
}
