import React, { useEffect, useState } from 'react';

// Nimiq Identicon SVG generator
// Generates the official Nimiq hexagonal avatar for any address or seed string
export function hashStringToColor(str: string): { bg: string; fill: string; accent: string } {
  const PALETTE = [
    { bg: '#FC8702', fill: '#FFCA1A', accent: '#E9B213' }, // Gold / Amber
    { bg: '#1F2348', fill: '#0582CA', accent: '#21BCA5' }, // Nimiq Blue
    { bg: '#0582CA', fill: '#21BCA5', accent: '#5961A8' }, // Teal
    { bg: '#5F4B8B', fill: '#FA7268', accent: '#E9B213' }, // Purple
    { bg: '#D94432', fill: '#FC8702', accent: '#FFCA1A' }, // Crimson
    { bg: '#21BCA5', fill: '#0582CA', accent: '#1F2348' }, // Emerald
    { bg: '#88B04B', fill: '#E9B213', accent: '#FC8702' }, // Olive
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

interface NimiqIdenticonProps {
  address: string;
  size?: number;
  className?: string;
}

export const NimiqIdenticon: React.FC<NimiqIdenticonProps> = ({
  address,
  size = 32,
  className = '',
}) => {
  const colors = hashStringToColor(address || 'NQ00 0000 0000 0000');

  // Compute a deterministic geometric pattern based on characters
  const cleanAddr = (address || '').replace(/\s+/g, '');
  const charCodeSum = cleanAddr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rotation = (charCodeSum % 360);
  const ringCount = 3 + (charCodeSum % 3);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden shadow-xs ${className}`}
      style={{ width: size, height: size }}
      title={address}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${cleanAddr}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.bg} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
        </defs>

        {/* Nimiq Hexagonal background */}
        <polygon
          points="50,4 90,27 90,73 50,96 10,73 10,27"
          fill={`url(#grad-${cleanAddr})`}
        />

        {/* Outer concentric hex ring */}
        <polygon
          points="50,14 82,32 82,68 50,86 18,68 18,32"
          fill="none"
          stroke={colors.fill}
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Center core insignia */}
        <circle cx="50" cy="50" r="16" fill={colors.fill} />
        <circle cx="50" cy="50" r="8" fill={colors.bg} />

        {/* Subtle dynamic accent dots */}
        <g transform={`rotate(${rotation} 50 50)`} opacity="0.8">
          <circle cx="50" cy="24" r="3.5" fill="#FFFFFF" />
          <circle cx="50" cy="76" r="3.5" fill="#FFFFFF" />
          {ringCount >= 4 && (
            <>
              <circle cx="27" cy="50" r="3" fill="#FFFFFF" opacity="0.6" />
              <circle cx="73" cy="50" r="3" fill="#FFFFFF" opacity="0.6" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
