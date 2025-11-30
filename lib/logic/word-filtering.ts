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
  };

  // Track letters we've seen to handle "absent" clues correctly
  const confirmedLetters = new Set<string>();

  for (const guess of guesses) {
    // First pass: collect all correct and present letters
    for (const clue of guess.clues) {
      if (clue.clue === 'correct' || clue.clue === 'present') {
        confirmedLetters.add(clue.letter);
      }
    }

    // Second pass: build constraints
    for (const clue of guess.clues) {
      const letter = clue.letter;

      switch (clue.clue) {
        case 'correct':
          // Green: letter is in this exact position
          constraints.correctPositions.set(clue.position, letter);
          updateMinLetterCount(constraints, letter);
          break;

        case 'present':
          // Yellow: letter is in word but not in this position
          constraints.presentLetters.add(letter);
          addWrongPosition(constraints, letter, clue.position);
          updateMinLetterCount(constraints, letter);
          break;

        case 'absent':
          // Gray: letter is not in word (unless we've seen it as green/yellow elsewhere)
          if (!confirmedLetters.has(letter)) {
            constraints.absentLetters.add(letter);
          }
          // If we've seen this letter before as green/yellow, this gray tells us
          // the exact count (no more of this letter beyond what we've confirmed)
          break;
      }
    }
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

  // Check 2: Present letters (yellow clues) - must be in word
  for (const letter of constraints.presentLetters) {
    if (!word.includes(letter)) {
      return false;
    }
  }

  // Check 3: Absent letters (gray clues) - must not be in word
  for (const letter of constraints.absentLetters) {
    if (word.includes(letter)) {
      return false;
    }
  }

  // Check 4: Wrong positions (yellow clues) - letter can't be at these positions
  for (const [letter, positions] of constraints.wrongPositions) {
    for (const pos of positions) {
      if (letters[pos] === letter) {
        return false;
      }
    }
  }

  // Check 5: Minimum letter counts (for duplicates)
  for (const [letter, minCount] of constraints.minLetterCount) {
    const actualCount = letters.filter((l) => l === letter).length;
    if (actualCount < minCount) {
      return false;
    }
  }

  return true;
}

/**
 * Helper: Update minimum count for a letter
 * Used when we see a green or yellow clue
 */
function updateMinLetterCount(
  constraints: WordConstraints,
  letter: string
): void {
  const current = constraints.minLetterCount.get(letter) || 0;
  constraints.minLetterCount.set(letter, current + 1);
}

/**
 * Helper: Add a wrong position for a letter
 * Used when we see a yellow clue
 */
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
