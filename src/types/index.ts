/**
 * @file src/types/index.ts
 * @description Core TypeScript contracts for Borrower Copilot.
 * Architecture Note: Strict domain separation - types are independent of UI components.
 */

export type LoanPurpose =
  | 'wedding_or_family_event'
  | 'business_expansion'
  | 'asset_purchase'
  | 'debt_consolidation'
  | 'emergency_or_medical'
  | 'other';

export type LoanType =
  | 'personal_loan'
  | 'business_loan'
  | 'home_or_lap'
  | 'vehicle_loan'
  | 'gold_loan'
  | 'digital_micro_loan';

export type EmploymentType =
  | 'salaried_corporate'
  | 'salaried_regular'
  | 'self_employed_business'
  | 'self_employed_professional'
  | 'informal_or_gig';

export type VerdictStatus = 'borrow' | 'borrow_less' | 'dont_borrow';

export type ConfidenceLevel = 'high' | 'moderate' | 'indicative';

export type Known<T> = { status: 'known'; value: T };
export type Unknown = { status: 'unknown' };
export type Range<T> = { status: 'range'; min: T; max: T };
export type DataPoint<T> = Known<T> | Unknown;
export type RangePoint<T> = Known<T> | Range<T> | Unknown;

export interface BorrowerProfile {
  // PERSONAL
  personaId?: string;
  name?: string;
  location?: DataPoint<string>;
  age?: DataPoint<number>;

  // INCOME
  employmentType?: DataPoint<EmploymentType>;
  monthlyNetIncome?: RangePoint<number>;
  incomeStability?: DataPoint<'very_stable' | 'moderately_stable' | 'variable'>;
  variableIncomePercentage?: DataPoint<number>;
  documentedAnnualIncome?: DataPoint<number>;

  // OBLIGATIONS
  existingMonthlyEMIs?: DataPoint<number>;
  existingLoans?: DataPoint<boolean>;
  householdExpenses?: DataPoint<number>;
  upcomingLargeExpenses?: DataPoint<boolean>;

  // CREDIT
  creditScore?: DataPoint<number>;
  creditScoreKnown?: DataPoint<boolean>;
  repaymentHistory?: DataPoint<'clean' | 'missed_payments' | 'bounce'>;
  recentBounces?: DataPoint<boolean>;
  creditUtilisation?: DataPoint<number>;

  // LOAN
  loanType?: DataPoint<LoanType>;
  requestedAmount?: DataPoint<number>;
  requestedTenure?: DataPoint<number>;
  loanPurpose?: DataPoint<LoanPurpose>;

  // PRODUCTIVE USE
  expectedAdditionalMonthlyIncome?: DataPoint<number>;

  // COLLATERAL
  hasCollateral?: DataPoint<boolean>;
  collateralType?: DataPoint<'commercial_shop' | 'residential_property' | 'vehicle' | 'gold' | 'other'>;
  collateralValue?: DataPoint<number>;
  collateralEncumbered?: DataPoint<boolean>;

  // CO-APPLICANT
  hasCoApplicant?: DataPoint<boolean>;
  coApplicantIncome?: DataPoint<number>;

  // SAVINGS
  emergencySavingsMonths?: DataPoint<'less_than_1_mo' | '1_to_3_mo' | '3_to_6_mo' | 'more_than_6_mo' | 'unknown'>;

  // LENDER OFFER
  hasLenderOffer?: DataPoint<'no' | 'yes' | 'comparing'>;
  quotedAmount?: DataPoint<number>;
  quotedInterestRate?: DataPoint<number>;
  processingFee?: DataPoint<number>;
  quotedEMI?: DataPoint<number>;
  quotedTenure?: DataPoint<number>;
  otherMandatoryCharges?: DataPoint<number>;
}

export interface BorrowerInput {
  personaId?: string;
  name?: string;
  location?: string;
  age?: number;
  purpose?: LoanPurpose;
  amountRequested?: number;
  loanType?: LoanType;
  monthlyNetIncome?: number;
  spouseIncome?: number;
  employmentType?: EmploymentType;
  existingMonthlyEMIs?: number;
  householdExpenses?: number;
  creditScoreKnown?: boolean;
  creditScore?: number;
  hasCollateral?: boolean;
  collateralValue?: number;
  collateralDescription?: string;
  hasAppLoans?: boolean;
  hasBounce?: boolean;
  tenureWantedMonths?: number;
  quotedRate?: number;
  quotedFee?: number;
  quotedAmount?: number;
  quotedTenure?: number;
  quotedEMI?: number;
  quotedOtherCharges?: number;
  hasLenderOffer?: boolean;
  lenderOffer?: LenderOfferInput;
  emergencySavingsMonths?: string;
}


