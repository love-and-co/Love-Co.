import React from 'react';
import Link from 'next/link';
import { Mail, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-mocha-900 text-[#FAF9F8] font-sans pt-12 pb-8 border-t border-brand-mocha-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Subscription Row */}
        <div className="pb-10 mb-10 border-b border-brand-mocha-700 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 space-y-1">
            <h3 className="text-[#E6E0F0] font-serif-luxury text-xl sm:text-2xl font-medium">
              Join the Love &amp; Co.
            </h3>
            <p className="text-[#FAF9F8]/80 text-xs sm:text-[13px] font-sans">
              Receive cold-saponified batch disclosures, formulation insights, and private VIP launches.
            </p>
          </div>
          <div className="md:col-span-6">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 max-w-md md:ml-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-3.5 py-2.5 bg-white/10 border border-[#E6E0F0]/40 text-white placeholder-[#FAF9F8]/50 text-xs font-mono-clinical focus:outline-none focus:border-[#E6E0F0]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E6E0F0] text-brand-mocha-900 hover:bg-white font-semibold text-xs font-mono-clinical uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Main 3-Column Minimalist Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
          {/* Column 1: Company Overview */}
          <div className="col-span-1 md:col-span-3 space-y-3.5">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#E6E0F0]">
              Company Overview
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] font-sans">
              <li>
                <Link href="/about" className="text-[#E6E0F0] hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Privacy notice
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/grievance-redressal" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-1 md:col-span-3 space-y-3.5">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#E6E0F0]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] font-sans">
              <li>
                <Link href="/knowledge" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Knowledge
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-[#E6E0F0] hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Return &amp; refund policy
                </Link>
              </li>
              <li>
                <Link href="/payment-policy" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Payment Policy
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-[#E6E0F0] hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link href="/orders/track" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Track order
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-[#E6E0F0] hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="col-span-2 md:col-span-6 space-y-4 text-xs sm:text-[13px] text-[#FAF9F8] font-sans">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#E6E0F0]">
              Contact Us
            </h4>

            <div className="space-y-1.5">
              <p>
                <strong className="text-[#E6E0F0] font-medium">WhatsApp Support:</strong>{' '}
                <a
                  href="https://wa.me/919440607778"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#E6E0F0] hover:text-white transition-colors"
                >
                  +91 94406 07778
                </a>
              </p>
              <p>
                <strong className="text-[#E6E0F0] font-medium">Email:</strong>{' '}
                <a
                  href="mailto:loveandcosupport@gmail.com"
                  className="underline text-[#E6E0F0] hover:text-white transition-colors"
                >
                  loveandcosupport@gmail.com
                </a>
              </p>
            </div>

            <p>
              <strong className="text-[#E6E0F0] font-medium">Contact Form:</strong> Fill out{' '}
              <Link href="/contact" className="underline text-[#E6E0F0] hover:text-white transition-colors">
                our contact form
              </Link>{' '}
              for assistance.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="mailto:loveandcosupport@gmail.com"
                aria-label="Email"
                className="text-[#E6E0F0] hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-[#E6E0F0] hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/loveandco._/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @loveandco._"
                className="text-[#E6E0F0] hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-[#E6E0F0] hover:text-white transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-brand-mocha-700 flex flex-col sm:flex-row items-center justify-between text-xs font-mono-clinical text-[#FAF9F8]/60">
          <p>
            Copyright &copy; 2026{' '}
            <Link href="/" className="underline text-[#E6E0F0] hover:text-white font-medium transition-colors">
              Love &amp; Co.
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
