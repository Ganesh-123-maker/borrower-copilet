import React, { useState, useId } from 'react';
import { Calculator, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateFlatRateConversion } from '../calculations/flatRateConverter';
import { formatINR } from '../utils/formatters';

interface FlatRateConverterCardProps {
  initialPrincipal?: number;
  initialTenureMonths?: number;
  defaultFlatRate?: number;
  className?: string;
}

export const FlatRateConverterCard: React.FC<FlatRateConverterCardProps> = ({
  initialPrincipal = 500000,
  initialTenureMonths = 36,
  defaultFlatRate = 8.0,
  className = '',
}) => {
  const [principal, setPrincipal] = useState<number>(initialPrincipal > 0 ? initialPrincipal : 500000);
  const [tenureMonths, setTenureMonths] = useState<number>(initialTenureMonths > 0 ? initialTenureMonths : 36);
  const [flatRate, setFlatRate] = useState<number>(defaultFlatRate > 0 ? defaultFlatRate : 8.0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const principalInputId = useId();
  const tenureInputId = useId();
  const flatRateInputId = useId();

  const conversion = calculateFlatRateConversion(principal, tenureMonths, flatRate);

  return (
    <div
      id="flat-rate-converter-tool"
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Is that &lsquo;low&rsquo; flat rate really cheaper?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare a lender&apos;s advertised flat rate against true reducing-balance interest.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="toggle-flat-converter"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          aria-label={isExpanded ? 'Collapse converter' : 'Expand converter'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-6">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">How lenders mask high rates:</span>
              <p className="leading-relaxed">
                An <strong>8% flat rate</strong> is calculated on the original principal for the entire tenure. A <strong>reducing-balance rate</strong> calculates interest only on the remaining unpaid balance as you pay it off. That means the advertised flat rate can look lower while costing substantially more.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor={principalInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                Loan Amount (₹)
              </label>
              <input
                id={principalInputId}
                type="number"
                min={10000}
                max={10000000}
                step={10000}
                value={principal || ''}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                placeholder="500000"
              />
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                {formatINR(principal)}
              </span>
            </div>

            <div>
              <label htmlFor={tenureInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tenure (Months)
              </label>
              <div className="flex gap-2">
                <input
                  id={tenureInputId}
                  type="number"
                  min={6}
                  max={120}
                  step={6}
                  value={tenureMonths || ''}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  placeholder="36"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {conversion.tenureYears} {conversion.tenureYears === 1 ? 'year' : 'years'}
              </span>
            </div>

            <div>
              <label htmlFor={flatRateInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                Advertised Flat Rate (% p.a.)
              </label>
              <input
                id={flatRateInputId}
                type="number"
                min={1}
                max={40}
                step={0.5}
                value={flatRate || ''}
                onChange={(e) => setFlatRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                placeholder="8.0"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Flat annual rate quoted by agent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Lender Flat Rate Quote
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 font-mono">
                  {flatRate}% Flat
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-rose-100">
                  <span className="text-slate-600">Monthly Payment:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(conversion.flatMonthlyPayment)}/mo
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-rose-100">
                  <span className="text-slate-600">Total Interest Charged:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {formatINR(conversion.flatTotalInterest)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Total Repayment Amount:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(conversion.flatTotalRepayment)}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-rose-200/80">
                <span className="text-[11px] text-slate-500 block">
                  Interest formula: {formatINR(principal)} × {flatRate}% × {conversion.tenureYears} yrs
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  True Reducing Balance Equivalent
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-200 text-indigo-900 font-mono">
                  ~{conversion.approxEquivalentReducingRate}% p.a.
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                  <span className="text-slate-600">Approx. Reducing Rate:</span>
                  <span className="font-mono font-black text-indigo-950 text-sm">
                    {conversion.approxEquivalentReducingRate}% p.a.
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-indigo-100">
                  <span className="text-slate-600">Same-Rate Reducing Interest:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatINR(conversion.reducingTotalInterestAtNominalRate)} (at {flatRate}%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Extra Cost vs Genuine {flatRate}%:</span>
                  <span className="font-mono font-bold text-rose-700">
                    +{formatINR(conversion.interestDifferenceRupees)} (+{conversion.interestDifferencePercent}%)
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-indigo-200/80">
                <span className="text-[11px] text-slate-600 block leading-tight">
                  To get the same {formatINR(conversion.flatMonthlyPayment)}/mo EMI, a standard bank loan would charge <strong>{conversion.approxEquivalentReducingRate}% reducing balance</strong>.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p>
                <strong>The Bottom Line:</strong> If a lender offers you a <strong>{flatRate}% flat rate</strong>, do not compare it directly with a bank&apos;s 11% or 12% reducing rate. That flat rate actually costs you like a <strong>{conversion.approxEquivalentReducingRate}% reducing loan</strong>.
              </p>
              <p className="text-slate-500">
                Always ask the loan agent: <em>&ldquo;Is this quote on a reducing balance basis or flat basis?&rdquo;</em>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 italic border-t border-slate-100 pt-3">
            <strong>Disclaimer:</strong> Illustrative comparison. Actual lender pricing, fees, taxes, compounding/payment frequency and contract terms can change the effective cost.
          </p>
        </div>
      )}
    </div>
  );
};