export interface LenderOfferInput {
  hasOffer?: boolean;
  quotedAmount?: number;
  quotedRate?: number;
  quotedFee?: number;
  quotedTenure?: number;
  quotedEMI?: number;
  quotedOtherCharges?: number;
  isAmountUnknown?: boolean;
  isRateUnknown?: boolean;
  isFeeUnknown?: boolean;
  isTenureUnknown?: boolean;
  isEMIUnknown?: boolean;
  isOtherChargesUnknown?: boolean;
}

export type ComparisonStatus =
  | 'within_range'
  | 'above_range'
  | 'below_range'
  | 'within_safe_limit'
  | 'above_safe_limit'
  | 'below_safe_limit'
  | 'unknown';

export interface MetricComparisonItem {
  id: 'amount' | 'rate' | 'apr' | 'emi' | 'tenure';
  metric: string;
  myAssessment: string;
  lenderOffer: string;
  status: ComparisonStatus;
  statusLabel: string;
  explanation: string;
  isWarning: boolean;
}

export interface NegotiationGuidance {
  cardState: 'no_offer' | 'offer_available' | 'incomplete_offer';
  points: string[];
  questionsToAsk: string[];
  priorities: string[];
  script: string;
  comparisons: MetricComparisonItem[];
  primaryPriority: string;
  hasOffer: boolean;
  isIncomplete: boolean;
  tradeoffs?: {
    shorterTenure?: { months: number; emi: number; totalInterest: number; differenceNote: string };
    longerTenure?: { months: number; emi: number; totalInterest: number; differenceNote: string };
    explanation: string;
  };
}

export interface TenureOption {
  months: number;
  emi: number;
  totalInterest: number;
  isSuggested?: boolean;
}

export interface StressCaseDetail {
  scenario: string;
  currentSafeEMI: number;
  stressedSafeEMI: number;
  status: 'within_limit' | 'exceeds_limit';
  impactExplanation: string;
}

export interface ConfidenceDetail {
  percentage: number;
  level: ConfidenceLevel;
  explanation: string;
  unknownFactors?: string[];
}

export interface AssessmentOutput {
  // O1: Verdict
  verdict: VerdictStatus;
  verdictReason: string;

  // O2: Dual Amount
  lenderLikelySanction: {
    min: number;
    max: number;
    explanation: string;
  };
  borrowerSafeAmount: {
    min: number;
    max: number;
    explanation: string;
  };
  recommendedAmountAction: string;

  // O3: Fair Rate & APR
  fairRateBand: {
    min: number;
    max: number;
    unit: string;
    explanation: string;
  };
  allInAPR: {
    min: number;
    max: number;
    estimatedFeesPercent: number;
    explanation: string;
  };

  // O4: Safe EMI & Outflows
  safeMonthlyOutflowCeiling: {
    maxEMI: number;
    explanation: string;
  };
  suggestedTenure: number;
  tenureOptions: TenureOption[];

  // Scenario stress test
  stressCase: StressCaseDetail;

  // Confidence & Transparency
  confidence: ConfidenceLevel;
  confidenceScore: number;
  confidenceDetail: ConfidenceDetail;
  granularConfidence?: {
    verdict?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    lenderLikelySanction?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    borrowerSafeAmount?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    fairRateBand?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    allInAPR?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    safeMonthlyOutflowCeiling?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
    stressCase?: { level: ConfidenceLevel; score: number; reason: string; knownFactors: string[]; missingFactors: string[]; rangeWidened: boolean };
  };
  missingInformation?: string[];
  rangeWidened?: boolean;
  rangeWideningNotice?: string;
  inputQuality?: Record<string, 'known' | 'estimated' | 'ranged' | 'unknown'>;

  // Explanations & Negotiation points
  reasons: string[];
  negotiationPoints: string[];
  negotiation: NegotiationGuidance;

  // Phase 5 Structured Pipeline Properties
  requestedAmount?: number;
  recommendedAmount?: number;
  affordability?: {
    income: number;
    existingEMI: number;
    householdExpenses: number;
    maxAffordableNewEMI: number;
    resultingFOIR: number;
    currentDebtService: number;
    foirCeiling: number;
    explanation: string;
  };
  fairRate?: {
    low: number;
    high: number;
    confidence: ConfidenceLevel;
    explanation: string;
  };
  apr?: {
    low: number;
    high: number;
    status: 'known' | 'estimated' | 'unknown';
    explanation: string;
  };
  emi?: {
    safeCeiling: number;
    recommended: number;
    options: TenureOption[];
  };
  structuredExplanations?: Array<{
    key: string;
    title: string;
    bullets: string[];
  }>;

  // Metadata
  personaId?: string;
  personaName?: string;
  borrowerInput: BorrowerInput;
}
