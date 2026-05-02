// ============================================================
// CHILD SELECTOR - Dropdown to pick a student for progress view
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { managedChildren } from '../../data/childMonitoringData';
import { getStudentOverallProgress, getDomainRiskLevel, getRiskBadgeInfo } from '../../data/studentProgress';
import { cn } from '../../utils';

interface ChildSelectorProps {
  selectedChildId: string;
  onSelect: (childId: string) => void;
  className?: string;
}

export function ChildSelector({ selectedChildId, onSelect, className }: ChildSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = managedChildren.find((c) => c.id === selectedChildId);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-violet-300 hover:shadow-sm"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          {selected?.name.charAt(0) ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{selected?.name ?? 'Select Child'}</p>
          <p className="text-[10px] text-muted-foreground">{selected?.ageLabel ?? ''}</p>
        </div>
        <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-border bg-card shadow-xl animate-fade-in max-h-72 overflow-auto">
          {managedChildren.map((child) => {
            const overallPct = getStudentOverallProgress(child.id);
            const risk = getDomainRiskLevel(overallPct);
            const badge = getRiskBadgeInfo(risk);
            const isSelected = child.id === selectedChildId;

            return (
              <button
                key={child.id}
                onClick={() => { onSelect(child.id); setOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                  isSelected && 'bg-violet-50 dark:bg-violet-950/20'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                  badge.tone === 'emerald' ? 'bg-emerald-500' : badge.tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                )}>
                  {child.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
                  <p className="text-[10px] text-muted-foreground">{child.ageLabel}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold', `text-${badge.tone === 'emerald' ? 'emerald' : badge.tone === 'amber' ? 'amber' : 'red'}-600`)}>{overallPct}%</p>
                  <span className={cn(
                    'inline-block mt-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase',
                    badge.tone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                    badge.tone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                    badge.tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                  )}>{badge.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
