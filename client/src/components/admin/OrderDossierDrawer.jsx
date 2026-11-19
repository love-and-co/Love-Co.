import React from 'react';
import { X, Sparkles, Package, MapPin, Phone, Mail, Clock, ShieldCheck, Tag, CreditCard, Gift, Truck } from 'lucide-react';

export default function OrderDossierDrawer({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const addr = order.shippingAddress || {};
  const customerName = addr.fullName || addr.recipientName || order.customer?.fullName || 'Valued Patron';
  const phone = addr.phone || order.customer?.phone || 'N/A';
  const email = addr.email || order.customer?.email || 'N/A';

  const isTenthMilestone = order.loyaltyRewardApplied || order.isTenthOrder || (order.stampNumber === 10);
  const items = order.items || [];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#1C1614]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#C5A880]/30 shadow-2xl flex flex-col font-sans text-[#1C1614]">
          {/* Header */}
          <div className="bg-[#1C1614] text-[#FAF8F5] px-6 py-5 flex items-center justify-between border-b border-[#C5A880]/30">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-serif tracking-widest uppercase text-[#C5A880]">Order Dossier</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300">
                  {order.fulfillmentStatus || 'PLACED'}
                </span>
              </div>
              <h2 className="text-base font-semibold mt-1">#{order.orderNumber}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 10th-Stamp Milestone Gift Alert */}
            {isTenthMilestone && (
              <div className="p-4 rounded-xl bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-start space-x-3">
                <Gift className="w-5 h-5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-serif uppercase tracking-wider font-semibold text-[#1C1614]">
                    🌟 10-Stamp Ritual Completed!
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    This order unlocks the complimentary <strong>Signature Botanical Trio Gift Box</strong>. Ensure the trio box is packed inside before dispatch.
                  </p>
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-serif uppercase tracking-widest text-stone-500 font-semibold">
                Customer Intelligence
              </h3>
              <div className="text-xs space-y-1.5 text-stone-700">
                <p className="font-semibold text-sm text-[#1C1614]">{customerName}</p>
                <div className="flex items-center space-x-2 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-stone-600">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{email}</span>
                </div>
                <div className="flex items-start space-x-2 text-stone-600 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                  <span>
                    {addr.street || ''} {addr.city ? `${addr.city}, ` : ''}{addr.state || ''} {addr.pincode ? `- ${addr.pincode}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif uppercase tracking-widest text-stone-500 font-semibold">
                  Items ({items.length})
                </h3>
                <span className="text-xs text-stone-500">
                  Payment: <strong>{(order.payment?.mode || order.paymentDetails?.provider || 'ONLINE').toUpperCase()}</strong>
                </span>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 bg-white border border-stone-200 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-stone-200">
                      {item.image || item.product?.images?.[0]?.url ? (
                        <img
                          src={item.image || item.product?.images?.[0]?.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1C1614] truncate font-serif">
                        {item.name || item.product?.name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {item.variant || '100g Bar'} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#1C1614]">
                      ₹{item.price * (item.quantity || 1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Billing Breakdown */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{order.pricingBreakdown?.subtotal || order.subtotal || order.totalAmount}</span>
              </div>
              {(order.pricingBreakdown?.couponDiscount || order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon Discount</span>
                  </span>
                  <span>-₹{order.pricingBreakdown?.couponDiscount || order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Botanical Air Courier</span>
                <span>{order.pricingBreakdown?.shippingFee === 0 ? 'FREE' : `₹${order.pricingBreakdown?.shippingFee || 0}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-semibold text-sm text-[#1C1614]">
                <span>Grand Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Shipping & Tracking Status */}
            {order.shipping?.trackingNumber && (
              <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-500">
                  <span className="text-[10px] uppercase font-semibold">Courier Manifest:</span>
                  <span className="font-mono text-[11px] text-stone-800 font-semibold">{order.shipping.trackingNumber}</span>
                </div>
                <p className="text-stone-700">
                  Carrier: <strong>{order.shipping.courier || 'Delhivery Air'}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-stone-100 border-t border-stone-200">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
