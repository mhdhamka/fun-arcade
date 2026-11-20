import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: 3 | 2 | 1; // 3 = large, 2 = medium, 1 = small
  angle: number;
  rotSpeed: number;
  offsets: number[];
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  fromUfo?: boolean;
}

interface Ufo {
  x: number;
  y: number;
  vx: number;
  fireTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const CANVAS_W = 460;
const CANVAS_H = 420;

export const AsteroidsGame: React.FC<ArcadeGameProps> = ({
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

  const [hudLives, setHudLives] = useState(3);
  const [hudWave, setHudWave] = useState(1);
  const [warpReady, setWarpReady] = useState(true);

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
  const waveRef = useRef(1);
  const gameOverRef = useRef(false);

  const shipRef = useRef({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    invuln: 120,
    shootCooldown: 0,
    warpCooldown: 0,
  });

  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ufoRef = useRef<Ufo | null>(null);
  const ufoSpawnTimerRef = useRef(520);

  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    shoot: false,
  });
  const lastVirtualTsRef = useRef(0);

  const makeAsteroid = useCallback(
    (x: number, y: number, tier: 3 | 2 | 1, speedScale = 1): Asteroid => {
      const radius = tier === 3 ? 34 : tier === 2 ? 20 : 11;
      const baseSpeed = (tier === 3 ? 1.15 : tier === 2 ? 1.85 : 2.55) * speedScale;
      const dir = Math.random() * Math.PI * 2;
      const vertices = tier === 3 ? 11 : 9;
      const offsets: number[] = [];
      for (let i = 0; i < vertices; i++) {
        offsets.push(0.72 + Math.random() * 0.45);
      }
      const colors = ['#22d3ee', '#f59e0b', '#a855f7'];
      return {
        x,
        y,
        vx: Math.cos(dir) * baseSpeed,
        vy: Math.sin(dir) * baseSpeed,
        radius,
        tier,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        offsets,
        color: colors[tier - 1],
      };
    },
    []
  );

  const spawnWave = useCallback(
    (waveNum: number) => {
      const count = Math.min(9, 3 + waveNum);
      const speedScale = 1 + (waveNum - 1) * 0.1;
      const list: Asteroid[] = [];
      for (let i = 0; i < count; i++) {
        let ax = 0;
        let ay = 0;
        // Keep spawn safely away from ship center
        do {
          ax = Math.random() * CANVAS_W;
          ay = Math.random() * CANVAS_H;
        } while (Math.hypot(ax - shipRef.current.x, ay - shipRef.current.y) < 110);
        list.push(makeAsteroid(ax, ay, 3, speedScale));
      }
      asteroidsRef.current = list;
    },
    [makeAsteroid]
  );

