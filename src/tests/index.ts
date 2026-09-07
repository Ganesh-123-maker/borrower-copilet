/**
 * @file src/tests/index.ts
 * @description Test harness placeholder for Borrower Copilot rules and calculations.
 * In Phase 2 & 3, unit tests will verify FOIR boundaries, APR calculations, and persona outcomes.
 */

/**
 * @file src/tests/index.ts
 * @description Test harness for Borrower Copilot rules, calculations, and benchmark personas.
 */

import { calculateReducingEMI, calculateIndicativeAPR } from '../calculations';
import {
  evaluateBorrowerRules,
  step1_normalize,
  step2_affordability,
  step3_lenderLikelySanction,
  step4_borrowerSafeAmount,
  step5_fairRateBand,
  step6_allInAPR,
  step8_tenureTradeoffs,
  step9_stressTest,
  generateNegotiationGuidance,
} from '../rules';
import { PERSONA_INPUTS } from '../data';
import { BorrowerInput } from '../types';
import { QuestionnaireAnswers } from '../questionnaire/types';
import {
  getActiveQuestions,
  cleanIrrelevantAnswers,
  mapAnswersToBorrowerInput,
} from '../questionnaire/questionVisibility';
import { evaluateQuestionnaireConfidence } from '../questionnaire/confidenceModel';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

