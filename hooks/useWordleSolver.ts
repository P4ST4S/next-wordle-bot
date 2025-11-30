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
import { OPTIMAL_OPENERS, PERFORMANCE_TARGETS } from '@/lib/constants';
import { shouldShowOptimalOpeners, shouldCalculateEntropy } from '@/lib/logic/game-state';

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
 * @param possibleAnswers - List of possible answer words (~2,315)
 * @param allowedGuesses - List of valid guess words (~10,657)
 * @returns Complete solver interface
 *
 * @example
 * const solver = useWordleSolver(possibleAnswers, allowedGuesses);
 *
 * // Show suggestions
 * useEffect(() => {
 *   solver.updateSuggestions();
 * }, [solver.gameState.guesses]);
 *
 * // Add a guess
 * solver.addGuess(guessResult);
 */
export function useWordleSolver(
  possibleAnswers: string[],
  allowedGuesses: string[]
): UseWordleSolverResult {
  // All valid words (union of both dictionaries)
  const allValidWords = useMemo(() => {
    const combined = new Set([...possibleAnswers, ...allowedGuesses]);
    return Array.from(combined);
  }, [possibleAnswers, allowedGuesses]);

  // Game state management
  const gameStateHook = useGameState(possibleAnswers, allValidWords);
  const { gameState, addGuess: addGuessInternal, reset: resetInternal } = gameStateHook;

  // Worker for entropy calculations
  const { calculateSuggestions, isCalculating, progress, cancelCalculation } =
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

    // If only 1 word remains, that's the answer
    if (gameState.remainingWords.length === 1) {
      setSuggestions([
        {
          word: gameState.remainingWords[0],
          entropy: 0,
          remainingWords: 1,
        },
      ]);
      setCalculationTime(0);
      return;
    }

    // If max attempts reached AND won/no words, stop
    if (gameState.guesses.length >= 6 && gameState.remainingWords.length === 0) {
      setSuggestions([]);
      setCalculationTime(0);
      return;
    }

    // Skip entropy calculation for very small sets (2-3 words)
    if (
      gameState.remainingWords.length > 1 &&
      !shouldCalculateEntropy(gameState.remainingWords.length)
    ) {
      // Just return the remaining words as suggestions
      setSuggestions(
        gameState.remainingWords.slice(0, 20).map((word) => ({
          word,
          entropy: 0,
          remainingWords: gameState.remainingWords.length,
        }))
      );
      setCalculationTime(0);
      return;
    }

    // If no words remain, clear suggestions
    if (gameState.remainingWords.length === 0) {
      setSuggestions([]);
      setCalculationTime(0);
      return;
    }

    try {
      // Build candidate word list
      // Strategy: All remaining answers + top guesses from allowed list
      const candidates = getCandidateWords(
        gameState.remainingWords,
        allowedGuesses
      );

      // Calculate suggestions using Web Worker
      const result = await calculateSuggestions(
        candidates,
        gameState.remainingWords
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
    gameState.remainingWords,
    gameState.guesses.length,
    showingOptimalOpeners,
    calculateSuggestions,
    allowedGuesses,
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
    if (!gameState.isComplete) {
      updateSuggestions();
    }
  }, [gameState.guesses, gameState.isComplete, updateSuggestions]);

  /**
   * Calculate actual remaining words count
   * This reflects the true number of candidates (including fallback)
   */
  const actualRemainingWords = useMemo(() => {
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
  }, [suggestions, gameState.remainingWords.length, showingOptimalOpeners]);

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

/**
 * Get candidate words for entropy calculation
 * Strategy: All remaining answers + top N from allowed guesses
 */
function getCandidateWords(
  remainingAnswers: string[],
  allowedGuesses: string[],
  topAllowedCount: number = PERFORMANCE_TARGETS.topAllowedGuesses
): string[] {
  // Start with all remaining possible answers
  const candidates = new Set(remainingAnswers);

  // Add top N from allowed guesses (if not already included)
  let added = 0;
  for (const word of allowedGuesses) {
    if (!candidates.has(word) && added < topAllowedCount) {
      candidates.add(word);
      added++;
    }
  }

  // Limit total candidates for performance
  const candidateArray = Array.from(candidates);
  if (candidateArray.length > PERFORMANCE_TARGETS.maxCandidates) {
    return candidateArray.slice(0, PERFORMANCE_TARGETS.maxCandidates);
  }

  return candidateArray;
}
