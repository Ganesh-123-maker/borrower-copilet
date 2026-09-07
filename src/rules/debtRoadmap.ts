/**
 * @file src/rules/debtRoadmap.ts
 * @description Rule-driven Debt Rehabilitation Roadmap for distressed borrowers.
 * Generates an empathetic, actionable 5-step stabilization plan when debt distress
 * triggers prevent safe new borrowing.
 * 
 * STRICT ARCHITECTURAL RULE:
 * Absolutely NO hardcoded persona names (no "Anita", "Priya", "Ravi").
 * All logic evaluates generic financial signals from AssessmentResult and BorrowerInput.
 */

import { AssessmentOutput, BorrowerInput } from '../types';

export interface DebtRoadmapStep {
  stepNumber: number;
  title: string;
  headline: string;
  actionItems: string[];
  keyReason: string;
  urgency: 'critical' | 'high' | 'medium';
}

export interface DebtRehabilitationPlan {
  shouldDisplay: boolean;
  headline: string;
  supportiveMessage: string;
  isProductiveGoalDistressed: boolean;
  productiveGoalGuidance?: string;
  distressSignals: string[];
  steps: DebtRoadmapStep[];
  disclaimer: string;
}

/**
 * Evaluates whether a borrower requires a debt rehabilitation roadmap based on objective financial signals.
 */
