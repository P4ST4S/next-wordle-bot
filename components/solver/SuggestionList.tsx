/**
 * Suggestion list — "Optimal Opening Moves" card.
 *
 * Ranks candidate words by Shannon entropy (bits of information gained). Styled
 * per the design handoff: a card with a caption and up to 10 candidate rows,
 * each showing rank · word · entropy. An optional faint entropy bar can be
 * rendered behind each row.
 */

'use client';

import { useMemo } from 'react';
import type { WordSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SuggestionListProps {
  suggestions: WordSuggestion[];
  playedWords?: string[];
  isCalculating: boolean;
  showingOptimalOpeners?: boolean;
  /** Render a faint entropy bar behind each row (design `showEntropyBars`). */
  showEntropyBars?: boolean;
  className?: string;
}

const MAX_ROWS = 10;

export function SuggestionList({
  suggestions,
  playedWords = [],
  isCalculating,
  showingOptimalOpeners = false,
  showEntropyBars = false,
  className,
}: SuggestionListProps) {
  const visible = useMemo(
    () =>
      suggestions
        .filter((s) => !playedWords.includes(s.word))
        .slice(0, MAX_ROWS),
    [suggestions, playedWords]
  );

  // Relative bar width is scaled against the visible entropy range.
  const { minEntropy, maxEntropy } = useMemo(() => {
    if (visible.length === 0) return { minEntropy: 0, maxEntropy: 1 };
    const values = visible.map((s) => s.entropy);
    return { minEntropy: Math.min(...values), maxEntropy: Math.max(...values) };
  }, [visible]);

  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-ink">
        {showingOptimalOpeners ? 'Optimal Opening Moves' : 'Top Suggestions'}
      </h2>
      <p className="mb-5 mt-[7px] text-[13.5px] leading-[1.5] text-ink-muted">
        Ranked by expected information gain — each candidate is simulated against
        all remaining answers to maximize the bits of entropy resolved.
      </p>

      {isCalculating ? (
        <CalculatingRows />
      ) : visible.length === 0 ? (
        <p className="text-[13.5px] text-ink-muted">
          No suggestions available. Add a guess to see optimal next words.
        </p>
      ) : (
        <div className={cn('flex flex-col gap-[7px]', className)}>
          {visible.map((suggestion, index) => (
            <CandidateRow
              key={suggestion.word}
              rank={index + 1}
              suggestion={suggestion}
              barWidth={
                showEntropyBars
                  ? barPercent(suggestion.entropy, minEntropy, maxEntropy)
                  : null
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateRow({
  rank,
  suggestion,
  barWidth,
}: {
  rank: number;
  suggestion: WordSuggestion;
  barWidth: string | null;
}) {
  return (
    <div className="relative flex items-center gap-[15px] overflow-hidden rounded-[10px] bg-surface-row px-[15px] py-[11px]">
      {barWidth !== null && (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 bg-wordle-correct/[0.13]"
          style={{ width: barWidth }}
        />
      )}
      <span className="relative w-4.5 text-center text-[13px] font-bold text-ink-faint">
        {rank}
      </span>
      <span className="relative text-[18px] font-bold uppercase tracking-[3px] text-ink">
        {suggestion.word}
      </span>
      <span className="relative ml-auto text-[14px] font-bold tabular-nums text-wordle-correct">
        {suggestion.entropy.toFixed(2)}
        <span className="ml-[3px] text-[11px] font-semibold text-wordle-correct/60">
          bits
        </span>
      </span>
    </div>
  );
}

function CalculatingRows() {
  return (
    <div className="flex flex-col gap-[7px]" aria-busy="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-[10px] bg-surface-row"
        />
      ))}
    </div>
  );
}

/** Map an entropy value to a 10%–100% relative bar width. */
function barPercent(value: number, min: number, max: number): string {
  if (max <= min) return '100%';
  const ratio = (value - min) / (max - min);
  return `${Math.round((0.1 + 0.9 * ratio) * 100)}%`;
}
