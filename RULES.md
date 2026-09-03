# Borrower Copilot — Lending Rules & Financial Architecture Specification

## 1. Executive Summary & Core Product Principle

Borrower Copilot is an objective, borrower-first affordability and underwriting intelligence engine. Unlike commercial loan applications designed to maximize credit disbursement and extraction, Borrower Copilot enforces mathematical and visual honesty to protect the borrower.

### The Fundamental Axiom
```
LESS INFORMATION
        ↓
WIDER RANGE
        ↓
LOWER CONFIDENCE

More reliable information
        ↓
NARROWER RANGE
        ↓
HIGHER CONFIDENCE
```

The application **never creates a false impression of certainty**. Where inputs are verified, estimates are tight; where inputs are estimated or unknown, ranges widen automatically and confidence scores degrade transparently.

---

## 2. Core Epistemic Directives

### 2.1 Unknown != Zero
- **Credit Score Integrity:** If a borrower indicates *"I don't know my credit score"*, the engine **strictly preserves this as undefined / unverified**. It is never coerced to `0`, `300`, or a default subprime tier.
  - Subprime borrowers (e.g., CIBIL 550) are priced at 16.0%–22.0% with severe risk flags.
  - Unknown credit borrowers are priced across an indicative market band of 11.5%–16.5% with explicit range widening notices.
- **Living Expenses Floor:** If household living expenses are unstated, they are not treated as ₹0. The engine estimates them using a conservative standard benchmark (45% of net income) and flags the safe borrowing amount as an estimated range with reduced confidence.
- **Existing Obligations:** Debt commitments must not be defaulted to zero without borrower confirmation.

### 2.2 Stress Case is a SCENARIO, Not a FORECAST
- The stress test is labeled strictly as a **hypothetical scenario simulation** (e.g., *"If monthly income drops by 20%..."*), never as a predictive economic forecast.
- Fixed non-negotiable outflows (living expenses, existing EMIs) are tested against reduced cash flows to establish true resilience.

### 2.3 Regulatory Honesty & Epistemic Attribution
- Product underwriting rules and FOIR limits must **never be masqueraded as RBI statutory mandates**.
- Every assumption is tagged explicitly:
  - `CHALLENGE_BRIEF`: Mandated by the problem specification.
  - `EXTERNAL_SOURCE`: Statutory law or tax code (e.g., 18% GST on financial services).
  - `MY_JUDGEMENT`: Prudent product heuristics and empirical retail underwriting standards.

---

## 3. The 12-Step Deterministic Rules Pipeline

The application processes borrower evaluations through an explicit 12-step unidirectional pipeline, implemented in `src/rules/pipeline.ts`:

```
USER INPUTS
    ↓
1. NORMALIZATION (epistemic quality classification: known, estimated, ranged, unknown)
    ↓
2. AFFORDABILITY ANALYSIS (net cash flows, essential overheads, FOIR ceiling)
    ↓
3. LENDER LIKELY SANCTION ESTIMATE (institutional bank eligibility estimate, NOT approval)
    ↓
4. BORROWER-SAFE AMOUNT (prudent cash flow protection, distinct from lender sanction)
    ↓
5. FAIR RATE BAND (strictly a range based on risk profile, never a single point)
    ↓
6. ALL-IN APR (nominal interest + processing fees + 18% statutory GST)
    ↓
7. EMI CALCULATIONS (reducing balance amortization at min, median, and max rates)
    ↓
8. TENURE TRADE-OFF (24, 36, 48, 60 month tradeoffs: monthly cash flow vs total interest)
    ↓
9. STRESS TEST (hypothetical 20% income contraction resilience test)
    ↓
10. VERDICT ENGINE (Borrow / Borrow Less / Don't Borrow)
    ↓
11. EXPLANATIONS ENGINE (deterministic causal narratives referencing actual figures)
    ↓
12. CONFIDENCE & UNCERTAINTY (composite & 7-model granular confidence scoring)
```

---

## 4. Master Financial Rules & Assumptions Registry

