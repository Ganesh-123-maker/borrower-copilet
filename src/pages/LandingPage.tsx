/**
 * @file src/pages/LandingPage.tsx
 * @description Landing page for Borrower Copilot.
 * Polished, high-clarity, typography-driven editorial design.
 */

import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Scale,
  ArrowRight,
  HelpCircle,
  TrendingDown,
  Percent,
  CalendarClock,
  UserCheck,
} from 'lucide-react';
import { PageId } from '../components/Header';
import { PRODUCT_COPY } from '../content/copy';
import { EVALUATION_PERSONAS } from '../data';
import { formatINR } from '../utils/formatters';

interface LandingPageProps {
  onStartAssessment: () => void;
  onSelectPersona?: (personaId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAssessment,
  onSelectPersona,
}) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Subtle Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono uppercase tracking-wider font-semibold mb-6">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Independent Borrower Self-Assessment</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] mb-6 text-balance">
            Know what you can <span className="text-indigo-600 font-semibold">safely</span> borrow before you talk to a lender.
          </h1>

          {/* Thesis / Lede */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mb-8">
            Every lender has an automated risk model designed to maximize loan sanction. You walk in
            blind, sign the first sanction letter, and learn years later that you overpaid on rate and
            stretched your family’s monthly cash flow.
          </p>

          {/* Primary CTA & Trust Signals */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
            <button
              id="cta-start-assessment"
              onClick={onStartAssessment}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-sm hover:shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
            >
              <span>Start assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm text-slate-500 font-mono">
              Takes ~3 minutes • 8 essential questions
            </span>
          </div>

          {/* Trust Guarantees Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-slate-200">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                <EyeOff className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">No login</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                No phone numbers, OTPs, or spam lead-generation calls.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">No bureau pull</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                CIBIL / Experian score is never queried or harmed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">Answers stay here</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Client-side only. Zero servers, databases, or tracking cookies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">Self-assessment</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Not a lender approval. An independent reality check.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Questions We Answer */}
      <section className="py-14 sm:py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
              Objective outputs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Four questions answered with cold mathematical honesty
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Q1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Output 01
                  </span>
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  Should I borrow?
                </h3>
                <p className="text-xs font-mono text-emerald-700 mb-3 uppercase tracking-wider font-semibold">
                  Borrow • Don&apos;t Borrow • Borrow Less
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A direct verdict with reasons. &ldquo;Don&apos;t borrow&rdquo; is a first-class citizen—triggered
                  when debt would induce a severe monthly cash-flow crunch or compound predatory rates.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Evaluates purpose vs. personal debt trap risk
              </div>
            </div>

            {/* Q2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Output 02
                  </span>
                  <TrendingDown className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  How much can I safely carry?
                </h3>
                <p className="text-xs font-mono text-indigo-700 mb-3 uppercase tracking-wider font-semibold">
                  Lender Sanction vs. Borrower-Safe Amount
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Lenders will sanction up to their statutory limit (e.g. 60% gross FOIR). We separate
                  what a bank will push from what you can safely pay without risking emergency default.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Separates bank appetite from your family buffer
              </div>
            </div>

            {/* Q3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Output 03
                  </span>
                  <Percent className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  What is a fair interest rate?
                </h3>
                <p className="text-xs font-mono text-indigo-700 mb-3 uppercase tracking-wider font-semibold">
                  Realistic Rate Band + RBI-style All-In APR
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Shows what interest rate you deserve, plus the true annualized cost including
                  upfront processing fees (1.5%–3.0%) and GST—so you can catch hidden lender charges.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Exposes flat rates vs. true reducing APR
              </div>
            </div>

            {/* Q4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    Output 04
                  </span>
                  <CalendarClock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  What EMI should I agree to?
                </h3>
                <p className="text-xs font-mono text-amber-700 mb-3 uppercase tracking-wider font-semibold">
                  Monthly Outflow Ceiling + Stress Test
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Calculates your non-negotiable monthly ceiling, maps tenure trade-offs, and simulates
                  a stress case: what happens to your repayment if income drops or interest rates climb.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Tested against adverse economic conditions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Negotiation Card Feature Highlight */}
      <section className="py-14 sm:py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-indigo-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-700/60 flex items-center justify-center text-indigo-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold block mb-0.5">
                    Deliverable Artifact
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    The Branch Negotiation Card
                  </h2>
                </div>
              </div>
              <span className="text-xs font-mono bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-700 w-fit">
                Hold up in front of the loan officer
              </span>
            </div>

            <p className="text-sm sm:text-base text-indigo-100 leading-relaxed mb-6">
              When a lender quotes 14% with 3% processing fee, your card tells you exactly what to say:
              <br />
              <span className="text-white font-semibold italic block mt-1">
                &ldquo;Fair rate for my verified MNC income and 780 CIBIL is 11.0%–12.25% p.a. Please cap processing fees at 1.0% + GST.&rdquo;
              </span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-200">
                <strong className="text-white block mb-1 text-sm font-semibold">Profile Leverage</strong>
                Direct points in your profile that justify prime rates and zero fee surcharges.
              </div>
              <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-200">
                <strong className="text-white block mb-1 text-sm font-semibold">Red Flags & Traps</strong>
                Warnings against mandatory bundled life insurance, flat-rate tricks, and prepayment penalties.
              </div>
              <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-200">
                <strong className="text-white block mb-1 text-sm font-semibold">Product Alternatives</strong>
                Identifies if you should switch to a lower-cost secured loan (LAP, gold, composite MSME).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Personas Preview */}
      <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
              Evaluator Benchmark Cases
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Designed for three diverse Indian borrowing realities
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From salaried tech professionals to self-employed shop owners and gig workers with multiple app loans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {EVALUATION_PERSONAS.map((persona) => (
              <div
                key={persona.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {persona.name}, {persona.age}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                      {persona.location}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 block mb-3">
                    {persona.employmentType}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {persona.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-mono text-[10px]">Requested:</span>
                  <span className="font-bold text-slate-900 block mb-3">
                    {persona.requestDescription}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectPersona && onSelectPersona(persona.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>View {persona.name}&apos;s Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action */}
          <div className="p-8 sm:p-10 rounded-2xl bg-slate-900 text-white text-center max-w-2xl mx-auto shadow-sm border border-slate-800">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight">
              Ready to check your borrowing boundaries?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
              Start with 8 fundamental questions. No tracking, completely private to your browser.
            </p>
            <button
              id="cta-bottom-start"
              onClick={onStartAssessment}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
            >
              <span>Begin Self-Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
