/**
 * Clue Input Component
 *
 * Interactive input for entering guesses with visual clue selection
 * Uses Shadcn/UI Input, Button, and Card components
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GuessResult, LetterClue, ClueType } from '@/lib/types';
import { Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClueInputProps {
  onSubmit: (guess: GuessResult) => void;
  validateWord?: (word: string) => { valid: boolean; error?: string };
  disabled?: boolean;
  className?: string;
}

/**
 * Main clue input component
 */
export function ClueInput({
  onSubmit,
  validateWord,
  disabled = false,
  className,
}: ClueInputProps) {
  const [word, setWord] = useState('');
  const [clues, setClues] = useState<ClueType[]>([
    'absent',
    'absent',
    'absent',
    'absent',
    'absent',
  ]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle word input change
   */
  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().slice(0, 5);
    setWord(value);
    setError(null);
  };

  /**
   * Cycle through clue types for a letter position
   */
  const cycleClue = (index: number) => {
    const clueOrder: ClueType[] = ['absent', 'present', 'correct'];
    const currentClue = clues[index];
    const currentIndex = clueOrder.indexOf(currentClue);
    const nextIndex = (currentIndex + 1) % clueOrder.length;
    const nextClue = clueOrder[nextIndex];

    const newClues = [...clues];
    newClues[index] = nextClue;
    setClues(newClues);
  };

  /**
   * Submit the guess
   */
  const handleSubmit = () => {
    // Validate word length
    if (word.length !== 5) {
      setError('Word must be exactly 5 letters');
      return;
    }

    // Validate word in dictionary
    if (validateWord) {
      const validation = validateWord(word);
      if (!validation.valid) {
        setError(validation.error || 'Invalid word');
        return;
      }
    }

    // Build letter clues
    const letterClues: LetterClue[] = word.split('').map((letter, index) => ({
      letter,
      clue: clues[index],
      position: index,
    }));

    // Create guess result
    const guess: GuessResult = {
      word,
      clues: letterClues,
    };

    // Submit
    onSubmit(guess);

    // Reset form
    setWord('');
    setClues(['absent', 'absent', 'absent', 'absent', 'absent']);
    setError(null);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const canSubmit = word.length === 5 && !disabled;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Guess
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Word Input */}
          <div>
            <Input
              type="text"
              placeholder="Enter 5-letter word..."
              value={word}
              onChange={handleWordChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              maxLength={5}
              className="uppercase font-mono text-lg"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Clue Selector */}
          {word.length === 5 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click each letter to set its clue:
              </p>
              <div className="flex gap-2 justify-center">
                {word.split('').map((letter, index) => (
                  <ClueButton
                    key={index}
                    letter={letter}
                    clue={clues[index]}
                    onClick={() => cycleClue(index)}
                    disabled={disabled}
                  />
                ))}
              </div>
              <div className="flex gap-3 justify-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded" />
                  <span>Gray = Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span>Yellow = Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-600 rounded" />
                  <span>Green = Correct</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            Add Guess
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual clue button for a letter
 */
function ClueButton({
  letter,
  clue,
  onClick,
  disabled,
}: {
  letter: string;
  clue: ClueType;
  onClick: () => void;
  disabled: boolean;
}) {
  const bgColor = {
    absent: 'bg-gray-500 dark:bg-gray-600',
    present: 'bg-yellow-500 dark:bg-yellow-600',
    correct: 'bg-green-600 dark:bg-green-700',
  }[clue];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-12 h-12 rounded font-bold text-white uppercase text-xl',
        'transition-all duration-200 hover:scale-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        bgColor
      )}
    >
      {letter}
    </button>
  );
}
