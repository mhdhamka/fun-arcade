import { GameId, ScoreRecord, ThemeId, PlayerProfile, PixelAvatar } from '../types/arcade';
import { getDefaultPlayerProfile, PRESET_AVATARS } from './avatars';
import { cabinetService } from './cabinetStyles';

const HIGH_SCORES_KEY = 'arcadejs_high_scores';
const SCORE_HISTORY_KEY = 'arcadejs_score_history';
const THEME_KEY = 'arcadejs_theme';
const SCANLINES_KEY = 'arcadejs_scanlines';
const SOUND_KEY = 'arcadejs_sound';
const AMBIENT_SOUND_KEY = 'arcadejs_ambient_sound';
const PLAYER_PROFILE_KEY = 'arcadejs_player_profile';

const DEFAULT_HIGH_SCORES: Record<GameId, number> = {
  snake: 0,
  flappy: 0,
  tetris: 0,
  invaders: 0,
  mario: 0,
  angrybirds: 0,
};

export interface GlobalLeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  playerTitle: string;
  playerAvatar: PixelAvatar;
  gameId: GameId;
  score: number;
  date: string;
  isCurrentPlayer?: boolean;
}

// Seeded Legendary Arcade Rivals
const ARCADE_RIVALS: Omit<GlobalLeaderboardEntry, 'rank'>[] = [
  {
    id: 'rival-1',
    playerName: 'PAC_KING',
    playerTitle: 'Arcade Ace',
    playerAvatar: PRESET_AVATARS[0], // Pixel Plumber
    gameId: 'snake',
    score: 840,
    date: 'SEPT 02',
  },
  {
    id: 'rival-2',
    playerName: 'CYBER_GHOST',
    playerTitle: 'Retro God',
    playerAvatar: PRESET_AVATARS[5], // Arcade Spectre
    gameId: 'flappy',
    score: 48,
    date: 'AUG 28',
  },
  {
    id: 'rival-3',
    playerName: 'VIPER_84',
    playerTitle: 'Cabinet Crusher',
    playerAvatar: PRESET_AVATARS[1], // Cyber Ninja
    gameId: 'invaders',
    score: 5400,
    date: 'SEPT 08',
  },
  {
    id: 'rival-4',
    playerName: 'BLOCK_MASTER',
    playerTitle: 'Pixel Wizard',
    playerAvatar: PRESET_AVATARS[3], // Chrono Mage
    gameId: 'tetris',
    score: 14200,
    date: 'SEPT 05',
  },
  {
    id: 'rival-5',
    playerName: 'WARP_RUNNER',
    playerTitle: 'Speed Demon',
    playerAvatar: PRESET_AVATARS[7], // Neon Punk
    gameId: 'mario',
    score: 3850,
    date: 'AUG 30',
  },
  {
    id: 'rival-6',
    playerName: 'RED_SLING',
    playerTitle: 'Quarter Champion',
    playerAvatar: PRESET_AVATARS[8], // Skull Raider
    gameId: 'angrybirds',
    score: 18500,
    date: 'SEPT 09',
  },
  {
    id: 'rival-7',
    playerName: 'NEO_PILOT',
    playerTitle: '1CC Legend',
    playerAvatar: PRESET_AVATARS[4], // Space Marine
    gameId: 'invaders',
    score: 3950,
    date: 'SEPT 01',
  },
  {
    id: 'rival-8',
    playerName: 'GLITCH_BOT',
    playerTitle: 'Cyber Runner',
    playerAvatar: PRESET_AVATARS[6], // Retro Android
    gameId: 'snake',
    score: 620,
    date: 'AUG 25',
  },
  {
    id: 'rival-9',
    playerName: 'CHRONO_QUEEN',
    playerTitle: 'Pixel Wizard',
    playerAvatar: PRESET_AVATARS[9], // Pixel Knight
    gameId: 'tetris',
    score: 10800,
    date: 'SEPT 07',
  },
  {
    id: 'rival-10',
    playerName: 'VOID_INVADER',
    playerTitle: 'High Score Chaser',
    playerAvatar: PRESET_AVATARS[2], // Alien Invader
    gameId: 'flappy',
    score: 32,
    date: 'AUG 22',
  },
];

