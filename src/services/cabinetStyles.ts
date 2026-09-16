import {
  CabinetStyleId,
  CabinetArtStyleConfig,
  CabinetSticker,
  CabinetCustomizationState,
  StickerPlacement,
} from '../types/arcade';

// Import generated authentic arcade sticker assets
import retroSkullImg from '../assets/images/retro_skull_sticker_1789240773199.jpg';
import pixelDragonImg from '../assets/images/pixel_dragon_sticker_1789240784887.jpg';
import turboStickImg from '../assets/images/turbo_stick_sticker_1789240796131.jpg';
import spaceAlienImg from '../assets/images/space_alien_sticker_1789240808080.jpg';
import synthCassetteImg from '../assets/images/synth_cassette_sticker_1789240834907.jpg';
import goldTokenImg from '../assets/images/gold_token_sticker_1789240850092.jpg';
import neonSkullGenImg from '../assets/images/arcade_neon_skull_1789317081513.jpg';
import retroDragonGenImg from '../assets/images/arcade_retro_dragon_1789317101611.jpg';
import cosmicBotGenImg from '../assets/images/arcade_cosmic_bot_1789317120690.jpg';
import synthCarGenImg from '../assets/images/arcade_synth_car_1789317164014.jpg';
import pixelHeartGenImg from '../assets/images/arcade_pixel_heart_1789317179266.jpg';

export interface StickerCatalogItem {
  id: string;
  name: string;
  category: 'cyber' | 'retro' | 'arcade' | 'hologram';
  imageUrl: string;
  defaultPlacement: StickerPlacement;
  defaultRotation: number;
  description: string;
}

export const STICKER_CATALOG: StickerCatalogItem[] = [
  {
    id: 'ai_neon_skull',
    name: 'Cyberpunk Visor Skull',
    category: 'cyber',
    imageUrl: neonSkullGenImg,
    defaultPlacement: 'top_left',
    defaultRotation: -6,
    description: 'AI Generated: High-res neon cyan & magenta visor cyber decal',
  },
  {
    id: 'ai_synth_car',
    name: 'Outrun Turbo Cruiser',
    category: 'retro',
    imageUrl: synthCarGenImg,
    defaultPlacement: 'bottom_left',
    defaultRotation: -5,
    description: 'AI Generated: 80s synthwave sports car with neon grid lines',
  },
  {
    id: 'ai_pixel_heart',
    name: '1-UP Crystal Heart',
    category: 'arcade',
    imageUrl: pixelHeartGenImg,
    defaultPlacement: 'top_right',
    defaultRotation: 6,
    description: 'AI Generated: Shimmering 8-bit health container decal',
  },
  {
    id: 'ai_cosmic_bot',
    name: 'Cosmic Chrome Invader',
    category: 'hologram',
    imageUrl: cosmicBotGenImg,
    defaultPlacement: 'bottom_right',
    defaultRotation: 5,
    description: 'AI Generated: Holographic alien space robot with prism sheen',
  },
  {
    id: 'ai_retro_dragon',
    name: 'Golden Arcade Drake',
    category: 'retro',
    imageUrl: retroDragonGenImg,
    defaultPlacement: 'top_right',
    defaultRotation: 7,
    description: 'AI Generated: Pixel art mythical flame dragon badge',
  },
  {
    id: 'cyber_skull',
    name: 'Neon Cyber Skull',
    category: 'cyber',
    imageUrl: retroSkullImg,
    defaultPlacement: 'top_left',
    defaultRotation: -7,
    description: 'Vibrant 90s die-cut decal with glowing synthwave visor',
  },
  {
    id: 'pixel_dragon',
    name: '8-Bit Flame Drake',
    category: 'retro',
    imageUrl: pixelDragonImg,
    defaultPlacement: 'top_right',
    defaultRotation: 8,
    description: 'Cyan flame-breathing pixel art mascot decal',
  },
  {
    id: 'turbo_stick',
    name: 'Turbo Fightstick Pro',
    category: 'arcade',
    imageUrl: turboStickImg,
    defaultPlacement: 'bottom_left',
    defaultRotation: -5,
    description: 'Authentic Japanese arcade red balltop controller insignia',
  },
  {
    id: 'space_alien',
    name: 'Chrome Invader Hologram',
    category: 'hologram',
    imageUrl: spaceAlienImg,
    defaultPlacement: 'bottom_right',
    defaultRotation: 6,
    description: 'Metallic chrome 8-bit space invader with prismatic sheen',
  },
  {
    id: 'synth_cassette',
    name: 'Synthwave Mixtape',
    category: 'retro',
    imageUrl: synthCassetteImg,
    defaultPlacement: 'top_right',
    defaultRotation: -9,
    description: 'Holographic laser cassette foil sticker',
  },
  {
    id: 'gold_token',
    name: '1-UP Gold Insert Token',
    category: 'arcade',
    imageUrl: goldTokenImg,
    defaultPlacement: 'bottom_left',
    defaultRotation: 4,
    description: 'Embossed gold coin with 1-UP star insignia',
  },
];

