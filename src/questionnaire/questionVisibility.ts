/**
 * @file src/questionnaire/questionVisibility.ts
 * @description Pure evaluation logic for question visibility, adaptive path resolution,
 * step progress calculation, and state sanitization.
 * Architecture Note: Zero React/JSX dependency.
 */

import { BorrowerInput } from '../types';
import { QUESTION_DEFINITIONS, QUESTIONNAIRE_STEPS } from './questions';
import {
  QuestionDefinition,
  QuestionnaireAnswers,
  StepDefinition,
} from './types';

/**
 * Evaluates whether a question should be displayed given current borrower answers.
 */
export function isQuestionActive(
  question: QuestionDefinition,
  answers: QuestionnaireAnswers
): boolean {
  if (!question.condition) {
    return true;
  }
  return question.condition(answers);
}

/**
 * Returns all active questions belonging to a given step.
 */
export function getActiveQuestionsForStep(
  stepId: string,
  answers: QuestionnaireAnswers
): QuestionDefinition[] {
  return QUESTION_DEFINITIONS.filter(
    (q) => q.stepId === stepId && isQuestionActive(q, answers)
  );
}

/**
 * Returns all active questions across the entire assessment.
 */
export function getActiveQuestions(
  answers: QuestionnaireAnswers
): QuestionDefinition[] {
  return QUESTION_DEFINITIONS.filter((q) => isQuestionActive(q, answers));
}

/**
 * Returns the list of active steps (steps with at least one active question or review step).
 */
export function getActiveSteps(
  answers: QuestionnaireAnswers
): StepDefinition[] {
  return QUESTIONNAIRE_STEPS.filter((step) => {
    if (step.id === 'review') return true;
    const activeQuestions = getActiveQuestionsForStep(step.id, answers);
    return activeQuestions.length > 0;
  });
}

/**
 * Calculates adaptive progress metrics based on active questionnaire steps.
 */
export function calculateStepProgress(
  currentStepId: string,
  answers: QuestionnaireAnswers
): { currentStepNumber: number; totalStepsCount: number; percentage: number } {
  const activeSteps = getActiveSteps(answers);
  const currentIndex = activeSteps.findIndex((s) => s.id === currentStepId);
  const currentStepNumber = currentIndex !== -1 ? currentIndex + 1 : 1;
  const totalStepsCount = activeSteps.length;
  const percentage = Math.round((currentStepNumber / totalStepsCount) * 100);

  return {
    currentStepNumber,
    totalStepsCount,
    percentage,
  };
}

/**
 * Cleans out stale answers that are no longer active under the current adaptive state.
 * For example: if user changed from 'salaried_corporate' to 'self_employed_business',
 * previous salaried answers (yearsAtEmployer, hasVariableIncome) are pruned so they
 * do not contaminate calculations.
 */
export function cleanIrrelevantAnswers(
  answers: QuestionnaireAnswers
): QuestionnaireAnswers {
  const cleaned: QuestionnaireAnswers = { ...answers };

  // Check all questions; if condition is false, delete the property
  for (const q of QUESTION_DEFINITIONS) {
    if (!isQuestionActive(q, answers)) {
      delete (cleaned as any)[q.id];
    }
  }

  // Handle explicit unknown overrides
  if (answers.creditScoreKnown === false) {
    cleaned.creditScore = undefined;
  }

  if (answers.hasCoapplicant === false) {
    cleaned.spouseIncome = undefined;
  }

  if (answers.hasCollateral === false) {
    cleaned.collateralType = undefined;
    cleaned.collateralValue = undefined;
    cleaned.collateralDescription = undefined;
  }

  if (answers.hasLenderOffer === 'no') {
    cleaned.quotedRate = undefined;
    cleaned.quotedFee = undefined;
    cleaned.quotedEMI = undefined;
  }

  return cleaned;
}

/**
 * Validates active questions in a specific step.
 */
