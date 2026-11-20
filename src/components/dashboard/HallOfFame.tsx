import React, { useState } from 'react';
import { GameId, ScoreRecord, PlayerProfile } from '../../types/arcade';
import { ARCADE_GAMES } from '../../games/registry';
import { storageService, GlobalLeaderboardEntry } from '../../services/storage';
import { PixelAvatarView } from '../common/PixelAvatarView';
import { AchievementBadges } from './AchievementBadges';
import {
  Trophy,
  Clock,
  Trash2,
  Award,
  Crown,
  Medal,
  Globe,
} from 'lucide-react';

interface HallOfFameProps {
  highScores: Record<GameId, number>;
  history: ScoreRecord[];
  onClear: () => void;
  profile?: PlayerProfile;
  onOpenProfileModal?: () => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({
  highScores,
  history,
  onClear,
  profile,
  onOpenProfileModal,
}) => {
  const [selectedLeaderboardGame, setSelectedLeaderboardGame] = useState<GameId | 'ALL'>('ALL');

  // Fetch merged global leaderboards with avatars
  const leaderboardEntries = storageService.getGlobalLeaderboard(selectedLeaderboardGame);

  const getRankVisual = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-retro text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300/20 border border-slate-300 text-slate-200 flex items-center justify-center font-retro text-xs shadow-[0_0_10px_rgba(203,213,225,0.2)]">
          <Medal className="w-3.5 h-3.5 text-slate-300" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-700 text-amber-600 flex items-center justify-center font-retro text-xs">
          <Medal className="w-3.5 h-3.5 text-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border-2 border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-retro text-amber-400 glow-amber tracking-wide">
            HALL OF FAME
          </h2>
        </div>

        {history.length > 0 && (
          <button
            id="btn-clear-history"
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-rose-400 transition cursor-pointer"
            title="Reset score data"
          >
            <Trash2 className="w-3 h-3" />
            <span>RESET RECORDS</span>
          </button>
        )}
      </div>

      {/* Player Profile Quick Bar */}
      {profile && (
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-4">
            <PixelAvatarView
              avatar={profile.avatar}
              size="lg"
              glow
              className="ring-2 ring-amber-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-retro text-white tracking-wide uppercase">
                  {profile.name}
                </span>
                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-[9px] font-mono">
                  {profile.title}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Avatar is displayed on all global leaderboards and game over score submissions.
              </p>
            </div>
          </div>

          {onOpenProfileModal && (
            <button
              id="btn-customize-avatar"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-retro text-xs transition cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            >
              <span>CUSTOMIZE 8-BIT AVATAR</span>
            </button>
          )}
        </div>
      )}

      {/* Global High Score Leaderboard Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-retro text-cyan-400 tracking-wider">
              GLOBAL HIGH SCORE LEADERBOARDS
            </h3>
          </div>

          {/* Game Filter Pills */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSelectedLeaderboardGame('ALL')}
              className={`px-2 py-1 rounded text-[9px] font-retro transition cursor-pointer ${
                selectedLeaderboardGame === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              ALL
            </button>
            {ARCADE_GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedLeaderboardGame(g.id)}
                className={`px-2 py-1 rounded text-[9px] font-retro transition cursor-pointer ${
                  selectedLeaderboardGame === g.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {g.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Entries List */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-850">
            {leaderboardEntries.map((entry) => {
              const gameObj = ARCADE_GAMES.find((g) => g.id === entry.gameId);
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 transition ${
                    entry.isCurrentPlayer
                      ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/40'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Left: Rank + Avatar + Name + Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankVisual(entry.rank)}

                    <PixelAvatarView
                      avatar={entry.playerAvatar}
                      size="sm"
                      glow={entry.isCurrentPlayer}
                      className={entry.isCurrentPlayer ? 'ring-1 ring-cyan-400' : ''}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-retro text-xs truncate ${
                            entry.isCurrentPlayer ? 'text-cyan-300 font-bold' : 'text-slate-200'
                          }`}
                        >
                          {entry.playerName}
                        </span>
                        {entry.isCurrentPlayer && (
                          <span className="px-1.5 py-0.2 text-[8px] font-retro rounded bg-cyan-500 text-slate-950 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        {entry.playerTitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Game Tag + Score */}
                  <div className="flex items-center gap-3 text-right">
                    <span
                      className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-retro border"
                      style={{
                        borderColor: `${gameObj?.accentColor || '#64748b'}55`,
                        backgroundColor: `${gameObj?.accentColor || '#64748b'}15`,
                        color: gameObj?.accentColor || '#64748b',
                      }}
                    >
                      {gameObj?.title || entry.gameId}
                    </span>

                    <div className="font-retro text-sm text-amber-300 font-bold whitespace-nowrap tabular-nums">
                      {entry.score.toLocaleString()}{' '}
                      <span className="text-[9px] text-amber-500 font-mono">PTS</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of high scores per game */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ARCADE_GAMES.map((game) => {
          const score = highScores[game.id] || 0;
          return (
            <div
              key={game.id}
              className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 flex flex-col justify-between"
            >
              <div className="text-[9px] font-retro text-slate-400 truncate mb-1">
                {game.title}
              </div>
              <div
                className="text-sm font-retro font-bold tracking-wider tabular-nums"
                style={{
                  color: game.accentColor,
                  textShadow: `0 0 10px ${game.accentColor}55`,
                }}
              >
                {score.toLocaleString()}
              </div>
              <div className="text-[8px] font-mono text-slate-500 mt-1">YOUR BEST</div>
            </div>
          );
        })}
      </div>

      {/* Recent plays table */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-retro text-slate-400 mb-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>RECENT ARCADE SESSIONS</span>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg">
            No game sessions logged yet. Select any game above and insert coin to play!
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {history.slice(0, 10).map((rec) => {
              const game = ARCADE_GAMES.find((g) => g.id === rec.gameId);
              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-slate-800/60 rounded text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rec.playerAvatar ? (
                      <PixelAvatarView avatar={rec.playerAvatar} size="xs" showBorder={false} />
                    ) : (
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-retro text-[10px] text-white truncate">
                      {game?.title || rec.gameId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-retro hidden sm:inline truncate">
                      by {rec.playerName || 'PLAYER'}
                    </span>
                    <span className="text-[9px] text-slate-500">[{rec.date}]</span>
                  </div>
                  <div className="font-retro text-xs text-amber-300 font-bold whitespace-nowrap tabular-nums">
                    {rec.score.toLocaleString()} PTS
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Career Achievements and Milestone Badges */}
      <AchievementBadges highScores={highScores} history={history} />
    </div>
  );
};
