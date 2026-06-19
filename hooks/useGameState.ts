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
import type { GuessResult, ClueType } from '@/lib/types';
import {
  isGameWon,
  getRemainingAttempts,
  validateGuess,
} from '@/lib/logic/game-state';
import { MAX_GUESSES } from '@/lib/constants';

/** Click cycle for a committed tile: present → correct → absent → present. */
const CLUE_CYCLE: ClueType[] = ['present', 'correct', 'absent'];

export interface UseGameStateResult {
  guesses: GuessResult[];
  addGuess: (guess: GuessResult) => void;
  cycleClue: (guessIndex: number, tileIndex: number) => void;
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

  /**
   * Cycle the clue color of a single tile in an already-committed guess. This
   * lets the user correct a mis-entered feedback color; the new clues flow back
   * into the solver, which recomputes suggestions.
   */
  const cycleClue = useCallback((guessIndex: number, tileIndex: number) => {
    setGuesses((prev) =>
      prev.map((guess, gi) => {
        if (gi !== guessIndex) return guess;
        const clues = guess.clues.map((clue, ti) => {
          if (ti !== tileIndex) return clue;
          const next = CLUE_CYCLE[(CLUE_CYCLE.indexOf(clue.clue) + 1) % 3];
          return { ...clue, clue: next };
        });
        return { ...guess, clues };
      })
    );
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
    cycleClue,
    reset,
    isWon,
    isLostByAttempts,
    remainingAttempts,
    validateWord,
  };
}
