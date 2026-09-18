import React, { useState, useRef, useEffect } from 'react';
import { ThemeId, PlayerProfile } from '../../types/arcade';
import { PixelAvatarView } from './PixelAvatarView';
import {
  Gamepad2,
  Tv,
  Volume2,
  VolumeX,
  Palette,
  Trophy,
  Radio,
  Settings,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';

interface NavbarProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  scanlines: boolean;
  onToggleScanlines: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  ambientEnabled?: boolean;
  onToggleAmbient?: () => void;
  onOpenLeaderboards?: () => void;
  profile?: PlayerProfile;
  onOpenProfile?: () => void;
  onOpenCabinetCustomizer?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onThemeChange,
  scanlines,
  onToggleScanlines,
  soundEnabled,
  onToggleSound,
  ambientEnabled = true,
  onToggleAmbient,
  onOpenLeaderboards,
  profile,
  onOpenProfile,
  onOpenCabinetCustomizer,
  onOpenSettings,
}) => {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setQuickMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo & Platform Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-pink-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-retro text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 tracking-wider">
                FUN ARCADE
              </span>
              <span className="text-[9px] font-retro px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800 text-cyan-400 rounded">
                v1.0.0
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              MODULAR CLASSIC RETRO GAMING EMULATOR
            </span>
          </div>
        </div>

        {/* Primary Actions & Collapsible Menu Trigger */}
        <div className="flex items-center gap-2 relative">
          
          {/* Player Profile & 8-Bit Avatar Chip */}
          {onOpenProfile && profile && (
            <button
              id="btn-nav-profile"
              type="button"
              onClick={onOpenProfile}
              title="Edit Player Profile & 8-Bit Avatar"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs font-mono transition cursor-pointer group shadow-sm"
            >
              <PixelAvatarView avatar={profile.avatar} size="xs" showBorder={false} />
              <div className="flex flex-col text-left leading-none pr-1">
                <span className="font-retro text-[9px] text-amber-300 group-hover:text-amber-200 uppercase tracking-wider">
                  {profile.name}
                </span>
                <span className="text-[8px] text-slate-400 font-mono hidden md:inline">
                  {profile.title}
                </span>
              </div>
            </button>
          )}

          {/* Hall of Fame jump button */}
          {onOpenLeaderboards && (
            <button
              id="btn-nav-halloffame"
              type="button"
              onClick={onOpenLeaderboards}
              title="Badges & High Scores Records"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/60 text-amber-400 rounded-lg text-xs font-retro transition cursor-pointer shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline text-[9px]">RECORDS</span>
            </button>
          )}

          {/* Master Settings Button */}
          {onOpenSettings && (
            <button
              id="btn-nav-settings"
              type="button"
              onClick={onOpenSettings}
              title="Open Arcade System Settings"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/70 text-slate-300 hover:text-amber-300 text-xs font-mono transition cursor-pointer shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span className="hidden md:inline font-retro text-[9px]">SETTINGS</span>
            </button>
          )}

          {/* Collapsible Quick Toggles Dropdown Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              id="btn-nav-quick-menu"
              type="button"
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              title="Toggle System Toggles & Customization"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer shadow-sm ${
                quickMenuOpen
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950 border-slate-700 hover:border-slate-500 text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-retro text-[9px]">SYSTEM</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${quickMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Drawer */}
            {quickMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-retro text-[10px] text-cyan-400 tracking-wider">SYSTEM CONTROLS</span>
                  <button 
                    onClick={() => setQuickMenuOpen(false)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" /> THEME EMULATION
                  </label>
                  <select
                    id="select-theme"
                    value={theme}
                    onChange={(e) => onThemeChange(e.target.value as ThemeId)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-retro py-1.5 px-2 rounded-lg outline-none cursor-pointer focus:border-cyan-500"
                  >
                    <option value="cyberpunk" className="bg-slate-900 text-cyan-400">CYBERPUNK NEON</option>
                    <option value="crt" className="bg-slate-900 text-emerald-400">CRT 8-BIT GREEN</option>
                    <option value="minimalist" className="bg-slate-900 text-slate-300">MINIMALIST DARK</option>
                  </select>
                </div>

                {/* Cabinet Customizer Trigger */}
                {onOpenCabinetCustomizer && (
                  <button
                    id="btn-nav-cabinet-customizer"
                    type="button"
                    onClick={() => {
                      onOpenCabinetCustomizer();
                      setQuickMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900/90 hover:to-indigo-900/90 border border-purple-600/70 text-purple-200 text-xs font-retro transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    <span>CUSTOMIZE CABINET CHASSIS</span>
                  </button>
                )}

                <div className="h-px bg-slate-800 my-0.5" />

                {/* Toggles Grid (CRT, SFX, Ambient) */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* CRT Scanline Toggle */}
                  <button
                    id="btn-nav-scanlines"
                    type="button"
                    onClick={onToggleScanlines}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      scanlines
                        ? 'bg-emerald-950/70 border-emerald-600 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Tv className="w-4 h-4" />
                    <span className="font-retro text-[8px]">CRT {scanlines ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Sound FX Toggle */}
                  <button
                    id="btn-nav-sound"
                    type="button"
                    onClick={onToggleSound}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      soundEnabled
                        ? 'bg-cyan-950/70 border-cyan-600 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-rose-950/50 border-rose-900 text-rose-400'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="font-retro text-[8px]">SFX {soundEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Ambient Audio Toggle */}
                  {onToggleAmbient && (
                    <button
                      id="btn-nav-ambient"
                      type="button"
                      onClick={onToggleAmbient}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs font-mono transition cursor-pointer ${
                        ambientEnabled && soundEnabled
                          ? 'bg-purple-950/70 border-purple-600 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Radio className={`w-4 h-4 ${ambientEnabled && soundEnabled ? 'animate-pulse text-purple-400' : ''}`} />
                      <span className="font-retro text-[8px]">AMBIENT</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};