export const CABINET_ART_STYLES: CabinetArtStyleConfig[] = [
  {
    id: 'classic_wood',
    name: '1982 Walnut Woodgrain',
    era: 'GOLDEN AGE 1980s',
    description: 'Warm dark walnut veneer side panels, polished gold brass T-molding, and amber warm CRT bevels.',
    cabinetBgClass: 'bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950',
    outerBorderClass: 'border-amber-700/80 shadow-[0_0_50px_rgba(120,53,15,0.4)]',
    tMoldingColor: '#d97706',
    marqueeBgClass: 'bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950',
    marqueeBorderClass: 'border-amber-700/60',
    accentGlow: 'rgba(217, 119, 6, 0.4)',
    tag: 'WOODEN RETRO',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Neo-Tokyo 2099',
    era: 'CYBERPUNK NEON',
    description: 'Slick dark acrylic with high-intensity cyan and magenta neon edge glow, carbon fiber weave, and dual-tone marquee.',
    cabinetBgClass: 'bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-950',
    outerBorderClass: 'border-cyan-500/80 shadow-[0_0_60px_rgba(6,182,212,0.45)]',
    tMoldingColor: '#06b6d4',
    marqueeBgClass: 'bg-gradient-to-r from-purple-950/90 via-slate-950 to-cyan-950/90',
    marqueeBorderClass: 'border-cyan-500/60',
    accentGlow: 'rgba(6, 182, 212, 0.5)',
    tag: 'NEON EDGE',
  },
  {
    id: 'candy_cab',
    name: 'Aero City Candy Cab',
    era: 'JAPANESE CANDY CAB',
    description: 'Glossy molded Japanese pearl-white chassis with emerald Sega-green trim and magenta speed racing side decals.',
    cabinetBgClass: 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-900',
    outerBorderClass: 'border-emerald-500 shadow-[0_0_55px_rgba(16,185,129,0.35)]',
    tMoldingColor: '#10b981',
    marqueeBgClass: 'bg-gradient-to-r from-emerald-900 via-slate-950 to-emerald-900',
    marqueeBorderClass: 'border-emerald-500/80',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    tag: 'JAPANESE PLASTIC',
  },
  {
    id: 'stealth_carbon',
    name: 'Midnight Carbon Stealth',
    era: 'TITANIUM PROTOTYPE',
    description: 'Matte aerospace carbon fiber finish with aggressive blood-red LED backlit accents, hex-pattern grill, and dark chrome hardware.',
    cabinetBgClass: 'bg-gradient-to-b from-neutral-900 via-zinc-950 to-black',
    outerBorderClass: 'border-rose-600/80 shadow-[0_0_50px_rgba(225,29,72,0.4)]',
    tMoldingColor: '#e11d48',
    marqueeBgClass: 'bg-gradient-to-r from-rose-950 via-neutral-950 to-rose-950',
    marqueeBorderClass: 'border-rose-600/60',
    accentGlow: 'rgba(225, 29, 72, 0.45)',
    tag: 'CARBON STEALTH',
  },
  {
    id: 'rad_memphis',
    name: 'Radical 90s Memphis Pop',
    era: 'SKATER ARCADE 1994',
    description: 'Vivid electric teal and yellow geometric zigzag patterns with magenta confetti splashes and mall arcade nostalgia.',
    cabinetBgClass: 'bg-gradient-to-b from-indigo-950 via-fuchsia-950/40 to-slate-950',
    outerBorderClass: 'border-fuchsia-500 shadow-[0_0_55px_rgba(217,70,239,0.45)]',
    tMoldingColor: '#e879f9',
    marqueeBgClass: 'bg-gradient-to-r from-fuchsia-950 via-slate-950 to-teal-950',
    marqueeBorderClass: 'border-fuchsia-500/80',
    accentGlow: 'rgba(217, 70, 239, 0.45)',
    tag: 'RADICAL POP',
  },
  {
    id: 'atomic_amber',
    name: 'Atomic Phosphor Vector',
    era: 'VECTOR TANK 1980',
    description: 'Industrial military gunmetal frame, radioactive amber CRT glow, hazard-striped bezel, and brass toggle switchplate.',
    cabinetBgClass: 'bg-gradient-to-b from-stone-900 via-amber-950/40 to-stone-950',
    outerBorderClass: 'border-amber-500/90 shadow-[0_0_55px_rgba(245,158,11,0.4)]',
    tMoldingColor: '#f59e0b',
    marqueeBgClass: 'bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950',
    marqueeBorderClass: 'border-amber-500/70',
    accentGlow: 'rgba(245, 158, 11, 0.5)',
    tag: 'VECTOR CRT',
  },
  {
    id: 'golden_vegas',
    name: 'Vegas High-Roller Gold',
    era: 'CASINO ROYALE 1989',
    description: 'Deep royal purple velvet housing, mirror-polished 24K gold trim molding, sparkling jackpot marquee lighting, and diamond bevel inlays.',
    cabinetBgClass: 'bg-gradient-to-b from-purple-950 via-amber-950/30 to-stone-950',
    outerBorderClass: 'border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.45)]',
    tMoldingColor: '#facc15',
    marqueeBgClass: 'bg-gradient-to-r from-yellow-900/80 via-purple-950 to-yellow-900/80',
    marqueeBorderClass: 'border-yellow-400/80',
    accentGlow: 'rgba(250, 204, 21, 0.5)',
    tag: 'GOLD LUXURY',
  },
];

