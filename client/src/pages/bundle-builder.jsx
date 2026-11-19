import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Check, Package, ArrowRight, ShieldCheck, Plus, Trash2, Sprout } from 'lucide-react';
import { api } from '../lib/api';
import { useCartStore } from '../store/cartStore';

export default function BundleBuilderPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item IDs for each slot (2 slots)
  const [selectedSoap, setSelectedSoap] = useState(null);
  const [selectedBalm, setSelectedBalm] = useState(null);
  const [giftBox, setGiftBox] = useState(false);

  const [bundleData, setBundleData] = useState(null);
  const [validating, setValidating] = useState(false);
  const [added, setAdded] = useState(false);

  const addMultipleItems = useCartStore((state) => state.addMultipleItems);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await api.getProducts({ limit: 50 });
        setAllProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to load products for bundle builder', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const soaps = allProducts.filter(
    (p) => p.category === 'cold-pressed-soaps'
  );
  const balms = allProducts.filter(
    (p) => p.category === 'lip-care'
  );

  // Auto-validate whenever selection changes
  useEffect(() => {
    const selectedIds = [selectedSoap?._id, selectedBalm?._id].filter(Boolean);

    if (selectedIds.length > 0) {
      setValidating(true);
      api.validateBundle(selectedIds, giftBox)
        .then((res) => setBundleData(res.data))
        .catch((err) => console.error('Validation error', err))
        .finally(() => setValidating(false));
    } else {
      setBundleData(null);
    }
  }, [selectedSoap, selectedBalm, giftBox]);

  const selectedCount = [selectedSoap, selectedBalm].filter(Boolean).length;

  const handleAddBundleToBag = () => {
    const chosen = [selectedSoap, selectedBalm].filter(Boolean);
    if (chosen.length > 0) {
      addMultipleItems(chosen, true);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <>
      <Head>
        <title>Build Your Custom Duo — Love &amp; Co. Botanical Atelier</title>
      </Head>

      <div className="bg-brand-canvas min-h-screen text-brand-mocha-900">
        {/* Banner with Pale Lavender & Platinum Silver */}
        <div className="bg-[#E6E0F0] border-b-2 border-brand-silver py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-mocha text-white text-xs font-monoClinical font-bold uppercase tracking-wider rounded-full shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Duo Bundle Discount: 10% Off on 2 Items</span>
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl font-normal text-brand-mocha-900 tracking-tight">
              Assemble Your Custom Botanical Duo
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 max-w-xl mx-auto font-sans leading-relaxed">
              Curate your personalised 2-step regimen: select one cold-pressed treatment soap and one restorative lip elixir. Automatic atelier discount applied at checkout.
            </p>
          </div>
        </div>

        {/* Builder Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Selection Grid (2 SLOTS) */}
            <div className="lg:col-span-8 space-y-10">
              {/* SLOT 1: TREATMENT SOAP BAR */}
              <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-brand-silver">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-mocha text-white font-monoClinical text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <h3 className="font-serifLuxury font-medium text-xl text-brand-mocha-900">
                      Slot 1: Specialty Treatment Soap Bar
                    </h3>
                  </div>
                  {selectedSoap && (
                    <button
                      type="button"
                      onClick={() => setSelectedSoap(null)}
                      className="text-xs font-monoClinical text-brand-mocha hover:underline cursor-pointer"
                    >
                      Clear Slot
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {soaps.map((prod) => {
                    const isChosen = selectedSoap?._id === prod._id;
                    return (
                      <div
                        key={prod._id}
                        onClick={() => setSelectedSoap(prod)}
                        className={`cursor-pointer rounded-2xl border-2 p-3 sm:p-4 flex flex-col justify-between transition-all ${
                          isChosen
                            ? 'border-brand-mocha bg-[#E6E0F0] shadow-sm ring-2 ring-brand-mocha/30'
                            : 'border-brand-silver bg-white hover:border-brand-mocha/50'
                        }`}
                      >
                        <div className="aspect-square bg-[#FAF9F8] rounded-xl overflow-hidden mb-3 border border-brand-silver">
                          <img
                            src={prod.images && prod.images[0] ? prod.images[0].url : ''}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] font-monoClinical text-brand-mocha font-bold line-clamp-1">
                            {prod.activesConcentration || 'Botanical Formula'}
                          </div>
                          <h4 className="font-serifLuxury font-medium text-sm text-brand-mocha-900 line-clamp-1 mt-0.5">
                            {prod.name}
                          </h4>
                          <div className="mt-3 flex items-center justify-between text-xs font-monoClinical pt-2 border-t border-brand-silver/50">
                            <span className="font-bold text-brand-mocha-900">₹{prod.price}</span>
                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg border ${
                              isChosen
                                ? 'bg-brand-mocha text-white border-brand-mocha'
                                : 'border-brand-silver text-brand-mocha-900 bg-white'
                            }`}>
                              {isChosen ? 'Selected ✓' : 'Select'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SLOT 2: RESTORATIVE LIP ELIXIR & BUTTER */}
              <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-brand-silver">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-mocha text-white font-monoClinical text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <h3 className="font-serifLuxury font-medium text-xl text-brand-mocha-900">
                      Slot 2: Restorative Lip Elixir &amp; Butter
                    </h3>
                  </div>
                  {selectedBalm && (
                    <button
                      type="button"
                      onClick={() => setSelectedBalm(null)}
                      className="text-xs font-monoClinical text-brand-mocha hover:underline cursor-pointer"
                    >
                      Clear Slot
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {balms.map((prod) => {
                    const isChosen = selectedBalm?._id === prod._id;
                    return (
                      <div
                        key={prod._id}
                        onClick={() => setSelectedBalm(prod)}
                        className={`cursor-pointer rounded-2xl border-2 p-3 sm:p-4 flex flex-col justify-between transition-all ${
                          isChosen
                            ? 'border-brand-mocha bg-[#E6E0F0] shadow-sm ring-2 ring-brand-mocha/30'
                            : 'border-brand-silver bg-white hover:border-brand-mocha/50'
                        }`}
                      >
                        <div className="aspect-square bg-[#FAF9F8] rounded-xl overflow-hidden mb-3 border border-brand-silver">
                          <img
                            src={prod.images && prod.images[0] ? prod.images[0].url : ''}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] font-monoClinical text-brand-mocha font-bold line-clamp-1">
                            {prod.activesConcentration || 'Botanical Formula'}
                          </div>
                          <h4 className="font-serifLuxury font-medium text-sm text-brand-mocha-900 line-clamp-1 mt-0.5">
                            {prod.name}
                          </h4>
                          <div className="mt-3 flex items-center justify-between text-xs font-monoClinical pt-2 border-t border-brand-silver/50">
                            <span className="font-bold text-brand-mocha-900">₹{prod.price}</span>
                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg border ${
                              isChosen
                                ? 'bg-brand-mocha text-white border-brand-mocha'
                                : 'border-brand-silver text-brand-mocha-900 bg-white'
                            }`}>
                              {isChosen ? 'Selected ✓' : 'Select'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Assembly Ledger */}
            <div className="lg:col-span-4 sticky top-28">
              <div className="border-2 border-brand-silver rounded-3xl p-6 sm:p-7 bg-white space-y-6 shadow-sm">
                <div className="border-b border-brand-silver pb-4">
                  <span className="text-[10px] font-monoClinical uppercase tracking-wider text-brand-mocha font-bold">
                    Custom Assembly Ledger
                  </span>
                  <h3 className="font-serifLuxury font-medium text-2xl text-brand-mocha-900 mt-0.5">
                    Your Botanical Duo
                  </h3>
                  <p className="text-xs font-monoClinical text-brand-mocha-900/60 mt-1">
                    {selectedCount} of 2 product slots occupied
                  </p>
                </div>

                {/* Savings Meter */}
                <div className="p-4 bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl text-xs font-monoClinical space-y-2.5 shadow-2xs">
                  <div className="flex justify-between font-bold text-brand-mocha-900">
                    <span>Kit Tier Status</span>
                    <span className="text-brand-mocha">
                      {selectedCount === 2 ? '10% DUO DISCOUNT UNLOCKED' : 'ADD 1 MORE'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-brand-silver">
                    <div
                      className="h-full bg-brand-mocha transition-all duration-300 rounded-full"
                      style={{ width: `${(selectedCount / 2) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-brand-mocha-900/70">
                    {selectedCount === 0 && 'Select both items to trigger 10% duo discount.'}
                    {selectedCount === 1 && 'Add 1 more item to unlock 10% off your custom duo!'}
                    {selectedCount === 2 && 'Custom Duo complete! 10% savings unlocked!'}
                  </p>
                </div>

                {/* Selected Slots List */}
                <div className="space-y-3 text-xs font-monoClinical divide-y divide-brand-silver/50">
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-brand-mocha-900/70">1. Treatment Soap:</span>
                    <span className="font-semibold text-brand-mocha-900 line-clamp-1 max-w-[170px] text-right">
                      {selectedSoap ? selectedSoap.name : '— Empty Slot —'}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-brand-mocha-900/70">2. Lip Care:</span>
                    <span className="font-semibold text-brand-mocha-900 line-clamp-1 max-w-[170px] text-right">
                      {selectedBalm ? selectedBalm.name : '— Empty Slot —'}
                    </span>
                  </div>
                </div>

                {/* Plantable Seed-Paper Box Option */}
                <div className="pt-4 border-t border-brand-silver">
                  <label className="flex items-start space-x-2.5 text-xs font-monoClinical text-brand-mocha-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftBox}
                      onChange={(e) => setGiftBox(e.target.checked)}
                      className="mt-0.5 rounded border-brand-silver text-brand-mocha focus:ring-brand-mocha"
                    />
                    <div>
                      <span className="font-bold text-brand-mocha-900 flex items-center">
                        <Sprout className="w-3.5 h-3.5 text-brand-mocha mr-1.5" />
                        Plantable Chamomile Seed-Paper Box (+₹99)
                      </span>
                      <p className="text-[11px] text-brand-mocha-900/60 mt-0.5">
                        Embedded with non-GMO flower seeds. Wet and plant directly in garden soil.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Live Price Calculation Breakdown */}
                {bundleData && (
                  <div className="pt-4 border-t border-brand-silver space-y-2 text-xs font-monoClinical">
                    <div className="flex justify-between text-brand-mocha-900/70">
                      <span>Kit Subtotal</span>
                      <span>₹{bundleData.subtotal}</span>
                    </div>
                    {bundleData.discountAmount > 0 && (
                      <div className="flex justify-between text-brand-mocha font-bold">
                        <span>Bundle Savings ({bundleData.discountPercentage}%)</span>
                        <span>-₹{bundleData.discountAmount}</span>
                      </div>
                    )}
                    {bundleData.packagingFee > 0 && (
                      <div className="flex justify-between text-brand-mocha-900/70">
                        <span>Plantable Gift Packaging</span>
                        <span>₹{bundleData.packagingFee}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-brand-silver flex justify-between font-bold text-base text-brand-mocha-900">
                      <span>Total Kit Price</span>
                      <span className="text-xl">₹{bundleData.totalAmount}</span>
                    </div>
                  </div>
                )}

                {/* Add Bundle to Cart Trigger */}
                <button
                  type="button"
                  onClick={handleAddBundleToBag}
                  disabled={selectedCount === 0}
                  className={`w-full py-4 text-xs font-monoClinical uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-2 rounded-xl shadow-md disabled:opacity-50 cursor-pointer ${
                    added
                      ? 'bg-brand-mocha text-white ring-2 ring-[#E6E0F0]'
                      : 'bg-brand-mocha text-white hover:bg-brand-mocha-600'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 mr-1 stroke-[2.5]" />
                      <span>Custom Duo Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <span>Add Duo to Bag ({selectedCount} items)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
