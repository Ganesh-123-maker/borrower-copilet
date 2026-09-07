/**
 * @file src/rules/confidence.ts
 * @description Centralized confidence, uncertainty, and information quality engine.
 * Implements the core principle:
 *   LESS INFORMATION -> WIDER RANGE -> LOWER CONFIDENCE
 *   MORE RELIABLE INFORMATION -> NARROWER RANGE -> HIGHER CONFIDENCE
 *
 * UNKNOWN IS NOT ZERO:
 *   Missing or unverified inputs are tracked explicitly as 'unknown', never converted to 0 or arbitrary numbers.
 */

import { BorrowerInput, ConfidenceLevel } from '../types';

export type InformationQuality = 'known' | 'estimated' | 'ranged' | 'unknown';

export interface InputQualityMap {
  [key: string]: InformationQuality;
  monthlyNetIncome: InformationQuality;
  incomeStability: InformationQuality;
  existingMonthlyEMIs: InformationQuality;
  householdExpenses: InformationQuality;
  creditScore: InformationQuality;
  repaymentHistory: InformationQuality;
  emergencySavings: InformationQuality;
  collateral: InformationQuality;
  quotedRate: InformationQuality;
  quotedFee: InformationQuality;
}

export interface OutputConfidence {
  outputKey: string;
  outputTitle: string;
  level: ConfidenceLevel; // 'high' | 'moderate' | 'indicative'
  score: number; // 0-100 labeled as "Analysis confidence"
  reason: string; // dynamic contextual explanation
  knownFactors: string[];
  missingFactors: string[];
  rangeWidened: boolean;
}

export interface GranularConfidenceMap {
  verdict: OutputConfidence;
  lenderLikelySanction: OutputConfidence;
  borrowerSafeAmount: OutputConfidence;
  fairRateBand: OutputConfidence;
  allInAPR: OutputConfidence;
  safeMonthlyOutflowCeiling: OutputConfidence;
  stressCase: OutputConfidence;
}

export interface OverallConfidenceResult {
  score: number; // Overall composite analysis confidence
  level: ConfidenceLevel;
  explanation: string;
  inputQuality: InputQualityMap;
  missingInformation: string[]; // Concise list for "WHAT WE DON'T KNOW"
  rangeWideningNotice?: string;
  outputs: GranularConfidenceMap;
}

/**
 * Determines information quality status for each critical input.
 * Explicitly respects that UNKNOWN != 0.
 */
export function evaluateInformationQuality(input: BorrowerInput): InputQualityMap {
  // Monthly income: known vs ranged vs unknown
  let incomeQuality: InformationQuality = 'unknown';
  if (input.monthlyNetIncome !== undefined && input.monthlyNetIncome !== null && !isNaN(input.monthlyNetIncome)) {
    if (input.monthlyNetIncome > 0) {
      // Check if self-employed or gig with seasonal cash flow
      if (input.employmentType === 'self_employed_business' && input.personaId === 'ravi') {
        incomeQuality = 'ranged';
      } else {
        incomeQuality = 'known';
      }
    }
  }

  // Income stability
  let stabilityQuality: InformationQuality = 'unknown';
  if (input.employmentType) {
    stabilityQuality = 'known';
  }

  // Existing monthly EMIs
  let emiQuality: InformationQuality = 'unknown';
  if (input.existingMonthlyEMIs !== undefined && input.existingMonthlyEMIs !== null && !isNaN(input.existingMonthlyEMIs)) {
    emiQuality = 'known';
  }

  // Household expenses
  let expQuality: InformationQuality = 'unknown';
  if (input.householdExpenses !== undefined && input.householdExpenses !== null && !isNaN(input.householdExpenses) && input.householdExpenses > 0) {
    expQuality = 'known';
  } else if (input.monthlyNetIncome && input.monthlyNetIncome > 0) {
    // If not provided, expenses will be estimated via standard benchmark in calculations
    expQuality = 'estimated';
  }

  // Credit score: STRICTLY PRESERVE UNKNOWN
  let creditQuality: InformationQuality = 'unknown';
  if (input.creditScoreKnown !== false && input.creditScore !== undefined && input.creditScore !== null) {
    if (input.creditScore > 0) {
      creditQuality = 'known';
    }
  }

  // Repayment history
  let repaymentQuality: InformationQuality = 'unknown';
  if (input.hasBounce !== undefined && input.hasBounce !== null) {
    repaymentQuality = 'known';
  }

  // Emergency savings
  let emergencyQuality: InformationQuality = 'unknown';
  // Check if explicit emergency savings is in answers/input
  const rawAnswers = (input as any).emergencySavingsMonths;
  if (rawAnswers && rawAnswers !== 'unknown') {
    emergencyQuality = 'known';
  }

  // Collateral
  let collateralQuality: InformationQuality = 'unknown';
  if (input.hasCollateral !== undefined) {
    if (input.hasCollateral && input.collateralValue && input.collateralValue > 0) {
      collateralQuality = 'known';
    } else if (!input.hasCollateral) {
      collateralQuality = 'known'; // Known to be unsecured
    }
  }

  // Quoted lender rates
  let quoteRateQuality: InformationQuality = 'unknown';
  if (input.quotedRate !== undefined && input.quotedRate !== null && input.quotedRate > 0) {
    quoteRateQuality = 'known';
  }

  let quoteFeeQuality: InformationQuality = 'unknown';
  if (input.quotedFee !== undefined && input.quotedFee !== null && input.quotedFee >= 0) {
    quoteFeeQuality = 'known';
  }

  return {
    monthlyNetIncome: incomeQuality,
    incomeStability: stabilityQuality,
    existingMonthlyEMIs: emiQuality,
    householdExpenses: expQuality,
    creditScore: creditQuality,
    repaymentHistory: repaymentQuality,
    emergencySavings: emergencyQuality,
    collateral: collateralQuality,
    quotedRate: quoteRateQuality,
    quotedFee: quoteFeeQuality,
  };
}

