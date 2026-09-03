# Borrower Copilot

> **Know what you can safely borrow before you talk to a lender.**
> A personal decision-support copilot for Indian retail borrowers.

---

## Overview

Every lender relies on internal credit risk models calibrated to maximize loan sanction and credit utilization. Borrowers walk into branches blind, sign sanction letters without understanding true all-in annualized costs, and often over-leverage their monthly household cash flows.

**Borrower Copilot** balances this information asymmetry through a private, client-side self-assessment that answers four critical questions before entering a negotiation:
1. **Should I borrow?** (Clear verdict: Borrow, Don't Borrow, or Borrow Less)
2. **How much can I safely carry?** (Lender Likely Sanction vs. Borrower-Safe Amount)
3. **What is a fair interest rate?** (Realistic rate bands + RBI-compliant All-In APR)
4. **What EMI should I agree to?** (Non-negotiable monthly ceiling + stress testing)

Plus, it generates a single-screen **Branch Negotiation Card** to hold up during loan discussions.

---

## Key Principles & Assurances

- **Zero Login**: No phone numbers, email collection, or sales leads.
- **Zero Bureau Enquiries**: CIBIL/Experian credit scores are never pinged or impacted.
- **100% Client-Side Privacy**: Data stays in browser memory; no backend database or tracking.
- **Strict Separation of Concerns**: Pure mathematical formulas and domain rules are completely decoupled from presentation components.

---

## Tech Stack

- **Framework**: React 19 + TypeScript (ES2022)
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS v4 (responsive, mobile-first design system)
- **Icons**: Lucide React
- **Runtime**: Standard Node.js environment, fully client-side operational

---

## Running Locally

To run Borrower Copilot locally:

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# The app will be available at http://localhost:3000 (or the port specified by Vite)
```

To build for production:

```bash
# 3. Type check and validate
npm run lint

# 4. Production build
npm run build
```

---

## Project Structure

```text
src/
├── components/          # Reusable UI elements (Header, Footer, Cards)
├── pages/               # Primary application views
│   ├── LandingPage.tsx          # Editorial landing page & overview
│   ├── QuestionnairePage.tsx    # Adaptive two-tier questionnaire shell
│   ├── ResultsPage.tsx          # 4 core outputs & scenario simulation
│   └── NegotiationCardPage.tsx  # Branch negotiation card sheet
├── rules/               # Underwriting policies & threshold boundaries (Decoupled)
├── calculations/        # Pure math: reducing balance EMI, APR, FOIR formulas
├── data/                # Benchmark rate cards and test personas (Priya, Ravi, Anita)
├── types/               # TypeScript domain contracts and interfaces
├── utils/               # Formatting utilities (INR currency, lakhs/crores notation)
├── content/             # Centralized copywriting, explanations, and trust copy
├── tests/               # Unit testing and sanity validation harness
├── App.tsx              # Application shell and client router
├── main.tsx             # Entry point
└── index.css            # Tailwind CSS and global typography definitions
```

---

## Current Status: Phase 1 (Project Setup & Shell)

> **Phase 1 Completion Notice:**
> - Project setup, clean architecture, and responsive application shell are complete.
> - **Lending calculations and financial rules are deliberately NOT implemented yet** to maintain clean progression into subsequent phases.
> - Landing page features full typography, value proposition, and trust guarantees.
> - Routing between Landing, Questionnaire, Results, and Negotiation Card is active.
