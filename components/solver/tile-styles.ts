/**
 * Shared Wordle tile styling, derived from the design handoff.
 *
 * Tiles render as 58×58px squares whose background/border/text colors map to a
 * `ClueType` (or "empty" for unused board rows). Both the board and the
 * add-a-move preview reuse these classes so the look stays in sync.
 */

import type { ClueType } from '@/lib/types';

/** Base geometry/typography shared by every tile (filled or empty). */
export const TILE_BASE =
  'flex size-14.5 items-center justify-center border-2 box-border ' +
  'text-[30px] font-bold uppercase select-none ' +
  'transition-[background-color,border-color,color] duration-[180ms]';

/** Color classes per clue state. `empty` is the unused-row placeholder. */
const TILE_COLORS: Record<ClueType | 'empty', string> = {
  correct: 'bg-wordle-correct border-wordle-correct text-white',
  present: 'bg-wordle-present border-wordle-present text-white',
  absent: 'bg-wordle-absent border-wordle-absent text-white',
  empty: 'bg-background border-wordle-empty-border text-ink',
};

export function tileClasses(state: ClueType | 'empty'): string {
  return TILE_COLORS[state];
}

/**
 * Click cycle for an already-filled tile: present → correct → absent → present.
 * The board treats clicks as a 3-state cycle over real clue types (the design's
 * neutral state never applies to a committed guess).
 */
export const CLUE_CYCLE: ClueType[] = ['present', 'correct', 'absent'];

export function nextClue(current: ClueType): ClueType {
  const i = CLUE_CYCLE.indexOf(current);
  return CLUE_CYCLE[(i + 1) % CLUE_CYCLE.length];
}
