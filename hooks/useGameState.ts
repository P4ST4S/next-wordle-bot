/**
 * Game State Management Hook
 *
 * Manages Wordle game state with pure React hooks
 * Handles guesses, remaining words, and game completion
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { GameState, GuessResult } from '@/lib/types';
import {
  createInitialGameState,
  isGameOver,
  isGameWon,
  getRemainingAttempts,
  getGameStatus,
  validateGuess,
} from '@/lib/logic/game-state';
import { buildConstraints, filterWords } from '@/lib/logic/word-filtering';

export interface UseGameStateResult {
  gameState: GameState;
  addGuess: (guess: GuessResult) => void;
  reset: () => void;
  isWon: boolean;
  isLost: boolean;
  isOver: boolean;
  remainingAttempts: number;
  status: string;
  validateWord: (word: string) => { valid: boolean; error?: string };
}

/**
 * Hook for managing Wordle game state
 *
 * @param possibleAnswers - Initial list of possible answer words
 * @param allValidWords - Complete list of valid guessable words
 * @returns Game state and mutation functions
 *
 * @example
 * const { gameState, addGuess, reset, isWon } = useGameState(answers, validWords);
 *
 * // Add a guess
 * addGuess({
 *   word: 'slate',
 *   clues: [...letterClues]
 * });
 */
export function useGameState(
  possibleAnswers: string[],
  allValidWords: string[]
): UseGameStateResult {
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(possibleAnswers)
  );

  /**
   * Add a new guess to the game state
   * Automatically filters remaining words based on clues
   */
  const addGuess = useCallback(
    (guess: GuessResult) => {
      setGameState((prev) => {
        // Don't allow guesses if game is already complete
        if (prev.isComplete) {
          return prev;
        }

        // Add the new guess
        const newGuesses = [...prev.guesses, guess];

        // Build constraints from all guesses
        const constraints = buildConstraints(newGuesses);

        // Filter remaining words based on constraints
        // Try filtering POSSIBLE_ANSWERS first
        let remaining = filterWords(possibleAnswers, constraints);

        // FALLBACK: If no matches in possible answers, try the full allowed guesses list
        // This handles cases where the answer is an obscure/newly added word
        if (remaining.length === 0) {
          console.warn(
            'Target word not in standard solution list. Switching to full dictionary.'
          );
          remaining = filterWords(allValidWords, constraints);
        }

        // Check if game is complete
        const complete = isGameOver(newGuesses) || remaining.length === 0;

        // If we solved it, set the solution
        const solution =
          remaining.length === 1 ? remaining[0] : prev.solution;

        return {
          ...prev,
          guesses: newGuesses,
          remainingWords: remaining,
          isComplete: complete,
          solution,
          currentGuess: '',
        };
      });
    },
    [possibleAnswers, allValidWords]
  );

  /**
   * Reset game to initial state
   */
  const reset = useCallback(() => {
    setGameState(createInitialGameState(possibleAnswers));
  }, [possibleAnswers]);

  /**
   * Validate a word before guessing
   */
  const validateWord = useCallback(
    (word: string) => {
      return validateGuess(word, gameState, allValidWords);
    },
    [gameState, allValidWords]
  );

  // Memoized derived state
  const isWon = useMemo(() => isGameWon(gameState.guesses), [gameState.guesses]);
  const isLost = useMemo(
    () => !isWon && gameState.guesses.length >= 6,
    [isWon, gameState.guesses.length]
  );
  const isOver = useMemo(() => gameState.isComplete, [gameState.isComplete]);
  const remainingAttempts = useMemo(
    () => getRemainingAttempts(gameState.guesses),
    [gameState.guesses]
  );
  const status = useMemo(() => getGameStatus(gameState), [gameState]);

  return {
    gameState,
    addGuess,
    reset,
    isWon,
    isLost,
    isOver,
    remainingAttempts,
    status,
    validateWord,
  };
}