  const spawnDebris = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 3.2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        color,
      });
    }
  };

  const triggerHyperspace = useCallback(() => {
    if (isPausedRef.current || gameOverRef.current) return;
    const ship = shipRef.current;
    if (ship.warpCooldown > 0) return;

    spawnDebris(ship.x, ship.y, '#22d3ee', 14);
    ship.x = 40 + Math.random() * (CANVAS_W - 80);
    ship.y = 40 + Math.random() * (CANVAS_H - 80);
    ship.vx = 0;
    ship.vy = 0;
    ship.invuln = 45;
    ship.warpCooldown = 180;
    setWarpReady(false);
    spawnDebris(ship.x, ship.y, '#a855f7', 14);
    callbacksRef.current.playSfx('jump');
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = true;
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.shoot = true;
        e.preventDefault();
      } else if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') {
        triggerHyperspace();
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = false;
      } else if (e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.shoot = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerHyperspace]);

  // Virtual controller sync
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastVirtualTsRef.current) return;
    lastVirtualTsRef.current = virtualInput.timestamp;

    keysRef.current.left = virtualInput.left;
    keysRef.current.right = virtualInput.right;
    keysRef.current.up = virtualInput.up;
    keysRef.current.shoot = virtualInput.actionA;
    if (virtualInput.actionB) {
      triggerHyperspace();
    }
  }, [virtualInput, triggerHyperspace]);

  // Main 60fps loop
  useEffect(() => {
    spawnWave(1);
    let animId: number;

    const addScore = (pts: number) => {
      scoreRef.current += pts;
      callbacksRef.current.onScoreChange(scoreRef.current);
    };

    const wrap = (obj: { x: number; y: number }, margin = 0) => {
      if (obj.x < -margin) obj.x = CANVAS_W + margin;
      else if (obj.x > CANVAS_W + margin) obj.x = -margin;
      if (obj.y < -margin) obj.y = CANVAS_H + margin;
      else if (obj.y > CANVAS_H + margin) obj.y = -margin;
    };

    const loseLife = () => {
      const ship = shipRef.current;
      spawnDebris(ship.x, ship.y, '#22d3ee', 26);
      callbacksRef.current.playSfx('hit');
      callbacksRef.current.onTriggerScreenShake?.('intense');
      livesRef.current -= 1;
      setHudLives(livesRef.current);
      if (livesRef.current <= 0) {
        gameOverRef.current = true;
        callbacksRef.current.playSfx('gameover');
        callbacksRef.current.onGameOver(scoreRef.current);
        return;
      }
      ship.x = CANVAS_W / 2;
      ship.y = CANVAS_H / 2;
      ship.vx = 0;
      ship.vy = 0;
      ship.angle = -Math.PI / 2;
      ship.invuln = 150;
    };

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      a: 0.2 + Math.random() * 0.6,
    }));

    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!isPausedRef.current && !gameOverRef.current) {
        const ship = shipRef.current;
        if (keysRef.current.left) ship.angle -= 0.068;
        if (keysRef.current.right) ship.angle += 0.068;
        if (keysRef.current.up) {
          ship.vx += Math.cos(ship.angle) * 0.14;
          ship.vy += Math.sin(ship.angle) * 0.14;
          if (Math.random() < 0.65) {
            particlesRef.current.push({
              x: ship.x - Math.cos(ship.angle) * 12,
              y: ship.y - Math.sin(ship.angle) * 12,
              vx: -Math.cos(ship.angle) * 1.6 + (Math.random() - 0.5),
              vy: -Math.sin(ship.angle) * 1.6 + (Math.random() - 0.5),
              life: 0.55,
              color: '#f59e0b',
            });
          }
        }

        // Gentle space drag & speed cap
        ship.vx *= 0.992;
        ship.vy *= 0.992;
        const speed = Math.hypot(ship.vx, ship.vy);
        if (speed > 5.5) {
          ship.vx = (ship.vx / speed) * 5.5;
          ship.vy = (ship.vy / speed) * 5.5;
        }
        ship.x += ship.vx;
        ship.y += ship.vy;
        wrap(ship, 12);

        if (ship.invuln > 0) ship.invuln -= 1;
        if (ship.shootCooldown > 0) ship.shootCooldown -= 1;
        if (ship.warpCooldown > 0) {
          ship.warpCooldown -= 1;
          if (ship.warpCooldown === 0) setWarpReady(true);
        }

        if (keysRef.current.shoot && ship.shootCooldown <= 0) {
          bulletsRef.current.push({
            x: ship.x + Math.cos(ship.angle) * 15,
            y: ship.y + Math.sin(ship.angle) * 15,
            vx: Math.cos(ship.angle) * 7.2 + ship.vx * 0.3,
            vy: Math.sin(ship.angle) * 7.2 + ship.vy * 0.3,
            life: 52,
          });
          ship.shootCooldown = 11;
          callbacksRef.current.playSfx('laser');
        }

        // UFO spawning & AI
        if (!ufoRef.current) {
          ufoSpawnTimerRef.current -= 1;
          if (ufoSpawnTimerRef.current <= 0) {
            const fromLeft = Math.random() > 0.5;
            ufoRef.current = {
              x: fromLeft ? -20 : CANVAS_W + 20,
              y: 45 + Math.random() * (CANVAS_H - 90),
              vx: fromLeft ? 2.1 : -2.1,
              fireTimer: 75,
            };
            ufoSpawnTimerRef.current = 580 + Math.floor(Math.random() * 260);
          }
        } else {
          const ufo = ufoRef.current;
          ufo.x += ufo.vx;
          ufo.fireTimer -= 1;
          if (ufo.fireTimer <= 0) {
            const angleToShip = Math.atan2(ship.y - ufo.y, ship.x - ufo.x) + (Math.random() - 0.5) * 0.25;
            bulletsRef.current.push({
              x: ufo.x,
              y: ufo.y,
              vx: Math.cos(angleToShip) * 4.2,
              vy: Math.sin(angleToShip) * 4.2,
              life: 85,
              fromUfo: true,
            });
            ufo.fireTimer = 85;
          }
          if (ufo.x < -35 || ufo.x > CANVAS_W + 35) {
            ufoRef.current = null;
          }
        }

        // Update bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx;
          b.y += b.vy;
          b.life -= 1;
          wrap(b, 4);
          if (b.life <= 0) {
            bulletsRef.current.splice(i, 1);
            continue;
          }

          // UFO hit by player bullet
          if (!b.fromUfo && ufoRef.current) {
            const ufo = ufoRef.current;
            if (Math.hypot(b.x - ufo.x, b.y - ufo.y) < 18) {
              spawnDebris(ufo.x, ufo.y, '#ef4444', 22);
              callbacksRef.current.playSfx('clear');
              callbacksRef.current.onTriggerScreenShake?.('subtle');
              addScore(300);
              ufoRef.current = null;
              bulletsRef.current.splice(i, 1);
              continue;
            }
          }

          // Player hit by UFO bullet
          if (b.fromUfo && ship.invuln === 0 && Math.hypot(b.x - ship.x, b.y - ship.y) < 13) {
            bulletsRef.current.splice(i, 1);
            loseLife();
            continue;
          }

          // Asteroid hits (player bullets only)
          if (!b.fromUfo) {
            let hit = false;
            for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
              const ast = asteroidsRef.current[ai];
              if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius) {
                hit = true;
                asteroidsRef.current.splice(ai, 1);
                spawnDebris(ast.x, ast.y, ast.color, 10);
                callbacksRef.current.playSfx('point');
                addScore(ast.tier === 3 ? 50 : ast.tier === 2 ? 100 : 150);
                if (ast.tier > 1) {
                  const nextTier = (ast.tier - 1) as 2 | 1;
                  asteroidsRef.current.push(
                    makeAsteroid(ast.x, ast.y, nextTier, 1 + waveRef.current * 0.08),
                    makeAsteroid(ast.x, ast.y, nextTier, 1 + waveRef.current * 0.08)
                  );
                }
                break;
              }
            }
            if (hit) {
              bulletsRef.current.splice(i, 1);
            }
          }
        }

        // Update Asteroids + check ship collision
        for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
          const ast = asteroidsRef.current[ai];
          ast.x += ast.vx;
          ast.y += ast.vy;
          ast.angle += ast.rotSpeed;
          wrap(ast, ast.radius);

          if (ship.invuln === 0 && Math.hypot(ship.x - ast.x, ship.y - ast.y) < ast.radius + 9) {
            loseLife();
            break;
          }
        }

        // Wave cleared!
        if (asteroidsRef.current.length === 0) {
          waveRef.current += 1;
          setHudWave(waveRef.current);
          addScore(250);
          callbacksRef.current.onTriggerScreenShake?.('subtle');
          callbacksRef.current.onTriggerParticles?.('stars', 75);
          callbacksRef.current.onGameCompleted?.(
            scoreRef.current,
            `SECTOR WAVE ${waveRef.current - 1} CLEARED!`
          );
          ship.invuln = 90;
          spawnWave(waveRef.current);
        }
      }

      // Render Vector Frame
      if (ctx && canvas) {
        ctx.fillStyle = '#04060d';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Starfield
        stars.forEach((s) => {
          ctx.fillStyle = `rgba(226, 232, 240, ${s.a})`;
          ctx.fillRect(s.x, s.y, 1.5, 1.5);
        });

        // Asteroids (glowing vector polygons)
        asteroidsRef.current.forEach((ast) => {
          ctx.save();
          ctx.translate(ast.x, ast.y);
          ctx.rotate(ast.angle);
          ctx.strokeStyle = ast.color;
          ctx.shadowColor = ast.color;
          ctx.shadowBlur = 9;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ast.offsets.forEach((off, idx) => {
            const a = (idx / ast.offsets.length) * Math.PI * 2;
            const r = ast.radius * off;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        });
        ctx.shadowBlur = 0;

        // UFO Saucer
        if (ufoRef.current) {
          const u = ufoRef.current;
          ctx.save();
          ctx.translate(u.x, u.y);
          ctx.strokeStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(-8, -7);
          ctx.lineTo(8, -7);
          ctx.lineTo(16, 0);
          ctx.lineTo(9, 6);
          ctx.lineTo(-9, 6);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();
          ctx.restore();
        }
        ctx.shadowBlur = 0;

        // Bullets
        bulletsRef.current.forEach((b) => {
          ctx.fillStyle = b.fromUfo ? '#ef4444' : '#fef08a';
          ctx.shadowColor = b.fromUfo ? '#ef4444' : '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.fromUfo ? 3 : 2.3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Player Vector Delta Ship
        const ship = shipRef.current;
        if (ship.invuln === 0 || Math.floor(ship.invuln / 5) % 2 === 0) {
          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(ship.angle);
          ctx.strokeStyle = '#22d3ee';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-11, -9);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-11, 9);
          ctx.closePath();
          ctx.stroke();

          if (keysRef.current.up && !isPausedRef.current) {
            ctx.strokeStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-16 - Math.random() * 5, 0);
            ctx.lineTo(-8, 4);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.shadowBlur = 0;

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03;
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 2.5, 2.5);
          ctx.globalAlpha = 1;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [makeAsteroid, spawnWave]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/80 border border-slate-800 rounded text-xs font-retro tabular-nums">
        <span className="text-cyan-400">WAVE {hudWave}</span>
        <span className={warpReady ? 'text-purple-300 text-[10px]' : 'text-slate-500 text-[10px]'}>
          {warpReady ? 'WARP READY [X]' : 'RECHARGING WARP'}
        </span>
        <span className="text-amber-400">SHIPS: {'▲'.repeat(Math.max(0, hudLives))}</span>
      </div>

      <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black aspect-[23/21] w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
