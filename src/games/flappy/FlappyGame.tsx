import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const WIDTH = 360;
const HEIGHT = 540;
const GRAVITY = 0.38;
const JUMP_FORCE = -6.8;
const PIPE_SPEED = 2.2;
const PIPE_WIDTH = 54;
const PIPE_GAP = 135;
const GROUND_HEIGHT = 50;

export const FlappyGame: React.FC<ArcadeGameProps> = ({
  onScoreChange,
  onGameOver,
  isPaused,
  playSfx,
  virtualInput,
  onTriggerScreenShake,
  onTriggerParticles,
  onGameCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);

  // Physics refs
  const birdYRef = useRef(HEIGHT / 2 - 40);
  const birdVelRef = useRef(0);
  const birdAngleRef = useRef(0);
  const flapFrameRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const groundOffsetRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const gameOverRef = useRef(false);
  const lastActionTimestampRef = useRef(0);

  const jump = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    birdVelRef.current = JUMP_FORCE;
    playSfx('jump');

    // Create small cloud puff behind bird
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: 80 - 10,
        y: birdYRef.current + 10 + (Math.random() * 8 - 4),
        vx: -Math.random() * 2 - 1,
        vy: (Math.random() - 0.5) * 2,
        color: '#e2e8f0',
        life: 0.8,
      });
    }
  }, [isPaused, playSfx]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Virtual controller listener
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastActionTimestampRef.current) return;
    lastActionTimestampRef.current = virtualInput.timestamp;

    if (virtualInput.actionA || virtualInput.up) {
      jump();
    }
  }, [virtualInput, jump]);

  // Initial pipe generator
  const spawnPipe = (startX: number) => {
    const minTop = 60;
    const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
    return {
      x: startX,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false,
    };
  };

  useEffect(() => {
    pipesRef.current = [spawnPipe(WIDTH + 60), spawnPipe(WIDTH + 60 + 200)];
    let animId: number;

    const loop = () => {
      if (gameOverRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!isPaused) {
        // Physics update
        birdVelRef.current += GRAVITY;
        birdYRef.current += birdVelRef.current;

        // Angle rotation
        birdAngleRef.current = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelRef.current * 0.08));
        flapFrameRef.current += 0.2;

        // Ground scroll
        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED) % 24;

        // Pipes update
        const pipes = pipesRef.current;
        for (let i = 0; i < pipes.length; i++) {
          const pipe = pipes[i];
          pipe.x -= PIPE_SPEED;

          // Score detection (bird is at x = 80, radius approx 14)
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 80) {
            pipe.passed = true;
            playSfx('point');
            setScore((s) => {
              const newScore = s + 1;
              onScoreChange(newScore);

              if (newScore === 10 || newScore === 25 || newScore === 50) {
                onTriggerScreenShake?.('intense');
                onTriggerParticles?.('confetti', 75);
                onGameCompleted?.(newScore, `GATE ${newScore} CONQUERED!`);
              } else if (newScore % 5 === 0) {
                onTriggerScreenShake?.('subtle');
                onTriggerParticles?.('stars', 25);
              }
              return newScore;
            });
          }
        }

        // Recycle / spawn pipes
        if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -20) {
          pipes.shift();
          const lastPipe = pipes[pipes.length - 1];
          pipes.push(spawnPipe(lastPipe ? lastPipe.x + 200 : WIDTH + 60));
        }

        // Collision Checks
        const birdX = 80;
        const birdY = birdYRef.current;
        const birdRadius = 12;

        // Ground / Ceiling collision
        if (birdY + birdRadius >= HEIGHT - GROUND_HEIGHT || birdY - birdRadius <= 0) {
          gameOverRef.current = true;
          playSfx('hit');
          playSfx('gameover');
          onGameOver(score);
          return;
        }

        // Pipe collision
        for (const pipe of pipes) {
          const inHorizontalRange =
            birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + PIPE_WIDTH;

          if (inHorizontalRange) {
            // Check top pipe
            if (birdY - birdRadius < pipe.topHeight) {
              gameOverRef.current = true;
              playSfx('hit');
              playSfx('gameover');
              onGameOver(score);
              return;
            }
            // Check bottom pipe
            if (birdY + birdRadius > pipe.bottomY) {
              gameOverRef.current = true;
              playSfx('hit');
              playSfx('gameover');
              onGameOver(score);
              return;
            }
          }
        }
      }

      // Drawing
      if (ctx && canvas) {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT - GROUND_HEIGHT);
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.5, '#1e1b4b');
        skyGrad.addColorStop(1, '#312e81');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Retro pixel stars / city silhouette in background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 20; i++) {
          const sx = (i * 37 + 10) % WIDTH;
          const sy = (i * 53 + 20) % (HEIGHT - 180);
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Draw Pipes (Retro green tubes with highlights)
        for (const pipe of pipesRef.current) {
          // Top pipe body
          ctx.fillStyle = '#15803d';
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
          // Top pipe highlight
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(pipe.x + 4, 0, 8, pipe.topHeight);
          // Top pipe lip
          ctx.fillStyle = '#166534';
          ctx.fillRect(pipe.x - 3, pipe.topHeight - 20, PIPE_WIDTH + 6, 20);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(pipe.x + 1, pipe.topHeight - 20, 8, 20);
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipe.x - 3, pipe.topHeight - 20, PIPE_WIDTH + 6, 20);

          // Bottom pipe body
          const bottomHeight = HEIGHT - GROUND_HEIGHT - pipe.bottomY;
          ctx.fillStyle = '#15803d';
          ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, bottomHeight);
          // Bottom pipe highlight
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(pipe.x + 4, pipe.bottomY, 8, bottomHeight);
          // Bottom pipe lip
          ctx.fillStyle = '#166534';
          ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, 20);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(pipe.x + 1, pipe.bottomY, 8, 20);
          ctx.strokeStyle = '#052e16';
          ctx.strokeRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, 20);
        }

        // Draw Ground
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
        // Grass strip
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 12);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 3);

        // Ground stripe pattern
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        for (let x = -groundOffsetRef.current; x < WIDTH + 24; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, HEIGHT - GROUND_HEIGHT + 14);
          ctx.lineTo(x - 12, HEIGHT);
          ctx.stroke();
        }

        // Draw Puff Particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, 4, 4);
          ctx.globalAlpha = 1.0;
        }

        // Draw Bird
        ctx.save();
        ctx.translate(80, birdYRef.current);
        ctx.rotate(birdAngleRef.current);

        // Bird Body (Golden yellow pixel bird)
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-12, -10, 24, 20);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-10, -8, 20, 16);

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -8, 6, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(7, -6, 3, 3);

        // Beak (Orange)
        ctx.fillStyle = '#f97316';
        ctx.fillRect(10, 0, 8, 6);

        // Wing (Animated flap)
        const wingOffset = Math.sin(flapFrameRef.current) * 3;
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-8, -4 + wingOffset, 10, 8);

        ctx.restore();

        // Big HUD Score Overlay
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Press Start 2P", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(`${score}`, WIDTH / 2, 60);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, onGameOver, onScoreChange, playSfx, score]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none">
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/80 border border-slate-800 rounded text-xs font-retro">
        <span className="text-yellow-400">FLAP: SPACE / TAP</span>
        <span className="text-cyan-400">SCORE: {score}</span>
      </div>

      <div
        className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black cursor-pointer w-full"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full pixelated block"
        />
      </div>
    </div>
  );
};
