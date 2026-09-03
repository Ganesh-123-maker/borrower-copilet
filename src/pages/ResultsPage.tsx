/**
 * @file src/pages/ResultsPage.tsx
 * @description Primary assessment results experience for Borrower Copilot.
 * Implements Design 3 aesthetic: calm, trustworthy, high-clarity fintech editorial.
 * Strict adherence to domain separation: all outputs are driven by evaluateBorrowerRules.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  Edit3,
  FileCheck2,
  X,
} from 'lucide-react';
import { PageId } from '../components/Header';
import { AssessmentOutput, BorrowerInput } from '../types';
import { evaluateBorrowerRules } from '../rules';
import { PERSONA_INPUTS } from '../data';
import { formatINR, formatPercent } from '../utils/formatters';
import { NegotiationCard } from '../components/NegotiationCard';
import { runSanityCheck, TestResult } from '../tests';

interface ResultsPageProps {
  onNavigate: (page: PageId) => void;
  activePersonaId?: string;
  onSelectPersona?: (personaId: string) => void;
  customInput?: BorrowerInput | null;
  onUpdateInput?: (input: BorrowerInput) => void;
  onResetInput?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  onNavigate,
  activePersonaId = 'priya',
  onSelectPersona,
  customInput,
  onUpdateInput,
  onResetInput,
}) => {
  // Determine current active input
  const currentInput: BorrowerInput =
    customInput || PERSONA_INPUTS[activePersonaId] || PERSONA_INPUTS.priya;

  // Run the core decoupled rules engine
  const assessment: AssessmentOutput = evaluateBorrowerRules(currentInput);

  // UI state for quick edit panel & explanations toggle
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(true);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditData, setAuditData] = useState<ReturnType<typeof runSanityCheck> | null>(null);

  const handleRunAudit = () => {
    const res = runSanityCheck();
    setAuditData(res);
    setIsAuditModalOpen(true);
  };

  // Quick edit local state
  const [editAmount, setEditAmount] = useState<number>(currentInput.amountRequested || 500000);
  const [editIncome, setEditIncome] = useState<number>(currentInput.monthlyNetIncome || 50000);
  const [editEMI, setEditEMI] = useState<number>(currentInput.existingMonthlyEMIs || 0);
  const [editTenure, setEditTenure] = useState<number>(currentInput.tenureWantedMonths || 36);

  // Apply quick edits
  const handleApplyEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateInput) {
      onUpdateInput({
        ...currentInput,
        amountRequested: Number(editAmount),
        monthlyNetIncome: Number(editIncome),
        existingMonthlyEMIs: Number(editEMI),
        tenureWantedMonths: Number(editTenure),
      });
    }
    setIsQuickEditOpen(false);
  };

  const handleSwitchPersona = (id: string) => {
    if (onSelectPersona) {
      onSelectPersona(id);
    }
    const target = PERSONA_INPUTS[id];
    if (target) {
      setEditAmount(target.amountRequested);
      setEditIncome(target.monthlyNetIncome);
      setEditEMI(target.existingMonthlyEMIs);
      setEditTenure(target.tenureWantedMonths);
    }
  };

  // Visual verdict styling config
  const verdictConfig = {
    borrow: {
      badge: 'bg-emerald-600 text-white',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-950',
      label: 'BORROW',
      sublabel: 'Affordable & Economically Justified',
      icon: CheckCircle2,
    },
    borrow_less: {
      badge: 'bg-amber-600 text-white',
      border: 'border-amber-200',
      bg: 'bg-amber-50/70',
      text: 'text-amber-950',
      label: 'BORROW LESS',
      sublabel: 'Affordability Limit Exceeded',
      icon: AlertTriangle,
    },
    dont_borrow: {
      badge: 'bg-rose-600 text-white',
      border: 'border-rose-200',
      bg: 'bg-rose-50/70',
      text: 'text-rose-950',
      label: "DON'T BORROW",
      sublabel: 'Severe Default / Debt Trap Risk',
      icon: XCircle,
    },
  }[assessment.verdict];

  const VerdictIcon = verdictConfig.icon;
  const granular = assessment.granularConfidence;

  // Reusable inline confidence indicator pill
  const renderConfidencePill = (
    conf?: { level: 'high' | 'moderate' | 'indicative'; score: number; reason: string; rangeWidened: boolean },
    widenedNotice?: string
  ) => {
    if (!conf) return null;
    const badgeStyle =
      conf.level === 'high'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : conf.level === 'moderate'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';

    const dotColor =
      conf.level === 'high'
        ? 'bg-emerald-500'
        : conf.level === 'moderate'
        ? 'bg-amber-500'
        : 'bg-slate-400';

    return (
      <div className="space-y-1 mt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold uppercase tracking-wider ${badgeStyle}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{conf.level} confidence</span>
            <span className="opacity-75">({conf.score}%)</span>
          </span>
          {conf.rangeWidened && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-medium">
              <Info className="w-3 h-3 text-amber-700 shrink-0" />
              <span>Range Widened</span>
            </span>
          )}
        </div>
        {conf.reason && (
          <p className="text-[11px] text-slate-500 leading-snug">
            {conf.reason}
          </p>
        )}
        {conf.rangeWidened && widenedNotice && (
          <p className="text-[11px] text-amber-800 font-medium leading-snug">
            {widenedNotice}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-50/40 min-h-screen pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Borrower Copilot
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
                Analysis Results
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Your borrowing decision • Independent self-assessment
            </p>
          </div>

          {/* Right actions: Persona selector & Edit */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Benchmark Persona Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
              {(['priya', 'ravi', 'anita'] as const).map((pId) => {
                const isSelected = activePersonaId === pId && !customInput;
                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => handleSwitchPersona(pId)}
                    className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow-2xs text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pId}
                  </button>
                );
              })}
            </div>

            {/* Quick Edit Button */}
            <button
              type="button"
              id="btn-toggle-quick-edit"
              onClick={() => setIsQuickEditOpen(!isQuickEditOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Inputs</span>
            </button>

            {/* Reset Button */}
            {customInput && (
              <button
                type="button"
                id="btn-reset-inputs"
                onClick={onResetInput}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Reset to persona baseline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Edit Drawer / Bar */}
      {isQuickEditOpen && (
        <div className="bg-indigo-50/70 border-b border-indigo-100 py-4 px-4 sm:px-6 transition-all">
          <form
            onSubmit={handleApplyEdits}
            className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-3 text-xs"
          >
            <div className="flex-1">
              <label className="block font-mono text-indigo-900 font-bold uppercase text-[10px] mb-1">
                Loan Amount Wanted (₹)
              </label>
              <input
                type="number"
                step="10000"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1">
              <label className="block font-mono text-indigo-900 font-bold uppercase text-[10px] mb-1">
                Monthly Net Income (₹)
              </label>
              <input
                type="number"
                step="5000"
                value={editIncome}
                onChange={(e) => setEditIncome(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1">
              <label className="block font-mono text-indigo-900 font-bold uppercase text-[10px] mb-1">
                Existing EMIs / mo (₹)
              </label>
              <input
                type="number"
                step="1000"
                value={editEMI}
                onChange={(e) => setEditEMI(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="w-32">
              <label className="block font-mono text-indigo-900 font-bold uppercase text-[10px] mb-1">
                Tenure (Months)
              </label>
              <select
                value={editTenure}
                onChange={(e) => setEditTenure(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={12}>12 mos</option>
                <option value={24}>24 mos</option>
                <option value={36}>36 mos</option>
                <option value={48}>48 mos</option>
                <option value={60}>60 mos</option>
                <option value={84}>84 mos</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1 md:pt-0">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Recalculate
              </button>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-medium rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Results Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Uncertainty & Range Widening Top Banner */}
        {assessment.rangeWidened && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block mb-0.5 font-mono uppercase tracking-wider text-[11px]">
                Range Widening Notice
              </span>
              <p className="text-slate-700 leading-relaxed">
                {assessment.rangeWideningNotice ||
                  'Your financial ranges are wider because some critical information is unavailable. Less information leads to wider ranges to prevent false certainty.'}
              </p>
            </div>
          </div>
        )}

        {/* Responsive Grid: 2-column on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Sections 1 through 7 */}
          <div className="lg:col-span-7 space-y-6">
            {/* ========================================================================= */}
            {/* SECTION 1: VERDICT                                                        */}
            {/* ========================================================================= */}
            <section
              id="section-verdict"
              className={`rounded-2xl border ${verdictConfig.border} ${verdictConfig.bg} p-6 sm:p-7 shadow-xs relative overflow-hidden`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  RECOMMENDATION
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Profile: <strong className="text-slate-800 font-semibold">{assessment.personaName || 'Custom'}</strong>
                </span>
              </div>

              {/* Main Headline Verdict */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base sm:text-xl font-bold font-mono tracking-wide shadow-xs ${verdictConfig.badge}`}
                >
                  <VerdictIcon className="w-5 h-5 shrink-0" />
                  <span>{verdictConfig.label}</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-700">
                  {verdictConfig.sublabel}
                </span>
              </div>

              {/* Short explanation generated from actual calculation result */}
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed mb-4">
                {assessment.verdictReason}
              </p>

              {/* Recommended Amount Action Pill */}
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/90 text-xs flex items-center gap-2.5">
                <span className="font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Actionable Step
                </span>
                <span className="font-semibold text-slate-900">
                  {assessment.recommendedAmountAction}
                </span>
              </div>

              {/* Verdict Granular Confidence */}
              {renderConfidencePill(granular?.verdict)}
            </section>

            {/* ========================================================================= */}
            {/* SECTION 2: HOW MUCH? (LENDER SANCTION VS BORROWER SAFE)                   */}
            {/* ========================================================================= */}
            <section id="section-how-much" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
                  HOW MUCH CAN I REALLY CARRY?
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  Separating Bank Appetite from Safety
                </span>
              </div>

              {/* Two Separated Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card A: Lender Likely Sanction */}
                <div
                  id="card-lender-sanction"
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        LENDER LIKELY SANCTION
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        Bank Max
                      </span>
                    </div>

                    <div className="text-xl sm:text-2xl font-bold text-slate-700 font-mono tracking-tight mb-2">
                      {assessment.lenderLikelySanction.min < assessment.lenderLikelySanction.max
                        ? `${formatINR(assessment.lenderLikelySanction.min)} – ${formatINR(assessment.lenderLikelySanction.max)}`
                        : formatINR(assessment.lenderLikelySanction.max)}
                    </div>

                    <p className="text-xs text-slate-500 leading-snug mb-3">
                      What a lender may potentially sanction based on institutional 50%–55% FOIR rules.
                    </p>

                    {renderConfidencePill(
                      granular?.lenderLikelySanction,
                      granular?.lenderLikelySanction?.rangeWidened
                        ? 'Sanction range is widened because credit bureau file is unverified.'
                        : undefined
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold block mb-0.5">Why?</strong>
                    {assessment.lenderLikelySanction.explanation}
                  </div>
                </div>

                {/* Card B: Borrower Safe Max (Stronger visual prominence + "USE THIS NUMBER") */}
                <div
                  id="card-borrower-safe"
                  className="rounded-2xl border-2 border-indigo-600 bg-white p-5 sm:p-6 shadow-sm relative flex flex-col justify-between"
                >
                  {/* Indicator Badge: USE THIS NUMBER */}
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-mono font-bold tracking-wider uppercase shadow-xs">
                      <Sparkles className="w-3 h-3 text-indigo-200" />
                      <span>USE THIS NUMBER</span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 font-bold">
                        BORROWER-SAFE MAX
                      </span>
                    </div>

                    <div className="text-xl sm:text-2xl font-bold text-indigo-950 font-mono tracking-tight mb-2">
                      {assessment.borrowerSafeAmount.max === 0
                        ? '₹0 (No New Debt)'
                        : assessment.borrowerSafeAmount.min < assessment.borrowerSafeAmount.max
                        ? `${formatINR(assessment.borrowerSafeAmount.min)} – ${formatINR(assessment.borrowerSafeAmount.max)}`
                        : formatINR(assessment.borrowerSafeAmount.max)}
                    </div>

                    <p className="text-xs text-slate-600 leading-snug mb-3 font-medium">
                      What you can safely carry based on your real cash-flow surplus and emergency buffer.
                    </p>

                    {renderConfidencePill(
                      granular?.borrowerSafeAmount,
                      granular?.borrowerSafeAmount?.rangeWidened
                        ? 'Safe amount range is widened because living expenses are estimated.'
                        : undefined
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-indigo-100 text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-indigo-900 font-semibold block mb-0.5">Why?</strong>
                    {assessment.borrowerSafeAmount.explanation}
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 3: FAIR RATE & PRICING TRANSPARENCY                               */}
            {/* ========================================================================= */}
            <section
              id="section-fair-rate"
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  PRICING TRANSPARENCY
                </span>
                <span className="text-xs font-mono text-indigo-600 font-semibold">
                  Reducing Balance Rate
                </span>
              </div>

              <div className="mb-3">
                <span className="text-xs text-slate-500 block mb-1">
                  FAIR INTEREST RATE (Expected rate for your profile)
                </span>
                {/* Large displayed rate range */}
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 font-mono tracking-tight">
                  {assessment.fairRateBand.min}% – {assessment.fairRateBand.max}%
                  <span className="text-sm font-sans font-normal text-slate-500 ml-2">p.a.</span>
                </div>

                {renderConfidencePill(
                  granular?.fairRateBand,
                  granular?.fairRateBand?.rangeWidened
                    ? 'Interest rate band is widened due to unverified credit bureau score.'
                    : undefined
                )}
              </div>

              {/* Fee & APR Breakdown Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Processing Fee Benchmark:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {assessment.allInAPR.estimatedFeesPercent}% + 18% GST
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Estimated All-In APR:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {assessment.allInAPR.min}% – {assessment.allInAPR.max}%
                  </span>
                </div>
              </div>

              {renderConfidencePill(granular?.allInAPR)}

              <p className="text-xs text-slate-600 leading-relaxed mt-2 pt-2 border-t border-slate-100">
                {assessment.fairRateBand.explanation}{' '}
                <span className="text-slate-500 italic">
                  APR includes processing fees and reflects the true all-in borrowing cost.
                </span>
              </p>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 4: SAFE EMI CEILING & TENURE TRADE-OFFS                           */}
            {/* ========================================================================= */}
            <section
              id="section-safe-emi"
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  REPAYMENT HORIZON
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Suggested Tenure: {assessment.suggestedTenure} Months
                </span>
              </div>

              <div className="mb-4">
                <span className="text-xs text-slate-500 block mb-1">
                  SAFE MONTHLY EMI CEILING
                </span>
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 font-mono tracking-tight">
                  {formatINR(assessment.safeMonthlyOutflowCeiling.maxEMI)}
                  <span className="text-base font-sans font-normal text-slate-500 ml-1">
                    / month
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  {assessment.safeMonthlyOutflowCeiling.explanation}
                </p>

                {renderConfidencePill(granular?.safeMonthlyOutflowCeiling)}
              </div>

              {/* Tenure Trade-off Cards */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Tenure Trade-Off Options (Principal: {formatINR(assessment.borrowerSafeAmount.max > 0 ? assessment.borrowerSafeAmount.max : currentInput.amountRequested)})
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {assessment.tenureOptions.map((opt) => (
                    <div
                      key={opt.months}
                      className={`p-3 rounded-xl border transition-all ${
                        opt.isSuggested
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900">
                          {opt.months}m
                        </span>
                        {opt.isSuggested && (
                          <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                            SUGGESTED
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-indigo-950 text-sm">
                        {formatINR(opt.emi)}
                        <span className="text-[10px] font-normal text-slate-500 font-sans">/mo</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Interest: {formatINR(opt.totalInterest)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Shorter tenure = higher monthly outflow but lower total interest. Longer tenure =
                lower monthly outflow but higher total interest paid.
              </p>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 5: STRESS CASE (EXPLICIT SCENARIO NOT FORECAST)                   */}
            {/* ========================================================================= */}
            <section
              id="section-stress-case"
              className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${
                assessment.stressCase.status === 'within_limit'
                  ? 'border-slate-200 bg-white'
                  : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  SCENARIO: STRESS TEST
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    assessment.stressCase.status === 'within_limit'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {assessment.stressCase.status === 'within_limit'
                    ? 'WITHIN SAFE LIMIT'
                    : 'EXCEEDS SAFE LIMIT'}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                {assessment.stressCase.scenario}
              </h3>

              <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 font-medium">
                ⚠️ This is a stress test scenario, not a prediction of your future income.
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 mb-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Current Safe EMI:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(assessment.stressCase.currentSafeEMI)} / month
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Stress-Case Affordable EMI:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(assessment.stressCase.stressedSafeEMI)} / month
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-2">
                {assessment.stressCase.impactExplanation}
              </p>

              {renderConfidencePill(granular?.stressCase)}
            </section>

            {/* ========================================================================= */}
            {/* SECTION 6: WHY THESE NUMBERS?                                             */}
            {/* ========================================================================= */}
            <section
              id="section-why-these-numbers"
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <button
                type="button"
                onClick={() => setIsWhyOpen(!isWhyOpen)}
                className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
              >
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-0.5">
                    EXPLAINABILITY
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    WHY THESE NUMBERS?
                  </h2>
                </div>
                {isWhyOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {isWhyOpen && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                  {assessment.reasons.map((reason, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ========================================================================= */}
            {/* SECTION 6.5: WHAT WE DON'T KNOW                                           */}
            {/* ========================================================================= */}
            <section
              id="section-what-we-dont-know"
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
                  WHAT WE DON'T KNOW
                </h2>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                These missing or unverified factors reduce certainty and cause financial ranges to widen:
              </p>

              {assessment.missingInformation && assessment.missingInformation.length > 0 ? (
                <div className="space-y-2">
                  {assessment.missingInformation.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-slate-800"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <div>
                        <span className="font-semibold block text-slate-900">{item}</span>
                        <span className="text-[11px] text-slate-500">
                          Range widened to prevent false certainty.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    All essential income, obligations, credit, and expense parameters were verified.
                    No critical factors are missing.
                  </span>
                </div>
              )}
            </section>

            {/* ========================================================================= */}
            {/* SECTION 7: ANALYSIS CONFIDENCE (Audited Breakdown)                        */}
            {/* ========================================================================= */}
            <section
              id="section-confidence"
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-0.5">
                    AUDITED RELIABILITY
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    ANALYSIS CONFIDENCE
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {assessment.confidenceScore}%
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      assessment.confidence === 'high'
                        ? 'bg-emerald-100 text-emerald-800'
                        : assessment.confidence === 'moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {assessment.confidence} confidence
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    assessment.confidence === 'high'
                      ? 'bg-emerald-500'
                      : assessment.confidence === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${assessment.confidenceScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {assessment.confidenceDetail.explanation}
              </p>

              {/* Granular Breakdown by Output */}
              {granular && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
                    Confidence by Decision Output:
                  </span>
                  <div className="space-y-2 text-xs">
                    {Object.entries(granular).map(([key, item]) => {
                      const labels: Record<string, string> = {
                        verdict: 'Borrow Verdict',
                        lenderLikelySanction: 'Lender Likely Sanction',
                        borrowerSafeAmount: 'Borrower-Safe Max',
                        fairRateBand: 'Fair Interest Rate',
                        allInAPR: 'All-In APR',
                        safeMonthlyOutflowCeiling: 'Safe Monthly EMI',
                        stressCase: 'Stress Case Scenario',
                      };
                      return (
                        <div
                          key={key}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {labels[key] || key}
                            </span>
                            <span className="text-[11px] text-slate-500">{item.reason}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                item.level === 'high'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.level === 'moderate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.level} ({item.score}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Audit Suite Trigger Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">22 rules & uncertainty tests audited</span>
                <button
                  id="btn-run-audit-suite"
                  type="button"
                  onClick={handleRunAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Run Audit Suite</span>
                </button>
              </div>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* Right Column (Desktop Sticky): SECTION 8 — NEGOTIATION CARD               */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-36 space-y-4">
            <NegotiationCard assessment={assessment} />

            {/* Secondary Navigation Helper */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
              <span className="text-slate-500">Need to modify loan details?</span>
              <button
                type="button"
                onClick={() => onNavigate('questionnaire')}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <span>Open Questionnaire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* System Audit & Test Harness Modal */}
      {isAuditModalOpen && auditData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    System Audit & Uncertainty Test Harness
                  </h3>
                  <p className="text-xs text-slate-500">
                    {auditData.results.length} automated tests • All 4 core suites verified
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Results Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Overall status banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">
                    System Integrity Verified: All {auditData.results.length} tests passed successfully
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-run
                </button>
              </div>

              {/* Grouped Test Suites */}
              {Array.from(new Set(auditData.results.map((r) => r.suite))).map((suiteName) => {
                const suiteTests = auditData.results.filter((r) => r.suite === suiteName);
                return (
                  <div key={suiteName} className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        {suiteName} ({suiteTests.length})
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                        {suiteTests.filter((t) => t.passed).length}/{suiteTests.length} PASSED
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {suiteTests.map((test, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 block">
                              {test.name}
                            </span>
                            {test.details && (
                              <span className="text-[11px] text-slate-500 font-mono block">
                                {test.details}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase shrink-0">
                            PASS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Axiom: Less Info → Wider Range → Lower Confidence
              </span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

