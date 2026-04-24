// ============================================================
// SUPERVISOR NUTRITION
// Block-level overview of THR and dietary diversity
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAWCs } from '../../data/mockData';
import { cn } from '../../utils';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { HeartPulse, Utensils, Apple, CheckCircle2, Download, PackageSearch, Soup } from 'lucide-react';
import { getNutritionNarrative, getTHRMetrics } from '../../data/supervisorInsights';

export function SupervisorNutrition() {
  const navigate = useNavigate();
  const [selectedAWC, setSelectedAWC] = useState<string>('all');

  const filteredAWCs = selectedAWC === 'all' ? mockAWCs : mockAWCs.filter(a => a.id === selectedAWC);

  const awcTHRData = filteredAWCs.map(awc => ({
    ...awc,
    ...getTHRMetrics(awc),
  }));

  const totalRegistered = filteredAWCs.reduce((acc, awc) => acc + awc.totalChildren, 0);
  const totalTHRDelivery = awcTHRData.reduce((acc, awc) => acc + awc.beneficiariesCovered, 0);
  const thrCoverageRate = Math.round((totalTHRDelivery / totalRegistered) * 100) || 0;
  const avgDietaryScore = awcTHRData.length
    ? Number((awcTHRData.reduce((sum, awc) => sum + awc.mddScore, 0) / awcTHRData.length).toFixed(1))
    : 0;

  const lowTHRAWCs = awcTHRData.filter(awc => awc.thrCoverage < 80);
  const lowDietaryDiversityAWCs = awcTHRData.filter((awc) => awc.mddScore < 3.6);
  const strongestNutritionCentre = [...awcTHRData].sort((a, b) => (b.thrCoverage + b.mddScore * 10) - (a.thrCoverage + a.mddScore * 10))[0];
  const nutritionPriorityQueue = [...awcTHRData]
    .sort((a, b) => ((80 - b.thrCoverage) + (3.8 - b.mddScore) * 10) - ((80 - a.thrCoverage) + (3.8 - a.mddScore) * 10))
    .slice(0, 3);

  const chartData = [
    { name: 'Week 1', coverage: 82 },
    { name: 'Week 2', coverage: 85 },
    { name: 'Week 3', coverage: 81 },
    { name: 'Week 4', coverage: thrCoverageRate },
  ];

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
      <section className="supervisor-hero border-amber-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,251,235,0.9))] dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),_transparent_32%),linear-gradient(135deg,rgba(120,53,15,0.18),rgba(2,6,23,0.9))]">
        <div className="supervisor-hero-grid">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm backdrop-blur dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <Apple size={14} />
              Supervisor Nutrition View
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Nutrition Tracking</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">Separate delivery bottlenecks from counselling gaps, compare THR reach with dietary diversity, and quickly surface which centres need supply action versus family-level behaviour support.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">THR Reach</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{thrCoverageRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Block-level coverage for this cycle.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Diet Quality</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{avgDietaryScore}/5</p>
                <p className="mt-1 text-xs text-muted-foreground">Average dietary diversity status.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Supply Alerts</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{lowTHRAWCs.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Centres below the expected supply floor.</p>
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
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">THR Coverage</p>
               <p className={cn("mt-3 text-4xl font-bold", thrCoverageRate >= 90 ? "text-emerald-500" : "text-amber-500")}>
                 {thrCoverageRate}%
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", thrCoverageRate >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>
               <Apple size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-sky-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.88))] dark:border-sky-900/40 dark:bg-[linear-gradient(145deg,rgba(12,74,110,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Avg Dietary Score</p>
               <p className="mt-3 text-4xl font-bold text-sky-500">
                 {avgDietaryScore}<span className="text-xl text-muted-foreground font-medium">/5</span>
               </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
               <Utensils size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-red-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,242,242,0.9))] dark:border-red-900/40 dark:bg-[linear-gradient(145deg,rgba(127,29,29,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Low THR AWCs (&lt;80%)</p>
               <p className={cn("mt-3 text-4xl font-bold", lowTHRAWCs.length > 0 ? "text-red-500" : "text-emerald-500")}>
                 {lowTHRAWCs.length}
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", lowTHRAWCs.length > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
               <HeartPulse size={20} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="supervisor-panel border-amber-100 bg-amber-50/70 dark:border-amber-900/30 dark:bg-amber-950/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Nutrition Insight</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">Distribution and diet quality are not failing in the same places.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {lowTHRAWCs.length} centres have a THR delivery problem, while {lowDietaryDiversityAWCs.length} centres show weak food diversity and may need counselling even if supplies are moving.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-amber-600 shadow-sm dark:bg-amber-900/30 dark:text-amber-300">
              <PackageSearch size={20} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-amber-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Covered Beneficiaries</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{totalTHRDelivery}</p>
              <p className="mt-1 text-xs text-muted-foreground">Children reached through THR this cycle.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-amber-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low Diversity Centres</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{lowDietaryDiversityAWCs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Need food counselling, not only supply action.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-amber-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">THR Pressure</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{lowTHRAWCs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Centres below the 80% coverage floor.</p>
            </div>
          </div>
        </div>

        <div className="supervisor-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Strongest Nutrition Centre</h3>
            <Soup className="text-emerald-500" size={20} />
          </div>
          {strongestNutritionCentre ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{strongestNutritionCentre.name}</p>
                  <p className="text-sm text-muted-foreground">{strongestNutritionCentre.workerName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {strongestNutritionCentre.thrCoverage}% THR
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dietary Diversity</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{strongestNutritionCentre.mddScore}/5</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Supply Risk</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{strongestNutritionCentre.supplyRisk}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{getNutritionNarrative(strongestNutritionCentre)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No nutrition data is available for the selected filter.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="supervisor-panel">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Block THR Distribution Trend</h3>
              <p className="mt-1 text-sm text-muted-foreground">Weekly view anchors the current cycle so dips are easier to read.</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Week 4 reflects current selection
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={['auto', 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="coverage" stroke="#10b981" fillOpacity={1} fill="url(#colorCoverage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="supervisor-panel flex h-full flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 Supply Chain Alerts
              </h3>
            </div>
            
            {lowTHRAWCs.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                 <CheckCircle2 className="h-12 w-12 text-emerald-500/20 mb-3" />
                 <p className="text-sm">All centres are reporting regular THR receipt and distribution.</p>
               </div>
            ) : (
               <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 <p className="text-sm text-muted-foreground mb-4">Centres reporting less than 80% Take Home Ration coverage for eligible children and mothers.</p>
                 {lowTHRAWCs.map(awc => (
                   <div key={awc.id} className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/10 flex flex-col gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-semibold text-foreground text-sm">{awc.name}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">{awc.workerName}</p>
                       </div>
                       <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg text-xs font-bold">
                         Coverage: {awc.thrCoverage}%
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <div className="supervisor-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Priority Follow-up Queue</h3>
              <HeartPulse className="text-red-500" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {nutritionPriorityQueue.map((awc) => (
                <div
                  key={awc.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/supervisor/awc/${awc.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{awc.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getNutritionNarrative(awc)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{awc.thrCoverage}% THR</p>
                      <p className="text-xs text-muted-foreground">{awc.mddScore}/5 MDD</p>
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
            <h3 className="text-lg font-semibold text-foreground">Dietary Diversity & Nutrition Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl border-b border-border">AWC Name</th>
                <th className="px-6 py-4 border-b border-border">Worker</th>
                <th className="px-6 py-4 border-b border-border">Eligible</th>
                <th className="px-6 py-4 border-b border-border text-center">THR Coverage</th>
                <th className="px-6 py-4 border-b border-border text-center">Avg Dietary Score (MDD)</th>
                <th className="px-6 py-4 rounded-tr-xl border-b border-border text-center">Insight</th>
              </tr>
            </thead>
            <tbody>
              {awcTHRData.map((awc) => (
                <tr key={awc.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground cursor-pointer hover:text-sky-500 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                    {awc.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{awc.workerName}</td>
                  <td className="px-6 py-4">{awc.totalChildren}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", 
                       awc.thrCoverage >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                       awc.thrCoverage >= 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                       'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    )}>
                      {awc.thrCoverage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {awc.mddScore} / 5
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                    {awc.supplyRisk === 'High' ? 'Escalate supply' : awc.mddScore < 3.6 ? 'Counselling focus' : 'Stable'}
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
