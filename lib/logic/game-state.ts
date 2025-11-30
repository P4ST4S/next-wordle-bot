/**
 * Game State Management Helpers
 *
 * Pure functions for managing Wordle game state transitions
 */

import type { GameState, GuessResult } from '../types';
import { isWinningPattern, computePattern } from './pattern-matching';
import { MAX_GUESSES } from '../constants';

/**
 * Create initial game state
 *
 * @param possibleAnswers - Initial set of possible answer words
 * @returns Fresh game state
 */
export function createInitialGameState(possibleAnswers: string[]): GameState {
  return {
    guesses: [],
    remainingWords: possibleAnswers,
    currentGuess: '',
    isComplete: false,
    solution: undefined,
  };
}

/**
 * Check if the game is won
 *
 * @param guesses - All guesses made so far
 * @returns True if last guess was all green
 */
export function isGameWon(guesses: GuessResult[]): boolean {
  if (guesses.length === 0) return false;

  const lastGuess = guesses[guesses.length - 1];
  return lastGuess.clues.every((clue) => clue.clue === 'correct');
}

/**
 * Check if the game is lost (max guesses reached without winning)
 *
 * @param guesses - All guesses made so far
 * @returns True if max guesses reached and game not won
 */
export function isGameLost(guesses: GuessResult[]): boolean {
  return guesses.length >= MAX_GUESSES && !isGameWon(guesses);
}

/**
 * Check if the game is over (won or lost)
 *
 * @param guesses - All guesses made so far
 * @returns True if game is won or lost
 */
export function isGameOver(guesses: GuessResult[]): boolean {
  return isGameWon(guesses) || isGameLost(guesses);
}

/**
 * Get number of remaining attempts
 *
 * @param guesses - All guesses made so far
 * @returns Number of guesses still available
 */
export function getRemainingAttempts(guesses: GuessResult[]): number {
  return Math.max(0, MAX_GUESSES - guesses.length);
}

/**
 * Get current game status as a string
 *
 * @param gameState - Current game state
 * @returns Status message
 */
export function getGameStatus(gameState: GameState): string {
  if (gameState.isComplete) {
    if (isGameWon(gameState.guesses)) {
      return `Won in ${gameState.guesses.length} ${
        gameState.guesses.length === 1 ? 'guess' : 'guesses'
      }!`;
    }
    return 'Game over - no guesses remaining';
  }

  const remaining = getRemainingAttempts(gameState.guesses);
  return `${remaining} ${remaining === 1 ? 'guess' : 'guesses'} remaining`;
}

/**
 * Calculate game statistics
 *
 * @param guesses - All guesses made
 * @param remainingWords - Number of words still possible
 * @returns Game statistics object
 */
export function calculateGameStats(
  guesses: GuessResult[],
  remainingWords: number
): {
  totalGuesses: number;
  remainingAttempts: number;
  remainingWords: number;
  efficiency: number; // Percentage of words eliminated
  isWon: boolean;
  isLost: boolean;
} {
  const totalGuesses = guesses.length;
  const remainingAttempts = getRemainingAttempts(guesses);
  const isWon = isGameWon(guesses);
  const isLost = isGameLost(guesses);

  // Efficiency: how many words we've eliminated (placeholder - needs initial count)
  const efficiency = 0; // Will be calculated with initial word count

  return {
    totalGuesses,
    remainingAttempts,
    remainingWords,
    efficiency,
    isWon,
    isLost,
  };
}

/**
 * Validate a guess before adding it to game state
 *
 * @param word - The word being guessed
 * @param gameState - Current game state
 * @param validWords - Set of all valid words
 * @returns Validation result with error message if invalid
 */
export function validateGuess(
  word: string,
  gameState: GameState,
  validWords: string[]
): {
  valid: boolean;
  error?: string;
} {
  // Check game is not already complete
  if (gameState.isComplete) {
    return {
      valid: false,
      error: 'Game is already complete',
    };
  }

  // Check word length
  if (word.length !== 5) {
    return {
      valid: false,
      error: 'Word must be exactly 5 letters',
    };
  }

  // Check word is valid
  if (!validWords.includes(word.toLowerCase())) {
    return {
      valid: false,
      error: 'Word not in dictionary',
    };
  }

  // Check not already guessed
  if (gameState.guesses.some((g) => g.word === word.toLowerCase())) {
    return {
      valid: false,
      error: 'Word already guessed',
    };
  }

  // Check max guesses not exceeded
  if (gameState.guesses.length >= MAX_GUESSES) {
    return {
      valid: false,
      error: 'Maximum guesses reached',
    };
  }

  return { valid: true };
}

/**
 * Get a hint for the current game state
 *
 * @param remainingWords - Words that could still be the answer
 * @returns Hint message
 */
export function getHint(remainingWords: string[]): string {
  const count = remainingWords.length;

  if (count === 0) {
    return 'No possible words remaining - check your clues';
  }

  if (count === 1) {
    return `Only one word possible: ${remainingWords[0].toUpperCase()}`;
  }

  if (count <= 5) {
    return `${count} words possible: ${remainingWords
      .slice(0, 5)
      .map((w) => w.toUpperCase())
      .join(', ')}`;
  }

  if (count <= 20) {
    return `${count} words still possible`;
  }

  if (count <= 100) {
    return `${count} words remaining - try to eliminate more`;
  }

  return `${count} words remaining - use high-entropy guesses`;
}

/**
 * Get game progress as a percentage
 *
 * @param guesses - All guesses made
 * @returns Progress percentage (0-100)
 */
export function getGameProgress(guesses: GuessResult[]): number {
  return Math.min(100, (guesses.length / MAX_GUESSES) * 100);
}

/**
 * Format guess history for display
 *
 * @param guesses - All guesses made
 * @returns Formatted string representation
 */
export function formatGuessHistory(guesses: GuessResult[]): string {
  if (guesses.length === 0) {
    return 'No guesses yet';
  }

  return guesses
    .map((guess, index) => {
      const word = guess.word.toUpperCase();
      const clues = guess.clues
        .map((c) => {
          switch (c.clue) {
            case 'correct':
              return '🟩';
            case 'present':
              return '🟨';
            case 'absent':
              return '⬜';
          }
        })
        .join('');
      return `${index + 1}. ${word} ${clues}`;
    })
    .join('\n');
}

/**
 * Check if we should show the optimal guesses (no guesses made yet)
 *
 * @param gameState - Current game state
 * @returns True if we should show pre-computed optimal openers
 */
export function shouldShowOptimalOpeners(gameState: GameState): boolean {
  return gameState.guesses.length === 0;
}

/**
 * Determine if current state requires entropy calculation
 *
 * @param remainingWords - Number of remaining possible words
 * @returns True if we should calculate entropy
 */
export function shouldCalculateEntropy(remainingWords: number): boolean {
  // Only calculate if we have more than 1 word remaining
  // If exactly 1 word remains, that's the answer
  return remainingWords > 1;
}
