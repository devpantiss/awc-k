import { cn } from '../../utils';

type Status = 'good' | 'attention' | 'risk';

const statusConfig: Record<Status, { label: string; classes: string }> = {
  good: {
    label: 'Good',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  attention: {
    label: 'Needs Attention',
    classes: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
  },
  risk: {
    label: 'High Risk',
    classes: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-bold',
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        config.classes,
        className,
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          status === 'good' && 'bg-emerald-500',
          status === 'attention' && 'bg-amber-500',
          status === 'risk' && 'bg-red-500',
        )}
      />
      {label ?? config.label}
    </span>
  );
}
