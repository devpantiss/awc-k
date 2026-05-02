// ============================================================
// SUPERVISOR AWC DETAIL - Drill down into a specific AWC
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { mockAWCs, mockChildren } from '../../data/mockData';
import { cn, simulateAPI, formatAge } from '../../utils';
import { DashboardSkeleton } from '../../components/ui/loading-skeleton';
import type { AWC, Child } from '../../types';
import {
  ArrowLeft, BookOpen, Activity,
  Phone, MapPin, AlertTriangle, HeartPulse,
} from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type NutritionBand = 'Normal' | 'MAM' | 'SAM';

const nutritionTone: Record<NutritionBand, string> = {
  Normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  MAM: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  SAM: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

function normalizeNutritionStatus(status: string): NutritionBand {
  if (status === 'status.sam' || status === 'SAM' || status === 'Severe') return 'SAM';
  if (status === 'status.mam' || status === 'MAM' || status === 'Moderate') return 'MAM';
  return 'Normal';
}

function getBandFromMuac(muacMm: number): NutritionBand {
  if (muacMm < 115) return 'SAM';
  if (muacMm < 125) return 'MAM';
  return 'Normal';
}

export function AWCDetail() {
  const { awcId } = useParams<{ awcId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [awc, setAwc] = useState<AWC | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const foundAWC = mockAWCs.find(a => a.id === awcId);
    const awcChildren = mockChildren.filter((child) => child.awcId === awcId);
    simulateAPI({ awc: foundAWC, children: awcChildren }, 800).then(({ awc, children }) => {
      setAwc(awc || null);
      setChildren(children);
      setLoading(false);
    });
  }, [awcId]);

  if (loading) return <DashboardSkeleton />;
  if (!awc) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">{t('awc_detail.not_found')}</p>
      <button onClick={() => navigate('/supervisor')} className="mt-4 text-blue-600 hover:underline text-sm">
        ← {t('awc_detail.back')}
      </button>
    </div>
  );

  const nutritionChart = [
    { name: t('nutrition.normal'), count: awc.nutritionBreakdown.normal, fill: '#10b981' },
    { name: t('nutrition.mam'), count: awc.nutritionBreakdown.mam, fill: '#f59e0b' },
    { name: t('nutrition.sam'), count: awc.nutritionBreakdown.sam, fill: '#ef4444' },
  ];

  const getNutritionLocal = (status: string) => {
    switch (normalizeNutritionStatus(status)) {
      case 'Normal': return t('nutrition.normal');
      case 'MAM': return t('nutrition.mam');
      case 'SAM': return t('nutrition.sam');
      default: return status;
    }
  };

  const childForecasts = children
    .map((child) => {
      const history = child.nutritionHistory ?? [];
      const latest = history.at(-1);
      const previous = history.at(-2);
      const muacGain = latest && previous ? latest.muac - previous.muac : 0;
      const projectedMuac = latest ? Math.round(latest.muac + muacGain) : 125;
      const currentBand = normalizeNutritionStatus(child.nutritionStatus);
      const predictedBand = getBandFromMuac(projectedMuac);
      const confidence = Math.max(62, Math.min(93, 70 + history.length * 2 + (child.attendanceRate >= 80 ? 5 : 0)));

      return {
        id: child.id,
        name: child.name,
        age: formatAge(child.ageMonths, t),
        learning: child.learningScore,
        attendance: child.attendanceRate,
        currentBand,
        predictedBand,
        projectedMuac,
        confidence,
        riskRank: predictedBand === 'SAM' ? 0 : predictedBand === 'MAM' ? 1 : 2,
      };
    })
    .sort((a, b) => a.riskRank - b.riskRank || a.attendance - b.attendance);

  const centreDashboardSections = [
    {
      title: 'Attendance',
      subtitle: 'Daily presence and absenteeism follow-up',
      icon: Activity,
      tone: awc.attendanceRate >= 85 ? 'emerald' : awc.attendanceRate >= 70 ? 'amber' : 'red',
      metrics: [
        { label: 'Present Today', value: `${awc.presentToday}/${awc.totalChildren}` },
        { label: 'Attendance Rate', value: `${awc.attendanceRate}%` },
      ],
    },
    {
      title: 'Learning',
      subtitle: 'Average child learning performance',
      icon: BookOpen,
      tone: awc.avgLearningScore >= 70 ? 'emerald' : awc.avgLearningScore >= 50 ? 'amber' : 'red',
      metrics: [
        { label: 'Avg Score', value: `${awc.avgLearningScore}%` },
        { label: 'Children Reviewed', value: children.length },
      ],
    },
    {
      title: 'Nutrition & Health',
      subtitle: 'SAM/MAM load and critical follow-up',
      icon: HeartPulse,
      tone: awc.criticalCases > 0 || awc.nutritionBreakdown.sam > 0 ? 'red' : awc.nutritionBreakdown.mam > 0 ? 'amber' : 'emerald',
      metrics: [
        { label: 'SAM / MAM', value: `${awc.nutritionBreakdown.sam}/${awc.nutritionBreakdown.mam}` },
        { label: 'Critical Cases', value: awc.criticalCases },
      ],
    },
  ];
  const supervisorActions = [
    {
      label: awc.syncStatus === 'synced' ? 'Confirm data quality' : 'Request data sync',
      detail: awc.syncStatus === 'synced' ? 'Latest records are available for review.' : 'Worker should sync attendance, nutrition, and immunization entries.',
      tone: awc.syncStatus === 'synced' ? 'emerald' : awc.syncStatus === 'pending' ? 'amber' : 'red',
    },
    {
      label: awc.nutritionBreakdown.sam > 0 ? 'Verify SAM follow-up' : 'Routine nutrition review',
      detail: awc.nutritionBreakdown.sam > 0 ? `${awc.nutritionBreakdown.sam} SAM case(s) need referral and home-visit verification.` : 'Nutrition load is within routine monitoring range.',
      tone: awc.nutritionBreakdown.sam > 0 ? 'red' : 'emerald',
    },
    {
      label: awc.attendanceRate < 75 ? 'Call worker for attendance plan' : 'Attendance stable',
      detail: awc.attendanceRate < 75 ? 'Discuss absent children, family follow-ups, and recovery plan.' : 'Attendance does not need urgent escalation.',
      tone: awc.attendanceRate < 75 ? 'amber' : 'emerald',
    },
    {
      label: awc.avgLearningScore < 60 ? 'Schedule pedagogy support' : 'Learning review',
      detail: awc.avgLearningScore < 60 ? 'Plan TLM support or classroom observation for this centre.' : 'Learning indicators are suitable for periodic review.',
      tone: awc.avgLearningScore < 60 ? 'amber' : 'emerald',
    },
  ];

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/supervisor')} className="rounded-2xl border border-border p-2.5 text-muted-foreground transition-colors hover:bg-accent">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{awc.name}</h2>
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              awc.status === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' :
              awc.status === 'Warning' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
              'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
            )}>
              {awc.status === 'Good' ? t('status.good') : awc.status === 'Warning' ? t('status.warning') : t('status.critical')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1"><MapPin size={12} /> {awc.location}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {awc.workerName} · {awc.workerPhone}</span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      {awc.alerts.length > 0 && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} /> {t('awc_detail.active_alerts')}
          </h4>
          <ul className="space-y-1">
            {awc.alerts.map((alert, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Centre Performance Dashboard</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{awc.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Supervisor monitoring across attendance, learning, nutrition, immunization, and follow-up readiness. Worker: {awc.workerName}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-foreground">
            <Phone size={16} />
            {awc.workerPhone}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {centreDashboardSections.map((section) => (
            <div key={section.title} className="rounded-[1.75rem] border border-border bg-background/60 p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  section.tone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                  section.tone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                  section.tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                )}>
                  <section.icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{section.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{section.subtitle}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {section.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-border bg-card px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Supervisor action tracker</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Follow-up Plan</h3>
            <p className="mt-2 text-sm text-muted-foreground">Dummy workflow for calls, visits, sync requests, and service-delivery verification.</p>
          </div>
          <span className={cn(
            'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
            awc.syncStatus === 'synced' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            awc.syncStatus === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            awc.syncStatus === 'error' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          )}>
            Sync: {awc.syncStatus}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {supervisorActions.map((action) => (
            <div key={action.label} className={cn(
              'rounded-2xl border p-4',
              action.tone === 'emerald' && 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/10',
              action.tone === 'amber' && 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/10',
              action.tone === 'red' && 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/10',
            )}>
              <p className="text-sm font-bold text-foreground">{action.label}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{action.detail}</p>
              <button className="mt-4 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
                Mark reviewed
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition Breakdown Chart */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('awc_detail.nutrition_breakdown')}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={nutritionChart} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={80} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {nutritionChart.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Children List */}
      <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Child-wise forecast</p>
            <h3 className="text-lg font-semibold text-foreground">{t('awc_detail.children_enrolled', { count: children.length })}</h3>
          </div>
          <p className="text-sm text-muted-foreground">Next-month nutrition band prediction for children under this centre.</p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">{t('awc_detail.table.name')}</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">{t('awc_detail.table.age')}</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">{t('awc_detail.table.learning')}</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Current</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Next Month</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">MUAC</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">{t('awc_detail.table.attendance')}</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">{t('awc_detail.table.risk')}</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {childForecasts.map((child) => (
              <tr
                key={child.id}
                className="cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/50"
                onClick={() => navigate(`/supervisor/child/${child.id}`, { state: { from: `/supervisor/awc/${awc.id}`, fromLabel: awc.workerName } })}
              >
                <td className="py-2.5 px-3 font-medium text-foreground">{child.name}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground">{child.age}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={cn('font-semibold',
                    child.learning >= 70 ? 'text-emerald-600' : child.learning >= 40 ? 'text-amber-600' : 'text-red-600'
                  )}>{child.learning}%</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', nutritionTone[child.currentBand])}>{getNutritionLocal(child.currentBand)}</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', nutritionTone[child.predictedBand])}>{child.predictedBand}</span>
                </td>
                <td className="py-2.5 px-3 text-center text-muted-foreground">
                  {child.projectedMuac} mm
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={cn('font-semibold',
                    child.attendance >= 85 ? 'text-emerald-600' : child.attendance >= 70 ? 'text-amber-600' : 'text-red-600'
                  )}>{child.attendance}%</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-xs font-semibold text-muted-foreground">{child.confidence}% confidence</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Open Child</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {childForecasts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background/70 p-8 text-center text-sm text-muted-foreground">
            No child-level dummy records are attached to this centre yet. Centre-level KPIs are still available above.
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
