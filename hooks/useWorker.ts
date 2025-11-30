/**
 * Web Worker Communication Hook
 *
 * Manages Web Worker lifecycle and provides a clean API for entropy calculations
 * Uses React 19 features for optimal performance
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkerRequest, WorkerMessage, WordSuggestion } from '@/lib/types';

export interface UseWorkerResult {
  calculateSuggestions: (
    candidateWords: string[],
    remainingWords: string[]
  ) => Promise<{
    suggestions: WordSuggestion[];
    calculationTime: number;
  }>;
  solve: (
    guesses: GuessResult[],
    dictionary: string[]
  ) => Promise<{
    suggestions: WordSuggestion[];
    calculationTime: number;
  }>;
  isCalculating: boolean;
  progress: number;
  cancelCalculation: () => void;
}

/**
 * Hook for managing Web Worker entropy calculations
 *
 * @returns Worker interface with calculation method and state
 *
 * @example
 * const { calculateSuggestions, isCalculating, progress } = useWorker();
 *
 * const result = await calculateSuggestions(candidates, remaining);
 * console.log(result.suggestions); // Top 20 word suggestions
 */
export function useWorker(): UseWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentCalculationRef = useRef<{
    resolve: (value: {
      suggestions: WordSuggestion[];
      calculationTime: number;
    }) => void;
    reject: (error: Error) => void;
  } | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    try {
      // Create worker from the workers directory
      workerRef.current = new Worker(
        new URL('../workers/entropy-worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up global message handler
      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'PROGRESS') {
          const progressPercentage = (e.data.processed / e.data.total) * 100;
          setProgress(progressPercentage);
        } else if (e.data.type === 'ENTROPY_RESULT') {
          setIsCalculating(false);
          setProgress(100);

          // Resolve the pending promise
          if (currentCalculationRef.current) {
            currentCalculationRef.current.resolve({
              suggestions: e.data.suggestions,
              calculationTime: e.data.calculationTime,
            });
            currentCalculationRef.current = null;
          }
        }
      };

      // Error handler
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setIsCalculating(false);
        setProgress(0);

        if (currentCalculationRef.current) {
          currentCalculationRef.current.reject(
            new Error('Worker calculation failed')
          );
          currentCalculationRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * Calculate word suggestions using the Web Worker
   */
  const calculateSuggestions = useCallback(
    (
      candidateWords: string[],
      remainingWords: string[]
    ): Promise<{
      suggestions: WordSuggestion[];
      calculationTime: number;
    }> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        // Check if calculation is already in progress using ref
        if (currentCalculationRef.current !== null) {
          reject(new Error('Calculation already in progress'));
          return;
        }

        // Validation
        if (candidateWords.length === 0) {
          resolve({ suggestions: [], calculationTime: 0 });
          return;
        }

        if (remainingWords.length === 0) {
          resolve({ suggestions: [], calculationTime: 0 });
          return;
        }

        // Special case: only 1 remaining word
        if (remainingWords.length === 1) {
          resolve({
            suggestions: [
              {
                word: remainingWords[0],
                entropy: 0,
                remainingWords: 1,
              },
            ],
            calculationTime: 0,
          });
          return;
        }

        // Set up state for calculation
        setIsCalculating(true);
        setProgress(0);
        currentCalculationRef.current = { resolve, reject };

        // Send request to worker
        const request: WorkerRequest = {
          type: 'CALCULATE_ENTROPY',
          candidateWords,
          remainingWords,
        };

        workerRef.current.postMessage(request);
      });
    },
    []
  );

  /**
   * Solve using the Web Worker (handles filtering + entropy)
   */
  const solve = useCallback(
    (
      guesses: GuessResult[],
      dictionary: string[]
    ): Promise<{
      suggestions: WordSuggestion[];
      calculationTime: number;
    }> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        if (currentCalculationRef.current !== null) {
          reject(new Error('Calculation already in progress'));
          return;
        }

        setIsCalculating(true);
        setProgress(0);
        currentCalculationRef.current = { resolve, reject };

        const request: WorkerRequest = {
          type: 'SOLVE',
          guesses,
          dictionary,
        };

        workerRef.current.postMessage(request);
      });
    },
    []
  );

  /**
   * Cancel ongoing calculation
   */
  const cancelCalculation = useCallback(() => {
    if (workerRef.current && isCalculating) {
      // Terminate and recreate worker to cancel
      workerRef.current.terminate();

      // Recreate worker
      workerRef.current = new Worker(
        new URL('../workers/entropy-worker.ts', import.meta.url),
        { type: 'module' }
      );

      setIsCalculating(false);
      setProgress(0);

      if (currentCalculationRef.current) {
        currentCalculationRef.current.reject(new Error('Calculation cancelled'));
        currentCalculationRef.current = null;
      }
    }
  }, [isCalculating]);

  return {
    calculateSuggestions,
    solve,
    isCalculating,
    progress,
    cancelCalculation,
  };
}
