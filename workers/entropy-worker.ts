/**
 * Web Worker for Entropy Calculation
 *
 * Offloads heavy Shannon Entropy calculations to keep main thread at 60fps
 * Reports progress every 100 words for responsive UI updates
 */

import type {
  WorkerRequest,
  WorkerResponse,
  WorkerProgress,
  WordSuggestion,
  Pattern,
} from '../lib/types';

/**
 * Compute pattern between guess and actual word (duplicated from pattern-matching.ts)
 * We duplicate this here because workers can't import from main thread modules
 */
function computePattern(guess: string, actual: string): Pattern {
  const guessLower = guess.toLowerCase();
  const actualLower = actual.toLowerCase();

  const actualLetters = actualLower.split('');
  const result = [0, 0, 0, 0, 0];

  // First pass: Mark correct positions (green)
  for (let i = 0; i < 5; i++) {
    if (guessLower[i] === actualLower[i]) {
      result[i] = 2; // correct (green)
      actualLetters[i] = ''; // Mark as used
    }
  }

  // Second pass: Mark present letters (yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 0) {
      const idx = actualLetters.indexOf(guessLower[i]);
      if (idx !== -1) {
        result[i] = 1; // present (yellow)
        actualLetters[idx] = ''; // Mark as used
      }
    }
  }

  // Encode to pattern number (base-3)
  let pattern = 0;
  let multiplier = 1;
  for (let i = 0; i < 5; i++) {
    pattern += result[i] * multiplier;
    multiplier *= 3;
  }

  return pattern;
}

/**
 * Calculate Shannon Entropy for a single guess word
 * (Duplicated from entropy-calculation.ts for worker isolation)
 */
function calculateEntropy(guess: string, remainingWords: string[]): number {
  const n = remainingWords.length;
  if (n <= 1) return 0;

  const patternCounts = new Map<Pattern, number>();

  for (const actual of remainingWords) {
    const pattern = computePattern(guess, actual);
    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
  }

  let entropy = 0;
  for (const count of patternCounts.values()) {
    const probability = count / n;
    entropy += probability * Math.log2(1 / probability);
  }

  return entropy;
}

/**
 * Calculate expected remaining words after a guess
 */
function calculateExpectedRemaining(
  guess: string,
  remainingWords: string[]
): number {
  const n = remainingWords.length;
  if (n <= 1) return 0;

  const patternCounts = new Map<Pattern, number>();

  for (const actual of remainingWords) {
    const pattern = computePattern(guess, actual);
    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
  }

  let expectedRemaining = 0;
  for (const count of patternCounts.values()) {
    const probability = count / n;
    expectedRemaining += probability * count;
  }

  return expectedRemaining;
}

/**
 * Main worker message handler
 */
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, candidateWords, remainingWords } = e.data;

  if (type === 'CALCULATE_ENTROPY') {
    const startTime = performance.now();
    const suggestions: WordSuggestion[] = [];
    const total = candidateWords.length;

    // Calculate entropy for each candidate word
    for (let i = 0; i < total; i++) {
      const word = candidateWords[i];
      const entropy = calculateEntropy(word, remainingWords);
      const expectedRemaining = calculateExpectedRemaining(word, remainingWords);

      suggestions.push({
        word,
        entropy,
        remainingWords: Math.round(expectedRemaining),
      });

      // Report progress every 100 words
      if ((i + 1) % 100 === 0 || i === total - 1) {
        const progress: WorkerProgress = {
          type: 'PROGRESS',
          processed: i + 1,
          total,
        };
        self.postMessage(progress);
      }
    }

    // Sort by entropy descending (highest first)
    suggestions.sort((a, b) => b.entropy - a.entropy);

    const calculationTime = performance.now() - startTime;

    // Send final results
    const response: WorkerResponse = {
      type: 'ENTROPY_RESULT',
      suggestions: suggestions.slice(0, 20), // Return top 20 suggestions
      calculationTime,
    };

    self.postMessage(response);
  }
};

// Export empty object to make this a module
export {};
