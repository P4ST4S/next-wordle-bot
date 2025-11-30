/**
 * Word Filtering with Constraint-Based Logic
 *
 * Filters the word list based on Wordle clues (green/yellow/gray)
 * Handles complex edge cases like duplicate letters correctly
 */

import type { GuessResult, WordConstraints, LetterClue } from '../types';

/**
 * Build constraints from all previous guesses
 *
 * @param guesses - Array of all guesses with their clues
 * @returns Constraint object representing all accumulated knowledge
 */
export function buildConstraints(guesses: GuessResult[]): WordConstraints {
  const constraints: WordConstraints = {
    correctPositions: new Map(),
    presentLetters: new Set(),
    absentLetters: new Set(),
    wrongPositions: new Map(),
    minLetterCount: new Map(),
    exactLetterCounts: new Map(),
  };

  // Track min counts per letter across all guesses
  // The true min count is the MAX of the counts observed in any single guess
  const maxMinCounts = new Map<string, number>();

  for (const guess of guesses) {
    const letterCountsInGuess = new Map<string, number>();
    const absentLettersInGuess = new Set<string>();

    // First pass: count letters and identify absent ones in this guess
    for (const clue of guess.clues) {
      const letter = clue.letter;
      if (clue.clue === 'correct' || clue.clue === 'present') {
        letterCountsInGuess.set(letter, (letterCountsInGuess.get(letter) || 0) + 1);
        
        if (clue.clue === 'correct') {
           constraints.correctPositions.set(clue.position, letter);
        } else {
           constraints.presentLetters.add(letter);
           addWrongPosition(constraints, letter, clue.position);
        }
      } else {
        // absent
        absentLettersInGuess.add(letter);
      }
    }

    // Update global min counts
    for (const [letter, count] of letterCountsInGuess) {
      const currentMax = maxMinCounts.get(letter) || 0;
      if (count > currentMax) {
        maxMinCounts.set(letter, count);
      }
    }

    // Handle absent letters
    for (const letter of absentLettersInGuess) {
      if (letterCountsInGuess.has(letter)) {
        // If a letter is both present/correct AND absent in the same guess,
        // we know the EXACT count is the number of present/correct instances.
        constraints.exactLetterCounts!.set(letter, letterCountsInGuess.get(letter)!);
      } else {
        // If it's purely absent (count is 0), it's a truly absent letter
        constraints.absentLetters.add(letter);
      }
    }
  }

  // Transfer maxMinCounts to constraints.minLetterCount
  for (const [letter, count] of maxMinCounts) {
    constraints.minLetterCount.set(letter, count);
  }

  return constraints;
}

/**
 * Filter word list based on accumulated constraints
 *
 * @param words - List of words to filter
 * @param constraints - Constraints from previous guesses
 * @returns Filtered list of words that match all constraints
 */
export function filterWords(
  words: string[],
  constraints: WordConstraints
): string[] {
  return words.filter((word) => matchesConstraints(word, constraints));
}

/**
 * Check if a single word matches all constraints
 *
 * @param word - Word to check (assumed lowercase)
 * @param constraints - Constraints to match against
 * @returns True if word satisfies all constraints
 */
export function matchesConstraints(
  word: string,
  constraints: WordConstraints
): boolean {
  const letters = word.split('');

  // Check 1: Correct positions (green clues)
  for (const [pos, letter] of constraints.correctPositions) {
    if (letters[pos] !== letter) {
      return false;
    }
  }

  // Check 2: Present letters (must exist somewhere)
  for (const letter of constraints.presentLetters) {
    if (!word.includes(letter)) return false;
  }

  // Check 3: Absent letters
  for (const letter of constraints.absentLetters) {
    if (word.includes(letter)) return false;
  }

  // Check 4: Wrong positions
  for (const [letter, positions] of constraints.wrongPositions) {
    for (const pos of positions) {
      if (letters[pos] === letter) return false;
    }
  }

  // Check 5: Letter counts
  const wordLetterCounts = new Map<string, number>();
  for (const letter of letters) {
    wordLetterCounts.set(letter, (wordLetterCounts.get(letter) || 0) + 1);
  }

  // Check Min Counts
  for (const [letter, minCount] of constraints.minLetterCount) {
    const count = wordLetterCounts.get(letter) || 0;
    if (count < minCount) return false;
  }

  // Check Exact Counts
  if (constraints.exactLetterCounts) {
    for (const [letter, exactCount] of constraints.exactLetterCounts) {
      const count = wordLetterCounts.get(letter) || 0;
      if (count !== exactCount) return false;
    }
  }

  return true;
}

function updateMinLetterCount(constraints: WordConstraints, letter: string): void {
  // Deprecated in favor of per-guess calculation in buildConstraints
  // Keeping for compatibility if needed, but buildConstraints logic replaces it.
  const current = constraints.minLetterCount.get(letter) || 0;
  constraints.minLetterCount.set(letter, current + 1);
}

function addWrongPosition(
  constraints: WordConstraints,
  letter: string,
  position: number
): void {
  if (!constraints.wrongPositions.has(letter)) {
    constraints.wrongPositions.set(letter, new Set());
  }
  constraints.wrongPositions.get(letter)!.add(position);
}



/**
 * Get summary of current constraints (useful for debugging/display)
 *
 * @param constraints - Constraints to summarize
 * @returns Human-readable constraint summary
 */
export function summarizeConstraints(constraints: WordConstraints): string {
  const parts: string[] = [];

  if (constraints.correctPositions.size > 0) {
    const correct = Array.from(constraints.correctPositions.entries())
      .map(([pos, letter]) => `${letter} at position ${pos}`)
      .join(', ');
    parts.push(`Correct: ${correct}`);
  }

  if (constraints.presentLetters.size > 0) {
    const present = Array.from(constraints.presentLetters).join(', ');
    parts.push(`Present: ${present}`);
  }

  if (constraints.absentLetters.size > 0) {
    const absent = Array.from(constraints.absentLetters).join(', ');
    parts.push(`Absent: ${absent}`);
  }

  if (constraints.minLetterCount.size > 0) {
    const counts = Array.from(constraints.minLetterCount.entries())
      .map(([letter, count]) => `${letter}≥${count}`)
      .join(', ');
    parts.push(`Min counts: ${counts}`);
  }

  return parts.join(' | ') || 'No constraints';
}

/**
 * Convert user clues to GuessResult format
 * Helper for UI integration
 *
 * @param word - The guessed word
 * @param clues - Array of clue types for each letter
 * @returns Properly formatted GuessResult
 */
export function createGuessResult(
  word: string,
  clues: Array<'correct' | 'present' | 'absent'>
): GuessResult {
  if (word.length !== 5 || clues.length !== 5) {
    throw new Error('Word and clues must be exactly 5 letters');
  }

  return {
    word: word.toLowerCase(),
    clues: word.split('').map((letter, position) => ({
      letter: letter.toLowerCase(),
      position,
      clue: clues[position],
    })),
  };
}
