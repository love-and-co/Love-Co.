import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Truck, Clock, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <>
      <Head>
        <title>Shipping &amp; Delivery Policy — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Learn about Love & Co.'s express delivery timelines, free shipping thresholds, courier partners, and packaging safety standards across India."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Fulfillment Logistics
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Fast, climate-conscious domestic delivery across all 28 states and 8 union territories in India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <Truck className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">Free Delivery</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                Complimentary express air shipping on all orders ₹500 and above.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <Clock className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">24h Dispatch</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                Hand-inspected and sealed in micro-batches from our Bengaluru lab within 24 hours.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-brand-silver text-center space-y-2 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-brand-mocha mx-auto stroke-[1.8]" />
              <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">Safe Transit Hold</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                100% recyclable, tamper-evident biodegradable paper cushions protecting every bar.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85">
            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">1. Transit Timelines by Region</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-brand-silver text-[11px] font-monoClinical uppercase text-brand-mocha font-bold">
                      <th className="py-2.5">Destination Category</th>
                      <th className="py-2.5">Estimated Delivery</th>
                      <th className="py-2.5">Carrier Partner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-silver/60 text-xs">
                    <tr>
                      <td className="py-3 font-medium text-brand-mocha-900">Metro Cities (Bengaluru, Mumbai, Delhi NCR, Chennai, Hyderabad)</td>
                      <td className="py-3">24 to 48 Hours</td>
                      <td className="py-3 font-monoClinical">Bluedart Air / Delhivery Express</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-brand-mocha-900">Tier 2 &amp; Tier 3 Cities</td>
                      <td className="py-3">4 to 7 Days</td>
                      <td className="py-3 font-monoClinical">Delhivery / DTDC Express</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-brand-mocha-900">North East &amp; Special Island Regions</td>
                      <td className="py-3">4 to 6 Business Days</td>
                      <td className="py-3 font-monoClinical">India Post Speed Post / Bluedart</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">2. Shipping Fees</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Orders ₹500 and above:</strong> FREE Shipping across all pincodes in India.</li>
                <li><strong>Orders below ₹500:</strong> A standard flat-rate shipping charge of ₹49 is added automatically at checkout.</li>
                <li><strong>Cash on Delivery (COD):</strong> No hidden processing surcharge. Standard order delivery rates apply.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">3. Order Tracking Notifications</h2>
              <p>
                As soon as your package leaves our laboratory, automated tracking notifications with a live AWB tracking number are dispatched via SMS and WhatsApp. You may track your package in real-time at <Link href="/orders/track" className="text-brand-mocha underline font-semibold">/orders/track</Link>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">4. Damaged or Tampered Package In Transit</h2>
              <p>
                If the outer shipping carton shows signs of tampering or severe crushing upon delivery, please do not accept the shipment from the delivery executive, or photograph the package and notify us at <a href="mailto:loveandcosupport@gmail.com" className="text-brand-mocha underline">loveandcosupport@gmail.com</a> within 24 hours. We will immediately dispatch a fresh replacement batch at zero cost.
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

