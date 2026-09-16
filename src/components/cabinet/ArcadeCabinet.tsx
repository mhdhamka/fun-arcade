import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
import {
  GameModule,
  VirtualInputState,
  SfxType,
  CabinetCustomizationState,
} from '../../types/arcade';
import { soundManager } from '../../services/audio';
import { storageService } from '../../services/storage';
import { achievementsEngine } from '../../services/achievements';
import { cabinetService } from '../../services/cabinetStyles';
import { PixelAvatarView } from '../common/PixelAvatarView';
import { CrtOverlay } from './CrtOverlay';
import { VirtualController } from './VirtualController';
import { CabinetStickerOverlay } from './CabinetStickerOverlay';
import {
  ArcadeFxOverlay,
  FxTrigger,
  FxBanner,
  ParticleEffectType,
} from './ArcadeFxOverlay';
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Gamepad2,
  Tv,
  HelpCircle,
  Trophy,
  Cpu,
  Settings,
} from 'lucide-react';
import { RetroBootScreen } from './RetroBootScreen';

interface ArcadeCabinetProps {
  game: GameModule;
  onExit: () => void;
  scanlines: boolean;
  onToggleScanlines: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  cabinetConfig?: CabinetCustomizationState;
  onOpenCabinetCustomizer?: () => void;
  onOpenSettings?: () => void;
}

