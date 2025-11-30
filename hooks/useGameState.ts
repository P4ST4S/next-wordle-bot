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
 * @param dictionary - Complete list of valid words
 * @returns Game state and mutation functions
 */
export function useGameState(
  dictionary: string[]
): UseGameStateResult {
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(dictionary)
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
        const remaining = filterWords(dictionary, constraints);

        // Check if game is complete
        const isWon = isGameWon(newGuesses);
        // Game Over Logic:
        // 1. Won
        // 2. Lost (6 attempts)
        // 3. Impossible (0 remaining words AND attempts > 0)
        const isLost = !isWon && newGuesses.length >= 6;
        const isImpossible = remaining.length === 0 && newGuesses.length > 0;
        const complete = isWon || isLost || isImpossible;

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
    [dictionary]
  );

  /**
   * Reset game to initial state
   */
  const reset = useCallback(() => {
    setGameState(createInitialGameState(dictionary));
  }, [dictionary]);

  /**
   * Validate a word before guessing
   */
  const validateWord = useCallback(
    (word: string) => {
      return validateGuess(word, gameState, dictionary);
    },
    [gameState, dictionary]
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
