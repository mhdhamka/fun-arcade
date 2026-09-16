import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

const WIDTH = 440;
const HEIGHT = 540;

interface Invader {
  x: number;
  y: number;
  type: 'squid' | 'crab' | 'octopus';
  points: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
  fromPlayer: boolean;
}

interface BunkerBlock {
  x: number;
  y: number;
  alive: boolean;
}

interface MysteryShip {
  x: number;
  y: number;
  vx: number;
  alive: boolean;
  points: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export const SpaceInvadersGame: React.FC<ArcadeGameProps> = ({
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
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);

  // Entities stored in refs
  const playerXRef = useRef(WIDTH / 2 - 16);
  const playerVxRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const invadersRef = useRef<Invader[]>([]);
  const bunkersRef = useRef<BunkerBlock[]>([]);
  const mysteryShipRef = useRef<MysteryShip | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Fleet animation state
  const fleetDirRef = useRef<number>(1);
  const fleetStepIntervalRef = useRef<number>(600); // ms per step
  const lastFleetStepRef = useRef<number>(0);
  const animFrameIndexRef = useRef<number>(0);
  const canShootRef = useRef<boolean>(true);
  const gameOverRef = useRef<boolean>(false);
  const lastInputTimestampRef = useRef<number>(0);
  const alienBombTimerRef = useRef<number>(0);

  // Initialize bunkers
  const initBunkers = () => {
    const blocks: BunkerBlock[] = [];
    const bunkerY = HEIGHT - 110;
    const bunkerWidth = 44;
    const bunkerSpacing = (WIDTH - 4 * bunkerWidth) / 5;

    for (let b = 0; b < 4; b++) {
      const startX = bunkerSpacing + b * (bunkerWidth + bunkerSpacing);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          // Leave notch in bottom center
          if (r >= 3 && c >= 2 && c <= 4) continue;
          // Arch corners
          if (r === 0 && (c === 0 || c === 6)) continue;

          blocks.push({
            x: startX + c * 6,
            y: bunkerY + r * 6,
            alive: true,
          });
        }
      }
    }
    bunkersRef.current = blocks;
  };

  // Initialize alien fleet
  const initFleet = (waveNum: number) => {
    const list: Invader[] = [];
    const startY = 60 + Math.min(waveNum * 10, 50);
    const startX = 30;

    for (let r = 0; r < 5; r++) {
      let type: 'squid' | 'crab' | 'octopus' = 'octopus';
      let points = 10;
      if (r === 0) {
        type = 'squid';
        points = 30;
      } else if (r === 1 || r === 2) {
        type = 'crab';
        points = 20;
      }

      for (let c = 0; c < 10; c++) {
        list.push({
          x: startX + c * 36,
          y: startY + r * 28,
          type,
          points,
          alive: true,
        });
      }
    }

    invadersRef.current = list;
    fleetDirRef.current = 1;
    fleetStepIntervalRef.current = Math.max(200, 650 - waveNum * 40);
  };

  const createExplosion = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  };

  // Player shoot action
  const shoot = useCallback(() => {
    if (gameOverRef.current || isPaused || !canShootRef.current) return;

    // Limit active player bullets
    const playerBullets = bulletsRef.current.filter((b) => b.fromPlayer);
    if (playerBullets.length >= 2) return;

    bulletsRef.current.push({
      x: playerXRef.current + 15,
      y: HEIGHT - 46,
      vy: -7,
      fromPlayer: true,
    });
    playSfx('laser');
    canShootRef.current = false;
    setTimeout(() => {
      canShootRef.current = true;
    }, 240);
  }, [isPaused, playSfx]);

  // Keyboard controls
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key);
      if (e.key === ' ' || e.code === 'Space') {
        shoot();
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key);
    };

    const updateMovement = () => {
      if (keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A')) {
        playerVxRef.current = -4.5;
      } else if (keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D')) {
        playerVxRef.current = 4.5;
      } else {
        playerVxRef.current = 0;
      }
    };

    const interval = setInterval(updateMovement, 20);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shoot]);

  // Virtual arcade controller input
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastInputTimestampRef.current) return;
    lastInputTimestampRef.current = virtualInput.timestamp;

    if (virtualInput.left) playerVxRef.current = -4.5;
    else if (virtualInput.right) playerVxRef.current = 4.5;
    else playerVxRef.current = 0;

    if (virtualInput.actionA || virtualInput.up) {
      shoot();
    }
  }, [virtualInput, shoot]);

  // Initial setup & game loop
  useEffect(() => {
    initFleet(1);
    initBunkers();

    let animId: number;

    const loop = (time: number) => {
      if (gameOverRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!isPaused) {
        // Move player
        playerXRef.current = Math.max(
          12,
          Math.min(WIDTH - 44, playerXRef.current + playerVxRef.current)
        );

        // Move bullets
        const bullets = bulletsRef.current;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y += b.vy;
          if (b.y < 0 || b.y > HEIGHT) {
            bullets.splice(i, 1);
          }
        }

        // Fleet March Step Logic
        const aliveInvaders = invadersRef.current.filter((inv) => inv.alive);
        if (aliveInvaders.length === 0) {
          // Wave Cleared!
          playSfx('level');
          onTriggerScreenShake?.('intense');
          onTriggerParticles?.('confetti', 80);
          onGameCompleted?.(score, `WAVE ${wave} DEFENDED!`);
          setWave((w) => {
            const nextWave = w + 1;
            initFleet(nextWave);
            return nextWave;
          });
        } else {
          // Dynamic interval based on remaining invaders (speeds up!)
          const currentInterval = Math.max(
            80,
            (fleetStepIntervalRef.current * aliveInvaders.length) / 50
          );

          if (time - lastFleetStepRef.current > currentInterval) {
            lastFleetStepRef.current = time;
            animFrameIndexRef.current = 1 - animFrameIndexRef.current;

            // Check if any alive invader hits horizontal edges
            let hitEdge = false;
            for (const inv of aliveInvaders) {
              if (
                (fleetDirRef.current === 1 && inv.x + 28 >= WIDTH - 16) ||
                (fleetDirRef.current === -1 && inv.x <= 16)
              ) {
                hitEdge = true;
                break;
              }
            }

            if (hitEdge) {
              fleetDirRef.current *= -1;
              for (const inv of aliveInvaders) {
                inv.y += 14;
                // Check if aliens reached bunkers or player level
                if (inv.y >= HEIGHT - 110) {
                  gameOverRef.current = true;
                  playSfx('hit');
                  playSfx('gameover');
                  onGameOver(score);
                  return;
                }
              }
            } else {
              for (const inv of aliveInvaders) {
                inv.x += fleetDirRef.current * 10;
              }
            }

            // Drop alien bombs
            alienBombTimerRef.current++;
            if (alienBombTimerRef.current >= 2 && Math.random() < 0.6) {
              alienBombTimerRef.current = 0;
              const randomInvader =
                aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
              if (randomInvader) {
                bulletsRef.current.push({
                  x: randomInvader.x + 12,
                  y: randomInvader.y + 18,
                  vy: 3.5,
                  fromPlayer: false,
                });
              }
            }
          }
        }

        // Mystery Ship logic
        if (!mysteryShipRef.current && Math.random() < 0.002) {
          mysteryShipRef.current = {
            x: -40,
            y: 35,
            vx: 1.8,
            alive: true,
            points: Math.floor(Math.random() * 3 + 1) * 100,
          };
        }

        if (mysteryShipRef.current) {
          const ship = mysteryShipRef.current;
          ship.x += ship.vx;
          if (ship.x > WIDTH + 50) {
            mysteryShipRef.current = null;
          }
        }

        // Bullet Collisions
        for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = bullets[bIdx];

          // 1. Bunker Collisions
          for (const block of bunkersRef.current) {
            if (
              block.alive &&
              b.x >= block.x &&
              b.x <= block.x + 6 &&
              b.y >= block.y &&
              b.y <= block.y + 6
            ) {
              block.alive = false;
              bullets.splice(bIdx, 1);
              createExplosion(block.x + 3, block.y + 3, '#10b981', 4);
              break;
            }
          }

          if (!bullets[bIdx]) continue;

          // 2. Player bullets hitting Aliens
          if (b.fromPlayer) {
            // Hit Mystery ship
            if (
              mysteryShipRef.current &&
              mysteryShipRef.current.alive &&
              b.x >= mysteryShipRef.current.x &&
              b.x <= mysteryShipRef.current.x + 36 &&
              b.y >= mysteryShipRef.current.y &&
              b.y <= mysteryShipRef.current.y + 16
            ) {
              createExplosion(
                mysteryShipRef.current.x + 18,
                mysteryShipRef.current.y + 8,
                '#f43f5e',
                20
              );
              playSfx('level');
              onTriggerScreenShake?.('subtle');
              onTriggerParticles?.('stars', 40);
              const addedPts = mysteryShipRef.current.points;
              setScore((s) => {
                const updated = s + addedPts;
                onScoreChange(updated);
                return updated;
              });
              mysteryShipRef.current = null;
              bullets.splice(bIdx, 1);
              continue;
            }

            // Hit invaders
            for (const inv of invadersRef.current) {
              if (
                inv.alive &&
                b.x >= inv.x &&
                b.x <= inv.x + 24 &&
                b.y >= inv.y &&
                b.y <= inv.y + 20
              ) {
                inv.alive = false;
                bullets.splice(bIdx, 1);
                createExplosion(inv.x + 12, inv.y + 10, '#38bdf8', 12);
                playSfx('hit');
                const added = inv.points;
                setScore((s) => {
                  const updated = s + added;
                  onScoreChange(updated);
                  return updated;
                });
                break;
              }
            }
          } else {
            // 3. Alien bullets hitting Player
            const px = playerXRef.current;
            const py = HEIGHT - 46;
            if (b.x >= px && b.x <= px + 32 && b.y >= py && b.y <= py + 18) {
              bullets.splice(bIdx, 1);
              createExplosion(px + 16, py + 9, '#ef4444', 24);
              playSfx('hit');

              setLives((prevLives) => {
                const newLives = prevLives - 1;
                if (newLives <= 0) {
                  gameOverRef.current = true;
                  playSfx('gameover');
                  onGameOver(score);
                }
                return newLives;
              });
            }
          }
        }
      }

      // Drawing Routine
      if (ctx && canvas) {
        // Space Background with stars
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 30; i++) {
          const sx = (i * 67) % WIDTH;
          const sy = (i * 83) % (HEIGHT - 100);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Draw Bunkers
        ctx.fillStyle = '#22c55e';
        for (const block of bunkersRef.current) {
          if (block.alive) {
            ctx.fillRect(block.x, block.y, 6, 6);
          }
        }

        // Draw Mystery UFO
        if (mysteryShipRef.current) {
          const ship = mysteryShipRef.current;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ship.x + 8, ship.y, 20, 6);
          ctx.fillRect(ship.x + 4, ship.y + 6, 28, 6);
          ctx.fillRect(ship.x, ship.y + 12, 36, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(ship.x + 10, ship.y + 4, 4, 3);
          ctx.fillRect(ship.x + 22, ship.y + 4, 4, 3);
        }

        // Draw Aliens
        const frame = animFrameIndexRef.current;
        for (const inv of invadersRef.current) {
          if (!inv.alive) continue;

          if (inv.type === 'squid') {
            ctx.fillStyle = '#c084fc'; // Purple
            ctx.fillRect(inv.x + 6, inv.y, 12, 4);
            ctx.fillRect(inv.x + 2, inv.y + 4, 20, 8);
            if (frame === 0) {
              ctx.fillRect(inv.x + 2, inv.y + 12, 4, 6);
              ctx.fillRect(inv.x + 18, inv.y + 12, 4, 6);
            } else {
              ctx.fillRect(inv.x + 6, inv.y + 12, 4, 6);
              ctx.fillRect(inv.x + 14, inv.y + 12, 4, 6);
            }
          } else if (inv.type === 'crab') {
            ctx.fillStyle = '#38bdf8'; // Cyan
            ctx.fillRect(inv.x + 4, inv.y, 16, 4);
            ctx.fillRect(inv.x, inv.y + 4, 24, 8);
            if (frame === 0) {
              ctx.fillRect(inv.x, inv.y + 12, 6, 6);
              ctx.fillRect(inv.x + 18, inv.y + 12, 6, 6);
            } else {
              ctx.fillRect(inv.x + 4, inv.y + 12, 6, 6);
              ctx.fillRect(inv.x + 14, inv.y + 12, 6, 6);
            }
          } else {
            ctx.fillStyle = '#4ade80'; // Green octopus
            ctx.fillRect(inv.x + 6, inv.y, 12, 4);
            ctx.fillRect(inv.x + 2, inv.y + 4, 20, 8);
            if (frame === 0) {
              ctx.fillRect(inv.x + 4, inv.y + 12, 4, 6);
              ctx.fillRect(inv.x + 16, inv.y + 12, 4, 6);
            } else {
              ctx.fillRect(inv.x + 1, inv.y + 12, 4, 6);
              ctx.fillRect(inv.x + 19, inv.y + 12, 4, 6);
            }
          }

          // Eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(inv.x + 6, inv.y + 5, 3, 3);
          ctx.fillRect(inv.x + 15, inv.y + 5, 3, 3);
        }

        // Draw Player Cannon
        const px = playerXRef.current;
        const py = HEIGHT - 46;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + 14, py - 6, 4, 6); // Cannon nozzle
        ctx.fillRect(px + 10, py, 12, 6);
        ctx.fillRect(px + 2, py + 6, 28, 10);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(px + 4, py + 8, 24, 3);

        // Draw Bullets
        for (const b of bulletsRef.current) {
          if (b.fromPlayer) {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#f87171';
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 6;
            ctx.fillRect(b.x - 1.5, b.y, 3, 8);
            ctx.shadowBlur = 0;
          }
        }

        // Draw Particles
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

        // Green base line
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, HEIGHT - 20, WIDTH, 2);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, onGameOver, onScoreChange, playSfx, score]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto select-none">
      {/* HUD Info */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/80 border border-slate-800 rounded text-xs font-retro">
        <span className="text-cyan-400">WAVE {wave}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">LIVES:</span>
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-emerald-400">▲</span>
          ))}
        </div>
        <span className="text-amber-400">PTS: {score}</span>
      </div>

      <div
        className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black w-full"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
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
