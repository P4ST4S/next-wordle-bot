/**
 * Shannon Entropy Calculation for Wordle Solver
 *
 * Formula: E[I] = Σ P(p|w) · log₂(1/P(p|w))
 *
 * Where:
 * - P(p|w) = Probability of pattern p given guess word w
 * - Sum over all patterns that appear in remaining word set
 *
 * Higher entropy = more information gained = better guess
 */

import { computePattern } from './pattern-matching';
import type { Pattern, WordSuggestion } from '../types';

/**
 * Calculate Shannon Entropy for a single guess word
 *
 * @param guess - The word being considered as a guess
 * @param remainingWords - All words that could still be the answer
 * @returns Entropy value (higher is better)
 *
 * @example
 * calculateEntropy('slate', ['slate', 'crate', 'trace'])
 * // Returns ~1.585 (high entropy - good guess)
 */
export function calculateEntropy(
  guess: string,
  remainingWords: string[]
): number {
  const n = remainingWords.length;

  // Edge case: if only one word remains, entropy is 0
  if (n <= 1) return 0;

  // Group remaining words by the pattern they would produce
  const patternCounts = new Map<Pattern, number>();

  for (const actual of remainingWords) {
    const pattern = computePattern(guess, actual);
    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
  }

  // Calculate Shannon Entropy
  // E[I] = Σ P(p) · log₂(1/P(p))
  // Simplified: E[I] = Σ (count/n) · log₂(n/count)
  let entropy = 0;

  for (const count of patternCounts.values()) {
    const probability = count / n;
    // log₂(1/p) = -log₂(p) = log₂(n) - log₂(count)
    entropy += probability * Math.log2(1 / probability);
  }

  return entropy;
}

/**
 * Calculate expected number of remaining words after a guess
 *
 * @param guess - The word being considered
 * @param remainingWords - Current remaining words
 * @returns Average number of words expected to remain
 */
export function calculateExpectedRemaining(
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

  // Expected remaining = Σ P(pattern) · remaining_words_for_pattern
  // For each pattern, the remaining words is just the count for that pattern
  let expectedRemaining = 0;

  for (const count of patternCounts.values()) {
    const probability = count / n;
    expectedRemaining += probability * count;
  }

  return expectedRemaining;
}

/**
 * Rank multiple candidate words by entropy
 *
 * @param candidateWords - Words to evaluate as potential guesses
 * @param remainingWords - Words that could still be the answer
 * @returns Sorted array of suggestions (highest entropy first)
 */
export function rankWordsByEntropy(
  candidateWords: string[],
  remainingWords: string[]
): WordSuggestion[] {
  const suggestions: WordSuggestion[] = [];

  for (const word of candidateWords) {
    const entropy = calculateEntropy(word, remainingWords);
    const expectedRemaining = calculateExpectedRemaining(word, remainingWords);

    suggestions.push({
      word,
      entropy,
      remainingWords: Math.round(expectedRemaining),
    });
  }

  // Sort by entropy descending (highest first)
  return suggestions.sort((a, b) => b.entropy - a.entropy);
}

/**
 * Get the best guess from a set of candidates
 *
 * @param candidateWords - Words to evaluate
 * @param remainingWords - Words that could still be the answer
 * @returns The word with highest entropy
 */
export function getBestGuess(
  candidateWords: string[],
  remainingWords: string[]
): string | null {
  if (candidateWords.length === 0) return null;
  if (remainingWords.length === 1) return remainingWords[0];

  let bestWord = candidateWords[0];
  let bestEntropy = -1;

  for (const word of candidateWords) {
    const entropy = calculateEntropy(word, remainingWords);
    if (entropy > bestEntropy) {
      bestEntropy = entropy;
      bestWord = word;
    }
  }

  return bestWord;
}

/**
 * Calculate information gain percentage
 * Shows how much uncertainty is reduced by a guess
 *
 * @param entropy - Entropy value for a guess
 * @param remainingWords - Current remaining words count
 * @returns Percentage of maximum possible information (0-100)
 */
export function calculateInformationGain(
  entropy: number,
  remainingWords: number
): number {
  if (remainingWords <= 1) return 100;

  // Maximum possible entropy is log₂(n) where n is remaining words
  const maxEntropy = Math.log2(remainingWords);

  // Information gain as percentage
  return (entropy / maxEntropy) * 100;
}

/**
 * Get pattern distribution for a guess (useful for analysis)
 *
 * @param guess - The guess word
 * @param remainingWords - Possible answer words
 * @returns Map of pattern to count and percentage
 */
export function getPatternDistribution(
  guess: string,
  remainingWords: string[]
): Map<
  Pattern,
  {
    count: number;
    percentage: number;
    sampleWords: string[];
  }
> {
  const distribution = new Map<
    Pattern,
    {
      count: number;
      percentage: number;
      sampleWords: string[];
    }
  >();

  const n = remainingWords.length;
  const patternToWords = new Map<Pattern, string[]>();

  // Group words by pattern
  for (const actual of remainingWords) {
    const pattern = computePattern(guess, actual);
    if (!patternToWords.has(pattern)) {
      patternToWords.set(pattern, []);
    }
    patternToWords.get(pattern)!.push(actual);
  }

  // Build distribution with sample words
  for (const [pattern, words] of patternToWords) {
    distribution.set(pattern, {
      count: words.length,
      percentage: (words.length / n) * 100,
      sampleWords: words.slice(0, 5), // Show up to 5 examples
    });
  }

  return distribution;
}

/**
 * Compare two guesses and return which is better
 *
 * @param guess1 - First guess word
 * @param guess2 - Second guess word
 * @param remainingWords - Possible answer words
 * @returns 1 if guess1 is better, -1 if guess2 is better, 0 if equal
 */
export function compareGuesses(
  guess1: string,
  guess2: string,
  remainingWords: string[]
): number {
  const entropy1 = calculateEntropy(guess1, remainingWords);
  const entropy2 = calculateEntropy(guess2, remainingWords);

  if (Math.abs(entropy1 - entropy2) < 0.001) return 0; // Nearly equal
  return entropy1 > entropy2 ? 1 : -1;
}
