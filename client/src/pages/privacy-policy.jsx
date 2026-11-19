import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Notice — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Review the Privacy Notice of Love & Co. Learn how we protect your personal information, clinical skin diagnostic data, and payment details."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Legal &amp; Compliance
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Privacy Notice
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Last updated: October 2026. Compliant with the Digital Personal Data Protection (DPDP) Act, 2023.
            </p>
          </div>

          {/* Core Content Box */}
          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. Commitment to Data Sanctity</h2>
              <p>
                At Love &amp; Co. Atelier, your personal privacy is treated with the same meticulous integrity as our botanical formulations. We strictly adhere to fair data practices and will never sell, rent, or monetize your personal information or clinical skin diagnostic profiles to third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-brand-mocha-900">Account Credentials:</strong> Full name, verified mobile number, email address, and encrypted password authentication logs.</li>
                <li><strong className="text-brand-mocha-900">Dispatch &amp; Order Fulfillment:</strong> Physical delivery address, pincode, contact number, and invoice history for courier transmission.</li>
                <li><strong className="text-brand-mocha-900">Diagnostic Skin Profiles:</strong> Responses provided to our Sam AI Skincare Assistant regarding skin type, concerns (e.g. acne, hyperpigmentation, barrier repair), and formulation preferences to curate regimen recommendations.</li>
                <li><strong className="text-brand-mocha-900">Payment Metadata:</strong> Transaction reference IDs, payment method choice, and gateway authorization tokens. We do <em>not</em> store full debit/credit card numbers or CVV codes on our servers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. How Your Information is Utilized</h2>
              <p>We process collected data exclusively to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Formulate, batch-reserve, package, and dispatch orders directly to your doorstep.</li>
                <li>Provide real-time SMS and WhatsApp order tracking updates and delivery notifications.</li>
                <li>Power personalized regimen recommendations via our clinical diagnostic engine.</li>
                <li>Detect and prevent fraud, unauthorized access, and duplicate transactions.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">4. Data Encryption &amp; Security Measures</h2>
              <p>
                All data transmission between your browser and our atelier servers is encrypted via 256-bit Transport Layer Security (TLS 1.3). Sensitive user data is housed in ISO 27001-certified cloud infrastructure with strict role-based access protocols.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">5. Your Statutory Rights</h2>
              <p>
                You retain complete sovereignty over your data. At any time, you may request access to, correction of, or permanent erasure of your account and skin log history by contacting our Privacy Desk at <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline font-semibold">loveandcosupport@gmail.com</a>.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-brand-silver">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">6. Contact Our Data Protection Team</h2>
              <p>
                Love &amp; Co. Botanicals Private Limited<br />
                Apothecary Lab &amp; Atelier, Koramangala 4th Block, Bengaluru, Karnataka 560034<br />
                Direct Email: <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">loveandcosupport@gmail.com</a>
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

