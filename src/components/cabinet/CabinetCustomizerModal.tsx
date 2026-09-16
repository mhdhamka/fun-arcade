import React, { useState, useRef } from 'react';
import {
  CabinetStyleId,
  CabinetCustomizationState,
  CabinetSticker,
  StickerPlacement,
  StickerWearFilter,
} from '../../types/arcade';
import {
  CABINET_ART_STYLES,
  STICKER_CATALOG,
  StickerCatalogItem,
  cabinetService,
} from '../../services/cabinetStyles';
import { soundManager } from '../../services/audio';
import {
  X,
  Palette,
  Layers,
  Sliders,
  Upload,
  RefreshCw,
  Check,
  Zap,
  Trash2,
  Tv,
} from 'lucide-react';

interface CabinetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: CabinetCustomizationState;
  onSaveConfig: (newConfig: CabinetCustomizationState) => void;
  soundEnabled?: boolean;
}

const PRESET_AI_PROMPTS = [
  { label: 'Cyber Ninja Skull', keyword: 'cyber_ninja', color: '#06b6d4', shape: 'skull' },
  { label: '1-UP Star Token', keyword: 'gold_star', color: '#eab308', shape: 'star' },
  { label: 'Retro Laser Bolt', keyword: 'turbo_bolt', color: '#ec4899', shape: 'bolt' },
  { label: 'Pixel Dragon Fire', keyword: 'pixel_dragon', color: '#10b981', shape: 'dragon' },
  { label: 'Cosmic Invader Bot', keyword: 'space_bot', color: '#a855f7', shape: 'alien' },
  { label: 'Synthwave Heart', keyword: 'neon_heart', color: '#f43f5e', shape: 'heart' },
];

