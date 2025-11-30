/**
 * Wordle Board Component
 *
 * Visual 6x5 grid showing guess history with color-coded feedback
 * Uses Tailwind CSS for styling with smooth animations
 */

'use client';

import type { GuessResult, ClueType } from '@/lib/types';
import { MAX_GUESSES, WORD_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface WordleBoardProps {
  guesses: GuessResult[];
  className?: string;
}

/**
 * Main board component displaying all guesses
 */
export function WordleBoard({ guesses, className }: WordleBoardProps) {
  // Create array of 6 rows (max guesses)
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => guesses[i] || null);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {rows.map((guess, rowIndex) => (
        <WordleRow
          key={rowIndex}
          guess={guess}
          rowIndex={rowIndex}
          isActive={rowIndex === guesses.length}
        />
      ))}
    </div>
  );
}

/**
 * Single row of 5 letter cells
 */
function WordleRow({
  guess,
  rowIndex,
  isActive,
}: {
  guess: GuessResult | null;
  rowIndex: number;
  isActive: boolean;
}) {
  const cells = Array.from({ length: WORD_LENGTH }, (_, i) => {
    if (!guess) return { letter: '', clue: undefined };
    return {
      letter: guess.clues[i]?.letter || '',
      clue: guess.clues[i]?.clue,
    };
  });

  return (
    <div className="flex gap-2">
      {cells.map((cell, cellIndex) => (
        <LetterCell
          key={cellIndex}
          letter={cell.letter}
          clue={cell.clue}
          delay={cellIndex * 100}
          isEmpty={!guess}
        />
      ))}
    </div>
  );
}

/**
 * Individual letter cell with color-coded background
 */
function LetterCell({
  letter,
  clue,
  delay,
  isEmpty,
}: {
  letter: string;
  clue?: ClueType;
  delay: number;
  isEmpty: boolean;
}) {
  const colorClasses = getColorClasses(clue);

  return (
    <div
      className={cn(
        'w-14 h-14 flex items-center justify-center text-2xl font-bold rounded transition-all duration-300',
        colorClasses,
        !isEmpty && 'animate-in zoom-in-50',
        isEmpty && 'border-2'
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="uppercase">{letter}</span>
    </div>
  );
}

/**
 * Get Tailwind classes for cell based on clue type
 */
function getColorClasses(clue?: ClueType): string {
  switch (clue) {
    case 'correct':
      return 'bg-green-600 text-white border-green-600';
    case 'present':
      return 'bg-yellow-500 text-white border-yellow-500';
    case 'absent':
      return 'bg-gray-400 text-white border-gray-400';
    default:
      return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200';
  }
}
