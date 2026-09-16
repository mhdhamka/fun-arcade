import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;

export const SnakeGame: React.FC<ArcadeGameProps> = ({
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
  const [bonusTimer, setBonusTimer] = useState(0);

  // Game state held in refs for 60fps / interval loop
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const dirRef = useRef<Point>({ x: 0, y: -1 });
  const nextDirRef = useRef<Point>({ x: 0, y: -1 });
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const bonusFoodRef = useRef<Point | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const gameOverRef = useRef(false);
  const lastTimeRef = useRef(0);
  const moveIntervalRef = useRef(140); // ms between steps
  const lastInputTimestampRef = useRef(0);

  // Spawn standard food
  const spawnFood = useCallback(() => {
    const snake = snakeRef.current;
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collides = snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!collides) break;
    }
    foodRef.current = newFood;
  }, []);

  // Spawn bonus food occasionally
  const spawnBonus = useCallback(() => {
    const snake = snakeRef.current;
    let newBonus: Point;
    while (true) {
      newBonus = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collides =
        snake.some((s) => s.x === newBonus.x && s.y === newBonus.y) ||
        (foodRef.current.x === newBonus.x && foodRef.current.y === newBonus.y);
      if (!collides) break;
    }
    bonusFoodRef.current = newBonus;
    setBonusTimer(100);
  }, []);

  const createParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  };

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cur = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (cur.y === 0) nextDirRef.current = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (cur.y === 0) nextDirRef.current = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (cur.x === 0) nextDirRef.current = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (cur.x === 0) nextDirRef.current = { x: 1, y: 0 };
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle virtual arcade controller input
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastInputTimestampRef.current) return;
    lastInputTimestampRef.current = virtualInput.timestamp;

    const cur = dirRef.current;
    if (virtualInput.up && cur.y === 0) nextDirRef.current = { x: 0, y: -1 };
    else if (virtualInput.down && cur.y === 0) nextDirRef.current = { x: 0, y: 1 };
    else if (virtualInput.left && cur.x === 0) nextDirRef.current = { x: -1, y: 0 };
    else if (virtualInput.right && cur.x === 0) nextDirRef.current = { x: 1, y: 0 };
  }, [virtualInput]);

  // Main animation loop
  useEffect(() => {
    spawnFood();
    let animId: number;

    const step = (time: number) => {
      if (gameOverRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!isPaused && time - lastTimeRef.current > moveIntervalRef.current) {
        lastTimeRef.current = time;

        // Apply next direction
        dirRef.current = nextDirRef.current;
        const head = snakeRef.current[0];
        const newHead: Point = {
          x: head.x + dirRef.current.x,
          y: head.y + dirRef.current.y,
        };

        // Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          gameOverRef.current = true;
          playSfx('gameover');
          onGameOver(score);
          return;
        }

        // Self Collision
        if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          gameOverRef.current = true;
          playSfx('gameover');
          onGameOver(score);
          return;
        }

        // Move snake
        const newSnake = [newHead, ...snakeRef.current];

        // Check regular food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          playSfx('point');
          createParticles(newHead.x, newHead.y, '#10b981', 14);
          const newScore = score + 10;
          setScore(newScore);
          onScoreChange(newScore);

          // Speed up slightly as snake grows
          moveIntervalRef.current = Math.max(70, 140 - Math.floor(newScore / 40) * 8);

          spawnFood();

          // Chance to spawn bonus item
          if (!bonusFoodRef.current && Math.random() < 0.25) {
            spawnBonus();
          }
        } else if (
          bonusFoodRef.current &&
          newHead.x === bonusFoodRef.current.x &&
          newHead.y === bonusFoodRef.current.y
        ) {
          // Bonus food eaten
          playSfx('level');
          createParticles(newHead.x, newHead.y, '#f59e0b', 22);
          onTriggerScreenShake?.('subtle');
          onTriggerParticles?.('stars', 40);
          const newScore = score + 50;
          setScore(newScore);
          onScoreChange(newScore);
          bonusFoodRef.current = null;
          setBonusTimer(0);
        } else {
          newSnake.pop();
        }

        // Celebrate length milestones (e.g. 15, 25, 40 segments)
        if (newSnake.length === 15 || newSnake.length === 25 || newSnake.length === 40) {
          onTriggerScreenShake?.('intense');
          onTriggerParticles?.('confetti', 70);
          onGameCompleted?.(score, `LENGTH ${newSnake.length} MILESTONE!`);
        }

        snakeRef.current = newSnake;

        // Update bonus timer
        if (bonusFoodRef.current) {
          setBonusTimer((prev) => {
            if (prev <= 1) {
              bonusFoodRef.current = null;
              return 0;
            }
            return prev - 1.5;
          });
        }
      }

      // Render Frame
      if (ctx && canvas) {
        // Clear background with dark CRT grid
        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
          ctx.beginPath();
          ctx.moveTo(i * TILE_SIZE, 0);
          ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * TILE_SIZE);
          ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
          ctx.stroke();
        }

        // Draw regular food (glowing red apple/pixel orb)
        const food = foodRef.current;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(
          food.x * TILE_SIZE + 2,
          food.y * TILE_SIZE + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4
        );
        // Highlight
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(food.x * TILE_SIZE + 4, food.y * TILE_SIZE + 4, 3, 3);
        ctx.shadowBlur = 0;

        // Draw bonus food if active
        if (bonusFoodRef.current) {
          const bonus = bonusFoodRef.current;
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;
          const pulse = Math.sin(time / 120) * 2;
          ctx.fillRect(
            bonus.x * TILE_SIZE + 2 - pulse / 2,
            bonus.y * TILE_SIZE + 2 - pulse / 2,
            TILE_SIZE - 4 + pulse,
            TILE_SIZE - 4 + pulse
          );
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bonus.x * TILE_SIZE + 5, bonus.y * TILE_SIZE + 5, 4, 4);
          ctx.shadowBlur = 0;
        }

        // Draw Snake
        const snake = snakeRef.current;
        snake.forEach((segment, idx) => {
          const isHead = idx === 0;
          if (isHead) {
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 8;
          } else {
            const alpha = Math.max(0.4, 1 - idx / (snake.length * 1.5));
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.shadowBlur = 0;
          }

          ctx.fillRect(
            segment.x * TILE_SIZE + 1,
            segment.y * TILE_SIZE + 1,
            TILE_SIZE - 2,
            TILE_SIZE - 2
          );

          // Draw snake eyes on head
          if (isHead) {
            ctx.fillStyle = '#ffffff';
            const dir = dirRef.current;
            const eyeOffset = 4;
            let eye1X = segment.x * TILE_SIZE + 5;
            let eye1Y = segment.y * TILE_SIZE + 5;
            let eye2X = segment.x * TILE_SIZE + TILE_SIZE - 8;
            let eye2Y = segment.y * TILE_SIZE + 5;

            if (dir.y !== 0) {
              eye1Y = dir.y < 0 ? segment.y * TILE_SIZE + 4 : segment.y * TILE_SIZE + TILE_SIZE - 6;
              eye2Y = eye1Y;
            } else if (dir.x !== 0) {
              eye1X = dir.x < 0 ? segment.x * TILE_SIZE + 4 : segment.x * TILE_SIZE + TILE_SIZE - 6;
              eye2X = eye1X;
              eye1Y = segment.y * TILE_SIZE + 4;
              eye2Y = segment.y * TILE_SIZE + TILE_SIZE - 7;
            }

            ctx.fillRect(eye1X, eye1Y, 3, 3);
            ctx.fillRect(eye2X, eye2Y, 3, 3);
          }
        });
        ctx.shadowBlur = 0;

        // Update and draw particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, 3, 3);
          ctx.globalAlpha = 1.0;
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, onGameOver, onScoreChange, playSfx, score, spawnBonus, spawnFood]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto">
      {/* Mini HUD Info */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/80 border border-slate-800 rounded text-xs font-retro">
        <span className="text-emerald-400">LENGTH: {snakeRef.current.length}</span>
        {bonusTimer > 0 && (
          <span className="text-amber-400 animate-pulse">
            STAR BONUS: {Math.ceil(bonusTimer / 10)}s
          </span>
        )}
        <span className="text-cyan-400">SPEED: {Math.round(200 - moveIntervalRef.current)}</span>
      </div>

      <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black aspect-square w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full pixelated block"
        />
      </div>
    </div>
  );
};
