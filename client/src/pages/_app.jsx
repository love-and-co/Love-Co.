import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../styles/globals.css';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import WishlistDrawer from '../components/wishlist/WishlistDrawer';
import WishlistAuthModal from '../components/wishlist/WishlistAuthModal';
import WishlistToast from '../components/wishlist/WishlistToast';
import CopilotWidget from '../components/ai/CopilotWidget';
import SamCopilotChat from '../components/ai/SamCopilotChat';
import AuthModal from '../components/common/AuthModal';
import PhoneVerificationModal from '../components/auth/PhoneVerificationModal';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCopilotStore } from '../store/copilotStore';
import { useStoreStatusStore } from '../store/storeStatusStore';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const initializeCart = useCartStore((state) => state.initializeCart);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeWishlist = useWishlistStore((state) => state.initializeWishlist);
  const initializeCopilot = useCopilotStore((state) => state.initializeCopilot);
  const { storeStatus, fetchStoreStatus, initSocketListener } = useStoreStatusStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeCart();
    initializeAuth();
    initializeWishlist();
    initializeCopilot();
    fetchStoreStatus();
    initSocketListener();
  }, [initializeCart, initializeAuth, initializeWishlist, initializeCopilot, fetchStoreStatus, initSocketListener]);

  const isAdmin =
    isAuthenticated &&
    user?.role === 'admin' &&
    (user?.email || '').toLowerCase().trim() === 'loveandcoadmin@gmail.com';
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Client-side route protection: strictly bounce non-admin users from /admin immediately to /
  useEffect(() => {
    if (isAdminRoute) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('love_co_token') : null;
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('love_co_user') : null;
      let parsedUser = user;
      if (!parsedUser && storedUser) {
        try { parsedUser = JSON.parse(storedUser); } catch (_) {}
      }

      const isStrictAdmin =
        parsedUser?.role === 'admin' &&
        (parsedUser?.email || '').toLowerCase().trim() === 'loveandcoadmin@gmail.com';

      if (!isStrictAdmin) {
        router.replace('/');
      }
    }
  }, [isAdminRoute, isAuthenticated, user, router]);

  // Customer portal is enabled on all storefront pages.
  // Admins can freely explore in "Customer view" with full edit tools.
  const showCustomerPortal = !isAdminRoute;

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '909188430255-0mn97r3icacsjd2l2vij3pc9otktm2c1.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Head>
        <title>
          {isAdminRoute
            ? 'LOVE & Co. — Admin Operations'
            : isAdmin
            ? 'Love & Co. — Customer View (Admin)'
            : 'Love & Co. — Cold-Pressed Botanicals & Artisanal Skincare'}
        </title>
        <meta
          name="description"
          content="Ultra-clean apothecary skincare featuring cold-pressed soaps, barrier repair lip elixirs, virgin botanical oils, and artisanal skincare assistant diagnostics."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-white text-brand-mocha-900 selection:bg-brand-lavender selection:text-brand-mocha-900">
        {showCustomerPortal && storeStatus?.isPaused && (
          <div className="bg-[#1C1614] text-[#FAF8F5] border-b border-[#C5A880]/50 px-4 py-2.5 text-center text-xs font-serif z-50 shadow-md">
            <span className="text-[#C5A880] font-semibold uppercase tracking-widest mr-2">🌿 {storeStatus.pauseReason || 'Apothecary Notice'}:</span>
            <span className="text-stone-300">{storeStatus.pauseNotice}</span>
            {storeStatus.reopenDate && (
              <span className="ml-2 text-[#C5A880]">
                (Dispatch resuming {new Date(storeStatus.reopenDate).toLocaleDateString('en-IN')})
              </span>
            )}
          </div>
        )}
        {showCustomerPortal && <AnnouncementBar />}
        {showCustomerPortal && <Navbar />}

        <main className="flex-grow">
          <Component {...pageProps} />
        </main>

        {showCustomerPortal && <Footer />}
        {showCustomerPortal && <CartDrawer />}
        {showCustomerPortal && <WishlistDrawer />}
        {showCustomerPortal && <WishlistAuthModal />}
        {showCustomerPortal && <WishlistToast />}
        {showCustomerPortal && <CopilotWidget />}
        {showCustomerPortal && <SamCopilotChat />}
        {showCustomerPortal && <AuthModal />}
        {showCustomerPortal && <PhoneVerificationModal />}
      </div>
    </GoogleOAuthProvider>
  );
}

