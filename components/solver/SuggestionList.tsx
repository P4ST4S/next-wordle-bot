/**
 * Suggestion List Component
 *
 * Displays ranked word suggestions with entropy scores
 * Uses Shadcn/UI Table, Badge, and Button components
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WordSuggestion } from '@/lib/types';
import { Lightbulb, TrendingUp, Hash, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionListProps {
  suggestions: WordSuggestion[];
  playedWords?: string[]; // Add playedWords prop
  onSelectWord?: (word: string) => void;
  isCalculating: boolean;
  showingOptimalOpeners?: boolean;
  className?: string;
}

/**
 * Main suggestion list component
 */
export function SuggestionList({
  suggestions,
  playedWords = [], // Default to empty array
  onSelectWord,
  isCalculating,
  showingOptimalOpeners = false,
  className,
}: SuggestionListProps) {
  const [expandedCount, setExpandedCount] = useState(10);

  // Filter out words that have already been played
  const visibleSuggestions = suggestions.filter(
    (s) => !playedWords.includes(s.word)
  );

  if (isCalculating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Calculating Suggestions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Analyzing word patterns using Shannon Entropy...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Word Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No suggestions available. Add a guess to see optimal next words.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedSuggestions = visibleSuggestions.slice(0, expandedCount);
  const hasMore = visibleSuggestions.length > expandedCount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {showingOptimalOpeners ? 'Optimal Opening Moves' : 'Top Suggestions'}
          </div>
          <Badge variant="secondary">
            {visibleSuggestions.length} candidates
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Entropy
                  <TrendingUp className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Remaining
                  <Hash className="w-3 h-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedSuggestions.map((suggestion) => (
              <TableRow
                key={suggestion.word}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectWord?.(suggestion.word)}
              >
                <TableCell className="font-medium font-mono uppercase">
                  {suggestion.word}
                </TableCell>
                <TableCell className="text-right">
                  {suggestion.entropy.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {suggestion.remainingWords !== undefined
                    ? suggestion.remainingWords
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasMore && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCount((prev) => prev + 10)}
            >
              Show More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual suggestion row
 */
function SuggestionRow({
  suggestion,
  rank,
  onSelect,
  isTopPick,
}: {
  suggestion: WordSuggestion;
  rank: number;
  onSelect?: (word: string) => void;
  isTopPick: boolean;
}) {
  return (
    <TableRow className={cn(isTopPick && 'bg-muted/50')}>
      {/* Rank */}
      <TableCell className="font-medium text-muted-foreground">
        {rank === 1 && <TrendingUp className="w-4 h-4 text-green-600" />}
        {rank !== 1 && rank}
      </TableCell>

      {/* Word */}
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold uppercase">
            {suggestion.word}
          </span>
          {isTopPick && (
            <Badge variant="default" className="text-xs">
              Best
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Entropy Score */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="font-semibold">{suggestion.entropy.toFixed(3)}</span>
          <span className="text-xs text-muted-foreground">bits</span>
        </div>
      </TableCell>

      {/* Expected Remaining */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Hash className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium">
            {suggestion.remainingWords ?? '—'}
          </span>
        </div>
      </TableCell>

      {/* Action Button */}
      <TableCell className="text-right">
        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion.word)}
          >
            Use
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
