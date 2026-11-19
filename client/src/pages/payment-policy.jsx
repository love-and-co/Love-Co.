import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CreditCard, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentPolicyPage() {
  return (
    <>
      <Head>
        <title>Payment Policy &amp; Security — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Learn about Love & Co.'s secure payment methods, 256-bit SSL encryption, Razorpay & Stripe integration, and Cash on Delivery guidelines."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Transaction Security
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Payment Policy &amp; Security
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Bank-grade encrypted checkout powering seamless, safe transactions for botanical skincare orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <Lock className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">256-Bit SSL</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                Full end-to-end cryptographic encryption across all payment gateways.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">RBI &amp; PCI-DSS Level 1</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                Strict adherence to Reserve Bank of India tokenization and 3D Secure 2.0.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <CreditCard className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">Zero Card Storage</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                We never store your card numbers, CVVs, or bank passwords on our servers.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. Supported Payment Channels</h2>
              <div className="space-y-3">
                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <strong className="block text-brand-mocha-900 font-medium mb-1">A. Instant UPI (Recommended):</strong>
                  <p className="text-xs text-brand-mocha-900/70">
                    Pay seamlessly with Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app via one-tap intent or QR scan.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <strong className="block text-brand-mocha-900 font-medium mb-1">B. Debit &amp; Credit Cards:</strong>
                  <p className="text-xs text-brand-mocha-900/70">
                    Visa, MasterCard, RuPay, and American Express with mandatory OTP two-factor authentication (3D Secure).
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <strong className="block text-brand-mocha-900 font-medium mb-1">C. NetBanking &amp; Digital Wallets:</strong>
                  <p className="text-xs text-brand-mocha-900/70">
                    Over 50+ major Indian banks supported through our authorized Razorpay gateway.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-brand-silver">
                  <strong className="block text-brand-mocha-900 font-medium mb-1">D. Cash on Delivery (COD):</strong>
                  <p className="text-xs text-brand-mocha-900/70">
                    Available for domestic delivery across India. You may pay in cash or scan the delivery executive’s dynamic UPI QR code on handover.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Failed Transactions &amp; Double Debits</h2>
              <p>
                In the rare instance where money has been deducted from your bank or wallet but your order was not confirmed due to a network glitch:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Payment gateways initiate an automated reversal within <strong>24 to 48 business hours</strong>.</li>
                <li>Your bank typically reflects the refunded amount within <strong>3 to 5 business days</strong>.</li>
                <li>If not reflected, email our billing desk at <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">loveandcosupport@gmail.com</a> with your transaction reference.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. Invoice &amp; Tax Declarations</h2>
              <p>
                All prices include applicable Goods and Services Tax (GST). A digital tax invoice with HSN classification is automatically generated and sent to your registered email address upon checkout completion.
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