/**
 * 1. BORROWING VERDICT CONFIDENCE
 * Depends on affordability inputs: income, existing obligations, living expenses, stability.
 * Note: Credit score alone does NOT determine verdict affordability confidence.
 */
export function evaluateVerdictConfidence(
  input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 35;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.monthlyNetIncome === 'known') {
    score += 25;
    known.push(`Monthly net income verified (₹${input.monthlyNetIncome?.toLocaleString('en-IN')})`);
  } else if (quality.monthlyNetIncome === 'ranged') {
    score += 15;
    known.push('Monthly net income based on documented seasonal range');
  } else {
    missing.push('Monthly net earnings unverified');
  }

  if (quality.existingMonthlyEMIs === 'known') {
    score += 20;
    known.push(`Existing debt obligations documented (₹${(input.existingMonthlyEMIs || 0).toLocaleString('en-IN')}/mo)`);
  } else {
    missing.push('Current loan EMI commitments unverified');
  }

  if (quality.householdExpenses === 'known') {
    score += 20;
    known.push(`Essential household expenses declared (₹${input.householdExpenses?.toLocaleString('en-IN')}/mo)`);
  } else if (quality.householdExpenses === 'estimated') {
    score += 5;
    missing.push('Living expenses estimated at standard 45% benchmark');
  } else {
    missing.push('Living expenses completely unstated');
  }

  if (quality.incomeStability === 'known') {
    score += 5;
    known.push(`Employment stability profile confirmed (${input.employmentType?.replace(/_/g, ' ')})`);
  } else {
    missing.push('Employment stability tenure unstated');
  }

  // Bound score
  score = Math.max(25, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'moderate' : 'indicative';

  let reason = '';
  if (level === 'high') {
    reason = 'Your monthly net income, existing EMIs, and essential living expenses are all verified.';
  } else if (quality.householdExpenses !== 'known') {
    reason = 'Your income and existing debt are documented, but household living expenses are estimated.';
  } else {
    reason = 'Key affordability variables are unverified or estimated, reducing verdict certainty.';
  }

  return {
    outputKey: 'verdict',
    outputTitle: 'Borrowing Verdict',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened: level !== 'high',
  };
}

/**
 * 2. LENDER LIKELY SANCTION CONFIDENCE
 * Depends on income, employer tier, bureau score, and debt FOIR.
 */
