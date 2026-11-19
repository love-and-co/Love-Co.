import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <>
      <Head>
        <title>Cookie Policy — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Learn how Love & Co. uses cookies and local storage tokens to maintain shopping bag items, authentication sessions, and clinical skin regimens."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Digital Governance
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Cookie Policy
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              How we employ essential and functional cookies to ensure a seamless apothecary shopping experience.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. What are Cookies?</h2>
              <p>
                Cookies and browser local storage entries are lightweight data keys saved to your device. They allow our web store to remember your active formulation bag, keep you securely signed in during checkout, and store your bespoke skin diagnostic consultation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Categories of Cookies We Use</h2>
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <h3 className="font-monoClinical text-xs font-bold text-brand-mocha-900 uppercase tracking-wider mb-1">
                    A. Strictly Essential Cookies (Mandatory)
                  </h3>
                  <p className="text-xs text-brand-mocha-900/70">
                    These are required for basic navigation, shopping cart persistence, stock hold reservation (15-minute checkout lock), and cryptographic JWT authentication tokens (<code className="text-[11px] bg-white px-1 py-0.5 rounded border border-brand-silver">love_co_token</code>).
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <h3 className="font-monoClinical text-xs font-bold text-brand-mocha-900 uppercase tracking-wider mb-1">
                    B. Functional &amp; Preference Cookies
                  </h3>
                  <p className="text-xs text-brand-mocha-900/70">
                    Used to remember your skin profile concerns (e.g. barrier repair, oily/acne prone) and saved addresses so you do not need to re-enter them on recurring visits.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <h3 className="font-monoClinical text-xs font-bold text-brand-mocha-900 uppercase tracking-wider mb-1">
                    C. Analytical Diagnostics (Anonymized)
                  </h3>
                  <p className="text-xs text-brand-mocha-900/70">
                    Aggregated metrics that measure page latency, mobile responsiveness, and popular formulation inquiries. No personal identity is ever linked to these analytics.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. Managing &amp; Disabling Cookies</h2>
              <p>
                You can manage or clear cookies through your browser settings (Chrome, Safari, Firefox, Edge). Note that disabling essential cookies will prevent the cart drawer, stock reservation, and secure checkout from functioning correctly.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-brand-silver">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">4. Contact Inquiries</h2>
              <p>
                If you have questions regarding our cookie implementation, please email <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">loveandcosupport@gmail.com</a>.
              </p>
            </section>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-monoClinical font-bold uppercase tracking-wider text-brand-mocha hover:underline">
              &larr; Return to Atelier Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

