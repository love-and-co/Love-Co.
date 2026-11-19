import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Phone OTP Verification States
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [demoOtp, setDemoOtp] = useState('123456');

  const redirectTarget =
    router.isReady && router.query.redirect && typeof router.query.redirect === 'string'
      ? router.query.redirect
      : '/catalog';

  useEffect(() => {
    if (isAuthenticated && router.isReady) {
      router.push(redirectTarget);
    }
  }, [isAuthenticated, router.isReady, redirectTarget, router]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCountdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleSendOtp = async () => {
    setLocalError('');
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setLocalError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await api.sendPhoneOtp(formData.phone);
      setIsOtpSent(true);
      setOtpCountdown(res.data.cooldownSeconds || 30);
      setDemoOtp(res.data.demoOtp || res.data.testOtpHint || '123456');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLocalError('');
    if (phoneOtp.length !== 6) {
      setLocalError('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyPhoneOtp({ phone: formData.phone, otp: phoneOtp });
      if (res.data.verified && res.data.phoneVerificationToken) {
        setPhoneVerificationToken(res.data.phoneVerificationToken);
        setIsPhoneVerified(true);
        setIsOtpSent(false);
      } else {
        setLocalError(res.data.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Invalid verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (!isPhoneVerified || !phoneVerificationToken) {
      setLocalError('Please verify your 10-digit mobile number before creating an account.');
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      phoneVerificationToken,
      password: formData.password,
    };

    const res = await register(payload);
    if (res.success) {
      router.push(redirectTarget);
    } else {
      setLocalError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Create an Account — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Join Love & Co. to track orders, save your wishlist, and earn 10-order ritual rewards."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 text-[#1C1614]">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-[#EAE6DF] p-7 sm:p-10 shadow-sm relative overflow-hidden space-y-6 sm:space-y-7">
          {/* Header Block */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-monoClinical font-bold tracking-[0.25em] text-[#8C827A] uppercase">
              Join Love &amp; Co.
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl text-[#1C1614] font-normal tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs font-sans text-[#8C827A] max-w-sm mx-auto leading-relaxed">
              Join Love &amp; Co. to track orders, save your wishlist, and earn 10-order ritual rewards.
            </p>
          </div>

          {/* Checkout Notice */}
          {router.isReady && router.query.redirect === '/checkout' && (
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-sans text-[#1C1614] text-center font-medium animate-fadeIn">
              Create an account to securely access checkout and confirm your order.
            </div>
          )}

          {/* Error Alert */}
          {(error || localError) && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* 1. Primary Social Login */}
          <div>
            <GoogleLoginButton buttonText="Continue with Google" redirectUrl={redirectTarget} />
          </div>

          {/* Hairline Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-[#EAE6DF]"></div>
            <span className="absolute bg-white px-3 text-[10px] font-monoClinical uppercase tracking-[0.18em] text-[#8C827A] select-none">
              or register with email
            </span>
          </div>

          {/* 2. Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full Name & Email Address (Side-by-side on sm/md/lg/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#5C3A2E]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    autoFocus
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[#5C3A2E]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Phone Number (Mandatory with OTP verification) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider">
                  Mobile Number <span className="text-[#5C3A2E]">*</span>
                </label>
                {isPhoneVerified && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-monoClinical font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Input Box with Country Badge and Send OTP button */}
              <div className={`flex items-center border rounded-xl overflow-hidden transition-all shadow-2xs ${
                isPhoneVerified
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-[#FAF8F5] border-[#EAE6DF] focus-within:border-[#1C1614] focus-within:bg-white'
              }`}>
                {/* +91 Pill */}
                <div className="px-3.5 py-3 bg-[#F4EFEA] border-r border-[#EAE6DF] text-xs font-monoClinical font-bold text-[#1C1614] flex items-center select-none flex-shrink-0 space-x-1">
                  <span>+91</span>
                </div>

                {/* 10-Digit Input */}
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  disabled={isPhoneVerified}
                  placeholder="Enter 10-digit mobile"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData((prev) => ({ ...prev, phone: val }));
                    setLocalError('');
                  }}
                  className={`flex-1 min-w-0 px-3.5 py-3 text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none bg-transparent ${
                    isPhoneVerified ? 'cursor-not-allowed font-medium text-[#1C1614]' : ''
                  }`}
                />

                {/* Action Button: Send OTP / Resend / Verified */}
                <div className="pr-2 flex-shrink-0">
                  {!isPhoneVerified ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || otpCountdown > 0 || formData.phone.length !== 10}
                      className="px-3.5 py-2 text-[11px] font-monoClinical font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer bg-[#1C1614] text-[#FAF8F5] hover:bg-[#2E2420] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-2xs"
                    >
                      {isSendingOtp ? (
                        <span className="flex items-center space-x-1.5">
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
                          <span>Sending...</span>
                        </span>
                      ) : otpCountdown > 0 ? (
                        `Resend (${otpCountdown}s)`
                      ) : isOtpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  ) : (
                    <div className="px-2 py-1 flex items-center space-x-1 text-emerald-700 text-xs font-semibold">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upgraded Inline OTP Verification Box */}
              {isOtpSent && !isPhoneVerified && (
                <div className="mt-3 p-4 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl space-y-3 animate-fadeIn shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-sans text-[#8C827A]">
                    <span>
                      Enter 6-digit OTP sent to <strong className="text-[#1C1614] font-monoClinical">+91 {formData.phone}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpSent(false);
                        setPhoneOtp('');
                        setLocalError('');
                      }}
                      className="text-[11px] font-monoClinical text-[#5C3A2E] hover:underline cursor-pointer"
                    >
                      Edit Number
                    </button>
                  </div>

                  {/* Demo OTP Pill */}
                  <div className="p-2.5 bg-[#F4EFEB] border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#1C1614] text-[#FAF8F5] text-[10px] font-monoClinical font-bold tracking-wider uppercase">
                        Demo OTP
                      </span>
                      <span className="font-monoClinical text-[#1C1614] font-bold tracking-widest text-sm">
                        {demoOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOtp(demoOtp);
                        setLocalError('');
                      }}
                      className="text-[11px] font-serif font-semibold text-[#8C6D3F] hover:text-[#1C1614] underline cursor-pointer transition-colors"
                    >
                      Click to Auto-fill
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={phoneOtp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPhoneOtp(val);
                          setLocalError('');
                        }}
                        className="w-full text-center text-lg tracking-[0.45em] font-monoClinical font-bold py-2.5 px-3 bg-white border border-[#EAE6DF] rounded-xl text-[#1C1614] placeholder:text-[#C4BCB5] focus:outline-none focus:border-[#1C1614] focus:ring-1 focus:ring-[#1C1614] shadow-2xs"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || phoneOtp.length !== 6}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] text-xs font-monoClinical font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
                    >
                      {isVerifyingOtp ? (
                        <span className="flex items-center justify-center space-x-1.5">
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-sans text-[#8C827A] pt-0.5">
                    <span>Valid for 5 minutes</span>
                    {otpCountdown > 0 ? (
                      <span className="font-monoClinical text-[#8C827A]">
                        Resend in <strong className="text-[#1C1614]">{otpCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="font-monoClinical font-bold text-[#5C3A2E] hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Success Toast Notice */}
              {isPhoneVerified && (
                <div className="mt-2.5 p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center space-x-2 text-xs font-sans text-emerald-800 animate-fadeIn">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>Mobile number verified for order tracking &amp; ritual rewards.</span>
                </div>
              )}
            </div>

            {/* Row 3: Password */}
            <div>
              <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1.5">
                Password <span className="text-[#5C3A2E]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="•••••••• (Min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-11 py-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8C827A] hover:text-[#1C1614] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !isPhoneVerified}
                className="w-full py-3.5 px-6 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl shadow-xs transition-all duration-200 text-xs sm:text-sm font-monoClinical font-bold uppercase tracking-[0.18em] flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
              {!isPhoneVerified && (
                <p className="text-center text-[11px] font-sans text-[#8C827A] pt-2">
                  Please verify your 10-digit mobile number via OTP to continue.
                </p>
              )}
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-[#EAE6DF] text-center text-xs font-sans text-[#8C827A]">
            Already have an account?{' '}
            <Link
              href={
                redirectTarget !== '/catalog'
                  ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
                  : '/login'
              }
              className="text-[#1C1614] font-semibold hover:underline inline-flex items-center space-x-1 transition-colors"
            >
              <span>Sign In</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Luxury Encrypted Guarantee */}
          <div className="flex items-center justify-center space-x-2 text-[11px] font-sans text-[#8C827A] pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1C1614]/70 stroke-[2]" />
            <span>Encrypted Apothecary Vault &bull; 100% Confidential</span>
          </div>
        </div>
      </div>
    </>
  );
}
