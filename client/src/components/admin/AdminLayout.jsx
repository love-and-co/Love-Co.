import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Compass,
  ShoppingCart,
  Package,
  Layers,
  Sparkles,
  Users,
  BarChart3,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Store,
  ChevronRight,
  Radio
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { playOrderChime } from '../../lib/audioAlert';
import CloseStoreModal from './CloseStoreModal';

export const SIDEBAR_NAV = [
  {
    id: 'overview',
    name: 'Overview',
    href: '/admin',
    icon: Compass,
    badgeKey: null,
  },
  {
    id: 'orders',
    name: 'Orders & Dispatch',
    href: '/admin/orders',
    icon: ShoppingCart,
    badgeKey: 'pendingOrders',
  },
  {
    id: 'inventory',
    name: 'Catalog & Stock',
    href: '/admin/inventory',
    icon: Package,
    badgeKey: 'lowStock',
  },
  {
    id: 'combos',
    name: 'Ritual Bundles',
    href: '/admin/combos',
    icon: Layers,
    badgeKey: null,
  },
  {
    id: 'customers',
    name: 'Customers & CRM',
    href: '/admin/customers',
    icon: Users,
    badgeKey: null,
  },
  {
    id: 'analytics',
    name: 'Analytics & PDFs',
    href: '/admin/analytics',
    icon: BarChart3,
    badgeKey: null,
  },
];

let sessionAuthVerified = false;