| Rule | Logic | Value | Why | Source |
| :--- | :--- | :--- | :--- | :--- |
| **Borrower-Safe Prudent FOIR** | `safeDebtCeiling = income * 0.35 - existingEMI` | **35%** | Leaves 65% of income for living costs, emergency savings, and unexpected contingencies. | `MY_JUDGEMENT` |
| **Productive Business FOIR** | `safeDebtCeiling = income * 0.45 - existingEMI` | **45%** | Productive business investments generate incremental revenue, justifying a moderately higher debt capacity. | `MY_JUDGEMENT` |
| **Standard Bank Retail FOIR** | `bankDebtCeiling = income * 0.50 - existingEMI` | **50%** | Standard retail bank underwriting limit for unsecured personal loans. | `MY_JUDGEMENT` |
| **Aggressive Corporate MNC FOIR** | `aggressiveCeiling = income * 0.60 - existingEMI` | **60%** | Banks aggressively stretch credit limits for high-income corporate salaried borrowers with 750+ CIBIL. | `MY_JUDGEMENT` |
| **Stressed Scenario FOIR Limit** | `stressedDebtLimit = stressedIncome * 0.40` | **40%** | Under economic shocks, debt payments exceeding 40% of contracted earnings risk imminent default. | `MY_JUDGEMENT` |
| **Residual Income Buffer** | `minFreeSurplus = surplus * 0.15` | **15%** | Minimum unallocated cash buffer required after all living costs and EMIs to prevent distress. | `MY_JUDGEMENT` |
| **Default Living Expense Ratio** | `imputedExpenses = netIncome * 0.45` | **45%** | When living expenses are omitted, imputes realistic essential costs rather than assuming ₹0. | `MY_JUDGEMENT` |
| **Secured LAP / MSME Rate Band** | Mortgage appraisal on unencumbered property | **9.25% – 10.75%** | Low credit risk backed by commercial/residential property with LTV <= 50%. | `MY_JUDGEMENT` |
| **Corporate Prime Personal Loan** | Salaried corporate Tier-1 with CIBIL >= 750 | **10.5% – 12.0%** | Prime retail banking rate band for verified top-tier salaried borrowers. | `MY_JUDGEMENT` |
| **Standard Salaried Personal Loan** | Regular salaried with CIBIL 700–749 | **11.5% – 13.5%** | Standard personal loan pricing for good credit profiles. | `MY_JUDGEMENT` |
| **Unverified Credit Rate Spread** | Credit score unstated / unknown | **11.5% – 16.5%** | Widened 5.0% spread reflecting uncertainty between prime banks and NBFC pricing. Unknown != 0. | `MY_JUDGEMENT` |
| **Subprime / Documented Bounce Band** | Verified CIBIL < 650 or recent bounce | **16.0% – 22.0%** | Severe risk premium charged by non-prime NBFCs following default history. | `MY_JUDGEMENT` |
| **Informal / Priority Sector Band** | Informal delivery / gig worker micro-credit | **14.0% – 18.0%** | Benchmark formal priority sector / PM Mudra lending rates, avoiding 30%+ instant apps. | `MY_JUDGEMENT` |
| **Default Processing Fee Benchmark** | Upfront fee as percentage of principal | **1.5%** | Empirical average for Indian commercial personal loans when exact quote is omitted. | `MY_JUDGEMENT` |
| **Statutory GST on Loan Fees** | GST levied on processing & penal fees | **18%** | Mandatory statutory Goods and Services Tax on banking and financial services in India. | `EXTERNAL_SOURCE` (CGST Act) |
| **Adverse Income Shock Scenario** | `stressedIncome = baseIncome * 0.80` | **-20%** | Challenge-mandated adverse scenario testing whether debt payments remain viable after a 20% income drop. | `CHALLENGE_BRIEF` |
| **Reducing Balance EMI Amortization** | $P \cdot r \cdot (1+r)^n / ((1+r)^n - 1)$ | Mathematical | Statutory standard amortization formula mandated by RBI for all retail loans. | `EXTERNAL_SOURCE` |

---

## 5. Range Widening Mathematical Specifications

| Output Metric | Complete / Verified Profile | Unknown / Estimated Profile | Widening Factor & Formula |
| :--- | :--- | :--- | :--- |
| **Fair Interest Rate** | 10.5% – 12.0% (Spread: **1.5%**) | 11.5% – 16.5% (Spread: **5.0%**) | Spread widens by **3.3x** when credit score is unknown. |
| **Borrower-Safe Max** | ₹4,50,000 – ₹5,00,000 (Min = **90%** of Max) | ₹4,03,500 – ₹5,93,500 (Min = **68%** of Max) | Lower floor drops from 90% to 68% of ceiling when expenses are estimated. |
| **Lender Likely Sanction** | ₹14,00,000 – ₹15,50,000 (Spread: **10%**) | ₹2,50,000 – ₹4,20,000 (Spread: **40%–50%**) | Wider band reflecting institutional lender variance on thin-file borrowers. |
| **All-In APR** | Exact APR calculated with quoted fee | Labeled as **"Estimated APR"** with fee range benchmark (1.0%–2.5%) | Flagged as range-widened when lender fee schedule is unquoted. |

---

## 6. Benchmark Persona Specifications & Audited Results

### Persona 1: Priya (Complete Prime Profile)
- **Profile:** Salaried MNC Engineer (₹1,10,000/mo net), Bengaluru, Car EMI ₹14,000, 780 CIBIL, Living expenses ₹48,000. Requested ₹8,00,000 for wedding.
- **Lender Likely Sanction:** ₹14,00,000 – ₹15,50,000 (Aggressive 55%–60% bank FOIR on Tier-1 salary).
- **Borrower-Safe Amount:** **₹5,00,000** (Prudent 35% FOIR; discretionary event with no cash return).
- **Verdict:** `borrow_less` (Recommendation: Cap borrowing at ₹5,00,000).
- **Analysis Confidence:** **93% (High)** — 0 missing factors.
- **Range Widened:** `false`
- **Fair Rate Band:** 10.5% – 12.0% (Tight 1.5% prime spread).

