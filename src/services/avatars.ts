import { PixelAvatar, PlayerProfile } from '../types/arcade';

// Classic 16-color Retro Arcade Palette
export const RETRO_PALETTE = [
  { hex: '', name: 'Eraser / Transparent' },
  { hex: '#0f172a', name: 'Arcade Slate' },
  { hex: '#f8fafc', name: 'Pixel White' },
  { hex: '#ef4444', name: 'Power Red' },
  { hex: '#991b1b', name: 'Crimson' },
  { hex: '#06b6d4', name: 'Neon Cyan' },
  { hex: '#2563eb', name: 'Cobalt Blue' },
  { hex: '#f59e0b', name: 'Arcade Gold' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#ec4899', name: 'Hot Magenta' },
  { hex: '#8b5cf6', name: 'Electric Purple' },
  { hex: '#84cc16', name: 'Radioactive Lime' },
  { hex: '#f97316', name: 'Sunset Orange' },
  { hex: '#fed7aa', name: 'Hero Peach' },
  { hex: '#d97706', name: 'Bronze Amber' },
  { hex: '#64748b', name: 'Machine Metal' },
];

/**
 * Helper to convert an 8-string template (each string has 8 chars) into a 64-element array
 */
function templateToPixels(rows: string[], charMap: Record<string, string>): string[] {
  const pixels: string[] = [];
  for (let r = 0; r < 8; r++) {
    const row = rows[r] || '........';
    for (let c = 0; c < 8; c++) {
      const ch = row[c] || '.';
      pixels.push(charMap[ch] || '');
    }
  }
  return pixels;
}

// Curated Hand-crafted 8x8 Presets
export const PRESET_AVATARS: PixelAvatar[] = [
  {
    id: 'preset_hero',
    name: 'Pixel Plumber',
    type: 'preset',
    accentColor: '#ef4444',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '..RRRR..',
        '.RRRRRR.',
        '.BBSBB..',
        'SSSSSSSS',
        '.SSWWSS.',
        '..RRRR..',
        '.BBRRBB.',
        '.BB..BB.',
      ],
      {
        R: '#ef4444', // Red cap/shirt
        S: '#fed7aa', // Skin
        B: '#2563eb', // Overalls / mustache
        W: '#f8fafc', // Eyes
        '.': '',
      }
    ),
  },
  {
    id: 'preset_cyber_ninja',
    name: 'Cyber Ninja',
    type: 'preset',
    accentColor: '#06b6d4',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '..DDDD..',
        '.DPPPPD.',
        '.DDDDDD.',
        '.DCCDD..',
        '..CCCD..',
        '.DDDDDD.',
        'DPDDDD..',
        '..DDDD..',
      ],
      {
        D: '#0f172a', // Mask / hood
        P: '#8b5cf6', // Violet wrap
        C: '#06b6d4', // Glowing cyan visor
        '.': '',
      }
    ),
  },
  {
    id: 'preset_invader',
    name: 'Alien Invader',
    type: 'preset',
    accentColor: '#10b981',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '.G....G.',
        '..G..G..',
        '.GGGGGG.',
        'GGWGGWGG',
        'GGGGGGGG',
        '.G.GG.G.',
        'G......G',
        '.G....G.',
      ],
      {
        G: '#10b981', // Neon green
        W: '#f8fafc', // Eye center
        '.': '',
      }
    ),
  },
  {
    id: 'preset_mage',
    name: 'Chrono Mage',
    type: 'preset',
    accentColor: '#8b5cf6',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '...PP...',
        '..PPPP..',
        '.PPPPPP.',
        'PPPPPPPP',
        '.PYSSYP.',
        '..WWWW..',
        '.PWWWWP.',
        'PPPPPPPP',
      ],
      {
        P: '#8b5cf6', // Wizard purple
        Y: '#f59e0b', // Glowing gold eyes
        S: '#fed7aa', // Skin
        W: '#f8fafc', // White beard
        '.': '',
      }
    ),
  },
  {
    id: 'preset_marine',
    name: 'Space Marine',
    type: 'preset',
    accentColor: '#84cc16',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '..GGGG..',
        '.GGGGGG.',
        'GOOOOOOG',
        'GOOOOOOG',
        '.GGGGGG.',
        'GG.GG.GG',
        'GGGGGGGG',
        '.GG..GG.',
      ],
      {
        G: '#4d7c0f', // Olive armor
        O: '#f97316', // Orange visor
        '.': '',
      }
    ),
  },
  {
    id: 'preset_ghost',
    name: 'Arcade Spectre',
    type: 'preset',
    accentColor: '#06b6d4',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '..CCCC..',
        '.CCCCCC.',
        'CWWCCWWC',
        'CBBCCBBC',
        'CCCCCCCC',
        'CCCCCCCC',
        'CCCCCCCC',
        'C.C..C.C',
      ],
      {
        C: '#06b6d4', // Cyan ghost body
        W: '#f8fafc', // White sclera
        B: '#2563eb', // Blue iris
        '.': '',
      }
    ),
  },
  {
    id: 'preset_bot',
    name: 'Retro Android',
    type: 'preset',
    accentColor: '#f59e0b',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '...AA...',
        '..YYYY..',
        '.YYYYYY.',
        '.YCCCCY.',
        '.YYYYYY.',
        '..MMMM..',
        '.YMMMMY.',
        '..Y..Y..',
      ],
      {
        A: '#ef4444', // Red antenna
        Y: '#f59e0b', // Gold chassis
        C: '#06b6d4', // Cyan optic visor
        M: '#64748b', // Metal chassis
        '.': '',
      }
    ),
  },
  {
    id: 'preset_punk',
    name: 'Neon Punk',
    type: 'preset',
    accentColor: '#ec4899',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '...MM...',
        '..MMMM..',
        '.SSSSSS.',
        '.SBBSS..',
        'SSBBSSSS',
        '..SSSS..',
        '.DDDDDD.',
        '..DDDD..',
      ],
      {
        M: '#ec4899', // Pink mohawk
        S: '#fed7aa', // Skin
        B: '#0f172a', // Sunglasses
        D: '#8b5cf6', // Violet jacket
        '.': '',
      }
    ),
  },
  {
    id: 'preset_skull',
    name: 'Skull Raider',
    type: 'preset',
    accentColor: '#ef4444',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '.RRRRRR.',
        'RRRRRRRR',
        '.WWWWWW.',
        'W.W..W.W',
        'WWWWWWWW',
        '.WWWWWW.',
        '..W..W..',
        '.RR..RR.',
      ],
      {
        R: '#ef4444', // Red pirate bandanna
        W: '#f8fafc', // Bone white
        '.': '',
      }
    ),
  },
  {
    id: 'preset_paladin',
    name: 'Pixel Knight',
    type: 'preset',
    accentColor: '#f59e0b',
    backgroundColor: '#020617',
    pixels: templateToPixels(
      [
        '...YY...',
        '..MMMM..',
        '.MMMMMM.',
        '.MYYYYM.',
        '.MMMMMM.',
        '..MMMM..',
        '.MMMMMM.',
        '.MM..MM.',
      ],
      {
        Y: '#f59e0b', // Gold crest & visor
        M: '#94a3b8', // Steel armor
        '.': '',
      }
    ),
  },
];

