/**
 * CORE FORMULAS:
 * 1. Flat Interest = Principal * (annualFlatRate / 100) * (tenureMonths / 12)
 * 2. Total Flat Repayment = Principal + Flat Interest
 * 3. Flat Monthly Payment = Total Flat Repayment / tenureMonths
 * 
 * 4. Equivalent Reducing Balance Rate:
 *    Solved numerically using the bisection (binary search) method:
 *    Find r (in % p.a.) such that calculateReducingEMI(P, r, tenureMonths) === Flat Monthly Payment.
 */

import { calculateReducingEMI } from './emi';

export interface FlatRateConversionResult {
  principal: number;
  tenureMonths: number;
  flatRateAnnualPercent: number;
  flatTotalInterest: number;
  flatTotalRepayment: number;
  flatMonthlyPayment: number;
  approxEquivalentReducingRate: number;
  reducingEMIAtNominalFlatRate: number;
  reducingTotalInterestAtNominalRate: number;
  reducingTotalRepaymentAtNominalRate: number;
  interestDifferenceRupees: number;
  interestDifferencePercent: number;
  tenureYears: number;
  isValid: boolean;
}

/**
 * Solve for the annual reducing balance rate that produces the target monthly EMI.
 * Uses a monotonic bisection method with 36 iterations (precision < 0.0001%).
 * 
 * @param principal Principal loan amount in INR
 * @param tenureMonths Tenure in months
 * @param targetEMI Target monthly payment in INR
 * @returns Annual reducing interest rate percentage (e.g. 14.55 for 14.55%)
 */
export function solveEquivalentReducingRate(
  principal: number,
  tenureMonths: number,
  targetEMI: number
): number {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(tenureMonths) ||
    !Number.isFinite(targetEMI) ||
    principal <= 0 ||
    tenureMonths <= 0 ||
    targetEMI <= 0
  ) {
    return 0;
  }

  const zeroInterestEMI = principal / tenureMonths;
  if (targetEMI <= zeroInterestEMI) {
    return 0;
  }

  let low = 0.0;
  let high = 250.0;
  const iterations = 36;

  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    const computedEMI = calculateReducingEMI(principal, mid, tenureMonths, false);

    if (computedEMI < targetEMI) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const result = (low + high) / 2;
  return Math.round(result * 100) / 100;
}

/**
 * Compare flat-rate loan pricing against reducing-balance economics.
 * 
 * @param principal Principal loan amount in INR
 * @param tenureMonths Loan tenure in months
 * @param annualFlatRatePercent Quoted annual flat rate percentage (e.g. 8 for 8% flat)
 */
export function calculateFlatRateConversion(
  principal: number,
  tenureMonths: number,
  annualFlatRatePercent: number
): FlatRateConversionResult {
  const safeP = Number.isFinite(principal) && principal > 0 ? principal : 0;
  const safeTenure = Number.isFinite(tenureMonths) && tenureMonths > 0 ? Math.round(tenureMonths) : 0;
  const safeFlatRate = Number.isFinite(annualFlatRatePercent) && annualFlatRatePercent >= 0 ? annualFlatRatePercent : 0;

  if (safeP <= 0 || safeTenure <= 0 || safeFlatRate <= 0) {
    return {
      principal: safeP,
      tenureMonths: safeTenure,
      flatRateAnnualPercent: safeFlatRate,
      flatTotalInterest: 0,
      flatTotalRepayment: safeP,
      flatMonthlyPayment: safeTenure > 0 ? Math.round(safeP / safeTenure) : 0,
      approxEquivalentReducingRate: 0,
      reducingEMIAtNominalFlatRate: safeTenure > 0 ? Math.round(safeP / safeTenure) : 0,
      reducingTotalInterestAtNominalRate: 0,
      reducingTotalRepaymentAtNominalRate: safeP,
      interestDifferenceRupees: 0,
      interestDifferencePercent: 0,
      tenureYears: safeTenure > 0 ? Number((safeTenure / 12).toFixed(1)) : 0,
      isValid: false,
    };
  }

  const tenureYears = safeTenure / 12;
  const flatTotalInterest = Math.round(safeP * (safeFlatRate / 100) * tenureYears);
  const flatTotalRepayment = safeP + flatTotalInterest;
  const flatMonthlyPayment = Math.round(flatTotalRepayment / safeTenure);

  const approxEquivalentReducingRate = solveEquivalentReducingRate(
    safeP,
    safeTenure,
    flatTotalRepayment / safeTenure
  );

  const reducingEMIAtNominalFlatRate = calculateReducingEMI(safeP, safeFlatRate, safeTenure, true);
  const reducingTotalRepaymentAtNominalRate = reducingEMIAtNominalFlatRate * safeTenure;
  const reducingTotalInterestAtNominalRate = Math.max(0, reducingTotalRepaymentAtNominalRate - safeP);

  const interestDifferenceRupees = Math.max(0, flatTotalInterest - reducingTotalInterestAtNominalRate);
  const interestDifferencePercent =
    reducingTotalInterestAtNominalRate > 0
      ? Math.round((interestDifferenceRupees / reducingTotalInterestAtNominalRate) * 100)
      : 0;

  return {
    principal: safeP,
    tenureMonths: safeTenure,
    flatRateAnnualPercent: safeFlatRate,
    flatTotalInterest,
    flatTotalRepayment,
    flatMonthlyPayment,
    approxEquivalentReducingRate,
    reducingEMIAtNominalFlatRate,
    reducingTotalInterestAtNominalRate,
    reducingTotalRepaymentAtNominalRate,
    interestDifferenceRupees,
    interestDifferencePercent,
    tenureYears: Number(tenureYears.toFixed(1)),
    isValid: true,
  };
}
