import React from 'react';
import Link from 'next/link';

export default function AnnouncementBar() {
  const renderAnnouncementGroup = (key) => (
    <div key={key} className="flex items-center space-x-8 sm:space-x-12 px-6 sm:px-8 flex-shrink-0">
      {/* 1. Cold Saponified */}
      <span className="font-medium tracking-wide text-[#FAF9F8]">
        Cold Saponified &lt; 35°C • Made With Love • 100% Botanical Purity
      </span>

      <span className="text-[#FAF9F8]/40 select-none text-xs">•</span>

      {/* 2. Custom Botanical Bundle */}
      <div className="flex items-center space-x-2 text-[#FAF9F8]">
        <span className="font-medium tracking-wide">Build Your Custom Botanical Bundle —</span>
        <span className="bg-[#38261B] text-[#FAF9F8] px-2 py-0.5 rounded border border-[#6F4E37]/60 font-semibold text-[10px] sm:text-xs">
          Save up to 15%
        </span>
        <Link
          href="/bundle-builder"
          className="ml-1 underline underline-offset-4 decoration-[#C5A880]/60 text-[#C5A880] hover:text-white font-bold transition-colors"
        >
          Configure Kit &rarr;
        </Link>
      </div>

      <span className="text-[#FAF9F8]/40 select-none text-xs">•</span>

      {/* 3. Climate Neutral Shipping */}
      <span className="font-medium tracking-wide text-[#FAF9F8]">
        Free Climate-Neutral Shipping on ₹500+
      </span>

      <span className="text-[#FAF9F8]/40 select-none text-xs">•</span>
    </div>
  );

  return (
    <div
      className="relative w-full overflow-hidden bg-[#1C1614] text-[#FAF9F8] font-medium tracking-wide text-[11px] sm:text-xs font-classic py-2.5 border-b border-[#2A211D] select-none shadow-xs"
      aria-label="Announcements ticker"
    >
      <div className="flex items-center animate-ticker whitespace-nowrap">
        {renderAnnouncementGroup('group-1')}
        {renderAnnouncementGroup('group-2')}
        {renderAnnouncementGroup('group-3')}
        {renderAnnouncementGroup('group-4')}
      </div>
    </div>
  );
}
