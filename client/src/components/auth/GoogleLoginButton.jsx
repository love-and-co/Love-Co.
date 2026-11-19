import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGoogleLogin } from '@react-oauth/google';
import { Phone, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';

export default function GoogleLoginButton({
  redirectUrl = '/',
  onSuccess,
  onError,
  buttonText = 'Continue with Google',
}) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Post-Google Phone Verification Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await loginWithGoogle({ accessToken: tokenResponse.access_token });
      if (res.success) {
        const userEmail = (res.user?.email || '').toLowerCase().trim();
        const isAdmin = res.user?.role === 'admin' || userEmail === 'loveandcoadmin@gmail.com';
        const cleanPhone = (res.user?.phone || '').replace(/\D/g, '').slice(-10);
        const isAlreadyVerified = Boolean(res.user?.isPhoneVerified && cleanPhone.length === 10);
        const requiresPhonePrompt = !isAdmin && !isAlreadyVerified && Boolean(res.needsPhoneVerification);

        // Only prompt modal if customer has no verified phone and is not admin
        if (requiresPhonePrompt) {
          setPendingUser(res.user);
          setShowPhoneModal(true);
        } else {
          if (onSuccess) onSuccess(res.user);
          const targetPath = isAdmin ? '/admin' : redirectUrl;
          router.push(targetPath);
        }
      } else {
        const err = res.error || 'Google login failed';
        setErrorMessage(err);
        if (onError) onError(err);
      }
    } catch (err) {
      console.error('Google login error', err);
      const errText = 'Google authentication encountered an error. Please try again.';
      setErrorMessage(errText);
      if (onError) onError(errText);
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (err) => {
      console.warn('Google OAuth popup closed or error:', err);
      const msg = 'Could not complete Google Sign-in. Please try again or use email.';
      setErrorMessage(msg);
      if (onError) onError(msg);
    },
    scope: 'email profile https://www.googleapis.com/auth/user.phonenumbers.read',
  });

  const handleSendPhoneOtp = async () => {
    setModalError('');
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setModalError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.sendPhoneOtp(cleanPhone);
      setOtpSent(true);
      setOtpTimer(res.data?.cooldownSeconds || 30);
      setDevOtpHint(res.data?.demoOtp || res.data?.testOtpHint || '123456');
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to dispatch SMS verification code.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setModalError('');
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    if (!otpInput || otpInput.trim().length !== 6) {
      setModalError('Please enter the 6-digit verification code.');
      return;
    }

    setModalLoading(true);
    try {
      const verifyRes = await api.verifyPhoneOtp({
        phone: cleanPhone,
        otp: otpInput.trim(),
      });

      if (verifyRes.data?.verified || verifyRes.data?.success) {
        if (verifyRes.data.token && typeof window !== 'undefined') {
          localStorage.setItem('love_co_token', verifyRes.data.token);
          document.cookie = `love_co_token=${verifyRes.data.token}; path=/; max-age=604800; SameSite=Lax`;
        }

        const updatedUser = verifyRes.data.user || {
          ...pendingUser,
          phone: cleanPhone,
          isPhoneVerified: true,
        };

        // Update local auth store
        if (typeof window !== 'undefined') {
          localStorage.setItem('love_co_user', JSON.stringify(updatedUser));
        }
        useAuthStore.setState({ user: updatedUser });

        setShowPhoneModal(false);
        if (onSuccess) onSuccess(updatedUser);
        const userEmail = (updatedUser?.email || '').toLowerCase().trim();
        const isAdmin = updatedUser?.role === 'admin' || userEmail === 'loveandcoadmin@gmail.com';
        const targetPath = isAdmin ? '/admin' : redirectUrl;
        router.push(targetPath);
      } else {
        setModalError('Verification code did not match.');
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Invalid or expired verification code.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => triggerGoogleLogin()}
        disabled={loading}
        className="w-full py-3.5 px-4 bg-white hover:bg-[#E6E0F0]/40 border-2 border-brand-silver hover:border-brand-mocha/40 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-2xs hover:shadow-xs group cursor-pointer disabled:opacity-60"
      >
        {/* Official Google G Logo */}
        <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span className="font-sans font-semibold text-xs sm:text-sm text-brand-mocha-900 tracking-normal">
          {loading ? 'Authenticating with Google...' : buttonText}
        </span>
      </button>

      {errorMessage && (
        <p className="text-[11px] font-monoClinical text-red-600 text-center animate-fadeIn">
          {errorMessage}
        </p>
      )}

      {/* Post-Google Phone Verification Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF8F5] border-2 border-[#E8E3EE] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E8E3EE] text-[#1C1614] flex items-center justify-center shadow-xs mb-3">
                <Phone className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif-luxury text-2xl text-[#1C1614] font-normal">
                One Last Step
              </h3>
              <p className="text-xs font-sans text-[#1C1614]/70 max-w-xs mx-auto leading-relaxed">
                Verify your mobile number for real-time delivery alerts, OTP dispatch tracking &amp; checkout protection.
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Step 1: Enter Phone Number */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#1C1614] uppercase tracking-wider mb-1.5 font-sans">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-monoClinical font-bold text-[#1C1614]/70 border-r-2 border-brand-silver pr-2.5 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={otpSent}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-24 py-3 bg-white border-2 border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha transition-all disabled:bg-gray-100"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={modalLoading || phoneInput.length !== 10}
                      className="absolute right-2 px-3 py-1.5 bg-[#2A211D] hover:bg-[#1C1614] text-[#FAF8F5] text-xs font-medium rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {modalLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: Inline OTP Entry */}
              {otpSent && (
                <div className="space-y-3 pt-2 border-t border-brand-silver/60 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#1C1614] uppercase tracking-wider font-sans">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpInput('');
                      }}
                      className="text-[11px] text-[#1C1614]/60 hover:text-[#1C1614] underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full text-center py-3 bg-white border-2 border-[#C5A880] rounded-xl text-lg font-mono tracking-widest text-[#1C1614] focus:outline-none"
                  />

                  {devOtpHint && (
                    <div className="p-2.5 bg-[#F4EFEB] border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#1C1614] text-[#FAF8F5] text-[10px] font-mono font-bold tracking-wider uppercase">
                          Demo OTP
                        </span>
                        <span className="font-mono text-[#1C1614] font-bold tracking-widest text-sm">
                          {devOtpHint}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInput(devOtpHint);
                          setModalError('');
                        }}
                        className="text-[11px] font-serif font-semibold text-[#8C6D3F] hover:text-[#1C1614] underline cursor-pointer transition-colors"
                      >
                        Click to Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={otpTimer > 0 || modalLoading}
                      onClick={handleSendPhoneOtp}
                      className="text-xs font-mono text-[#1C1614]/70 hover:text-[#1C1614] disabled:opacity-50 cursor-pointer"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </button>

                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={modalLoading || otpInput.length !== 6}
                      className="px-5 py-2.5 bg-[#1C1614] hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <span>{modalLoading ? 'Verifying...' : 'Confirm OTP'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
