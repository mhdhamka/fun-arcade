import React from 'react';
import { PixelAvatar } from '../../types/arcade';

interface PixelAvatarViewProps {
  avatar?: PixelAvatar | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  customPx?: number;
  className?: string;
  showBorder?: boolean;
  glow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  title?: string;
}

const SIZE_MAP = {
  xs: 22,
  sm: 30,
  md: 42,
  lg: 60,
  xl: 84,
  '2xl': 128,
};

export const PixelAvatarView: React.FC<PixelAvatarViewProps> = ({
  avatar,
  size = 'md',
  customPx,
  className = '',
  showBorder = true,
  glow = false,
  interactive = false,
  onClick,
  title,
}) => {
  const pixelDimension = customPx || SIZE_MAP[size];
  const accent = avatar?.accentColor || '#38bdf8';
  const pixels = avatar?.pixels || [];

  return (
    <div
      onClick={onClick}
      title={title || avatar?.name || '8-bit Avatar'}
      style={{
        width: `${pixelDimension}px`,
        height: `${pixelDimension}px`,
        boxShadow: glow ? `0 0 14px ${accent}66` : undefined,
        borderColor: showBorder ? (glow ? accent : '#334155') : 'transparent',
      }}
      className={`relative select-none overflow-hidden rounded-md bg-slate-950 flex-shrink-0 ${
        showBorder ? 'border-2' : ''
      } ${
        interactive ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''
      } ${className}`}
    >
      {/* 8x8 Pixel Grid rendered as high-performance SVG */}
      <svg
        viewBox="0 0 8 8"
        className="w-full h-full block"
        style={{
          shapeRendering: 'crispEdges',
          imageRendering: 'pixelated',
        }}
      >
        {/* Background backdrop fill if specified */}
        <rect width="8" height="8" fill={avatar?.backgroundColor || '#020617'} />

        {/* 64 cells */}
        {pixels.map((color, idx) => {
          if (!color || color === 'transparent') return null;
          const x = idx % 8;
          const y = Math.floor(idx / 8);
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={color}
            />
          );
        })}
      </svg>

      {/* Subtle CRT micro-scanline gloss overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.2) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};
