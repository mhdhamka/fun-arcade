import { GameId, ScoreRecord, Achievement, AchievementId } from '../types/arcade';
import { soundManager } from './audio';

const ACHIEVEMENTS_STORAGE_KEY = 'arcadejs_achievements_v1';

export interface StoredAchievementData {
  id: AchievementId;
  unlockedAt: string;
}

export const BASE_ACHIEVEMENTS: Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_coin',
    title: 'Insert Coin',
    description: 'Play your first arcade session and register a score in any cabinet.',
    category: 'milestone',
    accentColor: '#38bdf8', // sky-400
    badgeBg: 'bg-sky-950/60',
    badgeBorder: 'border-sky-500/50',
    iconName: 'Gamepad2',
  },
  {
    id: 'first_win',
    title: 'First Win',
    description: 'Complete a stage objective, clear an alien wave, or achieve a victory milestone.',
    category: 'milestone',
    accentColor: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-500/50',
    iconName: 'Trophy',
  },
  {
    id: 'point_club_100',
    title: '100-Point Club',
    description: 'Score 100 points or more in a single arcade game run.',
    category: 'score',
    accentColor: '#fbbf24', // amber-400
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-500/50',
    iconName: 'Zap',
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Log 5 or more total arcade game sessions across your career.',
    category: 'endurance',
    accentColor: '#f97316', // orange-500
    badgeBg: 'bg-orange-950/60',
    badgeBorder: 'border-orange-500/50',
    iconName: 'Footprints',
  },
  {
    id: 'high_roller',
    title: '1,000-Point Legend',
    description: 'Score 1,000 points or higher in any arcade game.',
    category: 'score',
    accentColor: '#a855f7', // purple-500
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-500/50',
    iconName: 'Crown',
  },
  {
    id: 'arcade_polymath',
    title: 'Arcade Polymath',
    description: 'Play and record a score across 6 different arcade cabinets.',
    category: 'mastery',
    accentColor: '#06b6d4', // cyan-500
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-500/50',
    iconName: 'Compass',
  },
  {
    id: 'tetris_wizard',
    title: 'Matrix Architect',
    description: 'Perform a 4-line Quad Tetris clear or reach 500+ points in Tetris Matrix.',
    category: 'mastery',
    accentColor: '#06b6d4', // cyan-400
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-500/50',
    iconName: 'Layers',
  },
  {
    id: 'serpent_feaster',
    title: 'Golden Serpent',
    description: 'Snag bonus golden stars or reach 200+ points in Snake Classic.',
    category: 'mastery',
    accentColor: '#34d399', // emerald-400
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-500/50',
    iconName: 'Sparkles',
  },
  {
    id: 'sky_ace',
    title: 'Gravity Defier',
    description: 'Navigate through 10 or more neon pipe corridors in Flappy Pixels.',
    category: 'mastery',
    accentColor: '#eab308', // yellow-500
    badgeBg: 'bg-yellow-950/60',
    badgeBorder: 'border-yellow-500/50',
    iconName: 'Target',
  },
  {
    id: 'galaxy_savior',
    title: 'Earth Defender',
    description: 'Eliminate alien invaders and clear 500+ points in Space Invaders.',
    category: 'mastery',
    accentColor: '#38bdf8', // sky-400
    badgeBg: 'bg-sky-950/60',
    badgeBorder: 'border-sky-500/50',
    iconName: 'Crosshair',
  },
  {
    id: 'mario_superstar',
    title: 'Mushroom Champion',
    description: 'Power up, stomp Goombas, and score 1,000+ points or reach the flagpole in Super Mario.',
    category: 'mastery',
    accentColor: '#ef4444', // rose-500
    badgeBg: 'bg-rose-950/60',
    badgeBorder: 'border-rose-500/50',
    iconName: 'Flame',
  },
  {
    id: 'pig_destroyer',
    title: 'Slingshot Sniper',
    description: 'Topple fortress towers and eliminate greedy pigs for 5,000+ points in Angry Birds.',
    category: 'mastery',
    accentColor: '#f97316', // orange-500
    badgeBg: 'bg-orange-950/60',
    badgeBorder: 'border-orange-500/50',
    iconName: 'Target',
  },
  {
    id: 'brick_breaker_pro',
    title: 'Brick Architect',
    description: 'Shatter neon barriers and score 1,200+ points in Neon Breaker.',
    category: 'mastery',
    accentColor: '#ec4899', // pink-500
    badgeBg: 'bg-pink-950/60',
    badgeBorder: 'border-pink-500/50',
    iconName: 'Zap',
  },
  {
    id: 'void_ace',
    title: 'Void Ace',
    description: 'Blast vector asteroids and alien saucers for 1,500+ points in Astro Blaster.',
    category: 'mastery',
    accentColor: '#22d3ee', // cyan-400
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-400/50',
    iconName: 'Crosshair',
  },
  {
    id: 'regular_champion',
    title: 'Park Legend',
    description: 'Rack up 2,500+ points across Put The Hurt, Moon Escape, or Destroyer Boss.',
    category: 'mastery',
    accentColor: '#facc15', // yellow-400
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-400/50',
    iconName: 'Flame',
  },
];

