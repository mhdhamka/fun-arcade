import React, { useState } from 'react';
import { PlayerProfile, PixelAvatar } from '../../types/arcade';
import { PixelAvatarView } from '../common/PixelAvatarView';
import {
  PRESET_AVATARS,
  RETRO_PALETTE,
  generateProceduralAvatar,
} from '../../services/avatars';
import { soundManager } from '../../services/audio';
import {
  X,
  Sparkles,
  Palette,
  User,
  Wand2,
  Paintbrush,
  RotateCcw,
  Check,
  Crown,
  RefreshCw,
  FlipHorizontal,
} from 'lucide-react';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onSaveProfile: (profile: PlayerProfile) => void;
}

const PLAYER_TITLES = [
  'Arcade Ace',
  'High Score Chaser',
  'Pixel Wizard',
  'Quarter Champion',
  'Retro God',
  'Cyber Runner',
  'Cabinet Crusher',
  'Speed Demon',
  'Neon Vanguard',
  '1CC Legend',
];

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'presets' | 'generate' | 'editor'>('presets');
  const [playerName, setPlayerName] = useState(profile.name);
  const [playerTitle, setPlayerTitle] = useState(profile.title);
  const [currentAvatar, setCurrentAvatar] = useState<PixelAvatar>({ ...profile.avatar });

  // Pixel Studio (Custom 8x8 Editor) state
  const [editorPixels, setEditorPixels] = useState<string[]>(() => [...profile.avatar.pixels]);
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [isSymmetric, setIsSymmetric] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [editorAccent, setEditorAccent] = useState<string>(profile.avatar.accentColor || '#38bdf8');

  const handleSelectPreset = (preset: PixelAvatar) => {
    soundManager.play('select');
    setCurrentAvatar({ ...preset });
    setEditorPixels([...preset.pixels]);
    setEditorAccent(preset.accentColor);
  };

  const handleGenerateRandom = () => {
    soundManager.play('coin');
    const newAvatar = generateProceduralAvatar(playerName);
    setCurrentAvatar(newAvatar);
    setEditorPixels([...newAvatar.pixels]);
    setEditorAccent(newAvatar.accentColor);
  };

  const handlePixelClick = (index: number) => {
    soundManager.play('select');
    setEditorPixels((prev) => {
      const next = [...prev];
      next[index] = selectedColor;

      if (isSymmetric) {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const mirroredCol = 7 - col;
        const mirroredIndex = row * 8 + mirroredCol;
        next[mirroredIndex] = selectedColor;
      }
      return next;
    });
  };

  const handlePixelEnter = (index: number) => {
    if (!isDrawing) return;
    setEditorPixels((prev) => {
      const next = [...prev];
      next[index] = selectedColor;

      if (isSymmetric) {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const mirroredCol = 7 - col;
        const mirroredIndex = row * 8 + mirroredCol;
        next[mirroredIndex] = selectedColor;
      }
      return next;
    });
  };

  const handleClearEditor = () => {
    soundManager.play('clear');
    setEditorPixels(Array(64).fill(''));
  };

  const handleApplyEditor = () => {
    soundManager.play('fanfare');
    const custom: PixelAvatar = {
      id: `custom_${Date.now()}`,
      name: `${playerName}'s Custom Sprite`,
      type: 'custom',
      pixels: [...editorPixels],
      accentColor: editorAccent,
      backgroundColor: '#020617',
    };
    setCurrentAvatar(custom);
    setActiveTab('presets');
  };

  const handleSaveAll = () => {
    soundManager.play('level');
    const cleanName = playerName.trim().toUpperCase() || 'PLAYER_1';
    const updated: PlayerProfile = {
      ...profile,
      name: cleanName,
      title: playerTitle,
      avatar: currentAvatar,
    };
    onSaveProfile(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseUp={() => setIsDrawing(false)}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-retro text-amber-400 tracking-wider">
                PLAYER PROFILE // 8-BIT AVATAR
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Customize your arcade identity for global leaderboards
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Profile Card Showcase */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
            <PixelAvatarView
              avatar={currentAvatar}
              size="xl"
              glow
              className="ring-2 ring-slate-700/50 shadow-lg"
            />
            <div className="flex-1 text-center sm:text-left space-y-3 w-full">
              <div className="space-y-1">
                <label className="text-[10px] font-retro text-slate-400 uppercase tracking-widest block">
                  Arcade Handle / Tag
                </label>
                <input
                  id="input-player-name"
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="PLAYER_1"
                  className="w-full sm:w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-retro text-cyan-300 tracking-widest focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-retro text-slate-400 uppercase tracking-widest block">
                  Player Title
                </label>
                <select
                  id="select-player-title"
                  value={playerTitle}
                  onChange={(e) => setPlayerTitle(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {PLAYER_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="inline-block px-2.5 py-1 text-[10px] font-retro rounded border bg-slate-900 text-slate-400 border-slate-800">
                {currentAvatar.type.toUpperCase()} AVATAR
              </span>
            </div>
          </div>

          {/* Avatar Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              id="tab-presets"
              type="button"
              onClick={() => {
                soundManager.play('select');
                setActiveTab('presets');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>AVATAR GALLERY</span>
            </button>

            <button
              id="tab-generate"
              type="button"
              onClick={() => {
                soundManager.play('select');
                setActiveTab('generate');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>GENERATOR</span>
            </button>

            <button
              id="tab-editor"
              type="button"
              onClick={() => {
                soundManager.play('select');
                setActiveTab('editor');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>PIXEL STUDIO</span>
            </button>
          </div>

          {/* TAB 1: PRESET GALLERY */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="text-xs font-mono text-slate-400">
                Choose an iconic 8-bit arcade hero or villain preset:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = currentAvatar.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <PixelAvatarView avatar={preset} size="lg" glow={isSelected} />
                      <span className="text-[10px] font-retro text-center text-slate-300 truncate w-full">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[9px] font-retro text-cyan-400">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROCEDURAL GENERATOR */}
          {activeTab === 'generate' && (
            <div className="space-y-5 text-center py-4">
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xs font-retro text-amber-400">
                  PROCEDURAL 8-BIT SPRITE SYNTHESIZER
                </h3>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Synthesizes symmetrical retro sprite matrices with randomized cyberpunk,
                  neon, and chiptune color palettes.
                </p>
              </div>

              <div className="flex justify-center my-4">
                <PixelAvatarView
                  avatar={currentAvatar}
                  size="2xl"
                  glow
                  className="ring-4 ring-amber-500/30"
                />
              </div>

              <div className="text-xs font-retro text-slate-300">
                CURRENT SEED: <span className="text-amber-400">{currentAvatar.name}</span>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  id="btn-roll-procedural"
                  type="button"
                  onClick={handleGenerateRandom}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-retro text-xs tracking-wider font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>GENERATE NEW SPRITE</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PIXEL STUDIO (CUSTOM 8x8 EDITOR) */}
          {activeTab === 'editor' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-retro text-purple-300">
                    PIXEL MATRIX STUDIO (8x8 CANVAS)
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Click and drag across the canvas to draw your custom pixel hero.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSymmetric(!isSymmetric)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      isSymmetric
                        ? 'bg-purple-950 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                    title="Mirror painting symmetrically"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>SYMMETRY: {isSymmetric ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearEditor}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>CLEAR</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* 8x8 Interactive Grid */}
                <div className="md:col-span-6 flex justify-center">
                  <div
                    className="p-3 bg-slate-950 border-2 border-purple-500/50 rounded-xl shadow-xl select-none"
                    onMouseDown={() => setIsDrawing(true)}
                  >
                    <div className="grid grid-cols-8 gap-1 w-64 h-64 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      {editorPixels.map((color, idx) => (
                        <div
                          key={idx}
                          onMouseDown={() => handlePixelClick(idx)}
                          onMouseEnter={() => handlePixelEnter(idx)}
                          style={{
                            backgroundColor: color || '#090d16',
                          }}
                          className={`w-full h-full rounded-[2px] cursor-crosshair border border-slate-800/40 hover:border-white/60 transition-colors ${
                            isSymmetric && idx % 8 === 3 ? 'border-r-purple-500/60' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Palette & Controls */}
                <div className="md:col-span-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-retro text-slate-400 uppercase tracking-widest block mb-2">
                      Arcade Palette (16 Colors)
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {RETRO_PALETTE.map((c, i) => {
                        const isChosen = selectedColor === c.hex;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedColor(c.hex)}
                            title={c.name}
                            style={{
                              backgroundColor: c.hex || '#020617',
                            }}
                            className={`w-8 h-8 rounded-md border-2 transition-transform cursor-pointer relative ${
                              isChosen
                                ? 'border-white scale-110 shadow-lg ring-2 ring-purple-400'
                                : 'border-slate-800 hover:scale-105'
                            } ${!c.hex ? 'overflow-hidden' : ''}`}
                          >
                            {!c.hex && (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-rose-400">
                                ✕
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-retro text-slate-400 uppercase tracking-widest block mb-2">
                      Avatar Glow Accent
                    </label>
                    <div className="flex gap-2">
                      {['#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'].map(
                        (col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setEditorAccent(col)}
                            style={{ backgroundColor: col }}
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${
                              editorAccent === col ? 'border-white scale-110 ring-2 ring-purple-400' : 'border-transparent'
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <button
                    id="btn-apply-editor-avatar"
                    type="button"
                    onClick={handleApplyEditor}
                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-retro text-xs tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>USE THIS PIXEL ART</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition cursor-pointer"
          >
            CANCEL
          </button>

          <button
            id="btn-save-profile"
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-retro text-xs tracking-wider font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>SAVE PROFILE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
