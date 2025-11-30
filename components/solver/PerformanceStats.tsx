/**
 * Performance Statistics Component
 *
 * Displays calculation metrics, remaining words, and progress
 * Uses Shadcn/UI Card and Progress components
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Hash, Zap } from 'lucide-react';

interface PerformanceStatsProps {
  remainingWords: number;
  calculationTime: number;
  progress: number;
  isCalculating: boolean;
  totalGuesses: number;
  remainingAttempts: number;
  className?: string;
}

/**
 * Main performance stats component
 */
export function PerformanceStats({
  remainingWords,
  calculationTime,
  progress,
  isCalculating,
  totalGuesses,
  remainingAttempts,
  className,
}: PerformanceStatsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calculation Progress */}
        {isCalculating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Calculating entropy...</span>
              <span className="font-mono font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Remaining Words */}
          <StatCard
            icon={<Hash className="w-4 h-4" />}
            label="Remaining Words"
            value={remainingWords.toLocaleString()}
            variant={getRemainingWordsVariant(remainingWords)}
          />

          {/* Calculation Time */}
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Calc Time"
            value={formatCalculationTime(calculationTime)}
            variant={getCalculationTimeVariant(calculationTime)}
          />

          {/* Total Guesses */}
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Guesses Made"
            value={totalGuesses.toString()}
            variant="secondary"
          />

          {/* Remaining Attempts */}
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Attempts Left"
            value={remainingAttempts.toString()}
            variant={getRemainingAttemptsVariant(remainingAttempts)}
          />
        </div>

        {/* Performance Indicator */}
        {!isCalculating && calculationTime > 0 && (
          <div className="pt-2 border-t">
            <PerformanceIndicator calculationTime={calculationTime} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual stat card
 */
function StatCard({
  icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}) {
  const variantStyles = {
    default: 'bg-muted/50',
    secondary: 'bg-muted/50',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    destructive: 'bg-red-500/10 text-red-700 dark:text-red-400',
  };

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-lg transition-colors ${variantStyles[variant]}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight">{value}</span>
      </div>
    </div>
  );
}

/**
 * Performance indicator based on calculation time
 */
function PerformanceIndicator({ calculationTime }: { calculationTime: number }) {
  const getFeedback = () => {
    if (calculationTime < 500) {
      return { text: 'Excellent performance', color: 'text-green-600' };
    }
    if (calculationTime < 1000) {
      return { text: 'Good performance', color: 'text-blue-600' };
    }
    if (calculationTime < 2000) {
      return { text: 'Acceptable performance', color: 'text-yellow-600' };
    }
    return { text: 'Slow performance', color: 'text-red-600' };
  };

  const feedback = getFeedback();

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Performance:</span>
      <span className={`font-semibold ${feedback.color}`}>{feedback.text}</span>
    </div>
  );
}

/**
 * Helper: Format calculation time
 */
function formatCalculationTime(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Helper: Get variant based on remaining words
 */
function getRemainingWordsVariant(
  count: number
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  if (count === 0) return 'destructive';
  if (count === 1) return 'success';
  if (count <= 10) return 'warning';
  return 'default';
}

/**
 * Helper: Get variant based on calculation time
 */
function getCalculationTimeVariant(
  ms: number
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  if (ms === 0) return 'secondary';
  if (ms < 1000) return 'success';
  if (ms < 2000) return 'default';
  return 'warning';
}

/**
 * Helper: Get variant based on remaining attempts
 */
function getRemainingAttemptsVariant(
  count: number
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  if (count === 0) return 'destructive';
  if (count <= 2) return 'warning';
  return 'default';
}
