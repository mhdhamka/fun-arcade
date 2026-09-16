import React, { useState, useEffect, useCallback } from 'react';
import { GameModule, GameId } from '../../types/arcade';
import { soundManager } from '../../services/audio';
import {
  Trophy,
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Target,
  Flame,
  Clock,
  Gamepad2,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface FeaturedGameBannerProps {
  games: GameModule[];
  highScores: Record<GameId, number>;
  onLaunch: (game: GameModule) => void;
  onShowDetails: (game: GameModule) => void;
}

interface WeeklyHighlightData {
  weeklyChallenge: string;
  targetScore: number;
  perk: string;
  heroTag: string;
  badgeColor: string;
}

const WEEKLY_HIGHLIGHTS: Record<GameId, WeeklyHighlightData> = {
  snake: {
    weeklyChallenge: 'Gobble 5 golden star bonuses in a single session without crashing',
    targetScore: 250,
    perk: 'Star Spawn Rate +25% Active',
    heroTag: 'SERPENT MASTERY',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60',
  },
  flappy: {
    weeklyChallenge: 'Defy gravity through 15 consecutive neon pipe corridors',
    targetScore: 15,
    perk: 'Precision Kinetic Flap Physics',
    heroTag: 'GRAVITY RUNNER',
    badgeColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/60',
  },
  tetris: {
    weeklyChallenge: 'Perform a clean 4-line TETRIS clear with escalating drop tempo',
    targetScore: 2000,
    perk: 'Ghost Projection Matrix Engaged',
    heroTag: 'GEOMETRIC MATRIX',
    badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60',
  },
  invaders: {
    weeklyChallenge: 'Intercept the high-altitude Red Mystery UFO for maximum bonus',
    targetScore: 1500,
    perk: 'Mothership Frequency Multiplier',
    heroTag: 'EARTH DEFENDER',
    badgeColor: 'text-sky-400 border-sky-500/40 bg-sky-950/60',
  },
  mario: {
    weeklyChallenge: 'Collect 30 shiny coins and reach the castle flagpole unscathed',
    targetScore: 2500,
    perk: 'Super Mushroom Power Surge Active',
    heroTag: 'MUSHROOM CHAMPION',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/60',
  },
  angrybirds: {
    weeklyChallenge: 'Detonate a TNT crate to trigger a multi-pig chain explosion',
    targetScore: 15000,
    perk: 'High-Velocity Rubber Sling Tension',
    heroTag: 'SLINGSHOT SNIPER',
    badgeColor: 'text-orange-400 border-orange-500/40 bg-orange-950/60',
  },
};

function getWeekOfYear(): { weekNumber: number; daysRemaining: number } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.max(1, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7));
  const dayOfWeek = now.getDay();
  const daysRemaining = dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1;
  return { weekNumber, daysRemaining };
}

