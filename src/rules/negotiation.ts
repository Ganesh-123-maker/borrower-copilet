/**
 * @file src/rules/negotiation.ts
 * @description Dedicated Negotiation Point Generator and Lender-Offer Comparison engine.
 * 
 * THE CORE PURPOSE:
 * Answers: "What should I ask the lender for?"
 * 
 * CORE RULES IMPLEMENTED:
 *   Rule 1: Fair Rate Comparison (Within / Above / Below Fair Range)
 *   Rule 2: All-In APR Comparison (Headline Rate vs All-In Cost with Fees & GST)
 *   Rule 3: Safe EMI Comparison (Within Safe EMI vs Above Safe EMI)
 *   Rule 4: Loan Amount Comparison (Within Safe Limit vs Above Safe Limit)
 *   Rule 5: Tenure Trade-Off (Shorter vs Longer Tenure cash flow vs interest)
 *   Priorities Engine: Identifies and ranks the #1 negotiation priority
 *   Script Generator: Generates realistic borrower scripts with calibrated confidence
 * 
 * Strict architectural rule: Pure deterministic calculation. No UI components.
 */

import type {
  AssessmentOutput,
  LenderOfferInput,
  MetricComparisonItem,
  NegotiationGuidance,
  ComparisonStatus,
} from '../types';
import { calculateIndicativeAPR, calculateReducingEMI } from '../calculations';
import { formatINR } from '../utils/formatters';

/**
 * Extracts and consolidates the active lender offer from explicit argument or assessment inputs.
 */
export function extractLenderOffer(
  assessment: AssessmentOutput,
  explicitOffer?: Partial<LenderOfferInput>
): LenderOfferInput {
  const bInput = assessment.borrowerInput || {};
  const embeddedOffer = bInput.lenderOffer || {};

  const hasOffer =
    explicitOffer?.hasOffer !== undefined
      ? explicitOffer.hasOffer
      : embeddedOffer.hasOffer !== undefined
      ? embeddedOffer.hasOffer
      : bInput.hasLenderOffer === true ||
        (bInput as any).hasLenderOffer === 'yes' ||
        (bInput as any).hasLenderOffer === 'comparing' ||
        explicitOffer?.quotedRate !== undefined ||
        explicitOffer?.quotedAmount !== undefined ||
        explicitOffer?.quotedEMI !== undefined ||
        bInput.quotedRate !== undefined ||
        bInput.quotedFee !== undefined ||
        bInput.quotedAmount !== undefined ||
        bInput.quotedEMI !== undefined;

  return {
    hasOffer: Boolean(hasOffer),
    quotedAmount: explicitOffer?.quotedAmount ?? embeddedOffer.quotedAmount ?? bInput.quotedAmount,
    quotedRate: explicitOffer?.quotedRate ?? embeddedOffer.quotedRate ?? bInput.quotedRate,
    quotedFee: explicitOffer?.quotedFee ?? embeddedOffer.quotedFee ?? bInput.quotedFee,
    quotedTenure: explicitOffer?.quotedTenure ?? embeddedOffer.quotedTenure ?? bInput.quotedTenure,
    quotedEMI: explicitOffer?.quotedEMI ?? embeddedOffer.quotedEMI ?? bInput.quotedEMI,
    quotedOtherCharges:
      explicitOffer?.quotedOtherCharges ?? embeddedOffer.quotedOtherCharges ?? bInput.quotedOtherCharges,
    isAmountUnknown: explicitOffer?.isAmountUnknown ?? embeddedOffer.isAmountUnknown,
    isRateUnknown: explicitOffer?.isRateUnknown ?? embeddedOffer.isRateUnknown,
    isFeeUnknown: explicitOffer?.isFeeUnknown ?? embeddedOffer.isFeeUnknown,
    isTenureUnknown: explicitOffer?.isTenureUnknown ?? embeddedOffer.isTenureUnknown,
    isEMIUnknown: explicitOffer?.isEMIUnknown ?? embeddedOffer.isEMIUnknown,
    isOtherChargesUnknown: explicitOffer?.isOtherChargesUnknown ?? embeddedOffer.isOtherChargesUnknown,
  };
}

/**
 * Pure deterministic negotiation guidance generator.
 */
