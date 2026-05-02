// ============================================================
// STUDENT PROGRESS - Individual learning progress tracking
// Tracks per-child, per-theme, per-domain, per-activity progress
// ============================================================

import { managedChildren } from './childMonitoringData';
import { mockChildren } from './mockData';
import { learningJourneyByTheme, teachingModulesByTheme } from './mockData';
import type { MonthlyTheme } from '../types';

// ── Types ──

export type ActivityStatus = 'pending' | 'in-progress' | 'complete';

export interface ActivityProgress {
  activityId: string;
  title: string;
  domain: string;
  status: ActivityStatus;
  score: number;       // 0–100
  attempts: number;
  lastUpdated: string; // ISO date
}

export interface DomainProgress {
  name: string;
  completionPercentage: number;
  activities: ActivityProgress[];
}

export interface ThemeProgress {
  theme: string;
  themeLabel: string;
  overallProgress: number;
  domains: DomainProgress[];
}

export interface StudentProgress {
  childId: string;
  name: string;
  ageLabel: string;
  learningScore: number;
  progress: ThemeProgress[];
}

// ── Risk & Intervention Logic ──

export type RiskLevel = 'green' | 'yellow' | 'red';

export function getDomainRiskLevel(percentage: number): RiskLevel {
  if (percentage < 30) return 'red';
  if (percentage < 50) return 'yellow';
  return 'green';
}

export function getScoreRiskLevel(score: number): RiskLevel {
  if (score < 30) return 'red';
  if (score < 50) return 'yellow';
  return 'green';
}

export function getInterventionText(score: number, attempts: number): string {
  if (score < 30) {
    if (attempts >= 3) return 'High risk with multiple attempts. Needs one-on-one remediation and simplified activities.';
    return 'High risk. Start with foundational activities and provide extra support.';
  }
  if (score < 50) {
    if (attempts >= 3) return 'Struggling despite repeated attempts. Consider alternative teaching methods.';
    return 'Needs attention. Provide guided practice and revisit prerequisites.';
  }
  if (attempts >= 3 && score < 70) return 'Moderate progress after multiple attempts. Reinforce with practice exercises.';
  return '';
}

export function getRiskBadgeInfo(level: RiskLevel): { label: string; tone: 'emerald' | 'amber' | 'red' } {
  switch (level) {
    case 'green': return { label: 'On Track', tone: 'emerald' };
    case 'yellow': return { label: 'Needs Attention', tone: 'amber' };
    case 'red': return { label: 'High Risk', tone: 'red' };
  }
}

// ── Theme Labels ──

const themeLabels: Record<string, string> = {
  'data.theme.family': 'My Family',
  'data.theme.animals': 'Animals',
  'data.theme.nature': 'Nature',
};

// ── Domain Labels ──

const domainLabels: Record<string, string> = {
  'domain.cognitive': 'Cognitive',
  'domain.language': 'Language',
  'domain.physical': 'Physical',
  'domain.creativity': 'Creativity',
  'domain.nutrition': 'Nutrition Awareness',
  'domain.social': 'Social',
  'Cognitive': 'Cognitive',
  'Physical': 'Physical',
};

function getDomainLabel(raw: string): string {
  return domainLabels[raw] ?? raw;
}

// ── Seeded Random (deterministic per child+activity) ──

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit int
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

// ── Build Progress Data ──

