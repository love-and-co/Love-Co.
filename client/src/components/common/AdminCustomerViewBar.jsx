import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Eye,
  ShieldCheck,
  Edit3,
  Package,
  ShoppingCart,
  ArrowRight,
  ClipboardList,
  Headphones,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AdminCustomerViewBar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [minimized, setMinimized] = useState(false);

  // If on admin routes, do not render this customer view bar
  if (router.pathname.startsWith('/admin')) {
    return null;
  }

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center space-x-2 bg-[#1C1614] text-white px-3.5 py-2 rounded-full shadow-2xl border border-amber-400/40 text-xs font-semibold hover:bg-[#342721] transition group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Customer View (Admin Mode)</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-[#1C1614] text-white border-b border-amber-400/20 px-3 sm:px-6 py-2 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Left: Mode Indicator & Admin Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <Eye className="w-3 h-3 text-amber-400" />
            <span>Customer View</span>
          </div>

          <div className="flex items-center space-x-1 text-gray-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{user?.name || 'Admin'}</span>
            <span className="text-gray-400 hidden md:inline">(Full Privileges Active)</span>
          </div>
        </div>

        {/* Center: Admin Quick Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none py-0.5">
          <Link
            href="/admin/products"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition shrink-0"
            title="Edit product details, formulations, and prices"
          >
            <Edit3 className="w-3 h-3 text-amber-300" />
            <span>Edit Products</span>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition shrink-0"
            title="View customer orders and fulfillment desk"
          >
            <ShoppingCart className="w-3 h-3 text-emerald-400" />
            <span>Orders</span>
          </Link>

          <Link
            href="/admin/inventory"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition shrink-0"
            title="Manage batch expiry and shelf units"
          >
            <ClipboardList className="w-3 h-3 text-purple-300" />
            <span>Batch List</span>
          </Link>

          <Link
            href="/admin/support"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition shrink-0"
            title="Customer care messages and help desk"
          >
            <Headphones className="w-3 h-3 text-sky-300" />
            <span>Customer Support</span>
          </Link>
        </div>

        {/* Right: Exit View / Return to Admin Desk */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-xs transition"
          >
            <span>Admin Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setMinimized(true)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Minimize admin bar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

