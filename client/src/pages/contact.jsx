import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
  HeartHandshake
} from 'lucide-react';
import { SUPPORT_STORAGE_KEY, INITIAL_SUPPORT_TICKETS } from '../modules/admin/data/mockSupportTickets';

export default function ContactHelpPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    orderId: '',
    category: 'Order & Delivery',
    priority: 'MEDIUM',
    subject: '',
    message: ''
  });

  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.message.trim()) {
      setErrorMsg('Please complete your name, email, and message so our customer care team can assist you.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket = {
        id: ticketId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim() || 'N/A',
        orderId: formData.orderId.trim() ? (formData.orderId.trim().toUpperCase().startsWith('ORD-') ? formData.orderId.trim().toUpperCase() : `ORD-${formData.orderId.trim().toUpperCase()}`) : '',
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim() || `Customer inquiry regarding ${formData.category}`,
        message: formData.message.trim(),
        createdAt: new Date().toISOString(),
        replies: []
      };

      // Retrieve existing tickets or fallback
      let existingTickets = INITIAL_SUPPORT_TICKETS;
      try {
        const stored = localStorage.getItem(SUPPORT_STORAGE_KEY);
        if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) existingTickets = parsed;
        }
      } catch (e) {
        // ignore
      }

      const updated = [newTicket, ...existingTickets];
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(updated));

      setSubmittedTicket(newTicket);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        orderId: '',
        category: 'Order & Delivery',
        priority: 'MEDIUM',
        subject: '',
        message: ''
      });
    } catch (err) {
      setErrorMsg('Unable to submit your message at this moment. Please reach out via WhatsApp or email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Care &amp; Support — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Get in touch with Love & Co. Customer Support for artisanal soap order tracking, formulation inquiries, returns, and skincare consultations."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-[#F2EDE6] text-[#6F4E37] border border-[#E2DDD6]">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Apothecary Help Desk</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1614] font-normal tracking-tight">
              Customer Care &amp; Support
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed">
              Have a question about your order, shipping timeline, cold-pressed formulation, or skin compatibility? Our dedicated care team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Direct Contact Channels Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E8E3EE] p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1C1614]">Direct Contact</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Reach our formulation and fulfillment team through your preferred channel.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/919440607778"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start space-x-3.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-950 group-hover:underline">
                        WhatsApp Support
                      </div>
                      <div className="text-emerald-800 text-[11px] mt-0.5">
                        +91 94406 07778 (Instant updates)
                      </div>
                      <div className="text-[10px] text-emerald-700/80 mt-0.5">
                        Mon–Sat, 10:00 AM – 6:30 PM IST
                      </div>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:loveandcosupport@gmail.com"
                    className="flex items-start space-x-3.5 p-3 rounded-xl border border-gray-100 bg-[#FAF9F8] hover:bg-gray-100 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1C1614] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:underline">
                        Email Support Desk
                      </div>
                      <div className="text-gray-600 text-[11px] mt-0.5">
                        loveandcosupport@gmail.com
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Guaranteed response within 4 hours
                      </div>
                    </div>
                  </a>

                  {/* Order Tracking */}
                  <Link
                    href="/orders/track"
                    className="flex items-start space-x-3.5 p-3 rounded-xl border border-gray-100 bg-[#FAF9F8] hover:bg-gray-100 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#6F4E37] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:underline">
                        Self-Service Order Tracking
                      </div>
                      <div className="text-gray-600 text-[11px] mt-0.5">
                        Track air courier dispatch in real-time
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Grievance redressal notice */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consumer Protection Compliant</span>
                  </span>
                  <Link href="/grievance-redressal" className="text-[#6F4E37] hover:underline font-medium">
                    Grievance Officer &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Message Submission Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-[#E8E3EE] p-6 sm:p-8 shadow-xs">
                {submittedTicket ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-xl text-gray-900">Message Received!</h3>
                      <p className="text-xs text-gray-600 max-w-md mx-auto">
                        Your inquiry has been logged with our customer care desk. Reference ID:
                      </p>
                      <div className="inline-block mt-2 font-mono text-sm font-bold bg-[#FAF9F8] border border-gray-200 px-3.5 py-1.5 rounded-lg text-[#1C1614]">
                        {submittedTicket.id}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      A care executive will respond to <strong className="text-gray-800">{submittedTicket.customerEmail}</strong> within 4 business hours.
                    </p>
                    <button
                      onClick={() => setSubmittedTicket(null)}
                      className="mt-4 px-4 py-2 bg-[#1C1614] hover:bg-[#342721] text-white text-xs font-semibold rounded-xl transition"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1614]">Send Us a Message</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fill in your inquiry details and our team will get back to you promptly.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          required
                          value={formData.customerName}
                          onChange={handleChange}
                          placeholder="e.g. Ananya Sharma"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="customerEmail"
                          required
                          value={formData.customerEmail}
                          onChange={handleChange}
                          placeholder="e.g. ananya@example.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        />
                      </div>

                      {/* Order Number */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Order Number (If applicable)
                        </label>
                        <input
                          type="text"
                          name="orderId"
                          value={formData.orderId}
                          onChange={handleChange}
                          placeholder="e.g. ORD-8821"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Inquiry Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        >
                          <option value="Order & Delivery">Order &amp; Delivery Tracking</option>
                          <option value="Product Formulation">Product Formulation &amp; Ingredients</option>
                          <option value="Address Correction">Address / Pincode Correction</option>
                          <option value="Refund & Return">Return, Replacement or Refund</option>
                          <option value="General Inquiry">General Question / Feedback</option>
                        </select>
                      </div>

                      {/* Urgency */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                          Urgency Level
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                        >
                          <option value="MEDIUM">Standard Inquiry (Within 4 hrs)</option>
                          <option value="HIGH">Urgent Order Concern (Immediate)</option>
                          <option value="LOW">General Question (Within 24 hrs)</option>
                        </select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Brief summary of your question"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 uppercase mb-1">
                        How can we help? <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        required
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please describe your question or issue in detail..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8] resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#1C1614] hover:bg-[#342721] text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting to Care Desk...' : 'Submit Support Message'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

