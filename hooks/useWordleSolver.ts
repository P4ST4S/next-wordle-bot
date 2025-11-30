/**
 * Main Wordle Solver Orchestration Hook
 *
 * Combines game state, worker calculations, and suggestion management
 * This is the primary hook for the Wordle Solver UI
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useTransition } from 'react';
import { useGameState } from './useGameState';
import { useWorker } from './useWorker';
import type { WordSuggestion, GuessResult } from '@/lib/types';
import { OPTIMAL_OPENERS } from '@/lib/constants';
import { shouldShowOptimalOpeners } from '@/lib/logic/game-state';

export interface UseWordleSolverResult {
  // Game state
  gameState: ReturnType<typeof useGameState>['gameState'];
  isWon: boolean;
  isLost: boolean;
  isOver: boolean;
  remainingAttempts: number;
  status: string;

  // Suggestions
  suggestions: WordSuggestion[];
  showingOptimalOpeners: boolean;

  // Actual remaining words count (reflects fallback)
  actualRemainingWords: number;

  // Calculation state
  isCalculating: boolean;
  progress: number;
  calculationTime: number;

  // Actions
  addGuess: (guess: GuessResult) => void;
  reset: () => void;
  updateSuggestions: () => Promise<void>;
  validateWord: (word: string) => { valid: boolean; error?: string };
  cancelCalculation: () => void;

  // UI state
  isPending: boolean;
}

/**
 * Main hook for Wordle Solver functionality
 *
 * @param dictionary - Complete list of valid words
 * @returns Complete solver interface
 */
export function useWordleSolver(
  dictionary: string[]
): UseWordleSolverResult {
  // Game state management
  const gameStateHook = useGameState(dictionary);
  const { gameState, addGuess: addGuessInternal, reset: resetInternal } = gameStateHook;

  // Worker for entropy calculations
  const { solve, isCalculating, progress, cancelCalculation } =
    useWorker();

  // Suggestion state
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [calculationTime, setCalculationTime] = useState(0);

  // React 19 transition for smooth UI updates
  const [isPending, startTransition] = useTransition();

  /**
   * Determine if we should show pre-computed optimal openers
   */
  const showingOptimalOpeners = useMemo(
    () => shouldShowOptimalOpeners(gameState),
    [gameState]
  );

  /**
   * Update suggestions based on current game state
   */
  const updateSuggestions = useCallback(async () => {
    // Don't calculate if game is won
    if (gameStateHook.isWon) {
      setSuggestions([]);
      setCalculationTime(0);
      return;
    }

    // If no guesses yet, show optimal openers
    if (showingOptimalOpeners) {
      setSuggestions(OPTIMAL_OPENERS as WordSuggestion[]);
      setCalculationTime(0);
      return;
    }

    // If max attempts reached, stop
    if (gameState.guesses.length >= 6) {
      setSuggestions([]);
      setCalculationTime(0);
      return;
    }

    try {
      // Use solve to ensure fresh data
      // This moves the filtering logic to the worker to avoid stale state issues
      const result = await solve(
        gameState.guesses,
        dictionary
      );

      setSuggestions(result.suggestions);
      setCalculationTime(result.calculationTime);
    } catch (error) {
      // Silently ignore "already calculating" errors
      if (error instanceof Error && error.message.includes('already in progress')) {
        return;
      }
      console.error('Failed to calculate suggestions:', error);
      setSuggestions([]);
      setCalculationTime(0);
    }
  }, [
    gameState.guesses,
    showingOptimalOpeners,
    solve,
    dictionary,
    gameStateHook.isWon,
  ]);

  /**
   * Add a guess with transition for smooth UI
   */
  const addGuess = useCallback(
    (guess: GuessResult) => {
      startTransition(() => {
        addGuessInternal(guess);
      });
    },
    [addGuessInternal]
  );

  /**
   * Reset game with transition
   */
  const reset = useCallback(() => {
    startTransition(() => {
      resetInternal();
      setSuggestions([]);
      setCalculationTime(0);
    });
  }, [resetInternal]);

  /**
   * Auto-update suggestions when game state changes
   */
  useEffect(() => {
    // 1. Guard clause: Do nothing if game over
    if (gameState.isComplete) {
      setSuggestions([]);
      setCalculationTime(0);
      return;
    }

    // 2. If we have guesses, clear suggestions temporarily to show loading state
    // But if it's the start (0 guesses), don't clear because we want to show openers immediately
    if (gameState.guesses.length > 0) {
      setSuggestions([]);
    }
    
    // 3. Trigger update
    updateSuggestions();
  }, [gameState.guesses, gameState.isComplete, updateSuggestions]);

  /**
   * Calculate actual remaining words count
   * This reflects the true number of candidates (including fallback)
   */
  const actualRemainingWords = useMemo(() => {
    // If game is over, rely strictly on gameState to avoid stale suggestion data
    if (gameState.isComplete) {
      return gameState.remainingWords.length;
    }

    // If showing optimal openers, count is irrelevant
    if (showingOptimalOpeners) {
      return gameState.remainingWords.length;
    }

    // If we have suggestions, use the remainingWords from first suggestion
    // (this reflects the actual candidate pool after fallback)
    if (suggestions.length > 0 && suggestions[0].remainingWords !== undefined) {
      return suggestions[0].remainingWords;
    }

    // Otherwise use the gameState count
    return gameState.remainingWords.length;
  }, [suggestions, gameState.remainingWords.length, showingOptimalOpeners, gameState.isComplete]);

  return {
    // Game state
    gameState,
    isWon: gameStateHook.isWon,
    isLost: gameStateHook.isLost,
    isOver: gameStateHook.isOver,
    remainingAttempts: gameStateHook.remainingAttempts,
    status: gameStateHook.status,

    // Suggestions
    suggestions,
    showingOptimalOpeners,

    // Actual remaining words (reflects fallback)
    actualRemainingWords,

    // Calculation state
    isCalculating,
    progress,
    calculationTime,

    // Actions
    addGuess,
    reset,
    updateSuggestions,
    validateWord: gameStateHook.validateWord,
    cancelCalculation,

    // UI state
    isPending,
  };
}