export function validateStep(
  stepId: string,
  answers: QuestionnaireAnswers
): { valid: boolean; errors: Record<string, string> } {
  const activeQuestions = getActiveQuestionsForStep(stepId, answers);
  const errors: Record<string, string> = {};

  for (const q of activeQuestions) {
    const val = (answers as any)[q.id];

    // Check required fields
    if (q.required) {
      if (val === undefined || val === null || val === '') {
        errors[q.id] = `${q.text} is required.`;
        continue;
      }
    }

    // Custom validator
    if (q.validation && val !== undefined && val !== null && val !== '') {
      const err = q.validation(val, answers);
      if (err) {
        errors[q.id] = err;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Maps QuestionnaireAnswers into standard domain BorrowerInput for evaluateBorrowerRules.
 * Guarantees that unknown information remains undefined (never defaulting to zero).
 */
export function mapAnswersToBorrowerInput(
  rawAnswers: QuestionnaireAnswers
): BorrowerInput {
  const answers = cleanIrrelevantAnswers(rawAnswers);

  let collateralDesc = answers.collateralDescription;
  if (answers.hasCollateral && answers.collateralType && !collateralDesc) {
    const typeNames: Record<string, string> = {
      commercial_shop: 'Commercial shop / office premises',
      residential_property: 'Residential house / plot',
      vehicle: 'Commercial or personal vehicle',
      gold: 'Physical gold jewellery',
      other: 'Financial asset or property',
    };
    collateralDesc = typeNames[answers.collateralType] || 'Pledged collateral asset';
  }

  const borrowerInput: BorrowerInput = {
    personaId: answers.personaId,
    name: answers.name || 'Borrower',
    age: answers.age,
    purpose: answers.purpose,
    amountRequested: answers.amountRequested,
    loanType: answers.loanType,
    monthlyNetIncome: answers.monthlyNetIncome,
    spouseIncome: answers.spouseIncome,
    employmentType: answers.employmentType,
    existingMonthlyEMIs: answers.existingMonthlyEMIs || 0,
    householdExpenses: answers.householdExpenses,
    creditScoreKnown: answers.creditScoreKnown,
    creditScore: answers.creditScoreKnown ? answers.creditScore : undefined,
    hasCollateral: answers.hasCollateral || false,
    collateralValue: answers.collateralValue,
    collateralDescription: collateralDesc,
    hasAppLoans: answers.hasAppLoans || false,
    hasBounce: answers.hasBounce || false,
    tenureWantedMonths: answers.tenureWantedMonths || 36,
    hasLenderOffer: answers.hasLenderOffer === 'yes' || answers.hasLenderOffer === 'comparing',
    quotedAmount: answers.quotedAmount,
    quotedRate: answers.quotedRate,
    quotedFee: answers.quotedFee,
    quotedTenure: answers.quotedTenure,
    quotedEMI: answers.quotedEMI,
    quotedOtherCharges: answers.quotedOtherCharges,
    lenderOffer: {
      hasOffer: answers.hasLenderOffer === 'yes' || answers.hasLenderOffer === 'comparing',
      quotedAmount: answers.quotedAmount,
      quotedRate: answers.quotedRate,
      quotedFee: answers.quotedFee,
      quotedTenure: answers.quotedTenure,
      quotedEMI: answers.quotedEMI,
      quotedOtherCharges: answers.quotedOtherCharges,
    },
  };

  return borrowerInput;
}

/**
 * Translates an existing BorrowerInput (e.g. Priya, Ravi, Anita) into QuestionnaireAnswers
 * for prefilling or editing in the questionnaire.
 */
export function mapBorrowerInputToAnswers(
  input: BorrowerInput
): QuestionnaireAnswers {
  const answers: QuestionnaireAnswers = {
    personaId: input.personaId,
    name: input.name,
    age: input.age,
    purpose: input.purpose,
    loanType: input.loanType,
    amountRequested: input.amountRequested,
    tenureWantedMonths: input.tenureWantedMonths || 36,
    employmentType: input.employmentType,
    monthlyNetIncome: input.monthlyNetIncome,
    incomeStability:
      input.employmentType === 'salaried_corporate'
        ? 'very_stable'
        : input.employmentType === 'informal_or_gig'
        ? 'variable'
        : 'moderately_stable',
    existingMonthlyEMIs: input.existingMonthlyEMIs,
    householdExpenses: input.householdExpenses,
    creditScoreKnown: input.creditScoreKnown !== false && input.creditScore !== undefined,
    creditScore: input.creditScore,
    hasCoapplicant: (input.spouseIncome || 0) > 0,
    spouseIncome: input.spouseIncome,
    hasCollateral: input.hasCollateral || false,
    collateralValue: input.collateralValue,
    collateralDescription: input.collateralDescription,
    hasAppLoans: input.hasAppLoans || false,
    hasBounce: input.hasBounce || false,
    hasExistingLoans: (input.existingMonthlyEMIs || 0) > 0,
    hasLenderOffer:
      input.hasLenderOffer || input.quotedRate !== undefined || input.lenderOffer?.hasOffer
        ? 'yes'
        : 'no',
    quotedAmount: input.quotedAmount ?? input.lenderOffer?.quotedAmount,
    quotedRate: input.quotedRate ?? input.lenderOffer?.quotedRate,
    quotedFee: input.quotedFee ?? input.lenderOffer?.quotedFee,
    quotedTenure: input.quotedTenure ?? input.lenderOffer?.quotedTenure,
    quotedEMI: input.quotedEMI ?? input.lenderOffer?.quotedEMI,
    quotedOtherCharges: input.quotedOtherCharges ?? input.lenderOffer?.quotedOtherCharges,
  };

  // Specific persona enrichments
  if (input.personaId === 'priya') {
    answers.yearsAtEmployer = 'more_than_3_yrs';
    answers.emergencySavingsMonths = '3_to_6_mo';
  } else if (input.personaId === 'ravi') {
    answers.businessVintageYears = 'more_than_5_yrs';
    answers.documentedAnnualIncome = 420000;
    answers.collateralType = 'commercial_shop';
    answers.emergencySavingsMonths = '1_to_3_mo';
  } else if (input.personaId === 'anita') {
    answers.lowestMonthlyIncome = 22000;
    answers.incomeSourceCount = '2_to_3_sources';
    answers.emergencySavingsMonths = 'less_than_1_mo';
  }

  return answers;
}
