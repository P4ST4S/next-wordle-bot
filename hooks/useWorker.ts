/**
 * Web Worker Communication Hook
 *
 * Manages the entropy worker's lifecycle and exposes a clean async API. The
 * dictionary lives inside the worker, so `solve` only sends the guesses.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  WorkerRequest,
  WorkerMessage,
  WordSuggestion,
  GuessResult,
} from '@/lib/types';

export interface SolveOutput {
  suggestions: WordSuggestion[];
  remainingCount: number;
  solution?: string;
  calculationTime: number;
}

export interface UseWorkerResult {
  solve: (guesses: GuessResult[]) => Promise<SolveOutput>;
  isCalculating: boolean;
  progress: number;
  cancelCalculation: () => void;
}

/**
 * Hook for managing Web Worker entropy calculations.
 */
export function useWorker(): UseWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentCalculationRef = useRef<{
    resolve: (value: SolveOutput) => void;
    reject: (error: Error) => void;
  } | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/entropy-worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'PROGRESS') {
          setProgress((e.data.processed / e.data.total) * 100);
        } else if (e.data.type === 'ENTROPY_RESULT') {
          setIsCalculating(false);
          setProgress(100);

          if (currentCalculationRef.current) {
            currentCalculationRef.current.resolve({
              suggestions: e.data.suggestions,
              remainingCount: e.data.remainingCount,
              solution: e.data.solution,
              calculationTime: e.data.calculationTime,
            });
            currentCalculationRef.current = null;
          }
        }
      };

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

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * Solve using the Web Worker (filtering + ranking happen worker-side).
   */
  const solve = useCallback(
    (guesses: GuessResult[]): Promise<SolveOutput> => {
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

        const request: WorkerRequest = { type: 'SOLVE', guesses };
        workerRef.current.postMessage(request);
      });
    },
    []
  );

  /**
   * Cancel the ongoing calculation cooperatively (no worker teardown, so the
   * bundled dictionary stays warm).
   */
  const cancelCalculation = useCallback(() => {
    if (workerRef.current && isCalculating) {
      const request: WorkerRequest = { type: 'CANCEL' };
      workerRef.current.postMessage(request);

      setIsCalculating(false);
      setProgress(0);

      if (currentCalculationRef.current) {
        currentCalculationRef.current.reject(new Error('Calculation cancelled'));
        currentCalculationRef.current = null;
      }
    }
  }, [isCalculating]);

  return {
    solve,
    isCalculating,
    progress,
    cancelCalculation,
  };
}
