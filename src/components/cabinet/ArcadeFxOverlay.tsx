import React, { useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';

export type ParticleEffectType = 'confetti' | 'stars' | 'fireworks';

export interface FxTrigger {
  id: number;
  type: ParticleEffectType;
  count?: number;
}

export interface FxBanner {
  id: number;
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  duration?: number;
}

interface ArcadeFxOverlayProps {
  fxTrigger: FxTrigger | null;
  banner: FxBanner | null;
  onBannerDismiss?: () => void;
  accentColor?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  shape: 'rect' | 'star' | 'circle';
}

const RETRO_PALETTE = [
  '#f59e0b', // Amber
  '#fbbf24', // Gold
  '#06b6d4', // Cyan
  '#ec4899', // Pink / Magenta
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ffffff', // White
];

export const ArcadeFxOverlay: React.FC<ArcadeFxOverlayProps> = ({
  fxTrigger,
  banner,
  onBannerDismiss,
  accentColor = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Helper to spawn particles based on type
  const spawnParticles = (type: ParticleEffectType, count = 60) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const newParticles: Particle[] = [];

    if (type === 'confetti') {
      // Confetti fountain from top & center
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = -10 - Math.random() * 40;
        const color = RETRO_PALETTE[Math.floor(Math.random() * RETRO_PALETTE.length)];
        newParticles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 6 + 4,
          color,
          alpha: 1,
          decay: Math.random() * 0.008 + 0.005,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          gravity: 0.08,
          shape: 'rect',
        });
      }
    } else if (type === 'stars') {
      // Radiant golden starburst from center
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        const color =
          Math.random() < 0.6
            ? '#fbbf24'
            : Math.random() < 0.8
            ? '#fef08a'
            : '#ffffff';
        newParticles.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: Math.random() * 7 + 4,
          color,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.25,
          gravity: 0.05,
          shape: 'star',
        });
      }
    } else if (type === 'fireworks') {
      // Dual fireworks explosion
      const origins = [
        { x: width * 0.3, y: height * 0.4 },
        { x: width * 0.7, y: height * 0.4 },
        { x: width * 0.5, y: height * 0.3 },
      ];

      for (let i = 0; i < count; i++) {
        const origin = origins[i % origins.length];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        const color = RETRO_PALETTE[Math.floor(Math.random() * RETRO_PALETTE.length)];
        newParticles.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          color,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.012,
          rotation: 0,
          rotationSpeed: 0,
          gravity: 0.06,
          shape: 'circle',
        });
      }
    }

    particlesRef.current.push(...newParticles);
  };

  // React to trigger prop changes
  useEffect(() => {
    if (!fxTrigger) return;
    spawnParticles(fxTrigger.type, fxTrigger.count || 70);
  }, [fxTrigger]);

  // Main particle rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const particles = particlesRef.current;

      if (particles.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.rotation += p.rotationSpeed;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > canvas.height + 20) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          if (p.shape === 'rect') {
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
          } else if (p.shape === 'star') {
            // Draw 4-point pixel star
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            const s = p.size;
            ctx.fillRect(-s / 2, -s / 6, s, s / 3);
            ctx.fillRect(-s / 6, -s / 2, s / 3, s);
            ctx.shadowBlur = 0;
          } else {
            // Glowing neon circle/spark
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Update canvas resolution on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Banner auto-dismiss timer
  useEffect(() => {
    if (!banner || !onBannerDismiss) return;
    const duration = banner.duration || 3000;
    const timer = setTimeout(() => {
      onBannerDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [banner, onBannerDismiss]);

  return (
    <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden flex flex-col items-center justify-start pt-6">
      {/* High-Performance Canvas for Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none block"
      />

      {/* Floating Retro Event Announcement Banner */}
      {banner && (
        <div
          key={banner.id}
          className="animate-banner-pop relative z-30 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.9)] bg-slate-950/95 backdrop-blur-xs max-w-xs sm:max-w-sm text-center"
          style={{
            borderColor: banner.color || accentColor,
            boxShadow: `0 0 25px ${banner.color || accentColor}88, inset 0 0 15px ${
              banner.color || accentColor
            }22`,
          }}
        >
          {/* Badge Top Header */}
          <div className="flex items-center gap-1.5 font-retro text-[9px] uppercase tracking-wider text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{banner.badge || 'ACHIEVEMENT UNLOCKED'}</span>
          </div>

          {/* Main Title */}
          <div
            className="text-sm sm:text-base font-retro font-bold text-white tracking-wide"
            style={{
              textShadow: `0 0 10px ${banner.color || accentColor}`,
            }}
          >
            {banner.title}
          </div>

          {/* Subtitle / Details */}
          {banner.subtitle && (
            <div className="text-[11px] font-mono text-slate-300">
              {banner.subtitle}
            </div>
          )}

          {/* Retro Corner Accents */}
          <div
            className="absolute top-1 left-1 w-1.5 h-1.5 rounded-xs"
            style={{ backgroundColor: banner.color || accentColor }}
          />
          <div
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-xs"
            style={{ backgroundColor: banner.color || accentColor }}
          />
          <div
            className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-xs"
            style={{ backgroundColor: banner.color || accentColor }}
          />
          <div
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-xs"
            style={{ backgroundColor: banner.color || accentColor }}
          />
        </div>
      )}
    </div>
  );
};
