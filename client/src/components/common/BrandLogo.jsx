import React from 'react';
import Link from 'next/link';

export default function BrandLogo({ className = '', variant = 'header', showTagline = true, inverted = false, href = '/' }) {
  const isDark = inverted || variant === 'dark';

  // Primary Color: Soft Warm Caramel Chestnut (#A86D49 | rgb(168, 109, 73))
  const primaryColor = isDark ? '#F5E6D3' : '#A86D49';
  const taglineColor = isDark ? '#E2CBB3' : '#A86D49';

  return (
    <Link
      href={href}
      className={`inline-flex flex-col items-center justify-center group select-none py-2 px-3 ${className}`}
      aria-label="Love & Co. — Made with Love"
    >
      {/* Main Square Block: "LOVE" with "& CO." elevated at the top-right */}
      <div className="relative flex items-start justify-center leading-none">
        <span
          className="font-serif font-normal text-2xl sm:text-[27px] tracking-[0.06em] transition-colors group-hover:opacity-90"
          style={{
            color: primaryColor,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontFeatureSettings: '"liga" 1, "kern" 1',
          }}
        >
          LOVE
        </span>

        {/* "& CO." positioned comfortably in the upper-right corner of LOVE */}
        <span
          className="inline-flex items-baseline space-x-0.5 text-[9px] sm:text-[10.5px] tracking-[0.06em] ml-1.5 sm:ml-2 mt-1 sm:mt-1.5 transition-colors group-hover:opacity-90"
          style={{ color: primaryColor }}
        >
          <span
            className="font-serif font-normal text-[10px] sm:text-[11.5px]"
            style={{ fontFamily: "Georgia, 'Cardo', serif" }}
          >
            &amp;
          </span>
          <span
            className="font-serif font-normal"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            CO.
          </span>
        </span>
      </div>

      {/* Bottom Line: "M A D E   W I T H   L O V E" centered below */}
      {showTagline && (
        <span
          className="font-sans font-normal text-[6.5px] sm:text-[7.5px] uppercase tracking-[0.45em] pl-[0.45em] mt-0.5 sm:mt-1 text-center transition-colors"
          style={{ color: taglineColor }}
        >
          MADE WITH LOVE
        </span>
      )}
    </Link>
  );
}
