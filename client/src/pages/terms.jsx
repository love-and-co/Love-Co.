import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms &amp; Conditions — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Review the terms of service governing Love & Co.'s small-batch cold-pressed soaps, lip elixirs, orders, warranties, and platform access."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Legal Agreement
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Please review these terms governing your purchase and use of Love &amp; Co. products.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. Introduction &amp; Acceptance</h2>
              <p>
                By accessing or purchasing from the Love &amp; Co. digital atelier (loveandco.com), you acknowledge and accept these Terms &amp; Conditions in full. If you disagree with any portion of these terms, you must refrain from ordering.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Small-Batch Formulation Characteristics</h2>
              <p>
                Our cold-saponified bars and therapeutic lip elixirs are crafted using genuine, unbleached botanical oils, wild-harvested plant butters, and pure clays. Because our products are hand-poured in micro-batches and slow-cured for 6 weeks, subtle variations in marble patterns, hue, and natural botanical aroma are natural markers of authenticity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. Order Acceptance &amp; Pricing</h2>
              <p>
                All prices displayed on the store are in Indian Rupees (₹ INR) inclusive of statutory taxes. Love &amp; Co. reserves the right to decline or cancel orders in cases of pricing typographical errors, inventory stockouts, or suspect fraudulent activity. In such events, any funds debited will be returned promptly to the original payment source.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">4. Intellectual Property</h2>
              <p>
                All logos, formulations, INCI tables, visual imagery, typography, and brand assets displayed on Love &amp; Co. are the exclusive intellectual property of Love &amp; Co. Botanicals Private Limited and protected under trademark and copyright statutes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">5. Limitation of Liability</h2>
              <p>
                Love &amp; Co. products are formulated for cosmetic and topical skincare support. They are not intended to diagnose, cure, mitigate, or treat pathological medical skin diseases. Customers with known plant or nut allergies are advised to inspect the complete INCI ingredient ledger and conduct a 24-hour patch test.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-brand-silver">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">6. Governing Law &amp; Jurisdiction</h2>
              <p>
                These terms are governed by and construed in accordance with the substantive laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
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

