# Dictionary Management Scripts

## Overview

This directory contains scripts for managing the Wordle Solver's word dictionaries.

## Scripts

### `expand-dictionary.js`

Expands the `possible-answers.json` dictionary to include more common words from the `allowed-guesses.json` list.

**Purpose:**
- Reduce the need for fallback to the full dictionary during gameplay
- Include modern/newly-added Wordle answers (like "muggy", "snafu", etc.)
- Improve solver performance by having a larger but still curated answer list

**How it works:**
1. Loads existing `possible-answers.json` (~2,315 words)
2. Scores words from `allowed-guesses.json` based on:
   - Letter frequency (common letters score higher)
   - Common word patterns (endings like -ed, -er, -ly)
   - Priority word list (manually curated common words)
3. Adds top ~2,000 most common words
4. Outputs expanded dictionary (~4,315 words)

**Usage:**
```bash
node scripts/expand-dictionary.js
```

**Result:**
- `public/data/possible-answers.json` is updated in place
- Original file is overwritten (commit before running if you want backup)
- Console output shows which words were added

## Fallback Mechanism

The solver now includes automatic fallback logic in `hooks/useGameState.ts`:

1. First tries to filter `possible-answers.json`
2. If 0 matches found, automatically falls back to `allowed-guesses.json`
3. Warns in console when fallback occurs

This ensures the solver can handle:
- Newly added Wordle words not in original dictionaries
- Obscure but valid Wordle answers
- Edge cases where the answer is technically valid but uncommon

## Dictionary Statistics

After running `expand-dictionary.js`:

- **Possible Answers:** 4,315 words (expanded from 2,315)
- **Allowed Guesses:** 10,657 words (unchanged)
- **Total Valid Words:** ~12,500 unique words

## Priority Words

The following words are prioritized for inclusion as they're commonly used in modern Wordle:

```javascript
'muggy', 'snafu', 'guano', 'jazzy', 'fuzzy', 'dizzy', 'fizzy',
'gummy', 'dummy', 'mummy', 'tummy', 'yummy', 'bunny', 'funny',
'foggy', 'soggy', 'boggy', 'doggy', 'mommy', 'daddy', 'buddy',
'messy', 'fussy', 'hussy', 'pussy', 'gussy', 'bossy', 'sassy',
'hippo', 'motto', 'lotto', 'grotto', 'bingo', 'dingo', 'mango',
'tango', 'cargo', 'largo', 'negro', 'metro', 'retro', 'intro'
```

## Re-running the Script

You can re-run `expand-dictionary.js` at any time to regenerate the expanded dictionary with updated scoring logic or priority words.

The script is idempotent - it will produce consistent results when run multiple times on the same input data.
