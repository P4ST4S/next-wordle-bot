/**
 * Game constants and pre-computed values for the Wordle Solver
 */

import type { WordSuggestion } from './types';

/**
 * Game configuration
 */
export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const PATTERN_COUNT = 243; // 3^5 possible feedback patterns

/**
 * Pre-computed optimal opening moves
 * These are calculated based on Shannon Entropy across the full POSSIBLE_ANSWERS list
 * Hard-coding these provides instant TTI (Time to Interactive) since the calculation
 * would otherwise require millions of comparisons
 */
export const OPTIMAL_OPENERS: readonly WordSuggestion[] = [
  { word: 'soare', entropy: 5.885, remainingWords: 61 },
  { word: 'raise', entropy: 5.878, remainingWords: 61 },
  { word: 'slate', entropy: 5.868, remainingWords: 62 },
  { word: 'trace', entropy: 5.851, remainingWords: 63 },
  { word: 'crate', entropy: 5.843, remainingWords: 64 },
  { word: 'irate', entropy: 5.821, remainingWords: 65 },
  { word: 'stare', entropy: 5.819, remainingWords: 65 },
  { word: 'arose', entropy: 5.799, remainingWords: 67 },
  { word: 'snare', entropy: 5.794, remainingWords: 67 },
  { word: 'arise', entropy: 5.792, remainingWords: 68 },
] as const;

/**
 * Clue colors for UI display
 */
export const CLUE_COLORS = {
  correct: 'bg-green-600 text-white border-green-600',
  present: 'bg-yellow-500 text-white border-yellow-500',
  absent: 'bg-gray-400 text-white border-gray-400',
  empty: 'bg-white border-gray-300 text-gray-800',
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_TARGETS = {
  maxCalculationTime: 2000, // 2 seconds
  progressReportInterval: 100, // Report progress every N words
  maxCandidates: 2000, // Limit candidates to optimize calculation time
  topAllowedGuesses: 100, // Include top N from ALLOWED_GUESSES for entropy calculation
} as const;
