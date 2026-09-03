/**
 * @file src/data/index.ts
 * @description Benchmark reference bands, standard product constants,
 * and test personas (Priya, Ravi, Anita).
 */

import type { BorrowerInput } from '../types';

export interface TestPersona {
  id: string;
  name: string;
  age: number;
  location: string;
  employmentType: string;
  summary: string;
  requestDescription: string;
  wantsAmount: number;
  purpose: string;
}

export const EVALUATION_PERSONAS: TestPersona[] = [
  {
    id: 'priya',
    name: 'Priya',
    age: 29,
    location: 'Bengaluru',
    employmentType: 'Salaried MNC Engineer (5 yrs)',
    summary: 'Net ₹1,10,000/mo. Car EMI ₹14,000 (2 yrs left). CIBIL 780. Rent ₹28,000.',
    requestDescription: 'Wants ₹8,00,000 personal loan for wedding.',
    wantsAmount: 800000,
    purpose: 'Wedding',
  },
  {
    id: 'ravi',
    name: 'Ravi',
    age: 42,
    location: 'Mysuru',
    employmentType: 'Self-employed Kirana Owner (14 yrs)',
    summary: 'Cash ₹40k-80k/mo, ITR ₹4,20,000/yr. Owns shop premises ₹45L unencumbered. No credit score. Wife earns ₹18,000.',
    requestDescription: 'Wants ₹15,00,000 for second stock line & delivery vehicle.',
    wantsAmount: 1500000,
    purpose: 'Stock & Vehicle',
  },
  {
    id: 'anita',
    name: 'Anita',
    age: 35,
    location: 'Hubballi',
    employmentType: 'Informal delivery rider & tailoring',
    summary: '₹26k-30k/mo. 2 kids, husband unemployed 8 mo. 3 app loans ₹35,000 at 30%+, 1 bounce last month.',
    requestDescription: 'Wants ₹1,50,000 for electric scooter to double delivery runs.',
    wantsAmount: 150000,
    purpose: 'Electric Scooter',
  },
];

export const PERSONA_INPUTS: Record<string, BorrowerInput> = {
  priya: {
    personaId: 'priya',
    name: 'Priya',
    age: 29,
    location: 'Bengaluru',
    employmentType: 'salaried_corporate',
    purpose: 'wedding_or_family_event',
    loanType: 'personal_loan',
    amountRequested: 800000,
    monthlyNetIncome: 110000,
    existingMonthlyEMIs: 14000, // Car EMI
    householdExpenses: 48000, // Rent 28k + living expenses 20k
    creditScoreKnown: true,
    creditScore: 780,
    hasCollateral: false,
    hasAppLoans: false,
    hasBounce: false,
    tenureWantedMonths: 36,
    emergencySavingsMonths: '6_plus_months',
    quotedRate: 11.25,
    quotedFee: 1.0,
  },
  ravi: {
    personaId: 'ravi',
    name: 'Ravi',
    age: 42,
    location: 'Mysuru',
    employmentType: 'self_employed_business',
    purpose: 'business_expansion',
    loanType: 'business_loan',
    amountRequested: 1500000,
    monthlyNetIncome: 60000, // Average monthly cash net
    spouseIncome: 18000,
    existingMonthlyEMIs: 0,
    householdExpenses: 32000,
    creditScoreKnown: false,
    creditScore: undefined,
    hasCollateral: true,
    collateralValue: 4500000, // Unencumbered commercial shop ₹45L
    collateralDescription: 'Commercial Kirana Shop premises (₹45L value, unencumbered)',
    hasAppLoans: false,
    hasBounce: false,
    tenureWantedMonths: 84, // or 60
  },
  anita: {
    personaId: 'anita',
    name: 'Anita',
    age: 35,
    location: 'Hubballi',
    employmentType: 'informal_or_gig',
    purpose: 'asset_purchase',
    loanType: 'vehicle_loan',
    amountRequested: 150000, // Electric scooter
    monthlyNetIncome: 28000,
    spouseIncome: 0, // Husband unemployed
    existingMonthlyEMIs: 7500, // 3 app loans (total ~₹35k)
    householdExpenses: 18000, // 2 kids school & family food
    creditScoreKnown: true,
    creditScore: 590, // Low due to recent bounce
    hasCollateral: false,
    hasAppLoans: true,
    hasBounce: true,
    tenureWantedMonths: 24,
  },
};

