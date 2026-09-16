import React from 'react';

export type GameId = 'snake' | 'flappy' | 'tetris' | 'invaders' | 'mario' | 'angrybirds';

export type ThemeId = 'cyberpunk' | 'crt' | 'minimalist';

export type SfxType =
  | 'select'
  | 'start'
  | 'point'
  | 'laser'
  | 'hit'
  | 'gameover'
  | 'level'
  | 'jump'
  | 'clear'
  | 'pause'
  | 'fanfare'
  | 'coin'
  | 'ambient_chime';

export interface VirtualInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  actionA: boolean; // primary action (jump, shoot, rotate, hard drop)
  actionB: boolean; // secondary action (hold, bomb, etc.)
  timestamp: number;
}

export interface ArcadeGameProps {
  onScoreChange: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  isPaused: boolean;
  soundEnabled: boolean;
  playSfx: (type: SfxType) => void;
  virtualInput: VirtualInputState;
  onTriggerScreenShake?: (intensity?: 'subtle' | 'intense') => void;
  onTriggerParticles?: (type?: 'confetti' | 'stars' | 'fireworks', count?: number) => void;
  onGameCompleted?: (finalScore: number, message?: string) => void;
}

export interface GameControlInfo {
  key: string;
  action: string;
}

export interface GameModule {
  id: GameId;
  title: string;
  genre: string;
  year: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  instructions: string[];
  controls: GameControlInfo[];
  component: React.ComponentType<ArcadeGameProps>;
  previewVideoUrl?: string;
  previewWebmUrl?: string;
  posterUrl?: string;
}

export interface PixelAvatar {
  id: string;
  name: string;
  type: 'preset' | 'custom' | 'procedural';
  pixels: string[]; // 64 entries for an 8x8 grid of hex color strings or transparent ''
  backgroundColor?: string;
  accentColor: string;
}

export interface PlayerProfile {
  name: string;
  title: string;
  avatar: PixelAvatar;
  joinedDate: string;
}

export interface ScoreRecord {
  id: string;
  gameId: GameId;
  score: number;
  date: string;
  playerName: string;
  playerAvatar?: PixelAvatar;
}

export interface ArcadeStats {
  totalGamesPlayed: number;
  highScores: Record<GameId, number>;
  recentScores: ScoreRecord[];
}

export type AchievementCategory = 'milestone' | 'score' | 'mastery' | 'endurance';

export type AchievementId =
  | 'first_win'
  | 'point_club_100'
  | 'marathon_runner'
  | 'first_coin'
  | 'high_roller'
  | 'arcade_polymath'
  | 'tetris_wizard'
  | 'serpent_feaster'
  | 'sky_ace'
  | 'galaxy_savior'
  | 'mario_superstar'
  | 'pig_destroyer';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  category: AchievementCategory;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  iconName: string;
  unlockedAt?: string;
  progress?: {
    current: number;
    max: number;
    unit?: string;
  };
  isUnlocked: boolean;
}

export type CabinetStyleId =
  | 'classic_wood'
  | 'cyberpunk_neon'
  | 'candy_cab'
  | 'stealth_carbon'
  | 'rad_memphis'
  | 'atomic_amber'
  | 'golden_vegas';

export type StickerPlacement =
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right';

export type StickerWearFilter = 'normal' | 'worn' | 'holographic';

export interface CabinetSticker {
  id: string;
  name: string;
  imageUrl: string;
  placement: StickerPlacement;
  rotation: number;
  scale: number;
  filter?: StickerWearFilter;
}

export interface CabinetArtStyleConfig {
  id: CabinetStyleId;
  name: string;
  era: string;
  description: string;
  cabinetBgClass: string;
  outerBorderClass: string;
  tMoldingColor: string;
  marqueeBgClass: string;
  marqueeBorderClass: string;
  accentGlow: string;
  tag: string;
}

export interface CabinetCustomizationState {
  styleId: CabinetStyleId;
  stickers: CabinetSticker[];
  sideTrimGlow: boolean;
  bezelWear: 'clean' | 'authentic' | 'patina';
}

