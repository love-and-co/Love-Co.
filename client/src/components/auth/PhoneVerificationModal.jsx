import React, { useState, useEffect } from 'react';
import { Phone, ShieldCheck, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';

export default function PhoneVerificationModal() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('123456');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Rate limiter timer
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Modal displays only if user is authenticated customer without verified phone
  const isAdmin = user?.role === 'admin';
  const cleanUserPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
  const isAlreadyVerified = Boolean(user?.isPhoneVerified && cleanUserPhone.length === 10);

  const isOpen = Boolean(
    isAuthenticated &&
    user &&
    !isAdmin &&
    !isAlreadyVerified &&
    (!user.isPhoneVerified || !cleanUserPhone)
  );

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendPhoneOtp(phone);
      setIsOtpSent(true);
      setCountdown(res.data.cooldownSeconds || 30);
      setDemoOtp(res.data?.demoOtp || res.data?.testOtpHint || '123456');
      setSuccessMsg(`Verification code sent to +91 ${phone}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.verifyPhoneOtp({ phone, otp });
      if (res.data?.success) {
        setSuccessMsg('Phone number verified successfully!');
        const normalizedPhone = (res.data.phone || phone).replace(/\D/g, '').slice(-10);
        if (res.data.token && typeof window !== 'undefined') {
          localStorage.setItem('love_co_token', res.data.token);
          document.cookie = `love_co_token=${res.data.token}; path=/; max-age=604800; SameSite=Lax`;
        }
        const updatedUser = res.data.user || {
          ...user,
          phone: normalizedPhone,
          isPhoneVerified: true,
        };
        setUser(updatedUser);
        setIsOtpSent(false);
      } else {
        setError(res.data?.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-[#1C1614]/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#EAE6DF] p-7 sm:p-9 shadow-2xl relative overflow-hidden space-y-6 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-monoClinical font-bold tracking-[0.25em] text-[#8C827A] uppercase">
            Mandatory Verification
          </span>
          <h2 className="font-serifLuxury text-2xl sm:text-3xl text-[#1C1614] font-normal tracking-tight">
            Complete Your Profile
          </h2>
          <p className="text-xs font-sans text-[#8C827A] max-w-xs mx-auto leading-relaxed">
            Please link and verify your 10-digit Indian mobile number to complete your registration.
          </p>
        </div>

        {/* User Context Badge */}
        {user?.email && (
          <div className="p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-center">
            <span className="text-[11px] font-sans text-[#8C827A]">
              Signed in as <strong className="text-[#1C1614]">{user.email}</strong>
            </span>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs font-sans text-emerald-800 flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600 stroke-[2.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verification Flow */}
        <div className="space-y-4">
          {/* Phone Input with +91 Badge */}
          <div>
            <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1.5">
              10-Digit Mobile Number
            </label>
            <div className="flex items-center border border-[#EAE6DF] rounded-xl overflow-hidden bg-[#FAF8F5] focus-within:border-[#1C1614] focus-within:bg-white transition-all shadow-2xs">
              <div className="px-3.5 py-3 bg-[#F4EFEA] border-r border-[#EAE6DF] text-xs font-monoClinical font-bold text-[#1C1614] flex items-center select-none">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                disabled={isOtpSent}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                className={`w-full px-3.5 py-3 text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none bg-transparent ${
                  isOtpSent ? 'opacity-70 bg-neutral-50 cursor-not-allowed' : ''
                }`}
                autoFocus
              />
              {isOtpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="mr-3 text-[11px] font-monoClinical text-[#8C827A] hover:text-[#1C1614] underline whitespace-nowrap cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {!isOtpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSending || phone.length !== 10}
              className="w-full py-3.5 px-6 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl shadow-xs transition-all duration-200 text-xs sm:text-sm font-monoClinical font-bold uppercase tracking-[0.18em] flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  <span>Sending Code...</span>
                </span>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
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
                    setOtp(demoOtp);
                    setError('');
                  }}
                  className="text-[11px] font-serif font-semibold text-[#8C6D3F] hover:text-[#1C1614] underline cursor-pointer transition-colors"
                >
                  Click to Auto-fill
                </button>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSending || countdown > 0}
                    className="text-[10.5px] font-monoClinical text-[#8C827A] hover:text-[#1C1614] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  className="w-full px-3.5 py-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-center font-monoClinical font-bold text-lg tracking-[0.45em] text-[#1C1614] placeholder:text-[#C4BCB5] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                  autoFocus
                />
              </div>

              {/* Verify & Continue Button */}
              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full py-3.5 px-6 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl shadow-xs transition-all duration-200 text-xs sm:text-sm font-monoClinical font-bold uppercase tracking-[0.18em] flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center space-x-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify &amp; Continue</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info & Logout Option */}
        <div className="pt-3 border-t border-[#EAE6DF] flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-sans text-[#8C827A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1C1614]/70 stroke-[2]" />
            <span>Used strictly for order updates and deliveries</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-[11px] font-monoClinical text-[#8C827A] hover:text-[#1C1614] underline cursor-pointer"
          >
            Sign out &amp; switch account
          </button>
        </div>
      </div>
    </div>
  );
}