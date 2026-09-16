import React from 'react';

interface CrtOverlayProps {
  enabled: boolean;
}

export const CrtOverlay: React.FC<CrtOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-lg">
      <div className="absolute inset-0 crt-overlay opacity-80" />
      <div className="absolute inset-0 crt-vignette opacity-70" />
    </div>
  );
};
