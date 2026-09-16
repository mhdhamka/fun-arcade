import React from 'react';
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
  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo & Platform Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-pink-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center">
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
            <span className="text-[10px] font-mono text-slate-400">
              MODULAR CLASSIC RETRO GAMING EMULATOR
            </span>
          </div>
        </div>

        {/* Global Control Toggles & Settings */}
        <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-end">
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
          {/* Theme Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-theme"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as ThemeId)}
              className="bg-transparent text-slate-300 text-xs font-retro outline-none cursor-pointer pr-1"
            >
              <option value="cyberpunk" className="bg-slate-900 text-cyan-400">
                CYBERPUNK NEON
              </option>
              <option value="crt" className="bg-slate-900 text-emerald-400">
                CRT 8-BIT GREEN
              </option>
              <option value="minimalist" className="bg-slate-900 text-slate-300">
                MINIMALIST DARK
              </option>
            </select>
          </div>

          {/* Cabinet Customizer Trigger Button */}
          {onOpenCabinetCustomizer && (
            <button
              id="btn-nav-cabinet-customizer"
              type="button"
              onClick={onOpenCabinetCustomizer}
              title="Customize Physical Cabinet Chassis & Sticker Decals"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900/90 hover:to-indigo-900/90 border border-purple-600/70 text-purple-300 hover:text-purple-200 text-xs font-mono transition cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            >
              <span className="font-retro text-[9px]">CABINET</span>
            </button>
          )}

          {/* Master Settings Trigger Button */}
          {onOpenSettings && (
            <button
              id="btn-nav-settings"
              type="button"
              onClick={onOpenSettings}
              title="Open Arcade System Settings & Cabinet Customizer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/70 text-slate-300 hover:text-amber-300 text-xs font-mono transition cursor-pointer shadow"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span className="hidden md:inline font-retro text-[9px]">SETTINGS</span>
            </button>
          )}

          {/* CRT Scanline Toggle */}
          <button
            id="btn-nav-scanlines"
            type="button"
            onClick={onToggleScanlines}
            title={scanlines ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
              scanlines
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-retro text-[9px]">CRT</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            id="btn-nav-sound"
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute 8-bit Audio' : 'Unmute 8-bit Audio'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/70 border-cyan-600 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-rose-950/50 border-rose-900 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-retro text-[9px]">SFX</span>
          </button>

          {/* Ambient Arcade Hall Background Audio Toggle */}
          {onToggleAmbient && (
            <button
              id="btn-nav-ambient"
              type="button"
              onClick={onToggleAmbient}
              title={
                ambientEnabled && soundEnabled
                  ? 'Mute Ambient Arcade Noise (Cabinet hum & coin drops active)'
                  : 'Enable Ambient Arcade Noise'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                ambientEnabled && soundEnabled
                  ? 'bg-purple-950/70 border-purple-600 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${ambientEnabled && soundEnabled ? 'animate-pulse text-purple-400' : ''}`} />
              <span className="hidden sm:inline font-retro text-[9px]">AMBIENT</span>
            </button>
          )}

          {/* Hall of Fame jump button */}
          {onOpenLeaderboards && (
            <button
              id="btn-nav-halloffame"
              type="button"
              onClick={onOpenLeaderboards}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/60 text-amber-400 rounded-lg text-xs font-retro transition cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[9px]">BADGES & RECORDS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