### Persona 2: Ravi (Self-Employed MSME, Thin Bureau File)
- **Profile:** Kirana store owner, Mysuru, ₹60,000–₹90,000/mo cash flow (normalized ₹78,000), ₹45L unencumbered shop, no bureau score, ₹0 debt. Requested ₹15,00,000 for business expansion.
- **Lender Likely Sanction:** ₹15,00,000 – ₹22,50,000 (50% LTV against commercial shop).
- **Borrower-Safe Amount:** **₹15,00,000** (Productive loan with collateral protection).
- **Verdict:** `borrow` (Recommendation: Proceed via Secured LAP/MSME route to avoid 18%+ unsecured loans).
- **Analysis Confidence:** **76% (Moderate)** — Capped at Moderate due to unverified bureau file and seasonal cash flows.
- **Range Widened:** `true` (Secured MSME rate band 9.25%–10.75%).

### Persona 3: Anita (Informal Gig Worker, High Stress)
- **Profile:** Delivery rider & tailoring, Hubballi, ₹28,000/mo variable, 3 app loans (₹7,500/mo), recent bounce, unemployed spouse. Requested ₹1,50,000 for scooter.
- **Lender Likely Sanction:** ₹40,000 – ₹1,00,000 (Commercial banks reject; predatory apps push high-interest debt).
- **Borrower-Safe Amount:** **₹0** (Zero safe borrowing headroom; free cash flow < ₹2,500).
- **Verdict:** `dont_borrow` (Recommendation: Avoid commercial borrowing; consolidate app debt).
- **Analysis Confidence:** **58% (Indicative)**
- **Stress Case:** `exceeds_limit` (Stressed debt service exceeds 53% of contracted income).

---

## 7. Automated Test Suite (62 Rigorous Tests)

The comprehensive automated test suite in `src/tests/index.ts` validates the entire system across 7 modules:

1. **Calculations Suite (2 Tests):** Standard Reducing Balance EMI and All-In APR formulas.
2. **Benchmark Persona Rules Engine (3 Tests):** Priya (`borrow_less`), Ravi (`borrow`), Anita (`dont_borrow`).
3. **Adaptive Questionnaire Suite (9 Tests):** Dynamic path visibility, conditional question pruning, and honest confidence scoring.
4. **Confidence + Uncertainty Suite (8 Tests):** Less info = wider range, unknown != zero, and complete vs incomplete profile deltas.
5. **Financial Rules Engine Suite A through R (18 Tests):**
   - *A. Reducing Balance EMI precision*
   - *B. FOIR calculation and ceiling enforcement*
   - *C. Maximum affordable new EMI ceiling*
   - *D. Lender likely sanction estimation without approval claims*
   - *E. Borrower-safe amount calculation*
   - *F. Three-tier verdict engine verification*
   - *G. Fair rate range enforcement (strictly min < max)*
   - *H. All-in APR incorporating 18% GST*
   - *I. Tenure trade-off analysis across standard terms*
   - *J. Transparent 20% income contraction stress test*
   - *K. Unknown credit score preservation without zero coercion*
   - *L. Unknown expenses imputed via 45% benchmark ratio*
   - *M. Variable income driving indicative/moderate confidence*
   - *N. Complete vs incomplete profile delta*
   - *O. Requested amount above safe ceiling triggering `borrow_less`*
   - *P. Requested amount above lender ceiling triggering `dont_borrow`*
   - *Q. Existing debt obligations directly depleting safe capacity*
   - *R. Three canonical benchmark personas triangulation*
6. **Consistency Invariants Suite (10 Tests):**
   - *Invariant 1: Safe amount <= lender likely sanction*
   - *Invariant 2: Increasing existing EMI never increases safe amount*
   - *Invariant 3: Increasing income never decreases safe amount*
   - *Invariant 4: Increasing loan amount never decreases calculated EMI*
   - *Invariant 5: Longer tenure reduces monthly EMI*
   - *Invariant 6: Longer tenure increases total cumulative interest*
   - *Invariant 7: Unknown credit is never coerced to subprime*
   - *Invariant 8: Missing expenses reduces analysis confidence*
   - *Invariant 9: Stressed safe EMI does not exceed base safe EMI*
   - *Invariant 10: Fair rate band is always maintained as a range*
7. **Edge Cases & Mathematical Safety Suite (12 Tests):**
   - *Edge 1: Income unknown handled gracefully*
   - *Edge 2: Expenses unknown imputed via benchmark*
   - *Edge 3: Existing EMI unknown preserved with lower confidence*
   - *Edge 4: Zero existing EMI maximizes headroom*
   - *Edge 5: Extreme debt service exceeding income handled gracefully (`dont_borrow`, no negative numbers)*
   - *Edge 6: Requested amount above safe ceiling triggers `borrow_less`*
   - *Edge 7: Requested amount above lender estimate triggers `dont_borrow`*
   - *Edge 8: Ultra-short tenure (6 months) evaluated without math error*
   - *Edge 9: Ultra-long tenure (240 months) evaluated accurately*
   - *Edge 10: Zero processing fee produces APR equal to nominal rate*
   - *Edge 11: Unknown processing fee produces estimated APR range*
   - *Edge 12: Zero and negative inputs sanitized (no NaN or Infinity)*
