/**
 * @file src/components/QuestionCard.tsx
 * @description Card component rendering an individual adaptive question.
 * Follows the clean, high-contrast fintech aesthetic with clear labels,
 * helper context, Indian currency formatting, and explicit unknown state handling.
 */

import React from 'react';
import {
  QuestionDefinition,
  QuestionOption,
  QuestionnaireAnswers,
} from '../questionnaire/types';
import { formatINR } from '../utils/formatters';
import { HelpCircle, AlertCircle, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionDefinition;
  value: any;
  answers: QuestionnaireAnswers;
  error?: string;
  onChange: (questionId: string, value: any) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  value,
  answers,
  error,
  onChange,
}) => {
  // Format labels for affected outputs
  const outputLabels: Record<string, string> = {
    borrowerSafeAmount: 'Safe Amount',
    emiCeiling: 'EMI Ceiling',
    lenderLikelySanction: 'Lender Sanction',
    fairRateBand: 'Interest Rate',
    allInAPR: 'All-In APR',
    stressCase: 'Stress Test',
    verdict: 'Borrow Verdict',
    confidence: 'Confidence',
  };

  return (
    <div
      id={`question-card-${question.id}`}
      className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all ${
        error
          ? 'border-rose-300 ring-2 ring-rose-100'
          : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Header & Meta */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {question.isMust ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold tracking-wider uppercase">
              Core
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold tracking-wider uppercase inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Adaptive
            </span>
          )}
          {question.required && (
            <span className="text-rose-500 text-xs font-bold" title="Required">*</span>
          )}
        </div>

        {/* Affected outputs tag */}
        {question.affects && question.affects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono">Affects:</span>
            {question.affects.slice(0, 3).map((aff) => (
              <span
                key={aff}
                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-medium"
              >
                {outputLabels[aff] || aff}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Question Title & Description */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 leading-snug tracking-tight">
        {question.text}
      </h3>
      {question.description && (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
          {question.description}
        </p>
      )}

      {/* Control Render */}
      <div className="mt-4">
        {/* Single Choice Radio Cards */}
        {question.type === 'single_choice' && question.options && (
          <div className="grid grid-cols-1 gap-2.5">
            {question.options.map((opt: QuestionOption) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  id={`opt-${question.id}-${String(opt.value)}`}
                  onClick={() => onChange(question.id, opt.value)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                    </div>
                    {opt.sublabel && (
                      <p className="text-xs text-slate-500 mt-1 pl-6 leading-relaxed">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>
                  {opt.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {opt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Currency Input with Indian Formatting */}
        {question.type === 'currency' && (
          <div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono font-bold text-sm">
                ₹
              </div>
              <input
                id={`input-${question.id}`}
                type="text"
                inputMode="numeric"
                value={
                  value !== undefined && value !== null && !isNaN(Number(value))
                    ? Number(value).toLocaleString('en-IN')
                    : ''
                }
                placeholder={question.placeholder || '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  onChange(question.id, raw === '' ? undefined : Number(raw));
                }}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-base font-bold font-mono transition-all outline-none"
              />
            </div>
            {value !== undefined && value > 0 && (
              <div className="mt-1.5 text-xs text-slate-500 font-medium">
                Amount: <strong className="text-slate-900 font-mono">{formatINR(value)}</strong>
              </div>
            )}
            {question.allowUnknown && (
              <button
                type="button"
                id={`btn-unknown-${question.id}`}
                onClick={() => onChange(question.id, undefined)}
                className={`mt-2 text-xs font-mono font-medium underline cursor-pointer ${
                  value === undefined ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {question.unknownLabel || "I don't know / Not sure"}
              </button>
            )}
          </div>
        )}

        {/* Number Input */}
        {question.type === 'number' && (
          <div>
            <div className="relative rounded-xl shadow-xs">
              <input
                id={`input-${question.id}`}
                type="number"
                min={question.min}
                max={question.max}
                step={question.step || 1}
                value={value !== undefined && value !== null ? value : ''}
                placeholder={question.placeholder || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(question.id, val === '' ? undefined : Number(val));
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-base font-bold font-mono transition-all outline-none"
              />
            </div>
            {question.allowUnknown && (
              <button
                type="button"
                id={`btn-unknown-${question.id}`}
                onClick={() => onChange(question.id, undefined)}
                className={`mt-2 text-xs font-mono font-medium underline cursor-pointer ${
                  value === undefined ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {question.unknownLabel || "I don't know / Not sure"}
              </button>
            )}
          </div>
        )}

        {/* Yes / No High-Contrast Chips */}
        {question.type === 'yes_no' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: true, label: 'Yes' },
              { val: false, label: 'No' },
            ].map(({ val, label }) => {
              const isSelected = value === val;
              return (
                <button
                  key={label}
                  type="button"
                  id={`btn-yesno-${question.id}-${label.toLowerCase()}`}
                  onClick={() => onChange(question.id, val)}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-white bg-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Context Callout */}
      {question.helpText && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{question.helpText}</span>
        </div>
      )}
    </div>
  );
};
