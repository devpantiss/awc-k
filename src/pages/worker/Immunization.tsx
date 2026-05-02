import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Save,
  ShieldCheck,
  Syringe,
  UserRoundCheck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { managedChildren, immunizationByChild, getVaccineCompletionCount } from '../../data/childMonitoringData';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { cn } from '../../utils';

const vaccineLabels = [
  { key: 'BCG', label: 'BCG', due: 'At birth', protection: 'Tuberculosis', route: 'Intradermal' },
  { key: 'OPV', label: 'OPV', due: 'Birth / routine', protection: 'Polio', route: 'Oral drops' },
  { key: 'DPT', label: 'DPT', due: '6, 10, 14 weeks', protection: 'Diphtheria, Pertussis, Tetanus', route: 'Injection' },
  { key: 'Measles', label: 'Measles', due: '9-12 months', protection: 'Measles', route: 'Injection' },
  { key: 'vitaminA', label: 'Vitamin A', due: '9 months onward', protection: 'Vitamin A deficiency', route: 'Oral dose' },
] as const;

type VaccineKey = (typeof vaccineLabels)[number]['key'];

type SavedImmunizationState = {
  tracker: Record<VaccineKey, boolean>;
  vaccineDates: Partial<Record<VaccineKey, string>>;
  nextVisitDate: string;
  remarks: string;
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultDates(tracker: Record<VaccineKey, boolean>) {
  return Object.fromEntries(
    vaccineLabels
      .filter((vaccine) => tracker[vaccine.key])
      .map((vaccine) => [vaccine.key, '2026-04-24'])
  ) as Partial<Record<VaccineKey, string>>;
}

function formatVaccineDate(date: string) {
  if (!date) return 'Date not set';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCompletionTone(percent: number) {
  if (percent >= 90) return 'emerald';
  if (percent >= 60) return 'amber';
  return 'red';
}

export function Immunization() {
  const [selectedChildId, setSelectedChildId] = useState(managedChildren[0].id);
  const [savedRecordsByChild, setSavedRecordsByChild] = useState<Record<string, SavedImmunizationState>>(() =>
    Object.fromEntries(
      managedChildren.map((child) => {
        const tracker = immunizationByChild[child.id] as Record<VaccineKey, boolean>;
        return [
          child.id,
          {
            tracker,
            vaccineDates: getDefaultDates(tracker),
            nextVisitDate: '2026-05-07',
            remarks: '',
          },
        ];
      })
    )
  );
  const [tracker, setTracker] = useState<Record<VaccineKey, boolean>>(
    savedRecordsByChild[selectedChildId]?.tracker ?? (immunizationByChild[selectedChildId] as Record<VaccineKey, boolean>)
  );
  const [vaccineDates, setVaccineDates] = useState<Partial<Record<VaccineKey, string>>>(
    savedRecordsByChild[selectedChildId]?.vaccineDates ?? {}
  );
  const [nextVisitDate, setNextVisitDate] = useState(savedRecordsByChild[selectedChildId]?.nextVisitDate ?? '2026-05-07');
  const [remarks, setRemarks] = useState(savedRecordsByChild[selectedChildId]?.remarks ?? '');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const savedState = savedRecordsByChild[selectedChildId];
    setTracker(savedState?.tracker ?? (immunizationByChild[selectedChildId] as Record<VaccineKey, boolean>));
    setVaccineDates(savedState?.vaccineDates ?? {});
    setNextVisitDate(savedState?.nextVisitDate ?? '2026-05-07');
    setRemarks(savedState?.remarks ?? '');
    setSaveMessage('');
  }, [selectedChildId, savedRecordsByChild]);

  const selectedChild = managedChildren.find((child) => child.id === selectedChildId) ?? managedChildren[0];
  const dueVaccines = vaccineLabels.filter((vaccine) => !tracker[vaccine.key]);
  const completionCount = getVaccineCompletionCount(tracker);
  const completionPercent = Math.round((completionCount / vaccineLabels.length) * 100);
  const completionTone = getCompletionTone(completionPercent);

  const savedVaccineEntries = useMemo(
    () =>
      vaccineLabels.map((vaccine) => ({
        ...vaccine,
        done: tracker[vaccine.key],
        date: vaccineDates[vaccine.key] || '',
      })),
    [tracker, vaccineDates]
  );

  const childRoster = useMemo(
    () =>
      managedChildren.map((child) => {
        const record = savedRecordsByChild[child.id];
        const childTracker = record?.tracker ?? (immunizationByChild[child.id] as Record<VaccineKey, boolean>);
        const completed = getVaccineCompletionCount(childTracker);
        const percent = Math.round((completed / vaccineLabels.length) * 100);
        const pending = vaccineLabels.filter((vaccine) => !childTracker[vaccine.key]).map((vaccine) => vaccine.label);
        return {
          child,
          completed,
          percent,
          pending,
          nextVisitDate: record?.nextVisitDate ?? '2026-05-07',
        };
      }),
    [savedRecordsByChild]
  );

  const coverageData = vaccineLabels.map((vaccine) => {
    const covered = childRoster.filter((item) => {
      const record = savedRecordsByChild[item.child.id];
      const childTracker = record?.tracker ?? (immunizationByChild[item.child.id] as Record<VaccineKey, boolean>);
      return childTracker[vaccine.key];
    }).length;

    return {
      vaccine: vaccine.label,
      coverage: Math.round((covered / managedChildren.length) * 100),
      covered,
    };
  });

  const fullyImmunized = childRoster.filter((item) => item.completed === vaccineLabels.length).length;
  const childrenDue = childRoster.filter((item) => item.pending.length > 0).length;
  const lowCoverageVaccines = coverageData.filter((item) => item.coverage < 80);
  const nextDueVaccine = dueVaccines[0];

  const handleSave = () => {
    const nextDates: Partial<Record<VaccineKey, string>> = {};
    vaccineLabels.forEach((vaccine) => {
      if (tracker[vaccine.key]) {
        nextDates[vaccine.key] = vaccineDates[vaccine.key] || getTodayIso();
      }
    });

    setSavedRecordsByChild((current) => ({
      ...current,
      [selectedChildId]: {
        tracker: { ...tracker },
        vaccineDates: nextDates,
        nextVisitDate,
        remarks,
      },
    }));

    setVaccineDates(nextDates);
    setSaveMessage('Immunization record saved.');
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_36%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_36%)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-900/50 dark:bg-slate-950/40 dark:text-sky-300">
                <Syringe size={14} />
                Child vaccine register
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Immunization</h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                Track doses, due vaccines, next visits, and centre coverage.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="h-10 rounded-xl bg-background/90 sm:w-64">
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {managedChildren.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="h-10 rounded-xl gap-2 px-4">
                <Save size={16} />
                Save Record
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Fully immunized', value: `${fullyImmunized}/${managedChildren.length}`, detail: 'Children with all tracked doses', icon: ShieldCheck, tone: 'emerald' },
          { label: 'Children due', value: childrenDue, detail: 'Need one or more vaccines', icon: AlertTriangle, tone: 'amber' },
          { label: 'Selected progress', value: `${completionPercent}%`, detail: `${completionCount}/${vaccineLabels.length} vaccines complete`, icon: UserRoundCheck, tone: completionTone },
          { label: 'Next visit', value: formatVaccineDate(nextVisitDate), detail: nextDueVaccine ? `${nextDueVaccine.label} pending` : 'Routine follow-up only', icon: CalendarClock, tone: 'sky' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-[1.35rem] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{metric.label}</p>
                <p className="mt-1.5 text-xl font-bold text-foreground">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
              </div>
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                metric.tone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                metric.tone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                metric.tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                metric.tone === 'sky' && 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
              )}>
                <metric.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Selected child</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedChild.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedChild.ageLabel} • {selectedChild.gender} • Parent: {selectedChild.parentName}
                </p>
              </div>
              <span className={cn(
                'w-fit rounded-full px-3 py-1 text-xs font-bold uppercase',
                completionTone === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                completionTone === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                completionTone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              )}>
                {completionPercent}% complete
              </span>
            </div>

            <div className="mt-4">
              <Progress value={completionPercent} className="h-3 bg-sky-100 dark:bg-sky-950/40" />
            </div>

            <div className="mt-4 grid gap-3">
              {savedVaccineEntries.map((vaccine) => (
                <div
                  key={vaccine.key}
                  className={cn(
                    'rounded-2xl border p-3 transition-colors',
                    vaccine.done
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                      : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10'
                  )}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={vaccine.done}
                        onChange={(event) => {
                          const checked = event.target.checked;

                          setTracker((current) => ({ ...current, [vaccine.key]: checked }));

                          if (!checked) {
                            setVaccineDates((current) => {
                              const next = { ...current };
                              delete next[vaccine.key];
                              return next;
                            });
                            return;
                          }

                          setVaccineDates((current) => ({
                            ...current,
                            [vaccine.key]: current[vaccine.key] || getTodayIso(),
                          }));
                        }}
                        className="mt-1 h-5 w-5 cursor-pointer rounded border-border text-primary accent-sky-500 focus:ring-primary"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">{vaccine.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{vaccine.protection}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Due: {vaccine.due}
                          </span>
                          <span className="rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {vaccine.route}
                          </span>
                        </div>
                      </div>
                    </label>

                    <div className="min-w-[11rem]">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Administered</label>
                      <Input
                        type="date"
                        disabled={!vaccine.done}
                        value={vaccine.date}
                        onChange={(event) =>
                          setVaccineDates((current) => ({ ...current, [vaccine.key]: event.target.value }))
                        }
                        className="mt-1.5 h-9 bg-background text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Centre coverage</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">Coverage by Vaccine</h3>
              </div>
              <ClipboardList size={20} className="text-sky-500" />
            </div>
            <div className="mt-4 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="vaccine" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '0.9rem', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="coverage" name="Coverage" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {saveMessage ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 size={14} />
              {saveMessage}
            </div>
          ) : null}

          {dueVaccines.length > 0 ? (
            <Alert
              tone="warning"
              title="Due Vaccine Alert"
              description={`${dueVaccines.map((item) => item.label).join(', ')} still need to be completed for ${selectedChild.name}.`}
              action={
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle size={14} />
                  Schedule next session
                </div>
              }
            />
          ) : (
            <Alert tone="success" title="All vaccines complete" description={`${selectedChild.name} has completed the tracked immunization schedule.`} />
          )}

          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Saved Vaccine Dates</h3>
            <div className="mt-3 space-y-2">
              {savedVaccineEntries.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.done ? 'Completed' : 'Pending'}</p>
                  </div>
                  <p className={cn('text-sm font-medium', item.date ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground')}>
                    {item.date ? formatVaccineDate(item.date) : 'Date not set'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Next Session Plan</h3>
            <div className="mt-3 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next visit date</label>
              <Input type="date" value={nextVisitDate} onChange={(event) => setNextVisitDate(event.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Remarks</label>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Cold chain note, parent counselling, outreach plan..."
                className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Class roster</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">Children Needing Follow-up</h3>
          </div>
          {lowCoverageVaccines.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Low coverage: {lowCoverageVaccines.map((item) => item.vaccine).join(', ')}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Coverage healthy
            </span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="rounded-tl-xl px-4 py-2.5 font-medium">Child</th>
                <th className="px-4 py-2.5 font-medium">Parent</th>
                <th className="px-4 py-2.5 font-medium">Coverage</th>
                <th className="px-4 py-2.5 font-medium">Pending</th>
                <th className="rounded-tr-xl px-4 py-2.5 font-medium">Next Visit</th>
              </tr>
            </thead>
            <tbody>
              {childRoster.map((item) => (
                <tr key={item.child.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-foreground">{item.child.name}</p>
                    <p className="text-xs text-muted-foreground">{item.child.ageLabel} • {item.child.gender}</p>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.child.parentName}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Progress value={item.percent} className="h-2 w-28 bg-sky-100 dark:bg-sky-950/40" />
                      <span className="text-xs font-bold text-foreground">{item.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {item.pending.length > 0 ? item.pending.join(', ') : 'None'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatVaccineDate(item.nextVisitDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
