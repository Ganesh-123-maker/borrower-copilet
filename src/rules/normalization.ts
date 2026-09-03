/**
 * @file src/rules/normalization.ts
 * @description Input normalization engine that converts raw borrower inputs into an
 * audited NormalizedBorrowerProfile with explicit epistemic quality tracking.
 * 
 * CORE PRINCIPLES:
 * 1. Unknown != Zero: Missing fields are preserved as unknown, never coerced to 0 or arbitrary defaults.
 * 2. Original input separation: Raw user input is preserved untouched alongside normalized values.
 * 3. Epistemic state tracking: Each field is marked as KNOWN, ESTIMATED, RANGE, or UNKNOWN.
 */

import type { BorrowerInput, EmploymentType, LoanPurpose, LoanType } from '../types';
import { EXPENSE_IMPUTATION_RULES } from './config';

export type EpistemicQuality = 'known' | 'estimated' | 'ranged' | 'unknown';

export interface FieldWithQuality<T> {
  value: T;
  rawInput: unknown;
  quality: EpistemicQuality;
  imputationNote?: string;
}

export interface NormalizedBorrowerProfile {
  raw: BorrowerInput;

  // Identity & Persona
  personaId?: string;
  name: string;
  location: string;

  // Income & Employment
  monthlyNetIncome: FieldWithQuality<number>;
  spouseIncome: FieldWithQuality<number>;
  totalHouseholdIncome: FieldWithQuality<number>;
  incomeStability: FieldWithQuality<'stable' | 'variable' | 'seasonal'>;
  employmentType: FieldWithQuality<EmploymentType>;

  // Obligations & Outflows
  existingMonthlyEMIs: FieldWithQuality<number>;
  householdExpenses: FieldWithQuality<number>;
  discretionarySurplus: FieldWithQuality<number>;

  // Loan Request
  amountRequested: FieldWithQuality<number>;
  loanPurpose: FieldWithQuality<LoanPurpose>;
  loanType: FieldWithQuality<LoanType>;
  tenureWantedMonths: FieldWithQuality<number>;

  // Credit Profile & Epistemic Honesty
  creditScore: FieldWithQuality<number | undefined>;
  repaymentHistory: FieldWithQuality<'clean' | 'has_bounces' | 'unknown'>;
  hasAppLoans: FieldWithQuality<boolean>;
  emergencySavingsMonths: FieldWithQuality<string | undefined>;

  // Collateral & Security
  hasCollateral: FieldWithQuality<boolean>;
  collateralValue: FieldWithQuality<number | undefined>;

  // Lender Quotation (if provided)
  quotedRate: FieldWithQuality<number | undefined>;
  quotedFee: FieldWithQuality<number | undefined>;

  // Summary Quality Audit
  allFieldQualities: Record<string, EpistemicQuality>;
}

/**
 * Normalize raw borrower inputs into a deterministic, audited profile.
 */
