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
  GuessResult,
  WordConstraints,
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

// --- Filtering Logic (Duplicated from lib/logic/word-filtering.ts) ---

function buildConstraints(guesses: GuessResult[]): WordConstraints {
  const constraints: WordConstraints = {
    correctPositions: new Map(),
    presentLetters: new Set(),
    absentLetters: new Set(),
    wrongPositions: new Map(),
    minLetterCount: new Map(),
    exactLetterCounts: new Map(),
  };

  const maxMinCounts = new Map<string, number>();

  for (const guess of guesses) {
    const letterCountsInGuess = new Map<string, number>();
    const absentLettersInGuess = new Set<string>();

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
        absentLettersInGuess.add(letter);
      }
    }

    for (const [letter, count] of letterCountsInGuess) {
      const currentMax = maxMinCounts.get(letter) || 0;
      if (count > currentMax) {
        maxMinCounts.set(letter, count);
      }
    }

    for (const letter of absentLettersInGuess) {
      if (letterCountsInGuess.has(letter)) {
        constraints.exactLetterCounts!.set(letter, letterCountsInGuess.get(letter)!);
      } else {
        constraints.absentLetters.add(letter);
      }
    }
  }

  for (const [letter, count] of maxMinCounts) {
    constraints.minLetterCount.set(letter, count);
  }

  return constraints;
}

function filterWords(words: string[], constraints: WordConstraints): string[] {
  return words.filter((word) => matchesConstraints(word, constraints));
}

function matchesConstraints(word: string, constraints: WordConstraints): boolean {
  const letters = word.split('');

  for (const [pos, letter] of constraints.correctPositions) {
    if (letters[pos] !== letter) return false;
  }

  for (const letter of constraints.presentLetters) {
    if (!word.includes(letter)) return false;
  }

  for (const letter of constraints.absentLetters) {
    if (word.includes(letter)) return false;
  }

  for (const [letter, positions] of constraints.wrongPositions) {
    for (const pos of positions) {
      if (letters[pos] === letter) return false;
    }
  }

  const wordLetterCounts = new Map<string, number>();
  for (const letter of letters) {
    wordLetterCounts.set(letter, (wordLetterCounts.get(letter) || 0) + 1);
  }

  for (const [letter, minCount] of constraints.minLetterCount) {
    const count = wordLetterCounts.get(letter) || 0;
    if (count < minCount) return false;
  }

  if (constraints.exactLetterCounts) {
    for (const [letter, exactCount] of constraints.exactLetterCounts) {
      const count = wordLetterCounts.get(letter) || 0;
      if (count !== exactCount) return false;
    }
  }

  return true;
}

function updateMinLetterCount(constraints: WordConstraints, letter: string): void {
  const current = constraints.minLetterCount.get(letter) || 0;
  constraints.minLetterCount.set(letter, current + 1);
}

function addWrongPosition(constraints: WordConstraints, letter: string, position: number): void {
  if (!constraints.wrongPositions.has(letter)) {
    constraints.wrongPositions.set(letter, new Set());
  }
  constraints.wrongPositions.get(letter)!.add(position);
}

function getCandidateWords(
  remainingWords: string[],
  dictionary: string[]
): string[] {
  // If remaining words are few, we can afford to check more openers from the dictionary
  // to find the best splitter.
  // If many, just use remaining words to save time.
  
  if (remainingWords.length <= 500) {
     // Mix remaining words with top dictionary words (simple heuristic: just first N for now, 
     // or we could rely on the fact that the dictionary is sorted or we don't care)
     // For now, let's just return remainingWords to be safe and fast, 
     // plus maybe some random ones if we really wanted, but let's stick to remainingWords
     // as the primary candidates.
     // Actually, to be "Optimal", we should check the full dictionary, but that's too slow.
     // Let's return remainingWords + top 100 from dictionary?
     const candidates = new Set(remainingWords);
     let added = 0;
     for (const word of dictionary) {
        if (added >= 100) break;
        if (!candidates.has(word)) {
            candidates.add(word);
            added++;
        }
     }
     return Array.from(candidates);
  }

  return remainingWords;
}

/**
 * Heuristic: Letter Frequency Score
 * Used when the candidate set is too large for Entropy
 */
function calculateLetterFrequency(words: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const word of words) {
    const uniqueLetters = new Set(word.split(''));
    for (const letter of uniqueLetters) {
      freq.set(letter, (freq.get(letter) || 0) + 1);
    }
  }
  return freq;
}

function scoreWordByFrequency(word: string, freq: Map<string, number>): number {
  const uniqueLetters = new Set(word.split(''));
  let score = 0;
  for (const letter of uniqueLetters) {
    score += freq.get(letter) || 0;
  }
  return score;
}

/**
 * Main worker message handler
 */
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;

  if (data.type === 'CALCULATE_ENTROPY') {
    const { candidateWords, remainingWords } = data;
    performCalculation(candidateWords, remainingWords);
  } else if (data.type === 'SOLVE') {
    const { guesses, dictionary } = data;
    
    // 1. Filter words
    const constraints = buildConstraints(guesses);
    const remainingWords = filterWords(dictionary, constraints);
    
    // 2. Check threshold for Heuristic vs Entropy
    if (remainingWords.length > 2000) {
        // HEURISTIC MODE
        const freq = calculateLetterFrequency(remainingWords);
        const suggestions: WordSuggestion[] = [];
        
        // Score all remaining words (or dictionary? let's use remaining for relevance)
        // Actually, using the full dictionary for guesses is better for elimination,
        // but let's stick to remainingWords for speed in this phase.
        for (const word of remainingWords) {
            const score = scoreWordByFrequency(word, freq);
            suggestions.push({
                word,
                entropy: score, // Using score as proxy for entropy
                remainingWords: remainingWords.length // Unknown reduction
            });
        }
        
        suggestions.sort((a, b) => b.entropy - a.entropy);
        
        self.postMessage({
            type: 'ENTROPY_RESULT',
            suggestions: suggestions.slice(0, 20),
            calculationTime: 0
        } as WorkerResponse);
        
    } else {
        // ENTROPY MODE
        // Use remaining words as candidates (plus maybe some openers)
        const candidateWords = getCandidateWords(remainingWords, dictionary);
        performCalculation(candidateWords, remainingWords);
    }
  }
};

function performCalculation(candidateWords: string[], remainingWords: string[]) {
  const startTime = performance.now();
  const suggestions: WordSuggestion[] = [];
  const total = candidateWords.length;

  // Special case: if only 1 word remains, return it immediately
  if (remainingWords.length === 1) {
     self.postMessage({
      type: 'ENTROPY_RESULT',
      suggestions: [{
        word: remainingWords[0],
        entropy: 0,
        remainingWords: 1
      }],
      calculationTime: 0,
    } as WorkerResponse);
    return;
  }
  
  if (remainingWords.length === 0) {
     self.postMessage({
      type: 'ENTROPY_RESULT',
      suggestions: [],
      calculationTime: 0,
    } as WorkerResponse);
    return;
  }

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

// Export empty object to make this a module
export {};
