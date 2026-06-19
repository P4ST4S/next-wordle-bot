/**
 * Wordle Solver — main page.
 *
 * Light theme, centered, two-column layout (314px board column + flexible
 * insights column) recreated from the design handoff. The entropy solver logic
 * is unchanged; this page only wires its output into the new UI.
 */

'use client';

import { useMemo } from 'react';
import { useWordleSolver } from '@/hooks/useWordleSolver';
import { buildDictionary, possibleAnswers } from '@/lib/logic/dictionary';
import { Header } from '@/components/solver/Header';
import { WordleBoard } from '@/components/solver/WordleBoard';
import { AddMove } from '@/components/solver/AddMove';
import { SuggestionList } from '@/components/solver/SuggestionList';
import { PerformanceStats } from '@/components/solver/PerformanceStats';

export default function WordleSolverPage() {
  // Bundled at build time — available synchronously, no loading state needed.
  const dictionary = useMemo(() => buildDictionary(), []);
  const solver = useWordleSolver(dictionary);

  const playedWords = useMemo(
    () => solver.guesses.map((g) => g.word),
    [solver.guesses]
  );

  return (
    <div className="min-h-screen bg-background text-ink">
      <Header />

      <main className="mx-auto grid max-w-290 grid-cols-1 items-start gap-10 px-10 pb-16 pt-9.5 lg:grid-cols-[314px_1fr] lg:gap-13">
        {/* Left column — board + add-a-move (fixed 314px) */}
        <section className="w-full max-w-78.5 justify-self-center lg:justify-self-start">
          <div className="mb-4.5 flex items-baseline justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-[1.4px] text-ink-muted">
              Your guesses
            </h2>
            <button
              type="button"
              onClick={solver.reset}
              className="rounded-lg border border-input/70 px-3 py-1.5 text-[13px] font-semibold text-[#5a5d61] transition-colors hover:border-wordle-empty-border hover:bg-surface-row hover:text-ink"
            >
              Reset game
            </button>
          </div>

          <WordleBoard
            guesses={solver.guesses}
            onCycleClue={solver.isOver ? undefined : solver.cycleClue}
          />

          {!solver.isOver && (
            <AddMove
              onSubmit={solver.addGuess}
              validateWord={solver.validateWord}
              disabled={solver.isCalculating}
            />
          )}

          {solver.isOver && <GameOverNotice solver={solver} />}
        </section>

        {/* Right column — suggestions + metrics */}
        <aside className="flex w-full flex-col gap-7">
          <SuggestionList
            suggestions={solver.suggestions}
            playedWords={playedWords}
            isCalculating={solver.isCalculating}
            showingOptimalOpeners={solver.showingOptimalOpeners}
          />
          <PerformanceStats
            remainingWords={solver.remainingWords}
            totalWords={possibleAnswers.length}
            showingOptimalOpeners={solver.showingOptimalOpeners}
          />
        </aside>
      </main>
    </div>
  );
}

function GameOverNotice({
  solver,
}: {
  solver: ReturnType<typeof useWordleSolver>;
}) {
  return (
    <div className="mt-6.5 rounded-[10px] border border-border bg-surface-row p-6 text-center">
      {solver.isWon ? (
        <>
          <p className="text-2xl font-extrabold text-wordle-correct">
            🎉 Solved!
          </p>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Solved in {solver.guesses.length}{' '}
            {solver.guesses.length === 1 ? 'guess' : 'guesses'}
          </p>
        </>
      ) : (
        <>
          <p className="text-2xl font-extrabold text-destructive">Game Over</p>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            {solver.remainingWords > 0
              ? `${solver.remainingWords} possible ${
                  solver.remainingWords === 1 ? 'word' : 'words'
                } remaining`
              : 'No possible words found'}
          </p>
        </>
      )}
    </div>
  );
}
