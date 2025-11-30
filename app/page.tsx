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
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Wordle Solver
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Shannon Entropy Optimizer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/P4ST4S/wordle-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-12 items-start max-w-6xl mx-auto">
          {/* Left Column: Game Board & Controls */}
          <div className="lg:col-span-7 space-y-8 flex flex-col items-center w-full">
            <div className="w-full max-w-md space-y-8">
              <div className="bg-card rounded-xl shadow-sm border p-6 flex justify-center">
                <WordleBoard guesses={solver.gameState.guesses} />
              </div>
              
              <GameControls
                onReset={solver.reset}
                onCancel={solver.cancelCalculation}
                isCalculating={solver.isCalculating}
                isGameOver={solver.isOver}
                className="w-full justify-center"
              />

              {!solver.isOver && (
                <div id="clue-input" className="scroll-mt-24">
                  <ClueInput
                    onSubmit={handleAddGuess}
                    validateWord={solver.validateWord}
                    disabled={solver.isCalculating || solver.isOver}
                  />
                </div>
              )}

              {/* Game Over Message */}
              {solver.isOver && (
                <div className="p-6 bg-card border rounded-lg text-center space-y-2 animate-in fade-in zoom-in-95 duration-300">
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
          </div>

          {/* Right Column: Suggestions & Stats */}
          <div className="lg:col-span-5 space-y-6 w-full">
            <PerformanceStats
              remainingWords={solver.actualRemainingWords}
              calculationTime={solver.calculationTime}
              progress={solver.progress}
              isCalculating={solver.isCalculating}
              totalGuesses={solver.gameState.guesses.length}
              remainingAttempts={solver.remainingAttempts}
            />
            
            <SuggestionList
              suggestions={solver.suggestions}
              playedWords={solver.gameState.guesses.map((g) => g.word)}
              onSelectWord={handleSelectWord}
              isCalculating={solver.isCalculating}
              showingOptimalOpeners={solver.showingOptimalOpeners}
            />

            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <p className="font-medium mb-2">How it works</p>
              <p>
                This solver uses Shannon Entropy to calculate the optimal next guess.
                For each candidate word, we simulate guessing it against all remaining
                possible answers to maximize information gain.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js 16 & Tailwind CSS. Powered by Information Theory.
          </p>
        </div>
      </footer>
    </div>
  );
}
