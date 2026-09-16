import React, { useEffect, useState } from 'react';
import { Achievement } from '../../types/arcade';
import { achievementsEngine } from '../../services/achievements';
import {
  Trophy,
  Crown,
  Zap,
  Footprints,
  Compass,
  Layers,
  Sparkles,
  Target,
  Crosshair,
  Gamepad2,
  Flame,
  X,
  Award,
} from 'lucide-react';

export const AchievementToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);

  useEffect(() => {
    const unsubscribe = achievementsEngine.subscribe((achievement) => {
      setActiveToast(achievement);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Trophy':
        return <Trophy {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Footprints':
        return <Footprints {...props} />;
      case 'Crown':
        return <Crown {...props} />;
      case 'Compass':
        return <Compass {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'Target':
        return <Target {...props} />;
      case 'Crosshair':
        return <Crosshair {...props} />;
      case 'Gamepad2':
        return <Gamepad2 {...props} />;
      case 'Flame':
        return <Flame {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className="relative bg-slate-950/95 border-2 rounded-xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden flex items-start gap-3.5"
        style={{
          borderColor: activeToast.accentColor,
          boxShadow: `0 0 25px ${activeToast.accentColor}55`,
        }}
      >
        {/* Glowing backdrop pulse */}
        <div
          className="absolute -top-10 -right-10 w-28 h-28 opacity-20 blur-xl rounded-full pointer-events-none"
          style={{ backgroundColor: activeToast.accentColor }}
        />

        {/* Scanlines on toast */}
        <div className="absolute inset-0 crt-overlay opacity-30 pointer-events-none" />

        {/* Badge Icon Emblem */}
        <div
          className="shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center shadow-lg relative"
          style={{
            borderColor: activeToast.accentColor,
            backgroundColor: `${activeToast.accentColor}18`,
            color: activeToast.accentColor,
            boxShadow: `0 0 15px ${activeToast.accentColor}44`,
          }}
        >
          {renderIcon(activeToast.iconName)}
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: activeToast.accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: activeToast.accentColor }}
            />
          </span>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-retro tracking-widest text-amber-400 uppercase flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>ACHIEVEMENT UNLOCKED</span>
            </span>
          </div>
          <h4
            className="text-sm font-retro text-white tracking-wide truncate mb-1"
            style={{ textShadow: `0 0 8px ${activeToast.accentColor}66` }}
          >
            {activeToast.title}
          </h4>
          <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
            {activeToast.description}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveToast(null)}
          className="text-slate-500 hover:text-white p-1 rounded transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