export const CabinetCustomizerModal: React.FC<CabinetCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  soundEnabled = true,
}) => {
  const [config, setConfig] = useState<CabinetCustomizationState>({
    ...currentConfig,
    stickers: [...currentConfig.stickers],
  });

  const [activeTab, setActiveTab] = useState<'styles' | 'stickers' | 'ai_generator'>('styles');
  const [selectedPlacement, setSelectedPlacement] = useState<StickerPlacement>('top_left');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customStickers, setCustomStickers] = useState<StickerCatalogItem[]>([]);
  const [saveToast, setSaveToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const currentStyleConfig = cabinetService.getStyleConfig(config.styleId);
  const activeSticker = config.stickers.find((s) => s.placement === selectedPlacement);

  // Play retro audio click
  const playClick = () => {
    if (soundEnabled) {
      soundManager.play('select');
    }
  };

  // Change Cabinet Art Style
  const handleSelectStyle = (styleId: CabinetStyleId) => {
    playClick();
    setConfig((prev) => ({ ...prev, styleId }));
  };

  // Apply a sticker from catalog to active slot
  const handleApplySticker = (item: StickerCatalogItem) => {
    playClick();
    setConfig((prev) => {
      const filtered = prev.stickers.filter((s) => s.placement !== selectedPlacement);
      const newSticker: CabinetSticker = {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        imageUrl: item.imageUrl,
        placement: selectedPlacement,
        rotation: item.defaultRotation,
        scale: 1.0,
        filter: 'normal',
      };
      return {
        ...prev,
        stickers: [...filtered, newSticker],
      };
    });
  };

  // Remove sticker from slot
  const handleRemoveStickerFromSlot = (placement: StickerPlacement) => {
    playClick();
    setConfig((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.placement !== placement),
    }));
  };

  // Update properties of sticker in selected slot
  const handleUpdateActiveSticker = (updates: Partial<CabinetSticker>) => {
    if (!activeSticker) return;
    setConfig((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) =>
        s.placement === selectedPlacement ? { ...s, ...updates } : s
      ),
    }));
  };

  // Procedural Sticker Synthesizer (Generates unique vector/pixel die-cut vinyl decals onto a clean canvas)
  const generateProceduralSticker = (promptLabel: string, color: string, shapeType: string) => {
    setIsGenerating(true);
    if (soundEnabled) soundManager.play('coin');

    setTimeout(() => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, 256, 256);

        // Circular or die-cut white vinyl border
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 128, 118, 0, Math.PI * 2);
        ctx.fill();

        // Dark background inner badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(128, 128, 108, 0, Math.PI * 2);
        ctx.fill();

        // Radiating sunburst or cyber grid
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6;
          ctx.beginPath();
          ctx.moveTo(128, 128);
          ctx.lineTo(128 + Math.cos(angle) * 105, 128 + Math.sin(angle) * 105);
          ctx.stroke();
        }

        // Draw shape icon
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;

        if (shapeType === 'star') {
          // 5-point star
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const rOuter = 55;
            const rInner = 26;
            const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            if (i === 0) ctx.moveTo(128 + Math.cos(a1) * rOuter, 128 + Math.sin(a1) * rOuter);
            else ctx.lineTo(128 + Math.cos(a1) * rOuter, 128 + Math.sin(a1) * rOuter);
            ctx.lineTo(128 + Math.cos(a2) * rInner, 128 + Math.sin(a2) * rInner);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (shapeType === 'bolt') {
          // Lightning bolt
          ctx.beginPath();
          ctx.moveTo(136, 75);
          ctx.lineTo(108, 128);
          ctx.lineTo(132, 128);
          ctx.lineTo(118, 182);
          ctx.lineTo(156, 120);
          ctx.lineTo(132, 120);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (shapeType === 'heart') {
          // Pixelated neon heart
          ctx.beginPath();
          ctx.moveTo(128, 160);
          ctx.bezierCurveTo(90, 130, 80, 95, 105, 95);
          ctx.bezierCurveTo(120, 95, 128, 110, 128, 110);
          ctx.bezierCurveTo(128, 110, 136, 95, 151, 95);
          ctx.bezierCurveTo(176, 95, 166, 130, 128, 160);
          ctx.fill();
          ctx.stroke();
        } else if (shapeType === 'alien') {
          // 8-bit Space Invader
          const pixelSize = 10;
          const map = [
            '  █     █  ',
            '   █   █   ',
            '  ███████  ',
            ' ██ ███ ██ ',
            '███████████',
            '█ ███████ █',
            '█ █     █ █',
            '   ██ ██   ',
          ];
          const startX = 128 - (map[0].length * pixelSize) / 2;
          const startY = 128 - (map.length * pixelSize) / 2;
          ctx.fillStyle = color;
          for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
              if (map[r][c] === '█') {
                ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize - 1, pixelSize - 1);
              }
            }
          }
        } else {
          // Cyber skull / emblem
          ctx.beginPath();
          ctx.arc(128, 118, 40, 0, Math.PI * 2);
          ctx.rect(106, 135, 44, 25);
          ctx.fill();
          ctx.stroke();

          // Visor glow line
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(100, 112, 56, 10);
        }

        // Subtitle badge
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(promptLabel.toUpperCase().slice(0, 14), 128, 205);

        const dataUrl = canvas.toDataURL('image/png');
        const newItem: StickerCatalogItem = {
          id: `custom-${Date.now()}`,
          name: promptLabel,
          category: 'arcade',
          imageUrl: dataUrl,
          defaultPlacement: selectedPlacement,
          defaultRotation: -4 + Math.floor(Math.random() * 9),
          description: `Custom AI Generated Decal: ${promptLabel}`,
        };

        setCustomStickers((prev) => [newItem, ...prev]);
        handleApplySticker(newItem);
        setIsGenerating(false);
      }
    }, 450);
  };

  // Upload custom sticker file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const newItem: StickerCatalogItem = {
          id: `upload-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 15),
          category: 'retro',
          imageUrl: result,
          defaultPlacement: selectedPlacement,
          defaultRotation: -6,
          description: 'Uploaded custom decal',
        };
        setCustomStickers((prev) => [newItem, ...prev]);
        handleApplySticker(newItem);
        playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  // Randomize all settings for fun
  const handleRandomize = () => {
    playClick();
    const randomStyle =
      CABINET_ART_STYLES[Math.floor(Math.random() * CABINET_ART_STYLES.length)];

    const allStickers = [...STICKER_CATALOG, ...customStickers];
    const placements: StickerPlacement[] = [
      'top_left',
      'top_right',
      'bottom_left',
      'bottom_right',
    ];

    const randomStickers: CabinetSticker[] = placements.map((p) => {
      const randomItem = allStickers[Math.floor(Math.random() * allStickers.length)];
      const filters: StickerWearFilter[] = ['normal', 'worn', 'holographic'];
      return {
        id: `random-${p}-${Date.now()}`,
        name: randomItem.name,
        imageUrl: randomItem.imageUrl,
        placement: p,
        rotation: -12 + Math.floor(Math.random() * 24),
        scale: 0.85 + Math.random() * 0.3,
        filter: filters[Math.floor(Math.random() * filters.length)],
      };
    });

    setConfig({
      styleId: randomStyle.id,
      stickers: randomStickers,
      sideTrimGlow: Math.random() > 0.3,
      bezelWear: ['clean', 'authentic', 'patina'][Math.floor(Math.random() * 3)] as any,
    });
  };

  // Reset to factory clean
  const handleResetToClean = () => {
    playClick();
    setConfig({
      styleId: 'cyberpunk_neon',
      stickers: [],
      sideTrimGlow: true,
      bezelWear: 'clean',
    });
  };

  // Save changes
  const handleSave = () => {
    if (soundEnabled) soundManager.play('fanfare');
    cabinetService.saveCabinetCustomization(config);
    onSaveConfig(config);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Hidden canvas for procedural stickers */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-retro text-sm sm:text-base text-white tracking-wider">
                  CABINET CUSTOMIZER & VINYL STUDIO
                </h2>
                <span className="text-[10px] font-retro px-2 py-0.5 bg-amber-950/80 border border-amber-600/70 text-amber-300 rounded">
                  PHYSICAL ART
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Personalize your arcade frame styling, side trims, and high-res die-cut sticker overlays.
              </p>
            </div>
          </div>

          <button
            id="btn-close-cabinet-customizer"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body: 2 Columns (Live Preview on Left, Customizer Options on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Real-Time Cabinet Frame Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-retro text-cyan-400 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                LIVE CABINET PREVIEW
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {currentStyleConfig.name}
              </span>
            </div>

            {/* Simulated Miniature Cabinet Frame */}
            <div
              className={`relative w-full aspect-square max-w-[340px] sm:max-w-[380px] rounded-2xl p-4 flex flex-col justify-between border-4 transition-all duration-300 ${currentStyleConfig.cabinetBgClass} ${currentStyleConfig.outerBorderClass}`}
              style={{
                boxShadow: config.sideTrimGlow
                  ? `0 0 35px ${currentStyleConfig.accentGlow}`
                  : '0 10px 30px rgba(0,0,0,0.8)',
              }}
            >
              {/* Top Marquee Header */}
              <div
                className={`w-full py-2 px-3 rounded-lg border flex items-center justify-between text-[10px] font-retro ${currentStyleConfig.marqueeBgClass} ${currentStyleConfig.marqueeBorderClass}`}
              >
                <div className="flex items-center gap-1 text-white">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>ARCADE JS</span>
                </div>
                <span className="text-amber-400 font-mono text-[9px] px-1.5 py-0.5 bg-black/40 rounded">
                  {currentStyleConfig.tag}
                </span>
              </div>

              {/* CRT Screen Display Area */}
              <div className="relative w-full flex-1 my-3 bg-black rounded-lg border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center p-3">
                {/* Simulated scanlines & game graphics */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-60 z-10" />

                <div className="relative z-10 text-center font-retro space-y-1.5">
                  <div className="text-xs sm:text-sm text-cyan-400 animate-pulse">
                    INSERT COIN
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    BEZEL: {config.bezelWear.toUpperCase()}
                  </div>
                </div>

                {/* Speaker Grille Slots */}
                <div className="absolute bottom-2 flex gap-1 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>

              {/* Lower Control Deck Area */}
              <div className="w-full py-2 px-3 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>STICKERS: {config.stickers.length}/4</span>
                <span className="text-cyan-400">
                  {config.sideTrimGlow ? 'EDGE GLOW ON' : 'EDGE GLOW OFF'}
                </span>
              </div>

              {/* Placed Stickers Overlays on the 4 Corners */}
              {config.stickers.map((stk) => {
                let posClasses = '';
                switch (stk.placement) {
                  case 'top_left':
                    posClasses = 'top-3 left-3';
                    break;
                  case 'top_right':
                    posClasses = 'top-3 right-3';
                    break;
                  case 'bottom_left':
                    posClasses = 'bottom-3 left-3';
                    break;
                  case 'bottom_right':
                    posClasses = 'bottom-3 right-3';
                    break;
                }

                let filterStyle = '';
                if (stk.filter === 'worn') {
                  filterStyle = 'sepia(30%) contrast(110%) brightness(90%)';
                } else if (stk.filter === 'holographic') {
                  filterStyle = 'saturate(160%) contrast(120%)';
                }

                return (
                  <div
                    key={stk.id}
                    className={`absolute z-30 transition-transform duration-150 ${posClasses}`}
                    style={{
                      transform: `rotate(${stk.rotation}deg) scale(${stk.scale})`,
                    }}
                  >
                    <div
                      className={`relative rounded-md p-0.5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.8)] overflow-hidden ${
                        stk.filter === 'holographic' ? 'ring-1 ring-cyan-300' : ''
                      }`}
                      style={{ filter: filterStyle }}
                    >
                      {stk.filter === 'holographic' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-pink-400/20 to-yellow-300/20 mix-blend-overlay pointer-events-none" />
                      )}
                      <img
                        src={stk.imageUrl}
                        alt={stk.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded object-cover block pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions under preview */}
            <div className="flex items-center gap-2 mt-4">
              <button
                id="btn-randomize-customizer"
                type="button"
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono rounded-lg border border-slate-700 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Randomize Style</span>
              </button>
              <button
                id="btn-clean-customizer"
                type="button"
                onClick={handleResetToClean}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono rounded-lg border border-slate-800 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Peel All Stickers</span>
              </button>
            </div>
          </div>

          {/* Right Column: Customizer Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab('styles');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-retro text-xs transition cursor-pointer ${
                  activeTab === 'styles'
                    ? 'bg-cyan-950/80 border border-cyan-600 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>1. CABINET ART STYLES</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab('stickers');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-retro text-xs transition cursor-pointer ${
                  activeTab === 'stickers'
                    ? 'bg-cyan-950/80 border border-cyan-600 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>2. STICKER OVERLAYS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab('ai_generator');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-retro text-xs transition cursor-pointer ${
                  activeTab === 'ai_generator'
                    ? 'bg-purple-950/80 border border-purple-600 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>3. AI DECAL STUDIO</span>
              </button>
            </div>

            {/* TAB 1: Cabinet Art Styles */}
            {activeTab === 'styles' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-300 font-mono">
                  Select a classic arcade cabinet chassis inspired by legendary historical eras:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CABINET_ART_STYLES.map((style) => {
                    const isSelected = config.styleId === style.id;
                    return (
                      <button
                        key={style.id}
                        id={`btn-style-${style.id}`}
                        type="button"
                        onClick={() => handleSelectStyle(style.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-retro text-xs text-white">
                            {style.name}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: style.tMoldingColor }}
                            title={`T-Molding: ${style.tMoldingColor}`}
                          />
                        </div>
                        <span className="text-[9px] font-retro text-amber-400 mb-1">
                          {style.era}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400 leading-snug">
                          {style.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Additional Cabinet Options */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="font-retro text-xs text-cyan-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    HARDWARE DETAILS
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <span className="text-slate-300">Side-Trim T-Molding Neon Glow:</span>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setConfig((prev) => ({
                            ...prev,
                            sideTrimGlow: !prev.sideTrimGlow,
                          }));
                        }}
                        className={`px-3 py-1 rounded-md border font-retro text-[10px] transition cursor-pointer ${
                          config.sideTrimGlow
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        {config.sideTrimGlow ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                      <span className="text-slate-300">Bezel Condition:</span>
                      <select
                        value={config.bezelWear}
                        onChange={(e) => {
                          playClick();
                          setConfig((prev) => ({
                            ...prev,
                            bezelWear: e.target.value as any,
                          }));
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono outline-none cursor-pointer"
                      >
                        <option value="clean">Factory Clean</option>
                        <option value="authentic">Authentic Scratches</option>
                        <option value="patina">Heavy Retro Patina</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Sticker Overlays Studio */}
            {activeTab === 'stickers' && (
              <div className="space-y-4">
                {/* 1. Placement Slot Selector */}
                <div>
                  <label className="text-xs font-retro text-cyan-400 block mb-2">
                    SELECT BEZEL / DECK SLOT:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'top_left', label: 'Top Left Bezel' },
                        { id: 'top_right', label: 'Top Right Bezel' },
                        { id: 'bottom_left', label: 'Bottom Left Deck' },
                        { id: 'bottom_right', label: 'Bottom Right Deck' },
                      ] as const
                    ).map((slot) => {
                      const isSelected = selectedPlacement === slot.id;
                      const hasSticker = config.stickers.some((s) => s.placement === slot.id);
                      return (
                        <button
                          key={slot.id}
                          id={`btn-slot-${slot.id}`}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedPlacement(slot.id);
                          }}
                          className={`p-2 rounded-lg border text-left text-xs font-mono transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="font-retro text-[9px] block mb-1">{slot.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono w-fit ${
                              hasSticker
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {hasSticker ? 'STICKER APPLIED' : 'EMPTY'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Active Slot Fine-Tuning (if sticker applied) */}
                {activeSticker ? (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={activeSticker.imageUrl}
                          alt={activeSticker.name}
                          className="w-7 h-7 rounded border border-white"
                        />
                        <span className="font-retro text-xs text-amber-300">
                          {activeSticker.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStickerFromSlot(selectedPlacement)}
                        className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-retro rounded transition cursor-pointer"
                      >
                        PEEL OFF
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                      {/* Rotation Slider */}
                      <div>
                        <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                          <span>ROTATION TILT:</span>
                          <span className="text-cyan-400">{activeSticker.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          value={activeSticker.rotation}
                          onChange={(e) =>
                            handleUpdateActiveSticker({ rotation: Number(e.target.value) })
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      {/* Scale Slider */}
                      <div>
                        <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                          <span>SIZE SCALE:</span>
                          <span className="text-cyan-400">{Math.round(activeSticker.scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="135"
                          value={Math.round(activeSticker.scale * 100)}
                          onChange={(e) =>
                            handleUpdateActiveSticker({ scale: Number(e.target.value) / 100 })
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      {/* Finish Wear Filter */}
                      <div>
                        <div className="text-slate-400 text-[10px] mb-1">VINYL FINISH:</div>
                        <select
                          value={activeSticker.filter || 'normal'}
                          onChange={(e) =>
                            handleUpdateActiveSticker({ filter: e.target.value as any })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs font-mono outline-none cursor-pointer"
                        >
                          <option value="normal">Gloss Vinyl</option>
                          <option value="worn">Worn Vintage</option>
                          <option value="holographic">Holographic Prismatic</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center text-xs font-mono text-slate-400">
                    Slot is empty. Choose a sticker below to apply it to this position.
                  </div>
                )}

                {/* 3. Catalog of Generated Sticker Assets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-retro text-slate-300">
                      DECALS CATALOG ({STICKER_CATALOG.length + customStickers.length} AVAILABLE):
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Click to apply to active slot
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {[...customStickers, ...STICKER_CATALOG].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleApplySticker(item)}
                        className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 rounded-xl text-left transition cursor-pointer flex items-center gap-2.5 group"
                      >
                        <div className="w-10 h-10 rounded-lg p-0.5 bg-white shadow-sm shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="overflow-hidden leading-tight">
                          <div className="font-retro text-[10px] text-slate-200 group-hover:text-cyan-300 truncate">
                            {item.name}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 truncate">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI Decal Studio & Custom Image Generation */}
            {activeTab === 'ai_generator' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-purple-950/40 border border-purple-800/60 rounded-xl">
                  <div className="flex items-center gap-2 font-retro text-xs text-purple-300 mb-1">
                    PROCEDURAL RETRO DECAL SYNTHESIZER
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">
                    Generate unique die-cut arcade cabinet stickers with neon foils, vinyl peel borders, and custom badges.
                  </p>
                </div>

                {/* Preset Fast Prompts */}
                <div>
                  <label className="text-xs font-retro text-slate-300 block mb-2">
                    POPULAR RETRO ARCHETYPES:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_AI_PROMPTS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          generateProceduralSticker(preset.label, preset.color, preset.shape)
                        }
                        className="p-2.5 bg-slate-950/80 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500 rounded-xl text-left transition cursor-pointer group flex items-center justify-between"
                      >
                        <span className="font-retro text-[10px] text-slate-300 group-hover:text-purple-300">
                          {preset.label}
                        </span>
                        <Zap
                          className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100"
                          style={{ color: preset.color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Text Prompt Input */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="text-xs font-retro text-cyan-400 block">
                    CUSTOM TEXT DECAL PROMPT:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Cyber Samurai, Neon Tiger, Warp Speed..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customPrompt.trim()) {
                          generateProceduralSticker(customPrompt.trim(), '#06b6d4', 'skull');
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      disabled={isGenerating || !customPrompt.trim()}
                      onClick={() =>
                        generateProceduralSticker(customPrompt.trim(), '#06b6d4', 'skull')
                      }
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-retro text-xs rounded-lg transition shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isGenerating ? 'SYNTHESIZING...' : 'GENERATE'}</span>
                    </button>
                  </div>
                </div>

                {/* User Image File Upload */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    Or upload your own decal art file:
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Decal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-slate-400">
              CUSTOM CABINET READY // {config.stickers.length} STICKERS MOUNTED
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-cabinet-customizer"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-retro text-xs rounded-lg transition cursor-pointer"
            >
              CANCEL
            </button>
            <button
              id="btn-save-cabinet-customizer"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-retro text-xs rounded-lg border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer flex items-center gap-1.5"
            >
              {saveToast ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 text-emerald-200" />
                  <span>APPLY CABINET ART</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
