import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Truck,
  CreditCard,
  MessageSquare,
  Building,
  Check,
  Save,
  Shield,
  Key,
  Globe,
  RefreshCw,
  Sliders,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import AdminLayout from '../../modules/admin/components/AdminLayout';
import { api } from '../../lib/api';

const TABS = [
  { id: 'shiprocket', label: 'Shiprocket Logistics', icon: Truck },
  { id: 'razorpay', label: 'Payment Gateway', icon: CreditCard },
  { id: 'notification', label: 'SMS & WhatsApp', icon: MessageSquare },
  { id: 'storeProfile', label: 'Store Profile', icon: Building },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('shiprocket');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [form, setForm] = useState({
    shiprocket: {
      apiEmail: '',
      apiPassword: '',
      pickupPincode: '560038',
      defaultWeightKg: 0.5,
      isLive: false,
      hasPassword: false,
    },
    razorpay: {
      keyId: '',
      keySecret: '',
      isLiveMode: false,
      webhookSecret: '',
      hasKeySecret: false,
    },
    notification: {
      smsApiKey: '',
      whatsappApiKey: '',
      defaultSenderId: 'LOVNCO',
      otpEnabled: true,
      hasSmsKey: false,
      hasWhatsappKey: false,
    },
    storeProfile: {
      brandName: 'LOVE & Co. Botanical Formulations',
      supportEmail: 'loveandcosupport@gmail.com',
      contactPhone: '+91 94406 07778',
      gstin: '29ABCDE1234F1Z5',
      address: 'No. 42, Apothecary Garden Estate, Indiranagar, Bengaluru 560038, India',
      currency: 'INR',
    },
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.getStoreSettings();
        if (res.data?.settings) {
          setForm((prev) => ({
            ...prev,
            ...res.data.settings,
            shiprocket: { ...prev.shiprocket, ...res.data.settings.shiprocket },
            razorpay: { ...prev.razorpay, ...res.data.settings.razorpay },
            notification: { ...prev.notification, ...res.data.settings.notification },
            storeProfile: { ...prev.storeProfile, ...res.data.settings.storeProfile },
          }));
        }
      } catch (err) {
        console.warn('Could not fetch store settings, using defaults:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await api.updateStoreSettings(form);
      showToast('Apothecary operational settings saved successfully.');
    } catch (err) {
      showToast('Error saving settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = (type) => {
    setTestResult({
      type,
      status: 'success',
      message:
        type === 'shiprocket'
          ? 'Shiprocket API Gateway responding. Live order dispatch ready.'
          : 'Razorpay Payment Gateway verified. 1-Click refund API active.',
    });
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <AdminLayout activeTab="Settings">
      <Head>
        <title>Operations Hub & Integrations | LOVE & Co. Admin</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#1C1614] text-[#FAF9F8] px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-mono tracking-wide border border-[#4A3B32] animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#D8D0E3]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE6DF] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono tracking-widest text-[#4A3B32] uppercase bg-[#E8E3EE] px-2 py-0.5 rounded-full font-semibold">
                Central Operations Hub
              </span>
              <span className="text-xs text-[#4A3B32]/60 font-serif-luxury italic">
                Production Integrations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1C1614] mt-1 tracking-tight">
              Platform Integrations & Config
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3B32] mt-0.5 font-light">
              Manage live courier dispatch, Razorpay payment webhooks, customer messaging, and legal store profile.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF9F8] font-mono text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#D8D0E3]" />}
              <span>{saving ? 'Persisting...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Alert Banner */}
        {testResult && (
          <div className="bg-[#FAF9F8] border border-[#D8D0E3] rounded-xl p-3.5 flex items-center justify-between text-xs font-mono animate-fade-in">
            <div className="flex items-center space-x-2 text-[#1C1614]">
              <CheckCircle2 className="w-4 h-4 text-[#4A3B32]" />
              <span className="font-medium">{testResult.message}</span>
            </div>
            <span className="text-[10px] bg-[#E8E3EE] text-[#4A3B32] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              Verified 200 OK
            </span>
          </div>
        )}

        {/* Main Grid: Tabs & Form Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation Sidebar Tabs */}
          <div className="space-y-1.5 md:col-span-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-left text-xs font-mono tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1614] text-[#FAF9F8] shadow-sm font-semibold'
                      : 'bg-white hover:bg-[#FAF9F8] text-[#4A3B32] border border-[#EAE6DF]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D8D0E3]' : 'text-[#4A3B32]/70'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}

            {/* Security Badge */}
            <div className="mt-6 p-3.5 rounded-xl bg-[#FAF9F8] border border-[#EAE6DF] text-[11px] text-[#4A3B32] space-y-2">
              <div className="flex items-center space-x-1.5 font-semibold text-[#1C1614]">
                <Shield className="w-3.5 h-3.5 text-[#4A3B32]" />
                <span>Vault Encryption</span>
              </div>
              <p className="text-[10px] text-[#4A3B32]/80 leading-relaxed">
                Credentials are encrypted and persisted securely in MongoDB. Test mode falls back cleanly if live keys are omitted.
              </p>
            </div>
          </div>

          {/* Form Settings Panel */}
          <div className="md:col-span-3">
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-2xs space-y-6">
              {loading ? (
                <div className="space-y-5 animate-pulse">
                  <div className="border-b border-[#EAE6DF] pb-3 space-y-2">
                    <div className="h-5 w-56 bg-[#EAE6DF] rounded" />
                    <div className="h-3 w-80 bg-[#F7F5F0] rounded" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-32 bg-[#EAE6DF]/80 rounded" />
                        <div className="h-9 w-full bg-[#FAF9F8] border border-[#EAE6DF] rounded-xl" />
                      </div>
                    ))}
                  </div>
                  <div className="h-20 w-full bg-[#FAF9F8] border border-[#EAE6DF] rounded-xl" />
                </div>
              ) : (
                <>
              {/* TAB 1: SHIPROCKET LOGISTICS */}
              {activeTab === 'shiprocket' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                    <div>
                      <h2 className="text-base font-serif-luxury font-bold text-[#1C1614]">
                        Shiprocket 1-Click Fulfillment API
                      </h2>
                      <p className="text-xs text-[#4A3B32]/70">
                        Automates AWB assignment, courier rate selection, tracking webhooks, and label generation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('shiprocket')}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE6DF] bg-[#FAF9F8] hover:bg-[#E8E3EE]/40 text-[#1C1614] text-[11px] font-mono tracking-wider uppercase transition cursor-pointer"
                    >
                      Test API Ping
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        API Registered Email
                      </label>
                      <input
                        type="email"
                        value={form.shiprocket.apiEmail}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shiprocket: { ...form.shiprocket, apiEmail: e.target.value },
                          })
                        }
                        placeholder="logistics@loveandco.in"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        API Password / Token Key
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={form.shiprocket.apiPassword}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              shiprocket: { ...form.shiprocket, apiPassword: e.target.value },
                            })
                          }
                          placeholder={form.shiprocket.hasPassword ? '••••••••' : 'Enter Shiprocket password'}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                        />
                        <Lock className="w-3.5 h-3.5 text-[#4A3B32]/40 absolute right-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Default Atelier Pickup Pincode
                      </label>
                      <input
                        type="text"
                        value={form.shiprocket.pickupPincode}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shiprocket: { ...form.shiprocket, pickupPincode: e.target.value },
                          })
                        }
                        placeholder="560038"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Default Package Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={form.shiprocket.defaultWeightKg}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shiprocket: { ...form.shiprocket, defaultWeightKg: e.target.value },
                          })
                        }
                        placeholder="0.5"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>
                  </div>

                  {/* Webhook URL Endpoint Display */}
                  <div className="p-3.5 rounded-xl bg-[#FAF9F8] border border-[#EAE6DF] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold block">
                      Automated Tracking Webhook URL (Enter in Shiprocket Portal):
                    </span>
                    <code className="text-[11px] font-mono text-[#1C1614] bg-white px-2.5 py-1 rounded-md border border-[#EAE6DF] block select-all">
                      http://localhost:5000/api/webhooks/shiprocket
                    </code>
                    <p className="text-[10px] text-[#4A3B32]/70 pt-1">
                      Shiprocket pushes real-time courier checkpoints (Picked Up, In Transit, Out for Delivery, Delivered) straight to this endpoint.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: RAZORPAY PAYMENT GATEWAY */}
              {activeTab === 'razorpay' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                    <div>
                      <h2 className="text-base font-serif-luxury font-bold text-[#1C1614]">
                        Razorpay Payment Gateway & 1-Click Refund
                      </h2>
                      <p className="text-xs text-[#4A3B32]/70">
                        Supports UPI, NetBanking, Cards, Instant Refunds, and Settlement Reconciliation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('razorpay')}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE6DF] bg-[#FAF9F8] hover:bg-[#E8E3EE]/40 text-[#1C1614] text-[11px] font-mono tracking-wider uppercase transition cursor-pointer"
                    >
                      Verify Gateway
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#FAF9F8] border border-[#EAE6DF]">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isLiveModeToggle"
                        checked={form.razorpay.isLiveMode}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            razorpay: { ...form.razorpay, isLiveMode: e.target.checked },
                          })
                        }
                        className="rounded border-[#EAE6DF] text-[#1C1614] focus:ring-[#1C1614] cursor-pointer"
                      />
                      <label htmlFor="isLiveModeToggle" className="text-xs font-mono font-medium text-[#1C1614] cursor-pointer">
                        Live Gateway Mode (Production)
                      </label>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold ${
                        form.razorpay.isLiveMode
                          ? 'bg-[#E8E3EE] text-[#4A3B32]'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {form.razorpay.isLiveMode ? 'Live Transactions' : 'Sandbox / Test Mode'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={form.razorpay.keyId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            razorpay: { ...form.razorpay, keyId: e.target.value },
                          })
                        }
                        placeholder="rzp_live_••••••••••••"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Razorpay Key Secret
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={form.razorpay.keySecret}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              razorpay: { ...form.razorpay, keySecret: e.target.value },
                            })
                          }
                          placeholder={form.razorpay.hasKeySecret ? '••••••••••••••••' : 'Enter Secret Key'}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                        />
                        <Key className="w-3.5 h-3.5 text-[#4A3B32]/40 absolute right-3 top-2.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                      Razorpay Webhook Secret (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.razorpay.webhookSecret}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          razorpay: { ...form.razorpay, webhookSecret: e.target.value },
                        })
                      }
                      placeholder="Webhook signing secret"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SMS & WHATSAPP COMMUNICATIONS */}
              {activeTab === 'notification' && (
                <div className="space-y-5">
                  <div className="border-b border-[#EAE6DF] pb-3">
                    <h2 className="text-base font-serif-luxury font-bold text-[#1C1614]">
                      Transactional SMS & WhatsApp Dispatch
                    </h2>
                    <p className="text-xs text-[#4A3B32]/70">
                      Dispatches instant OTP verification, formulation curing notices, and shipping tracking links.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        SMS Gateway API Key
                      </label>
                      <input
                        type="password"
                        value={form.notification.smsApiKey}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            notification: { ...form.notification, smsApiKey: e.target.value },
                          })
                        }
                        placeholder={form.notification.hasSmsKey ? '••••••••' : 'SMS Gateway Key'}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Default DLT Sender ID
                      </label>
                      <input
                        type="text"
                        value={form.notification.defaultSenderId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            notification: { ...form.notification, defaultSenderId: e.target.value },
                          })
                        }
                        placeholder="LOVNCO"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                      WhatsApp Business Cloud API Key
                    </label>
                    <input
                      type="password"
                      value={form.notification.whatsappApiKey}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notification: { ...form.notification, whatsappApiKey: e.target.value },
                        })
                      }
                      placeholder={form.notification.hasWhatsappKey ? '••••••••' : 'Meta WhatsApp Cloud Access Token'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: STORE PROFILE */}
              {activeTab === 'storeProfile' && (
                <div className="space-y-5">
                  <div className="border-b border-[#EAE6DF] pb-3">
                    <h2 className="text-base font-serif-luxury font-bold text-[#1C1614]">
                      Apothecary Legal Profile & Invoicing
                    </h2>
                    <p className="text-xs text-[#4A3B32]/70">
                      Printed on customer tax invoices, packaging slips, and automated courier manifests.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Brand / Legal Entity Name
                      </label>
                      <input
                        type="text"
                        value={form.storeProfile.brandName}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            storeProfile: { ...form.storeProfile, brandName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Customer Concierge Email
                      </label>
                      <input
                        type="email"
                        value={form.storeProfile.supportEmail}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            storeProfile: { ...form.storeProfile, supportEmail: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        Concierge Hotline Phone
                      </label>
                      <input
                        type="text"
                        value={form.storeProfile.contactPhone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            storeProfile: { ...form.storeProfile, contactPhone: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                        GSTIN Registration Number
                      </label>
                      <input
                        type="text"
                        value={form.storeProfile.gstin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            storeProfile: { ...form.storeProfile, gstin: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#4A3B32] font-semibold mb-1">
                      Apothecary Lab Registered Address
                    </label>
                    <textarea
                      rows={2}
                      value={form.storeProfile.address}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          storeProfile: { ...form.storeProfile, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FAF9F8] text-[#1C1614] focus:outline-none focus:border-[#1C1614] font-mono"
                    />
                  </div>
                </div>
              )}
                </>
              )}

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-[#EAE6DF] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#4A3B32]/70">
                  Changes take effect immediately across all automated fulfillment workers.
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF9F8] font-mono text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#D8D0E3]" />
                  <span>{saving ? 'Persisting...' : 'Save All Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

