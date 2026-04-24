import type { AWC } from '../types';

function getSeed(awc: AWC) {
  return awc.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + awc.id.length * 13;
}

export function getLearningRiskLabel(score: number) {
  if (score >= 75) return 'On track';
  if (score >= 60) return 'Needs coaching';
  return 'Priority support';
}

export function getLearningGap(score: number, target = 70) {
  return Math.max(0, target - score);
}

export function getTHRMetrics(awc: AWC) {
  const seed = getSeed(awc);
  const attendancePenalty = awc.attendanceRate < 80 ? 4 : 0;
  const nutritionPenalty = awc.nutritionBreakdown.sam * 3 + awc.nutritionBreakdown.mam;
  const thrCoverage = Math.max(68, Math.min(98, 94 - nutritionPenalty - attendancePenalty + (seed % 6)));
  const mddScore = Number(
    Math.max(2.8, Math.min(4.8, 4.6 - awc.nutritionBreakdown.sam * 0.35 - awc.nutritionBreakdown.mam * 0.08 + (seed % 4) * 0.1)).toFixed(1)
  );
  const beneficiariesCovered = Math.round((thrCoverage / 100) * awc.totalChildren);

  return {
    thrCoverage,
    mddScore,
    beneficiariesCovered,
    supplyRisk: thrCoverage < 80 ? 'High' : thrCoverage < 90 ? 'Moderate' : 'Low',
  };
}

export function getImmunizationMetrics(awc: AWC) {
  const seed = getSeed(awc);
  const riskLoad = awc.criticalCases * 2 + awc.nutritionBreakdown.sam + Math.max(0, 85 - awc.attendanceRate) / 5;
  const coverage = Math.max(72, Math.min(99, Math.round(96 - riskLoad + (seed % 5))));
  const dueCount = Math.max(0, Math.round((100 - coverage) / 7 + awc.criticalCases + (seed % 3)));

  return {
    coverage,
    dueCount,
    followUpIntensity: dueCount >= 7 ? 'Immediate' : dueCount >= 4 ? 'This week' : 'Routine',
  };
}

export function getNutritionBurden(awc: AWC) {
  return Number((((awc.nutritionBreakdown.sam * 2) + awc.nutritionBreakdown.mam) / awc.totalChildren * 100).toFixed(1));
}

export function getLearningNarrative(awc: AWC) {
  if (awc.avgLearningScore >= 75) {
    return `Consistent classroom performance with ${awc.attendanceRate}% attendance and limited remediation pressure.`;
  }
  if (awc.attendanceRate < 80) {
    return `Learning outcomes are likely being pulled down by irregular attendance and reduced classroom contact time.`;
  }
  return `Assessment scores are below target despite reasonable attendance, suggesting pedagogy or activity-quality gaps.`;
}

export function getGrowthNarrative(awc: AWC) {
  if (awc.nutritionBreakdown.sam >= 3) {
    return 'High SAM load needs rapid referral review, weekly follow-up, and home-level nutrition counselling.';
  }
  if (awc.nutritionBreakdown.mam >= 4) {
    return 'Moderate burden is concentrated here; recovery support should focus on supplementary feeding adherence.';
  }
  return 'Growth profile is comparatively stable with most children remaining in the normal band.';
}

export function getNutritionNarrative(awc: AWC) {
  const metrics = getTHRMetrics(awc);
  if (metrics.thrCoverage < 80) {
    return 'THR distribution is weak enough to indicate a likely delivery or uptake bottleneck this month.';
  }
  if (metrics.mddScore < 3.6) {
    return 'Food may be reaching households, but dietary diversity is still lagging and needs counselling support.';
  }
  return 'Distribution and diversity indicators are broadly stable for this centre.';
}

export function getImmunizationNarrative(awc: AWC) {
  const metrics = getImmunizationMetrics(awc);
  if (metrics.coverage < 85) {
    return 'Coverage is below block expectation and follow-up lists should be refreshed before the next outreach session.';
  }
  if (metrics.dueCount >= 5) {
    return 'Coverage is salvageable, but a concentrated overdue list is building and needs active tracing.';
  }
  return 'Routine immunization performance is broadly stable with manageable follow-up volume.';
}
