/**
 * @file src/components/Header.tsx
 * @description Application navigation bar with clean branding and page routing.
 */

import React from 'react';

export type PageId = 'landing' | 'questionnaire' | 'results' | 'negotiation';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg tracking-tight shadow-sm transition-transform group-hover:scale-105">
            ₹
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight block leading-tight">
              Borrower Copilot
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider font-mono block">
              Affordability Engine & Self-Assessment
            </span>
          </div>
        </button>

        {/* Navigation items in sleek segmented pill container */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/70 text-xs sm:text-sm">
          <button
            id="nav-overview-btn"
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentPage === 'landing'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            Overview
          </button>

          <button
            id="nav-assessment-btn"
            onClick={() => onNavigate('questionnaire')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentPage === 'questionnaire'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            Assessment
          </button>

          <button
            id="nav-results-btn"
            onClick={() => onNavigate('results')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentPage === 'results'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            Results
          </button>

          <button
            id="nav-negotiation-btn"
            onClick={() => onNavigate('negotiation')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentPage === 'negotiation'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            Negotiation Card
          </button>
        </nav>
      </div>
    </header>
  );
};
