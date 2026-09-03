/**
 * @file src/calculations/index.ts
 * @description Mathematical formulas: EMI amortization, lender FOIR multipliers,
 * borrower surplus ceilings, and RBI-style APR calculations.
 * 
 * Strict architectural rule: Pure mathematical functions live here without UI dependencies.
 */

export {
  calculateReducingEMI,
  calculatePrincipalFromEMI,
  calculateIndicativeAPR,
  calculateTenureTradeoffs,
} from './emi';

export type { CalculatedTenureTradeoff } from './emi';
