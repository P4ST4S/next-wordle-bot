/**
 * Game State Management Hook
 *
 * Tracks the guesses made and derives win/loss state from them. Filtering the
 * dictionary down to the remaining words is NOT done here — that happens in the
 * worker (the single source of truth), so the main thread never iterates the
 * full dictionary on each guess.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { GuessResult } from '@/lib/types';
import {
  isGameWon,
  getRemainingAttempts,
  validateGuess,
} from '@/lib/logic/game-state';
import { MAX_GUESSES } from '@/lib/constants';

export interface UseGameStateResult {
  guesses: GuessResult[];
  addGuess: (guess: GuessResult) => void;
  reset: () => void;
  isWon: boolean;
  isLostByAttempts: boolean;
  remainingAttempts: number;
  validateWord: (
    word: string,
    isComplete: boolean
  ) => { valid: boolean; error?: string };
}

/**
 * Hook for managing Wordle guesses and win/loss derivation.
 *
 * @param dictionary - Complete list of valid words (used only for validation)
 */
export function useGameState(dictionary: string[]): UseGameStateResult {
  const [guesses, setGuesses] = useState<GuessResult[]>([]);

  /**
   * Add a new guess. No filtering happens here.
   */
  const addGuess = useCallback((guess: GuessResult) => {
    setGuesses((prev) => {
      // Stop accepting guesses once the game is won or attempts are exhausted.
      if (isGameWon(prev) || prev.length >= MAX_GUESSES) {
        return prev;
      }
      return [...prev, guess];
    });
  }, []);

  const reset = useCallback(() => {
    setGuesses([]);
  }, []);

  const validateWord = useCallback(
    (word: string, isComplete: boolean) => {
      return validateGuess(word, guesses, dictionary, isComplete);
    },
    [guesses, dictionary]
  );

  const isWon = useMemo(() => isGameWon(guesses), [guesses]);
  const isLostByAttempts = useMemo(
    () => !isWon && guesses.length >= MAX_GUESSES,
    [isWon, guesses.length]
  );
  const remainingAttempts = useMemo(
    () => getRemainingAttempts(guesses),
    [guesses]
  );

  return {
    guesses,
    addGuess,
    reset,
    isWon,
    isLostByAttempts,
    remainingAttempts,
    validateWord,
  };
}
