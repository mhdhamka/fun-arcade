import React, { useState, useRef, useEffect } from 'react';
import {
  CabinetStyleId,
  CabinetCustomizationState,
  CabinetSticker,
  StickerPlacement,
  StickerWearFilter,
  ThemeId,
} from '../../types/arcade';
import {
  CABINET_ART_STYLES,
  STICKER_CATALOG,
  StickerCatalogItem,
  cabinetService,
} from '../../services/cabinetStyles';
import { soundManager } from '../../services/audio';
import { storageService } from '../../services/storage';
import {
  X,
  Palette,
  RotateCw,
  Sliders,
  Upload,
  RefreshCw,
  Check,
  Zap,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
  Radio,
  Settings,
  Gamepad2,
  SlidersHorizontal,
  Wrench,
  HelpCircle,
  Eye,
} from 'lucide-react';

export type SettingsTab = 'cabinet' | 'audio' | 'display' | 'controls' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  // Cabinet Customizer props
  currentCabinetConfig: CabinetCustomizationState;
  onSaveCabinetConfig: (newConfig: CabinetCustomizationState) => void;
  // General settings props
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  scanlines: boolean;
  onToggleScanlines: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  ambientSoundEnabled: boolean;
  onToggleAmbient: () => void;
  onClearData?: () => void;
}