type AchievementListener = (newlyUnlocked: Achievement) => void;

class AchievementsEngine {
  private listeners: Set<AchievementListener> = new Set();

  public subscribe(listener: AchievementListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(unlocked: Achievement): void {
    this.listeners.forEach((fn) => {
      try {
        fn(unlocked);
      } catch (err) {
        console.error('Error notifying achievement listener', err);
      }
    });
  }

  private getStoredUnlocks(): Record<AchievementId, string> {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (!raw) return {} as Record<AchievementId, string>;
      return JSON.parse(raw);
    } catch {
      return {} as Record<AchievementId, string>;
    }
  }

  private saveUnlock(id: AchievementId): string {
    const unlocks = this.getStoredUnlocks();
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    unlocks[id] = dateStr;
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlocks));
    } catch (e) {
      console.error('Failed to persist achievement unlock', e);
    }
    return dateStr;
  }

  /**
   * Retrieves all achievements combined with their current unlocked state and live progress.
   */
  public getAchievements(
    highScores: Record<GameId, number>,
    history: ScoreRecord[]
  ): Achievement[] {
    const unlocks = this.getStoredUnlocks();

    // Distinct games played in history or with score > 0
    const gamesPlayed = new Set<GameId>();
    Object.entries(highScores).forEach(([gid, score]) => {
      if (score > 0) gamesPlayed.add(gid as GameId);
    });
    history.forEach((rec) => {
      if (rec.score > 0) gamesPlayed.add(rec.gameId);
    });

    const totalSessions = history.length;
    const maxScoreAcrossGames = Math.max(0, ...Object.values(highScores));

    return BASE_ACHIEVEMENTS.map((base) => {
      const unlockedDate = unlocks[base.id];
      const isUnlocked = Boolean(unlockedDate);

      let progress: Achievement['progress'] | undefined;

      switch (base.id) {
        case 'first_coin':
          progress = {
            current: Math.min(1, totalSessions),
            max: 1,
            unit: 'session',
          };
          break;
        case 'first_win':
          progress = {
            current: isUnlocked ? 1 : 0,
            max: 1,
            unit: 'win',
          };
          break;
        case 'point_club_100':
          progress = {
            current: Math.min(100, maxScoreAcrossGames),
            max: 100,
            unit: 'pts',
          };
          break;
        case 'marathon_runner':
          progress = {
            current: Math.min(5, totalSessions),
            max: 5,
            unit: 'sessions',
          };
          break;
        case 'high_roller':
          progress = {
            current: Math.min(1000, maxScoreAcrossGames),
            max: 1000,
            unit: 'pts',
          };
          break;
        case 'arcade_polymath':
          progress = {
            current: Math.min(6, gamesPlayed.size),
            max: 6,
            unit: 'cabinets',
          };
          break;
        case 'tetris_wizard':
          progress = {
            current: Math.min(500, highScores.tetris || 0),
            max: 500,
            unit: 'pts',
          };
          break;
        case 'serpent_feaster':
          progress = {
            current: Math.min(200, highScores.snake || 0),
            max: 200,
            unit: 'pts',
          };
          break;
        case 'sky_ace':
          progress = {
            current: Math.min(10, highScores.flappy || 0),
            max: 10,
            unit: 'pipes',
          };
          break;
        case 'galaxy_savior':
          progress = {
            current: Math.min(500, highScores.invaders || 0),
            max: 500,
            unit: 'pts',
          };
          break;
        case 'mario_superstar':
          progress = {
            current: Math.min(1000, highScores.mario || 0),
            max: 1000,
            unit: 'pts',
          };
          break;
        case 'pig_destroyer':
          progress = {
            current: Math.min(5000, highScores.angrybirds || 0),
            max: 5000,
            unit: 'pts',
          };
          break;
        case 'brick_breaker_pro':
          progress = {
            current: Math.min(1200, highScores.breakout || 0),
            max: 1200,
            unit: 'pts',
          };
          break;
        case 'void_ace':
          progress = {
            current: Math.min(1500, highScores.asteroids || 0),
            max: 1500,
            unit: 'pts',
          };
          break;
        case 'regular_champion':
          progress = {
            current: Math.min(2500, highScores.regularshow || 0),
            max: 2500,
            unit: 'pts',
          };
          break;
        default:
          break;
      }

      return {
        ...base,
        isUnlocked,
        unlockedAt: unlockedDate,
        progress,
      };
    });
  }

  /**
   * Evaluates milestone criteria after a game event and unlocks achievements.
   * Returns an array of newly unlocked achievements.
   */
  public checkMilestones(params: {
    gameId: GameId;
    sessionScore: number;
    isGameCompleted?: boolean;
    completionMessage?: string;
    highScores: Record<GameId, number>;
    history: ScoreRecord[];
  }): Achievement[] {
    const {
      gameId,
      sessionScore,
      isGameCompleted = false,
      highScores,
      history,
    } = params;

    const unlocks = this.getStoredUnlocks();
    const newlyUnlocked: Achievement[] = [];

    const unlockIfNeeded = (id: AchievementId): void => {
      if (unlocks[id]) return; // Already unlocked

      const dateStr = this.saveUnlock(id);
      unlocks[id] = dateStr;

      const base = BASE_ACHIEVEMENTS.find((a) => a.id === id);
      if (base) {
        const full: Achievement = {
          ...base,
          isUnlocked: true,
          unlockedAt: dateStr,
        };
        newlyUnlocked.push(full);
        this.notify(full);
      }
    };

    // 1. First Coin (any play session logged)
    if (history.length >= 1 || sessionScore > 0) {
      unlockIfNeeded('first_coin');
    }

    // 2. First Win (completed stage objective, wave clear, or score threshold in a game)
    if (
      isGameCompleted ||
      (gameId === 'invaders' && sessionScore >= 200) ||
      (gameId === 'tetris' && sessionScore >= 300) ||
      (gameId === 'snake' && sessionScore >= 100) ||
      (gameId === 'flappy' && sessionScore >= 10) ||
      (gameId === 'mario' && sessionScore >= 500) ||
      (gameId === 'angrybirds' && sessionScore >= 5000) ||
      (gameId === 'breakout' && sessionScore >= 600) ||
      (gameId === 'asteroids' && sessionScore >= 800) ||
      (gameId === 'regularshow' && sessionScore >= 800)
    ) {
      unlockIfNeeded('first_win');
    }

    // 3. 100-Point Club
    const maxScore = Math.max(sessionScore, ...Object.values(highScores));
    if (maxScore >= 100) {
      unlockIfNeeded('point_club_100');
    }

    // 4. Marathon Runner (5+ total sessions)
    // Note: current session is either in history or about to be recorded
    if (history.length >= 5) {
      unlockIfNeeded('marathon_runner');
    }

    // 5. High Roller (1,000+ points)
    if (maxScore >= 1000) {
      unlockIfNeeded('high_roller');
    }

    // 6. Arcade Polymath (played and scored across 6 games)
    const gamesPlayed = new Set<GameId>();
    Object.entries(highScores).forEach(([gid, sc]) => {
      if (sc > 0) gamesPlayed.add(gid as GameId);
    });
    history.forEach((h) => {
      if (h.score > 0) gamesPlayed.add(h.gameId);
    });
    if (sessionScore > 0) {
      gamesPlayed.add(gameId);
    }
    if (gamesPlayed.size >= 6) {
      unlockIfNeeded('arcade_polymath');
    }

    // 7. Game-specific Masteries
    const currentSnakeHigh = Math.max(highScores.snake || 0, gameId === 'snake' ? sessionScore : 0);
    if (currentSnakeHigh >= 200 || (gameId === 'snake' && isGameCompleted)) {
      unlockIfNeeded('serpent_feaster');
    }

    const currentFlappyHigh = Math.max(highScores.flappy || 0, gameId === 'flappy' ? sessionScore : 0);
    if (currentFlappyHigh >= 10 || (gameId === 'flappy' && isGameCompleted)) {
      unlockIfNeeded('sky_ace');
    }

    const currentTetrisHigh = Math.max(highScores.tetris || 0, gameId === 'tetris' ? sessionScore : 0);
    if (currentTetrisHigh >= 500 || (gameId === 'tetris' && isGameCompleted)) {
      unlockIfNeeded('tetris_wizard');
    }

    const currentInvadersHigh = Math.max(highScores.invaders || 0, gameId === 'invaders' ? sessionScore : 0);
    if (currentInvadersHigh >= 500 || (gameId === 'invaders' && isGameCompleted)) {
      unlockIfNeeded('galaxy_savior');
    }

    const currentMarioHigh = Math.max(highScores.mario || 0, gameId === 'mario' ? sessionScore : 0);
    if (currentMarioHigh >= 1000 || (gameId === 'mario' && isGameCompleted)) {
      unlockIfNeeded('mario_superstar');
    }

    const currentAngryBirdsHigh = Math.max(highScores.angrybirds || 0, gameId === 'angrybirds' ? sessionScore : 0);
    if (currentAngryBirdsHigh >= 5000 || (gameId === 'angrybirds' && isGameCompleted)) {
      unlockIfNeeded('pig_destroyer');
    }

    const currentBreakoutHigh = Math.max(highScores.breakout || 0, gameId === 'breakout' ? sessionScore : 0);
    if (currentBreakoutHigh >= 1200 || (gameId === 'breakout' && isGameCompleted)) {
      unlockIfNeeded('brick_breaker_pro');
    }

    const currentAsteroidsHigh = Math.max(highScores.asteroids || 0, gameId === 'asteroids' ? sessionScore : 0);
    if (currentAsteroidsHigh >= 1500 || (gameId === 'asteroids' && isGameCompleted)) {
      unlockIfNeeded('void_ace');
    }

    const currentRegularHigh = Math.max(highScores.regularshow || 0, gameId === 'regularshow' ? sessionScore : 0);
    if (currentRegularHigh >= 2500 || (gameId === 'regularshow' && isGameCompleted)) {
      unlockIfNeeded('regular_champion');
    }

    // Trigger celebratory sound if anything unlocked
    if (newlyUnlocked.length > 0) {
      soundManager.play('fanfare');
    }

    return newlyUnlocked;
  }

  public resetAchievements(): void {
    try {
      localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export const achievementsEngine = new AchievementsEngine();
