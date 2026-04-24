// ============================================================
// SUPERVISOR LEARNING
// Block-level overview of educational progress and avg scores
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAWCs } from '../../data/mockData';
import { cn } from '../../utils';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ReferenceLine, Cell } from 'recharts';
import { BookOpen, Target, BrainCircuit, AlertCircle, Download, Sparkles, TrendingUp } from 'lucide-react';
import { getLearningGap, getLearningNarrative, getLearningRiskLabel } from '../../data/supervisorInsights';

export function SupervisorLearning() {
  const navigate = useNavigate();
  const [selectedAWC, setSelectedAWC] = useState<string>('all');

  const filteredAWCs = selectedAWC === 'all' ? mockAWCs : mockAWCs.filter(a => a.id === selectedAWC);

  const activeAWCs = filteredAWCs.filter(awc => awc.avgLearningScore > 0);
  const blockAvgLearning = activeAWCs.length 
    ? Math.round(activeAWCs.reduce((acc, awc) => acc + awc.avgLearningScore, 0) / activeAWCs.length) 
    : 0;

  const strugglingAWCs = filteredAWCs.filter(awc => awc.avgLearningScore < 60 && awc.avgLearningScore > 0);
  const targetReadyAWCs = filteredAWCs.filter(awc => awc.avgLearningScore >= 70);
  const attendanceLinkedRisk = filteredAWCs.filter(awc => awc.avgLearningScore < 60 && awc.attendanceRate < 80);
  const highestPerformer = [...filteredAWCs].sort((a, b) => b.avgLearningScore - a.avgLearningScore)[0];
  const priorityAWCs = [...filteredAWCs]
    .filter((awc) => awc.avgLearningScore > 0)
    .sort((a, b) => (getLearningGap(b.avgLearningScore) + Math.max(0, 85 - b.attendanceRate)) - (getLearningGap(a.avgLearningScore) + Math.max(0, 85 - a.attendanceRate)))
    .slice(0, 3);
  const totalLearningGap = filteredAWCs.reduce((sum, awc) => sum + getLearningGap(awc.avgLearningScore), 0);

  const chartData = filteredAWCs.map(awc => ({
    name: awc.name.split(' ')[1] || awc.name,
    score: awc.avgLearningScore,
    attendance: awc.attendanceRate,
  })).sort((a,b) => b.score - a.score);

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
      <section className="supervisor-hero border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,253,245,0.9))] dark:border-emerald-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(135deg,rgba(6,78,59,0.24),rgba(2,6,23,0.9))]">
        <div className="supervisor-hero-grid">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <BookOpen size={14} />
              Supervisor Learning View
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Educational Progress</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">Monitor cluster-wide cognitive progression, spot centres where attendance is dragging outcomes, and quickly identify where pedagogy support will have the most impact.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Block Target</p>
                <p className="mt-2 text-2xl font-bold text-foreground">70+</p>
                <p className="mt-1 text-xs text-muted-foreground">Score threshold for strong classroom momentum.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Centres Above Target</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{targetReadyAWCs.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Potential peer-learning exemplars.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority Centres</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{priorityAWCs.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Need coaching or attendance recovery.</p>
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
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Block Avg Score</p>
               <p className={cn("mt-3 text-4xl font-bold", blockAvgLearning >= 70 ? "text-emerald-500" : "text-amber-500")}>
                 {blockAvgLearning}<span className="text-xl text-muted-foreground font-medium">/100</span>
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", blockAvgLearning >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>
               <Target size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-sky-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.88))] dark:border-sky-900/40 dark:bg-[linear-gradient(145deg,rgba(12,74,110,0.28),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Active Assessments</p>
               <p className="mt-3 text-4xl font-bold text-sky-500">
                 {activeAWCs.length}<span className="text-xl text-muted-foreground font-medium">/{filteredAWCs.length}</span>
               </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
               <BrainCircuit size={20} />
              </div>
           </div>
        </div>

        <div className="supervisor-kpi-card border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,251,235,0.88))] dark:border-amber-900/40 dark:bg-[linear-gradient(145deg,rgba(120,53,15,0.26),rgba(2,6,23,0.92))]">
           <div className="flex items-center justify-between">
              <div>
               <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Struggling AWCs (&lt;60)</p>
               <p className={cn("mt-3 text-4xl font-bold", strugglingAWCs.length > 0 ? "text-amber-500" : "text-emerald-500")}>
                 {strugglingAWCs.length}
               </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", strugglingAWCs.length > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300")}>
               <AlertCircle size={20} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="supervisor-panel border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">What This View Is Saying</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">Learning quality is uneven across centres, not uniformly weak.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {targetReadyAWCs.length} of {filteredAWCs.length} centres are already at or above the 70-point block target, while the remaining gap is concentrated in a small set of centres.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-emerald-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Centres At Target</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{targetReadyAWCs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Showing replicable classroom routines.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-emerald-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gap To Close</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{totalLearningGap} pts</p>
              <p className="mt-1 text-xs text-muted-foreground">Combined shortfall to reach 70 across selected centres.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-emerald-900/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attendance-Linked Risk</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{attendanceLinkedRisk.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Centres where absenteeism is likely depressing scores.</p>
            </div>
          </div>
        </div>

        <div className="supervisor-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Best Performing Centre</h3>
            <TrendingUp className="text-sky-500" size={20} />
          </div>
          {highestPerformer ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{highestPerformer.name}</p>
                  <p className="text-sm text-muted-foreground">{highestPerformer.workerName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {highestPerformer.avgLearningScore}/100
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attendance</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{highestPerformer.attendanceRate}%</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{getLearningRiskLabel(highestPerformer.avgLearningScore)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{getLearningNarrative(highestPerformer)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No centre data is available for the selected filter.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="supervisor-panel">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Learning Scores by Centre</h3>
              <p className="mt-1 text-sm text-muted-foreground">Vertical ranking makes lagging centres easier to spot at a glance.</p>
            </div>
            <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              Target line at 70
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} cursor={{fill: 'hsl(var(--muted)/0.3)'}} />
                <ReferenceLine x={70} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Target Goal', fill: '#10b981', fontSize: 10 }} />
                <Bar dataKey="score" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score < 60 ? '#f59e0b' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="supervisor-panel flex h-full flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 <BookOpen className="text-sky-500" size={20} />
                 Action Plan
              </h3>
            </div>
            
            {strugglingAWCs.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                 <BrainCircuit className="h-12 w-12 text-emerald-500/20 mb-3" />
                 <p className="text-sm">All centres are keeping up with the block curricular goals.</p>
               </div>
            ) : (
               <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 <p className="text-sm text-muted-foreground mb-4">The following centres are trailing in cognitive outcomes and may need Teaching Learning Material (TLM) replenishment or pedagogy workshops.</p>
                 {strugglingAWCs.map(awc => (
                   <div key={awc.id} className="rounded-2xl border border-border bg-muted/20 p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => navigate(`/supervisor/awc/${awc.id}`)}>
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-semibold text-foreground text-sm">{awc.name}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">{awc.workerName}</p>
                       </div>
                       <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-lg text-xs font-bold">
                         Score: {awc.avgLearningScore}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <div className="supervisor-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Priority Centre Breakdown</h3>
              <BookOpen className="text-sky-500" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {priorityAWCs.map((awc) => (
                <div
                  key={awc.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/supervisor/awc/${awc.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{awc.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getLearningNarrative(awc)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{awc.avgLearningScore}/100</p>
                      <p className="text-xs text-muted-foreground">{awc.attendanceRate}% attendance</p>
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
