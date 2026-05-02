import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Brain,
  CheckCircle2,
  ChevronDown,
  Circle,
  Dumbbell,
  HeartHandshake,
  MessageCircle,
  Palette,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  Chart as ChartJS,
  Legend,
  ArcElement,
  Tooltip,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { cn } from '../../utils';
import { managedChildren } from '../../data/childMonitoringData';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  ecceCurriculum,
  ecceDomains,
  type EcceDomain,
  type EcceModule,
  type EcceSection,
  type EcceStatus,
} from '../../data/ecceCurriculum';

ChartJS.register(ArcElement, Tooltip, Legend);

type DomainFilter = 'All Domains' | EcceDomain;
type ProgressState = Record<string, Record<string, boolean>>;

const STORAGE_KEY = 'awc-ecce-learning-progress-v1';

const domainUi: Record<EcceDomain, { icon: typeof Brain; bg: string; text: string; border: string }> = {
  'Cognitive Development': { icon: Brain, bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800/50' },
  'Language & Communication': { icon: MessageCircle, bg: 'bg-sky-50 dark:bg-sky-950/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50' },
  'Physical Development': { icon: Dumbbell, bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/50' },
  'Social & Emotional Development': { icon: HeartHandshake, bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50' },
  'Creative & Aesthetic Development': { icon: Palette, bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800/50' },
};

const statusOptions: Array<'All Status' | EcceStatus> = ['All Status', 'Not Started', 'In Progress', 'Completed'];

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

export function AdaptiveLearning() {
  const [activeSection, setActiveSection] = useState<EcceSection>('foundations');
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('All Domains');
  const [selectedChildId, setSelectedChildId] = useState(managedChildren[0]?.id ?? '');
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'All Status' | EcceStatus>('All Status');
  const [search, setSearch] = useState('');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(ecceCurriculum[0]?.id ?? null);
  const [progressByChild, setProgressByChild] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressByChild));
  }, [progressByChild]);

  const selectedChild = managedChildren.find((child) => child.id === selectedChildId) ?? managedChildren[0];
  const childProgress = progressByChild[selectedChildId] ?? {};

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ecceCurriculum.filter((module) => {
      const progress = getModuleProgress(module, childProgress);
      const status = getStatus(progress);
      const matchesSection = module.section === activeSection;
      const matchesDomain = activeDomain === 'All Domains' || module.domains.includes(activeDomain);
      const matchesMonth = activeSection === 'foundations' || monthFilter === 'all' || module.month === Number(monthFilter);
      const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
      const matchesSearch = !query || [
        module.title,
        module.description,
        ...module.domains,
        ...module.activities.map((activity) => activity.name),
      ].join(' ').toLowerCase().includes(query);
      return matchesSection && matchesDomain && matchesMonth && matchesStatus && matchesSearch;
    });
  }, [activeSection, activeDomain, monthFilter, statusFilter, search, childProgress]);

  const sectionModules = ecceCurriculum.filter((module) => module.section === activeSection);
  const overallProgress = getChildOverallProgress(childProgress);
  const completedModules = ecceCurriculum.filter((module) => getModuleProgress(module, childProgress) === 100).length;
  const stars = Math.floor(overallProgress / 20);

  const statusCounts = ecceCurriculum.reduce(
    (acc, module) => {
      acc[getStatus(getModuleProgress(module, childProgress))] += 1;
      return acc;
    },
    { 'Not Started': 0, 'In Progress': 0, Completed: 0 } as Record<EcceStatus, number>,
  );

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#cbd5e1', '#f59e0b', '#10b981'],
      borderWidth: 0,
    }],
  };

  const toggleActivity = (moduleId: string, activityId: string) => {
    setProgressByChild((current) => ({
      ...current,
      [selectedChildId]: {
        ...current[selectedChildId],
        [activityId]: !current[selectedChildId]?.[activityId],
      },
    }));
    setExpandedModuleId(moduleId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <div className="border-b border-border/60 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-6 dark:from-sky-950/20 dark:via-card dark:to-amber-950/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Learning Progress</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Arunima ECCE curriculum mapped to child growth domains, activities, outcomes, indicators, and child-wise progress.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
            <Metric label="Overall" value={`${overallProgress}%`} tone="text-emerald-600" />
            <Metric label="Completed" value={completedModules} tone="text-sky-600" />
            <Metric label="Stars" value={`${stars}/5`} tone="text-amber-600" />
          </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[280px_1fr]">
        <aside className="space-y-5 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <p className="px-1 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sections</p>
            <button
              onClick={() => { setActiveSection('foundations'); setMonthFilter('all'); }}
              className={cn('mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-colors', activeSection === 'foundations' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
            >
              Foundations
              <span className="text-xs">{ecceCurriculum.filter((m) => m.section === 'foundations').length}</span>
            </button>
            <button
              onClick={() => setActiveSection('monthly')}
              className={cn('flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-colors', activeSection === 'monthly' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-300' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
            >
              Monthly Modules
              <span className="text-xs">{ecceCurriculum.filter((m) => m.section === 'monthly').length}</span>
            </button>
          </section>

          <DevelopmentCard
            childName={selectedChild?.name ?? 'Child'}
            ageLabel={selectedChild?.ageLabel ?? ''}
            overallProgress={overallProgress}
            completedModules={completedModules}
            stars={stars}
          />

          <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Child Dashboard</h3>
            </div>
            <select
              value={selectedChildId}
              onChange={(event) => setSelectedChildId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              {managedChildren.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
            <div className="mt-5 h-56">
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  cutout: '68%',
                }}
              />
            </div>
          </section>
        </aside>

        <main className="space-y-5">
          <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {(['All Domains', ...ecceDomains] as DomainFilter[]).map((domain) => {
                const active = activeDomain === domain;
                const Icon = domain === 'All Domains' ? Sparkles : domainUi[domain].icon;
                return (
                  <button
                    key={domain}
                    onClick={() => setActiveDomain(domain)}
                    className={cn('flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all', active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground')}
                  >
                    <Icon size={14} />
                    {domain}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_170px_180px]">
              <label className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search modules, activities, outcomes"
                  className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                disabled={activeSection === 'foundations'}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>Month {index + 1}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All Status' | EcceStatus)}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Curriculum modules</p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  {activeSection === 'foundations' ? 'Foundations of Early Childhood Education' : 'Monthly Learning Modules'}
                </h3>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{filteredModules.length}/{sectionModules.length} modules</span>
            </div>

            {filteredModules.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
                No ECCE modules match the current filters.
              </div>
            ) : (
              filteredModules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  progress={getModuleProgress(module, childProgress)}
                  expanded={expandedModuleId === module.id}
                  childProgress={childProgress}
                  onToggleExpanded={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                  onToggleActivity={(activityId) => toggleActivity(module.id, activityId)}
                  index={index}
                />
              ))
            )}
            </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-center shadow-sm dark:border-border dark:bg-background/80">
      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', tone)}>{value}</p>
    </div>
  );
}

function DevelopmentCard({
  childName,
  ageLabel,
  overallProgress,
  completedModules,
  stars,
}: {
  childName: string;
  ageLabel: string;
  overallProgress: number;
  completedModules: number;
  stars: number;
}) {
  return (
    <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50/60 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Development Card</p>
          <h3 className="mt-1 text-base font-bold text-foreground">{childName}</h3>
          <p className="text-xs text-muted-foreground">{ageLabel}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-background">
          <Award size={20} />
        </div>
      </div>
      <ProgressBar label="ECCE completion" value={overallProgress} className="mt-4" colorOverride="bg-amber-500" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/80 p-3 text-center dark:bg-background/60">
          <p className="text-lg font-bold text-foreground">{completedModules}</p>
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">Badges</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 text-center dark:bg-background/60">
          <div className="flex items-center justify-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={13} className={cn(index < stars && 'fill-current')} />
            ))}
          </div>
          <p className="mt-1 text-[9px] font-semibold uppercase text-muted-foreground">Milestones</p>
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  module,
  progress,
  expanded,
  childProgress,
  onToggleExpanded,
  onToggleActivity,
  index,
}: {
  module: EcceModule;
  progress: number;
  expanded: boolean;
  childProgress: Record<string, boolean>;
  onToggleExpanded: () => void;
  onToggleActivity: (activityId: string) => void;
  index: number;
}) {
  const status = getStatus(progress);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <button onClick={onToggleExpanded} className="flex w-full items-start justify-between gap-5 p-5 text-left sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {module.month && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Month {module.month}
              </span>
            )}
            <StatusBadge status={status} />
          </div>
          <h4 className="text-lg font-bold text-foreground">{module.title}</h4>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{module.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {module.domains.map((domain) => {
              const Icon = domainUi[domain].icon;
              return (
                <span key={domain} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold', domainUi[domain].bg, domainUi[domain].text, domainUi[domain].border)}>
                  <Icon size={12} />
                  {domain}
                </span>
              );
            })}
          </div>
          <ProgressBar label="Progress" value={progress} className="mt-5 max-w-2xl" />
        </div>
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
          <ChevronDown size={18} className={cn('text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border bg-background/35 p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-3">
            <DetailList title="Activities">
              {module.activities.map((activity) => {
                const done = childProgress[activity.id];
                return (
                  <button
                    key={activity.id}
                    onClick={() => onToggleActivity(activity.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm leading-5 text-foreground transition-colors hover:bg-accent"
                  >
                    {done ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} className="text-muted-foreground" />}
                    <span className={cn(done && 'line-through text-muted-foreground')}>{activity.name}</span>
                  </button>
                );
              })}
            </DetailList>
            <DetailList title="Learning Outcomes">
              {module.learningOutcomes.map((outcome) => (
                <li key={outcome} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground">{outcome}</li>
              ))}
            </DetailList>
            <DetailList title="Indicators">
              {module.indicators.map((indicator) => (
                <li key={indicator} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground">{indicator}</li>
              ))}
            </DetailList>
          </div>
        </div>
      )}
    </motion.article>
  );
}

function DetailList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function StatusBadge({ status }: { status: EcceStatus }) {
  return (
    <span className={cn(
      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
      status === 'Completed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      status === 'In Progress' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      status === 'Not Started' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    )}>
      {status}
    </span>
  );
}
