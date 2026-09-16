import React from 'react';
import { GameModule } from '../../types/arcade';
import { X, Play, Gamepad2, Award } from 'lucide-react';

interface GameDetailsModalProps {
  game: GameModule | null;
  highScore: number;
  onClose: () => void;
  onLaunch: (game: GameModule) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  highScore,
  onClose,
  onLaunch,
}) => {
  if (!game) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Accent banner */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: game.accentColor }}
        />

        {/* Close button */}
        <button
          id="btn-close-details"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-retro px-2 py-0.5 rounded border uppercase ${game.badgeBg}`}
            >
              {game.genre}
            </span>
            <span className="text-xs font-mono text-slate-500">CLASSIC // {game.year}</span>
          </div>
          <h2
            className="text-xl font-retro text-white tracking-wide"
            style={{ textShadow: `0 0 10px ${game.accentColor}44` }}
          >
            {game.title}
          </h2>
        </div>

        {/* Gameplay Video Showcase */}
        {(game.previewWebmUrl || game.previewVideoUrl) && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-4 shadow-lg">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              {game.previewWebmUrl && <source src={game.previewWebmUrl} type="video/webm" />}
              {game.previewVideoUrl && <source src={game.previewVideoUrl} type="video/mp4" />}
            </video>
            <div className="absolute inset-0 crt-overlay opacity-40 pointer-events-none" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 border border-cyan-500/40 text-[9px] font-retro text-cyan-300">
              GAMEPLAY PREVIEW // 60 FPS
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-300 font-sans leading-relaxed mb-4">
          {game.description}
        </p>

        {/* High Score Banner */}
        <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg mb-4 font-retro text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>RECORD HIGH SCORE:</span>
          </div>
          <span className="text-amber-400 font-bold tracking-wider">
            {highScore.toLocaleString()} PTS
          </span>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <h3 className="text-xs font-retro text-cyan-400 mb-2">HOW TO PLAY</h3>
          <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
            {game.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </div>

        {/* Controls mapping table */}
        <div className="mb-6">
          <h3 className="text-xs font-retro text-cyan-400 mb-2 flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>INPUT CONTROLS</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {game.controls.map((ctrl, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800/80 rounded text-xs"
              >
                <span className="text-slate-400 text-[11px]">{ctrl.action}</span>
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-retro text-[9px]">
                  {ctrl.key}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <button
          id="btn-modal-launch-game"
          type="button"
          onClick={() => {
            onClose();
            onLaunch(game);
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-retro text-xs rounded-xl border border-cyan-300/40 transition shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START GAME</span>
        </button>
      </div>
    </div>
  );
};
