/**
 * @file src/components/Footer.tsx
 * @description Application footer with regulatory context and privacy assurances.
 */

import React from 'react';
import { ShieldCheck, EyeOff, Lock, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Borrower Copilot
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-semibold uppercase">
                Affordability Engine v1.2
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-md text-slate-600">
              An independent, client-side self-assessment tool engineered to balance the information
              asymmetry between Indian retail borrowers and lending institutions.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 font-mono">
              Borrower Protection
            </h4>
            <ul className="text-xs space-y-2">
              <li className="flex items-center gap-2 text-slate-600">
                <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero Bureau Enquiries</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>No Data Leaves Device</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>No Referral / DSA Kickbacks</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 font-mono">
              Regulatory Alignment
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Models follow Reserve Bank of India (RBI) Fair Practices Code, Key Fact Statement (KFS)
              guidelines, and prudent FOIR affordability limits.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest font-semibold">
          <p>
            Educational self-assessment tool. Does not constitute a formal loan sanction.
          </p>
          <div className="flex gap-4 items-center">
            <span>Rules Applied: RBI-APR-2024</span>
            <span className="text-indigo-600">India Rupee (₹)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