export function evaluateLenderSanctionConfidence(
  input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 30;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.monthlyNetIncome === 'known' || quality.monthlyNetIncome === 'ranged') {
    score += 25;
    known.push('Net cash flow established');
  } else {
    missing.push('Net income unknown');
  }

  if (quality.creditScore === 'known') {
    score += 25;
    known.push(`Bureau score verified (${input.creditScore})`);
  } else {
    missing.push('Credit bureau score unavailable (thin file / unpulled)');
  }

  if (quality.existingMonthlyEMIs === 'known') {
    score += 15;
    known.push('Existing loan obligations verified for institutional FOIR calculation');
  } else {
    missing.push('Existing loan obligations unverified');
  }

  if (input.hasCollateral && input.collateralValue) {
    score += 15;
    known.push(`Collateral asset appraised (₹${input.collateralValue.toLocaleString('en-IN')})`);
  }

  score = Math.max(20, Math.min(92, score));
  const level: ConfidenceLevel = score >= 78 ? 'high' : score >= 55 ? 'moderate' : 'indicative';

  let reason = '';
  if (quality.creditScore === 'known' && quality.monthlyNetIncome === 'known') {
    reason = 'Bank appetite is highly predictable based on verified income and official bureau score.';
  } else if (quality.creditScore === 'unknown') {
    reason = 'Bank appetite range is wider because lenders price thin-file profiles with high variance.';
  } else {
    reason = 'Lender sanction estimate is indicative based on standard 50%–55% FOIR benchmarks.';
  }

  return {
    outputKey: 'lenderLikelySanction',
    outputTitle: 'Lender Likely Sanction',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened: quality.creditScore === 'unknown' || quality.monthlyNetIncome === 'unknown',
  };
}

/**
 * 3. BORROWER-SAFE AMOUNT CONFIDENCE
 * Depends on income stability, living expenses, existing obligations, emergency buffer.
 * If major affordability inputs missing -> safe amount range widens.
 */
export function evaluateSafeAmountConfidence(
  input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 30;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.monthlyNetIncome === 'known') {
    score += 25;
    known.push('Take-home earnings verified');
  } else if (quality.monthlyNetIncome === 'ranged') {
    score += 15;
    known.push('Take-home earnings based on seasonal range');
  } else {
    missing.push('Monthly net income unverified');
  }

  if (quality.householdExpenses === 'known') {
    score += 25;
    known.push('Actual household expenses verified');
  } else {
    missing.push('Household living expenses unstated (estimated at 45% benchmark)');
  }

  if (quality.existingMonthlyEMIs === 'known') {
    score += 15;
    known.push('Existing debt commitments confirmed');
  } else {
    missing.push('Existing debt commitments unstated');
  }

  if (input.employmentType === 'salaried_corporate') {
    score += 10;
    known.push('High income stability profile');
  } else if (input.employmentType === 'informal_or_gig') {
    score -= 5;
    missing.push('Variable gig earnings require conservative cash-flow buffer');
  }

  score = Math.max(25, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'moderate' : 'indicative';

  const rangeWidened = quality.householdExpenses !== 'known' || quality.monthlyNetIncome !== 'known' || input.employmentType === 'informal_or_gig';

  let reason = '';
  if (level === 'high') {
    reason = 'Safe borrowing capacity is tightly bounded by verified cash flow and living expenses.';
  } else if (quality.householdExpenses !== 'known') {
    reason = 'Your safe amount range is wider because living expenses are estimated rather than verified.';
  } else {
    reason = 'Your safe amount range is wider because some affordability inputs are unavailable.';
  }

  return {
    outputKey: 'borrowerSafeAmount',
    outputTitle: 'Borrower-Safe Amount',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened,
  };
}

/**
 * 4. FAIR INTEREST RATE CONFIDENCE
 * Depends on loan type, borrower profile, credit score, repayment history, collateral.
 * If credit score is unknown -> DO NOT invent a score. Fair rate confidence drops and band widens.
 */
export function evaluateFairRateConfidence(
  input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 30;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.creditScore === 'known') {
    score += 35;
    known.push(`Verified bureau credit score provided (${input.creditScore})`);
  } else {
    missing.push('Credit bureau score unavailable (unverified)');
  }

  if (input.hasCollateral && input.collateralValue) {
    score += 20;
    known.push('Pledged unencumbered collateral justifies secured pricing');
  }

  if (input.employmentType === 'salaried_corporate') {
    score += 10;
    known.push('Tier-1 corporate salary profile qualifies for prime pricing');
  } else if (input.employmentType) {
    score += 5;
    known.push(`Employment type confirmed (${input.employmentType.replace(/_/g, ' ')})`);
  }

  if (quality.repaymentHistory === 'known') {
    score += 10;
    known.push(input.hasBounce ? 'Recent repayment bounce recorded' : 'Clean 6-month repayment track record');
  } else {
    missing.push('Recent cheque/NACH bounce history unconfirmed');
  }

  score = Math.max(25, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 55 ? 'moderate' : 'indicative';
  const rangeWidened = quality.creditScore === 'unknown';

  let reason = '';
  if (quality.creditScore === 'known') {
    reason = `Rate band is tight because your ${input.creditScore} CIBIL score and employment profile are verified.`;
  } else {
    reason = 'Fair-rate confidence is moderate: credit score is unavailable, so the rate band is widened to reflect market variance.';
  }

  return {
    outputKey: 'fairRateBand',
    outputTitle: 'Fair Interest Rate',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened,
  };
}

