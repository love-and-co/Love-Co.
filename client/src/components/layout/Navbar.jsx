import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag, User, Search, Menu, X, Truck, Mail, Facebook, Instagram, Youtube, ChevronRight, Heart, ShieldCheck, LogOut } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useCopilotStore } from '../../store/copilotStore';
import { useWishlistStore } from '../../store/wishlistStore';
import BrandLogo from '../common/BrandLogo';

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openDrawer = useCartStore((state) => state.openDrawer);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistItemCount = wishlistItems ? wishlistItems.length : 0;
  const openWishlist = useWishlistStore((state) => state.openWishlist);
  const { user, isAuthenticated, logout } = useAuthStore();
  const openCopilot = useCopilotStore((state) => state.openCopilot);
  const ADMIN_EMAILS = ['loveandcoadmin@gmail.com'];
  const isAdmin =
    isAuthenticated &&
    user?.role === 'admin' &&
    (user?.email || '').toLowerCase().trim() === 'loveandcoadmin@gmail.com';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open & listen for Escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Shop All', href: '/catalog' },
    { label: 'Cold-Pressed Soaps', href: '/catalog?category=cold-pressed-soaps' },
    { label: 'Lip Care', href: '/catalog?category=lip-care' },
    { label: 'Bundle Builder', href: '/bundle-builder', highlight: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-brand-silver transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="text-brand-mocha p-1.5 -ml-1.5 rounded-md hover:bg-brand-silver-light"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Logo matching the user image */}
            <div className="flex items-center px-1 sm:px-3">
              <BrandLogo showTagline={true} />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-[11.5px] font-classic uppercase tracking-[0.16em]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 ${link.highlight
                    ? 'text-brand-mocha font-bold hover:text-brand-mocha-600'
                    : 'text-brand-mocha-900 hover:text-brand-mocha font-semibold border-b border-transparent hover:border-brand-mocha'
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* My Assistant Button */}
              <button
                onClick={() => openCopilot()}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-lavender-light hover:bg-brand-lavender text-brand-mocha border border-brand-lavender rounded-full transition-all group shadow-2xs cursor-pointer"
              >
                <span className="font-bold">My Assistant</span>
              </button>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-brand-mocha-900/80 hover:text-brand-mocha hover:bg-brand-silver-light rounded-full transition-colors"
                aria-label="Search Catalog"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Track My Order */}
              <Link
                href="/orders/track"
                className="p-2 text-brand-mocha-900/80 hover:text-brand-mocha hover:bg-brand-silver-light rounded-full transition-colors hidden sm:flex items-center"
                aria-label="Track My Order"
                title="Track My Order"
              >
                <Truck className="w-4 h-4 md:w-5 md:h-5" />
              </Link>

              {/* User Account Direct Navigation / Sign In Trigger */}
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="p-1 sm:p-1.5 px-3 bg-brand-mocha text-white hover:bg-brand-mocha-800 rounded-full transition-colors flex items-center gap-1.5 shadow-xs"
                      aria-label="Store Admin Portal"
                      title="Store Administrator Portal"
                    >
                      <ShieldCheck className="w-4 h-4 text-brand-lavender" />
                      <span className="text-[11px] font-mono-clinical font-semibold tracking-wider uppercase">
                        Admin
                      </span>
                    </Link>
                  )}

                  <Link
                    href="/account/profile"
                    className="p-1 sm:p-1.5 px-2.5 text-brand-mocha-900/80 hover:text-brand-mocha hover:bg-brand-silver-light rounded-full transition-colors flex items-center gap-1.5 border border-transparent hover:border-brand-silver"
                    title="My Account Profile"
                    aria-label="My Account Profile"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName || 'User Avatar'}
                        className="w-6 h-6 rounded-full object-cover border border-brand-mocha"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-mocha text-white text-[10.5px] font-bold flex items-center justify-center font-mono-clinical">
                        {(user?.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-mono-clinical text-brand-mocha font-semibold max-w-[120px] truncate">
                      {user?.fullName ? user.fullName.split(' ')[0] : 'Account'}
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900/80 hover:text-brand-mocha hover:bg-brand-silver-light rounded-full transition-colors hidden sm:flex items-center gap-1.5"
                  title="Sign In to your account"
                >
                  <User className="w-4 h-4 text-brand-mocha" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Wishlist Trigger */}
              <button
                type="button"
                onClick={openWishlist}
                className="relative p-2 text-brand-mocha-900/80 hover:text-brand-mocha hover:bg-brand-silver-light rounded-full transition-colors cursor-pointer"
                aria-label="Open Wishlist"
                title="My Wishlist"
              >
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-brand-mocha" />
                {mounted && wishlistItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-mocha text-white text-[10px] font-mono-clinical font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-brand-lavender">
                    {wishlistItemCount}
                  </span>
                )}
              </button>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2.5 bg-brand-mocha text-white hover:bg-brand-mocha-600 rounded-full transition-all flex items-center justify-center shadow-xs cursor-pointer"
                aria-label="Open Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-mocha text-white text-[10px] font-mono-clinical font-semibold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Modal Dropdown */}
        {searchOpen && (
          <div className="border-t border-brand-silver bg-[#FAF9F8] px-4 py-4 sm:px-6 shadow-sm">
            <div className="max-w-3xl mx-auto space-y-2.5">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-brand-mocha/50" />
                <input
                  type="text"
                  placeholder="Search cold-pressed soaps, ingredients (e.g. Neem, Turmeric, Sandalwood), or Lip Balm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-3 bg-white border-2 border-brand-silver rounded-xl text-sm text-brand-mocha-900 focus:outline-none focus:border-brand-mocha font-mono-clinical shadow-2xs"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 bg-brand-mocha text-white text-xs font-mono-clinical uppercase tracking-wider hover:bg-brand-mocha-600 transition-colors rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono-clinical text-brand-mocha-900/70">
                <span className="text-[11px] uppercase tracking-wider text-brand-mocha/60 font-semibold">Popular:</span>
                {[
                  { label: 'Cold-Pressed Soaps', q: 'soap' },
                  { label: 'Neem & Turmeric', q: 'neem' },
                  { label: 'Rose Goat Milk', q: 'blush' },
                  { label: 'Red Sandalwood', q: 'sandalwood' },
                  { label: 'Lip Balm', q: 'balm' }
                ].map((chip) => (
                  <button
                    key={chip.q}
                    type="button"
                    onClick={() => {
                      router.push(`/catalog?search=${encodeURIComponent(chip.q)}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-3 py-1 bg-white hover:bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver hover:border-brand-mocha/40 rounded-full text-[11px] transition-colors cursor-pointer shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </header>

      {/* Love & Co. Apothecary Left Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-brand-mocha-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Left Drawer */}
          <div className="fixed inset-y-0 left-0 w-[84vw] max-w-xs sm:max-w-sm bg-brand-canvas border-r border-brand-silver shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
            {/* Top Bar */}
            <div className="px-6 py-4 bg-brand-silver-light/60 border-b border-brand-silver flex items-center justify-between">
              <div className="flex items-center">
                <BrandLogo showTagline={true} />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 -mr-1.5 text-brand-mocha hover:text-brand-mocha-600 rounded-full hover:bg-brand-silver-light transition-colors cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5 text-brand-mocha stroke-[2.2]" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-brand-silver/60 font-serif-luxury">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <span>Shop All</span>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/catalog?sort=bestselling"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <span>Best Sellers</span>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/catalog?category=cold-pressed-soaps"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <span>Cold-Pressed Soaps</span>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/catalog?category=lip-care"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <span>Lip Care &amp; Butters</span>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/bundle-builder"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <span>Custom Bundles</span>
                  <span className="text-[9px] font-mono-clinical uppercase tracking-wider bg-brand-lavender text-brand-mocha-900 border border-brand-lavender-hover px-2 py-0.5 rounded-full font-bold">
                    Save 15%
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCopilot();
                }}
                className="w-full text-left py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span>My Assistant</span>
                  <span className="text-[9px] font-mono-clinical uppercase tracking-wider bg-brand-lavender-light text-brand-mocha-900 px-2 py-0.5 rounded-full border border-brand-lavender font-bold">
                    AI Routine
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </button>

              <Link
                href="/orders/track"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 sm:py-4 text-lg font-medium text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <span>Track My Order</span>
                  <Truck className="w-3.5 h-3.5 text-brand-mocha" />
                </div>
                <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
              </Link>



              {isAuthenticated ? (
                <div className="space-y-1 py-2">
                  <div className="px-3 py-2 bg-brand-silver-light/40 rounded-xl mb-1">
                    <p className="text-xs font-bold text-brand-mocha-900 truncate">
                      {user?.fullName || 'Client'}
                    </p>
                    <p className="text-[11px] font-mono-clinical text-brand-mocha/70 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {user?.email === 'loveandcoadmin@gmail.com' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 px-3 bg-[#E6E0F0]/60 rounded-xl text-sm font-bold text-brand-mocha hover:bg-[#E6E0F0] transition-colors flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-mocha" />
                        Admin Command Center
                      </span>
                      <ChevronRight className="w-4 h-4 text-brand-mocha group-hover:translate-x-1 transition-all" />
                    </Link>
                  )}

                  <Link
                    href="/account/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium text-brand-mocha-900 hover:bg-brand-silver-light/40 transition-colors flex items-center justify-between group"
                  >
                    <span>My Profile</span>
                    <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/account/profile?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium text-brand-mocha-900 hover:bg-brand-silver-light/40 transition-colors flex items-center justify-between group"
                  >
                    <span>My Orders</span>
                    <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium text-brand-mocha-900 hover:bg-brand-silver-light/40 transition-colors flex items-center justify-between group"
                  >
                    <span>Saved Wishlist ({wishlistItemCount})</span>
                    <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      router.push('/');
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 sm:py-4 text-base font-semibold text-brand-mocha-900 hover:text-brand-mocha transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-mocha" />
                    <span>Sign In / Create Account</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-brand-silver-dark group-hover:text-brand-mocha group-hover:translate-x-1 transition-all" />
                </Link>
              )}
            </div>

            {/* Drawer Bottom */}
            <div className="px-6 py-4 sm:py-5 bg-brand-silver-light/40 border-t border-brand-silver space-y-3">
              <div className="flex items-center justify-center space-x-6 text-brand-mocha/70">
                <a
                  href="mailto:loveandcosupport@gmail.com"
                  aria-label="Email"
                  className="hover:text-brand-mocha transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:text-brand-mocha transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/loveandco._/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram @loveandco._"
                  className="hover:text-brand-mocha transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="hover:text-brand-mocha transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <div className="text-center font-mono-clinical text-[10px] uppercase tracking-widest text-brand-mocha/80">
                LOVE & CO . Made With Love
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
