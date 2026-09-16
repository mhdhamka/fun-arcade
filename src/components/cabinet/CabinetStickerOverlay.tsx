import React from 'react';
import { CabinetSticker, StickerPlacement } from '../../types/arcade';

interface CabinetStickerOverlayProps {
  stickers: CabinetSticker[];
  placement: StickerPlacement;
  onRemoveSticker?: (id: string) => void;
  interactive?: boolean;
}

export const CabinetStickerOverlay: React.FC<CabinetStickerOverlayProps> = ({
  stickers,
  placement,
  onRemoveSticker,
  interactive = false,
}) => {
  const sticker = stickers.find((s) => s.placement === placement);

  if (!sticker) return null;

  // Placement container alignment classes
  let positionClasses = '';
  switch (placement) {
    case 'top_left':
      positionClasses = 'top-2 left-2 sm:top-3 sm:left-3';
      break;
    case 'top_right':
      positionClasses = 'top-2 right-2 sm:top-3 sm:right-3';
      break;
    case 'bottom_left':
      positionClasses = 'bottom-2 left-2 sm:bottom-3 sm:left-3';
      break;
    case 'bottom_right':
      positionClasses = 'bottom-2 right-2 sm:bottom-3 sm:right-3';
      break;
  }

  // Filter styles
  let filterStyle = '';
  if (sticker.filter === 'worn') {
    filterStyle = 'sepia(25%) contrast(110%) brightness(95%)';
  } else if (sticker.filter === 'holographic') {
    filterStyle = 'saturate(160%) contrast(115%)';
  }

  return (
    <div
      className={`absolute z-20 pointer-events-auto select-none transition-transform duration-150 ${positionClasses}`}
      style={{
        transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="relative group cursor-pointer">
        {/* Die-cut vinyl white border sticker container */}
        <div
          className={`relative rounded-lg p-0.5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.75)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.9)] overflow-hidden ${
            sticker.filter === 'holographic' ? 'ring-1 ring-cyan-300/80' : ''
          }`}
          style={{ filter: filterStyle }}
        >
          {/* Holographic Prismatic Sheen Overlay */}
          {sticker.filter === 'holographic' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-pink-400/20 to-yellow-300/20 mix-blend-overlay pointer-events-none animate-pulse" />
          )}

          {/* Worn Vintage Peeling Corner Accent */}
          {sticker.filter === 'worn' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-stone-900/40 transform rotate-45 pointer-events-none" />
          )}

          <img
            src={sticker.imageUrl}
            alt={sticker.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover block pointer-events-none"
            loading="lazy"
          />
        </div>

        {/* Interactive remove button when in editor mode */}
        {interactive && onRemoveSticker && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSticker(sticker.id);
            }}
            title={`Remove ${sticker.name}`}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
