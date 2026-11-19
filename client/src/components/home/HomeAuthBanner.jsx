import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, UserCheck, Package } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

function SoapIcon({ className = 'w-4 h-4 text-moss shrink-0' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="9" width="18" height="12" rx="3.5" />
      <path d="M7 15h10" />
      <circle cx="7.5" cy="5" r="1.5" />
      <circle cx="12.5" cy="4" r="2" />
      <circle cx="17" cy="5.5" r="1" />
    </svg>
  );
}

export default function HomeAuthBanner() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // When user is authenticated, completely hide this section
  if (mounted && isAuthenticated) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-brand-canvas border-b border-brand-silver">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-brand-silver p-6 sm:p-10 shadow-xs rounded-sm relative overflow-hidden">
          {/* Subtle decorative background accent */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-lavender-light/50 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center px-2.5 py-1 bg-brand-lavender-light border border-brand-lavender rounded-xs text-[10px] sm:text-xs font-mono-clinical uppercase tracking-wider text-brand-lavender-text font-semibold">
                <span>Join The Love &amp; Co. Collective</span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-[32px] md:text-[36px] lg:text-4xl text-brand-mocha-900 font-normal leading-tight">
                Sign in to your skin account
              </h3>
              <p className="text-xs sm:text-sm text-brand-mocha/80 font-sans leading-relaxed max-w-xl">
                Unlock personalized skin diagnostic records, early notifications on freshly cured 45-day small batches, and seamless order tracing.
              </p>

              {/* Perks Row */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-clinical text-[#6F4E37]">
                <div className="flex items-center space-x-2 font-semibold">
                  <UserCheck className="w-4 h-4 text-[#6F4E37] shrink-0" />
                  <span>Clinical Skin Profile</span>
                </div>
                <div className="flex items-center space-x-2 font-semibold">
                  <Package className="w-4 h-4 text-[#6F4E37] shrink-0" />
                  <span>Live Batch Tracing</span>
                </div>
                <div className="flex items-center space-x-2 font-semibold">
                  <SoapIcon className="w-4 h-4 text-[#6F4E37] shrink-0" />
                  <span>Cold Press Soaps</span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col justify-center gap-3">
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full py-3.5 px-6 bg-brand-mocha-900 text-white text-xs font-mono-clinical uppercase tracking-wider font-semibold hover:bg-brand-mocha transition-colors shadow-xs flex items-center justify-center space-x-2 rounded-lg cursor-pointer"
              >
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-center gap-3">
                <Link
                  href="/register"
                  className="w-full py-3 px-4 bg-white border border-brand-silver text-brand-mocha-900 text-xs font-mono-clinical uppercase tracking-wider font-semibold hover:bg-brand-lavender-light hover:border-brand-mocha/30 transition-colors rounded-lg block text-center"
                >
                  Create New Account
                </Link>
                <button
                  type="button"
                  onClick={() => openAuthModal('email')}
                  className="w-full py-3 px-4 bg-brand-silver-light/40 border border-brand-silver text-brand-mocha text-xs font-mono-clinical uppercase tracking-wider font-medium hover:bg-brand-lavender-light transition-colors rounded-lg block text-center cursor-pointer"
                >
                  Login with Email
                </button>
              </div>

              <p className="text-[10px] text-center text-brand-mocha/60 font-mono-clinical pt-1 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-moss" />
                <span>Instant 1-Click Mobile OTP or Email Login</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
