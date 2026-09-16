import React, { useState, useId } from 'react';
import { GameModule, GameId, ScoreRecord, PlayerProfile } from '../../types/arcade';
import { ARCADE_GAMES } from '../../games/registry';
import { FeaturedGameBanner } from './FeaturedGameBanner';
import { GameCard } from './GameCard';
import { HallOfFame } from './HallOfFame';
import { GameDetailsModal } from './GameDetailsModal';
import {
  Gamepad2,
  Sparkles,
  Zap,
  ShieldCheck,
  Flame,
  Settings,
} from 'lucide-react';

interface ArcadeLauncherProps {
  highScores: Record<GameId, number>;
  history: ScoreRecord[];
  onLaunchGame: (game: GameModule) => void;
  onClearHistory: () => void;
  profile?: PlayerProfile;
  onOpenProfileModal?: () => void;
  onOpenCabinetCustomizer?: () => void;
  onOpenSettings?: () => void;
}

export const ArcadeLauncher: React.FC<ArcadeLauncherProps> = ({
  highScores,
  history,
  onLaunchGame,
  onClearHistory,
  profile,
  onOpenProfileModal,
  onOpenCabinetCustomizer,
  onOpenSettings,
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameModule | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const genres = ['ALL', ...Array.from(new Set(ARCADE_GAMES.map((g) => g.genre)))];

  const filteredGames = activeFilter === 'ALL'
    ? ARCADE_GAMES
    : ARCADE_GAMES.filter((g) => g.genre === activeFilter);

  const totalScorePoints = (Object.values(highScores) as number[]).reduce(
    (acc: number, v: number) => acc + (typeof v === 'number' ? v : 0),
    0
  );

  const filterPrefix = useId();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Top Weekly Spotlight Featured Game Banner */}
      <FeaturedGameBanner
        games={ARCADE_GAMES}
        highScores={highScores}
        onLaunch={onLaunchGame}
        onShowDetails={setSelectedGameForModal}
      />

      {/* Arcade Marquee Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-slate-800 p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Neon accent backlights */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-pink-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 font-retro text-[10px]">
              <Sparkles className="w-3 h-3" />
              <span>INSERT COIN // PLAY RETRO CLASSICS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-retro text-white tracking-wider">
              ARCADE<span className="text-cyan-400">JS</span> CABINET
            </h1>

            <p className="text-sm text-slate-300 font-sans max-w-xl leading-relaxed">
              Experience handcrafted pixel-accurate reproductions of timeless mini-games. Built with
              HTML5 Canvas, procedural 8-bit Web Audio synthesis, and zero external asset dependencies.
            </p>

            {/* Quick Stat Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>4 CLASSIC CORES</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-bold">
                  {totalScorePoints.toLocaleString()} TOTAL HIGH PTS
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>60 FPS SMOOTH</span>
              </div>
            </div>
          </div>

          {/* Retro Cabinet Graphic Accent & Customizer Trigger */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-slate-950/80 border-2 border-slate-800 rounded-2xl shadow-inner shrink-0">
            <div className="w-36 h-24 bg-slate-900 border border-cyan-500/40 rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 crt-overlay opacity-60" />
              <Gamepad2 className="w-7 h-7 text-cyan-400 mb-1 animate-bounce" />
              <span className="text-[10px] font-retro text-cyan-300 glow-cyan">READY</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
              {onOpenCabinetCustomizer && (
                <button
                  id="btn-launcher-open-customizer"
                  type="button"
                  onClick={onOpenCabinetCustomizer}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-600/60 text-purple-300 hover:text-white rounded-lg text-[9px] font-retro transition shadow cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>CUSTOMIZE</span>
                </button>
              )}
              {onOpenSettings && (
                <button
                  id="btn-launcher-open-settings"
                  type="button"
                  onClick={onOpenSettings}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/70 text-slate-300 hover:text-amber-300 rounded-lg text-[9px] font-retro transition shadow cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3 h-3 text-amber-400" />
                  <span>SETTINGS</span>
                </button>
              )}
            </div>
            <div className="text-[9px] font-retro text-slate-500 mt-1">COIN SLOT: 25¢</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-retro text-white tracking-wide">SELECT YOUR GAME</h2>
          <span className="text-xs font-mono text-slate-400">
            CHOOSE A CARTRIDGE TO LOAD INTO THE CABINET
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {genres.map((g) => (
            <button
              key={g}
              id={`filter-${filterPrefix}-${g.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => setActiveFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-retro transition whitespace-nowrap cursor-pointer ${
                activeFilter === g
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            highScore={highScores[game.id] || 0}
            onLaunch={onLaunchGame}
            onShowDetails={setSelectedGameForModal}
          />
        ))}
      </div>

      {/* Hall of Fame / Leaderboards Section */}
      <section id="hall-of-fame-section" className="pt-4">
        <HallOfFame
          highScores={highScores}
          history={history}
          onClear={onClearHistory}
          profile={profile}
          onOpenProfileModal={onOpenProfileModal}
        />
      </section>

      {/* Feature Highlights Footer Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-mono text-slate-400">
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-retro text-[10px] mb-1">LOCAL PERSISTENCE</div>
            <span>High scores & theme preferences are saved securely in browser local storage.</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
          <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-retro text-[10px] mb-1">CHIPTUNE SYNTH</div>
            <span>Native Web Audio API procedural synthesis with zero external MP3s.</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
          <Gamepad2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-retro text-[10px] mb-1">PLUG & PLAY CORES</div>
            <span>Decoupled game module registry allows easily slotting in additional games.</span>
          </div>
        </div>
      </div>

      {/* Instructions / Details Modal */}
      <GameDetailsModal
        game={selectedGameForModal}
        highScore={selectedGameForModal ? highScores[selectedGameForModal.id] || 0 : 0}
        onClose={() => setSelectedGameForModal(null)}
        onLaunch={onLaunchGame}
      />
    </div>
  );
};