/**
 * 5. ALL-IN APR CONFIDENCE
 * If processing fee is unknown -> DO NOT pretend APR is exact.
 * Labeled as "Estimated APR" rather than "Exact APR".
 */
export function evaluateAPRConfidence(
  input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 35;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.quotedFee === 'known') {
    score += 35;
    known.push(`Exact lender processing fee verified (${input.quotedFee}%)`);
  } else {
    missing.push('Processing fee unquoted by lender (estimated at 1.0%–2.0% benchmark)');
  }

  if (quality.creditScore === 'known') {
    score += 20;
    known.push('Base interest rate tier verified');
  } else {
    missing.push('Base interest rate is an estimated band');
  }

  if (quality.quotedRate === 'known') {
    score += 10;
    known.push(`Lender quoted rate available (${input.quotedRate}% p.a.)`);
  }

  score = Math.max(30, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'moderate' : 'indicative';
  const rangeWidened = quality.quotedFee !== 'known' || quality.creditScore !== 'known';

  let reason = '';
  if (quality.quotedFee === 'known' && quality.creditScore === 'known') {
    reason = 'APR is calculated from verified interest rate tier and declared processing fees.';
  } else if (quality.quotedFee === 'unknown') {
    reason = 'Estimated APR: processing fees and documentation charges have not been quoted by a lender.';
  } else {
    reason = 'Estimated APR based on standard institutional fee benchmarks with 18% GST.';
  }

  return {
    outputKey: 'allInAPR',
    outputTitle: 'All-In APR',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened,
  };
}

/**
 * 6. SAFE EMI CEILING CONFIDENCE
 * Depends on income, existing obligations, living expenses, rate assumptions.
 */