export const DEFAULT_CABINET_CUSTOMIZATION: CabinetCustomizationState = {
  styleId: 'cyberpunk_neon',
  stickers: [
    {
      id: 'sticker-1',
      name: 'Neon Cyber Skull',
      imageUrl: retroSkullImg,
      placement: 'top_left',
      rotation: -8,
      scale: 1.0,
      filter: 'normal',
    },
    {
      id: 'sticker-2',
      name: '8-Bit Flame Drake',
      imageUrl: pixelDragonImg,
      placement: 'top_right',
      rotation: 7,
      scale: 1.05,
      filter: 'holographic',
    },
    {
      id: 'sticker-3',
      name: 'Turbo Fightstick Pro',
      imageUrl: turboStickImg,
      placement: 'bottom_left',
      rotation: -4,
      scale: 0.95,
      filter: 'normal',
    },
    {
      id: 'sticker-4',
      name: '1-UP Gold Insert Token',
      imageUrl: goldTokenImg,
      placement: 'bottom_right',
      rotation: 5,
      scale: 1.0,
      filter: 'normal',
    },
  ],
  sideTrimGlow: true,
  bezelWear: 'authentic',
};

const CABINET_CUSTOMIZATION_KEY = 'arcadejs_cabinet_customization';

export const cabinetService = {
  getCabinetCustomization(): CabinetCustomizationState {
    try {
      const data = localStorage.getItem(CABINET_CUSTOMIZATION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Verify style validity
        const validStyle = CABINET_ART_STYLES.some((s) => s.id === parsed.styleId);
        return {
          ...DEFAULT_CABINET_CUSTOMIZATION,
          ...parsed,
          styleId: validStyle ? parsed.styleId : DEFAULT_CABINET_CUSTOMIZATION.styleId,
          stickers: Array.isArray(parsed.stickers) ? parsed.stickers : DEFAULT_CABINET_CUSTOMIZATION.stickers,
        };
      }
    } catch {
      // Return default on parse failure
    }
    return DEFAULT_CABINET_CUSTOMIZATION;
  },

  saveCabinetCustomization(state: CabinetCustomizationState): void {
    try {
      localStorage.setItem(CABINET_CUSTOMIZATION_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  },

  getStyleConfig(styleId: CabinetStyleId): CabinetArtStyleConfig {
    return (
      CABINET_ART_STYLES.find((s) => s.id === styleId) ||
      CABINET_ART_STYLES[0]
    );
  },
};
