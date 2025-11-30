/**
 * Core TypeScript interfaces for the Wordle Solver
 */

/**
 * Letter clue type from Wordle feedback
 */
export type ClueType = 'correct' | 'present' | 'absent';

/**
 * Position-specific letter clue
 */
export interface LetterClue {
  letter: string;
  position: number; // 0-4
  clue: ClueType;
}

/**
 * Complete word guess with all feedback
 */
export interface GuessResult {
  word: string;
  clues: LetterClue[];
}

/**
 * Encoded pattern (0-242) representing feedback
 * Pattern encoding: base-3 number
 * - 0 = absent (gray)
 * - 1 = present (yellow)
 * - 2 = correct (green)
 * Example: "02100" = pattern 63
 */
export type Pattern = number;

/**
 * Word suggestion with entropy score
 */
export interface WordSuggestion {
  word: string;
  entropy: number;
  remainingWords?: number; // Expected words after this guess
}

/**
 * Current game state
 */
export interface GameState {
  guesses: GuessResult[];
  remainingWords: string[];
  currentGuess: string;
  isComplete: boolean;
  solution?: string; // If known
}

/**
 * Constraint derived from clues
 */
export interface WordConstraints {
  correctPositions: Map<number, string>; // position -> letter
  presentLetters: Set<string>; // letters in word but wrong position
  absentLetters: Set<string>; // letters not in word
  wrongPositions: Map<string, Set<number>>; // letter -> positions where it can't be
  minLetterCount: Map<string, number>; // Minimum occurrences of a letter
}

/**
 * Web Worker message types
 */
export type WorkerRequest = 
  | {
      type: 'CALCULATE_ENTROPY';
      candidateWords: string[];
      remainingWords: string[];
    }
  | {
      type: 'SOLVE';
      guesses: GuessResult[];
      dictionary: string[];
    };

export interface WorkerResponse {
  type: 'ENTROPY_RESULT';
  suggestions: WordSuggestion[];
  calculationTime: number;
}

export interface WorkerProgress {
  type: 'PROGRESS';
  processed: number;
  total: number;
}

export type WorkerMessage = WorkerResponse | WorkerProgress;
