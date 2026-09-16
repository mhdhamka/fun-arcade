import React, { useState } from 'react';
import { GameModule } from '../../types/arcade';
import { Trophy, Play, Info } from 'lucide-react';
import { GameVideoPreview } from './GameVideoPreview';

interface GameCardProps {
  game: GameModule;
  highScore: number;
  onLaunch: (game: GameModule) => void;
  onShowDetails: (game: GameModule) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  highScore,
  onLaunch,
  onShowDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between bg-slate-900/90 border-2 border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden"
      style={{
        boxShadow: `0 0 0 1px ${game.accentColor}11`,
      }}
    >
      {/* Accent glow corner */}
      <div
        className="absolute top-0 right-0 w-28 h-28 opacity-10 blur-2xl pointer-events-none rounded-full"
        style={{ backgroundColor: game.accentColor }}
      />

      {/* Top Meta */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={`text-[10px] font-retro px-2 py-0.5 rounded border uppercase ${game.badgeBg}`}
          >
            {game.genre}
          </span>
          <span className="text-[10px] font-mono text-slate-500">EST. {game.year}</span>
        </div>

        {/* Title */}
        <h3
          className="text-base font-retro tracking-wide text-white mb-2.5 transition group-hover:text-cyan-300"
          style={{ textShadow: `0 0 12px ${game.accentColor}33` }}
        >
          {game.title}
        </h3>

        {/* Gameplay Video Showcase Preview on Hover */}
        <div className="mb-3">
          <GameVideoPreview
            game={game}
            isCardHovered={isHovered}
            onPlayClick={() => onLaunch(game)}
          />
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4 line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Bottom Section: High Score & Action */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3 font-retro text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD:</span>
          </div>
          <span className="text-amber-400 font-bold tracking-wider">
            {highScore.toLocaleString()} PTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`btn-launch-${game.id}`}
            type="button"
            onClick={() => onLaunch(game)}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-98 text-white font-retro text-xs rounded-lg border border-cyan-400/40 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>INSERT COIN</span>
          </button>

          <button
            id={`btn-info-${game.id}`}
            type="button"
            onClick={() => onShowDetails(game)}
            title="View Rules & Controls"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
