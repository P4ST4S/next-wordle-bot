/**
 * Dictionary utilities for loading Wordle word lists
 *
 * Unified Dictionary Architecture:
 * - Single source of truth containing ALL valid 5-letter words (~14,855 words)
 * - No distinction between "possible answers" and "allowed guesses"
 */

/**
 * Load the Master Dictionary
 * Merges possible answers and allowed guesses into a single unified list
 *
 * @returns Promise resolving to array of all valid words
 */
export async function loadDictionary(): Promise<string[]> {
  try {
    // Load both lists to ensure we have the complete set
    const [answersRes, guessesRes] = await Promise.all([
      fetch('/data/possible-answers.json'),
      fetch('/data/allowed-guesses.json')
    ]);

    if (!answersRes.ok || !guessesRes.ok) {
      throw new Error('Failed to load dictionary files');
    }

    const answers: string[] = await answersRes.json();
    const guesses: string[] = await guessesRes.json();

    // Merge and deduplicate
    const masterSet = new Set([...answers, ...guesses]);
    return Array.from(masterSet).sort();
  } catch (error) {
    console.error('Error loading dictionary:', error);
    throw error;
  }
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
