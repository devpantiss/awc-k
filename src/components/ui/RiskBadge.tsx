import { AlertTriangle, Flag, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils';

type RiskLevel = 'normal' | 'mam' | 'sam';

const riskConfig: Record<RiskLevel, { label: string; icon: typeof ShieldCheck; classes: string; dot: string }> = {
  normal: {
    label: 'Normal',
    icon: ShieldCheck,
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  mam: {
    label: 'MAM Risk',
    icon: Flag,
    classes: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  sam: {
    label: 'SAM Risk',
    icon: AlertTriangle,
    classes: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  showPrediction?: boolean;
  predictionDays?: number;
  className?: string;
}

export function RiskBadge({ level, showPrediction = false, predictionDays = 30, className }: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
          config.classes,
        )}
      >
        <Icon size={13} />
        {config.label}
      </span>
      {showPrediction && (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Predicted Risk (Next {predictionDays} Days)
        </span>
      )}
    </div>
  );
}

/** Derive risk level from nutrition band */
export function nutritionToRisk(status: 'Normal' | 'Moderate' | 'Severe'): RiskLevel {
  if (status === 'Normal') return 'normal';
  if (status === 'Moderate') return 'mam';
  return 'sam';
}