export default function AdminLayout({ children, pageTitle = 'Atelier Command' }) {
  const router = useRouter();
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(sessionAuthVerified);
  const [checkingAuth, setCheckingAuth] = useState(!sessionAuthVerified);

  // Store status & Audio alert states
  const [storeStatus, setStoreStatus] = useState({ isPaused: false });
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveBadges, setLiveBadges] = useState({ pendingOrders: 0, lowStock: 0 });
  const [recentOrderAlert, setRecentOrderAlert] = useState(null);

  useEffect(() => {
    if (!sessionAuthVerified) {
      initializeAuth();
    }
  }, [initializeAuth]);

  // Strict Admin Guard: ONLY loveandcoadmin@gmail.com with role === 'admin'
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('love_co_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('love_co_user') : null;

    if (!token && !isAuthenticated) {
      sessionAuthVerified = false;
      router.replace('/');
      return;
    }

    let currentUser = user;
    if (!currentUser && storedUser && storedUser.trim() && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        currentUser = null;
      }
    }

    if (currentUser) {
      const email = (currentUser.email || '').toLowerCase().trim();
      const role = currentUser.role;
      const isStrictAdmin = role === 'admin' && email === 'loveandcoadmin@gmail.com';

      if (!isStrictAdmin) {
        sessionAuthVerified = false;
        router.replace('/');
        return;
      } else {
        sessionAuthVerified = true;
        setIsAuthorized(true);
      }
    }
    setCheckingAuth(false);
  }, [isAuthenticated, user, router]);

  // Load store status & live sidebar badges
  const loadSidebarBadges = async () => {
    try {
      const [statusRes, kpiRes] = await Promise.all([
        api.getStoreStatus().catch(() => null),
        api.getOperationsKpis().catch(() => null),
      ]);
      if (statusRes?.data?.success) {
        setStoreStatus(statusRes.data.storeStatus);
      }
      if (kpiRes?.data?.success) {
        setLiveBadges({
          pendingOrders: kpiRes.data.kpis?.activeFulfillmentQueue || 0,
          lowStock: kpiRes.data.kpis?.lowStockCount || 0,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadSidebarBadges();
  }, [isAuthorized]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!isAuthorized) return;
    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) setSocketConnected(true);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onOrderCreated = (orderData) => {
      if (audioAlertsEnabled) {
        playOrderChime();
      }
      setRecentOrderAlert({
        orderNumber: orderData.orderNumber || orderData.orderId || 'New Ritual Placed',
        amount: orderData.totalAmount || orderData.amount || 0,
        customer: orderData.customerName || 'Apothecary Patron',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      loadSidebarBadges();
      setTimeout(() => setRecentOrderAlert(null), 9000);
    };

    const onStatusUpdate = () => loadSidebarBadges();
    const onStoreUpdate = (newStatus) => setStoreStatus(newStatus);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('order:created', onOrderCreated);
    socket.on('order:status_update', onStatusUpdate);
    socket.on('catalog:update', onStatusUpdate);
    socket.on('store:status_update', onStoreUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:created', onOrderCreated);
      socket.off('order:status_update', onStatusUpdate);
      socket.off('catalog:update', onStatusUpdate);
      socket.off('store:status_update', onStoreUpdate);
    };
  }, [isAuthorized, audioAlertsEnabled]);

  const handleTestChime = () => {
    playOrderChime();
  };

  const handleSignOut = () => {
    logout();
    router.replace('/');
  };

  if (checkingAuth || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border border-[#E6DDD0] rounded-2xl shadow-sm max-w-sm">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xs font-serif tracking-widest uppercase text-[#1C1614]">
            Authenticating Atelier Workspace
          </h2>
          <p className="text-[11px] text-stone-500 mt-1">Verifying encrypted tokens for loveandcoadmin@gmail.com...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1C1614] flex font-sans selection:bg-[#C5A880]/20 selection:text-[#1C1614]">
      {/* ─────────────────────────────────────────────────────────────
          1. PERSISTENT LEFT SIDEBAR (240px Desktop)
      ───────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 bg-[#1C1614] text-[#FAF8F5] flex-col justify-between fixed inset-y-0 left-0 z-50 border-r border-[#2A2220] shadow-xl">
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">
          {/* Brand Logo & Atelier Eyebrow */}
          <div className="p-6 border-b border-stone-800/80">
            <Link href="/admin" className="block group">
              <span className="font-serif text-lg tracking-[0.22em] text-[#FAF8F5] font-light block group-hover:text-[#C5A880] transition-colors">
                LOVE &amp; CO.
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#C5A880] font-mono mt-0.5 block">
                Atelier Back-Office
              </span>
            </Link>

            {/* Socket connection pill */}
            <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 mt-3 pt-3 border-t border-stone-800/60">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{socketConnected ? 'Live Gateway Sync' : 'Socket Offline'}</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 mt-2">
            {SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? router.pathname === '/admin'
                  : router.pathname === item.href || router.pathname.startsWith(item.href + '/');

              const badgeCount = item.badgeKey ? liveBadges[item.badgeKey] : null;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#C5A880] text-[#1C1614] font-semibold shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/70 font-normal'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1C1614]' : 'text-[#C5A880]'}`} />
                    <span>{item.name}</span>
                  </div>

                  {/* Live Count Badges */}
                  {badgeCount > 0 && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#1C1614] text-[#FAF8F5]'
                          : item.badgeKey === 'lowStock'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-[#C5A880]/25 text-[#C5A880] border border-[#C5A880]/40'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Signed-in User Info & Logout */}
        <div className="p-4 border-t border-stone-800/80 bg-[#15100F] space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 flex items-center justify-center font-serif text-xs font-semibold">
              {(user?.fullName || 'Kalyan').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-[#FAF8F5] truncate">{user?.fullName || 'Kalyan'} <span className="text-[10px] text-[#C5A880] font-sans font-medium">(Admin)</span></p>
              <p className="text-[10px] text-stone-400 font-mono truncate">{user?.email || 'loveandcoadmin@gmail.com'}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 py-2 text-xs text-stone-400 hover:text-rose-400 hover:bg-stone-900/60 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-[#1C1614] text-[#FAF8F5] flex flex-col justify-between p-6 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <span className="font-serif text-base tracking-[0.2em] text-[#FAF8F5]">LOVE &amp; CO.</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {SIDEBAR_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${
                        isActive ? 'bg-[#C5A880] text-[#1C1614] font-semibold' : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 py-2 text-xs text-stone-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE WITH TOP HEADER (Spaced 240px on Desktop)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        {/* Clean Sticky Top Bar */}
        <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6DDD0] h-16 px-6 lg:px-8 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif text-lg text-[#1C1614] font-medium tracking-wide">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Storefront Open/Paused Pill */}
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border ${
                storeStatus.isPaused
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${storeStatus.isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="hidden sm:inline">
                {storeStatus.isPaused ? 'Storefront: Paused' : 'Storefront: Open'}
              </span>
              <span className="text-[10px] text-stone-500 underline">Change</span>
            </button>

            {/* Audio Alerts & Test Chime Toggle */}
            <div className="hidden sm:flex items-center space-x-1 bg-stone-100 rounded-full p-1 border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                title={audioAlertsEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
                className={`p-1.5 rounded-full transition-colors ${
                  audioAlertsEnabled ? 'text-[#C5A880] hover:text-[#1C1614]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleTestChime}
                title="Test apothecary chime alarm"
                className="text-[10px] text-stone-600 hover:text-[#1C1614] px-2 py-0.5 rounded transition-colors flex items-center space-x-1"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Test Chime</span>
              </button>
            </div>

            {/* View Live Storefront ↗ */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif tracking-wider transition-all shadow-xs"
            >
              <span>Live Storefront</span>
              <ExternalLink className="w-3 h-3 text-[#C5A880]" />
            </Link>
          </div>
        </header>

        {/* Real-time Incoming Order Alert */}
        {recentOrderAlert && (
          <div className="mx-6 lg:mx-8 mt-4 bg-[#1C1614] text-[#FAF8F5] border border-[#C5A880] p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#C5A880]/20 rounded-xl text-[#C5A880]">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#C5A880]">
                  New Ritual Order Handcrafted!
                </span>
                <p className="text-xs font-semibold text-white">
                  Order #{recentOrderAlert.orderNumber} • ₹{recentOrderAlert.amount} from {recentOrderAlert.customer} ({recentOrderAlert.time})
                </p>
              </div>
            </div>
            <Link
              href="/admin/orders"
              className="px-3 py-1 bg-[#C5A880] text-[#1C1614] rounded-lg text-xs font-serif uppercase tracking-wider font-semibold hover:bg-white transition-colors"
            >
              Fulfill Now
            </Link>
          </div>
        )}

        {/* Spacious Main Workspace */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Store Pause / Open Modal */}
      <CloseStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        currentStatus={storeStatus}
        onStatusUpdated={(updated) => setStoreStatus(updated)}
      />
    </div>
  );
}
