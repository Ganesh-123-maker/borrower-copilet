/**
 * @file src/questionnaire/types.ts
 * @description Type definitions for the Borrower Copilot adaptive questionnaire engine.
 * Decoupled from UI rendering components.
 */

import {
  EmploymentType,
  LoanPurpose,
  LoanType,
} from '../types';

export type QuestionType =
  | 'single_choice'
  | 'currency'
  | 'number'
  | 'yes_no'
  | 'range'
  | 'select';

export type ImpactedOutput =
  | 'borrowerSafeAmount'
  | 'emiCeiling'
  | 'lenderLikelySanction'
  | 'fairRateBand'
  | 'allInAPR'
  | 'stressCase'
  | 'verdict'
  | 'confidence';

export interface QuestionOption {
  value: string | number | boolean;
  label: string;
  sublabel?: string;
  badge?: string;
}

export interface QuestionDefinition {
  id: string;
  stepId: string;
  stepTitle: string;
  text: string;
  description?: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  isMust: boolean;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  allowUnknown?: boolean;
  unknownLabel?: string;
  condition?: (answers: QuestionnaireAnswers) => boolean;
  affects: ImpactedOutput[];
  confidenceImpact: 'high' | 'moderate' | 'low' | 'none';
  validation?: (value: any, answers: QuestionnaireAnswers) => string | null;
}

export interface QuestionnaireAnswers {
  [key: string]: any;
  // Must questions
  purpose?: LoanPurpose;
  loanType?: LoanType;
  amountRequested?: number;
  tenureWantedMonths?: number;
  age?: number;
  employmentType?: EmploymentType;
  monthlyNetIncome?: number;
  incomeStability?: 'very_stable' | 'moderately_stable' | 'variable';
  existingMonthlyEMIs?: number;
  householdExpenses?: number;
  creditScoreKnown?: boolean;
  creditScore?: number;

  // Adaptive: Co-applicant
  hasCoapplicant?: boolean;
  spouseIncome?: number;

  // Adaptive: Salaried path
  yearsAtEmployer?: 'less_than_1_yr' | '1_to_3_yrs' | 'more_than_3_yrs';
  hasVariableIncome?: boolean;
  variableIncomePercent?: number;
  hasUpcomingExpenseRisk?: boolean;

  // Adaptive: Self-employed path
  businessVintageYears?: 'less_than_2_yrs' | '2_to_5_yrs' | 'more_than_5_yrs';
  documentedAnnualIncome?: number;
  businessVariablePercent?: 'low_under_20' | 'moderate_20_50' | 'high_over_50';
  hasBusinessDebt?: boolean;

  // Adaptive: Informal / Gig path
  lowestMonthlyIncome?: number;
  incomeSourceCount?: 'single_source' | '2_to_3_sources' | '4_or_more';
  hasAppLoans?: boolean;

  // Adaptive: Existing obligations & credit
  hasExistingLoans?: boolean;
  hasBounce?: boolean;
  hasRecentMissedPayments?: boolean;
  recentCreditInquiries?: 'none' | '1_to_2' | '3_or_more';

  // Adaptive: Affordability & Savings
  rentExpense?: number;
  emergencySavingsMonths?:
    | 'less_than_1_mo'
    | '1_to_3_mo'
    | '3_to_6_mo'
    | 'more_than_6_mo'
    | 'unknown';

  // Adaptive: Collateral & Productive
  expectedAdditionalIncome?: number;
  hasCollateral?: boolean;
  collateralType?: 'commercial_shop' | 'residential_property' | 'vehicle' | 'gold' | 'other';
  collateralValue?: number;
  collateralDescription?: string;

  // Adaptive: Lender Offer (Negotiation card feed)
  hasLenderOffer?: 'no' | 'yes' | 'comparing';
  quotedAmount?: number;
  quotedRate?: number;
  quotedFee?: number;
  quotedTenure?: number;
  quotedEMI?: number;
  quotedOtherCharges?: number;

  // Metadata
  personaId?: string;
  name?: string;
}

export interface StepDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
}
