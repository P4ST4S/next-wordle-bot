/**
 * Shannon Entropy Calculation for the Wordle Solver
 *
 * Formula: E[I] = Σ P(p|w) · log₂(1/P(p|w))
 *   where P(p|w) is the probability of feedback pattern p given guess w.
 * Higher entropy = more information gained = better guess.
 *
 * Performance: words are encoded once into a flat Uint8Array (5 bytes/word,
 * values 0-25). `scoreGuess` then computes the pattern for every remaining word
 * in a single pass with no per-call allocation, tallying counts in an
 * Int32Array(243) instead of a Map.
 */

import type { WordSuggestion } from '../types';

const WORD_LEN = 5;
const PATTERN_COUNT = 243; // 3^5
const A_CODE = 'a'.charCodeAt(0);

/**
 * Encode words into a flat Uint8Array of letter codes (0-25), 5 bytes per word.
 * Returns the buffer plus the count so callers can index `i*5 .. i*5+5`.
 */
export function encodeWords(words: string[]): Uint8Array {
  const buf = new Uint8Array(words.length * WORD_LEN);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const base = i * WORD_LEN;
    for (let j = 0; j < WORD_LEN; j++) {
      buf[base + j] = w.charCodeAt(j) - A_CODE;
    }
  }
  return buf;
}

export interface GuessScore {
  entropy: number;
  /** Expected number of words remaining after this guess. */
  expectedRemaining: number;
}

/**
 * Score a single guess against the remaining answer set in one pass.
 *
 * @param guessBytes - the guess encoded as 5 letter codes
 * @param remainingBytes - all remaining answers, flat-encoded (5 bytes each)
 * @param remainingCount - number of words in `remainingBytes`
 * @param counts - scratch Int32Array(243); zeroed internally before use
 */
export function scoreGuessEncoded(
  guessBytes: Uint8Array,
  remainingBytes: Uint8Array,
  remainingCount: number,
  counts: Int32Array
): GuessScore {
  if (remainingCount <= 1) return { entropy: 0, expectedRemaining: 0 };

  counts.fill(0);

  // Tally how many remaining words produce each of the 243 patterns.
  for (let r = 0; r < remainingCount; r++) {
    counts[computePatternEncoded(guessBytes, remainingBytes, r * WORD_LEN)]++;
  }

  let entropy = 0;
  let expectedRemaining = 0;
  for (let p = 0; p < PATTERN_COUNT; p++) {
    const count = counts[p];
    if (count === 0) continue;
    const probability = count / remainingCount;
    entropy += probability * Math.log2(1 / probability);
    expectedRemaining += probability * count;
  }

  return { entropy, expectedRemaining };
}

/**
 * Compute the base-3 feedback pattern (0-242) for an encoded guess vs. an
 * encoded actual word located at `actualOffset` in a flat buffer. No allocation.
 *
 * Two-pass duplicate handling, mirroring `computePattern` in pattern-matching.ts:
 * greens first, then yellows from the leftover letter pool. The pool is tracked
 * by per-letter counts in a fixed 26-slot scratch reused across the call.
 */
const greenScratch = new Uint8Array(WORD_LEN);
const poolScratch = new Int8Array(26);

function computePatternEncoded(
  guessBytes: Uint8Array,
  buffer: Uint8Array,
  actualOffset: number
): number {
  poolScratch.fill(0);

  // First pass: greens, and build the pool of unmatched actual letters.
  for (let i = 0; i < WORD_LEN; i++) {
    const g = guessBytes[i];
    const a = buffer[actualOffset + i];
    if (g === a) {
      greenScratch[i] = 1;
    } else {
      greenScratch[i] = 0;
      poolScratch[a]++;
    }
  }

  // Second pass: yellows from the leftover pool, else gray.
  let pattern = 0;
  let multiplier = 1;
  for (let i = 0; i < WORD_LEN; i++) {
    let value: number;
    if (greenScratch[i] === 1) {
      value = 2;
    } else if (poolScratch[guessBytes[i]] > 0) {
      value = 1;
      poolScratch[guessBytes[i]]--;
    } else {
      value = 0;
    }
    pattern += value * multiplier;
    multiplier *= 3;
  }
  return pattern;
}

/**
 * Score a guess against a remaining-word set (string API).
 * Convenience wrapper that encodes inputs; prefer the encoded path in hot loops.
 */
export function scoreGuess(guess: string, remainingWords: string[]): GuessScore {
  const n = remainingWords.length;
  if (n <= 1) return { entropy: 0, expectedRemaining: 0 };
  return scoreGuessEncoded(
    encodeWords([guess]),
    encodeWords(remainingWords),
    n,
    new Int32Array(PATTERN_COUNT)
  );
}

/**
 * Shannon Entropy for a single guess (string API). Thin wrapper over scoreGuess.
 */
export function calculateEntropy(guess: string, remainingWords: string[]): number {
  return scoreGuess(guess, remainingWords).entropy;
}

/**
 * Expected number of remaining words after a guess (string API).
 */
export function calculateExpectedRemaining(
  guess: string,
  remainingWords: string[]
): number {
  return scoreGuess(guess, remainingWords).expectedRemaining;
}

/**
 * Rank candidate words by entropy, evaluating each in a single pass over the
 * remaining set using shared encoded buffers and scratch space.
 *
 * @param onProgress - optional callback invoked every 100 candidates
 */
export function rankByEntropyEncoded(
  candidateWords: string[],
  remainingWords: string[],
  onProgress?: (processed: number, total: number) => void
): WordSuggestion[] {
  const remainingBytes = encodeWords(remainingWords);
  const remainingCount = remainingWords.length;
  const counts = new Int32Array(PATTERN_COUNT);
  const guessBytes = new Uint8Array(WORD_LEN);

  const suggestions: WordSuggestion[] = [];
  const total = candidateWords.length;

  for (let i = 0; i < total; i++) {
    const word = candidateWords[i];
    for (let j = 0; j < WORD_LEN; j++) {
      guessBytes[j] = word.charCodeAt(j) - A_CODE;
    }
    const { entropy, expectedRemaining } = scoreGuessEncoded(
      guessBytes,
      remainingBytes,
      remainingCount,
      counts
    );
    suggestions.push({
      word,
      entropy,
      remainingWords: Math.round(expectedRemaining),
    });

    if (onProgress && ((i + 1) % 100 === 0 || i === total - 1)) {
      onProgress(i + 1, total);
    }
  }

  suggestions.sort((a, b) => b.entropy - a.entropy);
  return suggestions;
}
