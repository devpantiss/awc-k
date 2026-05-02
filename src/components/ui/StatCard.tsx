import { cn } from '../../utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'emerald' | 'amber' | 'red' | 'sky' | 'violet' | 'slate';

const toneStyles: Record<Tone, { bg: string; icon: string; value: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    value: 'text-amber-700 dark:text-amber-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    icon: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    value: 'text-red-700 dark:text-red-300',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    value: 'text-sky-700 dark:text-sky-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    value: 'text-violet-700 dark:text-violet-300',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    value: 'text-foreground',
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  subtitle?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, tone = 'slate', subtitle, className }: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md', className)}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
          <p className={cn('mt-2 text-3xl font-bold', styles.value)}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', styles.icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
