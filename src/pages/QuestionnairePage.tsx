/**
 * @file src/pages/QuestionnairePage.tsx
 * @description Adaptive multi-step Borrower Assessment questionnaire.
 * Renders declarative active questions based on condition predicates,
 * tracking real-time progress, clean state transitions, and review step.
 */

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { PageId } from '../components/Header';
import { BorrowerInput } from '../types';
import { PERSONA_INPUTS } from '../data';
import { QuestionnaireAnswers } from '../questionnaire/types';
import {
  getActiveQuestionsForStep,
  getActiveSteps,
  calculateStepProgress,
  validateStep,
  mapAnswersToBorrowerInput,
  mapBorrowerInputToAnswers,
  cleanIrrelevantAnswers,
} from '../questionnaire/questionVisibility';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionnaireReview } from '../components/QuestionnaireReview';

interface QuestionnairePageProps {
  onNavigate: (page: PageId) => void;
  initialPersonaId?: string;
  onSelectPersona?: (personaId: string) => void;
  customInput?: BorrowerInput | null;
  onComplete?: (input: BorrowerInput) => void;
}

const DEFAULT_BLANK_ANSWERS: QuestionnaireAnswers = {
  purpose: undefined,
  loanType: 'personal_loan',
  amountRequested: 500000,
  tenureWantedMonths: 36,
  age: 30,
  employmentType: 'salaried_corporate',
  monthlyNetIncome: 75000,
  incomeStability: 'very_stable',
  existingMonthlyEMIs: 0,
  householdExpenses: 30000,
  creditScoreKnown: true,
  creditScore: 750,
  hasCoapplicant: false,
  hasExistingLoans: false,
  hasBounce: false,
  hasLenderOffer: 'no',
};

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({
  onNavigate,
  initialPersonaId,
  onSelectPersona,
  customInput,
  onComplete,
}) => {
  // Initialize questionnaire with persona answers if provided, else blank defaults
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => {
    if (customInput) {
      return mapBorrowerInputToAnswers(customInput);
    }
    if (initialPersonaId && PERSONA_INPUTS[initialPersonaId]) {
      return mapBorrowerInputToAnswers(PERSONA_INPUTS[initialPersonaId]);
    }
    return DEFAULT_BLANK_ANSWERS;
  });

  const [currentStepId, setCurrentStepId] = useState<string>('loan_goal');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [maxStepIndexReached, setMaxStepIndexReached] = useState<number>(() => {
    if (customInput || (initialPersonaId && PERSONA_INPUTS[initialPersonaId])) {
      return 10;
    }
    return 0;
  });

  const activeSteps = getActiveSteps(answers);
  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStepId);
  const activeStep = activeSteps[currentStepIndex !== -1 ? currentStepIndex : 0];
  const progress = calculateStepProgress(activeStep.id, answers);

  const activeQuestions = getActiveQuestionsForStep(activeStep.id, answers);

  // Handle single question change
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: value,
      };
      // Clean invalid branches if employmentType, creditScoreKnown, or collateral changes
      return cleanIrrelevantAnswers(updated);
    });

    // Clear validation error if fixed
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Step advancement
  const handleNext = () => {
    // Validate current step
    const { valid, errors } = validateStep(activeStep.id, answers);
    if (!valid) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = activeSteps[nextIndex];
      setCurrentStepId(nextStep.id);
      if (nextIndex > maxStepIndexReached) {
        setMaxStepIndexReached(nextIndex);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step back
  const handleBack = () => {
    setValidationErrors({});
    if (currentStepIndex > 0) {
      const prevStep = activeSteps[currentStepIndex - 1];
      setCurrentStepId(prevStep.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('landing');
    }
  };

  // Jump to specific step from Review screen
  const handleJumpToStep = (stepId: string) => {
    setCurrentStepId(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Assessment submission
  const handleSubmit = () => {
    const finalInput = mapAnswersToBorrowerInput(answers);
    if (onComplete) {
      onComplete(finalInput);
    } else {
      onNavigate('results');
    }
  };

  // Persona quick preset loader
  const handleLoadPersona = (personaId: string) => {
    const input = PERSONA_INPUTS[personaId];
    if (input) {
      setAnswers(mapBorrowerInputToAnswers(input));
      setCurrentStepId('loan_goal');
      setMaxStepIndexReached(10);
      setValidationErrors({});
      onSelectPersona?.(personaId);
    }
  };

  const handleResetBlank = () => {
    setAnswers(DEFAULT_BLANK_ANSWERS);
    setCurrentStepId('loan_goal');
    setMaxStepIndexReached(0);
    setValidationErrors({});
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Action Bar & Persona Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          id="btn-back-to-landing"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{currentStepIndex === 0 ? 'Back to Overview' : 'Previous Step'}</span>
        </button>

        {/* Preset switcher for fast evaluator testing */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2">
            Load Persona:
          </span>
          <button
            type="button"
            id="btn-load-priya"
            onClick={() => handleLoadPersona('priya')}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            Priya
          </button>
          <button
            type="button"
            id="btn-load-ravi"
            onClick={() => handleLoadPersona('ravi')}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            Ravi
          </button>
          <button
            type="button"
            id="btn-load-anita"
            onClick={() => handleLoadPersona('anita')}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            Anita
          </button>
          <button
            type="button"
            id="btn-load-reset"
            onClick={handleResetBlank}
            title="Reset Form"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Adaptive Progress Indicator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs mb-8">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Assessment
            </span>
            <span className="text-xs font-mono font-semibold text-slate-600">
              Step {progress.currentStepNumber} of {progress.totalStepsCount}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {progress.percentage}% Complete
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Step Breadcrumbs (scrollable on mobile) */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar text-xs">
          {activeSteps.map((step, idx) => {
            const isPassed = idx <= maxStepIndexReached;
            const isCurrent = step.id === activeStep.id;
            return (
              <button
                key={step.id}
                type="button"
                id={`step-tab-${step.id}`}
                disabled={!isPassed}
                onClick={() => isPassed && setCurrentStepId(step.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] font-mono ${
                  isCurrent
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : isPassed
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                {step.number}. {step.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      {activeStep.id === 'review' ? (
        <QuestionnaireReview
          answers={answers}
          onEditStep={handleJumpToStep}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="space-y-6">
          {/* Step Header */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mb-1">
              Step {progress.currentStepNumber} • {activeStep.subtitle}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {activeStep.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeStep.description}
            </p>
          </div>

          {/* Active Questions Container */}
          <div className="space-y-5">
            {activeQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                value={(answers as any)[q.id]}
                answers={answers}
                error={validationErrors[q.id]}
                onChange={handleAnswerChange}
              />
            ))}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              id="btn-step-back"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              {maxStepIndexReached >= activeSteps.length - 1 && activeStep.id !== 'review' && (
                <button
                  type="button"
                  id="btn-return-to-review"
                  onClick={() => {
                    const { valid, errors } = validateStep(activeStep.id, answers);
                    if (!valid) {
                      setValidationErrors(errors);
                      return;
                    }
                    handleJumpToStep('review');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span>Return to Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                id="btn-step-continue"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>{currentStepIndex === activeSteps.length - 2 ? 'Review Answers' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
