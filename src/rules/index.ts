/**
 * @file src/rules/index.ts
 * @description Policy, underwriting rules, and threshold boundaries.
 * Strictly decoupled domain logic implementing Indian retail lending principles.
 * 
 * Re-exports the audited 12-step deterministic financial pipeline.
 */

import type { AssessmentOutput, BorrowerInput } from '../types';
import { runBorrowerEvaluationPipeline } from './pipeline';

export {
  runBorrowerEvaluationPipeline,
  step1_normalize,
  step2_affordability,
  step3_lenderLikelySanction,
  step4_borrowerSafeAmount,
  step5_fairRateBand,
  step6_allInAPR,
  step7_emi,
  step8_tenureTradeoffs,
  step9_stressTest,
  step10_verdict,
  step11_explanations,
} from './pipeline';

export {
  FOIR_RULES,
  FAIR_RATE_ASSUMPTIONS,
  FEE_AND_TAX_RULES,
  STRESS_TEST_RULES,
  EXPENSE_IMPUTATION_RULES,
} from './config';

export { normalizeBorrowerInput } from './normalization';
export type { NormalizedBorrowerProfile } from './normalization';
export { evaluateComprehensiveConfidence } from './confidence';
export { generateNegotiationGuidance, extractLenderOffer } from './negotiation';

export interface RuleEvaluationResult {
  passed: boolean;
  code: string;
  message: string;
}

/**
 * Core Borrower Copilot Assessment Rules Engine.
 * Executes the explicit 12-step financial underwriting and affordability pipeline.
 */
export function evaluateBorrowerRules(input: BorrowerInput): AssessmentOutput {
  return runBorrowerEvaluationPipeline(input);
}
