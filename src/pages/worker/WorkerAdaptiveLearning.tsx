import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { managedChildren } from '../../data/childMonitoringData';
import { cn } from '../../utils';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  ecceCurriculum,
  type EcceModule,
  type EcceSection,
  type EcceStatus,
} from '../../data/ecceCurriculum';

type ProgressState = Record<string, Record<string, boolean>>;
type ViewFilter = 'all' | EcceSection;
type ActiveTab = 'class' | 'child';

const STORAGE_KEY = 'awc-ecce-learning-progress-v1';

function buildInitialProgress(): ProgressState {
  const state: ProgressState = {};
  for (const child of managedChildren) {
    state[child.id] = {};
    for (const module of ecceCurriculum) {
      for (const activity of module.activities) {
        state[child.id][activity.id] = activity.completed;
      }
    }
  }
  return state;
}

function loadProgress(): ProgressState {
  if (typeof window === 'undefined') return buildInitialProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialProgress();
    return { ...buildInitialProgress(), ...JSON.parse(raw) };
  } catch {
    return buildInitialProgress();
  }
}

function getModuleProgress(module: EcceModule, childProgress: Record<string, boolean> = {}) {
  if (module.activities.length === 0) return 0;
  const completed = module.activities.filter((activity) => childProgress[activity.id]).length;
  return Math.round((completed / module.activities.length) * 100);
}

function getStatus(progress: number): EcceStatus {
  if (progress === 0) return 'Not Started';
  if (progress === 100) return 'Completed';
  return 'In Progress';
}

function getChildOverallProgress(childProgress: Record<string, boolean> = {}) {
  const activities = ecceCurriculum.flatMap((module) => module.activities);
  if (activities.length === 0) return 0;
  return Math.round((activities.filter((activity) => childProgress[activity.id]).length / activities.length) * 100);
}

function getNextOpenActivity(module: EcceModule, childProgress: Record<string, boolean> = {}) {
  return module.activities.find((activity) => !childProgress[activity.id]) ?? module.activities[0];
}

type ModulePlan = {
  module: EcceModule;
  progress: number;
  status: EcceStatus;
  nextActivity?: { id: string; name: string };
  priority: 'Support' | 'Continue' | 'Enrichment';
};

type StudentOverviewItem = {
  child: (typeof managedChildren)[number];
  average: number;
  supportModules: number;
  completedModules: number;
  nextModule?: EcceModule;
};

