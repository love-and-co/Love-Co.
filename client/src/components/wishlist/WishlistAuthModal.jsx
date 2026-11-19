import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Heart, X, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import GoogleLoginButton from '../auth/GoogleLoginButton';

export default function WishlistAuthModal() {
  const router = useRouter();
  const { isAuthPromptOpen, closeAuthPrompt, pendingWishlistProduct, syncPendingItem } =
    useWishlistStore();
  const { login, register, isLoading, error: authStoreError } = useAuthStore();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isAuthPromptOpen) return null;

  const product = pendingWishlistProduct;
  const primaryImage =
    product?.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary)?.url || product.images[0].url
      : product?.image || '/images/products/bloom_neem_turmeric_soap.jpg';

  const handlePostAuthSuccess = async () => {
    await syncPendingItem();
    closeAuthPrompt();
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setLocalError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      await handlePostAuthSuccess();
    } else {
      setLocalError(res.error || 'Invalid email or password.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    const res = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() ? phone.trim() : undefined,
      password,
    });

    if (res.success) {
      await handlePostAuthSuccess();
    } else {
      setLocalError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1614]/60 backdrop-blur-xs transition-opacity"
        onClick={closeAuthPrompt}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white border border-[#EAE6DF] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 z-10 space-y-5">
        {/* Close Button */}
        <button
          onClick={closeAuthPrompt}
          className="absolute top-4 right-4 p-2 text-[#8C827A] hover:text-[#1C1614] bg-[#FAF8F5] hover:bg-[#F0ECE6] rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] mx-auto flex items-center justify-center shadow-xs">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 stroke-[1.5]" />
          </div>

          <h2 className="font-serifLuxury text-2xl sm:text-3xl text-[#1C1614] font-normal tracking-tight">
            Sign In to Save Your Favorites
          </h2>

          <p className="text-xs font-sans text-[#8C827A] max-w-xs mx-auto leading-relaxed">
            Create or sign in to your Love &amp; Co. account to sync saved apothecary items across devices.
          </p>
        </div>

        {/* Pending Product Pill */}
        {product && (
          <div className="p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl flex items-center space-x-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-white border border-[#EAE6DF] flex-shrink-0">
              <img
                src={primaryImage}
                alt={product.name || 'Botanical formulation'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[9.5px] font-monoClinical font-bold uppercase tracking-wider text-[#8C827A] block">
                Pending Wishlist Save
              </span>
              <h4 className="text-xs font-bold text-[#1C1614] truncate">
                {product.name}
              </h4>
            </div>
            <span className="font-monoClinical text-xs font-bold text-[#1C1614] pr-1">
              ₹{product.price || 499}
            </span>
          </div>
        )}

        {/* Google Authentication */}
        <div>
          <GoogleLoginButton
            buttonText="Continue with Google"
            onSuccess={handlePostAuthSuccess}
          />
        </div>

        {/* Hairline Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-[#EAE6DF]"></div>
          <span className="absolute bg-white px-3 text-[10px] font-monoClinical uppercase tracking-[0.18em] text-[#8C827A] select-none">
            or
          </span>
        </div>

        {/* Two-Tab Switcher: Sign In | Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLocalError('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#1C1614] shadow-xs'
                : 'text-[#8C827A] hover:text-[#1C1614]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLocalError('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#1C1614] shadow-xs'
                : 'text-[#8C827A] hover:text-[#1C1614]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {(localError || authStoreError) && (
          <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{localError || authStoreError}</span>
          </div>
        )}

        {/* Tab 1: Sign In Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-[10.5px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1 text-left">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C827A] absolute left-3 top-3" />
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-monoClinical font-bold text-[#1C1614] uppercase tracking-wider mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C827A] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError('');
                  }}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs font-sans text-[#1C1614] placeholder:text-[#B0A8A0] focus:outline-none focus:border-[#1C1614] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8C827A] hover:text-[#1C1614] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl text-xs font-monoClinical font-bold uppercase tracking-[0.18em] transition-all duration-200 shadow-xs cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In & Save'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Tab 2: Create Account Notice & Link */}
        {activeTab === 'register' && (
          <div className="space-y-4 py-3 text-center animate-fadeIn">
            <p className="text-xs font-sans text-[#8C827A] leading-relaxed">
              New accounts require verified 10-digit Indian mobile number via OTP for secure order tracking and delivery.
            </p>
            <button
              type="button"
              onClick={() => {
                closeAuthPrompt();
                router.push('/register');
              }}
              className="w-full py-3 px-4 bg-[#1C1614] hover:bg-[#2E2420] text-[#FAF8F5] rounded-xl text-xs font-monoClinical font-bold uppercase tracking-[0.18em] transition-all duration-200 shadow-xs cursor-pointer flex items-center justify-center space-x-2 group"
            >
              <span>Continue to Create Account</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* Subtle Encrypted Guarantee */}
        <div className="flex items-center justify-center space-x-1.5 text-[10.5px] font-sans text-[#8C827A] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1C1614]/70 stroke-[2]" />
          <span>Encrypted Account Security &bull; Auto-saves to your Wishlist</span>
        </div>
      </div>
    </div>
  );
}
