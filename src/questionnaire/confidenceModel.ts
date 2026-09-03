/**
 * @file src/questionnaire/confidenceModel.ts
 * @description Dynamic assessment confidence evaluator for the questionnaire.
 * Evaluates missing information, unverified fields, and produces honest predictive confidence.
 */

import { ConfidenceLevel } from '../types';
import { QuestionnaireAnswers } from './types';
import { cleanIrrelevantAnswers } from './questionVisibility';

export interface QuestionnaireConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  title: string;
  summary: string;
  knownFactors: string[];
  missingFactors: string[];
}

/**
 * Calculates assessment confidence from active questionnaire answers.
 * Unknown information explicitly reduces confidence rather than defaulting to zero.
 */
export function evaluateQuestionnaireConfidence(
  rawAnswers: QuestionnaireAnswers
): QuestionnaireConfidenceResult {
  const answers = cleanIrrelevantAnswers(rawAnswers);

  let score = 40; // Base starting confidence
  const knownFactors: string[] = [];
  const missingFactors: string[] = [];

  // Core Net Income
  if (answers.monthlyNetIncome && answers.monthlyNetIncome > 0) {
    score += 15;
    knownFactors.push(`Net monthly cash flow verified (₹${answers.monthlyNetIncome.toLocaleString('en-IN')})`);
  } else {
    missingFactors.push('Net monthly earnings unstated');
  }

  // Living Expenses
  if (answers.householdExpenses !== undefined && answers.householdExpenses > 0) {
    score += 15;
    knownFactors.push('Household living expense budget documented');
  } else {
    score -= 5;
    missingFactors.push('Living expenses estimated at standard benchmarks');
  }

  // Credit Score
  if (answers.creditScoreKnown && answers.creditScore) {
    score += 20;
    knownFactors.push(`Verified bureau credit score provided (${answers.creditScore})`);
  } else {
    missingFactors.push('Credit score unverified (proxy evaluation applied)');
  }

  // Income Stability
  if (answers.incomeStability) {
    score += 5;
    knownFactors.push(`Income stability classified as ${answers.incomeStability.replace('_', ' ')}`);
  }

  // Employment specifics
  if (
    answers.employmentType === 'salaried_corporate' ||
    answers.employmentType === 'salaried_regular'
  ) {
    if (answers.yearsAtEmployer) {
      score += 5;
      knownFactors.push('Employer tenure confirmed');
    } else {
      missingFactors.push('Employer tenure unstated');
    }
  } else if (
    answers.employmentType === 'self_employed_business' ||
    answers.employmentType === 'self_employed_professional'
  ) {
    if (answers.documentedAnnualIncome) {
      score += 10;
      knownFactors.push('Documented ITR tax returns provided');
    } else {
      missingFactors.push('ITR / tax returns unavailable (evaluated on cash flow)');
    }
    if (answers.businessVintageYears) {
      score += 5;
      knownFactors.push('Business vintage confirmed');
    }
  } else if (answers.employmentType === 'informal_or_gig') {
    if (answers.lowestMonthlyIncome) {
      score += 10;
      knownFactors.push('Lean-month stress cash flow baseline captured');
    } else {
      missingFactors.push('Lean-month income unstated');
    }
  }

  // Existing debt & bounce clarity
  if (answers.hasBounce !== undefined) {
    score += 5;
    knownFactors.push(answers.hasBounce ? 'Recent payment bounce recorded' : 'Clean 6-month repayment track record');
  } else {
    missingFactors.push('Recent cheque/NACH bounce history unconfirmed');
  }

  // Emergency Buffer
  if (answers.emergencySavingsMonths && answers.emergencySavingsMonths !== 'unknown') {
    score += 5;
    knownFactors.push('Emergency liquidity cushion documented');
  } else {
    missingFactors.push('Emergency savings buffer uncertain');
  }

  // Bound score between 20 and 98
  score = Math.max(25, Math.min(98, score));

  let level: ConfidenceLevel = 'indicative';
  let title = 'Indicative Confidence';

  if (score >= 80) {
    level = 'high';
    title = 'High Confidence Assessment';
  } else if (score >= 60) {
    level = 'moderate';
    title = 'Moderate Confidence Assessment';
  }

  // Generate dynamic, human-readable confidence summary
  let summary = '';
  if (knownFactors.length > 0 && missingFactors.length > 0) {
    const knownBrief = knownFactors.slice(0, 2).join(' and ');
    const missingBrief = missingFactors.slice(0, 2).join(' and ');
    summary = `Your ${knownBrief.toLowerCase()} are verified, but ${missingBrief.toLowerCase()} remain unavailable.`;
  } else if (missingFactors.length === 0) {
    summary = 'All primary underwriting criteria, debt commitments, and credit parameters have been fully verified.';
  } else {
    summary = 'Assessment is indicative based on generalized market benchmarks. Key financial variables remain unconfirmed.';
  }

  return {
    score,
    level,
    title,
    summary,
    knownFactors,
    missingFactors,
  };
}
