# Borrower Copilot — Baseline

## Repository
Repository:
https://github.com/Ganesh-123-maker/borrower-copilot

## Existing Stack

Framework: React 19
Language: TypeScript (ES2022)
Build tool: Vite 6
Styling: Tailwind CSS v4
Testing: Custom validation harness in `src/tests` (No testing framework configured in root)

## Existing Structure

Important directories/files:
- `src/components/`: Reusable UI components (Header, Footer, QuestionCard, NegotiationCard, QuestionnaireReview)
- `src/pages/`: Primary application views
- `src/rules/`: Underwriting policies & threshold boundaries (confidence, config, negotiation, normalization, pipeline)
- `src/calculations/`: Financial logic and math (emi, index)
- `src/data/`: Benchmark rate cards and test personas
- `src/tests/`: Unit testing and sanity validation harness
- `README.md`: Project description and commands
- `RULES.md`: Core rules and logic documentation
- `index.html`: Entry HTML file
- **MISSING**: `package.json`, `tsconfig.json`, `vite.config.ts`, and other root configuration files.

## Existing Pages

1. `LandingPage.tsx`: Editorial landing page & overview.
2. `QuestionnairePage.tsx`: Adaptive multi-step questionnaire shell.
3. `ResultsPage.tsx`: Core outputs & scenario simulation.
4. `NegotiationCardPage.tsx`: Branch negotiation card sheet.

## Existing Components

Important reusable components:
- `Header.tsx`
- `Footer.tsx`
- `QuestionCard.tsx`
- `QuestionnaireReview.tsx`
- `NegotiationCard.tsx`

## Existing Financial Logic

Existing financial logic files are placed in:
- Rules: `src/rules/` (`confidence.ts`, `config.ts`, `negotiation.ts`, `normalization.ts`, `pipeline.ts`)
- Calculations: `src/calculations/` (`emi.ts`, `index.ts`)

*Note: According to the README, the actual lending calculations and financial rules are deliberately NOT implemented yet in this phase. The files exist but serve as structural stubs or are incomplete.*

## Existing Questionnaire

The `QuestionnairePage.tsx` currently exists as an adaptive multi-step form (a two-tier questionnaire shell) that tracks real-time progress and has a review step. It supports single question changes, advancing steps with validation, and loads persona presets (Priya, Ravi, Anita).

## Existing Results Page

The `ResultsPage.tsx` exists as a routing target to display the 4 core outputs and scenario simulation. It processes the `BorrowerInput` and presents the final assessment outputs.

## Existing Negotiation Card

The `NegotiationCardPage.tsx` exists as a standalone printable/mobile page containing the `NegotiationCard` component. It renders a structured summary to be used in branch discussions, drawing from the evaluated rules and current persona inputs.

## Existing Tests

Existing tests are located in `src/tests/index.ts`, which appears to be a custom validation harness rather than standard Jest/Vitest tests.

## Validation

Lint:
FAIL (No `package.json` to execute `npm run lint`)

Typecheck:
FAIL (No `package.json` to execute `npm run typecheck`)

Build:
FAIL (No `package.json` to execute `npm run build`)

Tests:
NOT AVAILABLE (No `package.json` test script)

Development server:
FAIL (No `package.json` to execute `npm run dev`)

## Current Phase

Project setup, clean architecture, responsive application shell, and routing between pages (Landing, Questionnaire, Results, Negotiation Card) are implemented.
Financial logic, calculations, and phase 2 features are currently NOT implemented.

## Risks

- **Missing Configuration Files**: The repository lacks `package.json`, `vite.config.ts`, `tsconfig.json`, and lock files in the root. This prevents any dependency installation, building, testing, or running of the application. This is a critical blocker for any subsequent phases unless resolved.
