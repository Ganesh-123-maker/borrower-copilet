/**
 * @file src/App.tsx
 * @description Borrower Copilot - Application Shell and Page Router.
 * Architecture Note: Client-side routing with separation of presentation & domain logic.
 */

import React, { useState, useEffect } from 'react';
import { Header, PageId } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { ResultsPage } from './pages/ResultsPage';
import { NegotiationCardPage } from './pages/NegotiationCardPage';
import { BorrowerInput } from './types';
import { PERSONA_INPUTS } from './data';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('landing');
  const [activePersonaId, setActivePersonaId] = useState<string>('priya');
  const [customInput, setCustomInput] = useState<BorrowerInput | null>(null);

  // Handle URL hash routing if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (['landing', 'questionnaire', 'results', 'negotiation'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPersona = (personaId: string) => {
    setActivePersonaId(personaId);
    setCustomInput(null);
  };

  const handleUpdateInput = (updated: BorrowerInput) => {
    setCustomInput(updated);
  };

  const handleResetInput = () => {
    setCustomInput(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Universal App Header */}
      <Header currentPage={currentPage} onNavigate={navigateTo} />

      {/* Main Page Canvas */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onStartAssessment={() => navigateTo('questionnaire')}
            onSelectPersona={(personaId) => {
              handleSelectPersona(personaId);
              navigateTo('results');
            }}
          />
        )}

        {currentPage === 'questionnaire' && (
          <QuestionnairePage
            onNavigate={navigateTo}
            initialPersonaId={activePersonaId}
            onComplete={(input) => {
              handleUpdateInput(input);
              navigateTo('results');
            }}
          />
        )}

        {currentPage === 'results' && (
          <ResultsPage
            onNavigate={navigateTo}
            activePersonaId={activePersonaId}
            onSelectPersona={handleSelectPersona}
            customInput={customInput}
            onUpdateInput={handleUpdateInput}
            onResetInput={handleResetInput}
          />
        )}

        {currentPage === 'negotiation' && (
          <NegotiationCardPage
            onNavigate={navigateTo}
            activePersonaId={activePersonaId}
            onSelectPersona={handleSelectPersona}
            customInput={customInput}
          />
        )}
      </main>

      {/* Universal Regulatory & Privacy Footer */}
      <Footer />
    </div>
  );
}

