/**
 * @file src/questionnaire/questionVisibility.ts
 * @description Pure evaluation logic for question visibility, adaptive path resolution,
 * step progress calculation, and state sanitization.
 * Architecture Note: Zero React/JSX dependency.
 */

import { BorrowerInput, DataPoint, RangePoint } from '../types';
import { QUESTION_DEFINITIONS, QUESTIONNAIRE_STEPS } from './questions';
import {
  QuestionDefinition,
  QuestionnaireAnswers,
  StepDefinition,
} from './types';

function unwrap<T>(point?: DataPoint<T> | RangePoint<T>): T | undefined {
  if (!point) return undefined;
  if (point.status === 'known') return point.value;
  if (point.status === 'range') return ((point.min as any as number) + (point.max as any as number)) / 2 as any as T;
  return undefined;
}

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
  if (answers.creditScoreKnown?.status === 'known' && answers.creditScoreKnown.value === false) {
    cleaned.creditScore = undefined;
  }

  if (answers.hasCoapplicant?.status === 'known' && answers.hasCoapplicant.value === false) {
    cleaned.spouseIncome = undefined;
  }

  if (answers.hasCollateral?.status === 'known' && answers.hasCollateral.value === false) {
    cleaned.collateralType = undefined;
    cleaned.collateralValue = undefined;
    cleaned.collateralDescription = undefined;
  }

  if (answers.hasLenderOffer?.status === 'known' && answers.hasLenderOffer.value === 'no') {
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

  let collateralDesc = unwrap(answers.collateralDescription);
  if (unwrap(answers.hasCollateral) && unwrap(answers.collateralType) && !collateralDesc) {
    const typeNames: Record<string, string> = {
      commercial_shop: 'Commercial shop / office premises',
      residential_property: 'Residential house / plot',
      vehicle: 'Commercial or personal vehicle',
      gold: 'Physical gold jewellery',
      other: 'Financial asset or property',
    };
    collateralDesc = typeNames[unwrap(answers.collateralType)!] || 'Pledged collateral asset';
  }

  const borrowerInput: BorrowerInput = {
    personaId: answers.personaId,
    name: answers.name || 'Borrower',
    age: unwrap(answers.age),
    purpose: unwrap(answers.purpose),
    amountRequested: unwrap(answers.amountRequested),
    loanType: unwrap(answers.loanType),
    monthlyNetIncome: unwrap(answers.monthlyNetIncome),
    spouseIncome: unwrap(answers.spouseIncome),
    employmentType: unwrap(answers.employmentType),
    existingMonthlyEMIs: unwrap(answers.existingMonthlyEMIs) || 0,
    householdExpenses: unwrap(answers.householdExpenses),
    creditScoreKnown: unwrap(answers.creditScoreKnown),
    creditScore: unwrap(answers.creditScoreKnown) ? unwrap(answers.creditScore) : undefined,
    hasCollateral: unwrap(answers.hasCollateral) || false,
    collateralValue: unwrap(answers.collateralValue),
    collateralDescription: collateralDesc,
    hasAppLoans: unwrap(answers.hasAppLoans) || false,
    hasBounce: unwrap(answers.hasBounce) || false,
    tenureWantedMonths: unwrap(answers.tenureWantedMonths) || 36,
    hasLenderOffer: unwrap(answers.hasLenderOffer) === 'yes' || unwrap(answers.hasLenderOffer) === 'comparing',
    quotedAmount: unwrap(answers.quotedAmount),
    quotedRate: unwrap(answers.quotedRate),
    quotedFee: unwrap(answers.quotedFee),
    quotedTenure: unwrap(answers.quotedTenure),
    quotedEMI: unwrap(answers.quotedEMI),
    quotedOtherCharges: unwrap(answers.quotedOtherCharges),
    lenderOffer: {
      hasOffer: unwrap(answers.hasLenderOffer) === 'yes' || unwrap(answers.hasLenderOffer) === 'comparing',
      quotedAmount: unwrap(answers.quotedAmount),
      quotedRate: unwrap(answers.quotedRate),
      quotedFee: unwrap(answers.quotedFee),
      quotedTenure: unwrap(answers.quotedTenure),
      quotedEMI: unwrap(answers.quotedEMI),
      quotedOtherCharges: unwrap(answers.quotedOtherCharges),
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
  const wrap = <T>(val: T | undefined): DataPoint<T> | undefined => val !== undefined ? { status: 'known', value: val } : undefined;

  const answers: QuestionnaireAnswers = {
    personaId: input.personaId,
    name: input.name,
    age: wrap(input.age),
    purpose: wrap(input.purpose),
    loanType: wrap(input.loanType),
    amountRequested: wrap(input.amountRequested),
    tenureWantedMonths: wrap(input.tenureWantedMonths || 36),
    employmentType: wrap(input.employmentType),
    monthlyNetIncome: wrap(input.monthlyNetIncome),
    incomeStability: wrap(
      input.employmentType === 'salaried_corporate'
        ? 'very_stable'
        : input.employmentType === 'informal_or_gig'
        ? 'variable'
        : 'moderately_stable'
    ),
    existingMonthlyEMIs: wrap(input.existingMonthlyEMIs),
    householdExpenses: wrap(input.householdExpenses),
    creditScoreKnown: wrap(input.creditScoreKnown !== false && input.creditScore !== undefined),
    creditScore: wrap(input.creditScore),
    hasCoapplicant: wrap((input.spouseIncome || 0) > 0),
    spouseIncome: wrap(input.spouseIncome),
    hasCollateral: wrap(input.hasCollateral || false),
    collateralValue: wrap(input.collateralValue),
    collateralDescription: wrap(input.collateralDescription),
    hasAppLoans: wrap(input.hasAppLoans || false),
    hasBounce: wrap(input.hasBounce || false),
    hasExistingLoans: wrap((input.existingMonthlyEMIs || 0) > 0),
    hasLenderOffer: wrap(
      input.hasLenderOffer || input.quotedRate !== undefined || input.lenderOffer?.hasOffer
        ? 'yes'
        : 'no'
    ),
    quotedAmount: wrap(input.quotedAmount ?? input.lenderOffer?.quotedAmount),
    quotedRate: wrap(input.quotedRate ?? input.lenderOffer?.quotedRate),
    quotedFee: wrap(input.quotedFee ?? input.lenderOffer?.quotedFee),
    quotedTenure: wrap(input.quotedTenure ?? input.lenderOffer?.quotedTenure),
    quotedEMI: wrap(input.quotedEMI ?? input.lenderOffer?.quotedEMI),
    quotedOtherCharges: wrap(input.quotedOtherCharges ?? input.lenderOffer?.quotedOtherCharges),
  };

  // Specific persona enrichments
  if (input.personaId === 'priya') {
    answers.yearsAtEmployer = { status: 'known', value: 'more_than_3_yrs' };
    answers.emergencySavingsMonths = { status: 'known', value: '3_to_6_mo' };
  } else if (input.personaId === 'ravi') {
    answers.businessVintageYears = { status: 'known', value: 'more_than_5_yrs' };
    answers.documentedAnnualIncome = { status: 'known', value: 420000 };
    answers.collateralType = { status: 'known', value: 'commercial_shop' };
    answers.emergencySavingsMonths = { status: 'known', value: '1_to_3_mo' };
  } else if (input.personaId === 'anita') {
    answers.lowestMonthlyIncome = { status: 'known', value: 22000 };
    answers.incomeSourceCount = { status: 'known', value: '2_to_3_sources' };
    answers.emergencySavingsMonths = { status: 'known', value: 'less_than_1_mo' };
  }

  return answers;
}
