/**
 * @file src/pages/NegotiationCardPage.tsx
 * @description Standalone Branch Negotiation Card Page.
 * One-page printable / mobile card to hold in front of a lender.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageId } from '../components/Header';
import { BorrowerInput } from '../types';
import { evaluateBorrowerRules } from '../rules';
import { PERSONA_INPUTS } from '../data';
import { NegotiationCard } from '../components/NegotiationCard';

interface NegotiationCardPageProps {
  onNavigate: (page: PageId) => void;
  activePersonaId?: string;
  onSelectPersona?: (personaId: string) => void;
  customInput?: BorrowerInput | null;
}

export const NegotiationCardPage: React.FC<NegotiationCardPageProps> = ({
  onNavigate,
  activePersonaId = 'priya',
  onSelectPersona,
  customInput,
}) => {
  const currentInput = customInput || PERSONA_INPUTS[activePersonaId] || PERSONA_INPUTS.priya;
  const assessment = evaluateBorrowerRules(currentInput);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="btn-back-to-results"
          onClick={() => onNavigate('results')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Results</span>
        </button>

        {/* Persona quick switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
          {(['priya', 'ravi', 'anita'] as const).map((pId) => {
            const isSelected = activePersonaId === pId && !customInput;
            return (
              <button
                key={pId}
                type="button"
                onClick={() => onSelectPersona && onSelectPersona(pId)}
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
      </div>

      {/* Standalone Artifact Container */}
      <NegotiationCard assessment={assessment} isStandalonePage={true} />
    </div>
  );
};