export function generateNegotiationGuidance(
  assessment: AssessmentOutput,
  explicitOffer?: Partial<LenderOfferInput>
): NegotiationGuidance {
  const offer = extractLenderOffer(assessment, explicitOffer);

  // 1. Core anchors from structured result object (DO NOT hard-code)
  const fairRateLow = assessment.fairRate?.low ?? assessment.fairRateBand.min;
  const fairRateHigh = assessment.fairRate?.high ?? assessment.fairRateBand.max;
  const aprLow = assessment.apr?.low ?? assessment.allInAPR.min;
  const aprHigh = assessment.apr?.high ?? assessment.allInAPR.max;
  const safeEMI = assessment.emi?.safeCeiling ?? assessment.safeMonthlyOutflowCeiling.maxEMI;
  const safeAmount = assessment.borrowerSafeAmount.max;
  const suggestedTenure = assessment.suggestedTenure || 36;
  const requestedAmount = assessment.requestedAmount ?? assessment.borrowerInput.amountRequested;

  // 2. Determine card state
  let cardState: 'no_offer' | 'offer_available' | 'incomplete_offer' = 'no_offer';
  if (!offer.hasOffer) {
    cardState = 'no_offer';
  } else {
    // If offer is claimed but key costs (rate, fee, or EMI) are omitted or marked unknown
    const isFeeMissing = offer.quotedFee === undefined || offer.isFeeUnknown === true;
    const isRateMissing = offer.quotedRate === undefined || offer.isRateUnknown === true;
    const isEMIMissing = offer.quotedEMI === undefined || offer.isEMIUnknown === true;

    if (isFeeMissing || isRateMissing || isEMIMissing) {
      cardState = 'incomplete_offer';
    } else {
      cardState = 'offer_available';
    }
  }

  // 3. Comparisons List
  const comparisons: MetricComparisonItem[] = [];

  // Comparison Item 1: Loan Amount
  if (!offer.hasOffer || (offer.quotedAmount === undefined && offer.isAmountUnknown)) {
    comparisons.push({
      id: 'amount',
      metric: 'Loan Amount',
      myAssessment: `₹${formatINR(safeAmount)} safe limit`,
      lenderOffer: offer.hasOffer ? 'Unknown / Not quoted' : 'No offer yet',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Your safe borrowing boundary is ₹${formatINR(safeAmount)}.`,
      isWarning: false,
    });
  } else if (offer.quotedAmount !== undefined) {
    const isAboveSafe = offer.quotedAmount > safeAmount;
    comparisons.push({
      id: 'amount',
      metric: 'Loan Amount',
      myAssessment: `₹${formatINR(safeAmount)} safe limit`,
      lenderOffer: `₹${formatINR(offer.quotedAmount)}`,
      status: isAboveSafe ? 'above_safe_limit' : 'within_safe_limit',
      statusLabel: isAboveSafe ? 'ABOVE SAFE LIMIT' : 'WITHIN SAFE LIMIT',
      explanation: isAboveSafe
        ? `The offered amount is above my current borrower-safe limit of ₹${formatINR(safeAmount)}.`
        : 'Loan amount is within my current safe borrowing limit.',
      isWarning: isAboveSafe,
    });
  } else {
    comparisons.push({
      id: 'amount',
      metric: 'Loan Amount',
      myAssessment: `₹${formatINR(safeAmount)} safe limit`,
      lenderOffer: 'Not quoted',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Your safe borrowing boundary is ₹${formatINR(safeAmount)}.`,
      isWarning: false,
    });
  }

  // Comparison Item 2: Interest Rate
  if (!offer.hasOffer || (offer.quotedRate === undefined && offer.isRateUnknown)) {
    comparisons.push({
      id: 'rate',
      metric: 'Interest Rate',
      myAssessment: `${fairRateLow}% – ${fairRateHigh}% p.a.`,
      lenderOffer: offer.hasOffer ? 'Unknown / Not quoted' : 'No offer yet',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Estimated fair risk-adjusted pricing is ${fairRateLow}%–${fairRateHigh}%.`,
      isWarning: false,
    });
  } else if (offer.quotedRate !== undefined) {
    let rateStatus: ComparisonStatus = 'within_range';
    let rateLabel = 'WITHIN FAIR RANGE';
    let rateWarning = false;
    let rateExpl = 'Quoted rate falls within the estimated fair range.';

    if (offer.quotedRate > fairRateHigh) {
      rateStatus = 'above_range';
      rateLabel = 'ABOVE FAIR RANGE';
      rateWarning = true;
      rateExpl = 'Quoted rate is above the estimated fair range.';
    } else if (offer.quotedRate < fairRateLow) {
      rateStatus = 'below_range';
      rateLabel = 'BELOW FAIR RANGE';
      rateWarning = false;
      rateExpl = 'Quoted rate is below the estimated fair range. Please confirm the complete fee structure and APR.';
    }

    comparisons.push({
      id: 'rate',
      metric: 'Interest Rate',
      myAssessment: `${fairRateLow}% – ${fairRateHigh}%`,
      lenderOffer: `${offer.quotedRate}%`,
      status: rateStatus,
      statusLabel: rateLabel,
      explanation: rateExpl,
      isWarning: rateWarning,
    });
  } else {
    comparisons.push({
      id: 'rate',
      metric: 'Interest Rate',
      myAssessment: `${fairRateLow}% – ${fairRateHigh}%`,
      lenderOffer: 'Not quoted',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Target fair rate band is ${fairRateLow}%–${fairRateHigh}%.`,
      isWarning: false,
    });
  }

  // Comparison Item 3: All-In APR
  let calculatedLenderAPR: number | undefined = undefined;
  if (offer.quotedRate !== undefined && offer.quotedFee !== undefined && !offer.isFeeUnknown) {
    let effectiveFee = offer.quotedFee;
    if (offer.quotedOtherCharges && offer.quotedOtherCharges > 0) {
      const basePrincipal = offer.quotedAmount || safeAmount || 500000;
      effectiveFee += (offer.quotedOtherCharges / basePrincipal) * 100;
    }
    calculatedLenderAPR = calculateIndicativeAPR(offer.quotedRate, effectiveFee);
  }

  if (!offer.hasOffer || calculatedLenderAPR === undefined) {
    comparisons.push({
      id: 'apr',
      metric: 'All-In APR',
      myAssessment: `${aprLow}% – ${aprHigh}%`,
      lenderOffer: offer.hasOffer ? 'Unknown (Fees unquoted)' : 'No offer yet',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: offer.hasOffer
        ? 'Processing fees and mandatory charges are unquoted. Never treat unquoted fees as ₹0.'
        : `Benchmark all-in APR factoring in statutory 18% GST on fees is ${aprLow}%–${aprHigh}%.`,
      isWarning: Boolean(offer.hasOffer), // Missing fee in an active quote is an epistemic transparency warning
    });
  } else {
    const isHighFee = offer.quotedFee !== undefined && offer.quotedFee > 2.5;
    const isAboveAPR = calculatedLenderAPR > aprHigh || isHighFee;
    const isBelowAPR = calculatedLenderAPR < aprLow && !isHighFee;
    const formattedAPR = calculatedLenderAPR.toFixed(1);
    comparisons.push({
      id: 'apr',
      metric: 'All-In APR',
      myAssessment: `${aprLow}% – ${aprHigh}%`,
      lenderOffer: `${formattedAPR}%`,
      status: isAboveAPR ? 'above_range' : isBelowAPR ? 'below_range' : 'within_range',
      statusLabel: isAboveAPR ? 'ABOVE RANGE' : isBelowAPR ? 'BELOW RANGE' : 'WITHIN RANGE',
      explanation: isAboveAPR
        ? `Lender's all-in APR (${formattedAPR}%) ${isHighFee ? 'is inflated by high processing fees' : 'exceeds expected ceiling'}.`
        : isBelowAPR
        ? `Lender's all-in APR (${formattedAPR}%) is below baseline. Confirm no hidden insurance or late-penalty clauses.`
        : `Lender's all-in APR (${formattedAPR}%) is within expected range.`,
      isWarning: isAboveAPR,
    });
  }

  // Comparison Item 4: Monthly EMI
  const loanPrincipalForEMI = offer.quotedAmount ?? assessment.requestedAmount ?? safeAmount;
  const loanTenureForEMI = offer.quotedTenure ?? assessment.suggestedTenure;
  let estimatedReducingEMI: number | null = null;
  if (offer.hasOffer && offer.quotedEMI === undefined && offer.quotedRate !== undefined && loanTenureForEMI > 0 && loanPrincipalForEMI > 0) {
    estimatedReducingEMI = calculateReducingEMI(loanPrincipalForEMI, offer.quotedRate, loanTenureForEMI);
  }

  if (!offer.hasOffer) {
    comparisons.push({
      id: 'emi',
      metric: 'Monthly EMI',
      myAssessment: `≤ ₹${formatINR(safeEMI)}/mo`,
      lenderOffer: 'No offer yet',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Safe monthly cash flow ceiling is ₹${formatINR(safeEMI)}/month.`,
      isWarning: false,
    });
  } else if (offer.quotedEMI !== undefined) {
    const isAboveEMI = offer.quotedEMI > safeEMI;
    comparisons.push({
      id: 'emi',
      metric: 'Monthly EMI',
      myAssessment: `≤ ₹${formatINR(safeEMI)}/mo`,
      lenderOffer: `₹${formatINR(offer.quotedEMI)}/mo`,
      status: isAboveEMI ? 'above_safe_limit' : 'within_safe_limit',
      statusLabel: isAboveEMI ? 'ABOVE SAFE EMI' : 'WITHIN SAFE EMI',
      explanation: isAboveEMI
        ? `The proposed EMI is above my safe monthly ceiling of ₹${formatINR(safeEMI)}.`
        : 'The proposed EMI is within my current affordability ceiling.',
      isWarning: isAboveEMI,
    });
  } else if (estimatedReducingEMI !== null) {
    const isAboveEMI = estimatedReducingEMI > safeEMI;
    comparisons.push({
      id: 'emi',
      metric: 'Monthly EMI',
      myAssessment: `≤ ₹${formatINR(safeEMI)}/mo`,
      lenderOffer: `₹${formatINR(estimatedReducingEMI)}/mo (est.)`,
      status: isAboveEMI ? 'above_safe_limit' : 'within_safe_limit',
      statusLabel: isAboveEMI ? 'ABOVE SAFE EMI (EST.)' : 'WITHIN SAFE EMI (EST.)',
      explanation: `Official EMI was not quoted by lender. Reducing-balance calculation estimate (₹${formatINR(estimatedReducingEMI)}) shown. Please verify official repayment schedule.`,
      isWarning: isAboveEMI,
    });
  } else {
    comparisons.push({
      id: 'emi',
      metric: 'Monthly EMI',
      myAssessment: `≤ ₹${formatINR(safeEMI)}/mo`,
      lenderOffer: 'Unknown / Not quoted',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Safe monthly cash flow ceiling is ₹${formatINR(safeEMI)}/month. Request written amortisation schedule.`,
      isWarning: false,
    });
  }

  // Comparison Item 5: Tenure
  const offerTenure = offer.quotedTenure;
  if (!offer.hasOffer || offerTenure === undefined) {
    comparisons.push({
      id: 'tenure',
      metric: 'Tenure',
      myAssessment: `${suggestedTenure} months`,
      lenderOffer: offer.hasOffer ? 'Unknown / Not quoted' : 'No offer yet',
      status: 'unknown',
      statusLabel: 'UNKNOWN',
      explanation: `Recommended tenure is ${suggestedTenure} months to balance monthly EMI with total interest.`,
      isWarning: false,
    });
  } else {
    const isShorter = offerTenure < suggestedTenure;
    const isLonger = offerTenure > suggestedTenure;
    comparisons.push({
      id: 'tenure',
      metric: 'Tenure',
      myAssessment: `${suggestedTenure} months`,
      lenderOffer: `${offerTenure} months`,
      status: isShorter ? 'below_range' : isLonger ? 'above_range' : 'within_range',
      statusLabel: isShorter ? 'SHORTER TENURE' : isLonger ? 'LONGER TENURE' : 'MATCHES SUGGESTED',
      explanation: isShorter
        ? 'Shorter tenure increases monthly EMI but reduces total interest.'
        : isLonger
        ? 'Longer tenure reduces EMI but can increase total interest.'
        : 'Lender tenure matches the recommended tenure length.',
      isWarning: false,
    });
  }

  // 4. Points & Actionable Counter-Offer Statements Generator (2–4 concrete points)
  const points: string[] = [];

  if (cardState === 'no_offer') {
    // Standard negotiation boundaries
    points.push(`Ask for a rate within my estimated fair range of ${fairRateLow}%–${fairRateHigh}%.`);
    points.push(`Keep my EMI at or below ${formatINR(safeEMI)}/month.`);
    points.push('Ask for the all-in APR including processing fees and mandatory charges.');

    const bInput = assessment.borrowerInput || {};
    if (bInput.hasCollateral === true || (bInput as any).collateralType) {
      points.push('Leverage collateral to negotiate prime rates or OD facility terms.');
    }
    if (bInput.personaId === 'anita' || (assessment as any).archetype === 'vulnerable' || bInput.purpose === 'emergency_or_medical') {
      points.push('Build emergency cash buffer and reject high-cost instant app loans in favor of MUDRA scheme options.');
    }

    if (safeAmount > 0) {
      points.push(`Avoid borrowing above ${formatINR(safeAmount)} unless my circumstances change.`);
    } else {
      points.push('Avoid commercial borrowing until existing debts are consolidated.');
    }
  } else {
    // Dynamic points responding to specific lender metrics
    // Rule 1: Rate
    if (offer.quotedRate !== undefined) {
      if (offer.quotedRate > fairRateHigh) {
        points.push(`Your quoted rate is above my estimated fair range of ${fairRateLow}%–${fairRateHigh}%. Can you reduce the rate?`);
      } else if (offer.quotedRate < fairRateLow) {
        points.push('Your quoted rate is below my estimated fair range. Please confirm the complete fee structure and APR.');
      } else {
        points.push('Your quoted rate is within my estimated fair range.');
      }
    }

    // Rule 3: EMI
    if (offer.quotedEMI !== undefined) {
      if (offer.quotedEMI > safeEMI) {
        points.push(`The proposed EMI is above my safe monthly ceiling of ₹${formatINR(safeEMI)}. Please show a lower-EMI structure or longer tenure.`);
      } else {
        points.push('The proposed EMI is within my current affordability ceiling.');
      }
    }

    // Rule 4: Loan Amount
    if (offer.quotedAmount !== undefined) {
      if (offer.quotedAmount > safeAmount) {
        points.push(`The offered amount is above my current borrower-safe limit of ₹${formatINR(safeAmount)}.`);
      } else {
        points.push('Loan amount is within my current safe borrowing limit.');
      }
    } else if (requestedAmount !== undefined && safeAmount > 0 && requestedAmount > safeAmount) {
      points.push('Consider borrowing less rather than maximizing the sanctioned amount.');
    }

    // Rule 2: APR & Fees
    if (calculatedLenderAPR !== undefined && calculatedLenderAPR > aprHigh) {
      points.push("The lender's all-in cost is above my estimate. Please explain the processing fee and other mandatory charges.");
    } else if (offer.quotedFee === undefined || offer.isFeeUnknown) {
      points.push('Please provide the all-in APR including processing fees and mandatory charges.');
    }

    // Rule 5: Tenure tradeoff if applicable
    if (offerTenure !== undefined && offerTenure !== suggestedTenure && points.length < 4) {
      if (offerTenure > suggestedTenure) {
        points.push(`Longer tenure (${offerTenure}m) lowers EMI but increases total interest paid over time.`);
      } else {
        points.push(`Shorter tenure (${offerTenure}m) reduces total interest but raises monthly cash outflow.`);
      }
    }

    // Ensure 2–4 points
    if (points.length < 2) {
      points.push(`Keep my EMI at or below ₹${formatINR(safeEMI)}/month.`);
    }
  }

  // Bound points to max 4
  const finalPoints = points.slice(0, 4);

  // 5. Priorities Ranking System
  // Order of severity:
  // 1. EMI exceeds safe affordability
  // 2. Loan amount exceeds borrower-safe amount
  // 3. APR significantly above expected all-in cost
  // 4. Interest rate above fair range
  // 5. Tenure trade-off
  // 6. Missing fee transparency
  const priorities: string[] = [];

  if (cardState === 'no_offer') {
    priorities.push(`1. Safe EMI ceiling: Keep monthly commitment strictly at or below ₹${formatINR(safeEMI)}/month.`);
    priorities.push(`2. Safe principal: Borrow no more than ₹${formatINR(safeAmount)} regardless of bank eligibility.`);
    priorities.push(`3. Fair pricing: Target ${fairRateLow}%–${fairRateHigh}% reducing-balance interest.`);
    priorities.push('4. Transparency: Insist on written all-in APR before signing.');
  } else {
    if (offer.quotedEMI !== undefined && offer.quotedEMI > safeEMI) {
      priorities.push(`1. Safe EMI Exceeded: Proposed EMI (₹${formatINR(offer.quotedEMI)}) exceeds your safe limit of ₹${formatINR(safeEMI)}/mo. This is the top risk.`);
    }

    if (offer.quotedAmount !== undefined && offer.quotedAmount > safeAmount) {
      priorities.push(`2. Over-Borrowing Risk: Sanctioned ₹${formatINR(offer.quotedAmount)} exceeds safe capacity of ₹${formatINR(safeAmount)}. Do not maximize the sanctioned sum.`);
    } else if (requestedAmount !== undefined && safeAmount > 0 && requestedAmount > safeAmount) {
      priorities.push(`2. Scope Downsizing: Target borrowing at ₹${formatINR(safeAmount)} to protect family cash flows.`);
    }

    if (calculatedLenderAPR !== undefined && calculatedLenderAPR > aprHigh) {
      priorities.push(`3. High All-In Cost: Quoted APR (${calculatedLenderAPR}%) exceeds fair benchmark (${aprHigh}%). Challenge origination charges.`);
    }

    if (offer.quotedRate !== undefined && offer.quotedRate > fairRateHigh) {
      priorities.push(`4. Above Fair Rate: Quoted interest (${offer.quotedRate}%) is above fair band (${fairRateLow}%–${fairRateHigh}%). Negotiate a rate cut.`);
    }

    if (offerTenure !== undefined && offerTenure !== suggestedTenure) {
      priorities.push(`5. Tenure Choice: Lender proposed ${offerTenure}m vs optimal ${suggestedTenure}m. Weigh monthly cash flow vs total interest.`);
    }

    if (offer.quotedFee === undefined || offer.isFeeUnknown) {
      priorities.push('6. Fee Transparency: Demand full written disclosure of processing fees, stamp duty, and all-in APR.');
    }

    // Default fallback priority if offer is fully favorable
    if (priorities.length === 0) {
      priorities.push('1. All terms fits within your prudent financial boundaries. Confirm pre-payment flexibility before closing.');
    }
  }

  const primaryPriority = priorities[0] || 'Maintain prudent borrowing boundaries.';

  // 6. Borrower-friendly script generator
  let script = '';
  const isConfidenceLow = assessment.confidence === 'indicative';

  if (isConfidenceLow) {
    script = `“My current estimate is ${fairRateLow}%–${fairRateHigh}%, but my confidence is limited because my credit information is incomplete. I need to keep my EMI below ₹${formatINR(safeEMI)}. Can you show me your best all-in APR, including processing fees?”`;
  } else {
    script = `“I've estimated that a fair rate for my profile is around ${fairRateLow}%–${fairRateHigh}%, and I want to keep my EMI below ₹${formatINR(safeEMI)}. Can you show me your best all-in APR, including processing fees?”`;
  }

  // 7. Questions to ask the lender
  const questionsToAsk = [
    'Please show me the all-in APR including processing fees and mandatory charges.',
    `Can you offer a rate within my estimated fair range of ${fairRateLow}%–${fairRateHigh}%?`,
    `Can you structure the loan so my EMI stays within ₹${formatINR(safeEMI)} per month?`,
    'Please show the total repayment amount for the proposed tenure.',
  ];

  // 8. Tenure Tradeoffs
  const tradeoffs = {
    explanation: 'Shorter tenure increases monthly EMI but reduces total interest. Longer tenure reduces EMI but can increase total interest.',
  };

  return {
    cardState,
    points: finalPoints,
    questionsToAsk,
    priorities,
    script,
    comparisons,
    primaryPriority,
    hasOffer: Boolean(offer.hasOffer),
    isIncomplete: cardState === 'incomplete_offer',
    tradeoffs,
  };
}
