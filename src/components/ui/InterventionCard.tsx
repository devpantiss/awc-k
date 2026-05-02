import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { RiskBadge, type nutritionToRisk } from './RiskBadge';

type Priority = 'critical' | 'high' | 'medium' | 'low';

const priorityStyles: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

interface InterventionCardProps {
  childName: string;
  riskLevel: 'normal' | 'mam' | 'sam';
  suggestion: string;
  priority: Priority;
  onAction?: () => void;
  className?: string;
}

export function InterventionCard({
  childName,
  riskLevel,
  suggestion,
  priority,
  onAction,
  className,
}: InterventionCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md',
        riskLevel === 'sam' && 'border-red-200/60 dark:border-red-900/40',
        riskLevel === 'mam' && 'border-amber-200/60 dark:border-amber-900/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-foreground">{childName}</p>
            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', priorityStyles[priority])}>
              {priority}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
          <div className="mt-3">
            <RiskBadge level={riskLevel} />
          </div>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