export const FeaturedGameBanner: React.FC<FeaturedGameBannerProps> = ({
  games,
  highScores,
  onLaunch,
  onShowDetails,
}) => {
  const { weekNumber, daysRemaining } = getWeekOfYear();

  // Pick default game based on current week of the year
  const initialIndex = games.length > 0 ? (weekNumber - 1) % games.length : 0;
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [rotationProgress, setRotationProgress] = useState<number>(0);

  const currentGame = games[currentIndex] || games[0];
  const highlight = currentGame ? WEEKLY_HIGHLIGHTS[currentGame.id] : null;
  const userHighScore = currentGame ? highScores[currentGame.id] || 0 : 0;
  const targetScore = highlight ? highlight.targetScore : 1000;
  const targetAchieved = userHighScore >= targetScore;

  const handleNext = useCallback(() => {
    soundManager.play('select');
    setCurrentIndex((prev) => (prev + 1) % games.length);
    setRotationProgress(0);
  }, [games.length]);

  const handlePrev = useCallback(() => {
    soundManager.play('select');
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
    setRotationProgress(0);
  }, [games.length]);

  const handleSelectGame = (index: number) => {
    soundManager.play('select');
    setCurrentIndex(index);
    setRotationProgress(0);
  };

  // Auto rotation timer with progress update every 100ms
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = 70; // Update progress smoothly
    const totalDuration = 7000; // 7 seconds per slide
    const increment = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setRotationProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % games.length);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoRotating, games.length]);

  if (!currentGame) return null;

  return (
    <section
      aria-label="Featured Game of the Week"
      className="relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300"
      style={{
        boxShadow: `0 0 45px -10px ${currentGame.accentColor}33`,
        borderColor: `${currentGame.accentColor}44`,
      }}
      onMouseEnter={() => setIsAutoRotating(false)}
      onMouseLeave={() => setIsAutoRotating(true)}
    >
      {/* Dynamic Background Neon Blobs */}
      <div
        className="absolute -top-24 -left-20 w-80 h-80 opacity-20 blur-3xl pointer-events-none rounded-full transition-all duration-500"
        style={{ backgroundColor: currentGame.accentColor }}
      />
      <div
        className="absolute -bottom-24 -right-20 w-80 h-80 opacity-15 blur-3xl pointer-events-none rounded-full transition-all duration-500"
        style={{ backgroundColor: currentGame.accentColor }}
      />

      {/* Top Banner Ticker / Status Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-slate-800/90 bg-slate-950/70 px-4 sm:px-6 py-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: currentGame.accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: currentGame.accentColor }}
            />
          </span>
          <div className="flex items-center gap-1.5 font-retro text-[10px] text-white tracking-wider">
            <span>FEATURED SPOTLIGHT // WEEK #{weekNumber}</span>
          </div>
          <span className="hidden md:inline text-slate-500 font-mono text-[11px]">|</span>
          <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{daysRemaining} DAYS REMAINING</span>
          </span>
        </div>

        {/* Carousel manual navigation & auto-rotation controls */}
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          {/* Game indicator pills */}
          <div className="flex items-center gap-1.5">
            {games.map((g, idx) => (
              <button
                key={g.id}
                id={`btn-feat-dot-${g.id}`}
                type="button"
                onClick={() => handleSelectGame(idx)}
                title={`Feature: ${g.title}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              id="btn-feat-prev"
              type="button"
              onClick={handlePrev}
              title="Previous Featured Game"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-feat-toggle-auto"
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              title={isAutoRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
            </button>
            <button
              id="btn-feat-next"
              type="button"
              onClick={handleNext}
              title="Next Featured Game"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature Content Card */}
      <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Side: Game Intel & Highlights */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          {/* Tag Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span
              className={`text-[9px] font-retro px-2.5 py-1 rounded-md border uppercase font-bold tracking-wider ${
                highlight?.badgeColor || 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40'
              }`}
            >
              {highlight?.heroTag || currentGame.genre}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              CLASSIC ERA {currentGame.year}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
              <span>{highlight?.perk}</span>
            </span>
          </div>

          {/* Title with glow */}
          <div>
            <h2
              className="text-2xl sm:text-4xl font-retro text-white tracking-wide"
              style={{
                textShadow: `0 0 16px ${currentGame.accentColor}55`,
              }}
            >
              {currentGame.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 max-w-xl leading-relaxed">
              {currentGame.description}
            </p>
          </div>

          {/* Weekly Challenge & Target Box */}
          {highlight && (
            <div className="p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 max-w-xl space-y-2 text-left">
              <div className="flex items-center justify-between font-retro text-[10px]">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WEEKLY MISSION:</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  TARGET: <strong className="text-amber-400">{targetScore.toLocaleString()} PTS</strong>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                {highlight.weeklyChallenge}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>YOUR BEST: <strong className="text-white">{userHighScore.toLocaleString()} PTS</strong></span>
                </span>
                {targetAchieved ? (
                  <span className="text-emerald-400 font-retro text-[9px] flex items-center gap-1">
                    ✓ MISSION ACCOMPLISHED!
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-[10px]">
                    {(targetScore - userHighScore).toLocaleString()} PTS TO BEAT TARGET
                  </span>
                )}
              </div>
            </div>
          )}

          {/* High-Impact Calls to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              id={`btn-featured-play-${currentGame.id}`}
              type="button"
              onClick={() => onLaunch(currentGame)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-retro text-xs text-slate-950 font-bold tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 shadow-lg active:scale-95 group"
              style={{
                backgroundColor: currentGame.accentColor,
                boxShadow: `0 0 25px ${currentGame.accentColor}66`,
              }}
            >
              <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
              <span>PLAY NOW // INSERT COIN</span>
            </button>

            <button
              id={`btn-featured-intel-${currentGame.id}`}
              type="button"
              onClick={() => onShowDetails(currentGame)}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl font-retro text-xs text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span>INTEL & CONTROLS</span>
            </button>
          </div>
        </div>

        {/* Right Side: Visual Arcade Mockup Preview */}
        <div className="w-full max-w-xs lg:w-72 shrink-0">
          <div
            className="relative rounded-2xl bg-slate-950 border-2 p-4 flex flex-col items-center justify-center overflow-hidden shadow-2xl"
            style={{ borderColor: `${currentGame.accentColor}66` }}
          >
            {/* Scanline overlay inside mini cabinet */}
            <div className="absolute inset-0 crt-overlay opacity-40 pointer-events-none" />

            {/* Top marquee pill */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[9px] font-retro text-slate-400">
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-cyan-400" />
                <span>CHALLENGE CAB</span>
              </span>
              <span className="text-emerald-400 animate-pulse">LIVE</span>
            </div>

            {/* Game-Specific Mini Graphics Stage & Live Video */}
            <div className="w-full h-36 rounded-lg bg-slate-900/90 border border-slate-800 relative flex items-center justify-center overflow-hidden group/minivid">
              {(currentGame.previewWebmUrl || currentGame.previewVideoUrl) ? (
                <video
                  key={currentGame.id}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  {currentGame.previewWebmUrl && (
                    <source src={currentGame.previewWebmUrl} type="video/webm" />
                  )}
                  {currentGame.previewVideoUrl && (
                    <source src={currentGame.previewVideoUrl} type="video/mp4" />
                  )}
                </video>
              ) : currentGame.posterUrl ? (
                <img
                  src={currentGame.posterUrl}
                  alt={currentGame.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : null}

              {/* CRT overlay */}
              <div className="absolute inset-0 crt-overlay opacity-50 pointer-events-none" />

              {/* Overlay HUD text */}
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] font-retro text-white/90 drop-shadow pointer-events-none">
                <span className="text-cyan-300">DEMO FEED</span>
                <span className="text-emerald-400">60 FPS</span>
              </div>
            </div>

            {/* Bottom Quick Launch Button inside mini cabinet */}
            <button
              id={`btn-mini-launch-${currentGame.id}`}
              type="button"
              onClick={() => onLaunch(currentGame)}
              className="mt-3 w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 rounded font-retro text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>FAST BOOT // 25¢</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide Progress Indicator Bar */}
      {isAutoRotating && (
        <div className="w-full bg-slate-900/90 h-1 overflow-hidden">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${rotationProgress}%`,
              backgroundColor: currentGame.accentColor,
            }}
          />
        </div>
      )}
    </section>
  );
};
