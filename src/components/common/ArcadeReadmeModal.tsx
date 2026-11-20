import React, { useState, useEffect } from 'react';
import { GameModule, GameId } from '../../types/arcade';
import { ARCADE_GAMES } from '../../games/registry';
import { soundManager } from '../../services/audio';
import {
  X,
  BookOpen,
  Gamepad2,
  Volume2,
  Sparkles,
  Play,
  Keyboard,
  Trophy,
  Sliders,
} from 'lucide-react';

interface ArcadeReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  highScores: Record<GameId, number>;
  onLaunchGame: (game: GameModule) => void;
}

type ManualTab = 'overview' | 'cartridges' | 'controls' | 'secrets';

const TEST_SOUNDS = [
  { id: 'coin', label: 'INSERT COIN', color: 'border-amber-500/50 text-amber-300' },
  { id: 'start', label: 'START GAME', color: 'border-emerald-500/50 text-emerald-300' },
  { id: 'laser', label: 'LASER PEW', color: 'border-cyan-500/50 text-cyan-300' },
  { id: 'jump', label: '8-BIT JUMP', color: 'border-sky-500/50 text-sky-300' },
  { id: 'hit', label: 'EXPLOSION', color: 'border-rose-500/50 text-rose-300' },
  { id: 'fanfare', label: 'WIN FANFARE', color: 'border-purple-500/50 text-purple-300' },
] as const;