export function evaluateDebtRehabilitationRoadmap(
  assessment: AssessmentOutput,
  input: BorrowerInput
): DebtRehabilitationPlan {
  const rawInput = input as Record<string, unknown>;
  const distressSignals: string[] = [];

  // Check Signal 1: Recent EMI bounce / missed payment history
  const hasBounce =
    input.hasBounce === true ||
    rawInput.hasRecentBounce === true ||
    rawInput.repaymentHistory === 'bounce' ||
    Boolean(assessment.verdictReason && assessment.verdictReason.toLowerCase().includes('bounce'));

  if (hasBounce) {
    distressSignals.push('Recent EMI bounce or payment delay recorded in payment history');
  }

  // Check Signal 2: Zero safe borrowing capacity
  const isZeroSafeBorrowing = assessment.borrowerSafeAmount.max === 0;
  if (isZeroSafeBorrowing) {
    distressSignals.push('Borrower-safe new debt capacity is currently ₹0');
  }

  // Check Signal 3: Existing high-cost digital app debt
  const hasHighCostDebt =
    input.hasAppLoans === true ||
    (Array.isArray(rawInput.existingDebtDetails) &&
      (rawInput.existingDebtDetails as Array<{ rate?: number }>).some((d) => d.rate && d.rate >= 24)) ||
    Boolean(assessment.verdictReason && assessment.verdictReason.toLowerCase().includes('app loan'));

  if (hasHighCostDebt) {
    distressSignals.push('Active high-interest loans (30%+ p.a.) draining monthly cash flow');
  }

  // Check Signal 4: Severe cash flow deficit under stress or high existing EMI
  const monthlyIncome = input.monthlyNetIncome || (rawInput.monthlyIncome as number) || 0;
  const existingEmi = input.existingMonthlyEMIs || (rawInput.existingEmi as number) || 0;
  const emiToIncomeRatio = monthlyIncome > 0 ? existingEmi / monthlyIncome : 0;

  const isSevereDebtBurden =
    emiToIncomeRatio >= 0.35 ||
    (assessment.stressCase?.stressedSafeEMI ?? 0) <= 0 ||
    assessment.safeMonthlyOutflowCeiling.maxEMI <= 0;

  if (isSevereDebtBurden && existingEmi > 0) {
    distressSignals.push(
      `Existing debt service (${Math.round(emiToIncomeRatio * 100)}% of earnings) severely constrains liquidity`
    );
  }

  // General trigger decision: Display if verdict is 'dont_borrow' AND at least one distress signal is present,
  // or if zero safe borrowing with severe debt burden is detected.
  const shouldDisplay =
    (assessment.verdict === 'dont_borrow' && distressSignals.length > 0) ||
    (isZeroSafeBorrowing && (hasBounce || hasHighCostDebt || isSevereDebtBurden));

  if (!shouldDisplay) {
    return {
      shouldDisplay: false,
      headline: '',
      supportiveMessage: '',
      isProductiveGoalDistressed: false,
      distressSignals: [],
      steps: [],
      disclaimer: '',
    };
  }

  // Check if borrower had a productive borrowing goal (e.g. livelihood equipment, vehicle, or business)
  const isProductive =
    input.purpose === 'asset_purchase' ||
    input.purpose === 'business_expansion' ||
    input.loanType === 'vehicle_loan' ||
    input.loanType === 'business_loan' ||
    rawInput.loanPurpose === 'productive_business_or_asset' ||
    rawInput.loanPurpose === 'two_wheeler_or_vehicle';

  // Build the 5 General Rule-Driven Steps
  const steps: DebtRoadmapStep[] = [
    {
      stepNumber: 1,
      title: 'Stop Adding Expensive Debt',
      headline: 'Halt all new high-cost borrowing and predatory apps',
      actionItems: [
        'Do not take a new loan or digital app advance to pay off older loans; roll-overs rapidly compound into a debt trap.',
        'Avoid unregulated quick-credit mobile apps that charge 30%–48% interest and heavy rollover fees.',
        'If a lender proposes "consolidation", independently verify that the all-in APR is genuinely lower before signing.',
      ],
      keyReason: hasHighCostDebt
        ? 'High-interest app debt compounds faster than household earnings can service it.'
        : 'Borrowing new funds while cash flow is stretched risks imminent payment default.',
      urgency: 'critical',
    },
    {
      stepNumber: 2,
      title: 'Stabilize Existing Repayments',
      headline: 'Bring bounced or overdue obligations current immediately',
      actionItems: [
        'Focus all spare funds on curing recent bounced payments to prevent punitive penalty charges and deeper credit damage.',
        'Contact existing lenders directly before missing payments to request temporary restructuring or revised tenure.',
        'Note: Approaching a lender early shows good faith, though restructuring is at the institution\'s discretion and cannot be guaranteed.',
      ],
      keyReason: hasBounce
        ? 'A single recent bounce triggers institutional loan rejection and severe interest rate surcharges.'
        : 'Maintaining a clean repayment record protects future access to affordable bank loans.',
      urgency: 'critical',
    },
    {
      stepNumber: 3,
      title: 'Attack High-Cost Debt (Avalanche Strategy)',
      headline: 'Target highest-interest debt first to free up monthly cash flow',
      actionItems: [
        hasHighCostDebt
          ? 'Make minimum payments on standard debt while putting every extra rupee toward 30%+ app balances.'
          : 'List all current borrowings by interest rate and aggressively pay down the costliest balance first.',
        'Eliminating even one high-cost loan directly expands your monthly net disposable cash flow.',
        'Where possible, explore regulated low-interest priority credit (e.g., PM SVANidhi, PM Mudra Shishu, or SHG credit) to replace predatory loans.',
      ],
      keyReason: 'Reducing expensive debt service creates permanent monthly cash flow headroom.',
      urgency: 'high',
    },
    {
      stepNumber: 4,
      title: 'Build a Modest Cash-Flow Buffer',
      headline: 'Accumulate a 1-to-2 month emergency cushion before new debt',
      actionItems: [
        'Set aside a modest liquidity buffer (₹5,000–₹15,000) so minor emergencies do not force emergency borrowing.',
        'Align debt commitments so that total monthly EMIs remain comfortably below 35% of regular monthly income.',
        'Use the Copilot cash flow calculator to track surplus income before considering any new commitments.',
      ],
      keyReason: 'Without a buffer, any sudden medical or household shock forces recourse to predatory debt.',
      urgency: 'medium',
    },
    {
      stepNumber: 5,
      title: 'Reassess Borrowing Readiness',
      headline: 'Return to Borrower Copilot once cash flow and credit stabilize',
      actionItems: [
        'After 3 to 6 consecutive months of on-time payments and zero bounces, rerun Borrower Copilot.',
        'Check whether your safe borrowing capacity has opened up and fair rate bands have improved.',
        'Remember: Improving your financial profile takes a few months of discipline, but unlocks legitimate bank loans at fair single-digit rates.',
      ],
      keyReason: 'Demonstrated repayment discipline restores institutional credit eligibility over time.',
      urgency: 'medium',
    },
  ];

  return {
    shouldDisplay: true,
    headline: "Don't borrow right now. Here's how to become borrow-ready.",
    supportiveMessage:
      "You're not being rejected. The numbers suggest that taking another loan right now could put your cash flow under more pressure.",
    isProductiveGoalDistressed: isProductive,
    productiveGoalGuidance: isProductive
      ? "While your loan purpose (such as livelihood or vehicle) is productive, servicing new debt while handling active repayment stress risks compounding distress. Stabilizing existing obligations over the next few months will allow you to finance this asset at fair, affordable rates."
      : undefined,
    distressSignals,
    steps,
    disclaimer:
      'This roadmap is general financial guidance, not individualized debt counselling or a guarantee of refinancing, restructuring, or future loan approval.',
  };
}
