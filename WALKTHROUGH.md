# Borrower Copilot — Five-Minute Walkthrough

> **A Borrower-First Affordability & Underwriting Intelligence Engine**
> Built for Indian retail borrowers navigating retail banks, NBFCs, and digital loan apps.

---

## 1. Problem

In the Indian credit market, lenders hold an overwhelming information advantage. Commercial credit models are optimized for institutional profit: maximizing loan sanctions, fee extraction, and credit utilization. Borrowers walk into bank branches or open instant loan apps with three dangerous vulnerabilities:

1. **The Maximum Sanction Trap:** Lenders approve loan amounts based on institutional loss tolerance (often allowing 55%–60% of gross salary to be consumed by debt), encouraging borrowers to take far more credit than their actual household budget can safely sustain.
2. **Hidden Pricing & Flat-Rate Deception:** Lenders quote "flat" interest rates (e.g., *"just 8% flat"*), obscuring the reality that the true reducing-balance APR is nearly double (~14.5%–15.0%), while layering on processing fees, insurance premiums, and 18% GST.
3. **Information Asymmetry at the Negotiation Desk:** Borrowers lack objective benchmarks to know what interest rate is fair for their risk profile, what EMI ceiling they can afford under an income shock, and how to negotiate terms before signing.

**Borrower Copilot** reverses this asymmetry. It is an independent, 100% client-side decision-support tool that calculates what a borrower can *safely carry* before they speak to a lender.

---

## 2. User Journey

The borrower follows a seamless, private five-step journey:

```text
[ 1. Landing Page ]
        ↓ (Zero login, zero bureau pull, 100% privacy assurance)
[ 2. Core Questionnaire ] (~10 essential cash flow and profile inputs)
        ↓
[ 3. Adaptive Branching ] (Tailored follow-ups based on employment, collateral & debt)
        ↓
[ 4. Results & Underwriting Assessment ] (The 4 Core Outputs + Scenario Stress Test)
        ↓
[ 5. Branch Negotiation Card ] (Single-screen summary with verbatim scripts for lender meetings)
```

1. **Landing Page:** Introduces the core premise, provides immediate access to test personas (Priya, Ravi, Anita), and states transparent privacy assurances (no phone numbers, no PAN, no tracking).
2. **Questionnaire:** Captures baseline loan objectives, income, existing debt commitments, living expenses, and credit standing across clean, focused steps.
3. **Adaptive Branching:** Questions automatically adapt. Salaried borrowers see corporate stability questions; business owners see vintage and collateral fields; informal workers see income variability and digital app loan prompts.
4. **Results Page:** Instantly renders the Four Core Outputs (O1–O4), accompanied by visual confidence indicators, tenure trade-off tables, and a 20% income contraction stress test.
5. **Negotiation Card:** Synthesizes the analysis into a portable single-screen summary with fair rate benchmarks, walk-away conditions, questions to ask, and exact word-for-word scripts to use with loan officers.

---

## 3. The Four Core Outputs

Borrower Copilot delivers four authoritative answers:

### O1: Should I Borrow? (The Verdict)
- **Three Clear Outcomes:**
  - `borrow`: The loan purpose is productive or necessary, existing debt is manageable, and cash flow comfortably accommodates the obligation.
  - `borrow_less`: The borrower qualifies for credit, but borrowing the full requested amount for discretionary purposes (e.g., weddings, lifestyle) would over-leverage monthly cash flow. The engine recommends a downsized, safe principal cap.
  - `dont_borrow`: Current cash flow is over-leveraged, active repayment bounces exist, or high-cost predatory app debt is present. Adding new debt risks a compound default trap.
- **Explainable Reasoning:** Accompanied by a transparent narrative explaining *why* the verdict was reached based on the borrower's specific income and expenses.