export const ArcadeReadmeModal: React.FC<ArcadeReadmeModalProps> = ({
  isOpen,
  onClose,
  highScores,
  onLaunchGame,
}) => {
  const [activeTab, setActiveTab] = useState<ManualTab>('overview');
  const [selectedCartId, setSelectedCartId] = useState<GameId>(ARCADE_GAMES[0].id);
  const [coinInserts, setCoinInserts] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedGame = ARCADE_GAMES.find((g) => g.id === selectedCartId) || ARCADE_GAMES[0];
  const totalPoints = (Object.values(highScores) as number[]).reduce((acc, v) => acc + (v || 0), 0);

  const handleTabClick = (tab: ManualTab) => {
    soundManager.play('select');
    setActiveTab(tab);
  };

  const handleInsertCoin = () => {
    soundManager.play('coin');
    setCoinInserts((c) => (c >= 99 ? 1 : c + 1));
  };

  return (
    <div
      id="arcade-readme-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Fun Arcade Operator Manual"
    >
      <div className="w-full max-w-4xl h-[90vh] max-h-[780px] bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-100">
        {/* Top Retro Manual Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-500/60 rounded-lg text-cyan-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-retro text-cyan-300 tracking-wider">
                FUN ARCADE · OPERATOR MANUAL
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                Interactive README, Cartridge Specs & Control Guide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertCoin}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 font-retro text-[10px] transition cursor-pointer whitespace-nowrap tabular-nums"
              title="Test Coin Chime"
            >
              COIN {String(coinInserts).padStart(2, '0')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close Manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 overflow-x-auto shrink-0">
          {(
            [
              { id: 'overview', label: '01 · WELCOME', icon: Sparkles },
              { id: 'cartridges', label: `02 · CARTRIDGES (${ARCADE_GAMES.length})`, icon: Gamepad2 },
              { id: 'controls', label: '03 · HARDWARE & SFX', icon: Volume2 },
              { id: 'secrets', label: '04 · SECRETS & TIPS', icon: Trophy },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-retro transition cursor-pointer shrink-0 whitespace-nowrap ${
                  active
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Manual Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* ASCII Marquee Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-cyan-500/30 relative overflow-hidden">
                <div className="absolute inset-0 crt-overlay opacity-35 pointer-events-none" />
                <pre className="text-[9px] sm:text-[11px] leading-tight font-mono text-cyan-400 overflow-x-auto relative z-10">
{`  ______ _   _ _   _      ___  ____   ____    _    ____  _____ 
 |  ____| | | | \\ | |    / _ \\|  _ \\ / ___|  / \\  |  _ \\| ____|
 | |__  | | | |  \\| |   | | | | |_) | |     / _ \\ | | | |  _|  
 |  __| | |_| | |\\  |   | |_| |  _ <| |___ / ___ \\| |_| | |___ 
 |_|     \\___/|_| \\_|    \\___/|_| \\_\\\\____/_/   \\_\\____/|_____|`}
                </pre>
                <p className="text-xs sm:text-sm text-slate-300 font-sans mt-3 leading-relaxed relative z-10">
                  Welcome to <strong className="text-white">Fun Arcade</strong> — a modular retro gaming
                  hub built with 60 FPS HTML5 Canvas engines, zero external audio MP3s (100% Web Audio
                  8-bit synthesis), customizable arcade cabinets, and local Hall of Fame leaderboards.
                </p>
              </div>

              {/* Quick Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[9px] font-retro text-slate-400">PLAYABLE CORES</div>
                  <div className="text-lg font-retro text-cyan-300 mt-1 tabular-nums">
                    {ARCADE_GAMES.length}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[9px] font-retro text-slate-400">CABINET SHELLS</div>
                  <div className="text-lg font-retro text-purple-300 mt-1 tabular-nums">7</div>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[9px] font-retro text-slate-400">CAREER SCORE</div>
                  <div className="text-lg font-retro text-amber-300 mt-1 tabular-nums">
                    {totalPoints.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[9px] font-retro text-slate-400">CREDITS</div>
                  <div className="text-lg font-retro text-emerald-300 mt-1 tabular-nums">
                    {String(coinInserts).padStart(2, '0')} / 99
                  </div>
                </div>
              </div>

              {/* Quick Launch Featured Cards */}
              <div>
                <div className="text-xs font-retro text-amber-300 mb-3">
                  QUICK BOOT · NEWEST CARTRIDGES
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ARCADE_GAMES.slice(-3).map((game) => (
                    <div
                      key={game.id}
                      className="p-3.5 bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 rounded-xl flex flex-col justify-between gap-3 transition"
                    >
                      <div>
                        <span className="text-[9px] font-retro text-slate-400 uppercase">
                          {game.genre}
                        </span>
                        <h4
                          className="text-xs font-retro text-white mt-1"
                          style={{ color: game.accentColor }}
                        >
                          {game.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                          {game.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLaunchGame(game)}
                        className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-retro text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>BOOT NOW</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cartridges' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Cartridge List */}
              <div className="md:col-span-5 space-y-1.5">
                {ARCADE_GAMES.map((game, idx) => {
                  const isSel = game.id === selectedGame.id;
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        soundManager.play('select');
                        setSelectedCartId(game.id);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSel
                          ? 'bg-slate-800 border-cyan-400 shadow'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-slate-500">
                          SLOT {String(idx + 1).padStart(2, '0')} · {game.genre}
                        </div>
                        <div className="text-xs font-retro text-white truncate">{game.title}</div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-300 tabular-nums shrink-0">
                        {(highScores[game.id] || 0).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Cartridge Spec Sheet */}
              <div className="md:col-span-7 p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  {selectedGame.posterUrl && (
                    <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black">
                      <img
                        src={selectedGame.posterUrl}
                        alt={selectedGame.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="text-base font-retro"
                      style={{ color: selectedGame.accentColor }}
                    >
                      {selectedGame.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      EST. {selectedGame.year}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {selectedGame.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-retro text-cyan-300">MISSION BRIEFING:</div>
                    <ul className="space-y-1 text-xs font-sans text-slate-300">
                      {selectedGame.instructions.map((line, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-mono">{i + 1}.</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    {selectedGame.controls.map((c, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono"
                      >
                        <span className="text-cyan-300 font-bold">{c.key}</span>
                        <span className="text-slate-400 truncate">{c.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchGame(selectedGame)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-retro text-xs rounded-lg transition shadow cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>BOOT {selectedGame.title}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-5">
              {/* Keyboard & Virtual Controller Map */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-retro text-amber-300">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <span>UNIVERSAL ARCADE DECK MAPPING</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">D-PAD / MOVE:</span>
                    <span className="text-cyan-300 font-bold">ARROW KEYS / W A S D</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">ACTION A (PRIMARY):</span>
                    <span className="text-rose-400 font-bold">SPACEBAR / Z / ENTER</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">ACTION B (SPECIAL):</span>
                    <span className="text-amber-300 font-bold">SHIFT / X / C</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">PAUSE / AUTO-PAUSE:</span>
                    <span className="text-emerald-300 font-bold">P / ESC / TAB BLUR</span>
                  </div>
                </div>
              </div>

              {/* Interactive 8-Bit Soundboard */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-retro text-cyan-300">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>INTERACTIVE 8-BIT SOUNDBOARD (CLICK TO TEST)</span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  All arcade audio is generated procedurally in real time using Web Audio oscillators
                  and routed through your Master Output Gain slider in Settings.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TEST_SOUNDS.map((sfx) => (
                    <button
                      key={sfx.id}
                      type="button"
                      onClick={() => soundManager.play(sfx.id)}
                      className={`py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border rounded-lg font-retro text-[10px] transition cursor-pointer active:scale-95 whitespace-nowrap ${sfx.color}`}
                    >
                      ▶ {sfx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-retro text-purple-300">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>PRO TIPS & CABINET SHORTCUTS</span>
                </div>
                <ul className="space-y-2 text-xs font-sans text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-amber-300">Regular Show 3-in-1 Hotkeys:</strong> Press{' '}
                    <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">1</code>,{' '}
                    <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">2</code>, or{' '}
                    <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">3</code> to
                    jump directly into <em>Put the Hurt on Him</em>, <em>Escape from the Moon</em>,
                    or <em>Destroy the Destroyer</em>, and press{' '}
                    <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">M</code> to
                    return to the 3-panel SELECT GAME menu.
                  </li>
                  <li>
                    <strong className="text-cyan-300">Fast-Forward Boot ROM:</strong> Click anywhere
                    or tap <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">Space</code>{' '}
                    during the retro BIOS POST check to jump straight into gameplay.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Cabinet Stickers & T-Molding:</strong>{' '}
                    Open the Cabinet Customizer to swap between 7 retro housings (including Japanese
                    Candy Cab & Vegas Gold) and mount custom die-cut vinyl decals onto all 4 corners.
                  </li>
                  <li>
                    <strong className="text-pink-300">Astro Blaster Hyperspace:</strong> Press{' '}
                    <code className="px-1.5 py-0.5 bg-slate-900 rounded text-cyan-300">Shift / X</code>{' '}
                    to emergency-warp away from incoming UFO fire when cornered by asteroid shards.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-500">
            FUN ARCADE MANUAL · PRESS ESC OR CLOSE TO RETURN
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-xs transition cursor-pointer whitespace-nowrap"
          >
            CLOSE MANUAL
          </button>
        </div>
      </div>
    </div>
  );
};
