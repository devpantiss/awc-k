// ============================================================
// STUDENT PROGRESS CARD - Summary card for one student
// ============================================================

import { cn } from '../../utils';
import { getStudentProgress, getStudentOverallProgress, getStudentWeakestDomain, getDomainRiskLevel, getRiskBadgeInfo } from '../../data/studentProgress';

interface StudentProgressCardProps {
  childId: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const domainBarColors: Record<string, string> = {
  'Language': 'bg-sky-500',
  'Cognitive': 'bg-violet-500',
  'Physical': 'bg-orange-500',
  'Creativity': 'bg-pink-500',
  'Nutrition Awareness': 'bg-emerald-500',
  'Social': 'bg-amber-500',
};

export function StudentProgressCard({ childId, onClick, selected, className }: StudentProgressCardProps) {
  const student = getStudentProgress(childId);
  if (!student) return null;

  const overallPct = getStudentOverallProgress(childId);
  const weakest = getStudentWeakestDomain(childId);
  const overallRisk = getDomainRiskLevel(overallPct);
  const badge = getRiskBadgeInfo(overallRisk);

  // Collect all unique domains across themes
  const domainSet = new Map<string, number>();
  for (const tp of student.progress) {
    for (const dp of tp.domains) {
      const existing = domainSet.get(dp.name);
      if (existing === undefined || dp.completionPercentage < existing) {
        domainSet.set(dp.name, dp.completionPercentage);
      }
    }
  }
  const domainEntries = Array.from(domainSet.entries());

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all hover:shadow-md',
        selected ? 'border-violet-300 bg-violet-50/50 shadow-sm dark:border-violet-700 dark:bg-violet-950/20' : 'border-border bg-card shadow-sm',
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
          badge.tone === 'emerald' ? 'bg-emerald-500' : badge.tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
        )}>
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
          <p className="text-[10px] text-muted-foreground">{student.ageLabel} · Score {student.learningScore}</p>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-bold', overallRisk === 'green' ? 'text-emerald-600' : overallRisk === 'yellow' ? 'text-amber-600' : 'text-red-600')}>
            {overallPct}%
          </p>
          <span className={cn(
            'inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase',
            badge.tone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            badge.tone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            badge.tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
          )}>{badge.label}</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn('h-full rounded-full transition-all duration-700',
            overallRisk === 'green' ? 'bg-emerald-500' : overallRisk === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Domain mini-bars */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {domainEntries.map(([name, pct]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground truncate w-16">{name}</span>
            <div className="flex-1 h-1 rounded-full bg-muted/40 overflow-hidden">
              <div className={cn('h-full rounded-full', domainBarColors[name] ?? 'bg-slate-500')} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground w-7 text-right">{pct}%</span>
          </div>
        ))}
      </div>

      {/* Weakest domain callout */}
      {weakest && weakest.completionPercentage < 50 && (
        <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/30 px-3 py-1.5 dark:border-amber-800/30 dark:bg-amber-950/10">
          <p className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
            Weakest: {weakest.name} ({weakest.completionPercentage}%)
          </p>
        </div>
      )}
    </button>
  );
}
