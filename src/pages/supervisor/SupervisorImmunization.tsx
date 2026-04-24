// ============================================================
// SUPERVISOR IMMUNIZATION
// Block-level overview of Immunization coverage
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAWCs } from '../../data/mockData';
import { cn } from '../../utils';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Syringe, ShieldCheck, AlertTriangle, Download, ListChecks, ShieldPlus } from 'lucide-react';
import { getImmunizationMetrics, getImmunizationNarrative } from '../../data/supervisorInsights';

export function SupervisorImmunization() {
  const navigate = useNavigate();
  const [selectedAWC, setSelectedAWC] = useState<string>('all');

  const filteredAWCs = selectedAWC === 'all' ? mockAWCs : mockAWCs.filter(a => a.id === selectedAWC);

  const awcImmuneData = filteredAWCs.map(awc => ({
    ...awc,
    ...getImmunizationMetrics(awc),
  }));

  const totalRegistered = filteredAWCs.reduce((acc, awc) => acc + awc.totalChildren, 0);
  const totalCovered = awcImmuneData.reduce((acc, awc) => acc + Math.floor((awc.coverage / 100) * awc.totalChildren), 0);
  const totalOverdue = awcImmuneData.reduce((acc, awc) => acc + awc.dueCount, 0);
  const avgCoverage = Math.round((totalCovered / totalRegistered) * 100) || 0;

  const lowCoverageAWCs = awcImmuneData.filter(awc => awc.coverage < 85);
  const highDuePressure = awcImmuneData.filter((awc) => awc.dueCount >= 5);
  const strongestImmunizationCentre = [...awcImmuneData].sort((a, b) => b.coverage - a.coverage || a.dueCount - b.dueCount)[0];
  const immunizationQueue = [...awcImmuneData]
    .sort((a, b) => ((100 - b.coverage) + b.dueCount * 2) - ((100 - a.coverage) + a.dueCount * 2))
    .slice(0, 3);

  const chartData = awcImmuneData.map(awc => ({
    name: awc.name.split(' ')[1] || awc.name,
    coverage: awc.coverage
  }));

  const handleDownloadReport = () => {
    const headers = [
      'AWC Name', 'Worker', 'Total Enrolled', 'Present Today', 'Attendance Rate (%)',
      'SAM Cases', 'MAM Cases', 'Normal Weight', 
      'Avg Learning Score', 
      'THR Coverage (%)', 'MDD Score',
      'Immunization Coverage (%)'
    ];
    
    const rows = filteredAWCs.map(awc => {
      const seed = awc.name.charCodeAt(0) + awc.name.charCodeAt(awc.name.length-1);
      const thrCoverage = Math.floor((seed % 30) + 70);
      const mddScore = ((seed % 20) / 10 + 3).toFixed(1);
      const immCoverage = Math.floor((seed % 25) + 75);

      return [
        awc.name, awc.workerName, awc.totalChildren, awc.presentToday, awc.attendanceRate,
        awc.nutritionBreakdown.sam, awc.nutritionBreakdown.mam, awc.nutritionBreakdown.normal,
        awc.avgLearningScore,
        thrCoverage, mddScore,
        immCoverage
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `AWC_Comprehensive_Report_${selectedAWC === 'all' ? 'All_Centres' : selectedAWC}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="supervisor-page-shell">
      <section className="supervisor-hero border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] dark:border-sky-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),_transparent_32%),linear-gradient(135deg,rgba(12,74,110,0.18),rgba(2,6,23,0.9))]">
        <div className="supervisor-hero-grid">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm backdrop-blur dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300">
              <ShieldCheck size={14} />
              Supervisor Immunization View
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Immunization Coverage</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">Watch coverage against the UIP schedule, distinguish low-performing centres from overdue-list pileups, and make the tracing workload visible before the next outreach session.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Coverage Rate</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{avgCoverage}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Estimated block completion level.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overdue Children</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{totalOverdue}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pending follow-up before next session.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Due Pressure Sites</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{highDuePressure.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Centres where tracing lists are growing.</p>
              </div>
            </div>
          </div>
          <div className="supervisor-toolbar lg:justify-end">
            <select
              className="supervisor-select"
              value={selectedAWC}
              onChange={(e) => setSelectedAWC(e.target.value)}
            >
              <option value="all">All Centres</option>
              {mockAWCs.map(awc => (
                <option key={awc.id} value={awc.id}>{awc.name}</option>
              ))}
            </select>
            <button onClick={handleDownloadReport} className="supervisor-export-button">
              <Download size={18} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="supervisor-kpi-card border-emerald-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.88))] dark:border-emerald-900/40 dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Block Coverage</p>
               <p className={cn("mt-3 text-4xl font-bold", avgCoverage >= 90 ? "text-emerald-500" : "text-amber-500")}>
                 {avgCoverage}%
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", avgCoverage >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>
               <ShieldCheck size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-red-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,242,242,0.9))] dark:border-red-900/40 dark:bg-[linear-gradient(145deg,rgba(127,29,29,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total Overdue</p>
               <p className={cn("mt-3 text-4xl font-bold", totalOverdue > 0 ? "text-red-500" : "text-emerald-500")}>
                 {totalOverdue}
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", totalOverdue > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
               <Syringe size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,251,235,0.88))] dark:border-amber-900/40 dark:bg-[linear-gradient(145deg,rgba(120,53,15,0.26),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Low Coverage Centres</p>
               <p className={cn("mt-3 text-4xl font-bold", lowCoverageAWCs.length > 0 ? "text-red-500" : "text-emerald-500")}>
                 {lowCoverageAWCs.length}
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", lowCoverageAWCs.length > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
               <AlertTriangle size={20} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="supervisor-panel border-sky-100 bg-sky-50/70 dark:border-sky-900/30 dark:bg-sky-950/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Coverage Insight</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">The main issue is follow-up discipline, not universal vaccine refusal.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {lowCoverageAWCs.length} centres are below the 85% floor, but {highDuePressure.length} centres specifically show overdue-list buildup and need targeted tracing before the next outreach day.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-sky-600 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
              <ListChecks size={20} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-sky-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Children Covered</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{totalCovered}</p>
              <p className="mt-1 text-xs text-muted-foreground">Estimated from centre-wise coverage.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-sky-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overdue Pressure</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{highDuePressure.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Centres with 5 or more pending follow-ups.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-sky-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low Coverage Centres</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{lowCoverageAWCs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Need direct supervisory review.</p>
            </div>
          </div>
        </div>

        <div className="supervisor-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Best Immunization Performer</h3>
            <ShieldPlus className="text-emerald-500" size={20} />
          </div>
          {strongestImmunizationCentre ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{strongestImmunizationCentre.name}</p>
                  <p className="text-sm text-muted-foreground">{strongestImmunizationCentre.workerName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {strongestImmunizationCentre.coverage}% covered
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overdue Children</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{strongestImmunizationCentre.dueCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Follow-up Cadence</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{strongestImmunizationCentre.followUpIntensity}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{getImmunizationNarrative(strongestImmunizationCentre)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No immunization data is available for the selected filter.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="supervisor-panel">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Immunization Coverage By AWC</h3>
              <p className="mt-1 text-sm text-muted-foreground">Centre-level coverage curve makes drop-offs and outliers more visible.</p>
            </div>
            <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              Below 85% needs review
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImmune" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={['auto', 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="coverage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorImmune)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="supervisor-panel flex h-full flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 <AlertTriangle className="text-red-500" size={20} />
                 Action Needed
              </h3>
            </div>
            
            {lowCoverageAWCs.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                 <ShieldCheck className="h-12 w-12 text-emerald-500/20 mb-3" />
                 <p className="text-sm">All centres have high immunization rates above 85%.</p>
               </div>
            ) : (
               <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 {lowCoverageAWCs.map(awc => (
                   <div key={awc.id} className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/10 flex flex-col gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="font-semibold text-foreground text-sm">{awc.name}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">{awc.workerName}</p>
                       </div>
                       <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg text-xs font-bold">
                         Coverage: {awc.coverage}%
                       </span>
                     </div>
                     <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">{awc.dueCount} children overdue</p>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <div className="supervisor-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Follow-up Queue</h3>
              <Syringe className="text-red-500" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {immunizationQueue.map((awc) => (
                <div
                  key={awc.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/supervisor/awc/${awc.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{awc.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getImmunizationNarrative(awc)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{awc.coverage}% coverage</p>
                      <p className="text-xs text-muted-foreground">{awc.dueCount} overdue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Immunization Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl border-b border-border">AWC Name</th>
                <th className="px-6 py-4 border-b border-border">Eligible Children</th>
                <th className="px-6 py-4 border-b border-border text-center">Coverage Rate</th>
                <th className="px-6 py-4 border-b border-border text-center">Overdue Vaccines</th>
                <th className="px-6 py-4 rounded-tr-xl border-b border-border text-center">Action Window</th>
              </tr>
            </thead>
            <tbody>
              {awcImmuneData.map((awc) => (
                <tr key={awc.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground cursor-pointer hover:text-sky-500 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                    {awc.name}
                  </td>
                  <td className="px-6 py-4">{awc.totalChildren}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", 
                       awc.coverage >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                       awc.coverage >= 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                       'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    )}>
                      {awc.coverage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("font-medium", awc.dueCount > 0 ? "text-red-500" : "text-emerald-500")}>
                      {awc.dueCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                    {awc.followUpIntensity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
