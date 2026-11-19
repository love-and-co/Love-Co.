import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  ShoppingCart,
  AlertTriangle,
  Package,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Check
} from 'lucide-react';
import { api } from '../../../lib/api';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/mockSeed';

const READ_STORAGE_KEY = 'love_co_read_notifications_v1';
const OVERRIDES_STORAGE_KEY = 'love_co_fefo_overrides_v2';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | ORDERS | STOCK | EXPIRY
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load read notification IDs from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setReadIds(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveReadIds = (ids) => {
    setReadIds(ids);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(merged);
  };

  const markAsRead = (id) => {
    const merged = Array.from(new Set([...readIds, id]));
    saveReadIds(merged);
  };

  // Compile real-time notifications
  const loadNotifications = async () => {
    setLoading(true);
    const items = [];
    const now = Date.now();

    // 1. Fetch overrides to respect written-off batches
    let storedOverrides = {};
    try {
      const rawOverrides = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      if (rawOverrides && rawOverrides.trim() && rawOverrides !== 'undefined' && rawOverrides !== 'null') {
        storedOverrides = JSON.parse(rawOverrides);
      }
    } catch (e) {}

    // 2. Fetch live or stored orders for "NEW ORDERS"
    let allOrders = INITIAL_ORDERS;
    try {
      const storedOrders = localStorage.getItem('love_co_orders');
      if (storedOrders && storedOrders.trim() && storedOrders !== 'undefined' && storedOrders !== 'null') {
        const parsed = JSON.parse(storedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allOrders = [...parsed, ...INITIAL_ORDERS];
        }
      }
      const adminRes = await api.getAdminOrders({ status: 'UNFULFILLED' }).catch(() => null);
      if (adminRes?.data?.orders && adminRes.data.orders.length > 0) {
        allOrders = adminRes.data.orders;
      }
    } catch (e) {}

    // Filter to unfulfilled/placed orders
    const unfulfilledOrders = allOrders.filter((ord) => {
      const st = (ord.shipping?.status || ord.fulfillmentStatus || 'UNFULFILLED').toUpperCase();
      return st === 'UNFULFILLED' || st === 'PLACED' || st === 'PENDING' || st === 'PROCESSING';
    });

    unfulfilledOrders.slice(0, 8).forEach((ord) => {
      const orderId = ord.orderNumber || ord.orderId || `ORD-${ord._id?.slice(-4) || '901'}`;
      const customerName =
        ord.shippingAddress?.recipientName ||
        ord.customer?.name ||
        ord.customer?.shippingAddress?.recipientName ||
        'Valued Customer';
      const itemsList = (ord.items || [])
        .map((i) => `${i.quantity || 1}x ${(i.title || i.name || 'Botanical Soap').slice(0, 16)}`)
        .join(', ');
      const amount = ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0;

      items.push({
        id: `order_${orderId}`,
        category: 'ORDERS',
        type: 'NEW_ORDER',
        title: `New Order: ${orderId}`,
        description: `${customerName} ordered ${itemsList || 'Artisanal Products'} (₹${amount.toLocaleString()})`,
        time: 'Pending Fulfillment',
        link: '/admin/orders',
        actionLabel: 'Pack & Dispatch →',
        badge: 'UNFULFILLED',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      });
    });

    // 3. Product Inventory: "OUT OF STOCK" / "LOW STOCK"
    let currentProducts = INITIAL_PRODUCTS;
    if (typeof window !== 'undefined') {
      try {
        const storedProds = localStorage.getItem('love_co_admin_products_v1');
        if (storedProds && storedProds.trim() && storedProds !== 'undefined' && storedProds !== 'null') {
          const parsed = JSON.parse(storedProds);
          if (Array.isArray(parsed) && parsed.length > 0) currentProducts = parsed;
        }
      } catch (e) {}
    }

    currentProducts.forEach((prod) => {
      const stock = prod.totalStock !== undefined ? prod.totalStock : (prod.stockQty || 0);
      const threshold = prod.lowStockThreshold || 30;

      if (stock === 0) {
        items.push({
          id: `stock_out_${prod._id}`,
          category: 'STOCK',
          type: 'OUT_OF_STOCK',
          title: `Out of Stock: ${prod.title}`,
          description: `Current shelf inventory is 0 units. Customer checkout is currently disabled.`,
          time: 'Urgent Action',
          link: '/admin/products',
          actionLabel: 'Restock Inventory →',
          badge: 'OUT OF STOCK',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        });
      } else if (stock <= threshold) {
        items.push({
          id: `stock_low_${prod._id}`,
          category: 'STOCK',
          type: 'LOW_STOCK',
          title: `Low Stock: ${prod.title}`,
          description: `Only ${stock} units remaining in inventory (Threshold: ${threshold} units).`,
          time: 'Restock Recommended',
          link: '/admin/products',
          actionLabel: 'Adjust Stock →',
          badge: 'LOW STOCK',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
        });
      }
    });

    // 4. Batch Lifecycle: "BATCH EXPIRATION"
    currentProducts.forEach((prod) => {
      (prod.batches || []).forEach((b) => {
        const override = storedOverrides[b.batchNumber];
        const isWrittenOff = override?.isWrittenOff || b.isWrittenOff || (override?.stockQuantity === 0 && override?.status === 'Written Off');
        if (isWrittenOff) return; // Do not alert for batches already written off!

        const expDateIso = override?.expDate || b.expDate;
        const expTime = new Date(expDateIso).getTime();
        const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        const units = override?.stockQuantity !== undefined ? override.stockQuantity : b.stockQuantity;

        if (units > 0) {
          if (daysLeft <= 0) {
            items.push({
              id: `batch_exp_${b.batchNumber}`,
              category: 'EXPIRY',
              type: 'EXPIRED_BATCH',
              title: `Expired Batch: ${b.batchNumber}`,
              description: `${prod.title} (${units} units) reached expiry. Quarantine or write off required.`,
              time: 'Expired',
              link: '/admin/inventory',
              actionLabel: 'View in Batch List →',
              badge: 'EXPIRED',
              badgeColor: 'bg-red-100 text-red-800 border-red-300 font-bold',
            });
          } else if (daysLeft <= 90) {
            items.push({
              id: `batch_soon_${b.batchNumber}`,
              category: 'EXPIRY',
              type: 'EXPIRING_BATCH',
              title: `Near Expiry: ${b.batchNumber}`,
              description: `${prod.title} (${units} units) has ${daysLeft} days of shelf life remaining.`,
              time: `${daysLeft} days left`,
              link: '/admin/inventory',
              actionLabel: 'FEFO Dispatch Priority →',
              badge: `${daysLeft}d REMAINING`,
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
            });
          }
        }
      });
    });

    setNotifications(items);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const handleSync = () => loadNotifications();
    window.addEventListener('love_co_products_updated', handleSync);
    window.addEventListener('love_co_inventory_updated', handleSync);
    window.addEventListener('love_co_orders_updated', handleSync);
    return () => {
      window.removeEventListener('love_co_products_updated', handleSync);
      window.removeEventListener('love_co_inventory_updated', handleSync);
      window.removeEventListener('love_co_orders_updated', handleSync);
    };
  }, []);

  // Filter out any read/dismissed alerts so "Mark as read" removes them completely
  const activeNotifications = notifications.filter((n) => !readIds.includes(n.id));
  const unreadCount = activeNotifications.length;

  const filteredNotifications = activeNotifications.filter((n) => {
    if (activeFilter === 'ORDERS') return n.category === 'ORDERS';
    if (activeFilter === 'STOCK') return n.category === 'STOCK';
    if (activeFilter === 'EXPIRY') return n.category === 'EXPIRY';
    return true;
  });

  const ordersCount = activeNotifications.filter((n) => n.category === 'ORDERS').length;
  const stockCount = activeNotifications.filter((n) => n.category === 'STOCK').length;
  const expiryCount = activeNotifications.filter((n) => n.category === 'EXPIRY').length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Notification Trigger Button (Icon Only) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-[#382B25] text-white border-[#5A453A] shadow-xs'
            : unreadCount > 0
            ? 'bg-[#2A211D] hover:bg-[#382B25] text-amber-300 border-amber-500/40 shadow-xs'
            : 'bg-[#2A211D] hover:bg-[#382B25] text-[#C4B5A9] border-[#3E322C]'
        }`}
        title="Notification Alerts: New orders, low stock, batch expiry"
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 ${isOpen ? 'text-white' : unreadCount > 0 ? 'text-amber-400 animate-pulse' : 'text-[#C4B5A9]'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#1C1614] shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Updates Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] bg-white border border-[#E8E3EE] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-[#FAF9F8] border-b border-[#E8E3EE] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#1C1614]" />
                <h3 className="font-serif font-bold text-sm text-[#1C1614]">Notification Updates</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Real-time alerts for customer orders, inventory & batch expiry
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={loadNotifications}
                className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
                title="Refresh alerts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Segment Tabs */}
          <div className="flex items-center space-x-1 px-3 py-2 bg-gray-50/80 border-b border-gray-100 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'ALL'
                  ? 'bg-white text-[#1C1614] shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({activeNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('ORDERS')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'ORDERS'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Orders ({ordersCount})
            </button>
            <button
              onClick={() => setActiveFilter('STOCK')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'STOCK'
                  ? 'bg-white text-rose-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stock ({stockCount})
            </button>
            <button
              onClick={() => setActiveFilter('EXPIRY')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'EXPIRY'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expiry ({expiryCount})
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="ml-auto text-[10px] text-gray-600 hover:text-red-700 font-semibold underline whitespace-nowrap pl-2 flex items-center space-x-1 transition"
                title="Mark all as read and remove all alerts"
              >
                <span>Mark as read (remove all)</span>
              </button>
            )}
          </div>

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                <div className="font-semibold text-gray-700 text-sm">No Notifications</div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl transition-all bg-white hover:bg-amber-50/30 border border-gray-100 hover:border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Category Icon */}
                        <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-white border border-gray-200">
                          {notif.category === 'ORDERS' ? (
                            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                          ) : notif.category === 'STOCK' ? (
                            <Package className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-gray-900 truncate">
                              {notif.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                            {notif.description}
                          </p>

                          {/* Action Button Link */}
                          <div className="mt-2 flex items-center space-x-3">
                            <Link
                              href={notif.link}
                              onClick={() => {
                                markAsRead(notif.id);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#1C1614] hover:text-[#4A3B32] transition"
                            >
                              <span>{notif.actionLabel}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Badge + Dismiss Button */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${notif.badgeColor}`}
                        >
                          {notif.badge}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Access */}
          <div className="p-3 bg-[#FAF9F8] border-t border-gray-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-500">Fast Navigation:</span>
            <div className="flex items-center space-x-2 text-[11px] font-medium text-gray-700">
              <Link
                href="/admin/orders"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#1C1614] hover:underline"
              >
                Orders Desk
              </Link>
              <span>•</span>
              <Link
                href="/admin/products"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#1C1614] hover:underline"
              >
                Products
              </Link>
              <span>•</span>
              <Link
                href="/admin/inventory"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#1C1614] hover:underline"
              >
                Batch List
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

