import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
} from 'lucide-react';
import { DebtRehabilitationPlan } from '../rules/debtRoadmap';

interface DebtRehabilitationRoadmapCardProps {
  plan: DebtRehabilitationPlan;
  className?: string;
}

export const DebtRehabilitationRoadmapCard: React.FC<DebtRehabilitationRoadmapCardProps> = ({
  plan,
  className = '',
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  if (!plan.shouldDisplay) {
    return null;
  }

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  return (
    <div
      id="debt-rehabilitation-roadmap"
      className={`rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4 pb-4 border-b border-amber-200">
        <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PATHWAY TO FINANCIAL STABILITY</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
            {plan.headline}
          </h3>
          <p className="text-sm font-medium text-slate-700 mt-1 leading-relaxed">
            {plan.supportiveMessage}
          </p>
        </div>
      </div>

      {plan.isProductiveGoalDistressed && plan.productiveGoalGuidance && (
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Note on Productive Asset Purchase:</span>
            <p className="leading-relaxed">{plan.productiveGoalGuidance}</p>
          </div>
        </div>
      )}

      {plan.distressSignals.length > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-white/90 border border-amber-200 text-xs">
          <span className="font-bold text-slate-800 block mb-1.5">
            Key cash-flow pressures identified in your profile:
          </span>
          <ul className="space-y-1">
            {plan.distressSignals.map((signal, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Your 5-Step Action Plan
        </h4>

        {plan.steps.map((step) => {
          const isCurrentExpanded = expandedStep === step.stepNumber;
          const urgencyColor =
            step.urgency === 'critical'
              ? 'border-rose-200 bg-rose-50/50 text-rose-800'
              : step.urgency === 'high'
              ? 'border-amber-200 bg-amber-50/50 text-amber-800'
              : 'border-slate-200 bg-slate-50/70 text-slate-700';

          return (
            <div
              key={step.stepNumber}
              id={`roadmap-step-${step.stepNumber}`}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isCurrentExpanded ? 'border-amber-400 bg-white shadow-xs' : 'border-slate-200 bg-white/80'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStep(step.stepNumber)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                aria-expanded={isCurrentExpanded}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {step.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {step.headline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${urgencyColor}`}>
                    {step.urgency.toUpperCase()}
                  </span>
                  {isCurrentExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isCurrentExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-700 space-y-3">
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-amber-950 font-medium">
                    {step.keyReason}
                  </div>

                  <ul className="space-y-2">
                    {step.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-amber-200/80 flex items-start gap-2 text-[11px] text-slate-600 italic">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>{plan.disclaimer}</span>
      </div>
    </div>
  );
};