### O2: How Much Am I Really Eligible For? (Lender Sanction vs. Borrower-Safe)
The application displays two distinct numbers side-by-side:
- **Lender-Likely Sanction Amount:** The maximum credit commercial banks or NBFCs will approve using institutional FOIR limits (50%–60%).
- **Borrower-Safe Amount:** The maximum principal the borrower can carry without compromising essential living expenses, emergency savings, or household resilience (prudent 35%–45% FOIR).
- **Direct Guidance:** Clearly instructs the borrower which number to use: *"Use the borrower-safe amount of ₹X rather than the lender maximum of ₹Y."*

### O3: What is a Fair Rate? (Fair Rate Band & All-In APR)
- **Fair Rate Band:** An objective benchmark range (e.g., `10.5% – 12.0% p.a.`) determined by credit standing, employment category, and collateral security. The app explicitly notes this is an indicative market benchmark, not a guaranteed credit sanction.
- **All-In APR:** Transparently calculates the true annualized borrowing cost by factoring in upfront processing fees (quoted or benchmarked at 1.0%–2.5%) plus **statutory 18% GST** on financial charges under the Indian tax code.

### O4: What EMI Should I Agree To? (Safe EMI Ceiling & Stress Testing)
- **Safe Monthly EMI Ceiling:** The non-negotiable monthly outflow cap that preserves essential living costs and an unallocated cash buffer.
- **Tenure Trade-Offs:** Displays 24, 36, 48, 60, and 84-month amortization schedules side-by-side, revealing how longer tenures decrease monthly EMI but drastically inflate lifetime interest.
- **Hypothetical Stress Test Scenario:** Models what happens if household take-home income drops by 20%, showing whether the proposed EMI remains safe or breaches solvency.

---

## 4. Adaptive Questionnaire & Epistemic Honesty

### Must-Answer Questions vs. Adaptive Follow-Ups
The questionnaire balances thorough underwriting with user ease by separating questions into two distinct layers:
- **~10 Must-Answer Questions:** Essential underwriting data points (Loan Purpose, Loan Type, Principal Requested, Age, Employment Type, Monthly Take-Home Income, Income Stability, Existing Monthly EMIs, Credit Score Status, Household Living Costs).
- **Adaptive Follow-Ups:** Dynamic fields triggered by user context:
  - *Salaried:* Prompts for employer vintage and variable compensation.
  - *Self-Employed / Business:* Prompts for annual ITR profits, business vintage, and unencumbered collateral value.
  - *Informal / Gig Workers:* Prompts for lean-month earnings, number of income platforms, active mobile loan apps, and recent NACH/ECS auto-debit bounces.

### The Epistemic Uncertainty Axiom
```text
LESS INFORMATION  →  WIDER RANGE  →  LOWER CONFIDENCE
MORE INFORMATION  →  NARROWER RANGE  →  HIGHER CONFIDENCE
```

- **Unknown != Zero:** When a borrower selects *"I don't know my credit score"*, the engine never coerces it to `0` or `300`. It treats the score as strictly unverified, automatically widens the fair rate band by 1.5%–3.0%, and lowers confidence.
- **Living Expense Imputation:** When expenses are unstated, the engine does not assume ₹0; it imputes a realistic 45% living cost floor to prevent unsafe loan sanctions.
- **Granular Confidence Modeling:** Evaluates 7 independent dimensions (Verdict, Lender Sanction, Borrower-Safe Amount, Fair Rate, APR, EMI Ceiling, Stress Test), explicitly declaring known factors vs. missing factors to the user.

---

## 5. Financial Reasoning & Core Invariants

The financial engine operates through a strictly decoupled 12-step unidirectional pipeline (`src/rules/pipeline.ts`) governed by core invariants:

1. **Borrower-Safe FOIR (35%) vs. Bank FOIR (50%–60%):** Standard bank underwriting permits debt service to consume up to 60% of take-home pay. Borrower Copilot enforces a conservative 35% safe ceiling for discretionary loans and 45% for productive MSME loans, ensuring that essential living expenses are never compromised.
2. **True Amortization Math:** All loan repayments use true reducing-balance actuarial formulas:
   $$\text{EMI} = P \cdot r \cdot \frac{(1 + r)^n}{(1 + r)^n - 1}$$