export function runSanityCheck(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // Test 1: EMI calculation exactness
  // Standard test: ₹10,00,000 at 10.5% for 60 months => ~₹21,494
  const emiTest = calculateReducingEMI(1000000, 10.5, 60);
  const emiPassed = emiTest >= 21490 && emiTest <= 21500;
  results.push({
    suite: 'Calculations',
    name: 'Standard Reducing Balance EMI Formula',
    passed: emiPassed,
    details: `Calculated EMI ₹${emiTest} for ₹10L @ 10.5% 5yr (Expected ~21,494)`,
  });

  // Test 2: APR calculation
  // 10.5% nominal + 1% fee + 18% GST (1.18%) => ~11.68%
  const aprTest = calculateIndicativeAPR(10.5, 1.0);
  const aprPassed = Math.abs(aprTest - 11.68) < 0.05;
  results.push({
    suite: 'Calculations',
    name: 'All-In APR with Upfront Processing Fee & GST',
    passed: aprPassed,
    details: `Calculated APR ${aprTest}% for 10.5% nominal + 1% fee (Expected 11.68%)`,
  });

  // Test 3: Priya persona evaluation
  const priyaResult = evaluateBorrowerRules(PERSONA_INPUTS.priya);
  const priyaPassed =
    priyaResult.verdict === 'borrow_less' &&
    priyaResult.borrowerSafeAmount.max === 500000 &&
    priyaResult.lenderLikelySanction.max > priyaResult.borrowerSafeAmount.max &&
    priyaResult.fairRateBand.min === 10.5 &&
    priyaResult.suggestedTenure === 36;
  results.push({
    suite: 'Rules Engine - Priya',
    name: 'Priya Discretionary Wedding Loan - Borrow Less Verdict',
    passed: priyaPassed,
    details: `Verdict: ${priyaResult.verdict}, Safe Max: ₹${priyaResult.borrowerSafeAmount.max}, Lender Max: ₹${priyaResult.lenderLikelySanction.max}`,
  });

  // Test 4: Ravi persona evaluation
  const raviResult = evaluateBorrowerRules(PERSONA_INPUTS.ravi);
  const raviPassed =
    raviResult.verdict === 'borrow' &&
    raviResult.borrowerSafeAmount.max === 1500000 &&
    raviResult.fairRateBand.min < 10.0 &&
    raviResult.confidence === 'moderate';
  results.push({
    suite: 'Rules Engine - Ravi',
    name: 'Ravi Productive Collateralized Expansion - Borrow Verdict',
    passed: raviPassed,
    details: `Verdict: ${raviResult.verdict}, Safe Max: ₹${raviResult.borrowerSafeAmount.max}, Rate: ${raviResult.fairRateBand.min}%-${raviResult.fairRateBand.max}%`,
  });

  // Test 5: Anita persona evaluation
  const anitaResult = evaluateBorrowerRules(PERSONA_INPUTS.anita);
  const anitaPassed =
    anitaResult.verdict === 'dont_borrow' &&
    anitaResult.borrowerSafeAmount.max === 0 &&
    anitaResult.stressCase.status === 'exceeds_limit';
  results.push({
    suite: 'Rules Engine - Anita',
    name: 'Anita Vulnerable Cash Flow - Don\'t Borrow Verdict',
    passed: anitaPassed,
    details: `Verdict: ${anitaResult.verdict}, Safe Max: ₹${anitaResult.borrowerSafeAmount.max}, Stress: ${anitaResult.stressCase.status}`,
  });

  // =========================================================================
  // ADAPTIVE QUESTIONNAIRE SUITE (TEST 1 to TEST 9)
  // =========================================================================

  // TEST 1: Salaried borrower
  const salariedAnswers: QuestionnaireAnswers = {
    purpose: 'wedding_or_family_event',
    loanType: 'personal_loan',
    amountRequested: 500000,
    age: 29,
    employmentType: 'salaried_corporate',
    monthlyNetIncome: 100000,
    incomeStability: 'very_stable',
    existingMonthlyEMIs: 10000,
    householdExpenses: 40000,
    creditScoreKnown: true,
    creditScore: 780,
  };
  const salariedActiveQ = getActiveQuestions(salariedAnswers).map((q) => q.id);
  const test1Passed =
    salariedActiveQ.includes('yearsAtEmployer') &&
    salariedActiveQ.includes('hasVariableIncome') &&
    !salariedActiveQ.includes('businessVintageYears') &&
    !salariedActiveQ.includes('documentedAnnualIncome') &&
    !salariedActiveQ.includes('lowestMonthlyIncome');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 1: Salaried Borrower Path Visibility',
    passed: test1Passed,
    details: `Salaried questions shown: ${salariedActiveQ.includes('yearsAtEmployer')}, Business questions excluded: ${!salariedActiveQ.includes('businessVintageYears')}`,
  });

  // TEST 2: Self-employed borrower
  const businessAnswers: QuestionnaireAnswers = {
    purpose: 'business_expansion',
    loanType: 'business_loan',
    amountRequested: 1500000,
    age: 42,
    employmentType: 'self_employed_business',
    monthlyNetIncome: 60000,
    incomeStability: 'moderately_stable',
    existingMonthlyEMIs: 0,
    householdExpenses: 30000,
    creditScoreKnown: false,
  };
  const businessActiveQ = getActiveQuestions(businessAnswers).map((q) => q.id);
  const test2Passed =
    businessActiveQ.includes('businessVintageYears') &&
    businessActiveQ.includes('documentedAnnualIncome') &&
    businessActiveQ.includes('businessVariablePercent') &&
    !businessActiveQ.includes('yearsAtEmployer') &&
    !businessActiveQ.includes('lowestMonthlyIncome');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 2: Self-Employed Borrower Path Visibility',
    passed: test2Passed,
    details: `Business vintage shown: ${businessActiveQ.includes('businessVintageYears')}, Salaried tenure excluded: ${!businessActiveQ.includes('yearsAtEmployer')}`,
  });

  // TEST 3: Informal / gig borrower
  const informalAnswers: QuestionnaireAnswers = {
    purpose: 'asset_purchase',
    loanType: 'vehicle_loan',
    amountRequested: 150000,
    age: 35,
    employmentType: 'informal_or_gig',
    monthlyNetIncome: 28000,
    incomeStability: 'variable',
    existingMonthlyEMIs: 7500,
    householdExpenses: 18000,
    creditScoreKnown: false,
  };
  const informalActiveQ = getActiveQuestions(informalAnswers).map((q) => q.id);
  const test3Passed =
    informalActiveQ.includes('lowestMonthlyIncome') &&
    informalActiveQ.includes('incomeSourceCount') &&
    informalActiveQ.includes('hasAppLoans') &&
    !informalActiveQ.includes('yearsAtEmployer') &&
    !informalActiveQ.includes('businessVintageYears');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 3: Informal / Gig Borrower Path Visibility',
    passed: test3Passed,
    details: `Lowest income shown: ${informalActiveQ.includes('lowestMonthlyIncome')}, App loans shown: ${informalActiveQ.includes('hasAppLoans')}`,
  });

  // TEST 4: Unknown credit score
  const unknownCreditAnswers: QuestionnaireAnswers = {
    purpose: 'personal_loan' as any,
    loanType: 'personal_loan',
    amountRequested: 300000,
    age: 26,
    employmentType: 'salaried_regular',
    monthlyNetIncome: 45000,
    incomeStability: 'very_stable',
    existingMonthlyEMIs: 0,
    householdExpenses: 20000,
    creditScoreKnown: false,
  };
  const unknownCreditInput = mapAnswersToBorrowerInput(unknownCreditAnswers);
  const unknownCreditQ = getActiveQuestions(unknownCreditAnswers).map((q) => q.id);
  const test4Passed =
    unknownCreditInput.creditScore === undefined &&
    unknownCreditInput.creditScoreKnown === false &&
    !unknownCreditQ.includes('creditScore') &&
    unknownCreditQ.includes('hasRecentMissedPayments');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 4: Explicit Unknown Credit Score Preservation',
    passed: test4Passed,
    details: `Credit score is undefined (not zero): ${unknownCreditInput.creditScore === undefined}, Follow-up missed payments active: ${unknownCreditQ.includes('hasRecentMissedPayments')}`,
  });

  // TEST 5: Productive loan
  const productiveAnswers: QuestionnaireAnswers = {
    purpose: 'business_expansion',
    loanType: 'business_loan',
    amountRequested: 1000000,
    employmentType: 'self_employed_business',
    monthlyNetIncome: 70000,
  };
  const nonProductiveAnswers: QuestionnaireAnswers = {
    purpose: 'wedding_or_family_event',
    loanType: 'personal_loan',
    amountRequested: 800000,
    employmentType: 'salaried_corporate',
    monthlyNetIncome: 110000,
  };
  const productiveQ = getActiveQuestions(productiveAnswers).map((q) => q.id);
  const nonProductiveQ = getActiveQuestions(nonProductiveAnswers).map((q) => q.id);
  const test5Passed =
    productiveQ.includes('expectedAdditionalIncome') &&
    !nonProductiveQ.includes('expectedAdditionalIncome');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 5: Productive Loan Follow-up Visibility',
    passed: test5Passed,
    details: `Productive follow-up for business: ${productiveQ.includes('expectedAdditionalIncome')}, Excluded for wedding: ${!nonProductiveQ.includes('expectedAdditionalIncome')}`,
  });

  // TEST 6: Secured product
  const lapAnswers: QuestionnaireAnswers = {
    purpose: 'business_expansion',
    loanType: 'home_or_lap',
    amountRequested: 2000000,
    employmentType: 'salaried_regular',
    hasCollateral: true,
  };
  const personalUnsecuredAnswers: QuestionnaireAnswers = {
    purpose: 'personal_loan' as any,
    loanType: 'personal_loan',
    amountRequested: 400000,
    employmentType: 'salaried_corporate',
  };
  const lapQ = getActiveQuestions(lapAnswers).map((q) => q.id);
  const personalQ = getActiveQuestions(personalUnsecuredAnswers).map((q) => q.id);
  const test6Passed =
    lapQ.includes('hasCollateral') &&
    lapQ.includes('collateralValue') &&
    !personalQ.includes('hasCollateral');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 6: Secured Product Collateral Gating',
    passed: test6Passed,
    details: `Collateral questions active for LAP: ${lapQ.includes('hasCollateral')}, Excluded for unsecured personal: ${!personalQ.includes('hasCollateral')}`,
  });

  // TEST 7: No lender offer skipped
  const noOfferAnswers: QuestionnaireAnswers = {
    purpose: 'personal_loan' as any,
    loanType: 'personal_loan',
    amountRequested: 500000,
    employmentType: 'salaried_corporate',
    hasLenderOffer: 'no',
    quotedRate: 15.5, // stale input
    quotedFee: 2.0, // stale input
  };
  const noOfferQ = getActiveQuestions(noOfferAnswers).map((q) => q.id);
  const cleanedNoOffer = cleanIrrelevantAnswers(noOfferAnswers);
  const test7Passed =
    !noOfferQ.includes('quotedRate') &&
    !noOfferQ.includes('quotedFee') &&
    cleanedNoOffer.quotedRate === undefined &&
    cleanedNoOffer.quotedFee === undefined;
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 7: No Lender Offer Skips Quote Fields',
    passed: test7Passed,
    details: `Quote fields skipped: ${!noOfferQ.includes('quotedRate')}, Stale quote pruned: ${cleanedNoOffer.quotedRate === undefined}`,
  });

  // TEST 8: User changes employment type (Adaptive path & stale state cleanup)
  const initialSalariedState: QuestionnaireAnswers = {
    purpose: 'personal_loan' as any,
    loanType: 'personal_loan',
    amountRequested: 500000,
    employmentType: 'salaried_corporate',
    yearsAtEmployer: 'more_than_3_yrs',
    hasVariableIncome: true,
  };
  const switchedToBusinessState: QuestionnaireAnswers = {
    ...initialSalariedState,
    employmentType: 'self_employed_business',
  };
  const cleanedSwitched = cleanIrrelevantAnswers(switchedToBusinessState);
  const switchedActiveQ = getActiveQuestions(cleanedSwitched).map((q) => q.id);
  const test8Passed =
    cleanedSwitched.yearsAtEmployer === undefined &&
    cleanedSwitched.hasVariableIncome === undefined &&
    switchedActiveQ.includes('businessVintageYears') &&
    !switchedActiveQ.includes('yearsAtEmployer');
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 8: Dynamic Path Switch on Employment Type Change',
    passed: test8Passed,
    details: `Stale salaried answers pruned: ${cleanedSwitched.yearsAtEmployer === undefined}, New business questions activated: ${switchedActiveQ.includes('businessVintageYears')}`,
  });

  // TEST 9: Optional questions skipped produces valid results & reflective confidence
  const minimalMustOnlyAnswers: QuestionnaireAnswers = {
    purpose: 'personal_loan' as any,
    loanType: 'personal_loan',
    amountRequested: 400000,
    age: 28,
    employmentType: 'salaried_regular',
    monthlyNetIncome: 50000,
    incomeStability: 'very_stable',
    existingMonthlyEMIs: 0,
    householdExpenses: 22000,
    creditScoreKnown: false, // optional credit follow-ups skipped
  };
  const minimalBorrowerInput = mapAnswersToBorrowerInput(minimalMustOnlyAnswers);
  const minimalResult = evaluateBorrowerRules(minimalBorrowerInput);
  const minimalConfidence = evaluateQuestionnaireConfidence(minimalMustOnlyAnswers);
  const test9Passed =
    minimalResult.verdict !== undefined &&
    minimalResult.borrowerSafeAmount.max > 0 &&
    minimalResult.fairRateBand.min > 0 &&
    minimalConfidence.level !== 'high' &&
    minimalConfidence.missingFactors.length > 0;
  results.push({
    suite: 'Adaptive Questionnaire',
    name: 'TEST 9: Optional Questions Skipped Produces Honest Confidence',
    passed: test9Passed,
    details: `Safe Max: ₹${minimalResult.borrowerSafeAmount.max}, Confidence Level: ${minimalConfidence.level} (${minimalConfidence.score}%), Missing Factors: ${minimalConfidence.missingFactors.length}`,
  });

  // =========================================================================
  // PHASE 4: CONFIDENCE + UNCERTAINTY TEST SUITE (8 REQUIRED SCENARIOS)
  // =========================================================================

  // SCENARIO 1: Complete Profile (Priya) -> Narrow range, High confidence, 0 missing info
  const sc1Output = evaluateBorrowerRules(PERSONA_INPUTS.priya);
  const sc1RateSpread = sc1Output.fairRateBand.max - sc1Output.fairRateBand.min;
  const sc1SafeSpread = sc1Output.borrowerSafeAmount.max - sc1Output.borrowerSafeAmount.min;
  const sc1Passed =
    sc1Output.confidence === 'high' &&
    sc1Output.confidenceScore >= 80 &&
    sc1RateSpread <= 2.0 &&
    sc1SafeSpread <= sc1Output.borrowerSafeAmount.max * 0.20 &&
    (sc1Output.missingInformation?.length ?? 0) === 0;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 1: Complete Profile (Narrow Range, High Confidence)',
    passed: sc1Passed,
    details: `Confidence: ${sc1Output.confidence} (${sc1Output.confidenceScore}%), Rate Spread: ${sc1RateSpread.toFixed(1)}%, Missing: ${sc1Output.missingInformation?.length ?? 0}`,
  });

  // SCENARIO 2: Unknown Credit Score (Not Zero / 300, Range Widened)
  const sc2Input: BorrowerInput = {
    name: 'Credit Unknown Borrower',
    monthlyNetIncome: 65000,
    existingMonthlyEMIs: 0,
    householdExpenses: 28000,
    amountRequested: 400000,
    tenureWantedMonths: 36,
    creditScoreKnown: false,
    creditScore: undefined, // Explicitly undefined, NOT 0 or 300
    employmentType: 'salaried_regular',
  };
  const sc2Output = evaluateBorrowerRules(sc2Input);
  const sc2RateSpread = sc2Output.fairRateBand.max - sc2Output.fairRateBand.min;
  const sc2Passed =
    sc2Input.creditScore === undefined &&
    sc2RateSpread >= 4.0 && // Spread widened to >= 4.0%
    sc2Output.fairRateBand.min < 15.0 && // NOT priced as default/300 subprime
    sc2Output.granularConfidence?.fairRateBand?.rangeWidened === true &&
    sc2Output.missingInformation?.some((m) => m.toLowerCase().includes('credit')) === true;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 2: Unknown Credit Score (Widened Spread, Not Coerced to Zero)',
    passed: sc2Passed,
    details: `Rate: ${sc2Output.fairRateBand.min}%–${sc2Output.fairRateBand.max}% (Spread: ${sc2RateSpread.toFixed(1)}%), RangeWidened: ${sc2Output.granularConfidence?.fairRateBand?.rangeWidened}`,
  });

  // SCENARIO 3: Unknown Expenses (Safe Amount Range Widened)
  const sc3Input: BorrowerInput = {
    name: 'Expenses Unknown Borrower',
    monthlyNetIncome: 70000,
    existingMonthlyEMIs: 5000,
    amountRequested: 500000,
    tenureWantedMonths: 36,
    creditScoreKnown: true,
    creditScore: 760,
    householdExpenses: undefined, // Missing living expenses
    employmentType: 'salaried_corporate',
  };
  const sc3Output = evaluateBorrowerRules(sc3Input);
  const sc3SafeMinRatio = sc3Output.borrowerSafeAmount.min / (sc3Output.borrowerSafeAmount.max || 1);
  const sc3Passed =
    sc3SafeMinRatio <= 0.75 && // Range widened (min is ~68% of max instead of 88%)
    sc3Output.granularConfidence?.borrowerSafeAmount?.rangeWidened === true &&
    sc3Output.missingInformation?.some((m) => m.toLowerCase().includes('expense')) === true;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 3: Unknown Expenses (Widened Safe Amount Range)',
    passed: sc3Passed,
    details: `Safe Min/Max: ₹${sc3Output.borrowerSafeAmount.min} / ₹${sc3Output.borrowerSafeAmount.max} (Ratio: ${(sc3SafeMinRatio * 100).toFixed(0)}%), RangeWidened: ${sc3Output.granularConfidence?.borrowerSafeAmount?.rangeWidened}`,
  });

  // SCENARIO 4: Variable Income (Anita Benchmark vs Salaried)
  const sc4Output = evaluateBorrowerRules(PERSONA_INPUTS.anita);
  const sc4Passed =
    sc4Output.confidenceScore <= 60 &&
    sc4Output.confidence === 'indicative' &&
    sc4Output.stressCase.status === 'exceeds_limit' &&
    sc4Output.verdict === 'dont_borrow';
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 4: Variable Income (Stress Limit Triggered, Indicative Confidence)',
    passed: sc4Passed,
    details: `Confidence: ${sc4Output.confidence} (${sc4Output.confidenceScore}%), Stress Status: ${sc4Output.stressCase.status}, Verdict: ${sc4Output.verdict}`,
  });

  // SCENARIO 5: Many Unknowns (Widest Ranges & Explicit Missing Information)
  const sc5Input: BorrowerInput = {
    name: 'Thin File Unknown Borrower',
    monthlyNetIncome: 45000,
    amountRequested: 300000,
    creditScoreKnown: false,
    creditScore: undefined,
    householdExpenses: undefined,
    employmentType: 'informal_or_gig',
  };
  const sc5Output = evaluateBorrowerRules(sc5Input);
  const sc5Passed =
    sc5Output.confidence === 'indicative' &&
    sc5Output.confidenceScore < 60 &&
    sc5Output.rangeWidened === true &&
    (sc5Output.missingInformation?.length ?? 0) >= 2;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 5: Many Unknowns (Widest Ranges & Explicit Missing List)',
    passed: sc5Passed,
    details: `Confidence: ${sc5Output.confidence} (${sc5Output.confidenceScore}%), Missing Items Count: ${sc5Output.missingInformation?.length ?? 0}`,
  });

  // SCENARIO 6: Complete vs Partial Profile (Direct Delta Mathematical Proof)
  // Principle: Less info -> Wider range -> Lower confidence
  const completeProfile: BorrowerInput = {
    monthlyNetIncome: 75000,
    existingMonthlyEMIs: 8000,
    householdExpenses: 32000,
    amountRequested: 500000,
    tenureWantedMonths: 36,
    creditScoreKnown: true,
    creditScore: 760,
    quotedFee: 1.0,
    employmentType: 'salaried_corporate',
  };
  const partialProfile: BorrowerInput = {
    monthlyNetIncome: 75000,
    existingMonthlyEMIs: 8000,
    householdExpenses: undefined, // Missing
    amountRequested: 500000,
    tenureWantedMonths: 36,
    creditScoreKnown: false, // Missing
    creditScore: undefined,
    quotedFee: undefined, // Missing
    employmentType: 'salaried_corporate',
  };
  const fullRes = evaluateBorrowerRules(completeProfile);
  const partRes = evaluateBorrowerRules(partialProfile);
  const fullRateSpread = fullRes.fairRateBand.max - fullRes.fairRateBand.min;
  const partRateSpread = partRes.fairRateBand.max - partRes.fairRateBand.min;
  const fullSafeSpread = fullRes.borrowerSafeAmount.max - fullRes.borrowerSafeAmount.min;
  const partSafeSpread = partRes.borrowerSafeAmount.max - partRes.borrowerSafeAmount.min;
  const sc6Passed =
    partRes.confidenceScore < fullRes.confidenceScore &&
    partRateSpread > fullRateSpread &&
    partSafeSpread > fullSafeSpread;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 6: Complete vs Partial Delta (Less Info = Wider Range & Lower Confidence)',
    passed: sc6Passed,
    details: `Score: ${fullRes.confidenceScore}% -> ${partRes.confidenceScore}%, Rate Spread: ${fullRateSpread.toFixed(1)}% -> ${partRateSpread.toFixed(1)}%, Safe Spread: ₹${fullSafeSpread} -> ₹${partSafeSpread}`,
  });

  // SCENARIO 7: Unknown vs Zero Distinction
  const sc7UnknownCreditInput: BorrowerInput = {
    monthlyNetIncome: 60000,
    existingMonthlyEMIs: 0,
    householdExpenses: 25000,
    amountRequested: 300000,
    creditScoreKnown: false,
    creditScore: undefined, // Unknown
    employmentType: 'salaried_regular',
  };
  const lowCreditInput: BorrowerInput = {
    monthlyNetIncome: 60000,
    existingMonthlyEMIs: 0,
    householdExpenses: 25000,
    amountRequested: 300000,
    creditScoreKnown: true,
    creditScore: 550, // Verified poor credit score
    employmentType: 'salaried_regular',
  };
  const unknownRes = evaluateBorrowerRules(sc7UnknownCreditInput);
  const lowRes = evaluateBorrowerRules(lowCreditInput);
  const sc7Passed =
    sc7UnknownCreditInput.creditScore === undefined &&
    unknownRes.fairRateBand.min < lowRes.fairRateBand.min && // Unknown is NOT penalized as deep subprime (550 score)
    unknownRes.fairRateBand.max <= 18.0 &&
    lowRes.fairRateBand.min >= 16.0;
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 7: Unknown vs Zero (Unknown Credit Is Not Defaulted to Subprime)',
    passed: sc7Passed,
    details: `Unknown Rate: ${unknownRes.fairRateBand.min}%–${unknownRes.fairRateBand.max}%, Known 550 Rate: ${lowRes.fairRateBand.min}%–${lowRes.fairRateBand.max}%`,
  });

  // SCENARIO 8: Persona Benchmarks Audited (Priya, Ravi, Anita)
  const priyaConf = evaluateBorrowerRules(PERSONA_INPUTS.priya);
  const raviConf = evaluateBorrowerRules(PERSONA_INPUTS.ravi);
  const anitaConf = evaluateBorrowerRules(PERSONA_INPUTS.anita);
  const sc8Passed =
    priyaConf.confidence === 'high' &&
    priyaConf.granularConfidence?.verdict?.level === 'high' &&
    raviConf.confidence === 'moderate' &&
    anitaConf.confidence === 'indicative';
  results.push({
    suite: 'Confidence & Uncertainty',
    name: 'Scenario 8: Benchmark Personas Audited (Priya=High, Ravi=Moderate, Anita=Indicative)',
    passed: sc8Passed,
    details: `Priya: ${priyaConf.confidence} (${priyaConf.confidenceScore}%), Ravi: ${raviConf.confidence} (${raviConf.confidenceScore}%), Anita: ${anitaConf.confidence} (${anitaConf.confidenceScore}%)`,
  });

  // ==========================================================================
  // PHASE 5: CORE FINANCIAL RULES ENGINE TESTS (A THROUGH R)
  // ==========================================================================

  // A. EMI formula precision test against known benchmark
  // Standard amortization: ₹5,00,000 at 12% for 36 months => ₹16,607
  const emiFormulaVal = calculateReducingEMI(500000, 12.0, 36);
  const testAPassed = emiFormulaVal >= 16605 && emiFormulaVal <= 16610;
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'A. Standard Reducing Balance EMI Precision',
    passed: testAPassed,
    details: `Calculated EMI ₹${emiFormulaVal} for ₹5L @ 12% 36m (Expected ~₹16,607)`,
  });

  // B. FOIR calculation test
  const foirProfile = step1_normalize({
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 20000,
    householdExpenses: 40000,
  });
  const foirAffordability = step2_affordability(foirProfile);
  // Max affordable new EMI should bring resulting FOIR to ~35%
  const testBPassed =
    foirAffordability.existingEMI === 20000 &&
    foirAffordability.resultingFOIR <= 0.36 &&
    foirAffordability.resultingFOIR >= 0.34;
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'B. FOIR Calculation & Ceilings',
    passed: testBPassed,
    details: `Resulting FOIR: ${(foirAffordability.resultingFOIR * 100).toFixed(1)}% (Ceiling: ${(foirAffordability.foirCeiling * 100).toFixed(0)}%)`,
  });

  // C. Maximum affordable EMI
  const testCPassed =
    foirAffordability.maxAffordableNewEMI > 0 &&
    foirAffordability.maxAffordableNewEMI <= (100000 * 0.35 - 20000);
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'C. Maximum Affordable New EMI',
    passed: testCPassed,
    details: `Affordable EMI: ₹${foirAffordability.maxAffordableNewEMI}/mo with ₹20K existing debt and ₹1L income`,
  });

  // D. Lender likely sanction (clearly marked as estimate, separated from safe amount)
  const lenderSanctionTest = step3_lenderLikelySanction(foirProfile, foirAffordability);
  const testDPassed =
    lenderSanctionTest.max > 0 &&
    lenderSanctionTest.explanation.includes('estimate') &&
    !lenderSanctionTest.explanation.includes('guarantee');
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'D. Lender Likely Sanction Estimate (Separated from Approval)',
    passed: testDPassed,
    details: `Lender Max: ₹${lenderSanctionTest.max.toLocaleString('en-IN')}, Explanation explicitly disclaims guarantee`,
  });

  // E. Borrower-safe amount (derived from safe affordability)
  const fairRateSample = step5_fairRateBand(foirProfile);
  const safeAmountTest = step4_borrowerSafeAmount(foirProfile, foirAffordability, fairRateSample);
  const testEPassed =
    safeAmountTest.max > 0 &&
    safeAmountTest.max <= lenderSanctionTest.max &&
    safeAmountTest.explanation.includes('borrower-safe');
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'E. Borrower-Safe Amount (Prudent Underwriting)',
    passed: testEPassed,
    details: `Borrower-Safe Max: ₹${safeAmountTest.max.toLocaleString('en-IN')} vs Lender Max: ₹${lenderSanctionTest.max.toLocaleString('en-IN')}`,
  });

  // F. Borrow vs Borrow Less vs Don't Borrow verdicts
  const safeVerdictInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 5000,
    householdExpenses: 30000,
    amountRequested: 200000, // Small amount well within safe limits
  };
  const borrowLessInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 15000,
    householdExpenses: 45000,
    amountRequested: 900000, // Safe is ~₹5L, requested is ₹9L
  };
  const dontBorrowInput: BorrowerInput = {
    monthlyNetIncome: 30000,
    existingMonthlyEMIs: 20000,
    householdExpenses: 15000,
    amountRequested: 500000, // Severely overextended, negative free cashflow
  };
  const v1 = evaluateBorrowerRules(safeVerdictInput);
  const v2 = evaluateBorrowerRules(borrowLessInput);
  const v3 = evaluateBorrowerRules(dontBorrowInput);
  const testFPassed =
    v1.verdict === 'borrow' &&
    v2.verdict === 'borrow_less' &&
    v3.verdict === 'dont_borrow';
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'F. Three-Tier Verdict Engine (Borrow / Borrow Less / Don\'t Borrow)',
    passed: testFPassed,
    details: `v1=${v1.verdict}, v2=${v2.verdict}, v3=${v3.verdict}`,
  });

  // G. Fair rate range (must always be a range, min < max)
  const testGPassed =
    fairRateSample.min < fairRateSample.max &&
    fairRateSample.spread > 0 &&
    Number.isFinite(fairRateSample.min) &&
    Number.isFinite(fairRateSample.max);
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'G. Fair Interest Rate Is Strictly a Range',
    passed: testGPassed,
    details: `Fair Rate Band: ${fairRateSample.min}% – ${fairRateSample.max}% (Spread: ${fairRateSample.spread}%)`,
  });

  // H. All-In APR
  const aprSample = step6_allInAPR(fairRateSample, foirProfile);
  const testHPassed =
    aprSample.min > fairRateSample.min &&
    aprSample.max > fairRateSample.max &&
    aprSample.explanation.includes('GST');
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'H. All-In APR Factoring Upfront Fee & 18% GST',
    passed: testHPassed,
    details: `APR Range: ${aprSample.min}% – ${aprSample.max}% incorporating statutory GST on fees`,
  });

  // I. Tenure options (tradeoffs)
  const tenureOptionsSample = step8_tenureTradeoffs(500000, 11.5, 36, 'personal_loan');
  const testIPassed =
    tenureOptionsSample.length >= 4 &&
    tenureOptionsSample[0].emi > tenureOptionsSample[3].emi && // shorter tenure has higher monthly EMI
    tenureOptionsSample[0].totalInterest < tenureOptionsSample[3].totalInterest; // shorter tenure saves total interest
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'I. Tenure Trade-Off Analysis Across Standard Terms',
    passed: testIPassed,
    details: `24m EMI: ₹${tenureOptionsSample[0].emi} (Interest: ₹${tenureOptionsSample[0].totalInterest}) vs 60m EMI: ₹${tenureOptionsSample[3].emi} (Interest: ₹${tenureOptionsSample[3].totalInterest})`,
  });

  // J. Stress test scenario (-20% income reduction)
  const stressTestSample = step9_stressTest(foirProfile, foirAffordability, 15000);
  const testJPassed =
    stressTestSample.stressedIncome === Math.round(foirAffordability.income * 0.8) &&
    stressTestSample.scenario.includes('20%') &&
    (stressTestSample.status === 'within_limit' || stressTestSample.status === 'exceeds_limit');
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'J. Transparent 20% Income Contraction Stress Test',
    passed: testJPassed,
    details: `Stressed income: ₹${stressTestSample.stressedIncome} (-20%), Stressed safe EMI: ₹${stressTestSample.stressedSafeEMI}, Status: ${stressTestSample.status}`,
  });

  // K. Unknown credit score handling
  const testKUnknownCreditInput: BorrowerInput = {
    monthlyNetIncome: 80000,
    existingMonthlyEMIs: 10000,
    creditScoreKnown: false,
    creditScore: undefined,
  };
  const unknownCreditRes = evaluateBorrowerRules(testKUnknownCreditInput);
  const testKPassed =
    testKUnknownCreditInput.creditScore === undefined &&
    unknownCreditRes.fairRateBand.max - unknownCreditRes.fairRateBand.min >= 4.0 && // Widened spread
    unknownCreditRes.confidence !== 'high';
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'K. Unknown Credit Score Is Preserved & Widens Rate Spread',
    passed: testKPassed,
    details: `Unverified credit rate spread: ${unknownCreditRes.fairRateBand.min}%–${unknownCreditRes.fairRateBand.max}% (Spread: ${unknownCreditRes.fairRateBand.max - unknownCreditRes.fairRateBand.min}%)`,
  });

  // L. Unknown expenses handling
  const unknownExpInput: BorrowerInput = {
    monthlyNetIncome: 90000,
    householdExpenses: undefined,
  };
  const unknownExpRes = evaluateBorrowerRules(unknownExpInput);
  const testLPassed =
    unknownExpRes.rangeWidened === true &&
    unknownExpRes.affordability?.householdExpenses === Math.round(90000 * 0.45); // Imputed 45% benchmark
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'L. Unknown Expenses Imputed via 45% Benchmark Ratio',
    passed: testLPassed,
    details: `Imputed living expenses: ₹${unknownExpRes.affordability?.householdExpenses} (45% benchmark)`,
  });

  // M. Variable income handling
  const variableIncomeInput: BorrowerInput = {
    monthlyNetIncome: 40000,
    employmentType: 'informal_or_gig',
    existingMonthlyEMIs: 8000,
  };
  const variableIncomeRes = evaluateBorrowerRules(variableIncomeInput);
  const testMPassed =
    variableIncomeRes.confidence === 'indicative' || variableIncomeRes.confidence === 'moderate';
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'M. Variable Income Drives Indicative/Moderate Confidence',
    passed: testMPassed,
    details: `Gig/Informal worker confidence: ${variableIncomeRes.confidence} (${variableIncomeRes.confidenceScore}%)`,
  });

  // N. Complete vs Incomplete profile delta
  const fullProfileInput: BorrowerInput = {
    monthlyNetIncome: 120000,
    existingMonthlyEMIs: 15000,
    householdExpenses: 45000,
    creditScoreKnown: true,
    creditScore: 780,
    employmentType: 'salaried_corporate',
    amountRequested: 500000,
    quotedRate: 10.75,
    quotedFee: 1.0,
    emergencySavingsMonths: '6_plus_months',
  };
  const sparseProfileInput: BorrowerInput = {
    monthlyNetIncome: 120000,
  };
  const testNFullRes = evaluateBorrowerRules(fullProfileInput);
  const testNSparseRes = evaluateBorrowerRules(sparseProfileInput);
  const testNPassed =
    testNFullRes.confidenceScore > testNSparseRes.confidenceScore &&
    (testNSparseRes.missingInformation?.length ?? 0) > (testNFullRes.missingInformation?.length ?? 0);
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'N. Complete vs Incomplete Profile Confidence & Missing Fields',
    passed: testNPassed,
    details: `Full score: ${testNFullRes.confidenceScore}% (0 missing) vs Sparse score: ${testNSparseRes.confidenceScore}% (${testNSparseRes.missingInformation?.length} missing)`,
  });

  // O. Requested amount above safe amount triggers borrow_less
  const overSafeInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 12000,
    householdExpenses: 40000,
    amountRequested: 850000, // safe is ~₹5L
  };
  const overSafeRes = evaluateBorrowerRules(overSafeInput);
  const testOPassed =
    overSafeRes.verdict === 'borrow_less' &&
    (overSafeRes.recommendedAmount ?? overSafeRes.borrowerSafeAmount.max) < overSafeInput.amountRequested!;
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'O. Requested Amount Above Safe Ceiling Triggers Borrow Less',
    passed: testOPassed,
    details: `Requested ₹8.5L -> Verdict: ${overSafeRes.verdict}, Recommended: ₹${overSafeRes.recommendedAmount ?? overSafeRes.borrowerSafeAmount.max}`,
  });

  // P. Requested amount above lender-style maximum triggers dont_borrow
  const overLenderInput: BorrowerInput = {
    monthlyNetIncome: 50000,
    existingMonthlyEMIs: 15000,
    householdExpenses: 25000,
    amountRequested: 5000000, // ₹50L on ₹50k salary is impossible even for predatory lenders
  };
  const overLenderRes = evaluateBorrowerRules(overLenderInput);
  const testPPassed = overLenderRes.verdict === 'dont_borrow';
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'P. Requested Amount Above Lender Maximum Triggers Don\'t Borrow',
    passed: testPPassed,
    details: `Requested ₹50L on ₹50k salary -> Verdict: ${overLenderRes.verdict}`,
  });

  // Q. Existing EMI reducing safe borrowing capacity
  const zeroDebtInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 0,
    householdExpenses: 40000,
  };
  const highDebtInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 25000,
    householdExpenses: 40000,
  };
  const zeroDebtRes = evaluateBorrowerRules(zeroDebtInput);
  const highDebtRes = evaluateBorrowerRules(highDebtInput);
  const testQPassed =
    zeroDebtRes.borrowerSafeAmount.max > highDebtRes.borrowerSafeAmount.max &&
    zeroDebtRes.safeMonthlyOutflowCeiling.maxEMI > highDebtRes.safeMonthlyOutflowCeiling.maxEMI;
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'Q. Existing Debt Directly Depletes Safe Borrowing Capacity',
    passed: testQPassed,
    details: `Safe Max with ₹0 EMI: ₹${zeroDebtRes.borrowerSafeAmount.max.toLocaleString('en-IN')} vs with ₹25k EMI: ₹${highDebtRes.borrowerSafeAmount.max.toLocaleString('en-IN')}`,
  });

  // R. Three personas canonical validation
  const testRPassed =
    priyaResult.verdict === 'borrow_less' &&
    priyaResult.borrowerSafeAmount.max === 500000 &&
    raviResult.verdict === 'borrow' &&
    raviResult.borrowerSafeAmount.max === 1500000 &&
    anitaResult.verdict === 'dont_borrow' &&
    anitaResult.borrowerSafeAmount.max === 0;
  results.push({
    suite: 'Financial Rules Engine (A-R)',
    name: 'R. Canonical Benchmark Personas Triangulation (Priya, Ravi, Anita)',
    passed: testRPassed,
    details: `Priya: ${priyaResult.verdict}, Ravi: ${raviResult.verdict}, Anita: ${anitaResult.verdict}`,
  });

  // ==========================================================================
  // CONSISTENCY INVARIANT TESTS (1 THROUGH 10)
  // ==========================================================================

  // Invariant 1: borrowerSafeAmount <= lenderLikelySanction
  const inv1Passed =
    priyaResult.borrowerSafeAmount.max <= priyaResult.lenderLikelySanction.max &&
    raviResult.borrowerSafeAmount.max <= raviResult.lenderLikelySanction.max &&
    anitaResult.borrowerSafeAmount.max <= anitaResult.lenderLikelySanction.max;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 1: borrowerSafeAmount <= lenderLikelySanction',
    passed: inv1Passed,
    details: 'Verified across all benchmark personas that safe borrowing does not exceed lender capacity',
  });

  // Invariant 2: Increasing existing EMI should not increase borrowerSafeAmount
  const emiBaseInput: BorrowerInput = { monthlyNetIncome: 80000, existingMonthlyEMIs: 5000, householdExpenses: 30000 };
  const emiIncreasedInput: BorrowerInput = { monthlyNetIncome: 80000, existingMonthlyEMIs: 15000, householdExpenses: 30000 };
  const inv2Passed =
    evaluateBorrowerRules(emiIncreasedInput).borrowerSafeAmount.max <=
    evaluateBorrowerRules(emiBaseInput).borrowerSafeAmount.max;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 2: Increasing Existing EMI Never Increases Safe Amount',
    passed: inv2Passed,
    details: 'Higher debt service monotonically reduces or preserves safe borrowing headroom',
  });

  // Invariant 3: Increasing income should not decrease borrowerSafeAmount
  const incBaseInput: BorrowerInput = { monthlyNetIncome: 60000, existingMonthlyEMIs: 10000, householdExpenses: 25000 };
  const incHigherInput: BorrowerInput = { monthlyNetIncome: 100000, existingMonthlyEMIs: 10000, householdExpenses: 25000 };
  const inv3Passed =
    evaluateBorrowerRules(incHigherInput).borrowerSafeAmount.max >=
    evaluateBorrowerRules(incBaseInput).borrowerSafeAmount.max;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 3: Increasing Income Never Decreases Safe Amount',
    passed: inv3Passed,
    details: 'Higher earnings monotonically expand or preserve safe debt capacity',
  });

  // Invariant 4: Increasing loan amount should not reduce calculated EMI
  const emiAmountLow = calculateReducingEMI(300000, 12.0, 36);
  const emiAmountHigh = calculateReducingEMI(600000, 12.0, 36);
  const inv4Passed = emiAmountHigh >= emiAmountLow;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 4: Increasing Principal Never Decreases Calculated EMI',
    passed: inv4Passed,
    details: `₹3L EMI: ₹${emiAmountLow} <= ₹6L EMI: ₹${emiAmountHigh}`,
  });

  // Invariant 5: Longer tenure should reduce EMI for same principal and rate
  const emi36m = calculateReducingEMI(500000, 11.0, 36);
  const emi60m = calculateReducingEMI(500000, 11.0, 60);
  const inv5Passed = emi60m < emi36m;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 5: Longer Tenure Reduces Monthly EMI',
    passed: inv5Passed,
    details: `36m EMI: ₹${emi36m} > 60m EMI: ₹${emi60m}`,
  });

  // Invariant 6: Longer tenure should increase total interest for same principal and rate
  const interest36m = emi36m * 36 - 500000;
  const interest60m = emi60m * 60 - 500000;
  const inv6Passed = interest60m > interest36m;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 6: Longer Tenure Increases Total Cumulative Interest',
    passed: inv6Passed,
    details: `36m Interest: ₹${interest36m} < 60m Interest: ₹${interest60m}`,
  });

  // Invariant 7: Unknown credit score must not behave like credit score = 0
  const unkCreditCheck = evaluateBorrowerRules({ monthlyNetIncome: 70000, creditScoreKnown: false });
  const subprimeCheck = evaluateBorrowerRules({ monthlyNetIncome: 70000, creditScoreKnown: true, creditScore: 520 });
  const inv7Passed =
    unkCreditCheck.fairRateBand.min < subprimeCheck.fairRateBand.min &&
    unkCreditCheck.fairRateBand.max < subprimeCheck.fairRateBand.max;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 7: Unknown Credit Is Never Coerced to Subprime (Unknown != Zero)',
    passed: inv7Passed,
    details: `Unknown: ${unkCreditCheck.fairRateBand.min}%–${unkCreditCheck.fairRateBand.max}% vs Subprime 520: ${subprimeCheck.fairRateBand.min}%–${subprimeCheck.fairRateBand.max}%`,
  });

  // Invariant 8: Missing expenses must reduce confidence
  const knownExpCheck = evaluateBorrowerRules({ monthlyNetIncome: 80000, householdExpenses: 35000 });
  const missExpCheck = evaluateBorrowerRules({ monthlyNetIncome: 80000, householdExpenses: undefined });
  const inv8Passed = knownExpCheck.confidenceScore > missExpCheck.confidenceScore;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 8: Missing Expenses Reduces Analysis Confidence',
    passed: inv8Passed,
    details: `Known Exp Confidence: ${knownExpCheck.confidenceScore}% > Missing Exp Confidence: ${missExpCheck.confidenceScore}%`,
  });

  // Invariant 9: Stress-case income must not exceed base income
  const stressIncomeCheck = evaluateBorrowerRules({ monthlyNetIncome: 100000 });
  const inv9Passed = stressIncomeCheck.stressCase.stressedSafeEMI <= stressIncomeCheck.safeMonthlyOutflowCeiling.maxEMI;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 9: Stressed Safe EMI Does Not Exceed Base Safe EMI',
    passed: inv9Passed,
    details: `Stressed Safe: ₹${stressIncomeCheck.stressCase.stressedSafeEMI} <= Base Safe: ₹${stressIncomeCheck.safeMonthlyOutflowCeiling.maxEMI}`,
  });

  // Invariant 10: Fair rate must always be represented as a range
  const rateRangeCheck = evaluateBorrowerRules({ monthlyNetIncome: 100000, creditScoreKnown: true, creditScore: 800 });
  const inv10Passed = rateRangeCheck.fairRateBand.min < rateRangeCheck.fairRateBand.max;
  results.push({
    suite: 'Consistency Invariants',
    name: 'Invariant 10: Fair Rate Band Always Maintained as Range (Min < Max)',
    passed: inv10Passed,
    details: `Rate: ${rateRangeCheck.fairRateBand.min}% – ${rateRangeCheck.fairRateBand.max}% (Spread: ${rateRangeCheck.fairRateBand.max - rateRangeCheck.fairRateBand.min}%)`,
  });

  // ==========================================================================
  // EDGE CASES & MATHEMATICAL SAFETY TESTS (12 TESTS)
  // ==========================================================================

  // Edge 1: Income unknown
  const edge1 = evaluateBorrowerRules({ monthlyNetIncome: undefined });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 1: Income Unknown Preserved Without Crash or NaN',
    passed: Number.isFinite(edge1.safeMonthlyOutflowCeiling.maxEMI) && !isNaN(edge1.safeMonthlyOutflowCeiling.maxEMI),
    details: `Handled with baseline simulation; safe EMI: ₹${edge1.safeMonthlyOutflowCeiling.maxEMI}`,
  });

  // Edge 2: Expenses unknown
  const edge2 = evaluateBorrowerRules({ monthlyNetIncome: 60000, householdExpenses: undefined });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 2: Expenses Unknown Imputed via Benchmark Ratio',
    passed: Number.isFinite(edge2.borrowerSafeAmount.max) && edge2.rangeWidened === true,
    details: `Imputed 45% living costs; safe amount: ₹${edge2.borrowerSafeAmount.max}`,
  });

  // Edge 3: Existing EMI unknown
  const edge3 = evaluateBorrowerRules({ monthlyNetIncome: 60000, existingMonthlyEMIs: undefined });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 3: Existing EMI Unknown Preserved as Unverified',
    passed: Number.isFinite(edge3.safeMonthlyOutflowCeiling.maxEMI) && edge3.confidence !== 'high',
    details: `Defaulted debt obligations to ₹0 with lower confidence`,
  });

  // Edge 4: Zero existing EMI
  const edge4 = evaluateBorrowerRules({ monthlyNetIncome: 60000, existingMonthlyEMIs: 0 });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 4: Zero Existing EMI Maximizes Safe Borrowing Headroom',
    passed: edge4.safeMonthlyOutflowCeiling.maxEMI > 0,
    details: `Safe EMI ceiling: ₹${edge4.safeMonthlyOutflowCeiling.maxEMI}/mo`,
  });

  // Edge 5: Very high existing EMI exceeding income
  const edge5 = evaluateBorrowerRules({ monthlyNetIncome: 50000, existingMonthlyEMIs: 60000 });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 5: Extreme Debt Service Handled Gracefully (Verdict: Don\'t Borrow)',
    passed: edge5.verdict === 'dont_borrow' && edge5.borrowerSafeAmount.max === 0 && edge5.safeMonthlyOutflowCeiling.maxEMI === 0,
    details: `Verdict: ${edge5.verdict}, Safe Max: ₹${edge5.borrowerSafeAmount.max}, No negative numbers`,
  });

  // Edge 6: Requested amount greater than safe amount
  const edge6 = evaluateBorrowerRules({ monthlyNetIncome: 80000, amountRequested: 1000000 });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 6: Requested Amount Above Safe Ceiling Triggers Borrow Less',
    passed: edge6.verdict === 'borrow_less',
    details: `Requested: ₹10L vs Safe: ₹${edge6.borrowerSafeAmount.max} -> Verdict: ${edge6.verdict}`,
  });

  // Edge 7: Requested amount greater than lender estimate
  const edge7 = evaluateBorrowerRules({ monthlyNetIncome: 40000, amountRequested: 10000000 });
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 7: Requested Amount Above Lender Estimate Triggers Don\'t Borrow',
    passed: edge7.verdict === 'dont_borrow',
    details: `Requested: ₹1 Cr on ₹40k salary -> Verdict: ${edge7.verdict}`,
  });

  // Edge 8: Very short tenure (6 months)
  const emiShort = calculateReducingEMI(100000, 12.0, 6);
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 8: Ultra-Short Tenure (6 Months) Evaluated Without Math Error',
    passed: Number.isFinite(emiShort) && emiShort > 0,
    details: `6m EMI on ₹1L: ₹${emiShort}`,
  });

  // Edge 9: Very long tenure (240 months / 20 years)
  const emiLong = calculateReducingEMI(2000000, 9.0, 240);
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 9: Ultra-Long Tenure (240 Months) Evaluated Accurately',
    passed: Number.isFinite(emiLong) && emiLong > 0,
    details: `240m EMI on ₹20L: ₹${emiLong}`,
  });

  // Edge 10: Zero processing fee
  const aprZeroFee = calculateIndicativeAPR(10.5, 0);
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 10: Zero Processing Fee Produces APR Equal to Nominal Rate',
    passed: aprZeroFee === 10.5,
    details: `APR with 0% fee: ${aprZeroFee}% (Matches nominal 10.5%)`,
  });

  // Edge 11: Unknown processing fee
  const aprUnknownFee = step6_allInAPR({ min: 10.5, max: 12.5, median: 11.5, spread: 2.0, unit: '% p.a.', explanation: '', rangeWidened: true, confidence: 'moderate' }, step1_normalize({ monthlyNetIncome: 50000 }));
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 11: Unknown Processing Fee Produces Estimated APR Range',
    passed: aprUnknownFee.status === 'estimated' && aprUnknownFee.max > aprUnknownFee.min,
    details: `Estimated APR band: ${aprUnknownFee.min}% – ${aprUnknownFee.max}%`,
  });

  // Edge 12: Negative or zero inputs sanitized without NaN/Infinity
  const emiZeroPrincipal = calculateReducingEMI(0, 10.0, 36);
  const emiNegativePrincipal = calculateReducingEMI(-50000, 10.0, 36);
  const emiZeroTenure = calculateReducingEMI(100000, 10.0, 0);
  results.push({
    suite: 'Edge Cases & Safety',
    name: 'Edge 12: Zero/Negative Inputs Sanitized (No NaN or Infinity)',
    passed: emiZeroPrincipal === 0 && emiNegativePrincipal === 0 && emiZeroTenure === 0,
    details: `Zero principal: ${emiZeroPrincipal}, Negative principal: ${emiNegativePrincipal}, Zero tenure: ${emiZeroTenure}`,
  });

  // ==========================================================================
  // PHASE 6: NEGOTIATION CARD & LENDER OFFER COMPARISON TESTS (14 TESTS)
  // ==========================================================================

  // Phase 6 Test 1: No offer provided
  const p6AssessmentNoOffer = evaluateBorrowerRules({
    monthlyNetIncome: 75000,
    amountRequested: 500000,
    tenureWantedMonths: 36,
    creditScoreKnown: true,
    creditScore: 760,
  });
  const p6Test1Passed =
    p6AssessmentNoOffer.negotiation.cardState === 'no_offer' &&
    p6AssessmentNoOffer.negotiation.hasOffer === false &&
    p6AssessmentNoOffer.negotiation.points.length >= 2 &&
    p6AssessmentNoOffer.negotiation.questionsToAsk.length >= 2 &&
    p6AssessmentNoOffer.negotiation.script.length > 20;
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '1. No Offer Provided (Standard Boundaries & Script)',
    passed: p6Test1Passed,
    details: `State: ${p6AssessmentNoOffer.negotiation.cardState}, Points: ${p6AssessmentNoOffer.negotiation.points.length}, Questions: ${p6AssessmentNoOffer.negotiation.questionsToAsk.length}`,
  });

  // Phase 6 Test 2: Quoted rate above fair range
  const p6HighRateInput: BorrowerInput = {
    monthlyNetIncome: 80000,
    amountRequested: 400000,
    creditScoreKnown: true,
    creditScore: 770,
    hasLenderOffer: true,
    quotedRate: 16.5, // Fair rate for 770 credit score is ~10.5-12.0%
    quotedFee: 1.0,
  };
  const p6HighRateRes = evaluateBorrowerRules(p6HighRateInput);
  const rateComparison = p6HighRateRes.negotiation.comparisons.find((c) => c.id === 'rate');
  const p6Test2Passed =
    rateComparison?.status === 'above_range' &&
    rateComparison?.isWarning === true &&
    p6HighRateRes.negotiation.points.some((p) => p.includes('16.5%') || p.includes('above'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '2. Quoted Rate Above Fair Range (Flagged with Counter-Offer)',
    passed: p6Test2Passed,
    details: `Rate status: ${rateComparison?.status}, Explanation: ${rateComparison?.explanation}`,
  });

  // Phase 6 Test 3: Quoted EMI above safe ceiling
  const p6HighEMIInput: BorrowerInput = {
    monthlyNetIncome: 60000,
    existingMonthlyEMIs: 10000,
    householdExpenses: 30000,
    amountRequested: 500000,
    hasLenderOffer: true,
    quotedRate: 11.5,
    quotedEMI: 28000, // Safe EMI is around ₹11,000; 28,000 is massive overextension
  };
  const p6HighEMIRes = evaluateBorrowerRules(p6HighEMIInput);
  const emiComparison = p6HighEMIRes.negotiation.comparisons.find((c) => c.id === 'emi');
  const p6Test3Passed =
    emiComparison?.status === 'above_safe_limit' &&
    emiComparison?.isWarning === true &&
    p6HighEMIRes.negotiation.primaryPriority.toLowerCase().includes('emi');
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '3. Quoted EMI Above Safe Ceiling (Prioritizes Lower EMI/Amount)',
    passed: p6Test3Passed,
    details: `EMI status: ${emiComparison?.status}, Priority: ${p6HighEMIRes.negotiation.primaryPriority}`,
  });

  // Phase 6 Test 4: Quoted amount above safe borrowing limit
  const p6HighAmountInput: BorrowerInput = {
    monthlyNetIncome: 50000,
    amountRequested: 300000,
    hasLenderOffer: true,
    quotedAmount: 900000, // Bank tries to upsell ₹9L on ₹50k salary
    quotedRate: 12.0,
  };
  const p6HighAmountRes = evaluateBorrowerRules(p6HighAmountInput);
  const amountComparison = p6HighAmountRes.negotiation.comparisons.find((c) => c.id === 'amount');
  const p6Test4Passed =
    amountComparison?.status === 'above_safe_limit' &&
    p6HighAmountRes.negotiation.points.some((p) => p.includes('borrower-safe') || p.includes('above'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '4. Quoted Amount Above Safe Borrowing Limit',
    passed: p6Test4Passed,
    details: `Amount status: ${amountComparison?.status}, Quoted ₹9L vs Safe ₹${p6HighAmountRes.borrowerSafeAmount.max}`,
  });

  // Phase 6 Test 5: Hidden APR warning (Low headline rate + High fees)
  const p6HiddenAPRInput: BorrowerInput = {
    monthlyNetIncome: 90000,
    amountRequested: 500000,
    hasLenderOffer: true,
    quotedRate: 10.0, // Looks cheap on paper
    quotedFee: 4.5, // Exorbitant fee => APR ~ 15.3%
  };
  const p6HiddenAPRRes = evaluateBorrowerRules(p6HiddenAPRInput);
  const aprComparison = p6HiddenAPRRes.negotiation.comparisons.find((c) => c.id === 'apr');
  const p6Test5Passed =
    aprComparison?.isWarning === true &&
    aprComparison?.status === 'above_range' &&
    p6HiddenAPRRes.negotiation.points.some((p) => p.toLowerCase().includes('apr') || p.toLowerCase().includes('processing fee'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '5. Hidden APR Warning (Low Rate + High Fees Flagged)',
    passed: p6Test5Passed,
    details: `APR Status: ${aprComparison?.status}, Quoted APR: ${aprComparison?.lenderOffer}, Explanation: ${aprComparison?.explanation}`,
  });

  // Phase 6 Test 6: Unknown lender fees
  const p6UnknownFeesInput: BorrowerInput = {
    monthlyNetIncome: 80000,
    amountRequested: 400000,
    hasLenderOffer: true,
    quotedRate: 11.5,
    quotedFee: undefined, // Unknown
    lenderOffer: {
      hasOffer: true,
      quotedRate: 11.5,
      isFeeUnknown: true,
    },
  };
  const p6UnknownFeesRes = evaluateBorrowerRules(p6UnknownFeesInput);
  const unkFeeComparison = p6UnknownFeesRes.negotiation.comparisons.find((c) => c.id === 'apr');
  const p6Test6Passed =
    p6UnknownFeesRes.negotiation.cardState === 'incomplete_offer' &&
    unkFeeComparison?.status === 'unknown' &&
    unkFeeComparison?.lenderOffer.includes('Unknown') &&
    p6UnknownFeesRes.negotiation.questionsToAsk.some((q) => q.toLowerCase().includes('processing fee') || q.toLowerCase().includes('schedule of all charges'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '6. Unknown Lender Fees (Preserved as Unknown & Prompts Fee Schedule)',
    passed: p6Test6Passed,
    details: `State: ${p6UnknownFeesRes.negotiation.cardState}, APR lender offer: ${unkFeeComparison?.lenderOffer}`,
  });

  // Phase 6 Test 7: Unknown quoted EMI
  const p6UnknownEMIInput: BorrowerInput = {
    monthlyNetIncome: 75000,
    amountRequested: 500000,
    hasLenderOffer: true,
    quotedAmount: 500000,
    quotedRate: 12.0,
    quotedTenure: 36,
    quotedEMI: undefined,
    lenderOffer: {
      hasOffer: true,
      quotedAmount: 500000,
      quotedRate: 12.0,
      quotedTenure: 36,
      isEMIUnknown: true,
    },
  };
  const p6UnknownEMIRes = evaluateBorrowerRules(p6UnknownEMIInput);
  const unkEmiComp = p6UnknownEMIRes.negotiation.comparisons.find((c) => c.id === 'emi');
  const p6Test7Passed =
    unkEmiComp !== undefined &&
    unkEmiComp.explanation.includes('Reducing-balance calculation') &&
    unkEmiComp.lenderOffer.includes('est.');
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '7. Unknown Quoted EMI (Computes Reducing Estimate with Disclaimer)',
    passed: p6Test7Passed,
    details: `Quoted EMI display: ${unkEmiComp?.lenderOffer}, Explanation: ${unkEmiComp?.explanation}`,
  });

  // Phase 6 Test 8: Combined unfavorable offer
  const p6CombinedUnfavInput: BorrowerInput = {
    monthlyNetIncome: 60000,
    existingMonthlyEMIs: 12000,
    householdExpenses: 30000,
    amountRequested: 500000,
    hasLenderOffer: true,
    quotedRate: 18.0,
    quotedFee: 3.5,
    quotedEMI: 26000,
  };
  const p6CombinedRes = evaluateBorrowerRules(p6CombinedUnfavInput);
  const p6Test8Passed =
    p6CombinedRes.negotiation.comparisons.filter((c) => c.isWarning).length >= 2 &&
    p6CombinedRes.negotiation.primaryPriority.length > 0;
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '8. Combined Unfavorable Offer (Multiple Warnings & Clear Top Priority)',
    passed: p6Test8Passed,
    details: `Warnings count: ${p6CombinedRes.negotiation.comparisons.filter((c) => c.isWarning).length}, Primary Priority: ${p6CombinedRes.negotiation.primaryPriority}`,
  });

  // Phase 6 Test 9: Favorable offer
  const p6FavorableInput: BorrowerInput = {
    monthlyNetIncome: 100000,
    existingMonthlyEMIs: 5000,
    householdExpenses: 35000,
    amountRequested: 400000,
    hasLenderOffer: true,
    quotedRate: 11.0,
    quotedFee: 1.0,
    quotedEMI: 13100,
    quotedAmount: 400000,
  };
  const p6FavorableRes = evaluateBorrowerRules(p6FavorableInput);
  const p6Test9Passed =
    p6FavorableRes.negotiation.comparisons.every((c) => !c.isWarning) &&
    p6FavorableRes.negotiation.primaryPriority.toLowerCase().includes('fits');
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '9. Favorable Offer (All Safe Bounds Respected)',
    passed: p6Test9Passed,
    details: `Priority: ${p6FavorableRes.negotiation.primaryPriority}`,
  });

  // Phase 6 Test 10: Low-confidence borrower (indicative credit)
  const p6LowConfInput: BorrowerInput = {
    monthlyNetIncome: 50000,
    amountRequested: 300000,
    creditScoreKnown: false,
    creditScore: undefined,
  };
  const p6LowConfRes = evaluateBorrowerRules(p6LowConfInput);
  const p6Test10Passed =
    p6LowConfRes.confidence === 'indicative' &&
    p6LowConfRes.negotiation.script.toLowerCase().includes('confidence is limited') &&
    p6LowConfRes.negotiation.script.toLowerCase().includes('credit information is incomplete');
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '10. Low-Confidence Borrower (Preliminary Range & Script Safeguards)',
    passed: p6Test10Passed,
    details: `Script: "${p6LowConfRes.negotiation.script}"`,
  });

  // Phase 6 Test 11: Priya Baseline
  const p6PriyaRes = evaluateBorrowerRules(PERSONA_INPUTS.priya);
  const p6Test11Passed =
    p6PriyaRes.negotiation !== undefined &&
    p6PriyaRes.negotiation.points.length >= 2 &&
    p6PriyaRes.negotiation.questionsToAsk.length >= 2;
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '11. Persona 1: Priya Negotiation Card Verified',
    passed: p6Test11Passed,
    details: `Card state: ${p6PriyaRes.negotiation.cardState}, Points: ${p6PriyaRes.negotiation.points.length}`,
  });

  // Phase 6 Test 12: Ravi Baseline
  const p6RaviRes = evaluateBorrowerRules(PERSONA_INPUTS.ravi);
  const p6Test12Passed =
    p6RaviRes.negotiation !== undefined &&
    p6RaviRes.negotiation.points.length >= 2 &&
    p6RaviRes.negotiation.points.some((p) => p.toLowerCase().includes('collateral') || p.toLowerCase().includes('od') || p.toLowerCase().includes('prime'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '12. Persona 2: Ravi Productive Negotiation Card Verified',
    passed: p6Test12Passed,
    details: `Card state: ${p6RaviRes.negotiation.cardState}, Collateral leverage present: true`,
  });

  // Phase 6 Test 13: Anita Baseline
  const p6AnitaRes = evaluateBorrowerRules(PERSONA_INPUTS.anita);
  const p6Test13Passed =
    p6AnitaRes.negotiation !== undefined &&
    p6AnitaRes.negotiation.points.some((p) => p.toLowerCase().includes('buffer') || p.toLowerCase().includes('reject') || p.toLowerCase().includes('app loans') || p.toLowerCase().includes('mudra'));
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '13. Persona 3: Anita Vulnerable Negotiation Card Verified',
    passed: p6Test13Passed,
    details: `Card state: ${p6AnitaRes.negotiation.cardState}, Protective points present: true`,
  });

  // Phase 6 Test 14: Unknown vs Zero Fees Distinction
  const zeroFeeOffer = { hasOffer: true, quotedRate: 12.0, quotedFee: 0 };
  const unknownFeeOffer = { hasOffer: true, quotedRate: 12.0, quotedFee: undefined, isFeeUnknown: true };
  const baseAss = evaluateBorrowerRules({ monthlyNetIncome: 70000 });
  const zeroGuidance = generateNegotiationGuidance(baseAss, zeroFeeOffer);
  const unkGuidance = generateNegotiationGuidance(baseAss, unknownFeeOffer);
  const zeroAprRow = zeroGuidance.comparisons.find((c) => c.id === 'apr');
  const unkAprRow = unkGuidance.comparisons.find((c) => c.id === 'apr');
  const p6Test14Passed = Boolean(
    zeroAprRow?.lenderOffer.includes('12.0%') &&
    unkAprRow?.status === 'unknown' &&
    unkAprRow?.lenderOffer.includes('Unknown')
  );
  results.push({
    suite: 'Phase 6: Negotiation Card',
    name: '14. Unknown vs Zero Fees Distinction (Never Coerced to 0%)',
    passed: p6Test14Passed,
    details: `0% fee APR: ${zeroAprRow?.lenderOffer} vs Unknown fee APR: ${unkAprRow?.lenderOffer}`,
  });

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Auto-run if executed directly via CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('tests')) {
  const { passed, results } = runSanityCheck();
  console.log(`\n=== BORROWER COPILOT TEST SUITE: ${results.length} TESTS ===`);
  const suites = Array.from(new Set(results.map((r) => r.suite)));
  for (const suite of suites) {
    const suiteTests = results.filter((r) => r.suite === suite);
    const passedCount = suiteTests.filter((r) => r.passed).length;
    console.log(`✓ [${suite}] ${passedCount}/${suiteTests.length} PASSED`);
  }
  const failed = results.filter((r) => !r.passed);
  if (!passed || failed.length > 0) {
    console.error(`\nFAILED (${failed.length}/${results.length} tests):`);
    failed.forEach((f) => console.error(`  ✕ [${f.suite}] ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log(`\nALL ${results.length} TESTS PASSED SUCCESSFULLY.\n`);
    process.exit(0);
  }
}

