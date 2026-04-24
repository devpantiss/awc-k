// ============================================================
// SUPERVISOR GROWTH MONITORING
// Block-level overview of SAM/MAM children and growth trends
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAWCs } from '../../data/mockData';
import { cn, formatIndianNumber } from '../../utils';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { Activity, AlertTriangle, Scale, Target, TrendingUp, Download, ShieldAlert, HeartPulse } from 'lucide-react';
import { getGrowthNarrative, getNutritionBurden } from '../../data/supervisorInsights';

export function SupervisorGrowth() {
  const navigate = useNavigate();
  const [selectedAWC, setSelectedAWC] = useState<string>('all');

  const filteredAWCs = selectedAWC === 'all' ? mockAWCs : mockAWCs.filter(a => a.id === selectedAWC);

  const totalRegistered = filteredAWCs.reduce((acc, awc) => acc + awc.totalChildren, 0);
  const totalSAM = filteredAWCs.reduce((acc, awc) => acc + awc.nutritionBreakdown.sam, 0);
  const totalMAM = filteredAWCs.reduce((acc, awc) => acc + awc.nutritionBreakdown.mam, 0);
  const totalNormal = filteredAWCs.reduce((acc, awc) => acc + awc.nutritionBreakdown.normal, 0);

  const samPercentage = Math.round((totalSAM / totalRegistered) * 100) || 0;
  const mamPercentage = Math.round((totalMAM / totalRegistered) * 100) || 0;

  const awcWithCriticalSAM = filteredAWCs.filter(awc => awc.nutritionBreakdown.sam >= 2);
  const avgBurden = filteredAWCs.length
    ? Number((filteredAWCs.reduce((sum, awc) => sum + getNutritionBurden(awc), 0) / filteredAWCs.length).toFixed(1))
    : 0;
  const highestBurdenCentre = [...filteredAWCs].sort((a, b) => getNutritionBurden(b) - getNutritionBurden(a))[0];
  const recoveryCentres = filteredAWCs.filter((awc) => awc.nutritionBreakdown.sam === 0 && awc.nutritionBreakdown.mam <= 2);
  const interventionQueue = [...filteredAWCs]
    .sort((a, b) => ((b.nutritionBreakdown.sam * 3) + b.nutritionBreakdown.mam) - ((a.nutritionBreakdown.sam * 3) + a.nutritionBreakdown.mam))
    .slice(0, 3);

  const chartData = filteredAWCs.map(awc => ({
    name: awc.name.split(' ')[1] || awc.name,
    Normal: awc.nutritionBreakdown.normal,
    MAM: awc.nutritionBreakdown.mam,
    SAM: awc.nutritionBreakdown.sam,
    burden: getNutritionBurden(awc),
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
      <section className="supervisor-hero border-red-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,242,242,0.9))] dark:border-red-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_32%),linear-gradient(135deg,rgba(127,29,29,0.2),rgba(2,6,23,0.9))]">
        <div className="supervisor-hero-grid">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 shadow-sm backdrop-blur dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              <Activity size={14} />
              Supervisor Growth View
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Growth Aggregates</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">Track the concentration of SAM and MAM risk across centres, separate stable performers from high-burden sites, and prioritize where growth recovery support should move first.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Severe Burden</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{samPercentage}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Share of enrolled children in SAM.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Moderate Burden</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{mamPercentage}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Children still needing sustained follow-up.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critical Centres</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{awcWithCriticalSAM.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Need fast supervisor review.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <div className="supervisor-kpi-card border-emerald-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.88))] dark:border-emerald-900/40 dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Normal Weight</p>
               <p className="mt-3 text-4xl font-bold text-emerald-500">{formatIndianNumber(totalNormal)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
               <Scale size={20} />
              </div>
           </div>
           <div className="mt-4 w-full bg-emerald-100 dark:bg-emerald-900/30 h-1.5 rounded-full overflow-hidden">
               <div className="bg-emerald-500 h-full" style={{ width: `${Math.round((totalNormal/totalRegistered)*100)}%` }}></div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,251,235,0.88))] dark:border-amber-900/40 dark:bg-[linear-gradient(145deg,rgba(120,53,15,0.26),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MAM Cases</p>
               <p className="mt-3 text-4xl font-bold text-amber-500">{formatIndianNumber(totalMAM)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
               <TrendingUp size={20} />
              </div>
           </div>
           <div className="mt-4 w-full bg-amber-100 dark:bg-amber-900/30 h-1.5 rounded-full overflow-hidden">
               <div className="bg-amber-500 h-full" style={{ width: `${mamPercentage}%` }}></div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-red-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(254,242,242,0.9))] dark:border-red-900/40 dark:bg-[linear-gradient(145deg,rgba(127,29,29,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">SAM Cases</p>
               <p className="mt-3 text-4xl font-bold text-red-500">{formatIndianNumber(totalSAM)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
               <AlertTriangle size={20} />
              </div>
           </div>
           <div className="mt-4 w-full bg-red-100 dark:bg-red-900/30 h-1.5 rounded-full overflow-hidden">
               <div className="bg-red-500 h-full" style={{ width: `${samPercentage}%` }}></div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-sky-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.88))] dark:border-sky-900/40 dark:bg-[linear-gradient(145deg,rgba(12,74,110,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Critical AWCs (SAM &ge; 2)</p>
               <p className={cn("mt-3 text-4xl font-bold", awcWithCriticalSAM.length > 0 ? "text-red-500" : "text-emerald-500")}>{awcWithCriticalSAM.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
               <Target size={20} />
              </div>
           </div>
           <p className="mt-3 text-xs text-muted-foreground">Centres requiring immediate nutritional interventions.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="supervisor-panel border-red-100 bg-red-50/70 dark:border-red-900/30 dark:bg-red-950/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-300">Growth Readout</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">Risk is concentrated rather than block-wide.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {awcWithCriticalSAM.length} centres account for most of the severe burden, while {recoveryCentres.length} centres already show relatively stable growth profiles.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-red-600 shadow-sm dark:bg-red-900/30 dark:text-red-300">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-red-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Risk Burden</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{avgBurden}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Weighted SAM/MAM pressure per centre.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-red-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critical Centres</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{awcWithCriticalSAM.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Need supervisor follow-up this week.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-red-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stable Centres</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{recoveryCentres.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Useful models for peer mentoring.</p>
            </div>
          </div>
        </div>

        <div className="supervisor-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Highest Burden Centre</h3>
            <HeartPulse className="text-red-500" size={20} />
          </div>
          {highestBurdenCentre ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{highestBurdenCentre.name}</p>
                  <p className="text-sm text-muted-foreground">{highestBurdenCentre.location}</p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {getNutritionBurden(highestBurdenCentre)}% burden
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SAM</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{highestBurdenCentre.nutritionBreakdown.sam}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MAM</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{highestBurdenCentre.nutritionBreakdown.mam}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attendance</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{highestBurdenCentre.attendanceRate}%</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{getGrowthNarrative(highestBurdenCentre)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No growth data is available for the selected filter.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="supervisor-panel">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nutrition Breakdown by AWC</h3>
              <p className="mt-1 text-sm text-muted-foreground">Stacked composition helps compare burden concentration, not just absolute counts.</p>
            </div>
            <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              SAM highlighted in red
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Normal" fill="#10b981" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="MAM" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="SAM" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="supervisor-panel flex h-full flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 <AlertTriangle className="text-red-500" size={20} />
                 Elevated SAM Alerts
              </h3>
            </div>
            
            {awcWithCriticalSAM.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                 <Scale className="h-12 w-12 text-emerald-500/20 mb-3" />
                 <p className="text-sm">No centres have a critical concentration of SAM cases.</p>
               </div>
            ) : (
               <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 {awcWithCriticalSAM.map(awc => (
                   <div key={awc.id} className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/10 flex flex-col gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="font-semibold text-foreground text-sm">{awc.name}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">{awc.location}</p>
                       </div>
                       <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg text-xs font-bold">
                         {awc.nutritionBreakdown.sam} SAM Cases
                       </span>
                     </div>
                     <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Requires immediate medical follow-up.</p>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <div className="supervisor-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Intervention Queue</h3>
              <Activity className="text-sky-500" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {interventionQueue.map((awc) => (
                <div
                  key={awc.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/supervisor/awc/${awc.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{awc.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getGrowthNarrative(awc)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{awc.nutritionBreakdown.sam} SAM / {awc.nutritionBreakdown.mam} MAM</p>
                      <p className="text-xs text-muted-foreground">{getNutritionBurden(awc)}% burden</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
