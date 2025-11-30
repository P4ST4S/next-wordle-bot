/**
 * Game Controls Component
 *
 * Action buttons for game management (reset, new game, cancel)
 * Uses Shadcn/UI Button component
 */

'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, PlayCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  onReset: () => void;
  onCancel?: () => void;
  isCalculating?: boolean;
  isGameOver?: boolean;
  className?: string;
}

/**
 * Main game controls component
 */
export function GameControls({
  onReset,
  onCancel,
  isCalculating = false,
  isGameOver = false,
  className,
}: GameControlsProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Reset/New Game Button */}
      <Button
        onClick={onReset}
        variant={isGameOver ? 'default' : 'outline'}
        size="lg"
        className="flex-1"
      >
        {isGameOver ? (
          <>
            <PlayCircle className="w-4 h-4 mr-2" />
            New Game
          </>
        ) : (
          <>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Game
          </>
        )}
      </Button>

      {/* Cancel Calculation Button */}
      {isCalculating && onCancel && (
        <Button
          onClick={onCancel}
          variant="destructive"
          size="lg"
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      )}
    </div>
  );
}
