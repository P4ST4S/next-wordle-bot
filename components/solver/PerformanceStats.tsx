/**
 * Performance Metrics card.
 *
 * Three stats per the design: average guesses and win rate are static aggregate
 * properties of the entropy solver; words-remaining is live (the count still
 * consistent with the clues, or the full answer set before the first guess).
 */

'use client';

import { SOLVER_STATS } from '@/lib/constants';

interface PerformanceStatsProps {
  /** Live count of words still consistent with the clues. */
  remainingWords: number;
  /** Total answer set, shown before any guess narrows the field. */
  totalWords: number;
  /** True before the first guess (opener screen) — show the full set. */
  showingOptimalOpeners: boolean;
  className?: string;
}

export function PerformanceStats({
  remainingWords,
  totalWords,
  showingOptimalOpeners,
  className,
}: PerformanceStatsProps) {
  const wordsRemaining = showingOptimalOpeners ? totalWords : remainingWords;

  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="mb-4.5 text-[17px] font-extrabold tracking-[-0.3px] text-ink">
        Performance Metrics
      </h2>
      <div className={`grid grid-cols-3 gap-3.5 ${className ?? ''}`}>
        <Stat
          value={SOLVER_STATS.avgGuesses.toFixed(2)}
          label="Avg guesses"
        />
        <Stat
          value={
            <>
              {SOLVER_STATS.winRate}
              <span className="text-[18px]">%</span>
            </>
          }
          label="Win rate"
          accent
        />
        <Stat
          value={wordsRemaining.toLocaleString('en-US')}
          label="Words remaining"
        />
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-left">
      <div
        className={`text-[32px] font-extrabold tracking-[-1px] tabular-nums ${
          accent ? 'text-wordle-correct' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12.5px] font-semibold text-ink-muted">
        {label}
      </div>
    </div>
  );
}
