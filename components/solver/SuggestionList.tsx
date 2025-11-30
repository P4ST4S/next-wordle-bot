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
  onSelectWord,
  isCalculating,
  showingOptimalOpeners = false,
  className,
}: SuggestionListProps) {
  const [expandedCount, setExpandedCount] = useState(10);

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

  if (suggestions.length === 0) {
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

  const displayedSuggestions = suggestions.slice(0, expandedCount);
  const hasMore = suggestions.length > expandedCount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {showingOptimalOpeners ? 'Optimal Opening Moves' : 'Top Suggestions'}
          </div>
          <Badge variant="secondary">
            {suggestions.length} {suggestions.length === 1 ? 'word' : 'words'}
          </Badge>
        </CardTitle>
        {showingOptimalOpeners && (
          <p className="text-sm text-muted-foreground">
            Pre-computed optimal first guesses for instant results
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Word</TableHead>
                <TableHead className="text-right">Entropy</TableHead>
                <TableHead className="text-right">Avg. Remaining</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSuggestions.map((suggestion, index) => (
                <SuggestionRow
                  key={suggestion.word}
                  suggestion={suggestion}
                  rank={index + 1}
                  onSelect={onSelectWord}
                  isTopPick={index === 0}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Show More Button */}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setExpandedCount((prev) => prev + 10)}
          >
            Show More ({suggestions.length - expandedCount} remaining)
          </Button>
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