export const storageService = {
  getHighScores(): Record<GameId, number> {
    try {
      const data = localStorage.getItem(HIGH_SCORES_KEY);
      if (!data) return { ...DEFAULT_HIGH_SCORES };
      return { ...DEFAULT_HIGH_SCORES, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_HIGH_SCORES };
    }
  },

  saveScore(
    gameId: GameId,
    score: number,
    playerName?: string,
    playerAvatar?: PixelAvatar
  ): { isNewHigh: boolean; highScore: number } {
    const scores = this.getHighScores();
    const currentHigh = scores[gameId] || 0;
    const isNewHigh = score > currentHigh;

    const profile = this.getPlayerProfile();
    const resolvedName = playerName?.trim() || profile.name || 'PLAYER 1';
    const resolvedAvatar = playerAvatar || profile.avatar;

    if (isNewHigh) {
      scores[gameId] = score;
      try {
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
      } catch {
        // Storage fail fallback
      }
    }

    if (score > 0) {
      this.recordHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gameId,
        score,
        date: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        playerName: resolvedName,
        playerAvatar: resolvedAvatar,
      });
    }

    return {
      isNewHigh,
      highScore: Math.max(currentHigh, score),
    };
  },

  getPlayerProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(PLAYER_PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.name && parsed.avatar) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getDefaultPlayerProfile();
  },

  savePlayerProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Storage fallback
    }
  },

  /**
   * Retrieves global high score leaderboard records, combining seeded arcade legends
   * with the current player's personal high records and session achievements.
   */
  getGlobalLeaderboard(selectedGameId?: GameId | 'ALL'): GlobalLeaderboardEntry[] {
    const profile = this.getPlayerProfile();
    const highScores = this.getHighScores();

    // 1. Gather rivals
    let entries: Omit<GlobalLeaderboardEntry, 'rank'>[] = [...ARCADE_RIVALS];

    // 2. Add current player's records for each game where score > 0
    (Object.keys(highScores) as GameId[]).forEach((gid) => {
      const userScore = highScores[gid] || 0;
      if (userScore > 0) {
        entries.push({
          id: `player-${gid}`,
          playerName: profile.name,
          playerTitle: profile.title,
          playerAvatar: profile.avatar,
          gameId: gid,
          score: userScore,
          date: 'TODAY',
          isCurrentPlayer: true,
        });
      }
    });

    // 3. Filter by game if specified
    if (selectedGameId && selectedGameId !== 'ALL') {
      entries = entries.filter((e) => e.gameId === selectedGameId);
    }

    // 4. Sort descending by score
    entries.sort((a, b) => b.score - a.score);

    // 5. Deduplicate if needed (keep highest per player per game) and assign ranks
    const seen = new Set<string>();
    const ranked: GlobalLeaderboardEntry[] = [];
    let currentRank = 1;

    for (const item of entries) {
      const key = `${item.playerName}_${item.gameId}`;
      if (!seen.has(key)) {
        seen.add(key);
        ranked.push({
          ...item,
          rank: currentRank++,
        });
      }
    }

    return ranked;
  },

  getHistory(): ScoreRecord[] {
    try {
      const data = localStorage.getItem(SCORE_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  recordHistory(record: ScoreRecord): void {
    try {
      const history = this.getHistory();
      const updated = [record, ...history].slice(0, 30); // Keep latest 30 records
      localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(SCORE_HISTORY_KEY);
      localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(DEFAULT_HIGH_SCORES));
    } catch {
      // Ignore
    }
  },

  getTheme(): ThemeId {
    try {
      const t = localStorage.getItem(THEME_KEY) as ThemeId;
      if (t === 'cyberpunk' || t === 'crt' || t === 'minimalist') return t;
    } catch {
      // Fall through
    }
    return 'cyberpunk';
  },

  setTheme(theme: ThemeId): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Fall through
    }
  },

  getScanlines(): boolean {
    try {
      const val = localStorage.getItem(SCANLINES_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  },

  setScanlines(enabled: boolean): void {
    try {
      localStorage.setItem(SCANLINES_KEY, String(enabled));
    } catch {
      // Fall through
    }
  },

  getSoundEnabled(): boolean {
    try {
      const val = localStorage.getItem(SOUND_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  },

  setSoundEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(SOUND_KEY, String(enabled));
    } catch {
      // Fall through
    }
  },

  getAmbientSoundEnabled(): boolean {
    try {
      const val = localStorage.getItem(AMBIENT_SOUND_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  },

  setAmbientSoundEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(AMBIENT_SOUND_KEY, String(enabled));
    } catch {
      // Fall through
    }
  },

  getCabinetCustomization() {
    return cabinetService.getCabinetCustomization();
  },

  saveCabinetCustomization(state: import('../types/arcade').CabinetCustomizationState) {
    cabinetService.saveCabinetCustomization(state);
  },
};
