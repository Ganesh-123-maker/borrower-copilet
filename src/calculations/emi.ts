/**
 * @file src/calculations/emi.ts
 * @description Standard reducing balance EMI amortization and loan mathematical formulas.
 * 
 * CORE FORMULA:
 *             P * r * (1 + r)^n
 *     EMI = ---------------------
 *               (1 + r)^n - 1
 * 
 * where:
 *   P = Principal loan amount in INR
 *   r = Monthly interest rate (annualRatePercentage / (12 * 100))
 *   n = Number of monthly payment installments (tenureMonths)
 */

/**
 * Standard Reducing Balance EMI calculation formula
 * @param principal Principal loan amount in INR
 * @param annualRatePercentage Annual interest rate percentage (e.g. 10.5 for 10.5%)
 * @param tenureMonths Loan tenure in months
 * @returns Monthly installment rounded to nearest integer (or exact float if rounded=false)
 */
export function calculateReducingEMI(
  principal: number,
  annualRatePercentage: number,
  tenureMonths: number,
  rounded: boolean = true
): number {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRatePercentage) ||
    !Number.isFinite(tenureMonths) ||
    tenureMonths <= 0 ||
    principal <= 0
  ) {
    return 0;
  }

  const monthlyRate = annualRatePercentage / (12 * 100);

  // Zero interest rate edge case
  if (monthlyRate === 0) {
    const raw = principal / tenureMonths;
    return rounded ? Math.round(raw) : raw;
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);

  if (!Number.isFinite(emi) || isNaN(emi)) {
    return 0;
  }

  return rounded ? Math.round(emi) : emi;
}

/**
 * Calculate principal that an affordable monthly EMI can support
 * @param affordableEmi Monthly EMI in INR
 * @param annualRatePercentage Annual interest rate percentage
 * @param tenureMonths Loan tenure in months
 */
export function calculatePrincipalFromEMI(
  affordableEmi: number,
  annualRatePercentage: number,
  tenureMonths: number,
  rounded: boolean = true
): number {
  if (
    !Number.isFinite(affordableEmi) ||
    !Number.isFinite(annualRatePercentage) ||
    !Number.isFinite(tenureMonths) ||
    tenureMonths <= 0 ||
    affordableEmi <= 0
  ) {
    return 0;
  }

  const monthlyRate = annualRatePercentage / (12 * 100);

  if (monthlyRate === 0) {
    const raw = affordableEmi * tenureMonths;
    return rounded ? Math.round(raw) : raw;
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const principal = (affordableEmi * (factor - 1)) / (monthlyRate * factor);

  if (!Number.isFinite(principal) || isNaN(principal)) {
    return 0;
  }

  return rounded ? Math.round(principal) : principal;
}

/**
 * Approximate Annual Percentage Rate (APR) factoring in upfront processing fee & GST
 * @param nominalAnnualRate Nominal interest rate percentage p.a.
 * @param processingFeePercent Processing fee as a percentage of principal
 * @param gstPercent GST percentage on fees (statutory 18% in India)
 */
export function calculateIndicativeAPR(
  nominalAnnualRate: number,
  processingFeePercent: number,
  gstPercent: number = 18
): number {
  if (!Number.isFinite(nominalAnnualRate)) return 0;
  const safeFee = Number.isFinite(processingFeePercent) ? Math.max(0, processingFeePercent) : 0;
  const safeGst = Number.isFinite(gstPercent) ? Math.max(0, gstPercent) : 18;
  const feeWithGst = safeFee * (1 + safeGst / 100);
  const apr = nominalAnnualRate + feeWithGst;
  return Number(apr.toFixed(2));
}

export interface CalculatedTenureTradeoff {
  months: number;
  emi: number;
  totalInterest: number;
  totalRepayment: number;
  isSuggested?: boolean;
}

/**
 * Generate tenure trade-off analysis across standard tenure lengths
 */
export function calculateTenureTradeoffs(
  principal: number,
  annualRatePercentage: number,
  suggestedTenure: number = 36,
  tenureList: number[] = [24, 36, 48, 60]
): CalculatedTenureTradeoff[] {
  if (!Number.isFinite(principal) || principal <= 0) {
    return tenureList.map((m) => ({
      months: m,
      emi: 0,
      totalInterest: 0,
      totalRepayment: 0,
      isSuggested: m === suggestedTenure,
    }));
  }

  const uniqueTenures = Array.from(new Set([...tenureList, suggestedTenure])).sort((a, b) => a - b);

  return uniqueTenures.map((months) => {
    const emi = calculateReducingEMI(principal, annualRatePercentage, months);
    const totalRepayment = emi * months;
    const totalInterest = Math.max(0, totalRepayment - principal);
    return {
      months,
      emi,
      totalInterest,
      totalRepayment,
      isSuggested: months === suggestedTenure,
    };
  });
}
