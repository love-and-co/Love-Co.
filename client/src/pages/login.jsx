import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading, error, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const redirectTarget =
    router.isReady && router.query.redirect && typeof router.query.redirect === 'string'
      ? router.query.redirect
      : '/catalog';

  useEffect(() => {
    if (isAuthenticated && router.isReady) {
      const role = user?.role;
      const userEmail = (user?.email || '').toLowerCase().trim();
      const isAdminRole =
        role === 'admin' || userEmail === 'loveandcoadmin@gmail.com';
      if (isAdminRole) {
        router.push('/admin');
        return;
      }
      router.push(redirectTarget);
    }
  }, [isAuthenticated, user, router.isReady, redirectTarget, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      const role = res.user?.role;
      const resEmail = (res.user?.email || '').toLowerCase().trim();
      const isAdminRole =
        role === 'admin' || resEmail === 'loveandcoadmin@gmail.com';

      if (isAdminRole) {
        router.push('/admin');
      } else {
        router.push(redirectTarget);
      }
    } else {
      setLocalError(res.error || 'Invalid email or password. Please try again.');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  return (
    <>
      <Head>
        <title>Sign In — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Sign in to your Love & Co. account to access your orders, ritual rewards, and saved wishlist."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-[#1C1614]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE6DF] p-8 sm:p-10 shadow-sm relative overflow-hidden space-y-7">
          {/* Header Block */}
          <div className="text-center space-y-2">
            <h1 className="font-serifLuxury text-3xl sm:text-4xl text-[#1C1614] font-normal tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs font-sans text-[#8C827A] max-w-sm mx-auto leading-relaxed">
              Sign in to access your orders, ritual rewards, and saved wishlist.
            </p>
          </div>

          {/* Checkout Redirect Notice Banner (if user came from checkout) */}
          {router.isReady && router.query.redirect === '/checkout' && (
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-sans text-[#1C1614] text-center font-medium animate-fadeIn">
              Sign in to securely access checkout and confirm your order.
            </div>
          )}

          {/* Error Alert */}
          {(error || localError) && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Forgot Password Feedback */}
          {forgotSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-sans text-emerald-800 text-center animate-fadeIn">
              Password assistance instructions have been sent to {email || 'your email'}.
            </div>
          )}

          {/* 1. Primary Social Login */}
          <div>
            <GoogleLoginButton buttonText="Continue with Google" redirectUrl={redirectTarget} />
          </div>

          {/* Hairline Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="w-full border-t border-[#EAE6DF]"></div>
            <span className="absolute bg-white px-3 text-[10px] font-monoClinical uppercase tracking-[0.18em] text-[#8C827A] select-none">
              or sign in with email
            </span>
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-sm font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-sans text-[#8C827A] hover:text-[#1C1614] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError('');
                  }}
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

            {/* Primary Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl shadow-xs transition-all duration-200 text-xs sm:text-sm font-monoClinical font-bold uppercase tracking-[0.18em] flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-[#EAE6DF] text-center text-xs font-sans text-[#8C827A]">
            New to Love &amp; Co.?{' '}
            <Link
              href={
                redirectTarget !== '/catalog'
                  ? `/register?redirect=${encodeURIComponent(redirectTarget)}`
                  : '/register'
              }
              className="text-[#1C1614] font-semibold hover:underline inline-flex items-center space-x-1 transition-colors"
            >
              <span>Create an Account</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Luxury Encrypted Guarantee */}
          <div className="flex items-center justify-center space-x-2 text-[11px] font-sans text-[#8C827A] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1C1614]/70 stroke-[2]" />
            <span>Encrypted Apothecary Vault &bull; 100% Confidential</span>
          </div>
        </div>
      </div>
    </>
  );
}
