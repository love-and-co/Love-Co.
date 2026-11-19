import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <>
      <Head>
        <title>Return &amp; Refund Policy — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="30-Day Biocompatibility Assurance, return guidelines, and refund turnaround timelines for Love & Co. skincare products."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Assurance &amp; Returns
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Return &amp; Refund Policy
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Our 30-Day Biocompatibility Assurance: transparent, customer-first skincare guarantees.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            {/* 30-Day Assurance Banner */}
            <div className="p-5 bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl flex items-start space-x-3 text-xs text-brand-mocha-900">
              <ShieldCheck className="w-5 h-5 text-brand-mocha flex-shrink-0 mt-0.5 stroke-[2.2]" />
              <div>
                <strong className="block font-semibold mb-1 text-sm">30-Day Biocompatibility Assurance:</strong>
                If our botanical products cause acute skin sensitivity, breakout aggravation, or discomfort, we will arrange a direct replacement with a gentler product or issue a full refund within 30 days of purchase.
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. Eligibility for Returns &amp; Replacements</h2>
              <p>We accept returns or replacements under the following conditions:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-brand-mocha-900">Skin Sensitivity / Irritation:</strong> Verified through a brief consultation with our support desk within 30 days of delivery.</li>
                <li><strong className="text-brand-mocha-900">Damaged or Defective Items:</strong> Products broken, leaking, or damaged during courier transit.</li>
                <li><strong className="text-brand-mocha-900">Incorrect Item Dispatched:</strong> If the product received differs from your confirmed checkout order.</li>
                <li><strong className="text-brand-mocha-900">Unopened / Unused Products:</strong> Items in their original, sealed outer box within 14 days of receipt.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Simple 3-Step Return Process</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver space-y-1">
                  <span className="font-monoClinical text-brand-mocha font-bold uppercase text-[10px]">Step 1</span>
                  <strong className="block text-brand-mocha-900 font-medium">Contact Atelier Care</strong>
                  <p className="text-brand-mocha-900/70">Email loveandcosupport@gmail.com or message WhatsApp (+91 94406 07778) with your Order ID.</p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver space-y-1">
                  <span className="font-monoClinical text-brand-mocha font-bold uppercase text-[10px]">Step 2</span>
                  <strong className="block text-brand-mocha-900 font-medium">Free Reverse Pickup</strong>
                  <p className="text-brand-mocha-900/70">Our courier partners will schedule a contactless doorstep collection at zero cost.</p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver space-y-1">
                  <span className="font-monoClinical text-brand-mocha font-bold uppercase text-[10px]">Step 3</span>
                  <strong className="block text-brand-mocha-900 font-medium">Fast Refund Credit</strong>
                  <p className="text-brand-mocha-900/70">Approved refunds are credited directly back to your original payment source.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. Refund Processing Turnaround</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Online Payments (UPI, Cards, NetBanking):</strong> Processed within 24 to 48 hours of return receipt; bank reflection takes 3–5 business days.</li>
                <li><strong>Cash on Delivery (COD) Orders:</strong> Refunded via instant NEFT/IMPS bank transfer or UPI ID provided during the return initiation.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-brand-silver">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">4. Contact Return Concierge</h2>
              <p>
                Love &amp; Co. Returns Dept.<br />
                Email: <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">loveandcosupport@gmail.com</a><br />
                WhatsApp: +91 94406 07778 (Mon–Sat, 10 AM – 6 PM IST)
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

