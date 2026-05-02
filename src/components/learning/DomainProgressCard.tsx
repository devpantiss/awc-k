// ============================================================
// DOMAIN PROGRESS CARD - Domain with progress bar & activities
// ============================================================

import { useState } from 'react';
import { ChevronDown, BookOpen, Brain, Dumbbell, Palette, Apple, Users } from 'lucide-react';
import { cn } from '../../utils';
import type { DomainProgress } from '../../data/studentProgress';
import { getDomainRiskLevel, getRiskBadgeInfo } from '../../data/studentProgress';
import { ActivityStatusList } from './ActivityStatusList';

interface DomainProgressCardProps {
  domain: DomainProgress;
  defaultOpen?: boolean;
  className?: string;
}

const domainIcons: Record<string, typeof BookOpen> = {
  'Language': BookOpen,
  'Cognitive': Brain,
  'Physical': Dumbbell,
  'Creativity': Palette,
  'Nutrition Awareness': Apple,
  'Social': Users,
};

const domainColors: Record<string, { bg: string; text: string; bar: string }> = {
  'Language': { bg: 'bg-sky-100 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', bar: 'bg-sky-500' },
  'Cognitive': { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300', bar: 'bg-violet-500' },
  'Physical': { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', bar: 'bg-orange-500' },
  'Creativity': { bg: 'bg-pink-100 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-300', bar: 'bg-pink-500' },
  'Nutrition Awareness': { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
  'Social': { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
};

const defaultColor = { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-300', bar: 'bg-slate-500' };

export function DomainProgressCard({ domain, defaultOpen = false, className }: DomainProgressCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = domainIcons[domain.name] ?? BookOpen;
  const color = domainColors[domain.name] ?? defaultColor;
  const risk = getDomainRiskLevel(domain.completionPercentage);
  const badge = getRiskBadgeInfo(risk);
  const completedCount = domain.activities.filter((a) => a.status === 'complete').length;
  const totalCount = domain.activities.length;

  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md', className)}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/30"
      >
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color.bg)}>
          <Icon size={18} className={color.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{domain.name}</p>
            <span className={cn(
              'inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase',
              badge.tone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
              badge.tone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
              badge.tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
            )}>{badge.label}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', color.bar)}
                style={{ width: `${domain.completionPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground w-10 text-right">{domain.completionPercentage}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-muted-foreground">{completedCount}/{totalCount}</span>
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Collapsible Activities */}
      {open && (
        <div className="border-t border-border px-4 py-3 animate-fade-in">
          <ActivityStatusList activities={domain.activities} />
        </div>
      )}
    </div>
  );
}