// Procedural Theme Palettes for Random Generation
const PROCEDURAL_THEMES = [
  {
    name: 'Cyberpunk',
    hair: '#ec4899',
    skin: '#fed7aa',
    eyes: '#06b6d4',
    body: '#0f172a',
    accent: '#06b6d4',
  },
  {
    name: 'Solar Flare',
    hair: '#f97316',
    skin: '#fed7aa',
    eyes: '#f59e0b',
    body: '#ef4444',
    accent: '#f59e0b',
  },
  {
    name: 'Matrix Neon',
    hair: '#84cc16',
    skin: '#f8fafc',
    eyes: '#10b981',
    body: '#0f172a',
    accent: '#10b981',
  },
  {
    name: 'Galactic Mage',
    hair: '#8b5cf6',
    skin: '#fed7aa',
    eyes: '#f59e0b',
    body: '#2563eb',
    accent: '#8b5cf6',
  },
  {
    name: 'Shadow Phantom',
    hair: '#0f172a',
    skin: '#64748b',
    eyes: '#ef4444',
    body: '#991b1b',
    accent: '#ef4444',
  },
  {
    name: 'Golden Vanguard',
    hair: '#f59e0b',
    skin: '#fed7aa',
    eyes: '#06b6d4',
    body: '#d97706',
    accent: '#f59e0b',
  },
  {
    name: 'Sub-Zero Cryo',
    hair: '#06b6d4',
    skin: '#f8fafc',
    eyes: '#2563eb',
    body: '#0f172a',
    accent: '#06b6d4',
  },
];

const PROCEDURAL_TITLES = [
  'Pixel Ace',
  'Cyber Hero',
  '8-Bit Nomad',
  'Arcade Glitch',
  'Retro Phantom',
  'Vektor Knight',
  'Quarter Master',
  'Bit Runner',
  'Chiptune Bard',
  'High-Score Mage',
];

