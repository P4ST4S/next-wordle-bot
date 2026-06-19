/**
 * Main Wordle Solver Orchestration Hook
 *
 * Combines guess tracking (useGameState) with the worker-side solving pipeline
 * (useWorker). The worker is the single source of truth for the remaining-word
 * count and the solution; this hook merges that with win/loss-by-attempts to
 * derive overall game state.
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useTransition } from 'react';
import { useGameState } from './useGameState';
import { useWorker } from './useWorker';
import type { WordSuggestion, GuessResult } from '@/lib/types';
import { OPTIMAL_OPENERS, MAX_GUESSES } from '@/lib/constants';
import { shouldShowOptimalOpeners } from '@/lib/logic/game-state';

export interface UseWordleSolverResult {
  guesses: GuessResult[];
  isWon: boolean;
  isLost: boolean;
  isOver: boolean;
  remainingAttempts: number;

  suggestions: WordSuggestion[];
  showingOptimalOpeners: boolean;

  /** Words still consistent with all clues (worker-computed). */
  remainingWords: number;

  isCalculating: boolean;
  progress: number;
  calculationTime: number;

  addGuess: (guess: GuessResult) => void;
  cycleClue: (guessIndex: number, tileIndex: number) => void;
  reset: () => void;
  validateWord: (word: string) => { valid: boolean; error?: string };
  cancelCalculation: () => void;

  isPending: boolean;
}

export function useWordleSolver(dictionary: string[]): UseWordleSolverResult {
  const {
    guesses,
    addGuess: addGuessInternal,
    cycleClue: cycleClueInternal,
    reset: resetInternal,
    isWon,
    isLostByAttempts,
    remainingAttempts,
    validateWord: validateWordInternal,
  } = useGameState(dictionary);

  const { solve, isCalculating, progress, cancelCalculation } = useWorker();

  // The latest worker result for the current guesses (null while pending or on
  // the opener screen). This is the only async-derived state.
  const [workerResult, setWorkerResult] = useState<{
    suggestions: WordSuggestion[];
    remainingCount: number;
    calculationTime: number;
    isImpossible: boolean;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const showingOptimalOpeners = shouldShowOptimalOpeners(guesses);

  // Overall game-over: won, out of attempts, or no words can match the clues.
  const isLost = isLostByAttempts || (workerResult?.isImpossible ?? false);
  const isOver = isWon || isLost;

  // Suggestions are derived, not stored: openers before the first guess, the
  // worker result afterwards, and nothing once the game is won.
  const suggestions = useMemo<WordSuggestion[]>(() => {
    if (isWon) return [];
    if (showingOptimalOpeners) return OPTIMAL_OPENERS as WordSuggestion[];
    return workerResult?.suggestions ?? [];
  }, [isWon, showingOptimalOpeners, workerResult]);

  const calculationTime = showingOptimalOpeners
    ? 0
    : workerResult?.calculationTime ?? 0;
  const remainingWords = workerResult?.remainingCount ?? 0;

  const addGuess = useCallback(
    (guess: GuessResult) => {
      startTransition(() => {
        addGuessInternal(guess);
      });
    },
    [addGuessInternal]
  );

  const cycleClue = useCallback(
    (guessIndex: number, tileIndex: number) => {
      startTransition(() => {
        cycleClueInternal(guessIndex, tileIndex);
      });
    },
    [cycleClueInternal]
  );

  const reset = useCallback(() => {
    startTransition(() => {
      resetInternal();
      setWorkerResult(null);
    });
  }, [resetInternal]);

  const validateWord = useCallback(
    (word: string) => validateWordInternal(word, isOver),
    [validateWordInternal, isOver]
  );

  /**
   * Ask the worker to recompute whenever the guesses change. State is only set
   * after the await (or on a fresh guess), so there is no setState-in-effect
   * cascade. The opener screen and won/exhausted states need no worker call.
   */
  useEffect(() => {
    if (isWon || showingOptimalOpeners || guesses.length >= MAX_GUESSES) {
      return;
    }

    let cancelled = false;
    solve(guesses)
      .then((result) => {
        if (cancelled) return;
        setWorkerResult({
          suggestions: result.suggestions,
          remainingCount: result.remainingCount,
          calculationTime: result.calculationTime,
          isImpossible: result.remainingCount === 0,
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof Error &&
          (error.message.includes('already in progress') ||
            error.message.includes('cancelled'))
        ) {
          return;
        }
        console.error('Failed to calculate suggestions:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [guesses, isWon, showingOptimalOpeners, solve]);

  return {
    guesses,
    isWon,
    isLost,
    isOver,
    remainingAttempts,

    suggestions,
    showingOptimalOpeners,
    remainingWords,

    isCalculating,
    progress,
    calculationTime,

    addGuess,
    cycleClue,
    reset,
    validateWord,
    cancelCalculation,

    isPending,
  };
}
