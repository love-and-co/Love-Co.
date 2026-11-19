import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { X, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import GoogleLoginButton from '../auth/GoogleLoginButton';

export default function AuthModal({ isOpen: propIsOpen, onClose: propOnClose, initialMethod }) {
  const router = useRouter();
  const storeIsOpen = useAuthStore((state) => state.isAuthModalOpen);
  const storeAuthMethod = useAuthStore((state) => state.authModalMethod);
  const closeStoreModal = useAuthStore((state) => state.closeAuthModal);
  const { login, loginWithGoogle, verifyPhoneOtp, isLoading, error: authError } = useAuthStore();

  const isVisible = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = propOnClose || closeStoreModal;

  // Form State - defaults to 'email' when initialMethod or storeAuthMethod is email
  const [authMethod, setAuthMethod] = useState(initialMethod || storeAuthMethod || 'email');

  useEffect(() => {
    if (initialMethod) {
      setAuthMethod(initialMethod);
    } else if (storeAuthMethod) {
      setAuthMethod(storeAuthMethod);
    }
  }, [initialMethod, storeAuthMethod, isVisible]);

  useEffect(() => {
    if (router && (router.query?.method === 'email' || router.pathname === '/login')) {
      setAuthMethod('email');
    } else if (router && router.query?.method === 'phone') {
      setAuthMethod('phone');
    }
  }, [router?.query, router?.pathname]);

  const [phone, setPhone] = useState('');
  const [notifyOffers, setNotifyOffers] = useState(true);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isVisible) return null;

  // Handle Phone Submit -> Send OTP
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!phone || phone.length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      const res = await api.sendOtp(phone);
      setOtpStep(true);
      setOtpHint(res.data.demoOtp || res.data.testOtpHint || '123456');
    } catch (err) {
      // Offline fallback: still permit verification with default test OTP
      setOtpStep(true);
      setOtpHint('123456');
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!otp) {
      setLocalError('Please enter the verification code.');
      return;
    }
    const res = await verifyPhoneOtp(phone, otp);
    if (res.success) {
      setSuccessMsg('Successfully authenticated! Welcome to Love & Co.');
      setTimeout(() => {
        handleClose();
        setOtpStep(false);
        setPhone('');
        setOtp('');
        setSuccessMsg('');
      }, 1000);
    } else {
      setLocalError(res.error || 'Invalid verification code. Please check and try again.');
    }
  };

  // Handle Email & Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    const res = await login(email, password);
    if (res.success) {
      setSuccessMsg('Welcome back!');
      setTimeout(() => {
        handleClose();
        setEmail('');
        setPassword('');
        setSuccessMsg('');
      }, 1000);
    } else {
      setLocalError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-brand-mocha-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Main Modal Card */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-brand-silver max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white border border-brand-silver text-brand-mocha hover:bg-brand-lavender-light hover:border-brand-lavender flex items-center justify-center shadow-xs transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Auth Form Container */}
        <div className="w-full flex flex-col justify-center bg-white">
          <div className="w-full space-y-6">
            {/* Modal Heading */}
            <div className="text-center space-y-2">
              <h2 className="font-serif-luxury text-2xl sm:text-3xl text-brand-mocha-900 tracking-tight font-normal">
                Sign in to your account
              </h2>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                Access your private skin logs, loyalty LoveCash &amp; express checkout.
              </p>
            </div>

            {/* Error or Success Alerts */}
            {localError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
                {localError}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-brand-lavender border border-brand-silver text-xs text-brand-mocha-900 font-bold rounded-lg flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-brand-mocha" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* PHONE AUTHENTICATION (DEFAULT) */}
            {authMethod === 'phone' ? (
              !otpStep ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  {/* Phone Input Box matching Ghar Soaps (+91 prefix) */}
                  <div>
                    <label className="block text-xs font-medium text-brand-mocha-900 mb-1.5 sr-only">
                      Mobile Number
                    </label>
                    <div className="flex border-2 border-brand-silver rounded-xl overflow-hidden focus-within:border-brand-mocha focus-within:ring-2 focus-within:ring-brand-lavender transition-all bg-white shadow-2xs">
                      <div className="px-3.5 py-3 bg-brand-lavender border-r-2 border-brand-silver text-xs font-mono-clinical font-bold text-brand-mocha-900 flex items-center select-none">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter Mobile Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-3 text-sm text-brand-mocha-900 placeholder-brand-mocha/40 focus:outline-none font-semibold bg-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Notification Checkbox */}
                  <label className="flex items-center space-x-2.5 text-xs text-brand-mocha/80 cursor-pointer select-none pt-0.5">
                    <input
                      type="checkbox"
                      checked={notifyOffers}
                      onChange={(e) => setNotifyOffers(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-mocha accent-brand-mocha focus:ring-brand-mocha cursor-pointer"
                    />
                    <span>Notify me for any updates &amp; offers</span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Sending Code...' : 'Submit'}
                  </button>
                </form>
              ) : (
                /* OTP STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-xs text-brand-mocha/70 font-sans">
                      Enter the 6-digit OTP sent to <strong className="text-brand-mocha-900">+91 {phone}</strong>
                    </span>
                  </div>

                  {/* Demo OTP Pill */}
                  <div className="p-2.5 bg-[#FAF8F5] border border-brand-silver rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-brand-mocha text-white text-[10px] font-mono-clinical font-bold tracking-wider uppercase">
                        Demo OTP
                      </span>
                      <span className="font-mono-clinical text-brand-mocha-900 font-bold tracking-widest text-sm">
                        {otpHint || '123456'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtp(otpHint || '123456');
                        setLocalError('');
                      }}
                      className="text-[11px] font-semibold text-brand-mocha hover:text-brand-mocha-900 underline cursor-pointer"
                    >
                      Click to Auto-fill
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-lg font-mono-clinical font-bold py-3 px-4 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-mocha focus:ring-1 focus:ring-brand-mocha transition-all text-brand-mocha-900 bg-brand-silver-light/20"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Log In'}
                  </button>

                  <div className="flex justify-between items-center text-xs pt-1 font-mono-clinical">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-brand-mocha/70 hover:text-brand-mocha-900 underline cursor-pointer"
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handlePhoneSubmit}
                      className="text-brand-mocha font-semibold hover:text-brand-mocha-900 underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* EMAIL & PASSWORD LOGIN */
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-brand-mocha-900 mb-1.5 sr-only">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 border border-brand-silver rounded-lg text-sm text-brand-mocha-900 placeholder-brand-mocha/40 focus:outline-none focus:border-brand-mocha focus:ring-1 focus:ring-brand-mocha transition-all font-medium bg-brand-silver-light/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-mocha-900 mb-1.5 sr-only">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 border border-brand-silver rounded-lg text-sm text-brand-mocha-900 placeholder-brand-mocha/40 focus:outline-none focus:border-brand-mocha focus:ring-1 focus:ring-brand-mocha transition-all font-medium bg-brand-silver-light/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t-2 border-brand-silver"></div>
              <span className="absolute bg-white px-3 text-[10px] font-mono-clinical uppercase tracking-wider text-neutral-500">
                Or continue with
              </span>
            </div>

            {/* Google Authentication Button */}
            <GoogleLoginButton onSuccess={() => handleClose()} />

            {/* Switch Between Phone and Email Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(authMethod === 'phone' ? 'email' : 'phone');
                  setLocalError('');
                }}
                className="text-xs text-brand-mocha/80 hover:text-brand-mocha-900 font-semibold underline cursor-pointer"
              >
                {authMethod === 'phone' ? 'Or log in with Email & Password' : 'Or log in with Mobile Number (+91)'}
              </button>
            </div>

            {/* Create New Account Option */}
            <div className="text-center pt-3 mt-1 border-t border-brand-silver flex items-center justify-center space-x-1.5">
              <span className="text-xs text-brand-mocha/60 font-sans">
                Don't have an account?
              </span>
              <Link
                href="/register"
                onClick={() => {
                  if (handleClose) handleClose();
                }}
                className="text-xs font-semibold text-brand-mocha-900 hover:text-brand-mocha underline cursor-pointer font-sans"
              >
                Create New Account
              </Link>
            </div>

            {/* Legal Terms & Privacy */}
            <p className="text-[11px] text-brand-mocha/50 text-center leading-relaxed">
              By logging in, you're agreeing to our{' '}
              <span className="underline hover:text-brand-mocha-900 cursor-pointer">Privacy Policy</span> and{' '}
              <span className="underline hover:text-brand-mocha-900 cursor-pointer">Terms of Service</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
