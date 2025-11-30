/**
 * Expand Possible Answers Dictionary
 *
 * This script expands the possible-answers.json to include more common words
 * from the allowed-guesses list, reducing the need for fallback during gameplay.
 *
 * Strategy:
 * 1. Keep all existing possible answers (~2,315 words)
 * 2. Add ~2,000 more common words from allowed-guesses
 * 3. Total target: ~4,000-4,500 words
 */

const fs = require('fs');
const path = require('path');

// Paths to dictionary files
const possibleAnswersPath = path.join(__dirname, '../public/data/possible-answers.json');
const allowedGuessesPath = path.join(__dirname, '../public/data/allowed-guesses.json');

// Common letter frequency in English (for scoring word "commonness")
const letterFrequency = {
  e: 12.70, t: 9.06, a: 8.17, o: 7.51, i: 6.97, n: 6.75, s: 6.33, h: 6.09,
  r: 5.99, d: 4.25, l: 4.03, c: 2.78, u: 2.76, m: 2.41, w: 2.36, f: 2.23,
  g: 2.02, y: 1.97, p: 1.93, b: 1.29, v: 0.98, k: 0.77, j: 0.15, x: 0.15,
  q: 0.10, z: 0.07
};

/**
 * Calculate a "commonness score" for a word based on letter frequency
 * Higher score = more common letters = more likely to be a common word
 */
function calculateCommonness(word) {
  return word.split('').reduce((score, letter) => {
    return score + (letterFrequency[letter.toLowerCase()] || 0);
  }, 0) / word.length;
}

/**
 * Check if word has common patterns (good for Wordle)
 */
function hasCommonPatterns(word) {
  // Prefer words with common endings
  const commonEndings = ['ed', 'er', 'ly', 'ing', 'es', 'en', 'al', 'ty', 'ry'];
  const hasCommonEnding = commonEndings.some(ending => word.endsWith(ending));

  // Avoid words with rare letter combinations
  const rareCombos = ['qq', 'xq', 'qz', 'jj', 'vv', 'ww'];
  const hasRareCombo = rareCombos.some(combo => word.includes(combo));

  return hasCommonEnding && !hasRareCombo;
}

/**
 * Priority words to definitely include (common words that might be missing)
 */
const priorityWords = [
  'muggy', 'snafu', 'guano', 'jazzy', 'fuzzy', 'dizzy', 'fizzy',
  'gummy', 'dummy', 'mummy', 'tummy', 'yummy', 'bunny', 'funny',
  'foggy', 'soggy', 'boggy', 'doggy', 'mommy', 'daddy', 'buddy',
  'messy', 'fussy', 'hussy', 'pussy', 'gussy', 'bossy', 'sassy',
  'hippo', 'motto', 'lotto', 'grotto', 'bingo', 'dingo', 'mango',
  'tango', 'cargo', 'largo', 'negro', 'metro', 'retro', 'intro'
];

async function expandDictionary() {
  console.log('📖 Expanding Wordle dictionary...\n');

  // Load existing dictionaries
  const possibleAnswers = JSON.parse(fs.readFileSync(possibleAnswersPath, 'utf8'));
  const allowedGuesses = JSON.parse(fs.readFileSync(allowedGuessesPath, 'utf8'));

  console.log(`Current possible answers: ${possibleAnswers.length}`);
  console.log(`Total allowed guesses: ${allowedGuesses.length}\n`);

  // Create a set of existing answers for fast lookup
  const existingAnswers = new Set(possibleAnswers);

  // Find words in allowed-guesses that aren't in possible-answers
  const newCandidates = allowedGuesses.filter(word => !existingAnswers.has(word));

  console.log(`Candidates for addition: ${newCandidates.length}\n`);

  // Score each candidate
  const scoredCandidates = newCandidates.map(word => ({
    word,
    score: calculateCommonness(word),
    hasCommonPattern: hasCommonPatterns(word),
    isPriority: priorityWords.includes(word)
  }));

  // Sort by priority, then common patterns, then score
  scoredCandidates.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return b.isPriority - a.isPriority;
    if (a.hasCommonPattern !== b.hasCommonPattern) return b.hasCommonPattern - a.hasCommonPattern;
    return b.score - a.score;
  });

  // Take top ~2000 words to add
  const wordsToAdd = scoredCandidates.slice(0, 2000).map(c => c.word);

  console.log(`Adding ${wordsToAdd.length} new words to possible answers\n`);

  // Priority words that were added
  const addedPriority = wordsToAdd.filter(w => priorityWords.includes(w));
  if (addedPriority.length > 0) {
    console.log(`✅ Priority words added: ${addedPriority.join(', ')}\n`);
  }

  // Combine and sort
  const expandedAnswers = [...possibleAnswers, ...wordsToAdd].sort();

  // Write expanded dictionary
  fs.writeFileSync(
    possibleAnswersPath,
    JSON.stringify(expandedAnswers, null, 0)
  );

  console.log(`✨ Dictionary expanded successfully!`);
  console.log(`New size: ${expandedAnswers.length} words`);
  console.log(`\nSample of added words:`);
  console.log(wordsToAdd.slice(0, 20).join(', '));
}

// Run the script
expandDictionary().catch(console.error);