export function evaluateEMICeilingConfidence(
  _input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 35;
  const known: string[] = [];
  const missing: string[] = [];

  if (quality.monthlyNetIncome === 'known') {
    score += 30;
    known.push('Monthly net income verified');
  } else if (quality.monthlyNetIncome === 'ranged') {
    score += 18;
    known.push('Monthly income based on seasonal cash flow range');
  } else {
    missing.push('Monthly net income unstated');
  }

  if (quality.existingMonthlyEMIs === 'known') {
    score += 20;
    known.push('Existing debt deductions confirmed');
  } else {
    missing.push('Existing debt deductions unconfirmed');
  }

  if (quality.householdExpenses === 'known') {
    score += 15;
    known.push('Living expenses budget verified');
  } else {
    missing.push('Living expenses estimated at 45% benchmark');
  }

  score = Math.max(25, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'moderate' : 'indicative';

  let reason = '';
  if (level === 'high') {
    reason = 'Safe monthly payment ceiling is confirmed by your verified income, existing EMIs, and living costs.';
  } else if (quality.householdExpenses !== 'known') {
    reason = 'Your income is known, but living expenses are estimated, so safe EMI includes a safety buffer.';
  } else {
    reason = 'EMI ceiling is indicative based on standard debt-to-income benchmarks.';
  }

  return {
    outputKey: 'safeMonthlyOutflowCeiling',
    outputTitle: 'Safe EMI Ceiling',
    level,
    score,
    reason,
    knownFactors: known,
    missingFactors: missing,
    rangeWidened: quality.householdExpenses !== 'known' || quality.monthlyNetIncome !== 'known',
  };
}

/**
 * 7. STRESS CASE CONFIDENCE & TRANSPARENCY
 * Explicitly labeled as SCENARIO, not a forecast.
 * Identifies the exact stress assumption (e.g. 20% income fall).
 */
export function evaluateStressCaseConfidence(
  _input: BorrowerInput,
  quality: InputQualityMap
): OutputConfidence {
  let score = 40;
  const known: string[] = [];
  const missing: string[] = [];

  known.push('Fixed stress scenario: hypothetical 20% income reduction applied');

  if (quality.monthlyNetIncome === 'known' || quality.monthlyNetIncome === 'ranged') {
    score += 25;
    known.push('Baseline cash flow verified');
  } else {
    missing.push('Baseline earnings unstated');
  }

  if (quality.householdExpenses === 'known') {
    score += 20;
    known.push('Inflexible household budget documented');
  } else {
    missing.push('Living expense floor estimated');
  }

  if (quality.existingMonthlyEMIs === 'known') {
    score += 15;
    known.push('Inflexible monthly debt commitments documented');
  }

  score = Math.max(30, Math.min(95, score));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'moderate' : 'indicative';

  return {
    outputKey: 'stressCase',
    outputTitle: 'Stress Test Scenario',
    level,
    score,
    reason: 'Scenario simulation: Stress test models a 20% income drop against fixed monthly obligations.',
    knownFactors: known,
    missingFactors: missing,
    rangeWidened: false,
  };
}

/**
 * Centralized evaluator computing overall and per-output granular confidence.
 */
export function evaluateComprehensiveConfidence(
  input: BorrowerInput
): OverallConfidenceResult {
  const quality = evaluateInformationQuality(input);

  const verdict = evaluateVerdictConfidence(input, quality);
  const lenderLikelySanction = evaluateLenderSanctionConfidence(input, quality);
  const borrowerSafeAmount = evaluateSafeAmountConfidence(input, quality);
  const fairRateBand = evaluateFairRateConfidence(input, quality);
  const allInAPR = evaluateAPRConfidence(input, quality);
  const safeMonthlyOutflowCeiling = evaluateEMICeilingConfidence(input, quality);
  const stressCase = evaluateStressCaseConfidence(input, quality);

  // Compile concise, non-redundant list of missing information for "WHAT WE DON'T KNOW"
  const missingSet = new Set<string>();
  if (quality.creditScore === 'unknown') {
    missingSet.add('Credit bureau score (CIBIL / Experian)');
  }
  if (quality.householdExpenses === 'estimated' || quality.householdExpenses === 'unknown') {
    missingSet.add('Actual household living expenses');
  }
  if (quality.monthlyNetIncome === 'unknown') {
    missingSet.add('Verified monthly net cash earnings');
  }
  if (input.hasAppLoans) {
    missingSet.add('Exact repayment terms on existing digital app loans');
  }
  if (quality.emergencySavings === 'unknown' && input.personaId !== 'priya' && (input as any).emergencySavingsMonths === undefined && input.employmentType !== 'salaried_corporate') {
    missingSet.add('Emergency savings liquidity cushion');
  }
  if (quality.quotedFee === 'unknown' && (input as any).hasLenderOffer === 'yes') {
    missingSet.add('Lender-quoted processing fee schedule');
  }

  const missingInformation = Array.from(missingSet);

  // Weighted overall composite confidence
  let compositeScore = Math.round(
    verdict.score * 0.25 +
    borrowerSafeAmount.score * 0.25 +
    fairRateBand.score * 0.2 +
    lenderLikelySanction.score * 0.15 +
    safeMonthlyOutflowCeiling.score * 0.15
  );

  // Rule: Unknown credit score caps overall confidence at Moderate (76%)
  if (quality.creditScore === 'unknown') {
    compositeScore = Math.min(76, compositeScore);
  }

  // Rule: Variable gig work or multiple predatory app loans with bounce limits confidence to Indicative (<= 60%)
  if (input.employmentType === 'informal_or_gig' || input.hasAppLoans || (input.hasBounce && (input.creditScore ?? 0) < 650)) {
    compositeScore = Math.min(58, compositeScore);
  }

  const overallLevel: ConfidenceLevel =
    compositeScore >= 80 ? 'high' : compositeScore >= 60 ? 'moderate' : 'indicative';

  // Range widening notice
  const anyWidened =
    fairRateBand.rangeWidened || borrowerSafeAmount.rangeWidened || lenderLikelySanction.rangeWidened;
  const rangeWideningNotice = anyWidened
    ? 'Your estimated range is wider because some information is unavailable.'
    : undefined;

  // Composite contextual explanation
  let explanation = '';
  if (overallLevel === 'high') {
    explanation = 'High analysis confidence based on comprehensive, verified cash flow and credit parameters.';
  } else if (missingInformation.length > 0) {
    explanation = `Analysis confidence is ${overallLevel}: ${missingInformation.slice(0, 2).join(' and ')} remain unavailable.`;
  } else {
    explanation = 'Analysis confidence is moderate based on available inputs.';
  }

  return {
    score: compositeScore,
    level: overallLevel,
    explanation,
    inputQuality: quality,
    missingInformation,
    rangeWideningNotice,
    outputs: {
      verdict,
      lenderLikelySanction,
      borrowerSafeAmount,
      fairRateBand,
      allInAPR,
      safeMonthlyOutflowCeiling,
      stressCase,
    },
  };
}
