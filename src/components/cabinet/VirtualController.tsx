import React, { useCallback, useRef } from 'react';
import { VirtualInputState } from '../../types/arcade';

interface VirtualControllerProps {
  onInputChange: (state: VirtualInputState) => void;
  gameId: string;
}

export const VirtualController: React.FC<VirtualControllerProps> = ({
  onInputChange,
  gameId,
}) => {
  const activeKeysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    actionA: false,
    actionB: false,
  });

  const triggerInput = useCallback(
    (updates: Partial<typeof activeKeysRef.current>) => {
      activeKeysRef.current = { ...activeKeysRef.current, ...updates };

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // Ignore vibrate restrictions
        }
      }

      onInputChange({
        ...activeKeysRef.current,
        timestamp: Date.now(),
      });
    },
    [onInputChange]
  );

  const handlePress = (key: keyof typeof activeKeysRef.current) => {
    triggerInput({ [key]: true });
  };

  const handleRelease = (key: keyof typeof activeKeysRef.current) => {
    triggerInput({ [key]: false });
  };

  // Label customizations based on game
  let actionALabel = 'A';
  let actionBLabel = 'B';
  if (gameId === 'flappy') {
    actionALabel = 'FLAP';
  } else if (gameId === 'invaders') {
    actionALabel = 'FIRE';
  } else if (gameId === 'tetris') {
    actionALabel = 'DROP';
    actionBLabel = 'HOLD';
  } else if (gameId === 'snake') {
    actionALabel = 'BOOST';
  }

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-1 select-none touch-manipulation">
      <div className="bg-slate-900/90 border-t-2 border-slate-800 px-4 py-3 rounded-b-xl flex items-center justify-between shadow-inner">
        {/* Directional Pad (D-Pad) */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Up */}
          <button
            id="vctrl-up"
            type="button"
            className="absolute top-0 w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-t-lg flex items-center justify-center text-slate-300 active:text-white transition shadow"
            onPointerDown={() => handlePress('up')}
            onPointerUp={() => handleRelease('up')}
            onPointerLeave={() => handleRelease('up')}
            aria-label="Up"
          >
            <span className="text-sm font-bold">▲</span>
          </button>

          {/* Left */}
          <button
            id="vctrl-left"
            type="button"
            className="absolute left-0 w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-l-lg flex items-center justify-center text-slate-300 active:text-white transition shadow"
            onPointerDown={() => handlePress('left')}
            onPointerUp={() => handleRelease('left')}
            onPointerLeave={() => handleRelease('left')}
            aria-label="Left"
          >
            <span className="text-sm font-bold">◄</span>
          </button>

          {/* Center Pivot */}
          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-950/80 border border-slate-700/50" />
          </div>

          {/* Right */}
          <button
            id="vctrl-right"
            type="button"
            className="absolute right-0 w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-r-lg flex items-center justify-center text-slate-300 active:text-white transition shadow"
            onPointerDown={() => handlePress('right')}
            onPointerUp={() => handleRelease('right')}
            onPointerLeave={() => handleRelease('right')}
            aria-label="Right"
          >
            <span className="text-sm font-bold">►</span>
          </button>

          {/* Down */}
          <button
            id="vctrl-down"
            type="button"
            className="absolute bottom-0 w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-b-lg flex items-center justify-center text-slate-300 active:text-white transition shadow"
            onPointerDown={() => handlePress('down')}
            onPointerUp={() => handleRelease('down')}
            onPointerLeave={() => handleRelease('down')}
            aria-label="Down"
          >
            <span className="text-sm font-bold">▼</span>
          </button>
        </div>

        {/* Action Buttons (A & B) */}
        <div className="flex items-center gap-4">
          {/* Button B */}
          <div className="flex flex-col items-center">
            <button
              id="vctrl-btn-b"
              type="button"
              className="w-13 h-13 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-400 active:to-amber-600 border-2 border-amber-300/40 active:border-white shadow-lg active:scale-95 flex items-center justify-center text-white font-retro text-[10px] transition"
              onPointerDown={() => handlePress('actionB')}
              onPointerUp={() => handleRelease('actionB')}
              onPointerLeave={() => handleRelease('actionB')}
              aria-label={actionBLabel}
            >
              B
            </button>
            <span className="text-[9px] font-retro text-slate-400 mt-1">{actionBLabel}</span>
          </div>

          {/* Button A */}
          <div className="flex flex-col items-center">
            <button
              id="vctrl-btn-a"
              type="button"
              className="w-14 h-14 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 active:from-rose-400 active:to-rose-600 border-2 border-rose-300/50 active:border-white shadow-lg active:scale-95 flex items-center justify-center text-white font-retro text-[11px] transition"
              onPointerDown={() => handlePress('actionA')}
              onPointerUp={() => handleRelease('actionA')}
              onPointerLeave={() => handleRelease('actionA')}
              aria-label={actionALabel}
            >
              A
            </button>
            <span className="text-[9px] font-retro text-slate-400 mt-1">{actionALabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
