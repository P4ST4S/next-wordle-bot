/**
 * Dictionary utilities for loading Wordle word lists
 *
 * Critical Distinction:
 * - POSSIBLE_ANSWERS (~2,315 words): Target list for entropy probability calculations
 * - ALLOWED_GUESSES (~10,657 words): Full valid guess dictionary
 */

/**
 * Load the POSSIBLE_ANSWERS list (2,315 common 5-letter words)
 * This is the target set used for entropy probability calculations
 *
 * @returns Promise resolving to array of possible answer words
 */
export async function loadPossibleAnswers(): Promise<string[]> {
  const response = await fetch('/data/possible-answers.json');
  if (!response.ok) {
    throw new Error('Failed to load possible answers dictionary');
  }
  const words: string[] = await response.json();
  return words;
}

/**
 * Load the ALLOWED_GUESSES list (10,657 valid 5-letter words)
 * This includes all valid guesses, including obscure words not in answers
 *
 * @returns Promise resolving to array of allowed guess words
 */
export async function loadAllowedGuesses(): Promise<string[]> {
  const response = await fetch('/data/allowed-guesses.json');
  if (!response.ok) {
    throw new Error('Failed to load allowed guesses dictionary');
  }
  const words: string[] = await response.json();
  return words;
}

/**
 * Load both dictionaries simultaneously
 *
 * @returns Promise resolving to object with both word lists
 */
export async function loadDictionaries(): Promise<{
  possibleAnswers: string[];
  allowedGuesses: string[];
}> {
  const [possibleAnswers, allowedGuesses] = await Promise.all([
    loadPossibleAnswers(),
    loadAllowedGuesses(),
  ]);

  return {
    possibleAnswers,
    allowedGuesses,
  };
}

/**
 * Check if a word is valid (exists in either dictionary)
 *
 * @param word - Word to validate (case-insensitive)
 * @param dictionaries - Both word lists
 * @returns True if word is valid
 */
export function isValidWord(
  word: string,
  dictionaries: { possibleAnswers: string[]; allowedGuesses: string[] }
): boolean {
  const lowerWord = word.toLowerCase();

  // Check both lists (possible answers are also allowed guesses)
  return (
    dictionaries.possibleAnswers.includes(lowerWord) ||
    dictionaries.allowedGuesses.includes(lowerWord)
  );
}

/**
 * Check if a word is a possible answer (not just an allowed guess)
 *
 * @param word - Word to check (case-insensitive)
 * @param possibleAnswers - List of possible answer words
 * @returns True if word could be a Wordle answer
 */
export function isPossibleAnswer(word: string, possibleAnswers: string[]): boolean {
  return possibleAnswers.includes(word.toLowerCase());
}

/**
 * Get all valid 5-letter words (union of both dictionaries)
 *
 * @param dictionaries - Both word lists
 * @returns Combined list of all valid words (de-duplicated)
 */
export function getAllValidWords(dictionaries: {
  possibleAnswers: string[];
  allowedGuesses: string[];
}): string[] {
  // Use Set to remove duplicates, then convert back to array
  const combined = new Set([
    ...dictionaries.possibleAnswers,
    ...dictionaries.allowedGuesses,
  ]);
  return Array.from(combined).sort();
}
