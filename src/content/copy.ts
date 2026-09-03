/**
 * @file src/content/copy.ts
 * @description Centralized UI copy, explanations, and product messaging.
 */

export const PRODUCT_COPY = {
  appName: 'Borrower Copilot',
  tagline: 'Know what you can safely borrow before you talk to a lender.',
  subheading:
    'Lenders have models to maximize what they lend. You need an honest self-assessment to protect your monthly cash flow, know your fair rate, and hold the upper hand in negotiation.',
  trustGuarantees: [
    {
      title: 'No login required',
      description: 'Zero account setup, phone number collection, or spam calls.',
    },
    {
      title: 'No bureau pull',
      description: 'We do not ping CIBIL, Experian, or Equifax. Your score is untouched.',
    },
    {
      title: '100% private to your browser',
      description: 'Your financial numbers stay strictly on your device.',
    },
    {
      title: 'Self-assessment, not a loan broker',
      description: 'We do not sell loans, earn commissions, or refer you to lenders.',
    },
  ],
  coreQuestions: [
    {
      id: 'q1',
      number: '01',
      question: 'Should I borrow?',
      tagline: 'Verdict with real reasons',
      detail:
        'Determines whether taking this debt is sound, whether you should borrow less, or if "Don\'t borrow" is the right choice to protect your solvency.',
    },
    {
      id: 'q2',
      number: '02',
      question: 'How much can I safely carry?',
      tagline: 'Lender sanction vs Borrower safe',
      detail:
        'A bank may approve 60% of your gross income. We calculate what you can safely carry without risking default or liquidating emergency savings.',
    },
    {
      id: 'q3',
      number: '03',
      question: 'What is a fair interest rate?',
      tagline: 'True APR including all hidden fees',
      detail:
        'A realistic rate band based on your profile, with upfront processing fees and GST converted into RBI-compliant all-in APR.',
    },
    {
      id: 'q4',
      number: '04',
      question: 'What EMI should I agree to?',
      tagline: 'Monthly ceiling + stress test',
      detail:
        'A strict monthly outflow ceiling you should never cross, tenure trade-offs, and what happens if your income dips by 20%.',
    },
  ],
};
