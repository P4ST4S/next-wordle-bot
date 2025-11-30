/**
 * Pattern Matching System for Wordle
 *
 * Every Wordle guess produces one of 243 possible feedback patterns (3^5 combinations):
 * - 0 = absent (gray)
 * - 1 = present (yellow)
 * - 2 = correct (green)
 *
 * Encoding: Base-3 number system
 * Example: "GREEN GRAY YELLOW GRAY GREEN" = [2,0,1,0,2]
 * Pattern number = 2×1 + 0×3 + 1×9 + 0×27 + 2×81 = 171
 */

import type { Pattern } from '../types';

/**
 * Compute the pattern (0-242) that results from guessing 'guess' when the actual word is 'actual'
 *
 * Algorithm: Two-pass approach to handle duplicate letters correctly
 * 1. First pass: Mark all correct positions (green)
 * 2. Second pass: Mark present letters (yellow) using remaining letter counts
 *
 * @param guess - The guessed word (5 letters)
 * @param actual - The actual answer (5 letters)
 * @returns Pattern number (0-242)
 *
 * @example
 * computePattern('audio', 'audio') // Returns 242 (all green = 22222 in base-3)
 * computePattern('slate', 'crate') // Returns pattern for one green, one yellow, three gray
 */
export function computePattern(guess: string, actual: string): Pattern {
  if (guess.length !== 5 || actual.length !== 5) {
    throw new Error('Both guess and actual must be 5 letters');
  }

  const guessLower = guess.toLowerCase();
  const actualLower = actual.toLowerCase();

  // Track which letters in 'actual' have been matched
  const actualLetters = actualLower.split('');
  const result = [0, 0, 0, 0, 0];

  // First pass: Mark correct positions (green)
  for (let i = 0; i < 5; i++) {
    if (guessLower[i] === actualLower[i]) {
      result[i] = 2; // correct (green)
      actualLetters[i] = ''; // Mark as used
    }
  }

  // Second pass: Mark present letters (yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 0) { // Not already marked as correct
      const idx = actualLetters.indexOf(guessLower[i]);
      if (idx !== -1) {
        result[i] = 1; // present (yellow)
        actualLetters[idx] = ''; // Mark as used
      }
      // else: remains 0 (absent/gray)
    }
  }

  // Encode to pattern number (base-3)
  let pattern = 0;
  let multiplier = 1;
  for (let i = 0; i < 5; i++) {
    pattern += result[i] * multiplier;
    multiplier *= 3;
  }

  return pattern;
}

/**
 * Decode a pattern number back to its base-3 representation
 *
 * @param pattern - Pattern number (0-242)
 * @returns Array of 5 values [0, 1, or 2]
 *
 * @example
 * decodePattern(242) // Returns [2, 2, 2, 2, 2] (all green)
 * decodePattern(0) // Returns [0, 0, 0, 0, 0] (all gray)
 */
export function decodePattern(pattern: Pattern): number[] {
  const result = [];
  let remaining = pattern;

  for (let i = 0; i < 5; i++) {
    result.push(remaining % 3);
    remaining = Math.floor(remaining / 3);
  }

  return result;
}

/**
 * Convert a pattern to a human-readable string
 *
 * @param pattern - Pattern number (0-242)
 * @returns String representation (e.g., "🟩⬜🟨⬜🟩")
 */
export function patternToString(pattern: Pattern): string {
  const decoded = decodePattern(pattern);
  const symbols = ['⬜', '🟨', '🟩']; // gray, yellow, green
  return decoded.map(val => symbols[val]).join('');
}

/**
 * Check if a pattern represents a winning guess (all green)
 *
 * @param pattern - Pattern number (0-242)
 * @returns True if all positions are correct
 */
export function isWinningPattern(pattern: Pattern): boolean {
  return pattern === 242; // 22222 in base-3 = 2×(1+3+9+27+81) = 242
}

/**
 * Count how many green (correct) positions in a pattern
 *
 * @param pattern - Pattern number (0-242)
 * @returns Number of correct positions (0-5)
 */
export function countCorrectPositions(pattern: Pattern): number {
  const decoded = decodePattern(pattern);
  return decoded.filter(val => val === 2).length;
}
