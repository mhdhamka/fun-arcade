import React, { useRef, useState, useEffect } from 'react';
import { GameModule } from '../../types/arcade';
import { Film, Play } from 'lucide-react';

interface GameVideoPreviewProps {
  game: GameModule;
  isCardHovered: boolean;
  onPlayClick?: () => void;
}

export const GameVideoPreview: React.FC<GameVideoPreviewProps> = ({
  game,
  isCardHovered,
  onPlayClick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Play/pause based on hover state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isCardHovered && !hasError) {
      // Play video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay policy or interrupted
            setIsPlaying(false);
          });
      }
    } else {
      // Pause and reset gently
      video.pause();
      setIsPlaying(false);
    }
  }, [isCardHovered, hasError]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setPlaybackProgress((currentTime / duration) * 100);
    }
  };

  return (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800/90 shadow-inner group/video cursor-pointer select-none"
      onClick={onPlayClick}
      title="Click to Insert Coin & Play"
    >
      {/* 1. Static Poster Image */}
      {game.posterUrl && (
        <img
          src={game.posterUrl}
          alt={`${game.title} preview`}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying ? 'opacity-0' : 'opacity-80 group-hover:opacity-40'
          }`}
        />
      )}

      {/* 2. Video Player */}
      {(game.previewWebmUrl || game.previewVideoUrl) && !hasError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setHasError(true)}
        >
          {game.previewWebmUrl && <source src={game.previewWebmUrl} type="video/webm" />}
          {game.previewVideoUrl && <source src={game.previewVideoUrl} type="video/mp4" />}
        </video>
      )}

      {/* 3. CRT Scanline effect on video */}
      <div className="absolute inset-0 crt-overlay pointer-events-none opacity-40" />

      {/* 4. Subtle Vignette Border */}
      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />

      {/* 5. Live HUD Indicator (shown on hover) */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        {isPlaying ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-red-500/40 text-[9px] font-retro text-red-400 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>REC DEMO</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-slate-700/60 text-[9px] font-retro text-slate-400 opacity-80 group-hover:opacity-100 transition">
            <Film className="w-2.5 h-2.5 text-cyan-400" />
            <span>PREVIEW</span>
          </div>
        )}
      </div>

      {/* 6. FPS / Format badge top-right */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-cyan-300">
          60 FPS
        </span>
      </div>

      {/* 7. Center Play Icon when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 backdrop-blur-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover/video:scale-110 transition duration-200">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* 8. Bottom Playback Scrub Line */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 pointer-events-none z-10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100"
            style={{ width: `${playbackProgress}%` }}
          />
        </div>
      )}

      {/* 9. Hover hint overlay */}
      <div className="absolute bottom-1.5 right-2 z-10 pointer-events-none">
        <span className="text-[8px] font-retro text-white/70 drop-shadow">
          {isPlaying ? 'PLAYING GAMEPLAY' : 'HOVER TO PREVIEW'}
        </span>
      </div>
    </div>
  );
};
