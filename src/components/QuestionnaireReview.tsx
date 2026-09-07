/**
 * @file src/components/QuestionnaireReview.tsx
 * @description Review step screen rendering the borrower profile summary,
 * dynamic predictive confidence breakdown, and quick-jump edit buttons.
 */

import React from 'react';
import { QuestionnaireAnswers } from '../questionnaire/types';
import { evaluateQuestionnaireConfidence } from '../questionnaire/confidenceModel';
import { formatINR } from '../utils/formatters';
import {
  ShieldCheck,
  Edit3,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface QuestionnaireReviewProps {
  answers: QuestionnaireAnswers;
  onEditStep: (stepId: string) => void;
  onSubmit: () => void;
}

export const QuestionnaireReview: React.FC<QuestionnaireReviewProps> = ({
  answers,
  onEditStep,
  onSubmit,
}) => {
  const confidence = evaluateQuestionnaireConfidence(answers);

  // Formatting helpers
  const formatPurpose = (p?: string) => {
    if (!p) return 'Not specified';
    return p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatEmployment = (e?: string) => {
    if (!e) return 'Not specified';
    const map: Record<string, string> = {
      salaried_corporate: 'Salaried (Tier-1 Corporate / MNC)',
      salaried_regular: 'Salaried (Regular SME / Private)',
      self_employed_business: 'Self-Employed (Business / Merchant)',
      self_employed_professional: 'Self-Employed (Professional)',
      informal_or_gig: 'Informal / Freelance / Gig Worker',
    };
    return map[e] || e;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-bold uppercase">
            Step 9 • Final Review
          </span>
          <span className="text-xs text-slate-400">• Ready for rules assessment</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Review Your Profile
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Verify your inputs below. You can edit any answer before generating your safe borrowing recommendation.
        </p>
      </div>

      {/* Dynamic Confidence Assessment Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confidence.level === 'high'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : confidence.level === 'moderate'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Assessment Confidence
              </span>
              <h3 className="text-lg font-bold text-slate-900 capitalize">
                {confidence.level} Confidence ({confidence.score}%)
              </h3>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider ${
              confidence.level === 'high'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : confidence.level === 'moderate'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {confidence.level}
          </span>
        </div>

        {/* Dynamic Context Summary */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-medium">
          &ldquo;{confidence.summary}&rdquo;
        </p>

        {/* Known vs Missing Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-900 block mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Factors ({confidence.knownFactors.length})
            </span>
            <ul className="space-y-1 text-emerald-800">
              {confidence.knownFactors.map((f, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-emerald-500">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
            <span className="font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Unverified / Missing ({confidence.missingFactors.length})
            </span>
            {confidence.missingFactors.length > 0 ? (
              <ul className="space-y-1 text-amber-800">
                {confidence.missingFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-amber-700 italic">None. All inputs fully captured.</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="space-y-4">
        {/* Card 1: Loan Goal */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Loan Goal</h4>
            </div>
            <button
              type="button"
              id="btn-edit-loan-goal"
              onClick={() => onEditStep('loan_goal')}
              className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Amount Wanted</span>
              <strong className="text-slate-900 text-sm font-mono">
                {formatINR(answers.amountRequested || 0)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Purpose</span>
              <strong className="text-slate-900 font-medium">{formatPurpose(answers.purpose)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Loan Product</span>
              <strong className="text-slate-900 font-medium">
                {answers.loanType ? answers.loanType.replace(/_/g, ' ') : 'Unspecified'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Preferred Tenure</span>
              <strong className="text-slate-900 font-mono">
                {answers.tenureWantedMonths ? `${answers.tenureWantedMonths} Months` : '36 Months'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Borrower & Income Profile */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Income & Profile</h4>
            </div>
            <button
              type="button"
              id="btn-edit-income"
              onClick={() => onEditStep('income_details')}
              className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Net Monthly Income</span>
              <strong className="text-slate-900 text-sm font-mono">
                {formatINR(answers.monthlyNetIncome || 0)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Employment Type</span>
              <strong className="text-slate-900 font-medium">{formatEmployment(answers.employmentType)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Income Stability</span>
              <strong className="text-slate-900 font-medium capitalize">
                {answers.incomeStability ? answers.incomeStability.replace('_', ' ') : 'Standard'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Borrower Age</span>
              <strong className="text-slate-900 font-mono">{answers.age || 29} Years</strong>
            </div>
          </div>

          {/* Conditional extra rows */}
          {(answers.spouseIncome || answers.documentedAnnualIncome || answers.lowestMonthlyIncome) && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {answers.spouseIncome ? (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Co-Applicant Income</span>
                  <strong className="text-slate-900 font-mono">{formatINR(answers.spouseIncome)}/mo</strong>
                </div>
              ) : null}
              {answers.documentedAnnualIncome ? (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Documented ITR</span>
                  <strong className="text-slate-900 font-mono">{formatINR(answers.documentedAnnualIncome)}/yr</strong>
                </div>
              ) : null}
              {answers.lowestMonthlyIncome ? (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Lean Month Floor</span>
                  <strong className="text-slate-900 font-mono">{formatINR(answers.lowestMonthlyIncome)}/mo</strong>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Card 3: Debt & Living Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Debt & Expenses</h4>
            </div>
            <button
              type="button"
              id="btn-edit-obligations"
              onClick={() => onEditStep('existing_obligations')}
              className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Existing Monthly EMIs</span>
              <strong className="text-slate-900 text-sm font-mono">
                {formatINR(answers.existingMonthlyEMIs || 0)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Household Expenses</span>
              <strong className="text-slate-900 text-sm font-mono">
                {formatINR(answers.householdExpenses || 0)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Credit Score</span>
              <strong className="text-slate-900 font-mono">
                {answers.creditScoreKnown && answers.creditScore ? answers.creditScore : 'Unknown (Unverified)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono">Repayment Record</span>
              <strong
                className={`font-semibold ${
                  answers.hasBounce ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {answers.hasBounce ? 'Recent Bounce Reported' : 'Clean (No Bounces)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Collateral & Lender Offers (if present) */}
        {(answers.hasCollateral || answers.quotedRate || answers.expectedAdditionalIncome) && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900">Collateral & Quote</h4>
              </div>
              <button
                type="button"
                id="btn-edit-collateral"
                onClick={() => onEditStep('loan_specific_collateral')}
                className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              {answers.hasCollateral && (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Collateral Asset</span>
                  <strong className="text-slate-900">
                    {answers.collateralType ? answers.collateralType.replace('_', ' ') : 'Pledged Asset'} (
                    {formatINR(answers.collateralValue || 0)})
                  </strong>
                </div>
              )}
              {answers.expectedAdditionalIncome && (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Expected Extra Income</span>
                  <strong className="text-emerald-700 font-mono">
                    +{formatINR(answers.expectedAdditionalIncome)}/mo
                  </strong>
                </div>
              )}
              {answers.quotedRate && (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-mono">Lender Quoted Rate</span>
                  <strong className="text-amber-700 font-mono">{answers.quotedRate}% p.a.</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submission Card */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="text-lg font-bold">Ready to run your borrowing assessment?</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            We will calculate your safe borrowing limit, fair interest rate band, and bank sanction estimate.
          </p>
        </div>
        <button
          type="button"
          id="btn-submit-assessment"
          onClick={onSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-all cursor-pointer shadow-sm shrink-0"
        >
          <span>See my borrowing assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