function buildStudentProgress(): StudentProgress[] {
  const themes = Object.keys(learningJourneyByTheme) as MonthlyTheme[];
  const today = new Date().toISOString().split('T')[0];

  return managedChildren.map((child) => {
    // Find the matching mockChild for richer data
    const mc = mockChildren.find((c) => c.id === child.id);
    const baseScore = mc?.learningScore ?? 50;

    const progress: ThemeProgress[] = themes.map((theme) => {
      const activities = learningJourneyByTheme[theme] ?? [];
      const modules = teachingModulesByTheme[theme] ?? [];

      // Group all activities by domain
      const domainMap = new Map<string, ActivityProgress[]>();

      // Add daily activities
      activities.forEach((act) => {
        const domain = getDomainLabel(act.category);
        if (!domainMap.has(domain)) domainMap.set(domain, []);

        const rand = seededRandom(`${child.id}-${act.id}`);
        const scoreVariance = (rand - 0.5) * 40;
        const rawScore = Math.round(baseScore + scoreVariance);
        const score = Math.max(0, Math.min(100, rawScore));

        let status: ActivityStatus;
        if (score >= 50 && rand > 0.3) status = 'complete';
        else if (score >= 30 || rand > 0.5) status = 'in-progress';
        else status = 'pending';

        const attempts = status === 'complete' ? (rand > 0.7 ? 1 : rand > 0.3 ? 2 : 3)
          : status === 'in-progress' ? (rand > 0.5 ? 1 : 2)
          : 0;

        const daysAgo = Math.floor(rand * 14);
        const updated = new Date();
        updated.setDate(updated.getDate() - daysAgo);

        domainMap.get(domain)!.push({
          activityId: act.id,
          title: act.title.startsWith('data.') ? act.title.replace('data.activity.', '').replace('.title', '') : act.title,
          domain,
          status,
          score: status === 'pending' ? 0 : score,
          attempts,
          lastUpdated: updated.toISOString().split('T')[0],
        });
      });

      // Add teaching module activities
      modules.forEach((mod) => {
        const domain = getDomainLabel(mod.domain);
        if (!domainMap.has(domain)) domainMap.set(domain, []);

        const rand = seededRandom(`${child.id}-${mod.id}`);
        const scoreVariance = (rand - 0.5) * 30;
        const rawScore = Math.round(baseScore + scoreVariance);
        const score = Math.max(0, Math.min(100, rawScore));

        let status: ActivityStatus;
        if (score >= 60 && rand > 0.4) status = 'complete';
        else if (score >= 30) status = 'in-progress';
        else status = 'pending';

        const attempts = status === 'complete' ? 1 : status === 'in-progress' ? Math.ceil(rand * 3) : 0;
        const daysAgo = Math.floor(rand * 10);
        const updated = new Date();
        updated.setDate(updated.getDate() - daysAgo);

        domainMap.get(domain)!.push({
          activityId: mod.id,
          title: mod.title,
          domain,
          status,
          score: status === 'pending' ? 0 : score,
          attempts,
          lastUpdated: updated.toISOString().split('T')[0],
        });
      });

      // Build domain progress array
      const domains: DomainProgress[] = Array.from(domainMap.entries()).map(([name, acts]) => {
        const completed = acts.filter((a) => a.status === 'complete').length;
        const inProgress = acts.filter((a) => a.status === 'in-progress').length;
        const total = acts.length;
        const completionPercentage = total > 0
          ? Math.round(((completed + inProgress * 0.5) / total) * 100)
          : 0;

        return { name, completionPercentage, activities: acts };
      });

      // Overall theme progress
      const totalActs = domains.reduce((s, d) => s + d.activities.length, 0);
      const completedActs = domains.reduce((s, d) => s + d.activities.filter((a) => a.status === 'complete').length, 0);
      const inProgressActs = domains.reduce((s, d) => s + d.activities.filter((a) => a.status === 'in-progress').length, 0);
      const overallProgress = totalActs > 0
        ? Math.round(((completedActs + inProgressActs * 0.5) / totalActs) * 100)
        : 0;

      return {
        theme,
        themeLabel: themeLabels[theme] ?? theme,
        overallProgress,
        domains,
      };
    });

    return {
      childId: child.id,
      name: child.name,
      ageLabel: child.ageLabel,
      learningScore: mc?.learningScore ?? 50,
      progress,
    };
  });
}

// ── Exported Data ──

export const allStudentProgress: StudentProgress[] = buildStudentProgress();

// ── Query Functions ──

export function getStudentProgress(childId: string): StudentProgress | undefined {
  return allStudentProgress.find((s) => s.childId === childId);
}

export function getLowScoringDomains(childId: string, threshold: number = 50): { theme: string; domain: DomainProgress }[] {
  const student = getStudentProgress(childId);
  if (!student) return [];

  const results: { theme: string; domain: DomainProgress }[] = [];
  for (const tp of student.progress) {
    for (const dp of tp.domains) {
      if (dp.completionPercentage < threshold) {
        results.push({ theme: tp.themeLabel, domain: dp });
      }
    }
  }
  return results.sort((a, b) => a.domain.completionPercentage - b.domain.completionPercentage);
}

export function getIncompleteActivities(childId: string): ActivityProgress[] {
  const student = getStudentProgress(childId);
  if (!student) return [];

  const activities: ActivityProgress[] = [];
  for (const tp of student.progress) {
    for (const dp of tp.domains) {
      for (const act of dp.activities) {
        if (act.status !== 'complete') {
          activities.push(act);
        }
      }
    }
  }
  return activities.sort((a, b) => a.score - b.score);
}

export function getStudentOverallProgress(childId: string): number {
  const student = getStudentProgress(childId);
  if (!student || student.progress.length === 0) return 0;
  return Math.round(student.progress.reduce((s, tp) => s + tp.overallProgress, 0) / student.progress.length);
}

export function getStudentWeakestDomain(childId: string): DomainProgress | null {
  const student = getStudentProgress(childId);
  if (!student) return null;

  let weakest: DomainProgress | null = null;
  for (const tp of student.progress) {
    for (const dp of tp.domains) {
      if (!weakest || dp.completionPercentage < weakest.completionPercentage) {
        weakest = dp;
      }
    }
  }
  return weakest;
}
