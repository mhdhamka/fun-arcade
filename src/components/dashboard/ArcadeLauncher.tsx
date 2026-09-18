import React, { useState, useId, useMemo } from 'react';
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
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Carousel scroll reference container
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const genres = ['ALL', ...Array.from(new Set(ARCADE_GAMES.map((g) => g.genre)))];

  const filteredGames = useMemo(() => {
    return ARCADE_GAMES.filter((game) => {
      const matchesGenre = activeFilter === 'ALL' || game.genre === activeFilter;
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGenre && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const totalScorePoints = (Object.values(highScores) as number[]).reduce(
    (acc: number, v: number) => acc + (typeof v === 'number' ? v : 0),
    0
  );

  const filterPrefix = useId();

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-300">
      
      {/* Top Weekly Spotlight Featured Game Banner */}
      <FeaturedGameBanner
        games={ARCADE_GAMES}
        highScores={highScores}
        onLaunch={onLaunchGame}
        onShowDetails={setSelectedGameForModal}
      />

      {/* Modernized Arcade Marquee Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border-2 border-slate-800/80 p-6 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 font-retro text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>INSERT COIN // PLAY RETRO CLASSICS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-retro text-white tracking-wider leading-tight">
              ARCADE<span className="text-cyan-400 glow-cyan">JS</span> CABINET
            </h1>

            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Experience handcrafted pixel-accurate reproductions of timeless mini-games. Built with
              HTML5 Canvas, procedural 8-bit Web Audio synthesis, and zero external asset dependencies.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>{ARCADE_GAMES.length} CLASSIC CORES</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-bold">
                  {totalScorePoints.toLocaleString()} TOTAL HIGH PTS
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>60 FPS SMOOTH</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-5 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl shrink-0 w-full sm:w-auto">
            <div className="w-40 h-28 bg-slate-900 border border-cyan-500/40 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 crt-overlay opacity-50 pointer-events-none" />
              <Gamepad2 className="w-8 h-8 text-cyan-400 mb-1.5 animate-bounce" />
              <span className="text-[10px] font-retro text-cyan-300 glow-cyan tracking-widest">READY 2 PLAY</span>
            </div>
            
            <div className="flex items-center gap-2 mt-3 w-full">
              {onOpenCabinetCustomizer && (
                <button
                  id="btn-launcher-open-customizer"
                  type="button"
                  onClick={onOpenCabinetCustomizer}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-600/60 text-purple-200 hover:text-white rounded-xl text-[9px] font-retro transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>CABINET</span>
                </button>
              )}
              {onOpenSettings && (
                <button
                  id="btn-launcher-open-settings"
                  type="button"
                  onClick={onOpenSettings}
                  className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/70 text-slate-300 hover:text-amber-300 rounded-xl text-[9px] font-retro transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3 h-3 text-amber-400" />
                  <span>SETTINGS</span>
                </button>
              )}
            </div>
            <div className="text-[9px] font-retro text-slate-500 mt-2 tracking-wider">CREDIT: 🅲 01 / 99</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Instant Search Control Bar */}
      <div className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-retro text-white tracking-wide flex items-center gap-2">
              <span>SELECT YOUR CARTRIDGE</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                {filteredGames.length} available
              </span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              BROWSE CORES OR FILTER BY GENRE & KEYWORD
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Real-time Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search games or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Carousel Navigation Buttons */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => scrollCarousel('left')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 rounded-xl transition cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 rounded-xl transition cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-1 hidden sm:inline" />
          {genres.map((g) => (
            <button
              key={g}
              id={`filter-${filterPrefix}-${g.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => setActiveFilter(g)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-retro transition whitespace-nowrap cursor-pointer ${
                activeFilter === g
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)] font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Game Cards Carousel View or Empty State */}
      {filteredGames.length > 0 ? (
        <div className="relative group">
          {/* Mobile/Edge Carousel Scroll Buttons */}
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-xl opacity-80 hover:opacity-100 hover:scale-110 transition cursor-pointer hidden sm:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-xl opacity-80 hover:opacity-100 hover:scale-110 transition cursor-pointer hidden sm:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel Track Container (Scrollbar completely hidden) */}
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filteredGames.map((game) => (
              <div key={game.id} className="w-[300px] sm:w-[320px] shrink-0 snap-start">
                <GameCard
                  game={game}
                  highScore={highScores[game.id] || 0}
                  onLaunch={onLaunchGame}
                  onShowDetails={setSelectedGameForModal}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <div className="font-retro text-sm text-slate-300">NO CARTRIDGES FOUND</div>
          <p className="text-xs font-mono text-slate-500 max-w-xs">
            No games match your current search query "{searchQuery}" under genre "{activeFilter}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('ALL');
            }}
            className="mt-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 rounded-xl text-xs font-retro transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET FILTERS</span>
          </button>
        </div>
      )}

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
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-retro text-[10px] mb-1">LOCAL PERSISTENCE</div>
            <span>High scores & theme preferences are saved securely in browser local storage.</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-start gap-3 shadow-sm">
          <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-retro text-[10px] mb-1">CHIPTUNE SYNTH</div>
            <span>Native Web Audio API procedural synthesis with zero external MP3s.</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-start gap-3 shadow-sm">
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