3. **Statutory Tax Compounding:** All upfront processing fees incorporate India's statutory 18% GST (e.g., a 1.0% processing fee carries an effective fee load of 1.18% on principal).
4. **Stress Scenario Formulation:** Modeled strictly as a hypothetical adverse scenario:
   $$\text{Stressed Surplus} = (\text{Income} \times 0.80) - \text{Household Expenses} - \text{Existing EMIs}$$
   If the proposed new EMI exceeds this stressed surplus, the scenario flags an alert.

---

## 6. The Branch Negotiation Card

The **Negotiation Card** (`src/components/NegotiationCard.tsx`) is a purpose-built, single-screen battle card designed for the borrower to reference or display during discussions with loan officers.

- **Borrower Stance:** States the borrower's strategic posture (e.g., *"Downsize borrowing scope"*, *"Leverage commercial collateral"*).
- **Target Rate Band & Max Tolerable Rate:** Establishes the fair rate range and the walk-away rate ceiling.
- **Safe EMI Cap:** A bold, non-negotiable monthly payment limit.
- **Fee Limits:** Caps processing fees at fair market rates (1.0%–1.5% maximum).
- **Leverage Points:** Bullet points highlighting the borrower's strengths (e.g., Tier-1 employer, clean 6-month repayment record, unencumbered property).
- **Red Flags & Walkaway Conditions:** Specific lender tactics that trigger immediate walkaway (e.g., mandatory bundled insurance, flat-rate quotes without APR disclosures, prepayment lock-in penalties).
- **Verbatim Negotiation Script:** Word-for-word opening statement for the borrower to initiate discussions with composure and authority.

---

## 7. Additional Built Features

### Flat Rate vs. Reducing Balance Converter (`FlatRateConverterCard.tsx`)
- **Purpose:** Indian retail lenders frequently advertise "flat rates" (e.g., *"Flat 8% interest!"*), misleading borrowers into believing the loan is inexpensive.
- **Functionality:** Implements root-finding bisection algorithms (`src/calculations/flatRateConverter.ts`) to compute the exact effective reducing APR corresponding to any flat quote.
- **Impact:** Demonstrates side-by-side that an 8.0% flat loan over 36 months is actually a **14.54% reducing APR**, revealing the hidden interest premium in real time.