export const ArcadeCabinet: React.FC<ArcadeCabinetProps> = ({
  game,
  onExit,
  scanlines,
  onToggleScanlines,
  soundEnabled,
  onToggleSound,
  cabinetConfig,
  onOpenCabinetCustomizer,
  onOpenSettings,
}) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return storageService.getHighScores()[game.id] || 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showVirtualController, setShowVirtualController] = useState(false);
  const [gameKey, setGameKey] = useState(1); // Increment to force fresh game instance on restart
  const [isBooting, setIsBooting] = useState<boolean>(true); // Hardware POST & Cartridge loading state
  const playerProfile = storageService.getPlayerProfile();

  // Screen shake & particle effects state
  const [shakeClass, setShakeClass] = useState<string>('');
  const [fxTrigger, setFxTrigger] = useState<FxTrigger | null>(null);
  const [fxBanner, setFxBanner] = useState<FxBanner | null>(null);
  const highestBrokenInSessionRef = useRef<boolean>(false);
  const shakeTimerRef = useRef<number | null>(null);

  // Active cabinet physical art style and sticker configurations
  const activeCabinetConfig = cabinetConfig || cabinetService.getCabinetCustomization();
  const styleConfig = cabinetService.getStyleConfig(activeCabinetConfig.styleId);

  // Auto-detect touch device on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setShowVirtualController(true);
    }
  }, []);

  const [virtualInput, setVirtualInput] = useState<VirtualInputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    actionA: false,
    actionB: false,
    timestamp: 0,
  });

  const playSfx = useCallback(
    (type: SfxType) => {
      soundManager.play(type);
    },
    []
  );

  // Screen shake trigger with auto-cleanup
  const triggerScreenShake = useCallback((intensity: 'subtle' | 'intense' = 'intense') => {
    const cls = intensity === 'intense' ? 'screen-shake-intense' : 'screen-shake-subtle';
    setShakeClass('');
    if (shakeTimerRef.current) {
      window.clearTimeout(shakeTimerRef.current);
    }
    requestAnimationFrame(() => {
      setShakeClass(cls);
      shakeTimerRef.current = window.setTimeout(() => {
        setShakeClass('');
      }, intensity === 'intense' ? 580 : 380);
    });
  }, []);

  // Particle burst trigger
  const triggerParticles = useCallback(
    (type: ParticleEffectType = 'stars', count = 75) => {
      setFxTrigger({
        id: Date.now() + Math.random(),
        type,
        count,
      });
    },
    []
  );

  // Floating banner announcement trigger
  const triggerBanner = useCallback((bannerData: Omit<FxBanner, 'id'>) => {
    setFxBanner({
      ...bannerData,
      id: Date.now() + Math.random(),
    });
  }, []);

  // Keyboard pause listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && !isGameOver) {
        setIsPaused((prev) => {
          const next = !prev;
          playSfx('pause');
          return next;
        });
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, playSfx]);

  const handleScoreChange = useCallback(
    (newScore: number) => {
      setScore(newScore);

      // Live High Score Break Check (triggers once per game session when high score is surpassed)
      if (highScore > 0 && newScore > highScore && !highestBrokenInSessionRef.current) {
        highestBrokenInSessionRef.current = true;
        triggerScreenShake('intense');
        triggerParticles('stars', 85);
        playSfx('fanfare');
        triggerBanner({
          title: 'NEW HIGH SCORE!',
          subtitle: `${newScore.toLocaleString()} PTS - RECORD SHATTERED!`,
          badge: 'NEW RECORD UNLOCKED',
          color: '#fbbf24',
          duration: 3500,
        });
      }

      // Check live score milestones (e.g. 100-Point Club, 1,000-Point Legend)
      if (newScore >= 100) {
        achievementsEngine.checkMilestones({
          gameId: game.id,
          sessionScore: newScore,
          highScores: storageService.getHighScores(),
          history: storageService.getHistory(),
        });
      }
    },
    [game.id, highScore, playSfx, triggerBanner, triggerParticles, triggerScreenShake]
  );

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setIsGameOver(true);
      const res = storageService.saveScore(game.id, finalScore);
      setIsNewHigh(res.isNewHigh);
      setHighScore(res.highScore);

      // Check achievements engine for milestones (e.g. Marathon Runner, Polymath, etc.)
      const currentHighs = storageService.getHighScores();
      const currentHist = storageService.getHistory();
      const newlyUnlocked = achievementsEngine.checkMilestones({
        gameId: game.id,
        sessionScore: finalScore,
        isGameCompleted: false,
        highScores: currentHighs,
        history: currentHist,
      });

      if (res.isNewHigh) {
        triggerScreenShake('intense');
        triggerParticles('confetti', 110);
        playSfx('fanfare');
        triggerBanner({
          title: 'ALL-TIME HIGH SCORE!',
          subtitle: `${finalScore.toLocaleString()} PTS - LEADERBOARD CHAMPION`,
          badge: 'HALL OF FAME',
          color: '#fbbf24',
          duration: 4000,
        });
      } else if (newlyUnlocked.length > 0) {
        triggerScreenShake('subtle');
        triggerParticles('stars', 80);
        triggerBanner({
          title: `BADGE: ${newlyUnlocked[0].title.toUpperCase()}`,
          subtitle: newlyUnlocked[0].description,
          badge: 'MILESTONE ACHIEVED',
          color: newlyUnlocked[0].accentColor,
          duration: 3800,
        });
      }
    },
    [game.id, playSfx, triggerBanner, triggerParticles, triggerScreenShake]
  );

  const handleGameCompleted = useCallback(
    (finalScore: number, message?: string) => {
      triggerScreenShake('intense');
      triggerParticles('confetti', 95);
      playSfx('fanfare');
      triggerBanner({
        title: message || 'STAGE COMPLETE!',
        subtitle: `${finalScore.toLocaleString()} PTS - OBJECTIVE WON`,
        badge: 'MISSION ACCOMPLISHED',
        color: '#10b981',
        duration: 3500,
      });

      // Check achievements engine for victory / objective milestones ('First Win', etc.)
      achievementsEngine.checkMilestones({
        gameId: game.id,
        sessionScore: finalScore,
        isGameCompleted: true,
        completionMessage: message,
        highScores: storageService.getHighScores(),
        history: storageService.getHistory(),
      });
    },
    [game.id, playSfx, triggerBanner, triggerParticles, triggerScreenShake]
  );

  const handleRestart = () => {
    highestBrokenInSessionRef.current = false;
    setShakeClass('');
    setFxTrigger(null);
    setFxBanner(null);
    playSfx('start');
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsNewHigh(false);
    setGameKey((k) => k + 1);
  };

  const handleReboot = () => {
    highestBrokenInSessionRef.current = false;
    setShakeClass('');
    setFxTrigger(null);
    setFxBanner(null);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsNewHigh(false);
    setGameKey((k) => k + 1);
    setIsBooting(true);
  };

  const handleResume = () => {
    playSfx('select');
    setIsPaused(false);
  };

  const GameComponent = game.component;

  const cabinetId = useId();

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-between bg-slate-950 text-slate-100 p-2 sm:p-4 selection:bg-cyan-500 selection:text-black">
      {/* Top Cabinet Header */}
      <header className="w-full max-w-2xl flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg shadow-lg mb-2">
        <div className="flex items-center gap-2">
          <button
            id={`btn-exit-${cabinetId}`}
            type="button"
            onClick={() => {
              playSfx('select');
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded text-xs font-retro transition cursor-pointer text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HUB</span>
          </button>

          <div className="flex flex-col">
            <h1
              className="text-xs sm:text-sm font-retro tracking-wide"
              style={{
                color: game.accentColor,
                textShadow: `0 0 10px ${game.accentColor}88`,
              }}
            >
              {game.title}
            </h1>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {game.genre} // {game.year}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id={`btn-controller-toggle-${cabinetId}`}
            type="button"
            onClick={() => setShowVirtualController((v) => !v)}
            title="Toggle On-Screen Virtual Controller"
            className={`p-1.5 border rounded text-xs transition cursor-pointer ${
              showVirtualController
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          <button
            id={`btn-scanlines-${cabinetId}`}
            type="button"
            onClick={onToggleScanlines}
            title="Toggle CRT Scanline Shader"
            className={`p-1.5 border rounded text-xs transition cursor-pointer ${
              scanlines
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            id={`btn-sound-${cabinetId}`}
            type="button"
            onClick={onToggleSound}
            title="Toggle 8-bit Audio SFX"
            className={`p-1.5 border rounded text-xs transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:text-white'
                : 'bg-rose-950/50 border-rose-800 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id={`btn-reboot-${cabinetId}`}
            type="button"
            onClick={handleReboot}
            title="Reboot Hardware (Cartridge POST Sequence)"
            className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded text-xs transition cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {onOpenCabinetCustomizer && (
            <button
              id={`btn-customizer-${cabinetId}`}
              type="button"
              onClick={onOpenCabinetCustomizer}
              title="Customize Physical Cabinet & Sticker Decals"
              className="p-1.5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border border-purple-600/70 text-purple-300 hover:text-purple-200 rounded text-xs transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.25)]"
            >
            </button>
          )}

          {onOpenSettings && (
            <button
              id={`btn-settings-${cabinetId}`}
              type="button"
              onClick={onOpenSettings}
              title="Arcade System & Cabinet Settings"
              className="p-1.5 bg-slate-800 border border-slate-700 hover:border-amber-500/70 hover:bg-slate-700 text-amber-400 rounded text-xs transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            id={`btn-help-${cabinetId}`}
            type="button"
            onClick={() => setShowHelp((h) => !h)}
            title="Game Instructions"
            className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Arcade Frame Bezel with Dynamic Physical Chassis Art */}
      <main
        className={`relative w-full max-w-2xl ${styleConfig.cabinetBgClass} border-4 ${styleConfig.outerBorderClass} rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-center my-auto transition-all duration-300 ${shakeClass}`}
        style={{
          boxShadow: activeCabinetConfig.sideTrimGlow
            ? `0 0 50px ${styleConfig.accentGlow}, 0 10px 40px rgba(0,0,0,0.9)`
            : '0 10px 40px rgba(0,0,0,0.95)',
        }}
      >
        {/* Physical Die-Cut Sticker Decal Overlays across Cabinet Bezel */}
        <CabinetStickerOverlay stickers={activeCabinetConfig.stickers} placement="top_left" />
        <CabinetStickerOverlay stickers={activeCabinetConfig.stickers} placement="top_right" />
        <CabinetStickerOverlay stickers={activeCabinetConfig.stickers} placement="bottom_left" />
        <CabinetStickerOverlay stickers={activeCabinetConfig.stickers} placement="bottom_right" />

        {/* Cabinet Marquee / Speaker Slots */}
        <div className={`w-full flex items-center justify-between px-4 py-2 mb-3 ${styleConfig.marqueeBgClass} border-2 ${styleConfig.marqueeBorderClass} rounded-lg`}>
          <div className="flex items-center gap-2">
            <PixelAvatarView avatar={playerProfile.avatar} size="xs" showBorder={false} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-retro text-amber-300 hidden sm:inline">{playerProfile.name}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[9px] font-retro text-slate-500">FREE PLAY</span>
              <span className="hidden md:inline text-[8px] font-mono px-1.5 py-0.2 bg-black/40 text-slate-300 rounded border border-white/10">
                {styleConfig.tag}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-retro text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px]">SCORE:</span>
              <span className="text-white font-bold tracking-wider">{score}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-slate-500 text-[10px]">HI:</span>
              <span className="text-amber-400 font-bold tracking-wider">{highScore}</span>
            </div>
          </div>

          <button
            id={`btn-pause-${cabinetId}`}
            type="button"
            disabled={isBooting}
            onClick={() => {
              if (isBooting) return;
              playSfx('pause');
              setIsPaused((p) => !p);
            }}
            className={`px-2 py-1 border rounded text-[10px] font-retro transition flex items-center gap-1 ${
              isBooting
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 cursor-pointer'
            }`}
          >
            {isBooting ? (
              <>
                <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>BOOTING</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="w-3 h-3" />
                <span>RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                <span>PAUSE</span>
              </>
            )}
          </button>
        </div>

        {/* CRT Screen Display Container */}
        <div className={`relative w-full flex items-center justify-center bg-black rounded-lg overflow-hidden border-2 border-slate-800/80 ${shakeClass}`}>
          <CrtOverlay enabled={scanlines} />

          {/* Retro Hardware Boot Screen Sequence */}
          {isBooting ? (
            <RetroBootScreen
              game={game}
              onComplete={() => setIsBooting(false)}
              onCancel={onExit}
              soundEnabled={soundEnabled}
            />
          ) : (
            <>
              {/* Active Game Component Instance */}
              <div className="w-full py-2 flex items-center justify-center">
                <GameComponent
                  key={gameKey}
                  onScoreChange={handleScoreChange}
                  onGameOver={handleGameOver}
                  isPaused={isPaused || isGameOver}
                  soundEnabled={soundEnabled}
                  playSfx={playSfx}
                  virtualInput={virtualInput}
                  onTriggerScreenShake={triggerScreenShake}
                  onTriggerParticles={triggerParticles}
                  onGameCompleted={handleGameCompleted}
                />
              </div>

              {/* Screen FX & Particle System Overlay */}
              <ArcadeFxOverlay
                fxTrigger={fxTrigger}
                banner={fxBanner}
                onBannerDismiss={() => setFxBanner(null)}
                accentColor={game.accentColor}
              />

              {/* Pause Modal Overlay */}
              {isPaused && !isGameOver && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-xl sm:text-2xl font-retro text-amber-400 mb-2 glow-amber animate-pulse">
                    PAUSED
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-6 max-w-xs">
                    Press [P] or click Resume to continue
                  </p>

                  <div className="flex flex-col gap-3 w-48">
                    <button
                      id={`btn-modal-resume-${cabinetId}`}
                      type="button"
                      onClick={handleResume}
                      className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-retro text-xs rounded border border-emerald-400 transition shadow-lg cursor-pointer"
                    >
                      RESUME
                    </button>
                    <button
                      id={`btn-modal-restart-${cabinetId}`}
                      type="button"
                      onClick={handleRestart}
                      className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-xs rounded border border-slate-600 transition shadow cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      RESTART
                    </button>
                    <button
                      id={`btn-modal-reboot-${cabinetId}`}
                      type="button"
                      onClick={handleReboot}
                      className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-retro text-xs rounded border border-cyan-800/60 transition shadow cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      REBOOT HARDWARE
                    </button>
                    {onOpenCabinetCustomizer && (
                      <button
                        id={`btn-modal-customizer-${cabinetId}`}
                        type="button"
                        onClick={onOpenCabinetCustomizer}
                        className="w-full py-2 px-4 bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-retro text-xs rounded border border-purple-600/70 transition shadow cursor-pointer flex items-center justify-center gap-2"
                      >
                        CABINET ART
                      </button>
                    )}
                    {onOpenSettings && (
                      <button
                        id={`btn-modal-settings-${cabinetId}`}
                        type="button"
                        onClick={onOpenSettings}
                        className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-retro text-xs rounded border border-slate-700 hover:border-amber-500/70 transition shadow cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        SETTINGS & CABINET
                      </button>
                    )}
                    <button
                      id={`btn-modal-exit-${cabinetId}`}
                      type="button"
                      onClick={onExit}
                      className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-retro text-xs rounded border border-slate-700 transition cursor-pointer"
                    >
                      EXIT TO HUB
                    </button>
                  </div>
                </div>
              )}

              {/* Game Over Modal Overlay */}
              {isGameOver && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-retro text-rose-500 mb-2 tracking-wider drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
                    GAME OVER
                  </div>

                  {isNewHigh && (
                    <div className="mb-4 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-300 font-retro text-xs animate-bounce flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      NEW HIGH SCORE!
                    </div>
                  )}

                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 mb-6 w-56 font-retro text-xs space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <PixelAvatarView avatar={playerProfile.avatar} size="xs" showBorder={false} />
                      <div className="text-left overflow-hidden">
                        <div className="text-white text-[10px] truncate">{playerProfile.name}</div>
                        <div className="text-slate-500 font-mono text-[8px] truncate">{playerProfile.title}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>FINAL:</span>
                      <span className="text-white text-sm font-bold">{score}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-2">
                      <span>BEST:</span>
                      <span className="text-amber-400 font-bold">{highScore}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-52">
                    <button
                      id={`btn-gameover-playagain-${cabinetId}`}
                      type="button"
                      onClick={handleRestart}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-retro text-xs rounded border border-emerald-400/50 transition shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      PLAY AGAIN
                    </button>
                    <button
                      id={`btn-gameover-reboot-${cabinetId}`}
                      type="button"
                      onClick={handleReboot}
                      className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-retro text-xs rounded border border-cyan-800/60 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      REBOOT HARDWARE
                    </button>
                    <button
                      id={`btn-gameover-exit-${cabinetId}`}
                      type="button"
                      onClick={onExit}
                      className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-retro text-xs rounded border border-slate-700 transition cursor-pointer"
                    >
                      MAIN MENU
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions Quick Drawer */}
        {showHelp && (
          <div className="w-full mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <div className="font-retro text-[10px] text-cyan-400 mb-2">
              HOW TO PLAY // CONTROLS
            </div>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mb-2">
              {game.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[10px]">
              {game.controls.map((ctrl, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400">
                  <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-retro text-[9px]">
                    {ctrl.key}
                  </span>
                  <span>{ctrl.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Virtual Controller */}
        {showVirtualController && (
          <div className="w-full mt-2">
            <VirtualController
              onInputChange={setVirtualInput}
              gameId={game.id}
            />
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-2xl text-center py-2 text-[10px] font-mono text-slate-500">
        ARCADEJS SHELL // EMULATION CORE v1.0 // {game.title}
      </footer>
    </div>
  );
};
