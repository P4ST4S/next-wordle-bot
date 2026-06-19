/**
 * Dictionary utilities for the Wordle solver
 *
 * The word lists are bundled at build time (imported JSON) rather than fetched
 * at runtime, so the dictionary is available synchronously on first render —
 * no spinner, no network round-trip, no loading/error state.
 *
 * Unified Dictionary Architecture:
 * - The master dictionary is the de-duplicated union of possible answers and
 *   allowed guesses (~14,855 words).
 * - `possibleAnswers` is kept separate so callers can tell answers apart from
 *   pure guessing words (e.g. for tie-breaking).
 */

import possibleAnswersData from '../data/possible-answers.json';
import allowedGuessesData from '../data/allowed-guesses.json';

export const possibleAnswers: string[] = possibleAnswersData as string[];
export const allowedGuesses: string[] = allowedGuessesData as string[];

let cachedDictionary: string[] | null = null;

/**
 * Build the master dictionary: the sorted, de-duplicated union of possible
 * answers and allowed guesses. Memoised — computed once per module instance.
 */
export function buildDictionary(): string[] {
  if (cachedDictionary) return cachedDictionary;
  const masterSet = new Set([...possibleAnswers, ...allowedGuesses]);
  cachedDictionary = Array.from(masterSet).sort();
  return cachedDictionary;
}

/**
 * Check if a word could be a Wordle answer (not just an allowed guess).
 *
 * @param word - Word to check (case-insensitive)
 * @returns True if word is in the possible-answers list
 */
export function isPossibleAnswer(word: string): boolean {
  return possibleAnswers.includes(word.toLowerCase());
}
