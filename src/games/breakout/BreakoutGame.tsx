import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
}

type PowerUpType = 'WIDE' | 'MULTI' | 'LASER' | 'LIFE';

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  color: string;
}

interface LaserBolt {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

const CANVAS_W = 480;
const CANVAS_H = 420;
const PADDLE_H = 12;
const PADDLE_Y = CANVAS_H - 28;
const BASE_PADDLE_W = 86;

const ROW_PALETTE = [
  { color: '#ec4899', points: 60 },
  { color: '#a855f7', points: 50 },
  { color: '#06b6d4', points: 40 },
  { color: '#10b981', points: 30 },
  { color: '#eab308', points: 20 },
];

export const BreakoutGame: React.FC<ArcadeGameProps> = ({
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

  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(3);
  const [hudStage, setHudStage] = useState(1);
  const [activeBuff, setActiveBuff] = useState<string | null>(null);

  // Refs for stable 60fps loop
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const callbacksRef = useRef({
    onScoreChange,
    onGameOver,
    playSfx,
    onTriggerScreenShake,
    onTriggerParticles,
    onGameCompleted,
  });
  callbacksRef.current = {
    onScoreChange,
    onGameOver,
    playSfx,
    onTriggerScreenShake,
    onTriggerParticles,
    onGameCompleted,
  };

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const stageRef = useRef(1);
  const comboRef = useRef(0);
  const gameOverRef = useRef(false);

  const paddleRef = useRef({
    x: CANVAS_W / 2 - BASE_PADDLE_W / 2,
    w: BASE_PADDLE_W,
    wideTimer: 0,
    laserTimer: 0,
    laserCooldown: 0,
  });

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const lasersRef = useRef<LaserBolt[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef({ left: false, right: false });
  const lastVirtualTsRef = useRef(0);

  const buildStage = useCallback((stageNum: number) => {
    const cols = 9;
    const rows = Math.min(7, 4 + Math.floor((stageNum + 1) / 2));
    const padX = 18;
    const gap = 5;
    const brickW = (CANVAS_W - padX * 2 - gap * (cols - 1)) / cols;
    const brickH = 16;
    const bricks: Brick[] = [];

    for (let r = 0; r < rows; r++) {
      const palette = ROW_PALETTE[r % ROW_PALETTE.length];
      for (let c = 0; c < cols; c++) {
        // Checkerboard gaps on even stages for variety
        if (stageNum % 2 === 0 && (r + c) % 7 === 0) continue;
        const isArmored = stageNum >= 2 && r === 0 && c % 2 === 0;
        bricks.push({
          x: padX + c * (brickW + gap),
          y: 44 + r * (brickH + gap),
          w: brickW,
          h: brickH,
          hp: isArmored ? 2 : 1,
          maxHp: isArmored ? 2 : 1,
          color: isArmored ? '#e2e8f0' : palette.color,
          points: isArmored ? palette.points * 2 : palette.points,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const resetBallOnPaddle = useCallback(() => {
    const p = paddleRef.current;
    ballsRef.current = [
      {
        x: p.x + p.w / 2,
        y: PADDLE_Y - 7,
        vx: 3.1 * (Math.random() > 0.5 ? 1 : -1),
        vy: -3.9,
        radius: 6,
        stuck: true,
        trail: [],
      },
    ];
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        size: 2 + Math.random() * 2.5,
      });
    }
  };

  const triggerLaunchOrLaser = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current) return;
    let launched = false;
    ballsRef.current.forEach((b) => {
      if (b.stuck) {
        b.stuck = false;
        launched = true;
      }
    });
    if (launched) {
      callbacksRef.current.playSfx('jump');
      return;
    }

    const p = paddleRef.current;
    if (p.laserTimer > 0 && p.laserCooldown <= 0) {
      lasersRef.current.push(
        { x: p.x + 10, y: PADDLE_Y - 6, vy: -8 },
        { x: p.x + p.w - 10, y: PADDLE_Y - 6, vy: -8 }
      );
      p.laserCooldown = 14;
      callbacksRef.current.playSfx('laser');
    }
  }, []);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') {
        triggerLaunchOrLaser();
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerLaunchOrLaser]);

  // Virtual controller sync
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastVirtualTsRef.current) return;
    lastVirtualTsRef.current = virtualInput.timestamp;

    keysRef.current.left = virtualInput.left;
    keysRef.current.right = virtualInput.right;
    if (virtualInput.actionA || virtualInput.actionB || virtualInput.up) {
      triggerLaunchOrLaser();
    }
  }, [virtualInput, triggerLaunchOrLaser]);

  // Pointer/touch drag support on canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPausedRef.current || gameOverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const p = paddleRef.current;
    p.x = Math.max(8, Math.min(CANVAS_W - p.w - 8, relX - p.w / 2));
  };

  // Main 60fps loop
  useEffect(() => {
    buildStage(1);
    resetBallOnPaddle();

    let animId: number;

    const addScore = (pts: number) => {
      scoreRef.current += pts;
      setHudScore(scoreRef.current);
      callbacksRef.current.onScoreChange(scoreRef.current);
    };

    const damageBrick = (brick: Brick, idx: number) => {
      brick.hp -= 1;
      if (brick.hp <= 0) {
        bricksRef.current.splice(idx, 1);
        comboRef.current += 1;
        const mult = Math.min(4, 1 + Math.floor(comboRef.current / 5));
        addScore(brick.points * mult);
        spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 12);
        callbacksRef.current.playSfx(comboRef.current % 5 === 0 ? 'clear' : 'point');

        // 18% chance to drop power-up capsule
        if (Math.random() < 0.18) {
          const types: { type: PowerUpType; color: string }[] = [
            { type: 'WIDE', color: '#06b6d4' },
            { type: 'MULTI', color: '#ec4899' },
            { type: 'LASER', color: '#f59e0b' },
            { type: 'LIFE', color: '#10b981' },
          ];
          const chosen = types[Math.floor(Math.random() * types.length)];
          powerUpsRef.current.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h / 2,
            vy: 2.1,
            type: chosen.type,
            color: chosen.color,
          });
        }
      } else {
        brick.color = '#38bdf8';
        spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, '#e2e8f0', 6);
        callbacksRef.current.playSfx('select');
      }
    };

    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!isPausedRef.current && !gameOverRef.current) {
        const p = paddleRef.current;
        const paddleSpeed = 6.8;
        if (keysRef.current.left) p.x -= paddleSpeed;
        if (keysRef.current.right) p.x += paddleSpeed;
        p.x = Math.max(8, Math.min(CANVAS_W - p.w - 8, p.x));

        // Timers
        if (p.wideTimer > 0) {
          p.wideTimer -= 1;
          if (p.wideTimer === 0) {
            p.w = BASE_PADDLE_W;
            p.x = Math.min(p.x, CANVAS_W - p.w - 8);
            setActiveBuff(p.laserTimer > 0 ? 'LASER CANNON' : null);
          }
        }
        if (p.laserTimer > 0) {
          p.laserTimer -= 1;
          if (p.laserTimer === 0) {
            setActiveBuff(p.wideTimer > 0 ? 'WIDE PADDLE' : null);
          }
        }
        if (p.laserCooldown > 0) p.laserCooldown -= 1;

        // Update Laser Bolts
        for (let i = lasersRef.current.length - 1; i >= 0; i--) {
          const bolt = lasersRef.current[i];
          bolt.y += bolt.vy;
          if (bolt.y < 0) {
            lasersRef.current.splice(i, 1);
            continue;
          }
          for (let bi = bricksRef.current.length - 1; bi >= 0; bi--) {
            const b = bricksRef.current[bi];
            if (bolt.x >= b.x && bolt.x <= b.x + b.w && bolt.y <= b.y + b.h && bolt.y >= b.y) {
              damageBrick(b, bi);
              lasersRef.current.splice(i, 1);
              break;
            }
          }
        }

        // Update PowerUps
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.y += pu.vy;
          if (
            pu.y + 10 >= PADDLE_Y &&
            pu.y - 10 <= PADDLE_Y + PADDLE_H &&
            pu.x + 14 >= p.x &&
            pu.x - 14 <= p.x + p.w
          ) {
            callbacksRef.current.playSfx('level');
            addScore(100);
            if (pu.type === 'WIDE') {
              p.w = 130;
              p.wideTimer = 600;
              setActiveBuff('WIDE PADDLE');
            } else if (pu.type === 'LASER') {
              p.laserTimer = 600;
              setActiveBuff('LASER CANNON');
            } else if (pu.type === 'LIFE') {
              livesRef.current = Math.min(5, livesRef.current + 1);
              setHudLives(livesRef.current);
            } else if (pu.type === 'MULTI') {
              const source = ballsRef.current[0];
              if (source) {
                source.stuck = false;
                ballsRef.current.push(
                  {
                    ...source,
                    vx: -Math.abs(source.vx) - 0.6,
                    vy: -Math.abs(source.vy),
                    trail: [],
                  },
                  {
                    ...source,
                    vx: Math.abs(source.vx) + 0.6,
                    vy: -Math.abs(source.vy),
                    trail: [],
                  }
                );
              }
            }
            powerUpsRef.current.splice(i, 1);
            continue;
          }
          if (pu.y > CANVAS_H + 20) {
            powerUpsRef.current.splice(i, 1);
          }
        }

        // Update Balls
        for (let i = ballsRef.current.length - 1; i >= 0; i--) {
          const ball = ballsRef.current[i];
          if (ball.stuck) {
            ball.x = p.x + p.w / 2;
            ball.y = PADDLE_Y - ball.radius - 1;
            continue;
          }

          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 7) ball.trail.shift();

          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall bounce
          if (ball.x - ball.radius <= 4) {
            ball.x = 4 + ball.radius;
            ball.vx = Math.abs(ball.vx);
            callbacksRef.current.playSfx('select');
          } else if (ball.x + ball.radius >= CANVAS_W - 4) {
            ball.x = CANVAS_W - 4 - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            callbacksRef.current.playSfx('select');
          }
          if (ball.y - ball.radius <= 4) {
            ball.y = 4 + ball.radius;
            ball.vy = Math.abs(ball.vy);
            callbacksRef.current.playSfx('select');
          }

          // Paddle bounce
          if (
            ball.vy > 0 &&
            ball.y + ball.radius >= PADDLE_Y &&
            ball.y - ball.radius <= PADDLE_Y + PADDLE_H &&
            ball.x + ball.radius >= p.x &&
            ball.x - ball.radius <= p.x + p.w
          ) {
            const hitRatio = (ball.x - (p.x + p.w / 2)) / (p.w / 2);
            const speed = Math.min(7.2, Math.hypot(ball.vx, ball.vy) * 1.015);
            const maxAngle = Math.PI * 0.37;
            const bounceAngle = hitRatio * maxAngle;
            ball.vx = Math.sin(bounceAngle) * speed;
            ball.vy = -Math.cos(bounceAngle) * speed;
            ball.y = PADDLE_Y - ball.radius - 1;
            comboRef.current = 0;
            callbacksRef.current.playSfx('jump');
          }

          // Brick collisions
          for (let bi = bricksRef.current.length - 1; bi >= 0; bi--) {
            const b = bricksRef.current[bi];
            const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
            const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            if (dx * dx + dy * dy <= ball.radius * ball.radius) {
              if (Math.abs(dx) > Math.abs(dy)) ball.vx = -ball.vx;
              else ball.vy = -ball.vy;
              damageBrick(b, bi);
              break;
            }
          }

          // Missed ball
          if (ball.y - ball.radius > CANVAS_H) {
            ballsRef.current.splice(i, 1);
          }
        }

        // Lost all balls
        if (ballsRef.current.length === 0) {
          livesRef.current -= 1;
          setHudLives(livesRef.current);
          comboRef.current = 0;
          callbacksRef.current.playSfx('hit');
          callbacksRef.current.onTriggerScreenShake?.('subtle');
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            callbacksRef.current.playSfx('gameover');
            callbacksRef.current.onGameOver(scoreRef.current);
            return;
          }
          p.w = BASE_PADDLE_W;
          p.wideTimer = 0;
          p.laserTimer = 0;
          setActiveBuff(null);
          resetBallOnPaddle();
        }

        // Stage cleared!
        if (bricksRef.current.length === 0) {
          stageRef.current += 1;
          setHudStage(stageRef.current);
          addScore(350);
          callbacksRef.current.onTriggerScreenShake?.('intense');
          callbacksRef.current.onTriggerParticles?.('confetti', 85);
          callbacksRef.current.onGameCompleted?.(
            scoreRef.current,
            `STAGE ${stageRef.current - 1} CLEARED!`
          );
          buildStage(stageRef.current);
          resetBallOnPaddle();
        }
      }

      // Render Frame
      if (ctx && canvas) {
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Subtle CRT grid
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < CANVAS_W; gx += 24) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, CANVAS_H);
          ctx.stroke();
        }
        for (let gy = 0; gy < CANVAS_H; gy += 24) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(CANVAS_W, gy);
          ctx.stroke();
        }

        // Arena neon rail border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);

        // Draw Bricks
        bricksRef.current.forEach((b) => {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.fillStyle = 'rgba(255,255,255,0.32)';
          ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
          if (b.hp > 1) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
          }
        });
        ctx.shadowBlur = 0;

        // Draw Power-Up Capsules
        powerUpsRef.current.forEach((pu) => {
          ctx.fillStyle = pu.color;
          ctx.shadowColor = pu.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(pu.x - 16, pu.y - 8, 32, 16, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#020617';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pu.type[0], pu.x, pu.y + 0.5);
        });

        // Draw Laser Bolts
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        lasersRef.current.forEach((bolt) => {
          ctx.fillRect(bolt.x - 1.5, bolt.y, 3, 12);
        });
        ctx.shadowBlur = 0;

        // Draw Paddle
        const p = paddleRef.current;
        const paddleColor = p.laserTimer > 0 ? '#f59e0b' : '#06b6d4';
        ctx.fillStyle = paddleColor;
        ctx.shadowColor = paddleColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(p.x, PADDLE_Y, p.w, PADDLE_H, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + 8, PADDLE_Y + 2, p.w - 16, 2);

        if (p.laserTimer > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(p.x + 8, PADDLE_Y - 5, 4, 5);
          ctx.fillRect(p.x + p.w - 12, PADDLE_Y - 5, 4, 5);
        }

        // Draw Balls + Trails
        ballsRef.current.forEach((ball) => {
          ball.trail.forEach((t, idx) => {
            ctx.fillStyle = `rgba(249, 115, 22, ${(idx + 1) / 16})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, ball.radius * ((idx + 2) / 10), 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          if (ball.stuck) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS SPACE OR CLICK TO LAUNCH', CANVAS_W / 2, PADDLE_Y - 26);
          }
        });

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= 0.035;
          if (pt.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = pt.life;
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
          ctx.globalAlpha = 1;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [buildStage, resetBallOnPaddle]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/80 border border-slate-800 rounded text-xs font-retro tabular-nums">
        <span className="text-cyan-400">STAGE {hudStage}</span>
        {activeBuff ? (
          <span className="text-amber-300 text-[10px]">{activeBuff}</span>
        ) : (
          <span className="text-slate-400 text-[10px]">PTS: {hudScore}</span>
        )}
        <span className="text-pink-400">LIVES: {'♥'.repeat(Math.max(0, hudLives))}</span>
      </div>

      <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black aspect-[8/7] w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerMove={handlePointerMove}
          onPointerDown={triggerLaunchOrLaser}
          className="w-full h-full block touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
};