export function WorkerAdaptiveLearning() {
  const [selectedChildId, setSelectedChildId] = useState(managedChildren[0]?.id ?? '');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('class');
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [progressByChild, setProgressByChild] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    const syncProgress = () => setProgressByChild(loadProgress());
    window.addEventListener('storage', syncProgress);
    window.addEventListener('focus', syncProgress);
    return () => {
      window.removeEventListener('storage', syncProgress);
      window.removeEventListener('focus', syncProgress);
    };
  }, []);

  const selectedChild = managedChildren.find((child) => child.id === selectedChildId) ?? managedChildren[0];
  const childProgress = progressByChild[selectedChildId] ?? {};
  const visibleModules = useMemo(
    () => ecceCurriculum.filter((module) => viewFilter === 'all' || module.section === viewFilter),
    [viewFilter],
  );

  const studentOverview = useMemo(() => {
    return managedChildren.map((child) => {
      const progress = progressByChild[child.id] ?? {};
      const moduleScores = visibleModules.map((module) => getModuleProgress(module, progress));
      const average = moduleScores.length > 0
        ? Math.round(moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length)
        : 0;
      const supportModules = moduleScores.filter((score) => score < 35).length;
      const completedModules = moduleScores.filter((score) => score === 100).length;
      const nextModule = visibleModules
        .map((module) => ({ module, progress: getModuleProgress(module, progress) }))
        .sort((a, b) => {
          const aRank = a.progress < 35 ? 0 : a.progress < 100 ? 1 : 2;
          const bRank = b.progress < 35 ? 0 : b.progress < 100 ? 1 : 2;
          return aRank - bRank || a.progress - b.progress;
        })[0]?.module;

      return {
        child,
        average,
        supportModules,
        completedModules,
        nextModule,
      };
    }).sort((a, b) => a.average - b.average);
  }, [progressByChild, visibleModules]);

  const classAverageProgress = studentOverview.length > 0
    ? Math.round(studentOverview.reduce((sum, item) => sum + item.average, 0) / studentOverview.length)
    : 0;
  const studentsNeedingSupport = studentOverview.filter((item) => item.supportModules > 0).length;
  const studentsOnTrack = studentOverview.filter((item) => item.average >= 70).length;

  const plans = useMemo<ModulePlan[]>(() => {
    return visibleModules
      .map((module) => {
        const progress = getModuleProgress(module, childProgress);
        const priority: ModulePlan['priority'] = progress < 35 ? 'Support' : progress < 100 ? 'Continue' : 'Enrichment';
        return {
          module,
          progress,
          priority,
          status: getStatus(progress),
          nextActivity: getNextOpenActivity(module, childProgress),
        };
      })
      .sort((a, b) => {
        const rank = { Support: 0, Continue: 1, Enrichment: 2 };
        return rank[a.priority] - rank[b.priority] || a.progress - b.progress;
      });
  }, [childProgress, visibleModules]);

  const overallProgress = getChildOverallProgress(childProgress);
  const supportCount = plans.filter((plan) => plan.priority === 'Support').length;
  const completedCount = plans.filter((plan) => plan.progress === 100).length;
  const primaryPlan = plans[0];
  const remainingPlans = plans.slice(1, 7);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Adaptive Learning</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Switch between class progress and an individual child&apos;s adaptive plan.
              </p>
            </div>
          </div>

          <select
            value={viewFilter}
            onChange={(event) => setViewFilter(event.target.value as ViewFilter)}
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Content</option>
            <option value="foundations">Foundations</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="mt-6 grid gap-2 rounded-2xl bg-muted/40 p-1 sm:inline-grid sm:grid-cols-2">
          {[
            { id: 'class' as const, label: 'Class Progress', icon: Users },
            { id: 'child' as const, label: 'Individual Child Progress', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                  activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === 'class' && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Metric label="Class Average" value={`${classAverageProgress}%`} tone="text-emerald-600" />
            <Metric label="Need Support" value={studentsNeedingSupport} tone="text-amber-600" />
            <Metric label="On Track" value={studentsOnTrack} tone="text-sky-600" />
          </section>

          <ClassOverview
            studentOverview={studentOverview}
            selectedChildId={selectedChildId}
            onSelectChild={(childId) => {
              setSelectedChildId(childId);
              setActiveTab('child');
            }}
            viewFilter={viewFilter}
          />
        </>
      )}

      {activeTab === 'child' && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Metric label="ECCE Progress" value={`${overallProgress}%`} tone="text-emerald-600" />
            <Metric label="Needs Support" value={supportCount} tone="text-amber-600" />
            <Metric label="Completed" value={completedCount} tone="text-sky-600" />
          </section>

          <StudentDropdown
            selectedChildId={selectedChildId}
            selectedChild={selectedChild}
            open={studentPickerOpen}
            onOpenChange={setStudentPickerOpen}
            onSelectChild={(childId) => {
              setSelectedChildId(childId);
              setStudentPickerOpen(false);
            }}
            studentOverview={studentOverview}
          />

          <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today&apos;s adaptive plan</p>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {primaryPlan ? primaryPlan.module.title : 'No module selected'}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {primaryPlan
                    ? primaryPlan.priority === 'Support'
                      ? 'Start here. This module needs guided practice before moving ahead.'
                      : primaryPlan.priority === 'Continue'
                        ? 'Continue this module with the next unfinished activity.'
                        : 'This module is complete. Use it for a light enrichment activity.'
                    : 'Choose a child to see the next recommended activity.'}
                </p>

                {primaryPlan && (
                  <>
                    <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
                      <div className="flex items-start gap-3">
                        <ClipboardList size={18} className="mt-0.5 shrink-0 text-violet-500" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next activity</p>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {primaryPlan.nextActivity?.name ?? 'Review completed learning'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      label="Module progress"
                      value={primaryPlan.progress}
                      className="mt-5 max-w-2xl"
                      colorOverride={primaryPlan.priority === 'Support' ? 'bg-amber-500' : primaryPlan.priority === 'Continue' ? 'bg-violet-500' : 'bg-emerald-500'}
                    />
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {selectedChild?.name.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{selectedChild?.name ?? 'Select Child'}</h4>
                    <p className="text-xs text-muted-foreground">{selectedChild?.ageLabel ?? ''}</p>
                  </div>
                </div>
                <ProgressBar label="Overall" value={overallProgress} className="mt-5" colorOverride="bg-violet-500" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next recommendations</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">Other modules to review</h3>
            </div>

            {remainingPlans.length === 0 ? (
              <div className="rounded-[1.5rem] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No more recommendations for this selection.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {remainingPlans.map((plan, index) => (
                  <AdaptiveModuleCard key={plan.module.id} plan={plan} index={index} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ClassOverview({
  studentOverview,
  selectedChildId,
  onSelectChild,
  viewFilter,
}: {
  studentOverview: StudentOverviewItem[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
  viewFilter: ViewFilter;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Students performance overview</p>
          </div>
          <h3 className="mt-1 text-lg font-bold text-foreground">Class progress at a glance</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {viewFilter === 'all' ? 'All ECCE content' : viewFilter === 'foundations' ? 'Foundations only' : 'Monthly modules only'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {studentOverview.map((item) => (
          <StudentPerformanceCard
            key={item.child.id}
            item={item}
            selected={selectedChildId === item.child.id}
            onClick={() => onSelectChild(item.child.id)}
          />
        ))}
      </div>
    </section>
  );
}

function StudentDropdown({
  selectedChildId,
  selectedChild,
  open,
  onOpenChange,
  onSelectChild,
  studentOverview,
}: {
  selectedChildId: string;
  selectedChild: (typeof managedChildren)[number] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChild: (childId: string) => void;
  studentOverview: StudentOverviewItem[];
}) {
  const selectedOverview = studentOverview.find((item) => item.child.id === selectedChildId);

  return (
    <section className="relative rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select student</p>
      <button
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
            {selectedChild?.name.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{selectedChild?.name ?? 'Select child'}</p>
            <p className="text-xs text-muted-foreground">
              {selectedChild?.ageLabel ?? ''}{selectedOverview ? ` · ${selectedOverview.average}% progress` : ''}
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-5 right-5 top-[calc(100%-10px)] z-30 max-h-96 overflow-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
          {studentOverview.map((item) => (
            <button
              key={item.child.id}
              onClick={() => onSelectChild(item.child.id)}
              className={cn(
                'mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors last:mb-0 hover:bg-accent/60',
                selectedChildId === item.child.id && 'bg-violet-50 dark:bg-violet-950/20',
              )}
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                item.average >= 70 ? 'bg-emerald-500' : item.average >= 35 ? 'bg-violet-500' : 'bg-amber-500',
              )}>
                {item.child.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.child.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.child.ageLabel} · Next: {item.nextModule?.title ?? 'No module'}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold', item.average >= 70 ? 'text-emerald-600' : item.average >= 35 ? 'text-violet-600' : 'text-amber-600')}>
                  {item.average}%
                </p>
                <p className="text-[9px] font-semibold uppercase text-muted-foreground">{item.supportModules} support</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentPerformanceCard({
  item,
  selected,
  onClick,
}: {
  item: StudentOverviewItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected
          ? 'border-violet-300 bg-violet-50/70 shadow-sm dark:border-violet-700 dark:bg-violet-950/20'
          : 'border-border bg-background/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
            item.average >= 70 ? 'bg-emerald-500' : item.average >= 35 ? 'bg-violet-500' : 'bg-amber-500',
          )}>
            {item.child.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{item.child.name}</h4>
            <p className="text-[10px] text-muted-foreground">{item.child.ageLabel}</p>
          </div>
        </div>
        <span className={cn(
          'text-lg font-bold',
          item.average >= 70 ? 'text-emerald-600' : item.average >= 35 ? 'text-violet-600' : 'text-amber-600',
        )}>
          {item.average}%
        </span>
      </div>

      <ProgressBar
        label="Progress"
        value={item.average}
        className="mt-4"
        size="sm"
        colorOverride={item.average >= 70 ? 'bg-emerald-500' : item.average >= 35 ? 'bg-violet-500' : 'bg-amber-500'}
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card/80 p-2">
          <p className="text-base font-bold text-amber-600">{item.supportModules}</p>
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">Support</p>
        </div>
        <div className="rounded-xl bg-card/80 p-2">
          <p className="text-base font-bold text-emerald-600">{item.completedModules}</p>
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">Completed</p>
        </div>
      </div>

      <p className="mt-3 truncate text-xs text-muted-foreground">
        Next: <span className="font-semibold text-foreground">{item.nextModule?.title ?? 'No module'}</span>
      </p>
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-2xl font-bold', tone)}>{value}</p>
    </div>
  );
}

function AdaptiveModuleCard({ plan, index }: { plan: ModulePlan; index: number }) {
  const tone =
    plan.priority === 'Support'
      ? { icon: AlertTriangle, text: 'text-amber-600', bar: 'bg-amber-500', bg: 'bg-amber-50/40 dark:bg-amber-950/10' }
      : plan.priority === 'Continue'
        ? { icon: PlayCircle, text: 'text-violet-600', bar: 'bg-violet-500', bg: 'bg-violet-50/40 dark:bg-violet-950/10' }
        : { icon: Sparkles, text: 'text-emerald-600', bar: 'bg-emerald-500', bg: 'bg-emerald-50/40 dark:bg-emerald-950/10' };
  const Icon = tone.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn('rounded-[1.5rem] border border-border p-5 shadow-sm', tone.bg)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {plan.module.section === 'monthly' ? `Month ${plan.module.month}` : 'Foundation'}
          </p>
          <h4 className="mt-1 text-base font-bold text-foreground">{plan.module.title}</h4>
        </div>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-background', tone.text)}>
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.module.description}</p>
      <ProgressBar label={plan.priority} value={plan.progress} className="mt-4" colorOverride={tone.bar} />

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-card/70 p-3">
        {plan.progress === 100 ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" /> : <Target size={15} className={cn('mt-0.5 shrink-0', tone.text)} />}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggested action</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {plan.progress === 100 ? 'Assign an enrichment conversation or drawing task.' : plan.nextActivity?.name}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