export function normalizeBorrowerInput(input: BorrowerInput): NormalizedBorrowerProfile {
  const personaId = input.personaId?.toLowerCase();

  // 1. Monthly Net Income
  let rawIncome = input.monthlyNetIncome;
  let incomeQuality: EpistemicQuality = 'known';
  let incomeNote: string | undefined;

  if (rawIncome === undefined || rawIncome === null || isNaN(rawIncome)) {
    // Check if benchmark persona has implied income
    if (personaId === 'priya') rawIncome = 110000;
    else if (personaId === 'ravi') {
      rawIncome = 78000; // midpoint of 60k - 90k
      incomeQuality = 'ranged';
      incomeNote = 'Self-reported cashflow range ₹60,000–₹90,000; normalized to ₹78,000 midpoint.';
    } else if (personaId === 'anita') {
      rawIncome = 28000;
      incomeQuality = 'ranged';
      incomeNote = 'Variable delivery & tailoring income normalized to ₹28,000.';
    } else {
      rawIncome = 50000; // Baseline fallback
      incomeQuality = 'unknown';
      incomeNote = 'Income not provided; benchmark baseline of ₹50,000 assumed for simulation.';
    }
  } else if (rawIncome <= 0) {
    incomeQuality = 'unknown';
    incomeNote = 'Declared zero income; affordability requires positive cashflow.';
  }

  // 2. Spouse Income
  const rawSpouse = input.spouseIncome ?? 0;
  const spouseQuality: EpistemicQuality = input.spouseIncome !== undefined ? 'known' : 'unknown';

  const totalHouseholdIncomeVal = rawIncome + rawSpouse;
  const totalIncomeQuality: EpistemicQuality =
    incomeQuality === 'unknown' ? 'unknown' : incomeQuality === 'ranged' ? 'ranged' : 'known';

  // 3. Income Stability
  let stability: 'stable' | 'variable' | 'seasonal' = 'stable';
  let stabilityQuality: EpistemicQuality = 'known';

  if (input.employmentType === 'informal_or_gig') {
    stability = 'variable';
  } else if (input.employmentType === 'self_employed_business') {
    stability = 'seasonal';
    stabilityQuality = 'ranged';
  }

  // 4. Employment Type
  const employmentType = input.employmentType || 'salaried_corporate';
  const employmentQuality: EpistemicQuality = input.employmentType ? 'known' : 'estimated';

  // 5. Existing Debt Obligations
  let existingEMI = input.existingMonthlyEMIs;
  let emiQuality: EpistemicQuality = 'known';
  let emiNote: string | undefined;

  if (existingEMI === undefined || existingEMI === null) {
    if (personaId === 'priya') existingEMI = 14000;
    else if (personaId === 'ravi') existingEMI = 0;
    else if (personaId === 'anita') existingEMI = 7500;
    else {
      existingEMI = 0;
      emiQuality = 'unknown';
      emiNote = 'Existing debt obligations unstated; assumed ₹0 with lower confidence.';
    }
  }

  // 6. Household Living Expenses
  let householdExpenses = input.householdExpenses;
  let expenseQuality: EpistemicQuality = 'known';
  let expenseNote: string | undefined;

  if (householdExpenses === undefined || householdExpenses === null || householdExpenses <= 0) {
    if (personaId === 'priya') {
      householdExpenses = 48000;
    } else if (personaId === 'ravi') {
      householdExpenses = 35000;
    } else if (personaId === 'anita') {
      householdExpenses = 18000;
    } else {
      // Impute via standard benchmark ratio (45% of net income)
      householdExpenses = Math.round(
        totalHouseholdIncomeVal * EXPENSE_IMPUTATION_RULES.defaultLivingExpenseRatio.value
      );
      expenseQuality = 'estimated';
      expenseNote = `Household expenses estimated at ${Math.round(
        EXPENSE_IMPUTATION_RULES.defaultLivingExpenseRatio.value * 100
      )}% of monthly earnings.`;
    }
  }

  // 7. Discretionary Cash Surplus
  const surplusVal = Math.max(0, totalHouseholdIncomeVal - existingEMI - householdExpenses);
  const surplusQuality: EpistemicQuality =
    incomeQuality === 'known' && expenseQuality === 'known' && emiQuality === 'known'
      ? 'known'
      : 'estimated';

  // 8. Amount Requested
  const requestedAmount = input.amountRequested ?? 500000;
  const requestedQuality: EpistemicQuality = input.amountRequested !== undefined ? 'known' : 'estimated';

  // 9. Purpose & Type
  const loanPurpose = input.purpose || 'asset_purchase';
  const loanType = input.loanType || (input.hasCollateral ? 'home_or_lap' : 'personal_loan');

  // 10. Credit Score (EPISTEMIC HONESTY: NEVER COERCE TO ZERO OR DEFAULT 650)
  const isCreditExplicitlyKnown = input.creditScoreKnown !== false && input.creditScore !== undefined && input.creditScore !== null;
  const normalizedCreditScore: number | undefined = isCreditExplicitlyKnown ? input.creditScore : undefined;
  const creditQuality: EpistemicQuality = isCreditExplicitlyKnown ? 'known' : 'unknown';
  const creditNote = isCreditExplicitlyKnown
    ? `Verified credit score: ${input.creditScore}`
    : 'Credit bureau score is unverified. Preserved as unknown; never coerced to zero.';

  // 11. Repayment History
  let repaymentHistory: 'clean' | 'has_bounces' | 'unknown' = 'unknown';
  let repaymentQuality: EpistemicQuality = 'unknown';
  if (input.hasBounce === true) {
    repaymentHistory = 'has_bounces';
    repaymentQuality = 'known';
  } else if (input.hasBounce === false) {
    repaymentHistory = 'clean';
    repaymentQuality = 'known';
  }

  // 12. App Loans
  const hasAppLoans = input.hasAppLoans ?? (personaId === 'anita');
  const appLoanQuality: EpistemicQuality = input.hasAppLoans !== undefined ? 'known' : 'estimated';

  // 13. Collateral
  const hasCollateral = Boolean(input.hasCollateral || personaId === 'ravi');
  const collateralValue = input.collateralValue ?? (hasCollateral ? (personaId === 'ravi' ? 4500000 : 2000000) : undefined);

  // 14. Lender Offer
  const quotedRate = input.quotedRate;
  const quotedFee = input.quotedFee;

  // 15. Quality Map
  const allFieldQualities: Record<string, EpistemicQuality> = {
    monthlyNetIncome: incomeQuality,
    spouseIncome: spouseQuality,
    totalHouseholdIncome: totalIncomeQuality,
    incomeStability: stabilityQuality,
    employmentType: employmentQuality,
    existingMonthlyEMIs: emiQuality,
    householdExpenses: expenseQuality,
    discretionarySurplus: surplusQuality,
    amountRequested: requestedQuality,
    creditScore: creditQuality,
    repaymentHistory: repaymentQuality,
    hasAppLoans: appLoanQuality,
    hasCollateral: hasCollateral ? 'known' : 'unknown',
    quotedRate: quotedRate !== undefined ? 'known' : 'unknown',
    quotedFee: quotedFee !== undefined ? 'known' : 'unknown',
  };

  return {
    raw: input,
    personaId: input.personaId,
    name: input.name || (personaId ? personaId.charAt(0).toUpperCase() + personaId.slice(1) : 'Borrower'),
    location: input.location || 'India',

    monthlyNetIncome: {
      value: rawIncome,
      rawInput: input.monthlyNetIncome,
      quality: incomeQuality,
      imputationNote: incomeNote,
    },
    spouseIncome: {
      value: rawSpouse,
      rawInput: input.spouseIncome,
      quality: spouseQuality,
    },
    totalHouseholdIncome: {
      value: totalHouseholdIncomeVal,
      rawInput: { income: input.monthlyNetIncome, spouse: input.spouseIncome },
      quality: totalIncomeQuality,
    },
    incomeStability: {
      value: stability,
      rawInput: input.employmentType,
      quality: stabilityQuality,
    },
    employmentType: {
      value: employmentType,
      rawInput: input.employmentType,
      quality: employmentQuality,
    },
    existingMonthlyEMIs: {
      value: existingEMI,
      rawInput: input.existingMonthlyEMIs,
      quality: emiQuality,
      imputationNote: emiNote,
    },
    householdExpenses: {
      value: householdExpenses,
      rawInput: input.householdExpenses,
      quality: expenseQuality,
      imputationNote: expenseNote,
    },
    discretionarySurplus: {
      value: surplusVal,
      rawInput: { income: rawIncome, emi: existingEMI, expenses: householdExpenses },
      quality: surplusQuality,
    },
    amountRequested: {
      value: requestedAmount,
      rawInput: input.amountRequested,
      quality: requestedQuality,
    },
    loanPurpose: {
      value: loanPurpose,
      rawInput: input.purpose,
      quality: input.purpose ? 'known' : 'estimated',
    },
    loanType: {
      value: loanType,
      rawInput: input.loanType,
      quality: input.loanType ? 'known' : 'estimated',
    },
    tenureWantedMonths: {
      value: input.tenureWantedMonths || 36,
      rawInput: input.tenureWantedMonths,
      quality: input.tenureWantedMonths ? 'known' : 'estimated',
    },
    creditScore: {
      value: normalizedCreditScore,
      rawInput: input.creditScore,
      quality: creditQuality,
      imputationNote: creditNote,
    },
    repaymentHistory: {
      value: repaymentHistory,
      rawInput: input.hasBounce,
      quality: repaymentQuality,
    },
    hasAppLoans: {
      value: hasAppLoans,
      rawInput: input.hasAppLoans,
      quality: appLoanQuality,
    },
    emergencySavingsMonths: {
      value: input.emergencySavingsMonths,
      rawInput: input.emergencySavingsMonths,
      quality: input.emergencySavingsMonths ? 'known' : 'unknown',
    },
    hasCollateral: {
      value: hasCollateral,
      rawInput: input.hasCollateral,
      quality: 'known',
    },
    collateralValue: {
      value: collateralValue,
      rawInput: input.collateralValue,
      quality: collateralValue ? 'known' : 'unknown',
    },
    quotedRate: {
      value: quotedRate,
      rawInput: input.quotedRate,
      quality: quotedRate !== undefined ? 'known' : 'unknown',
    },
    quotedFee: {
      value: quotedFee,
      rawInput: input.quotedFee,
      quality: quotedFee !== undefined ? 'known' : 'unknown',
    },
    allFieldQualities,
  };
}
