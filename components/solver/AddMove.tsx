/**
 * Add-a-move control (replaces the old ClueInput).
 *
 * Lives under the board in the left column. The user types a 5-letter word;
 * once complete, a preview row of clue tiles appears (defaulting to gray/absent)
 * that can be cycled gray → yellow → green before committing the move.
 */

'use client';

import { useState, useCallback } from 'react';
import type { GuessResult, LetterClue, ClueType } from '@/lib/types';
import { WORD_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TILE_BASE, tileClasses } from './tile-styles';

interface AddMoveProps {
  onSubmit: (guess: GuessResult) => void;
  validateWord?: (word: string) => { valid: boolean; error?: string };
  disabled?: boolean;
}

const DEFAULT_PENDING: ClueType[] = Array.from(
  { length: WORD_LENGTH },
  () => 'absent'
);

/** Preview cycle from the design: gray → yellow → green → gray. */
const PREVIEW_CYCLE: ClueType[] = ['absent', 'present', 'correct'];

function cyclePreview(current: ClueType): ClueType {
  const i = PREVIEW_CYCLE.indexOf(current);
  return PREVIEW_CYCLE[(i + 1) % PREVIEW_CYCLE.length];
}

export function AddMove({ onSubmit, validateWord, disabled }: AddMoveProps) {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<ClueType[]>(DEFAULT_PENDING);
  const [error, setError] = useState<string | null>(null);

  const showPreview = input.length === WORD_LENGTH;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, WORD_LENGTH)
        .toUpperCase();
      setInput((prev) => {
        // Re-initialize the preview every time we (re)reach 5 letters.
        if (next.length === WORD_LENGTH && prev.length !== WORD_LENGTH) {
          setPending(DEFAULT_PENDING);
        }
        return next;
      });
      setError(null);
    },
    []
  );

  const cycleTile = useCallback((index: number) => {
    setPending((prev) =>
      prev.map((state, i) => (i === index ? cyclePreview(state) : state))
    );
  }, []);

  const submit = useCallback(() => {
    if (input.length !== WORD_LENGTH || disabled) return;

    const word = input.toLowerCase();
    if (validateWord) {
      const result = validateWord(word);
      if (!result.valid) {
        setError(result.error ?? 'Invalid word');
        return;
      }
    }

    const clues: LetterClue[] = word.split('').map((letter, position) => ({
      letter,
      position,
      clue: pending[position],
    }));

    onSubmit({ word, clues });
    setInput('');
    setPending(DEFAULT_PENDING);
    setError(null);
  }, [input, disabled, validateWord, pending, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') submit();
    },
    [submit]
  );

  return (
    <div className="mt-6.5 border-t border-border pt-5.5">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[1.4px] text-ink-muted">
        Add a move
      </h2>

      <input
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={WORD_LENGTH}
        placeholder="Type 5 letters"
        autoComplete="off"
        spellCheck={false}
        aria-label="Add a 5-letter guess"
        className={cn(
          'w-full box-border rounded-[10px] border-[1.5px] border-input px-3.75 py-3',
          'text-[17px] font-semibold uppercase tracking-[4px] text-ink',
          'transition-colors outline-none focus:border-wordle-correct',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      />

      {showPreview && (
        <div className="mt-3.5 flex flex-col gap-2.75">
          <div className="flex gap-1.5">
            {input.split('').map((letter, index) => (
              <button
                key={index}
                type="button"
                onClick={() => cycleTile(index)}
                aria-label={`Cycle clue color for ${letter}`}
                className={cn(
                  TILE_BASE,
                  tileClasses(pending[index]),
                  'cursor-pointer outline-none',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wordle-correct'
                )}
              >
                {letter}
              </button>
            ))}
          </div>

          <p className="text-[12.5px] text-ink-faint">
            Tap each tile to cycle{' '}
            <span className="font-bold text-wordle-absent">gray</span> →{' '}
            <span className="font-bold text-wordle-present">yellow</span> →{' '}
            <span className="font-bold text-wordle-correct">green</span>.
          </p>

          {error && (
            <p className="text-[12.5px] font-semibold text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            className={cn(
              'w-full box-border rounded-[10px] bg-wordle-correct py-3.25',
              'text-[15px] font-bold text-white transition-colors',
              'hover:bg-wordle-correct-hover',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Add move
          </button>
        </div>
      )}
    </div>
  );
}
