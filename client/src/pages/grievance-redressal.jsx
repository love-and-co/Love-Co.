import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export default function GrievanceRedressalPage() {
  return (
    <>
      <Head>
        <title>Grievance Redressal — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Grievance Redressal Mechanism and Officer details in compliance with the Consumer Protection (E-Commerce) Rules, 2020 for Love & Co."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Consumer Protection
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Grievance Redressal Mechanism
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              In accordance with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">Our Redressal Commitment</h2>
              <p>
                Love &amp; Co. is committed to fair, swift, and respectful customer satisfaction. Should you encounter any issues regarding your order, payments, delivery disputes, or consumer rights, our dedicated Grievance Officer is appointed to resolve your concern directly.
              </p>
            </section>

            {/* Officer Details Card */}
            <div className="bg-[#FAF9F8] border-2 border-brand-silver rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="border-b border-brand-silver pb-3">
                <span className="text-[10px] font-monoClinical uppercase tracking-wider text-brand-mocha font-bold">
                  Designated Officer
                </span>
                <h3 className="font-serifLuxury text-xl text-brand-mocha-900">
                  Mr. Raghavendra Sharma
                </h3>
                <p className="text-xs text-brand-mocha-900/60 font-sans">
                  Nodal Grievance &amp; Compliance Officer
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-mocha-900">Official Grievance Email:</strong>
                    <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">
                      loveandcosupport@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-mocha-900">Dedicated Helpline:</strong>
                    <span>+91 94406 07778 (Mon–Sat, 10:00 AM – 6:00 PM IST)</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-mocha-900">Atelier Postal Address:</strong>
                    <span>Love &amp; Co. Botanicals Pvt. Ltd., #42 Atelier Court, 80 Feet Road, Koramangala 4th Block, Bengaluru, Karnataka 560034, India</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">SLA &amp; Escalation Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#E6E0F0]/50 border border-brand-silver rounded-2xl space-y-1.5">
                  <span className="text-xs font-monoClinical font-bold uppercase text-brand-mocha">
                    Step 1: Acknowledgment
                  </span>
                  <p className="text-xs text-brand-mocha-900/70">
                    Receipt of your grievance ticket is formally acknowledged with a unique reference number within <strong>48 hours</strong>.
                  </p>
                </div>
                <div className="p-4 bg-[#E6E0F0]/50 border border-brand-silver rounded-2xl space-y-1.5">
                  <span className="text-xs font-monoClinical font-bold uppercase text-brand-mocha">
                    Step 2: Resolution
                  </span>
                  <p className="text-xs text-brand-mocha-900/70">
                    Comprehensive investigation and formal redressal of your issue will be completed within <strong>15 business days</strong> from receipt.
                  </p>
                </div>
              </div>
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

