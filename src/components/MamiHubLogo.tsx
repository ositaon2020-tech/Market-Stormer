import React from 'react';

interface MamiHubLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function MamiHubLogo({ className = '', iconOnly = false, size = 'md' }: MamiHubLogoProps) {
  // Define dimensions based on size
  const sizes = {
    sm: {
      height: 28,
      textSize: 'text-xs font-bold font-mono tracking-wider',
      spacing: 'gap-1',
      iconWidth: 16,
    },
    md: {
      height: 38,
      textSize: 'text-base sm:text-lg font-black tracking-semibold',
      spacing: 'gap-1.5',
      iconWidth: 24,
    },
    lg: {
      height: 48,
      textSize: 'text-xl sm:text-2xl font-black tracking-tight',
      spacing: 'gap-2',
      iconWidth: 32,
    },
  };

  const currentSize = sizes[size];

  // The Market Stormer stylized shopping bag logo 
  const logoBagIcon = (
    <svg
      role="img"
      aria-label="Market Stormer Bag Logo"
      viewBox="0 0 100 100"
      width={currentSize.iconWidth}
      height={currentSize.iconWidth}
      className="flex-shrink-0"
    >
      {/* Shopping bag body: Deep Forest Green (#244F3B) */}
      <path
        d="M 15 32 L 85 32 C 87.5 32, 89.5 34, 89.5 36.5 L 87.5 88 C 87.5 92, 84 95, 80 95 L 20 95 C 16 95, 12.5 92, 12.5 88 L 10.5 36.5 C 10.5 34, 12.5 32, 15 32 Z"
        fill="#244F3B"
      />
      {/* Shopping bag handle: Deep Forest Green (#244F3B) */}
      <path
        d="M 32 32 C 32 18, 40 10, 50 10 C 60 10, 68 18, 68 32 M 32 32 C 32 24, 38 18, 50 18 C 62 18, 68 24, 68 32"
        fill="none"
        stroke="#244F3B"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Decorative attachment circles/buttons on the handles */}
      <circle cx="32" cy="32" r="3.5" fill="#f49c4a" />
      <circle cx="68" cy="32" r="3.5" fill="#f49c4a" />

      {/* Stylized Accent Letter "M" inside the bag representing Market */}
      <path
        d="M 28 85 L 28 44 L 38 44 L 50 64 L 62 44 L 72 44 L 72 85 L 63 85 L 63 56 L 50 75 L 37 56 L 37 85 Z"
        fill="#f49c4a"
      />
    </svg>
  );

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {logoBagIcon}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${currentSize.spacing} select-none ${className}`}>
      {/* Brand Name Prefix "MARKET" in bold Spruce/Deep Green */}
      <span className={`font-display font-extrabold text-[#244F3B] uppercase ${currentSize.textSize}`}>
        MARKET
      </span>

      {/* Recreated Logo Bag with stylized orange M */}
      {logoBagIcon}

      {/* Brand Name Suffix "STORMER" in bold Spruce/Deep Green */}
      <span className={`font-display font-extrabold text-[#244F3B] uppercase ${currentSize.textSize}`}>
        STORMER
      </span>
    </div>
  );
}
