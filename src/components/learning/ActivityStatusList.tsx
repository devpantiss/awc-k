// ============================================================
// ACTIVITY STATUS LIST - Shows activities with status/score/attempts
// ============================================================

import { CheckCircle2, Clock, Circle, RotateCw } from 'lucide-react';
import { cn } from '../../utils';
import type { ActivityProgress } from '../../data/studentProgress';
import { getScoreRiskLevel } from '../../data/studentProgress';

interface ActivityStatusListProps {
  activities: ActivityProgress[];
  className?: string;
}

export function ActivityStatusList({ activities, className }: ActivityStatusListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">No activities in this domain.</p>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {activities.map((act) => {
        const risk = getScoreRiskLevel(act.score);
        return (
          <div
            key={act.activityId}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
              act.status === 'complete' && 'border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10',
              act.status === 'in-progress' && 'border-amber-200/60 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10',
              act.status === 'pending' && 'border-border bg-card/50',
            )}
          >
            {/* Status icon */}
            {act.status === 'complete' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            ) : act.status === 'in-progress' ? (
              <Clock size={16} className="shrink-0 text-amber-500" />
            ) : (
              <Circle size={16} className="shrink-0 text-slate-400 dark:text-slate-600" />
            )}

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs font-medium truncate',
                act.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
              )}>{act.title}</p>
              {act.lastUpdated && act.status !== 'pending' && (
                <p className="text-[9px] text-muted-foreground">Updated {act.lastUpdated}</p>
              )}
            </div>

            {/* Score */}
            {act.status !== 'pending' && (
              <span className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-bold',
                risk === 'green' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                risk === 'yellow' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                risk === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
              )}>
                {act.score}%
              </span>
            )}

            {/* Attempts */}
            {act.attempts > 1 && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground" title={`${act.attempts} attempts`}>
                <RotateCw size={10} /> {act.attempts}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
