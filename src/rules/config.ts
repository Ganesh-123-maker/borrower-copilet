/**
 * @file src/rules/config.ts
 * @description Centralized financial underwriting assumptions, FOIR boundaries,
 * interest rate benchmark spreads, stress parameters, and epistemic policies.
 * 
 * EPISTEMIC HONESTY DIRECTIVE:
 * We explicitly document the epistemic source of each assumption:
 * - 'CHALLENGE_BRIEF': Directly specified in the project problem statement.
 * - 'EXTERNAL_SOURCE': Statutorily mandated or recognized regulatory/tax codes (e.g. GST).
 * - 'MY_JUDGEMENT': Product heuristics, conservative underwriting limits, and empirical observations.
 * 
 * NEVER disguise product assumptions as statutory RBI mandates.
 */

export type AssumptionSourceType = 'CHALLENGE_BRIEF' | 'EXTERNAL_SOURCE' | 'MY_JUDGEMENT';

export interface DocumentedAssumption<T> {
  value: T;
  label: string;
  sourceType: AssumptionSourceType;
  rationale: string;
  citation?: string;
}

/**
 * FOIR (Fixed Obligation to Income Ratio) Central Configuration
 * 
 * Formula:
 * FOIR = (Existing Monthly Debt Obligations + Proposed New EMI) / Monthly Net Income
 */
export const FOIR_RULES = {
  /**
   * Conservative borrower-safe FOIR ceiling (35%).
   * Protects borrower cash flow against living cost inflation and emergency shocks.
   */
  borrowerSafeConservative: {
    value: 0.35,
    label: 'Borrower-Safe Prudent FOIR Ceiling (35%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Leaves 65% of net income for living expenses, savings, and contingencies. Prevents debt stress.',
  } as DocumentedAssumption<number>,

  /**
   * Moderate borrower-safe FOIR ceiling for productive business loans with revenue generation (45%).
   */
  borrowerSafeProductive: {
    value: 0.45,
    label: 'Productive Business Debt Safe FOIR Ceiling (45%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Productive assets generate incremental business cash flow, justifying a slightly higher safe debt threshold.',
  } as DocumentedAssumption<number>,

  /**
   * Standard retail bank/NBFC underwriting maximum FOIR (50%).
   */
  standardBankUnderwriting: {
    value: 0.50,
    label: 'Standard Institutional Retail Lender FOIR (50%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Empirical market standard used by Indian public & private banks for general salaried applicants.',
  } as DocumentedAssumption<number>,

  /**
   * Aggressive institutional ceiling for Category-A corporate MNC earners (60%).
   */
  aggressiveBankCorporate: {
    value: 0.60,
    label: 'Aggressive Corporate MNC Salaried FOIR (60%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Lenders aggressively stretch credit limits on high-salary profiles with strong credit bureau scores.',
  } as DocumentedAssumption<number>,

  /**
   * Stressed FOIR limit under adverse economic shock (40%).
   */
  stressedFOIRCeiling: {
    value: 0.40,
    label: 'Adverse Scenario Stressed FOIR Limit (40%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Under reduced cash flow, total debt service must not exceed 40% of contracted earnings to prevent default.',
  } as DocumentedAssumption<number>,

  /**
   * Minimum unallocated cash surplus buffer (15%).
   */
  minResidualSurplusRatio: {
    value: 0.15,
    label: 'Minimum Residual Income Buffer Ratio (15%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Borrowers must retain at least 15% of net income free of all living expenses and EMIs as a buffer.',
  } as DocumentedAssumption<number>,
};

/**
 * Living Expenses Imputation Benchmarks (When User Expenses Are Unstated)
 */
export const EXPENSE_IMPUTATION_RULES = {
  /**
   * Default living expense benchmark as percentage of net income (45%).
   */
  defaultLivingExpenseRatio: {
    value: 0.45,
    label: 'Standard Household Expense Benchmark (45% of net income)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'When living expenses are unknown, we estimate them at 45% of net income rather than assuming ₹0.',
  } as DocumentedAssumption<number>,

  /**
   * Metro tier-1 living expense floor for high cost of living cities (₹25,000/month).
   */
  metroLivingExpenseFloor: {
    value: 25000,
    label: 'Tier-1 Metro Household Expense Floor (₹25,000)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Living in Bengaluru, Mumbai, or Delhi carries unavoidable rental and essential living overheads.',
  } as DocumentedAssumption<number>,
};

/**
 * Interest Rate Benchmark Assumed Spreads
 */
