/**
 * Pure Wordle solving pipeline
 *
 * Single source of truth for the "given the guesses so far, what should I play
 * next?" logic. Both the Web Worker and the test suite import from here, so the
 * algorithm can never drift between threads.
 *
 * The pipeline is:
 *   1. Filter the dictionary down to the words still consistent with all clues.
 *   2. If the remaining set is large, rank by a cheap letter-frequency heuristic.
 *   3. Otherwise rank the candidate words by Shannon entropy.
 */

import { buildConstraints, filterWords } from './word-filtering';
import { rankByEntropyEncoded } from './entropy-calculation';
import type { GuessResult, WordSuggestion } from '../types';

/** Above this many remaining words, exact entropy is too slow — use the heuristic. */
export const HEURISTIC_THRESHOLD = 2000;
/** How many top dictionary words to mix in as candidates when the remaining set is small. */
const EXTRA_CANDIDATE_COUNT = 100;
/** How many suggestions to return to the UI. */
const TOP_SUGGESTIONS = 20;

export interface SolveResult {
  suggestions: WordSuggestion[];
  /** Number of words still consistent with all clues (the true candidate pool). */
  remainingCount: number;
  /** The single answer if exactly one word remains, else undefined. */
  solution?: string;
}

/**
 * Choose which words to evaluate as potential guesses.
 *
 * When few words remain we can afford to also consider some dictionary words
 * that aren't themselves possible answers, since one might split the remaining
 * set better. When many remain, evaluating only the remaining words keeps the
 * entropy pass affordable.
 */
export function getCandidateWords(
  remainingWords: string[],
  dictionary: string[]
): string[] {
  if (remainingWords.length > 500) {
    return remainingWords;
  }

  const candidates = new Set(remainingWords);
  let added = 0;
  for (const word of dictionary) {
    if (added >= EXTRA_CANDIDATE_COUNT) break;
    if (!candidates.has(word)) {
      candidates.add(word);
      added++;
    }
  }
  return Array.from(candidates);
}

/**
 * Letter-frequency score: a cheap proxy for entropy used when the remaining set
 * is too large for an exact entropy pass. Counts each letter once per word so
 * words with diverse, common letters score highest.
 */
export function rankByLetterFrequency(remainingWords: string[]): WordSuggestion[] {
  const freq = new Map<string, number>();
  for (const word of remainingWords) {
    for (const letter of new Set(word)) {
      freq.set(letter, (freq.get(letter) || 0) + 1);
    }
  }

  const suggestions: WordSuggestion[] = remainingWords.map((word) => {
    let score = 0;
    for (const letter of new Set(word)) {
      score += freq.get(letter) || 0;
    }
    return { word, entropy: score, remainingWords: remainingWords.length };
  });

  suggestions.sort((a, b) => b.entropy - a.entropy);
  return suggestions.slice(0, TOP_SUGGESTIONS);
}

/** Entropy values closer than this are treated as a tie. */
const ENTROPY_EPSILON = 1e-9;

/**
 * Rank candidate words by Shannon entropy against the remaining answer set.
 *
 * Ties are broken deterministically: among words with (near-)equal entropy,
 * prefer one that is itself still a possible answer — guessing it can win
 * outright — then fall back to alphabetical order for full reproducibility
 * (independent of floating-point summation order).
 *
 * @param onProgress - optional callback invoked every 100 candidates with
 *   `(processed, total)` so a worker can report progress.
 */
export function rankByEntropy(
  candidateWords: string[],
  remainingWords: string[],
  onProgress?: (processed: number, total: number) => void
): WordSuggestion[] {
  const remainingSet = new Set(remainingWords);
  const ranked = rankByEntropyEncoded(candidateWords, remainingWords, onProgress);

  ranked.sort((a, b) => {
    const d = b.entropy - a.entropy;
    if (Math.abs(d) > ENTROPY_EPSILON) return d;
    const aIsAnswer = remainingSet.has(a.word) ? 0 : 1;
    const bIsAnswer = remainingSet.has(b.word) ? 0 : 1;
    if (aIsAnswer !== bIsAnswer) return aIsAnswer - bIsAnswer;
    return a.word < b.word ? -1 : 1;
  });

  return ranked.slice(0, TOP_SUGGESTIONS);
}

/**
 * Run the full solving pipeline for the given guesses.
 *
 * @param guesses - all guesses made so far, with their clues
 * @param dictionary - the full set of valid words
 * @param onProgress - optional progress callback forwarded to the entropy pass
 */
export function solve(
  guesses: GuessResult[],
  dictionary: string[],
  onProgress?: (processed: number, total: number) => void
): SolveResult {
  const constraints = buildConstraints(guesses);
  const remainingWords = filterWords(dictionary, constraints);
  const remainingCount = remainingWords.length;

  if (remainingCount === 0) {
    return { suggestions: [], remainingCount: 0 };
  }

  if (remainingCount === 1) {
    return {
      suggestions: [{ word: remainingWords[0], entropy: 0, remainingWords: 1 }],
      remainingCount: 1,
      solution: remainingWords[0],
    };
  }

  if (remainingCount > HEURISTIC_THRESHOLD) {
    return {
      suggestions: rankByLetterFrequency(remainingWords),
      remainingCount,
    };
  }

  const candidates = getCandidateWords(remainingWords, dictionary);
  return {
    suggestions: rankByEntropy(candidates, remainingWords, onProgress),
    remainingCount,
  };
}
