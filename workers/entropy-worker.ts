/**
 * Web Worker for the Wordle solving pipeline
 *
 * Offloads filtering + Shannon-entropy ranking off the main thread so the UI
 * stays responsive. All algorithmic logic lives in `lib/logic/solver.ts` and is
 * imported here — there is no duplicated logic between threads.
 *
 * The dictionary is imported statically (bundled), so it never travels over
 * postMessage: a SOLVE request only carries the guesses made so far.
 */

import { solve } from '../lib/logic/solver';
import { buildDictionary } from '../lib/logic/dictionary';
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerProgress,
} from '../lib/types';

// Built once when the worker module loads.
const dictionary = buildDictionary();

// Incremented on each CANCEL so an in-flight progress callback can bail out.
let generation = 0;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;

  if (data.type === 'CANCEL') {
    generation++;
    return;
  }

  if (data.type === 'SOLVE') {
    const myGeneration = ++generation;
    const startTime = performance.now();

    const result = solve(data.guesses, dictionary, (processed, total) => {
      // Cooperative cancellation: a newer request (or a CANCEL) bumped the
      // generation, so stop reporting progress for this stale run.
      if (myGeneration !== generation) return;
      const progress: WorkerProgress = { type: 'PROGRESS', processed, total };
      self.postMessage(progress);
    });

    // If a newer request superseded this one mid-computation, drop the result.
    if (myGeneration !== generation) return;

    const response: WorkerResponse = {
      type: 'ENTROPY_RESULT',
      suggestions: result.suggestions,
      remainingCount: result.remainingCount,
      solution: result.solution,
      calculationTime: performance.now() - startTime,
    };
    self.postMessage(response);
  }
};

// Make this file a module.
export {};