export const FAIR_RATE_ASSUMPTIONS = {
  /**
   * Prime secured mortgage / LAP / MSME commercial property-backed rate band.
   */
  securedPrimeLAP: {
    value: { min: 9.25, max: 10.75 },
    label: 'Secured Loan Against Property / MSME Rate Band (9.25%–10.75%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Backed by unencumbered commercial/residential real estate with LTV <= 50%, minimizing credit risk for banks.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Prime unsecured corporate salaried personal loan band (750+ CIBIL).
   */
  unsecuredPrimeSalaried: {
    value: { min: 10.5, max: 12.0 },
    label: 'Tier-1 Corporate Salaried Prime Personal Loan (10.5%–12.0%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Top-tier employer with verified 750+ credit bureau history qualifies for prime retail bank pricing.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Standard unsecured personal loan band (700–749 CIBIL).
   */
  unsecuredStandardSalaried: {
    value: { min: 11.5, max: 13.5 },
    label: 'Standard Salaried Personal Loan Band (11.5%–13.5%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Good credit profile with standard employer categorization.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Near-prime unsecured personal loan band (650–699 CIBIL).
   */
  unsecuredNearPrime: {
    value: { min: 13.5, max: 16.0 },
    label: 'Near-Prime NBFC Personal Loan Band (13.5%–16.0%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'NBFC pricing for borrowers with thin or slightly irregular credit history.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Subprime / documented past bounce personal loan band (< 650 CIBIL).
   */
  unsecuredSubprime: {
    value: { min: 16.0, max: 22.0 },
    label: 'Subprime / Documented Default Risk Band (16.0%–22.0%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Borrowers with verified low bureau score or recent cheque/NACH bounce face severe risk premium.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Unknown credit score rate band (11.5%–16.5%).
   * Spread is widened (5.0%) without defaulting to subprime pricing.
   */
  unsecuredUnknownCredit: {
    value: { min: 11.5, max: 16.5 },
    label: 'Unverified Credit Bureau Widened Rate Band (11.5%–16.5%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Unknown != Zero. Credit score is unverified, so market rate spread is widened to reflect uncertainty.',
  } as DocumentedAssumption<{ min: number; max: number }>,

  /**
   * Informal / gig worker vehicle or priority sector micro-loan band (14.0%–18.0%).
   */
  informalPrioritySector: {
    value: { min: 14.0, max: 18.0 },
    label: 'Formal Two-Wheeler / PM Mudra Micro-Credit Band (14.0%–18.0%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Subsidized priority sector or organized two-wheeler finance benchmark, avoiding 30%+ instant apps.',
  } as DocumentedAssumption<{ min: number; max: number }>,
};

/**
 * Loan Fee & Tax Statutory Parameters
 */
export const FEE_AND_TAX_RULES = {
  /**
   * Default upfront processing fee benchmark (1.0%–1.5%).
   */
  defaultProcessingFeePercent: {
    value: 1.5,
    label: 'Benchmark Processing Fee (1.5% of loan amount)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Empirical average for Indian commercial personal loans when exact lender quote is unstated.',
  } as DocumentedAssumption<number>,

  /**
   * Statutory GST on financial services (18%).
   */
  gstRateOnFinancialServices: {
    value: 18,
    label: 'Statutory GST on Loan Fees (18%)',
    sourceType: 'EXTERNAL_SOURCE',
    rationale:
      'Mandatory Goods and Services Tax (GST) levied on processing fees, documentation, and penal charges in India.',
    citation: 'Section 9 of Central Goods and Services Tax (CGST) Act, 2017',
  } as DocumentedAssumption<number>,
};

/**
 * Stress Testing Scenario Parameters
 */
export const STRESS_TEST_RULES = {
  /**
   * Challenge-mandated stress test: 20% income reduction scenario.
   */
  incomeDropPercentage: {
    value: 20,
    label: 'Adverse Income Shock Scenario (-20%)',
    sourceType: 'CHALLENGE_BRIEF',
    rationale:
      'Hypothetical scenario simulation testing whether debt payments remain viable if net earnings fall by 20%.',
  } as DocumentedAssumption<number>,

  /**
   * Tolerance multiplier for stressed safe EMI (1.15).
   */
  stressToleranceMargin: {
    value: 1.15,
    label: 'Stressed Safe EMI Tolerance Margin (15%)',
    sourceType: 'MY_JUDGEMENT',
    rationale:
      'Small tolerance window before declaring a stressed debt payment non-viable.',
  } as DocumentedAssumption<number>,
};
