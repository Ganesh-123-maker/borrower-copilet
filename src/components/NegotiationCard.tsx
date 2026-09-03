/**
 * @file src/components/NegotiationCard.tsx
 * @description Borrower-facing Negotiation Card and Lender-Offer Comparison component.
 * 
 * CORE PURPOSE:
 * Answers: "What should I ask the lender for?"
 * 
 * CORE DESIGN PRINCIPLES:
 *   - Polished document/card that a borrower can read quickly, screenshot, print, or hold up in a branch.
 *   - 100% driven by deterministic AssessmentOutput and pure negotiation rules engine.
 *   - No hardcoded numbers or secondary calculations inside the card component.
 *   - Three clean operational states: No offer, Active offer, Incomplete offer.
 *   - Multi-metric comparison view with semantic indicators (not color alone).
 *   - Borrower-first priorities: never recommends taking maximum bank sanction.
 *   - Mobile-first responsiveness and print-optimized stylesheet.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  Sliders,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import type {
  AssessmentOutput,
  ComparisonStatus,
  LenderOfferInput,
  MetricComparisonItem,
} from '../types';
import { formatINR } from '../utils/formatters';
import { generateNegotiationGuidance } from '../rules/negotiation';

interface NegotiationCardProps {
  assessment: AssessmentOutput;
  isStandalonePage?: boolean;
}

export const NegotiationCard: React.FC<NegotiationCardProps> = ({
  assessment,
  isStandalonePage = false,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [showInteractiveTester, setShowInteractiveTester] = useState(false);

  // Interactive tester local state (allows the borrower to test or adjust lender numbers directly)
  const initialOffer = assessment.borrowerInput?.lenderOffer || {};
  const [testOffer, setTestOffer] = useState<Partial<LenderOfferInput>>({
    hasOffer: initialOffer.hasOffer ?? Boolean(assessment.borrowerInput?.quotedRate),
    quotedAmount: initialOffer.quotedAmount ?? assessment.borrowerInput?.quotedAmount,
    quotedRate: initialOffer.quotedRate ?? assessment.borrowerInput?.quotedRate,
    quotedFee: initialOffer.quotedFee ?? assessment.borrowerInput?.quotedFee,
    quotedTenure: initialOffer.quotedTenure ?? assessment.borrowerInput?.quotedTenure,
    quotedEMI: initialOffer.quotedEMI ?? assessment.borrowerInput?.quotedEMI,
    quotedOtherCharges: initialOffer.quotedOtherCharges ?? assessment.borrowerInput?.quotedOtherCharges,
    isFeeUnknown: initialOffer.isFeeUnknown ?? false,
    isEMIUnknown: initialOffer.isEMIUnknown ?? false,
    isAmountUnknown: initialOffer.isAmountUnknown ?? false,
    isRateUnknown: initialOffer.isRateUnknown ?? false,
    isTenureUnknown: initialOffer.isTenureUnknown ?? false,
  });

  // Calculate live guidance using pure rules module
  const liveGuidance = generateNegotiationGuidance(assessment, testOffer);

  // Anchors from structured AssessmentOutput (Never hard-coded)
  const fairRateLow = assessment.fairRate?.low ?? assessment.fairRateBand.min;
  const fairRateHigh = assessment.fairRate?.high ?? assessment.fairRateBand.max;
  const aprLow = assessment.apr?.low ?? assessment.allInAPR.min;
  const aprHigh = assessment.apr?.high ?? assessment.allInAPR.max;
  const safeEMI = assessment.emi?.safeCeiling ?? assessment.safeMonthlyOutflowCeiling.maxEMI;
  const safeAmount = assessment.borrowerSafeAmount.max;
  const personaName = assessment.personaName || assessment.borrowerInput?.name || 'Borrower';

  // Copy negotiation script & points
  const handleCopyScript = () => {
    const text = `--- BORROWER COPILOT: NEGOTIATION CARD ---
Borrower: ${personaName}
My Safe Borrowing Limit: ₹${formatINR(safeAmount)}
My Safe EMI Ceiling: ₹${formatINR(safeEMI)}/month
My Fair Rate: ${fairRateLow}% – ${fairRateHigh}% p.a.
Estimated All-In APR: ${aprLow}% – ${aprHigh}%

WHAT I SHOULD ASK FOR:
${liveGuidance.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

QUESTIONS TO ASK THE LENDER:
${liveGuidance.questionsToAsk.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

TALKING SCRIPT:
${liveGuidance.script}

Note: Independent borrower self-assessment. Not lender approval or financial guarantee.`;

    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Semantic Status Badge Renderer
  const renderStatusBadge = (status: ComparisonStatus, label: string) => {
    switch (status) {
      case 'within_range':
      case 'within_safe_limit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
            ✓ {label}
          </span>
        );
      case 'above_range':
      case 'above_safe_limit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
            ▲ {label}
          </span>
        );
      case 'below_range':
      case 'below_safe_limit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">
            ▼ {label}
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
            ? {label}
          </span>
        );
    }
  };

  return (
    <div
      id="negotiation-card-container"
      className={`rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden ${
        isStandalonePage ? 'max-w-3xl mx-auto' : 'w-full'
      }`}
    >
      {/* Document Top Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 print:bg-white print:text-black print:p-4 print:border-b">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold print:text-slate-800">
              BORROWER COPILOT
            </span>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-xs font-mono text-slate-300 print:text-slate-600">
              {liveGuidance.cardState === 'no_offer'
                ? 'Your borrowing boundaries'
                : liveGuidance.cardState === 'incomplete_offer'
                ? 'Some lender costs are unknown.'
                : 'My boundaries vs lender offer'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-300 bg-slate-800 print:bg-slate-100 print:text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700 print:border-slate-300">
              {personaName}
            </span>
            {assessment.confidence === 'indicative' && (
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600 print:text-amber-800 print:bg-amber-50">
                Indicative (Credit unverified)
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black mb-1 font-display">
          NEGOTIATION CARD
        </h1>
        <p className="text-xs text-slate-300 print:text-slate-600 leading-relaxed max-w-xl">
          Actionable boundaries to reference during lender discussions. Shows what you should ask for,
          what to ask the lender, and your non-negotiable cash flow ceilings.
        </p>
      </div>

      {/* 4 Core Anchors Grid */}
      <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 print:bg-white print:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1. Safe Borrowing Limit */}
          <div
            id="anchor-safe-amount"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
                MY SAFE BORROWING LIMIT
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                ₹{formatINR(safeAmount)}
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block border-t border-slate-100 pt-1.5">
              Prudent principal limit
            </span>
          </div>

          {/* 2. Safe Monthly EMI */}
          <div
            id="anchor-safe-emi"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
                MY SAFE EMI CEILING
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                ₹{formatINR(safeEMI)}
                <span className="text-xs font-normal text-slate-500 font-sans">/mo</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block border-t border-slate-100 pt-1.5">
              Cash flow surplus limit
            </span>
          </div>

          {/* 3. Fair Rate */}
          <div
            id="anchor-fair-rate"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
                MY FAIR RATE
              </span>
              <div className="text-xl sm:text-2xl font-bold text-indigo-950 font-mono tracking-tight">
                {fairRateLow}% – {fairRateHigh}%
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block border-t border-slate-100 pt-1.5">
              Reducing balance p.a.
            </span>
          </div>

          {/* 4. All-in APR (Prominently highlighted) */}
          <div
            id="anchor-all-in-apr"
            className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-900 font-bold block">
                  ESTIMATED ALL-IN APR
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900 font-bold">
                  Key Metric
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-950 font-mono tracking-tight">
                {aprLow}% – {aprHigh}%
              </div>
            </div>
            <span className="text-[11px] text-indigo-900 mt-2 block border-t border-indigo-200/60 pt-1.5 font-medium">
              Rate + Fees + 18% GST
            </span>
          </div>
        </div>

        {/* APR Educational Banner */}
        <div className="mt-3.5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <strong>Compare APR, not just the headline interest rate.</strong> APR accounts for upfront
            processing fees and mandatory borrowing charges, revealing the true annualized borrowing cost.
          </p>
        </div>
      </div>

      {/* Priority Issue Banner */}
      <div className="px-5 py-3.5 sm:px-6 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 print:bg-white print:px-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
            TOP PRIORITY:
          </span>
          <span className="text-xs font-bold text-slate-900">
            {liveGuidance.primaryPriority}
          </span>
        </div>
      </div>

      {/* Comparison View Table (Active Offer or Incomplete Offer) */}
      {liveGuidance.hasOffer && (
        <div className="p-5 sm:p-6 border-b border-slate-200 print:p-4 print-avoid-break">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
              MY ASSESSMENT VS LENDER OFFER
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {liveGuidance.cardState === 'incomplete_offer'
                ? '⚠️ Incomplete Quote (Some fees unquoted)'
                : 'Active Quote Evaluation'}
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Metric</th>
                  <th className="py-2.5 px-3 font-semibold">My Assessment</th>
                  <th className="py-2.5 px-3 font-semibold">Lender Offer</th>
                  <th className="py-2.5 px-3 font-semibold">Status / Comparison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveGuidance.comparisons.map((row: MetricComparisonItem) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      row.isWarning ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 align-top">
                      <div>{row.metric}</div>
                      {row.id === 'apr' && (
                        <span className="text-[10px] font-mono text-indigo-600 block mt-0.5">
                          All-in Cost
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 align-top">
                      {row.myAssessment}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 align-top">
                      {row.lenderOffer}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="mb-1">
                        {renderStatusBadge(row.status, row.statusLabel)}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {row.explanation}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content: What I Should Ask For & What To Ask Lender */}
      <div className="p-5 sm:p-6 space-y-6 print:p-4 print-avoid-break">
        {/* Section A: What I Should Ask For (2–4 Concrete Points) */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
            <span>WHAT I SHOULD ASK FOR</span>
          </h3>

          <div className="space-y-2">
            {liveGuidance.points.map((point: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="font-medium text-slate-900">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: What To Ask The Lender (Exact Questions) */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>WHAT TO ASK THE LENDER</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {liveGuidance.questionsToAsk.map((q: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2 leading-relaxed"
              >
                <span className="text-indigo-600 font-bold font-mono">Q{idx + 1}.</span>
                <p className="font-medium">&ldquo;{q}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Borrower Talking Script */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-900 font-bold">
              VERBAL SCRIPT FOR BRANCH VISITS
            </span>
            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer print:hidden"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif italic">
            {liveGuidance.script}
          </p>
        </div>

        {/* Section D: Tenure Trade-Off Explanation */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 font-semibold block mb-0.5">
              Tenure Trade-Off Boundary:
            </strong>
            <span>
              Shorter tenure increases monthly EMI but reduces total interest. Longer tenure reduces monthly
              EMI but can increase total interest paid over time. Never lengthen tenure beyond your income visibility.
            </span>
          </div>
        </div>

        {/* Section E: Interactive Lender Offer / Quote Tester (Collapsible for branch testing) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 print:hidden">
          <button
            type="button"
            onClick={() => setShowInteractiveTester(!showInteractiveTester)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-900 cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>
                {testOffer.hasOffer
                  ? 'Update Lender Quote Details'
                  : 'Have a Lender Quote? Test It Here'}
              </span>
            </div>
            {showInteractiveTester ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showInteractiveTester && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-slate-800">
                  Do you have a lender quote?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTestOffer((prev) => ({ ...prev, hasOffer: true }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      testOffer.hasOffer
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestOffer((prev) => ({ ...prev, hasOffer: false }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      !testOffer.hasOffer
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {testOffer.hasOffer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Quoted Loan Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Quoted Amount (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedAmount: undefined,
                            isAmountUnknown: !prev.isAmountUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isAmountUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      disabled={testOffer.isAmountUnknown}
                      value={testOffer.quotedAmount ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedAmount: e.target.value ? Number(e.target.value) : undefined,
                          isAmountUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isAmountUnknown ? 'Unknown' : 'e.g. 500000'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Interest Rate (% p.a.)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedRate: undefined,
                            isRateUnknown: !prev.isRateUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isRateUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      disabled={testOffer.isRateUnknown}
                      value={testOffer.quotedRate ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedRate: e.target.value ? Number(e.target.value) : undefined,
                          isRateUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isRateUnknown ? 'Unknown' : 'e.g. 13.5'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Processing Fee */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Processing Fee (%)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedFee: undefined,
                            isFeeUnknown: !prev.isFeeUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isFeeUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      disabled={testOffer.isFeeUnknown}
                      value={testOffer.quotedFee ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedFee: e.target.value ? Number(e.target.value) : undefined,
                          isFeeUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isFeeUnknown ? 'Unknown' : 'e.g. 1.5'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Quoted Tenure */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Tenure (Months)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedTenure: undefined,
                            isTenureUnknown: !prev.isTenureUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isTenureUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      disabled={testOffer.isTenureUnknown}
                      value={testOffer.quotedTenure ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedTenure: e.target.value ? Number(e.target.value) : undefined,
                          isTenureUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isTenureUnknown ? 'Unknown' : 'e.g. 36'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Quoted Monthly EMI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Quoted Monthly EMI (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedEMI: undefined,
                            isEMIUnknown: !prev.isEMIUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isEMIUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      disabled={testOffer.isEMIUnknown}
                      value={testOffer.quotedEMI ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedEMI: e.target.value ? Number(e.target.value) : undefined,
                          isEMIUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isEMIUnknown ? 'Unknown' : 'e.g. 18500'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Other Charges */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-500 uppercase">
                        Other Mandatory Charges (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestOffer((prev) => ({
                            ...prev,
                            quotedOtherCharges: undefined,
                            isOtherChargesUnknown: !prev.isOtherChargesUnknown,
                          }))
                        }
                        className="text-[10px] text-indigo-600 underline cursor-pointer"
                      >
                        {testOffer.isOtherChargesUnknown ? 'Enter value' : "I don't know"}
                      </button>
                    </div>
                    <input
                      type="number"
                      disabled={testOffer.isOtherChargesUnknown}
                      value={testOffer.quotedOtherCharges ?? ''}
                      onChange={(e) =>
                        setTestOffer((prev) => ({
                          ...prev,
                          quotedOtherCharges: e.target.value ? Number(e.target.value) : undefined,
                          isOtherChargesUnknown: false,
                        }))
                      }
                      placeholder={testOffer.isOtherChargesUnknown ? 'Unknown' : 'e.g. 5000'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls: Print & Copy */}
        <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
          <button
            type="button"
            id="btn-copy-script"
            onClick={handleCopyScript}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {copiedScript ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Talking Points</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-print-negotiation-card"
            onClick={handlePrint}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Negotiation Card</span>
          </button>
        </div>

        {/* Mandatory Regulatory Disclaimer */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>Important:</strong> This assessment is a borrower self-assessment, not lender approval
            or a financial guarantee.
          </p>
        </div>
      </div>
    </div>
  );
};