### Debt Rehabilitation Roadmap (`DebtRehabilitationRoadmapCard.tsx`)
- **Purpose:** When a borrower receives a `dont_borrow` verdict due to active debt distress (e.g., Anita's profile), traditional lending systems simply reject them. Borrower Copilot provides a constructive, empathetic recovery path.
- **Functionality:** Evaluates distress signals (active bounces, predatory instant apps, zero debt capacity) and renders an actionable **5-Step Stabilization Plan**:
  1. *Stop Adding Expensive Debt:* Freeze digital loan app borrowing.
  2. *Stabilize Repayments:* Clear overdue auto-debits to stop CIBIL score damage.
  3. *Debt Avalanche Strategy:* Pay off high-interest app debt first to free up monthly cash flow.
  4. *Build Cash-Flow Buffer:* Save 1–2 months of living expenses.
  5. *Reassess Readiness:* Return to the copilot in 4–6 months to apply for formal priority micro-credit (PM MUDRA).

---

## 8. Summary of Three Persona Outcomes

| Metric | Priya (Corporate Salaried) | Ravi (MSME Business Owner) | Anita (Gig / Informal Worker) |
| :--- | :--- | :--- | :--- |
| **Profile** | ₹1.1L/mo salary, 780 CIBIL | ₹78k/mo business, Unknown CIBIL | ₹28k/mo gig income, 590 CIBIL |
| **Loan Goal** | ₹8L for Wedding (36m) | ₹15L for Expansion (84m) | ₹1.5L for Delivery Bike (24m) |
| **Verdict (O1)** | **`borrow_less`** | **`borrow`** | **`dont_borrow`** |
| **Lender Sanction (O2)**| ₹14.0L – ₹15.5L | ₹15.0L – ₹22.5L (Secured) | ₹40k – ₹1.0L (Predatory) |
| **Borrower Safe (O2)** | **₹4.5L – ₹5.0L** | **₹12.0L – ₹15.0L** | **₹0 (Zero)** |
| **Fair Rate Band (O3)**| 10.50% – 12.00% p.a. | 9.25% – 10.75% p.a. | 14.00% – 18.00% p.a. (Benchmark) |
| **All-In APR (O3)** | 11.68% – 14.95% | 10.43% – 13.70% | 15.18% – 20.95% |
| **Safe EMI Ceiling (O4)**| ₹24,500 / month | ₹35,100 / month | ₹2,125 / month |
| **Suggested Tenure** | 36 Months (EMI: ₹16,429) | 84 Months (EMI: ₹24,902) | None (Debt Stabilization) |
| **Confidence** | High (93%) | Moderate (76%) | Indicative (58%) |
| **Core Intervention** | Prevents wedding over-borrowing | Unlocks low secured LAP rates | Activates 5-Step Recovery Plan |

---

## 9. What I Would Build Next

1. **Key Fact Statement (KFS) OCR & Sanction Letter Scanner:** An automated client-side camera/PDF scanner that parses the RBI-mandated Key Fact Statement to instantly extract quoted interest rates, processing fees, penal charges, and APR without manual data entry.
2. **Offline-First WhatsApp / Wallet Export:** A feature allowing borrowers to generate a compact, offline-accessible image or PDF of their Negotiation Card to keep on their phone during in-person branch negotiations.
3. **Multi-Lender Quote Comparison Matrix:** A side-by-side comparison engine allowing borrowers to input competing quotes from up to 3 banks/NBFCs, standardizing them into true All-In APR to highlight the best offer.
4. **Indic Language Localization (Bhashini Integration):** Full translation of the questionnaire and negotiation scripts into Indian languages (Hindi, Kannada, Marathi, Tamil, Bengali) to empower rural, informal, and gig borrowers across India.

---

## 10. What I Would Cut

1. **Lender Lead-Generation & Affiliate Referrals:** I would deliberately avoid adding "Apply Now" buttons or referral partnerships with banks. Commercial commissions create conflicts of interest that destroy borrower trust.
2. **Automated Bureau Hard Pulls (PAN / Aadhaar):** I would avoid integrating direct credit bureau API pulls that leave hard inquiry marks on the borrower's record or require collecting sensitive national identity numbers.
3. **Complex Wealth & Investment Portfolios:** I would deliberately exclude investment tracking, mutual fund SIPs, or general personal finance management to keep the product laser-focused on the single borrowing decision.
4. **Gamified Credit Badges:** I would avoid adding arbitrary credit scores or badges that trivialize serious debt decisions.

---

## 11. Limitations & Complete Honesty

To maintain complete integrity, the application explicitly states what it does **not** do:

- **No Official Bureau Inquiry:** The tool does not connect to CIBIL, Experian, CRIF High Mark, or Equifax. It creates zero hard inquiry footprints on your credit report.
- **No Loan Approval or Sanction Guarantee:** The application is an independent decision-support tool. It does not issue credit approvals, pre-sanction letters, or loan guarantees.
- **Zero Server-Side Data Storage:** All calculations execute 100% in the user's browser memory. No names, incomes, debts, or financial figures are transmitted to or stored on any server or database.
- **Dependence on Honest Self-Reporting:** The accuracy of the borrower-safe limits, rate bands, and verdicts depends directly on the truthfulness and completeness of the numbers entered by the borrower.
- **Educational Decision-Support Only:** Outputs represent mathematical underwriting benchmarks, not personalized legal, tax, or certified financial advice.
