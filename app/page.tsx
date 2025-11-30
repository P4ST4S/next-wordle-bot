/**
 * Wordle Solver Bot - Main Page
 *
 * Portfolio-quality Wordle solver using Shannon Entropy
 * Built with Next.js 16, React 19, and Web Workers
 */

'use client';

import { useEffect, useState } from 'react';
import { useWordleSolver } from '@/hooks/useWordleSolver';
import { WordleBoard } from '@/components/solver/WordleBoard';
import { ClueInput } from '@/components/solver/ClueInput';
import { SuggestionList } from '@/components/solver/SuggestionList';
import { PerformanceStats } from '@/components/solver/PerformanceStats';
import { GameControls } from '@/components/solver/GameControls';
import { loadDictionary } from '@/lib/logic/dictionary';
import { Loader2, Lightbulb } from 'lucide-react';
import type { GuessResult } from '@/lib/types';

export default function WordleSolverPage() {
  const [dictionary, setDictionary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load dictionary on mount
  useEffect(() => {
    async function loadData() {
      try {
        const words = await loadDictionary();
        setDictionary(words);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
        setLoadError('Failed to load word list. Please refresh the page.');
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const solver = useWordleSolver(dictionary);

  // Handle adding a guess (called from ClueInput or SuggestionList)
  const handleAddGuess = (guess: GuessResult) => {
    solver.addGuess(guess);
  };

  // Handle selecting a suggested word
  const handleSelectWord = () => {
    // Auto-scroll to clue input
    const clueInput = document.getElementById('clue-input');
    clueInput?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Loading Wordle Solver...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4">
          <p className="text-lg text-destructive">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Wordle Solver Bot
                </h1>
                <p className="text-sm text-muted-foreground">
                  Shannon Entropy-powered optimal guess suggestions
                </p>
              </div>
            </div>
            <GameControls
              onReset={solver.reset}
              onCancel={solver.cancelCalculation}
              isCalculating={solver.isCalculating}
              isGameOver={solver.isOver}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Game Board & Input */}
          <div className="space-y-6">
            {/* Wordle Board */}
            <WordleBoard guesses={solver.gameState.guesses} />

            {/* Clue Input */}
            {!solver.isOver && (
              <div id="clue-input">
                <ClueInput
                  onSubmit={handleAddGuess}
                  validateWord={solver.validateWord}
                  disabled={solver.isOver}
                />
              </div>
            )}

            {/* Performance Stats */}
            <PerformanceStats
              remainingWords={solver.actualRemainingWords}
              calculationTime={solver.calculationTime}
              progress={solver.progress}
              isCalculating={solver.isCalculating}
              totalGuesses={solver.gameState.guesses.length}
              remainingAttempts={solver.remainingAttempts}
            />

            {/* Game Over Message */}
            {solver.isOver && (
              <div className="p-6 bg-card border rounded-lg text-center space-y-2">
                {solver.isWon ? (
                  <>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                      🎉 Solved!
                    </p>
                    <p className="text-muted-foreground">
                      Solved in {solver.gameState.guesses.length}{' '}
                      {solver.gameState.guesses.length === 1 ? 'guess' : 'guesses'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-destructive">
                      Game Over
                    </p>
                    <p className="text-muted-foreground">
                      {solver.actualRemainingWords > 0
                        ? `${solver.actualRemainingWords} possible ${
                            solver.actualRemainingWords === 1
                              ? 'word'
                              : 'words'
                          } remaining`
                        : 'No possible words found'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Suggestions */}
          <div>
            <SuggestionList
              suggestions={solver.suggestions}
              onSelectWord={handleSelectWord}
              isCalculating={solver.isCalculating}
              showingOptimalOpeners={solver.showingOptimalOpeners}
            />
          </div>
        </div>

        {/* How It Works Section */}
        <section className="mt-12 p-6 bg-card border rounded-lg">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              This solver uses <strong>Shannon Entropy</strong> to calculate the
              optimal next guess. Entropy measures how much information a guess
              provides on average, considering all possible outcomes.
            </p>
            <p>
              <strong>Algorithm:</strong> For each candidate word, we simulate
              guessing it against all remaining possible answers, calculate the
              pattern distribution, and compute the expected information gain
              using the formula: <code>E[I] = Σ P(p) · log₂(1/P(p))</code>
            </p>
            <p>
              <strong>Performance:</strong> Heavy calculations run in a Web Worker
              to keep the UI responsive at 60fps. Pre-computed optimal openers
              provide instant first-guess suggestions.
            </p>
            <p>
              <strong>Tech Stack:</strong> Next.js 16, React 19, TypeScript,
              Tailwind CSS v4, Shadcn/UI, Web Workers
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>
          Built with Shannon Entropy algorithm · Powered by Web Workers · Open
          Source
        </p>
      </footer>
    </div>
  );
}