/**
 * Generates an authentic, symmetrical 8x8 8-bit character avatar procedurally.
 */
export function generateProceduralAvatar(customName?: string): PixelAvatar {
  const theme = PROCEDURAL_THEMES[Math.floor(Math.random() * PROCEDURAL_THEMES.length)];
  const title = customName || PROCEDURAL_TITLES[Math.floor(Math.random() * PROCEDURAL_TITLES.length)];

  // Initialize empty 8x8 grid
  const grid: string[][] = Array.from({ length: 8 }, () => Array(8).fill(''));

  // Hat / Hair Style (Rows 0-2)
  const hairStyle = Math.floor(Math.random() * 4);
  if (hairStyle === 0) {
    // Beanie / Cap
    for (let c = 2; c <= 5; c++) grid[0][c] = theme.hair;
    for (let c = 1; c <= 6; c++) grid[1][c] = theme.hair;
  } else if (hairStyle === 1) {
    // Mohawk / Crest
    grid[0][3] = theme.hair;
    grid[0][4] = theme.hair;
    grid[1][3] = theme.hair;
    grid[1][4] = theme.hair;
    grid[2][2] = theme.hair;
    grid[2][5] = theme.hair;
  } else if (hairStyle === 2) {
    // Helmet / Horns
    grid[0][1] = theme.accent;
    grid[0][6] = theme.accent;
    for (let c = 2; c <= 5; c++) grid[0][c] = theme.hair;
    for (let c = 1; c <= 6; c++) grid[1][c] = theme.hair;
  } else {
    // Wild 8-bit spike hair
    grid[0][2] = theme.hair;
    grid[0][5] = theme.hair;
    for (let c = 1; c <= 6; c++) grid[1][c] = theme.hair;
  }

  // Face (Rows 2-4)
  for (let r = 2; r <= 4; r++) {
    for (let c = 2; c <= 5; c++) {
      if (!grid[r][c]) grid[r][c] = theme.skin;
    }
  }

  // Eyes (Row 3)
  const eyeStyle = Math.floor(Math.random() * 3);
  if (eyeStyle === 0) {
    // Two glowing square eyes
    grid[3][2] = theme.eyes;
    grid[3][5] = theme.eyes;
  } else if (eyeStyle === 1) {
    // Wide cyber visor
    grid[3][2] = theme.eyes;
    grid[3][3] = theme.eyes;
    grid[3][4] = theme.eyes;
    grid[3][5] = theme.eyes;
  } else {
    // Sunglasses / Mask
    grid[3][1] = '#0f172a';
    grid[3][2] = '#0f172a';
    grid[3][3] = theme.eyes;
    grid[3][4] = theme.eyes;
    grid[3][5] = '#0f172a';
    grid[3][6] = '#0f172a';
  }

  // Mouth / Beard / Mouthguard (Row 4)
  const mouthStyle = Math.floor(Math.random() * 3);
  if (mouthStyle === 1) {
    // Beard / Chin guard
    grid[4][2] = theme.hair;
    grid[4][3] = theme.hair;
    grid[4][4] = theme.hair;
    grid[4][5] = theme.hair;
  } else if (mouthStyle === 2) {
    // Smile
    grid[4][3] = '#991b1b';
    grid[4][4] = '#991b1b';
  }

  // Torso / Armor (Rows 5-7)
  for (let c = 1; c <= 6; c++) grid[5][c] = theme.body;
  grid[5][3] = theme.accent;
  grid[5][4] = theme.accent;

  // Arms / Shoulders
  grid[6][0] = theme.body;
  grid[6][1] = theme.body;
  grid[6][2] = theme.accent;
  grid[6][3] = theme.body;
  grid[6][4] = theme.body;
  grid[6][5] = theme.accent;
  grid[6][6] = theme.body;
  grid[6][7] = theme.body;

  // Lower waist
  for (let c = 2; c <= 5; c++) grid[7][c] = theme.body;

  // Flatten into 64 array
  const pixels: string[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      pixels.push(grid[r][c] || '');
    }
  }

  return {
    id: `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${theme.name} ${title}`,
    type: 'procedural',
    accentColor: theme.accent,
    backgroundColor: '#020617',
    pixels,
  };
}

export function getDefaultPlayerProfile(): PlayerProfile {
  return {
    name: 'PLAYER_1',
    title: 'Arcade Ace',
    avatar: PRESET_AVATARS[0], // Pixel Plumber preset
    joinedDate: 'SEPT 2026',
  };
}
