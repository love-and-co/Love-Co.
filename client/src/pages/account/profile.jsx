import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  User,
  Package,
  LogOut,
  Check,
  Heart,
  ArrowRight,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ShoppingBag,
  Plus,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Gift,
  Sparkles,
  Stamp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../lib/api';
import RitualCardSection from '../../components/loyalty/RitualCardSection';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, addAddress, deleteAddress, setUser } = useAuthStore();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const { addItem: addToCart, openDrawer: openCartDrawer } = useCartStore();

  const [activeTab, setActiveTab] = useState('ritual'); // 'ritual' | 'personal' | 'orders' | 'addresses' | 'wishlist'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loyalty, setLoyalty] = useState(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  // Personal Info Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Profile Phone OTP Edit State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneInput, setEditPhoneInput] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [demoPhoneOtp, setDemoPhoneOtp] = useState('123456');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');

  // Resend Countdown Timer for Profile Phone Edit
  useEffect(() => {
    let timer = null;
    if (phoneCountdown > 0) {
      timer = setInterval(() => {
        setPhoneCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phoneCountdown]);

  // Add Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState({
    recipientName: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressErrorMsg, setAddressErrorMsg] = useState('');
  const [addressSuccessMsg, setAddressSuccessMsg] = useState('');

  // Handle URL tab query parameter if provided (e.g. /account/profile?tab=orders)
  useEffect(() => {
    if (router.query.tab && ['ritual', 'loyalty', 'personal', 'orders', 'addresses', 'wishlist'].includes(router.query.tab)) {
      setActiveTab(router.query.tab === 'loyalty' ? 'ritual' : router.query.tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddressData((prev) => ({
        ...prev,
        recipientName: user.fullName || '',
      }));
    }

    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const res = await api.getUserOrders();
        setOrders(res.data.orders || []);
      } catch (err) {
        console.warn('Could not load user orders', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    async function loadLoyalty() {
      setLoadingLoyalty(true);
      try {
        const res = await api.getLoyaltyStatus();
        if (res.data?.data) {
          setLoyalty(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load user loyalty rewards', err);
      } finally {
        setLoadingLoyalty(false);
      }
    }

    loadOrders();
    loadLoyalty();
  }, [isAuthenticated, user, router]);

  const handleUpdatePersonalInfo = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileErrorMsg('Full name cannot be empty');
      return;
    }
    setIsSavingProfile(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    // If customer edited name, send fullName (keeps current phone untouched)
    const res = await updateProfile({ fullName: fullName.trim() });
    setIsSavingProfile(false);
    if (res.success) {
      setProfileSuccessMsg('Personal information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } else {
      setProfileErrorMsg(res.error || 'Failed to update personal information');
    }
  };

  const handleSendProfilePhoneOtp = async () => {
    setPhoneErrorMsg('');
    setPhoneSuccessMsg('');
    const cleanPhone = editPhoneInput.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneErrorMsg('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (cleanPhone === (user?.phone || '').replace(/\D/g, '').slice(-10)) {
      setPhoneErrorMsg('The entered phone number is identical to your current phone number.');
      return;
    }

    setIsSendingPhoneOtp(true);
    try {
      const res = await api.sendPhoneOtp(cleanPhone);
      setIsPhoneOtpSent(true);
      setPhoneCountdown(res.data?.cooldownSeconds || 30);
      setDemoPhoneOtp(res.data?.demoOtp || res.data?.testOtpHint || '123456');
      setPhoneSuccessMsg(`Verification code sent to +91 ${cleanPhone}`);
    } catch (err) {
      setPhoneErrorMsg(err.response?.data?.error || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyProfilePhoneOtp = async () => {
    setPhoneErrorMsg('');
    setPhoneSuccessMsg('');
    const cleanPhone = editPhoneInput.replace(/\D/g, '').slice(-10);

    if (phoneOtp.length !== 6) {
      setPhoneErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingPhoneOtp(true);
    try {
      const res = await api.verifyPhoneOtp({ phone: cleanPhone, otp: phoneOtp });
      if (res.data?.success) {
        const updatedUser = res.data.user || {
          ...user,
          phone: cleanPhone,
          isPhoneVerified: true,
        };
        setUser(updatedUser);
        setPhone(cleanPhone);
        setIsEditingPhone(false);
        setIsPhoneOtpSent(false);
        setPhoneOtp('');
        setPhoneErrorMsg('');
        setProfileSuccessMsg('Phone number updated & verified successfully.');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setPhoneErrorMsg(res.data?.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setPhoneErrorMsg(err.response?.data?.error || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addressData.street || !addressData.city || !addressData.state || !addressData.pincode) {
      setAddressErrorMsg('Please fill in street, city, state, and pincode');
      return;
    }

    setIsSavingAddress(true);
    setAddressErrorMsg('');
    setAddressSuccessMsg('');

    const res = await addAddress(addressData);
    setIsSavingAddress(false);
    if (res.success) {
      setAddressSuccessMsg('Delivery address saved successfully.');
      setShowAddressForm(false);
      setAddressData({
        recipientName: user?.fullName || '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false,
      });
      setTimeout(() => setAddressSuccessMsg(''), 3000);
    } else {
      setAddressErrorMsg(res.error || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      await deleteAddress(addressId);
    }
  };

  const handleMoveWishlistToBag = (product) => {
    addToCart(product, 1);
    openCartDrawer();
  };

  if (!user) return null;

  const savedAddresses = user.savedAddresses || [];
  const wishlistItemCount = wishlistItems?.length || 0;

  return (
    <>
      <Head>
        <title>My Account — Love &amp; Co.</title>
      </Head>

      <div className="bg-brand-canvas min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-brand-mocha-900">
        <div className="max-w-6xl mx-auto space-y-7">
          {/* TOP PROFILE HERO CARD */}
          <div className="bg-[#F2EDF7] rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-mocha via-brand-lavender to-brand-mocha" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
              {/* User Avatar & Info */}
              <div className="flex items-center space-x-4 sm:space-x-5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-brand-mocha text-white flex items-center justify-center font-serifLuxury text-2xl sm:text-3xl font-light shadow-md ring-4 ring-white flex-shrink-0">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h1 className="font-serifLuxury text-2xl sm:text-3xl font-normal text-brand-mocha-900 tracking-wide">
                    {user.fullName}
                  </h1>
                  <div className="flex items-center gap-3 text-xs font-sans text-brand-mocha-900/60 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand-mocha/50" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <>
                        <span className="text-brand-silver">•</span>
                        <span className="flex items-center gap-1.5 font-monoClinical font-semibold text-brand-mocha-900">
                          <Phone className="w-3.5 h-3.5 text-brand-mocha/50" />
                          {user.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {user.role === 'admin' && ['loveandcosupport@gmail.com', 'loveandcoadmin@gmail.com'].includes((user.email || '').toLowerCase().trim()) && (
                  <Link
                    href="/admin/inventory"
                    className="px-4 py-2.5 bg-brand-lavender hover:bg-brand-lavender-hover text-brand-mocha-900 border-2 border-brand-silver rounded-xl text-xs font-monoClinical uppercase font-bold tracking-wider transition-colors shadow-2xs"
                  >
                    Admin Portal
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-brand-lavender border-2 border-brand-silver text-brand-mocha-900 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION PILLS */}
            <div className="flex items-center gap-2.5 pt-6 mt-6 border-t-2 border-brand-silver overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('ritual')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ritual'
                    ? 'bg-[#1C1614] text-[#FAF8F5] shadow-md border-2 border-[#C5A880]'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#1C1614] border-2 border-[#C5A880]/60'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Loyalty Card &amp; Rewards</span>
                <span
                  className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-monoClinical font-bold ${
                    activeTab === 'ritual'
                      ? 'bg-[#C5A880] text-[#1C1614]'
                      : 'bg-[#E8E3EE] text-[#1C1614] border border-[#1C1614]/10'
                  }`}
                >
                  {loyalty?.ritualStamps || 0}/10
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'personal'
                    ? 'bg-brand-mocha text-white shadow-md'
                    : 'bg-white hover:bg-brand-lavender text-brand-mocha-900 border-2 border-brand-silver'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal Info</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-brand-mocha text-white shadow-md'
                    : 'bg-white hover:bg-brand-lavender text-brand-mocha-900 border-2 border-brand-silver'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Order History</span>
                <span
                  className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-monoClinical font-bold ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-brand-lavender text-brand-mocha-900 border border-brand-silver'
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'addresses'
                    ? 'bg-brand-mocha text-white shadow-md'
                    : 'bg-white hover:bg-brand-lavender text-brand-mocha-900 border-2 border-brand-silver'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Saved Addresses</span>
                <span
                  className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-monoClinical font-bold ${
                    activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-brand-lavender text-brand-mocha-900 border border-brand-silver'
                  }`}
                >
                  {savedAddresses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'wishlist'
                    ? 'bg-brand-mocha text-white shadow-md'
                    : 'bg-white hover:bg-brand-lavender text-brand-mocha-900 border-2 border-brand-silver'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeTab === 'wishlist' ? 'fill-white' : 'text-brand-mocha fill-brand-mocha/30'}`} />
                <span>Wishlist</span>
                <span
                  className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-monoClinical font-bold ${
                    activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-brand-lavender text-brand-mocha-900 border border-brand-silver'
                  }`}
                >
                  {wishlistItemCount}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 0: LOYALTY CARD & REWARDS */}
          {activeTab === 'ritual' && (
            <RitualCardSection
              loyalty={loyalty}
              onLoyaltyUpdate={setLoyalty}
              user={user}
            />
          )}

          {/* TAB 1: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-3xl border border-brand-silver p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-brand-silver pb-4">
                <h3 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal">
                  Personal Details
                </h3>
                <p className="text-xs font-sans text-brand-mocha-900/60 mt-1">
                  Manage your primary account name and contact information for shipping alerts.
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-4 bg-brand-lavender-light border border-brand-lavender rounded-2xl text-brand-mocha-900 text-xs font-sans flex items-center space-x-2">
                  <Check className="w-4 h-4 text-brand-mocha stroke-[2.5]" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-sans flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 stroke-[2]" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePersonalInfo} className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-2 font-sans">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-canvas border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender transition-all"
                    placeholder="e.g. Eleanor Vance"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-2 font-sans">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-3 bg-brand-silver-light/60 border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900/50 cursor-not-allowed"
                  />
                  <p className="text-[11px] font-sans text-brand-mocha-900/50 mt-1">
                    Email address is tied to your account login and order receipts.
                  </p>
                </div>

                {/* Mobile Number Section with Mandatory OTP Verification for Edits */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider font-sans">
                    Verified Mobile Number
                  </label>

                  {/* DISPLAY MODE: Verified Phone Badge & Edit/Change Button */}
                  {!isEditingPhone ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-brand-canvas border border-brand-silver rounded-xl gap-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-brand-mocha flex-shrink-0" />
                        <span className="font-monoClinical font-bold text-sm text-brand-mocha-900 tracking-wider">
                          {user?.phone ? `+91 ${user.phone}` : 'No phone linked'}
                        </span>
                        {user?.isPhoneVerified && user?.phone ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-monoClinical font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-monoClinical font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span>Unverified</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPhone(true);
                          setEditPhoneInput(user?.phone || '');
                          setIsPhoneOtpSent(false);
                          setPhoneOtp('');
                          setPhoneErrorMsg('');
                          setPhoneSuccessMsg('');
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-brand-lavender text-brand-mocha-900 border border-brand-silver rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                      >
                        {user?.phone ? 'Edit / Change' : 'Add Mobile Number'}
                      </button>
                    </div>
                  ) : (
                    /* EDIT MODE: Phone Input + Send OTP + OTP Verification Form */
                    <div className="p-4 bg-[#FAF8F5] border-2 border-brand-silver rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-sans text-brand-mocha-900/70">
                        <span>Enter new 10-digit Indian mobile number</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPhone(false);
                            setIsPhoneOtpSent(false);
                            setPhoneOtp('');
                            setPhoneErrorMsg('');
                            setPhoneSuccessMsg('');
                          }}
                          className="text-[11px] font-monoClinical text-brand-mocha hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Phone Input with +91 and Send OTP Button */}
                      <div className="flex rounded-xl overflow-hidden border border-brand-silver bg-white focus-within:border-brand-mocha focus-within:ring-1 focus-within:ring-brand-mocha shadow-2xs">
                        <div className="px-3.5 py-2.5 bg-brand-lavender border-r border-brand-silver text-xs font-monoClinical font-bold text-brand-mocha-900 flex items-center select-none">
                          +91
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          disabled={isPhoneOtpSent}
                          placeholder="Enter 10-digit mobile number"
                          value={editPhoneInput}
                          onChange={(e) => {
                            setEditPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                            setPhoneErrorMsg('');
                          }}
                          className="w-full px-3.5 py-2.5 text-sm font-monoClinical font-semibold text-brand-mocha-900 placeholder:text-brand-mocha-900/30 focus:outline-none bg-transparent"
                          autoFocus
                        />
                        {!isPhoneOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendProfilePhoneOtp}
                            disabled={isSendingPhoneOtp || !/^[6-9]\d{9}$/.test(editPhoneInput) || editPhoneInput === user?.phone}
                            className="px-4 py-2.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-monoClinical font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {isSendingPhoneOtp ? 'Sending...' : 'Send OTP'}
                          </button>
                        ) : null}
                      </div>

                      {/* Feedback error/success specific to phone edit */}
                      {phoneErrorMsg && (
                        <p className="text-xs text-red-600 font-sans">{phoneErrorMsg}</p>
                      )}
                      {phoneSuccessMsg && (
                        <p className="text-xs text-emerald-700 font-sans font-semibold">{phoneSuccessMsg}</p>
                      )}

                      {/* OTP Verification Box */}
                      {isPhoneOtpSent && (
                        <div className="pt-2 space-y-3 border-t border-brand-silver/70 animate-fadeIn">
                          {/* Demo OTP One-Click Pill */}
                          <div className="p-2.5 bg-[#F4EFEB] border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#1C1614] text-[#FAF8F5] text-[10px] font-monoClinical font-bold tracking-wider uppercase">
                                Demo OTP
                              </span>
                              <span className="font-monoClinical text-[#1C1614] font-bold tracking-widest text-sm">
                                {demoPhoneOtp}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneOtp(demoPhoneOtp);
                                setPhoneErrorMsg('');
                              }}
                              className="text-[11px] font-serif font-semibold text-[#8C6D3F] hover:text-[#1C1614] underline cursor-pointer transition-colors"
                            >
                              Click to Auto-fill
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2.5">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="• • • • • •"
                              value={phoneOtp}
                              onChange={(e) => {
                                setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setPhoneErrorMsg('');
                              }}
                              className="flex-1 text-center text-lg tracking-[0.45em] font-monoClinical font-bold py-2.5 px-3 bg-white border border-brand-silver rounded-xl text-brand-mocha-900 focus:outline-none focus:border-brand-mocha shadow-2xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleVerifyProfilePhoneOtp}
                              disabled={isVerifyingPhoneOtp || phoneOtp.length !== 6}
                              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-monoClinical font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
                            >
                              {isVerifyingPhoneOtp ? 'Verifying...' : 'Verify & Update Number'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-sans text-brand-mocha-900/60">
                            <span>Valid for 5 minutes</span>
                            {phoneCountdown > 0 ? (
                              <span className="font-monoClinical">
                                Resend in <strong>{phoneCountdown}s</strong>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendProfilePhoneOtp}
                                disabled={isSendingPhoneOtp}
                                className="font-monoClinical font-bold text-brand-mocha hover:underline cursor-pointer"
                              >
                                Resend Code
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl shadow-xs hover:shadow-sm transition-all text-xs font-sans font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Personal Information</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-brand-silver">
                <div className="flex items-center space-x-3 text-brand-mocha-900/60 text-xs font-sans">
                  <ShieldCheck className="w-4 h-4 text-brand-mocha" />
                  <span>Your personal contact information is protected and never shared with third parties.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-brand-silver p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-brand-silver pb-4">
                <div>
                  <h3 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal">
                    Order History
                  </h3>
                  <p className="text-xs font-sans text-brand-mocha-900/60 mt-1">
                    Track the fulfillment timeline and dispatch status of your cold-pressed batches.
                  </p>
                </div>
                <span className="text-xs font-monoClinical px-3 py-1 rounded-full bg-brand-lavender text-brand-mocha-900 border border-brand-lavender-hover font-semibold">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-brand-mocha-900/50 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-mocha" />
                  <span className="text-xs font-sans">Retrieving your order history...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-brand-canvas border border-brand-silver flex items-center justify-center text-brand-mocha/40">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h4 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">
                    No Orders Placed Yet
                  </h4>
                  <p className="text-xs font-sans text-brand-mocha-900/60 max-w-sm mx-auto leading-relaxed">
                    Your small-batch botanical soaps and curated regimens will appear here with live dispatch tracking once ordered.
                  </p>
                  <div className="pt-3">
                    <Link
                      href="/catalog"
                      className="inline-flex items-center px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-xs"
                    >
                      Explore Products &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-white border border-brand-silver hover:border-brand-mocha/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-serifLuxury text-lg font-semibold text-brand-mocha-900">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-monoClinical font-bold uppercase tracking-wider ${
                                ord.fulfillmentStatus === 'DELIVERED'
                                  ? 'bg-brand-lavender text-brand-mocha-900 border border-brand-lavender-hover'
                                  : ord.fulfillmentStatus === 'PLACED'
                                  ? 'bg-brand-mocha text-white border border-brand-mocha'
                                  : 'bg-brand-silver-light text-brand-mocha-900 border border-brand-silver'
                              }`}
                            >
                              {ord.fulfillmentStatus}
                            </span>
                          </div>

                          <div className="text-xs font-sans text-brand-mocha-900/60 mt-1.5 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-mocha/50" />
                              {new Date(ord.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-brand-silver">•</span>
                            <span>{ord.items?.length || 0} {ord.items?.length === 1 ? 'Product' : 'Products'}</span>
                            {ord.paymentDetails?.provider && (
                              <>
                                <span className="text-brand-silver">•</span>
                                <span className="text-brand-mocha font-monoClinical">
                                  {ord.paymentDetails.provider}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className="font-monoClinical font-bold text-lg text-brand-mocha-900 block">
                            ₹{ord.totalAmount || ord.grandTotal}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-brand-silver flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] font-sans text-brand-mocha-900/50">
                          Small-batch cold-pressed inventory
                        </span>
                        <Link
                          href={`/orders/${ord.orderNumber}`}
                          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-brand-mocha hover:text-brand-mocha-900 transition-colors group cursor-pointer"
                        >
                          <span>Track Order &amp; Details</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Atelier Assurance callout */}
              <div className="p-4 bg-brand-lavender-light border border-brand-lavender rounded-2xl text-xs font-sans text-brand-mocha-900 flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5 stroke-[2]" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-brand-mocha-900 block mb-0.5">30-Day Biocompatibility Assurance</span>
                  Every Love &amp; Co. purchase includes complimentary clinical reformulation consultations if any skin barrier reactivity occurs.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-brand-silver p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-brand-silver pb-4 flex-wrap gap-3">
                <div>
                  <h3 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal">
                    Saved Delivery Addresses
                  </h3>
                  <p className="text-xs font-sans text-brand-mocha-900/60 mt-1">
                    Manage default shipping destinations for swift botanical dispatch.
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="px-4 py-2.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {addressSuccessMsg && (
                <div className="p-4 bg-brand-lavender-light border border-brand-lavender rounded-2xl text-brand-mocha-900 text-xs font-sans flex items-center space-x-2">
                  <Check className="w-4 h-4 text-brand-mocha stroke-[2.5]" />
                  <span>{addressSuccessMsg}</span>
                </div>
              )}

              {/* ADD ADDRESS FORM (COLLAPSIBLE) */}
              {showAddressForm && (
                <form
                  onSubmit={handleCreateAddress}
                  className="bg-brand-canvas border border-brand-silver rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-brand-silver">
                    <h4 className="font-serifLuxury text-lg text-brand-mocha-900">
                      New Shipping Address
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-xs font-sans text-brand-mocha-900/60 hover:text-brand-mocha-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {addressErrorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-sans flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{addressErrorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={addressData.recipientName}
                        onChange={(e) => setAddressData({ ...addressData, recipientName: e.target.value })}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        placeholder="House / Flat No., Street, Landmark"
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressData.pincode}
                        onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                        placeholder="e.g. 400001"
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans font-monoClinical text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-mocha-900 uppercase tracking-wider mb-1 font-sans">
                        Country
                      </label>
                      <input
                        type="text"
                        value={addressData.country}
                        onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-brand-silver rounded-xl text-sm font-sans text-brand-mocha-900 focus:outline-none focus:border-brand-mocha focus:ring-2 focus:ring-brand-lavender"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressData.isDefault}
                        onChange={(e) => setAddressData({ ...addressData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-brand-mocha rounded border-brand-silver focus:ring-brand-mocha"
                      />
                      <label htmlFor="isDefault" className="text-xs font-sans text-brand-mocha-900/80 cursor-pointer">
                        Set as primary default delivery destination
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddress ? 'Saving Address...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-3 bg-transparent hover:bg-brand-lavender-light text-brand-mocha-900/70 hover:text-brand-mocha-900 rounded-xl text-xs font-sans transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* ADDRESS CARDS LIST */}
              {savedAddresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-brand-canvas border border-brand-silver flex items-center justify-center text-brand-mocha/40">
                    <MapPin className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h4 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal">
                    No Saved Addresses
                  </h4>
                  <p className="text-xs font-sans text-brand-mocha-900/60 max-w-sm mx-auto">
                    Save your shipping address now to enable one-click checkout and seamless dispatch alerts.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Delivery Address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="bg-white border border-brand-silver rounded-2xl p-5 space-y-3 relative hover:border-brand-mocha/40 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-brand-silver">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-brand-mocha" />
                          <span className="font-serifLuxury text-base font-semibold text-brand-mocha-900">
                            {addr.recipientName || user.fullName}
                          </span>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[10px] font-monoClinical px-2 py-0.5 rounded bg-brand-lavender text-brand-mocha-900 border border-brand-lavender-hover uppercase font-semibold">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-sans text-brand-mocha-900/70 space-y-1 leading-relaxed">
                        <p>{addr.street}</p>
                        <p>
                          {addr.city}, {addr.state} —{' '}
                          <span className="font-monoClinical text-brand-mocha font-medium">
                            {addr.pincode}
                          </span>
                        </p>
                        <p>{addr.country || 'India'}</p>
                      </div>

                      <div className="pt-2 border-t border-brand-silver flex justify-end">
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-brand-mocha-900/40 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remove address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b-2 border-brand-silver pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal">
                    Saved Products (Wishlist)
                  </h3>
                  <p className="text-xs font-sans text-brand-mocha-900/70 mt-1">
                    Botanical products preserved for your personal daily regimen.
                  </p>
                </div>
                <span className="text-xs font-monoClinical px-3.5 py-1.5 rounded-full bg-brand-mocha text-white font-bold shadow-2xs">
                  {wishlistItemCount} {wishlistItemCount === 1 ? 'Product' : 'Products'}
                </span>
              </div>

              {wishlistItemCount === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha shadow-sm">
                    <Heart className="w-9 h-9 stroke-[1.7] fill-brand-mocha/30" />
                  </div>
                  <h4 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal">
                    Your Wishlist is Empty
                  </h4>
                  <p className="text-xs font-sans text-brand-mocha-900/70 max-w-sm mx-auto leading-relaxed">
                    Save your desired cold-pressed soaps, lip balms, and botanical regimens while exploring our collection.
                  </p>
                  <div className="pt-3">
                    <Link
                      href="/catalog"
                      className="inline-flex items-center px-7 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md"
                    >
                      Discover Products &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((item) => (
                    <div
                      key={item._id || item.slug}
                      className="bg-white border-2 border-brand-silver hover:border-brand-mocha rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs hover:shadow-md group"
                    >
                      <div className="space-y-3">
                        {/* Product Image */}
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-brand-canvas border border-brand-silver">
                          <Image
                            src={item.image || (item.images && item.images[0]?.url) || '/images/products/bloom_neem_turmeric_soap.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => removeWishlistItem(item._id || item.slug)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-[#E6E0F0] text-brand-mocha border border-brand-silver flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] font-monoClinical uppercase tracking-wider text-brand-mocha font-bold block">
                            {item.category || 'Botanical Formula'}
                          </span>
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-serifLuxury text-base text-brand-mocha-900 hover:text-brand-mocha transition-colors font-medium line-clamp-1 mt-0.5"
                          >
                            {item.name}
                          </Link>
                          {item.activesConcentration && (
                            <span className="text-[11px] font-sans text-brand-mocha-900/60 line-clamp-1 mt-0.5">
                              {item.activesConcentration}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-brand-silver flex items-center justify-between">
                        <span className="font-monoClinical font-bold text-base text-brand-mocha-900">
                          ₹{item.price}
                        </span>
                        <button
                          onClick={() => handleMoveWishlistToBag(item)}
                          className="px-4 py-2 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-lg text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
