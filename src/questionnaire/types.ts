/**
 * @file src/questionnaire/types.ts
 * @description Type definitions for the Borrower Copilot adaptive questionnaire engine.
 * Decoupled from UI rendering components.
 */

import {
  BorrowerInput,
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

import { DataPoint, RangePoint } from '../types';

export interface QuestionnaireAnswers {
  // Must questions
  purpose?: DataPoint<LoanPurpose>;
  loanType?: DataPoint<LoanType>;
  amountRequested?: DataPoint<number>;
  tenureWantedMonths?: DataPoint<number>;
  age?: DataPoint<number>;
  employmentType?: DataPoint<EmploymentType>;
  monthlyNetIncome?: RangePoint<number>;
  incomeStability?: DataPoint<'very_stable' | 'moderately_stable' | 'variable'>;
  existingMonthlyEMIs?: DataPoint<number>;
  householdExpenses?: DataPoint<number>;
  creditScoreKnown?: DataPoint<boolean>;
  creditScore?: DataPoint<number>;

  // Adaptive: Co-applicant
  hasCoapplicant?: DataPoint<boolean>;
  spouseIncome?: DataPoint<number>;

  // Adaptive: Salaried path
  yearsAtEmployer?: DataPoint<'less_than_1_yr' | '1_to_3_yrs' | 'more_than_3_yrs'>;
  hasVariableIncome?: DataPoint<boolean>;
  variableIncomePercent?: DataPoint<number>;
  hasUpcomingExpenseRisk?: DataPoint<boolean>;

  // Adaptive: Self-employed path
  businessVintageYears?: DataPoint<'less_than_2_yrs' | '2_to_5_yrs' | 'more_than_5_yrs'>;
  documentedAnnualIncome?: DataPoint<number>;
  businessVariablePercent?: DataPoint<'low_under_20' | 'moderate_20_50' | 'high_over_50'>;
  hasBusinessDebt?: DataPoint<boolean>;

  // Adaptive: Informal / Gig path
  lowestMonthlyIncome?: DataPoint<number>;
  incomeSourceCount?: DataPoint<'single_source' | '2_to_3_sources' | '4_or_more'>;
  hasAppLoans?: DataPoint<boolean>;

  // Adaptive: Existing obligations & credit
  hasExistingLoans?: DataPoint<boolean>;
  hasBounce?: DataPoint<boolean>;
  hasRecentMissedPayments?: DataPoint<boolean>;
  recentCreditInquiries?: DataPoint<'none' | '1_to_2' | '3_or_more'>;

  // Adaptive: Affordability & Savings
  rentExpense?: DataPoint<number>;
  emergencySavingsMonths?: DataPoint<'less_than_1_mo' | '1_to_3_mo' | '3_to_6_mo' | 'more_than_6_mo' | 'unknown'>;

  // Adaptive: Collateral & Productive
  expectedAdditionalIncome?: DataPoint<number>;
  hasCollateral?: DataPoint<boolean>;
  collateralType?: DataPoint<'commercial_shop' | 'residential_property' | 'vehicle' | 'gold' | 'other'>;
  collateralValue?: DataPoint<number>;
  collateralDescription?: DataPoint<string>;

  // Adaptive: Lender Offer (Negotiation card feed)
  hasLenderOffer?: DataPoint<'no' | 'yes' | 'comparing'>;
  quotedAmount?: DataPoint<number>;
  quotedRate?: DataPoint<number>;
  quotedFee?: DataPoint<number>;
  quotedTenure?: DataPoint<number>;
  quotedEMI?: DataPoint<number>;
  quotedOtherCharges?: DataPoint<number>;

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