const PRESET_AI_PROMPTS = [
  { label: 'Cyberpunk Visor Skull', keyword: 'cyber_skull', color: '#06b6d4', shape: 'skull', style: 'vinyl' },
  { label: 'Outrun Turbo Cruiser', keyword: 'synth_car', color: '#ec4899', shape: 'car', style: 'neon' },
  { label: '1-UP Crystal Heart', keyword: 'pixel_heart', color: '#ef4444', shape: 'heart', style: 'pixel' },
  { label: 'Cosmic Chrome Invader', keyword: 'alien_bot', color: '#a855f7', shape: 'alien', style: 'hologram' },
  { label: 'Golden Arcade Drake', keyword: 'gold_dragon', color: '#eab308', shape: 'dragon', style: 'pixel' },
  { label: 'Turbo Fightstick Pro', keyword: 'fightstick', color: '#3b82f6', shape: 'joystick', style: 'vinyl' },
  { label: 'Neon Laser Katana', keyword: 'neon_katana', color: '#10b981', shape: 'sword', style: 'neon' },
  { label: 'High Roller Crown', keyword: 'royal_crown', color: '#f59e0b', shape: 'crown', style: 'hologram' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'cabinet',
  currentCabinetConfig,
  onSaveCabinetConfig,
  theme,
  onThemeChange,
  scanlines,
  onToggleScanlines,
  soundEnabled,
  onToggleSound,
  ambientSoundEnabled,
  onToggleAmbient,
  onClearData,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [cabinetSubTab, setCabinetSubTab] = useState<'styles' | 'stickers' | 'ai_studio'>('styles');
  const [cabinetConfig, setCabinetConfig] = useState<CabinetCustomizationState>({
    ...currentCabinetConfig,
    stickers: [...currentCabinetConfig.stickers],
  });

  // Sticker Placement & AI Generator state
  const [selectedPlacement, setSelectedPlacement] = useState<StickerPlacement>('top_left');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<'vinyl' | 'pixel' | 'hologram' | 'neon'>('vinyl');
  const [selectedShape, setSelectedShape] = useState<'badge' | 'die_cut' | 'shield' | 'hex'>('die_cut');
  const [selectedColor, setSelectedColor] = useState('#06b6d4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customGeneratedStickers, setCustomGeneratedStickers] = useState<StickerCatalogItem[]>([]);
  const [saveToast, setSaveToast] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'cyber' | 'retro' | 'arcade' | 'hologram'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCabinetConfig({
        ...currentCabinetConfig,
        stickers: [...currentCabinetConfig.stickers],
      });
    }
  }, [isOpen, initialTab, currentCabinetConfig]);

  if (!isOpen) return null;

  const currentStyleConfig = cabinetService.getStyleConfig(cabinetConfig.styleId);
  const activeSticker = cabinetConfig.stickers.find((s) => s.placement === selectedPlacement);

  const playClick = () => {
    if (soundEnabled) {
      soundManager.play('select');
    }
  };

  // Cabinet Art Style Selection
  const handleSelectCabinetStyle = (styleId: CabinetStyleId) => {
    playClick();
    setCabinetConfig((prev) => ({ ...prev, styleId }));
  };

  // Apply a sticker from catalog to chosen slot
  const handleApplySticker = (item: StickerCatalogItem) => {
    playClick();
    setCabinetConfig((prev) => {
      const filtered = prev.stickers.filter((s) => s.placement !== selectedPlacement);
      const newSticker: CabinetSticker = {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        imageUrl: item.imageUrl,
        placement: selectedPlacement,
        rotation: item.defaultRotation,
        scale: 1.0,
        filter: item.category === 'hologram' ? 'holographic' : 'normal',
      };
      return {
        ...prev,
        stickers: [...filtered, newSticker],
      };
    });
  };

  // Remove sticker from slot
  const handleRemoveSticker = (placement: StickerPlacement) => {
    playClick();
    setCabinetConfig((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.placement !== placement),
    }));
  };

  // Update active sticker attributes (rotation, scale, filter)
  const handleUpdateActiveSticker = (updates: Partial<CabinetSticker>) => {
    setCabinetConfig((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) =>
        s.placement === selectedPlacement ? { ...s, ...updates } : s
      ),
    }));
  };

  // Procedural Image Generation Synthesizer for unique die-cut stickers
  const generateProceduralSticker = (promptLabel: string, color: string, styleType: string, shapeType: string) => {
    setIsGenerating(true);
    if (soundEnabled) soundManager.play('coin');

    setTimeout(() => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, 400, 400);

        const cx = 200;
        const cy = 200;

        // 1. Draw Die-Cut Outer White Vinyl Outline
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 6;

        ctx.beginPath();
        if (shapeType === 'shield') {
          ctx.moveTo(cx, 40);
          ctx.lineTo(340, 110);
          ctx.lineTo(320, 270);
          ctx.quadraticCurveTo(cx, 370, cx, 370);
          ctx.quadraticCurveTo(80, 270, 80, 270);
          ctx.lineTo(60, 110);
          ctx.closePath();
        } else if (shapeType === 'hex') {
          const r = 160;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (shapeType === 'badge') {
          ctx.arc(cx, cy, 160, 0, Math.PI * 2);
        } else {
          // Freeform Die-Cut Rounded Contour
          ctx.beginPath();
          ctx.roundRect(50, 50, 300, 300, [36, 36, 36, 36]);
        }
        ctx.fill();
        ctx.restore();

        // 2. Inner Chassis / Vinyl Base
        ctx.save();
        const grad = ctx.createLinearGradient(60, 60, 340, 340);
        if (styleType === 'hologram') {
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.3, '#3b0764');
          grad.addColorStop(0.6, '#083344');
          grad.addColorStop(1, '#1e293b');
        } else if (styleType === 'neon') {
          grad.addColorStop(0, '#09090b');
          grad.addColorStop(1, '#18181b');
        } else if (styleType === 'pixel') {
          grad.addColorStop(0, '#172554');
          grad.addColorStop(1, '#0f172a');
        } else {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(1, '#020617');
        }
        ctx.fillStyle = grad;

        ctx.beginPath();
        if (shapeType === 'shield') {
          ctx.moveTo(cx, 55);
          ctx.lineTo(325, 120);
          ctx.lineTo(305, 260);
          ctx.quadraticCurveTo(cx, 350, cx, 350);
          ctx.quadraticCurveTo(95, 260, 95, 260);
          ctx.lineTo(75, 120);
          ctx.closePath();
        } else if (shapeType === 'hex') {
          const r = 145;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (shapeType === 'badge') {
          ctx.arc(cx, cy, 145, 0, Math.PI * 2);
        } else {
          ctx.roundRect(65, 65, 270, 270, [24, 24, 24, 24]);
        }
        ctx.fill();
        ctx.restore();

        // 3. Render High-Contrast Decal Artwork Motif
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;

        const lowerPrompt = (promptLabel || '').toLowerCase();

        if (lowerPrompt.includes('skull') || shapeType === 'skull') {
          // Cyberpunk Skull Motif
          ctx.beginPath();
          ctx.arc(cx, cy - 20, 65, Math.PI * 0.8, Math.PI * 2.2);
          ctx.lineTo(cx + 35, cy + 50);
          ctx.lineTo(cx - 35, cy + 50);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Visor / Eyes
          ctx.fillStyle = '#09090b';
          ctx.fillRect(cx - 50, cy - 35, 100, 26);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(cx - 45, cy - 30, 40, 16);
          ctx.fillRect(cx + 5, cy - 30, 40, 16);

          // Teeth
          ctx.fillStyle = '#ffffff';
          for (let t = -25; t <= 25; t += 12) {
            ctx.fillRect(cx + t, cy + 32, 6, 14);
          }
        } else if (lowerPrompt.includes('star') || lowerPrompt.includes('token')) {
          // Golden 1-UP Star
          ctx.beginPath();
          const spikes = 5;
          const outerR = 75;
          const innerR = 36;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (i * Math.PI) / spikes - Math.PI / 2;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx - 16, cy - 14, 8, 22);
          ctx.fillRect(cx + 8, cy - 14, 8, 22);
        } else if (lowerPrompt.includes('heart')) {
          // Pixel Heart
          ctx.beginPath();
          ctx.moveTo(cx, cy + 55);
          ctx.bezierCurveTo(cx - 70, cy + 10, cx - 80, cy - 60, cx, cy - 25);
          ctx.bezierCurveTo(cx + 80, cy - 60, cx + 70, cy + 10, cx, cy + 55);
          ctx.fill();
          ctx.stroke();

          // 8-bit highlight
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - 35, cy - 35, 16, 16);
        } else if (lowerPrompt.includes('car') || lowerPrompt.includes('turbo')) {
          // Retro Outrun Cruiser
          ctx.beginPath();
          ctx.moveTo(cx - 70, cy + 30);
          ctx.lineTo(cx - 50, cy);
          ctx.lineTo(cx - 10, cy - 25);
          ctx.lineTo(cx + 40, cy - 25);
          ctx.lineTo(cx + 70, cy);
          ctx.lineTo(cx + 80, cy + 30);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Neon Wheel Wells
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(cx - 40, cy + 30, 20, 0, Math.PI, true);
          ctx.arc(cx + 45, cy + 30, 20, 0, Math.PI, true);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          // Dynamic Arcade Crest / Shield Badge
          ctx.beginPath();
          ctx.arc(cx, cy, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('1-UP', cx, cy);
        }
        ctx.restore();

        // 4. Decal Text Banner
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4;
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText((promptLabel || 'RETRO ARCADE').toUpperCase(), cx, 315);
        ctx.fillText((promptLabel || 'RETRO ARCADE').toUpperCase(), cx, 315);
        ctx.restore();

        // 5. Holographic or Vinyl Gloss Reflection
        if (styleType === 'hologram') {
          ctx.save();
          const holoGrad = ctx.createLinearGradient(50, 50, 350, 350);
          holoGrad.addColorStop(0, 'rgba(255, 0, 128, 0.25)');
          holoGrad.addColorStop(0.25, 'rgba(0, 255, 255, 0.25)');
          holoGrad.addColorStop(0.5, 'rgba(255, 255, 0, 0.25)');
          holoGrad.addColorStop(0.75, 'rgba(0, 255, 128, 0.25)');
          holoGrad.addColorStop(1, 'rgba(128, 0, 255, 0.25)');
          ctx.fillStyle = holoGrad;
          ctx.fillRect(0, 0, 400, 400);
          ctx.restore();
        }

        // Gloss Sheen Stripe
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(80, 50);
        ctx.lineTo(160, 50);
        ctx.lineTo(60, 350);
        ctx.lineTo(20, 350);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Convert canvas to Data URL
        const dataUrl = canvas.toDataURL('image/png');

        const newItem: StickerCatalogItem = {
          id: `custom-gen-${Date.now()}`,
          name: promptLabel || 'Custom Die-Cut Decal',
          category: styleType === 'hologram' ? 'hologram' : 'cyber',
          imageUrl: dataUrl,
          defaultPlacement: selectedPlacement,
          defaultRotation: Math.floor(Math.random() * 16) - 8,
          description: `Custom AI Generated: ${styleType.toUpperCase()} ${shapeType.toUpperCase()} sticker`,
        };

        setCustomGeneratedStickers((prev) => [newItem, ...prev]);
        handleApplySticker(newItem);
        setIsGenerating(false);
      }
    }, 450);
  };

  // Custom User Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const uploadedItem: StickerCatalogItem = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 16),
        category: 'arcade',
        imageUrl: dataUrl,
        defaultPlacement: selectedPlacement,
        defaultRotation: 0,
        description: 'Custom User Uploaded Decal',
      };
      setCustomGeneratedStickers((prev) => [uploadedItem, ...prev]);
      handleApplySticker(uploadedItem);
    };
    reader.readAsDataURL(file);
  };

  // Save all Cabinet Customizations
  const handleSaveCabinet = () => {
    if (soundEnabled) soundManager.play('fanfare');
    cabinetService.saveCabinetCustomization(cabinetConfig);
    onSaveCabinetConfig(cabinetConfig);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  // Reset to default
  const handleResetCabinet = () => {
    playClick();
    setCabinetConfig({
      ...cabinetService.getCabinetCustomization(),
    });
  };

  // Filtered sticker catalog
  const combinedCatalog = [...customGeneratedStickers, ...STICKER_CATALOG];
  const displayedCatalog =
    filterCategory === 'all'
      ? combinedCatalog
      : combinedCatalog.filter((item) => item.category === filterCategory);

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="settings-modal-dialog"
        className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/80 border border-purple-600/70 rounded-lg text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-retro text-amber-400 glow-amber flex items-center gap-2">
                ARCADE SYSTEM SETTINGS
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                Cabinet Customizer, Physical Chassis & 8-Bit Hardware Configuration
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-slate-950/90 border-b border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
          <button
            id="btn-tab-cabinet"
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('cabinet');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer shrink-0 ${
              activeTab === 'cabinet'
                ? 'bg-purple-950 border border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>CABINET CUSTOMIZER</span>
          </button>

          <button
            id="btn-tab-audio"
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('audio');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer shrink-0 ${
              activeTab === 'audio'
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>AUDIO & SFX</span>
          </button>

          <button
            id="btn-tab-display"
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('display');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer shrink-0 ${
              activeTab === 'display'
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>CRT & DISPLAY</span>
          </button>

          <button
            id="btn-tab-controls"
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('controls');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer shrink-0 ${
              activeTab === 'controls'
                ? 'bg-amber-950 border border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>CONTROLS</span>
          </button>

          <button
            id="btn-tab-system"
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('system');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-retro transition cursor-pointer shrink-0 ${
              activeTab === 'system'
                ? 'bg-rose-950 border border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.35)]'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-rose-400" />
            <span>SYSTEM</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* TAB: CABINET CUSTOMIZER (THE CORE USER REQUEST)               */}
          {/* ============================================================== */}
          {activeTab === 'cabinet' && (
            <div className="space-y-6">
              {/* Cabinet Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-subtab-styles"
                    type="button"
                    onClick={() => {
                      playClick();
                      setCabinetSubTab('styles');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                      cabinetSubTab === 'styles'
                        ? 'bg-purple-900/80 text-purple-200 border border-purple-500/80 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>CHASSIS ART STYLES</span>
                  </button>

                  <button
                    id="btn-subtab-ai-studio"
                    type="button"
                    onClick={() => {
                      playClick();
                      setCabinetSubTab('ai_studio');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                      cabinetSubTab === 'ai_studio'
                        ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/80 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>IMAGE GEN STICKER STUDIO</span>
                  </button>

                  <button
                    id="btn-subtab-stickers"
                    type="button"
                    onClick={() => {
                      playClick();
                      setCabinetSubTab('stickers');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                      cabinetSubTab === 'stickers'
                        ? 'bg-amber-900/80 text-amber-200 border border-amber-500/80 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>STICKER OVERLAYS & SLOTS</span>
                  </button>
                </div>

                {/* Quick Live Preview Pill */}
                <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">CURRENT CHASSIS:</span>
                  <span className="text-amber-400 font-retro text-[10px]">{currentStyleConfig.name}</span>
                </div>
              </div>

              {/* Sub-Tab 1: Chassis Art Styles */}
              {cabinetSubTab === 'styles' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-retro text-purple-300 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      PHYSICAL CABINET HOUSING & ART STYLES
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Select your authentic arcade cabinet casing. Each chassis features historically accurate materials, T-molding color trims, and screen bezels.
                    </p>
                  </div>

                  {/* Grid of Cabinet Art Styles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CABINET_ART_STYLES.map((style) => {
                      const isSelected = cabinetConfig.styleId === style.id;
                      return (
                        <div
                          key={style.id}
                          id={`cabinet-style-${style.id}`}
                          onClick={() => handleSelectCabinetStyle(style.id)}
                          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                            isSelected
                              ? 'bg-slate-800/90 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-[1.02]'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Mini Visual Preview Swatch */}
                          <div className={`h-24 w-full rounded-lg border mb-3 relative overflow-hidden flex items-center justify-center ${style.cabinetBgClass} ${style.outerBorderClass}`}>
                            <div className="absolute inset-0 opacity-20 pointer-events-none crt-overlay" />
                            <div className="w-20 h-14 bg-slate-950/90 border rounded p-1 flex flex-col items-center justify-center text-center">
                              <span className="text-[8px] font-retro text-slate-300">CRT</span>
                              <div
                                className="w-2.5 h-2.5 rounded-full mt-1 animate-pulse"
                                style={{ backgroundColor: style.tMoldingColor }}
                              />
                            </div>

                            {/* T-Molding Indicator Bars */}
                            <div
                              className="absolute top-0 inset-x-0 h-1"
                              style={{ backgroundColor: style.tMoldingColor }}
                            />
                            <div
                              className="absolute bottom-0 inset-x-0 h-1"
                              style={{ backgroundColor: style.tMoldingColor }}
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-retro text-amber-300">{style.name}</span>
                              {isSelected && (
                                <span className="p-1 rounded-full bg-purple-500 text-slate-950">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-retro bg-slate-900 text-slate-400 border border-slate-800 mb-2">
                              {style.era}
                            </span>

                            <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2">
                              {style.description}
                            </p>
                          </div>

                          {/* Color Palette Pill */}
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>T-MOLDING TRIM:</span>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow"
                                style={{ backgroundColor: style.tMoldingColor }}
                              />
                              <span className="text-slate-300">{style.tag}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hardware Accents & Wear Level */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="text-xs font-retro text-cyan-300 flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      PHYSICAL HARDWARE ACCENTS & BEZEL WEAR
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Perimeter T-Molding Glow */}
                      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                        <div>
                          <span className="text-xs font-retro text-slate-200 block">T-MOLDING LED GLOW</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            High-voltage cabinet perimeter edge neon lighting
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setCabinetConfig((p) => ({ ...p, sideTrimGlow: !p.sideTrimGlow }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                            cabinetConfig.sideTrimGlow
                              ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {cabinetConfig.sideTrimGlow ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      {/* Bezel Wear State */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-retro text-slate-200">CRT BEZEL CONDITION</span>
                          <span className="text-[10px] font-retro text-amber-400 uppercase">
                            {cabinetConfig.bezelWear || 'authentic'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['clean', 'authentic', 'heavy'] as const).map((wear) => (
                            <button
                              key={wear}
                              type="button"
                              onClick={() => {
                                playClick();
                                setCabinetConfig((p) => ({ ...p, bezelWear: wear }));
                              }}
                              className={`py-1.5 text-[10px] font-retro rounded border transition cursor-pointer ${
                                (cabinetConfig.bezelWear || 'authentic') === wear
                                  ? 'bg-amber-950 border-amber-500 text-amber-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {wear === 'clean' ? 'FACTORY' : wear === 'authentic' ? 'AUTHENTIC' : 'PATINA'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Image Generation Sticker Studio */}
              {cabinetSubTab === 'ai_studio' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-retro text-cyan-300 flex items-center gap-2">
                      IMAGE GENERATION DECAL WORKSHOP
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Synthesize unique die-cut vinyl stickers and holographic decals using the Image Generation engine. Decals are die-cut and ready to be mounted onto any cabinet bezel corner.
                    </p>
                  </div>

                  {/* Generator Input Section */}
                  <div className="p-4 sm:p-5 bg-slate-950/80 border border-cyan-500/40 rounded-xl space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                    {/* Prompt input */}
                    <div>
                      <label className="block text-xs font-retro text-slate-300 mb-1.5">
                        STICKER ART PROMPT:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="input-sticker-prompt"
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="e.g., Cyberpunk Ninja Skull, Turbo Outrun Cruiser, 1-UP Golden Phoenix..."
                          className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          id="btn-generate-sticker"
                          type="button"
                          disabled={isGenerating}
                          onClick={() =>
                            generateProceduralSticker(
                              customPrompt || 'Cyberpunk Ninja Skull',
                              selectedColor,
                              selectedStyleFilter,
                              selectedShape
                            )
                          }
                          className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-retro text-xs rounded-lg transition shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>GENERATING...</span>
                            </>
                          ) : (
                            <>
                              <span>GENERATE DECAL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Archetype Preset Prompts */}
                    <div>
                      <span className="block text-[10px] font-retro text-slate-400 mb-2">
                        ONE-CLICK RETRO PROMPTS:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_AI_PROMPTS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              playClick();
                              setCustomPrompt(preset.label);
                              setSelectedColor(preset.color);
                              setSelectedStyleFilter(preset.style as any);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/70 text-slate-300 hover:text-cyan-300 rounded-lg text-[10px] font-retro transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: preset.color }}
                            />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Style, Shape, & Color Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                      {/* Finish Style */}
                      <div>
                        <label className="block text-[10px] font-retro text-slate-400 mb-1">
                          MATERIAL FINISH:
                        </label>
                        <select
                          value={selectedStyleFilter}
                          onChange={(e) => setSelectedStyleFilter(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono outline-none"
                        >
                          <option value="vinyl">Die-Cut Gloss Vinyl</option>
                          <option value="pixel">8-Bit Pixel Decal</option>
                          <option value="hologram">Prismatic Holographic Foil</option>
                          <option value="neon">Synthwave Glow Border</option>
                        </select>
                      </div>

                      {/* Shape Outline */}
                      <div>
                        <label className="block text-[10px] font-retro text-slate-400 mb-1">
                          CONTOUR DIE-CUT:
                        </label>
                        <select
                          value={selectedShape}
                          onChange={(e) => setSelectedShape(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono outline-none"
                        >
                          <option value="die_cut">Organic Rounded Die-Cut</option>
                          <option value="shield">Tournament Shield Crest</option>
                          <option value="badge">Circular Token Badge</option>
                          <option value="hex">Cyber Hexagon Plate</option>
                        </select>
                      </div>

                      {/* Color Accent */}
                      <div>
                        <label className="block text-[10px] font-retro text-slate-400 mb-1">
                          PALETTE ACCENT:
                        </label>
                        <div className="flex items-center gap-2">
                          {['#06b6d4', '#ec4899', '#eab308', '#10b981', '#a855f7', '#f43f5e'].map(
                            (c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                                  selectedColor === c ? 'border-white scale-110 shadow' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Target Slot Indicator */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">TARGET CABINET SLOT:</span>
                        <span className="text-cyan-300 font-retro uppercase text-[10px]">
                          {selectedPlacement.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Generated stickers mount directly to this corner
                      </span>
                    </div>
                  </div>

                  {/* Pre-Generated Curated AI Sticker Catalog */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-retro text-amber-400 flex items-center gap-1.5">
                        AI GENERATED DECAL CATALOG
                      </h4>

                      {/* Category Filter */}
                      <div className="flex items-center gap-1">
                        {(['all', 'cyber', 'retro', 'arcade', 'hologram'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              playClick();
                              setFilterCategory(cat);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-retro transition cursor-pointer uppercase ${
                              filterCategory === cat
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {displayedCatalog.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleApplySticker(item)}
                          className="group relative p-2.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/80 rounded-xl transition cursor-pointer flex flex-col items-center text-center shadow"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-1 relative">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
                            />
                            {item.category === 'hologram' && (
                              <span className="absolute top-1 right-1 px-1 rounded bg-purple-900/90 text-purple-300 text-[7px] font-retro border border-purple-500">
                                HOLO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-retro text-slate-300 group-hover:text-cyan-300 mt-2 truncate w-full">
                            {item.name}
                          </span>
                          <span className="text-[8px] font-mono text-slate-500">
                            Mount to {selectedPlacement.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Upload Option */}
                  <div className="p-3 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-xs font-retro text-slate-300 block">UPLOAD CUSTOM VINYL ART</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Import your own PNG decal image from your machine
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-retro transition cursor-pointer"
                    >
                      BROWSE FILE
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Stickers Placement & Fine Tuning */}
              {cabinetSubTab === 'stickers' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Slot Selector & Active Sticker Adjustments */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-retro text-amber-400 flex items-center gap-2">
                        CABINET CORNER MOUNT SLOTS
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Select which physical corner of the bezel or control deck to customize.
                      </p>
                    </div>

                    {/* 4 Corner Slot Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {(
                        [
                          { id: 'top_left', label: 'TOP LEFT BEZEL' },
                          { id: 'top_right', label: 'TOP RIGHT BEZEL' },
                          { id: 'bottom_left', label: 'BOTTOM LEFT DECK' },
                          { id: 'bottom_right', label: 'BOTTOM RIGHT DECK' },
                        ] as const
                      ).map((slot) => {
                        const slotSticker = cabinetConfig.stickers.find(
                          (s) => s.placement === slot.id
                        );
                        const isSelected = selectedPlacement === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setSelectedPlacement(slot.id);
                            }}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden ${
                              isSelected
                                ? 'bg-amber-950/70 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-retro text-slate-400">{slot.label}</span>
                            {slotSticker ? (
                              <div className="flex items-center gap-2 mt-auto">
                                <img
                                  src={slotSticker.imageUrl}
                                  alt={slotSticker.name}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 object-contain drop-shadow"
                                />
                                <span className="text-xs font-retro text-amber-300 truncate">
                                  {slotSticker.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-600 mt-auto">
                                (EMPTY SLOT)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Sticker Sliders (Rotation, Scale, Filter) */}
                    {activeSticker ? (
                      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-retro text-cyan-300">
                              FINE-TUNE: {activeSticker.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSticker(selectedPlacement)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-retro cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>PEEL OFF</span>
                          </button>
                        </div>

                        {/* Rotation Slider */}
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>ROTATION TILT:</span>
                            <span className="text-cyan-300 font-bold">{activeSticker.rotation}°</span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            value={activeSticker.rotation}
                            onChange={(e) =>
                              handleUpdateActiveSticker({ rotation: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        {/* Scale Slider */}
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>STICKER SCALE:</span>
                            <span className="text-cyan-300 font-bold">
                              {Math.round(activeSticker.scale * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="70"
                            max="140"
                            value={Math.round(activeSticker.scale * 100)}
                            onChange={(e) =>
                              handleUpdateActiveSticker({
                                scale: parseInt(e.target.value, 10) / 100,
                              })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        {/* Finish Filter */}
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 mb-1.5">
                            VINYL FINISH:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                { id: 'normal', label: 'GLOSS' },
                                { id: 'worn', label: 'WORN PATINA' },
                                { id: 'holographic', label: 'HOLOGRAPHIC' },
                              ] as const
                            ).map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleUpdateActiveSticker({ filter: f.id })}
                                className={`py-1.5 text-[10px] font-retro rounded border transition cursor-pointer ${
                                  (activeSticker.filter || 'normal') === f.id
                                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center">
                        <span className="text-xs font-retro text-slate-400 block">
                          NO STICKER IN THIS SLOT
                        </span>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          Go to the "Image Gen Sticker Studio" tab to generate or pick a decal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Cabinet Mockup with Placed Stickers */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 border-2 border-slate-800 rounded-2xl relative overflow-hidden">
                    <span className="text-[10px] font-retro text-purple-400 mb-3 tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      LIVE CHASSIS & BEZEL PREVIEW
                    </span>

                    {/* Miniature Arcade Cabinet Preview Frame */}
                    <div
                      className={`w-full max-w-sm h-72 rounded-2xl border-4 p-4 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all ${currentStyleConfig.cabinetBgClass} ${currentStyleConfig.outerBorderClass}`}
                    >
                      {/* Marquee Top */}
                      <div
                        className={`w-full py-1.5 px-3 rounded-lg border text-center font-retro text-[10px] text-amber-300 shadow ${currentStyleConfig.marqueeBgClass} ${currentStyleConfig.marqueeBorderClass}`}
                      >
                        RETRO ARCADE 198X
                      </div>

                      {/* CRT Screen Area with corner stickers */}
                      <div className="relative flex-1 my-2 bg-slate-950 border-2 border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute inset-0 crt-overlay opacity-50 pointer-events-none" />
                        <Gamepad2 className="w-8 h-8 text-cyan-400 mb-1 animate-pulse" />
                        <span className="text-[9px] font-retro text-cyan-300">SYSTEM READY</span>

                        {/* Top Left Sticker */}
                        {cabinetConfig.stickers
                          .filter((s) => s.placement === 'top_left')
                          .map((s) => (
                            <div
                              key={s.id}
                              className="absolute top-2 left-2 pointer-events-none"
                              style={{
                                transform: `rotate(${s.rotation}deg) scale(${s.scale * 0.7})`,
                              }}
                            >
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                referrerPolicy="no-referrer"
                                className={`w-12 h-12 object-contain drop-shadow-lg ${
                                  s.filter === 'holographic' ? 'brightness-110 contrast-125' : ''
                                }`}
                              />
                            </div>
                          ))}

                        {/* Top Right Sticker */}
                        {cabinetConfig.stickers
                          .filter((s) => s.placement === 'top_right')
                          .map((s) => (
                            <div
                              key={s.id}
                              className="absolute top-2 right-2 pointer-events-none"
                              style={{
                                transform: `rotate(${s.rotation}deg) scale(${s.scale * 0.7})`,
                              }}
                            >
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                referrerPolicy="no-referrer"
                                className={`w-12 h-12 object-contain drop-shadow-lg ${
                                  s.filter === 'holographic' ? 'brightness-110 contrast-125' : ''
                                }`}
                              />
                            </div>
                          ))}
                      </div>

                      {/* Control Deck with bottom stickers */}
                      <div className="relative w-full h-10 bg-slate-900/90 border border-slate-700/80 rounded-lg flex items-center justify-between px-3">
                        {/* Bottom Left Sticker */}
                        {cabinetConfig.stickers
                          .filter((s) => s.placement === 'bottom_left')
                          .map((s) => (
                            <div
                              key={s.id}
                              className="absolute -top-3 left-3 pointer-events-none"
                              style={{
                                transform: `rotate(${s.rotation}deg) scale(${s.scale * 0.6})`,
                              }}
                            >
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-contain drop-shadow-lg"
                              />
                            </div>
                          ))}

                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-rose-600 shadow" />
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow" />
                        </div>

                        {/* Bottom Right Sticker */}
                        {cabinetConfig.stickers
                          .filter((s) => s.placement === 'bottom_right')
                          .map((s) => (
                            <div
                              key={s.id}
                              className="absolute -top-3 right-3 pointer-events-none"
                              style={{
                                transform: `rotate(${s.rotation}deg) scale(${s.scale * 0.6})`,
                              }}
                            >
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-contain drop-shadow-lg"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: AUDIO & SFX                                               */}
          {/* ============================================================== */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-retro text-cyan-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  AUDIO & 8-BIT SOUND SYNTHESIZER
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Configure procedural 8-bit sound effects synthesized through the Web Audio API without external audio files.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 8-bit SFX toggle */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded-lg text-cyan-400">
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-xs font-retro text-slate-200 block">GAME AUDIO & SFX</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Square & triangle wave audio synthesis
                      </span>
                    </div>
                  </div>
                  <button
                    id="btn-settings-toggle-sound"
                    type="button"
                    onClick={() => {
                      onToggleSound();
                      playClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                      soundEnabled
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {soundEnabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                </div>

                {/* Ambient arcade noise toggle */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-950 border border-purple-500/50 rounded-lg text-purple-400">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-retro text-slate-200 block">AMBIENT ARCADE HALL HUM</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Background 60Hz transformer hum & coin drops
                      </span>
                    </div>
                  </div>
                  <button
                    id="btn-settings-toggle-ambient"
                    type="button"
                    onClick={() => {
                      onToggleAmbient();
                      playClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                      ambientSoundEnabled && soundEnabled
                        ? 'bg-purple-950 border border-purple-500 text-purple-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ambientSoundEnabled && soundEnabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                </div>
              </div>

              {/* Sound Test Panel */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-retro text-slate-300 block">AUDIO TEST BENCH:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'coin', label: 'INSERT COIN' },
                    { id: 'laser', label: 'LASER FIRE' },
                    { id: 'explosion', label: 'EXPLOSION' },
                    { id: 'fanfare', label: 'WIN FANFARE' },
                  ].map((testSfx) => (
                    <button
                      key={testSfx.id}
                      type="button"
                      onClick={() => soundManager.play(testSfx.id as any)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 rounded-lg text-xs font-retro transition cursor-pointer"
                    >
                      {testSfx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CRT & DISPLAY                                             */}
          {/* ============================================================== */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-retro text-emerald-300 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-emerald-400" />
                  CRT SCREEN & DISPLAY VISUALS
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Control cathode ray tube scanlines, phosphor glow bloom, and UI color palettes.
                </p>
              </div>

              {/* Scanline toggle */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-950 border border-emerald-500/50 rounded-lg text-emerald-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-retro text-slate-200 block">CRT HORIZONTAL SCANLINES</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Simulates 240p raster lines and screen phosphor flicker
                    </span>
                  </div>
                </div>
                <button
                  id="btn-settings-toggle-scanlines"
                  type="button"
                  onClick={() => {
                    onToggleScanlines();
                    playClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-retro transition cursor-pointer ${
                    scanlines
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {scanlines ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Theme Selector */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-retro text-slate-200 block">HUB THEME PALETTE:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'cyberpunk', name: 'CYBERPUNK NEON', color: 'border-cyan-500 text-cyan-300' },
                    { id: 'crt', name: 'CRT 8-BIT GREEN', color: 'border-emerald-500 text-emerald-300' },
                    { id: 'minimalist', name: 'MINIMALIST DARK', color: 'border-slate-500 text-slate-300' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onThemeChange(t.id as ThemeId);
                        playClick();
                      }}
                      className={`p-3 rounded-xl border text-center font-retro text-xs transition cursor-pointer ${
                        theme === t.id
                          ? `bg-slate-800 ${t.color} shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CONTROLS                                                  */}
          {/* ============================================================== */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-retro text-amber-300 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  ARCADE CONTROLLER & KEYBOARD MAP
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Hardware keybindings compatible with keyboards, gamepads, and touch screens.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-retro text-amber-400 block">DIRECTIONAL MOVEMENT</span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">UP / JUMP:</span>
                      <span className="text-cyan-300 font-bold">ARROW UP / W</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">DOWN / CROUCH:</span>
                      <span className="text-cyan-300 font-bold">ARROW DOWN / S</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">LEFT / RIGHT:</span>
                      <span className="text-cyan-300 font-bold">ARROW LEFT, RIGHT / A, D</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-retro text-amber-400 block">ACTION BUTTONS</span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">BUTTON A (FIRE / JUMP):</span>
                      <span className="text-rose-400 font-bold">SPACEBAR / Z</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">BUTTON B (ROTATE / SPECIAL):</span>
                      <span className="text-blue-400 font-bold">X / UP ARROW</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">PAUSE GAME:</span>
                      <span className="text-amber-400 font-bold">P / ESCAPE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: SYSTEM & STORAGE                                          */}
          {/* ============================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-retro text-rose-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-rose-400" />
                  SYSTEM & PERSISTENT STORAGE
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Manage browser storage, high score leaderboards, and cabinet factory settings.
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-retro text-slate-200 block">RESET CABINET CUSTOMIZATION</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Reverts chassis style and stickers to factory default
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCabinet}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-retro transition cursor-pointer"
                  >
                    RESET CABINET
                  </button>
                </div>

                {onClearData && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-retro text-rose-400 block">ERASE ALL LOCAL GAME DATA</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Clears player match history and high score records
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all high scores and game history?')) {
                          onClearData();
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-lg text-xs font-retro transition cursor-pointer"
                    >
                      CLEAR SCORES
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Procedural Decal Image Synthesis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-retro rounded-lg animate-in fade-in flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                CABINET CUSTOMIZATION SAVED!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-settings-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-retro transition cursor-pointer"
            >
              CLOSE
            </button>
            <button
              id="btn-settings-save-cabinet"
              type="button"
              onClick={handleSaveCabinet}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-retro transition shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
