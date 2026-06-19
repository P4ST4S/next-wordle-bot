/**
 * Wordle Board Component
 *
 * Fixed 6×5 grid of the committed guesses. Per the design handoff, filled tiles
 * are clickable and cycle their clue color; empty rows are inert placeholders.
 */

'use client';

import type { ClueType, GuessResult } from '@/lib/types';
import { MAX_GUESSES, WORD_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TILE_BASE, tileClasses } from './tile-styles';

interface WordleBoardProps {
  guesses: GuessResult[];
  /** Cycle the clue color of a committed tile. Omit to render read-only. */
  onCycleClue?: (guessIndex: number, tileIndex: number) => void;
  className?: string;
}

export function WordleBoard({
  guesses,
  onCycleClue,
  className,
}: WordleBoardProps) {
  const rows = Array.from(
    { length: MAX_GUESSES },
    (_, i) => guesses[i] ?? null
  );

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {rows.map((guess, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5">
          {Array.from({ length: WORD_LENGTH }, (_, tileIndex) => {
            const clue = guess?.clues[tileIndex];
            return (
              <Tile
                key={tileIndex}
                letter={clue?.letter ?? ''}
                state={clue?.clue ?? 'empty'}
                onClick={
                  guess && onCycleClue
                    ? () => onCycleClue(rowIndex, tileIndex)
                    : undefined
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Tile({
  letter,
  state,
  onClick,
}: {
  letter: string;
  state: ClueType | 'empty';
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        TILE_BASE,
        tileClasses(state),
        interactive ? 'cursor-pointer' : 'cursor-default',
        interactive &&
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wordle-correct'
      )}
    >
      {letter}
    </div>
  );
}
