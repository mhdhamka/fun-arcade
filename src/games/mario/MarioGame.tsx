import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'question' | 'pipe' | 'empty';
  content?: 'coin' | 'mushroom' | 'empty';
  bumpOffset?: number;
}

interface Goomba {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  squashedTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const WIDTH = 384;
const HEIGHT = 512;
const GRAVITY = 0.42;
const JUMP_FORCE = -8.2;
const RUN_SPEED = 3.2;
const DASH_SPEED = 4.8;
const ACCEL = 0.25;
const FRICTION = 0.82;

export const MarioGame: React.FC<ArcadeGameProps> = ({
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

  // Game state
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  // Mario physics & state
  const marioXRef = useRef(40);
  const marioYRef = useRef(HEIGHT - 96);
  const marioVxRef = useRef(0);
  const marioVyRef = useRef(0);
  const isGroundedRef = useRef(false);
  const isFacingRightRef = useRef(true);
  const isSuperRef = useRef(false);
  const invulnerableRef = useRef(0);
  const walkFrameRef = useRef(0);
  const cameraXRef = useRef(0);
  const gameOverRef = useRef(false);
  const isDyingRef = useRef(false);
  const deathTimerRef = useRef(0);
  const stageClearRef = useRef(false);

  // Key tracking
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    jump: boolean;
    dash: boolean;
  }>({
    left: false,
    right: false,
    jump: false,
    dash: false,
  });

  // World elements
  const blocksRef = useRef<Block[]>([]);
  const goombasRef = useRef<Goomba[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<Popup[]>([]);
  const mushroomsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const flagpoleXRef = useRef(2400);

  // Initialize Level
  const initLevel = useCallback((lvl: number) => {
    marioXRef.current = 60;
    marioYRef.current = HEIGHT - 96;
    marioVxRef.current = 0;
    marioVyRef.current = 0;
    cameraXRef.current = 0;
    gameOverRef.current = false;
    isDyingRef.current = false;
    stageClearRef.current = false;
    invulnerableRef.current = 0;

    const blocks: Block[] = [];
    const goombas: Goomba[] = [];

    // Continuous ground with a few gaps
    for (let x = 0; x < 2600; x += 32) {
      if ((x > 500 && x < 580) || (x > 1200 && x < 1300) || (x > 1800 && x < 1900)) {
        continue; // pitfall
      }
      blocks.push({
        x,
        y: HEIGHT - 48,
        w: 32,
        h: 48,
        type: 'ground',
      });
    }

    // Question & Brick blocks clusters
    const blockLayout: { x: number; y: number; type: 'brick' | 'question'; content?: 'coin' | 'mushroom' }[] = [
      { x: 220, y: HEIGHT - 130, type: 'question', content: 'coin' },
      { x: 280, y: HEIGHT - 130, type: 'brick' },
      { x: 312, y: HEIGHT - 130, type: 'question', content: 'mushroom' },
      { x: 344, y: HEIGHT - 130, type: 'brick' },
      { x: 376, y: HEIGHT - 130, type: 'question', content: 'coin' },
      { x: 312, y: HEIGHT - 210, type: 'question', content: 'coin' },

      // Elevated brick runway
      { x: 700, y: HEIGHT - 130, type: 'brick' },
      { x: 732, y: HEIGHT - 130, type: 'question', content: 'coin' },
      { x: 764, y: HEIGHT - 130, type: 'brick' },
      { x: 796, y: HEIGHT - 130, type: 'brick' },
      { x: 828, y: HEIGHT - 130, type: 'question', content: 'coin' },

      // High pyramid blocks
      { x: 1000, y: HEIGHT - 120, type: 'brick' },
      { x: 1032, y: HEIGHT - 152, type: 'brick' },
      { x: 1064, y: HEIGHT - 184, type: 'question', content: 'mushroom' },
      { x: 1096, y: HEIGHT - 152, type: 'brick' },
      { x: 1128, y: HEIGHT - 120, type: 'brick' },

      // Second segment
      { x: 1400, y: HEIGHT - 130, type: 'question', content: 'coin' },
      { x: 1432, y: HEIGHT - 130, type: 'brick' },
      { x: 1464, y: HEIGHT - 130, type: 'question', content: 'coin' },
      { x: 1560, y: HEIGHT - 180, type: 'brick' },
      { x: 1592, y: HEIGHT - 180, type: 'brick' },
      { x: 1624, y: HEIGHT - 180, type: 'question', content: 'coin' },

      // Castle approach staircase
      { x: 2100, y: HEIGHT - 80, type: 'brick' },
      { x: 2132, y: HEIGHT - 112, type: 'brick' },
      { x: 2164, y: HEIGHT - 144, type: 'brick' },
      { x: 2196, y: HEIGHT - 176, type: 'brick' },
    ];

    blockLayout.forEach((b) => {
      blocks.push({
        x: b.x,
        y: b.y,
        w: 32,
        h: 32,
        type: b.type,
        content: b.content || 'empty',
        bumpOffset: 0,
      });
    });

    // Warp Pipes
    const pipes = [
      { x: 420, h: 64 },
      { x: 620, h: 84 },
      { x: 900, h: 96 },
      { x: 1350, h: 72 },
      { x: 1720, h: 88 },
      { x: 2000, h: 64 },
    ];

    pipes.forEach((p) => {
      blocks.push({
        x: p.x,
        y: HEIGHT - 48 - p.h,
        w: 48,
        h: p.h,
        type: 'pipe',
      });
    });

    // Goombas
    const goombaSpawns = [360, 480, 680, 840, 1050, 1420, 1600, 1780, 1950];
    goombaSpawns.forEach((gx, idx) => {
      goombas.push({
        id: idx,
        x: gx,
        y: HEIGHT - 76,
        vx: -1.0 - (lvl - 1) * 0.2,
        vy: 0,
        alive: true,
        squashedTimer: 0,
      });
    });

    blocksRef.current = blocks;
    goombasRef.current = goombas;
    mushroomsRef.current = [];
    particlesRef.current = [];
    popupsRef.current = [];
    flagpoleXRef.current = 2380;
  }, []);

  // Mount setup
  useEffect(() => {
    initLevel(level);
  }, [initLevel, level]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || gameOverRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        e.preventDefault();
        keysRef.current.jump = true;
      }
      if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') {
        keysRef.current.dash = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        keysRef.current.jump = false;
      }
      if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') {
        keysRef.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused]);

  // Virtual input synchronization
  useEffect(() => {
    if (!virtualInput) return;
    keysRef.current.left = virtualInput.left;
    keysRef.current.right = virtualInput.right;
    keysRef.current.jump = virtualInput.actionA || virtualInput.up;
    keysRef.current.dash = virtualInput.actionB;
  }, [virtualInput]);

  // Jump trigger
  const triggerJump = useCallback(() => {
    if (isGroundedRef.current && !isDyingRef.current) {
      marioVyRef.current = JUMP_FORCE - (keysRef.current.dash ? 0.8 : 0);
      isGroundedRef.current = false;
      playSfx('jump');

      // Dust puff
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: marioXRef.current + 12 + (Math.random() * 8 - 4),
          y: marioYRef.current + (isSuperRef.current ? 36 : 28),
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5,
          color: '#cbd5e1',
          size: 3,
          life: 0.6,
        });
      }
    }
  }, [playSfx]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      if (!isPaused) {
        // --- 1. UPDATE ---

        if (isDyingRef.current) {
          deathTimerRef.current++;
          marioVyRef.current += 0.35;
          marioYRef.current += marioVyRef.current;

          if (deathTimerRef.current > 75) {
            setLives((prev) => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                gameOverRef.current = true;
                playSfx('gameover');
                onGameOver(score);
              } else {
                initLevel(level);
              }
              return newLives;
            });
          }
        } else if (stageClearRef.current) {
          // Slide down flagpole and walk to castle
          marioXRef.current += 1.5;
          walkFrameRef.current += 0.15;
          if (marioXRef.current >= flagpoleXRef.current + 120) {
            // Stage completed
            const bonus = 1000;
            const finalScore = score + bonus;
            setScore(finalScore);
            onScoreChange(finalScore);
            onTriggerParticles?.('confetti', 100);
            playSfx('fanfare');
            onGameCompleted?.(finalScore, `WORLD 1-${level} CLEARED!`);
            setLevel((l) => l + 1);
            initLevel(level + 1);
          }
        } else {
          // Normal Mario Movement
          const targetMaxSpeed = keysRef.current.dash ? DASH_SPEED : RUN_SPEED;

          if (keysRef.current.left) {
            marioVxRef.current -= ACCEL;
            if (marioVxRef.current < -targetMaxSpeed) marioVxRef.current = -targetMaxSpeed;
            isFacingRightRef.current = false;
          } else if (keysRef.current.right) {
            marioVxRef.current += ACCEL;
            if (marioVxRef.current > targetMaxSpeed) marioVxRef.current = targetMaxSpeed;
            isFacingRightRef.current = true;
          } else {
            marioVxRef.current *= FRICTION;
            if (Math.abs(marioVxRef.current) < 0.05) marioVxRef.current = 0;
          }

          // Jump check
          if (keysRef.current.jump) {
            triggerJump();
          }

          // Gravity
          marioVyRef.current += GRAVITY;
          if (marioVyRef.current > 11) marioVyRef.current = 11;

          // Tentative positions
          const nextX = marioXRef.current + marioVxRef.current;
          const nextY = marioYRef.current + marioVyRef.current;
          const mWidth = 24;
          const mHeight = isSuperRef.current ? 38 : 28;

          // Prevent moving left past camera
          if (nextX < cameraXRef.current + 8) {
            marioXRef.current = cameraXRef.current + 8;
            marioVxRef.current = 0;
          } else {
            marioXRef.current = nextX;
          }

          // Update animation step
          if (isGroundedRef.current && Math.abs(marioVxRef.current) > 0.2) {
            walkFrameRef.current += Math.abs(marioVxRef.current) * 0.08;
          }

          // Invulnerability timer
          if (invulnerableRef.current > 0) {
            invulnerableRef.current--;
          }

          // Horizontal & Vertical Block Collisions
          isGroundedRef.current = false;

          for (const block of blocksRef.current) {
            // Check vertical collision
            if (
              marioXRef.current + mWidth > block.x + 2 &&
              marioXRef.current < block.x + block.w - 2
            ) {
              // Landing on top
              if (
                marioVyRef.current >= 0 &&
                marioYRef.current + mHeight <= block.y + 12 &&
                nextY + mHeight >= block.y
              ) {
                marioYRef.current = block.y - mHeight;
                marioVyRef.current = 0;
                isGroundedRef.current = true;
              }
              // Hitting block from underneath
              else if (
                marioVyRef.current < 0 &&
                marioYRef.current >= block.y + block.h - 10 &&
                nextY <= block.y + block.h
              ) {
                marioYRef.current = block.y + block.h;
                marioVyRef.current = 0.5;

                // Hit block effect!
                if (block.type === 'question' && block.content !== 'empty') {
                  playSfx('point');
                  onTriggerScreenShake?.('subtle');
                  block.bumpOffset = -8;

                  if (block.content === 'coin') {
                    setCoins((c) => c + 1);
                    setScore((s) => {
                      const ns = s + 100;
                      onScoreChange(ns);
                      return ns;
                    });
                    popupsRef.current.push({
                      x: block.x + 8,
                      y: block.y - 12,
                      text: '+100',
                      color: '#facc15',
                      life: 1.0,
                    });
                    block.type = 'empty';
                  } else if (block.content === 'mushroom') {
                    mushroomsRef.current.push({
                      x: block.x + 4,
                      y: block.y - 28,
                      vx: 1.2,
                      vy: -2.5,
                    });
                    block.type = 'empty';
                  }
                } else if (block.type === 'brick') {
                  playSfx('hit');
                  block.bumpOffset = -5;
                  // Brick debris
                  for (let d = 0; d < 4; d++) {
                    particlesRef.current.push({
                      x: block.x + 16,
                      y: block.y + 16,
                      vx: (d % 2 === 0 ? -1 : 1) * (2 + Math.random() * 2),
                      vy: -3 - Math.random() * 3,
                      color: '#b45309',
                      size: 4,
                      life: 0.8,
                    });
                  }
                }
              }
            }

            // Check lateral collision
            if (
              marioYRef.current + mHeight > block.y + 4 &&
              marioYRef.current < block.y + block.h - 4
            ) {
              if (
                marioVxRef.current > 0 &&
                marioXRef.current + mWidth >= block.x &&
                marioXRef.current < block.x
              ) {
                marioXRef.current = block.x - mWidth;
                marioVxRef.current = 0;
              } else if (
                marioVxRef.current < 0 &&
                marioXRef.current <= block.x + block.w &&
                marioXRef.current + mWidth > block.x + block.w
              ) {
                marioXRef.current = block.x + block.w;
                marioVxRef.current = 0;
              }
            }
          }

          if (!isGroundedRef.current) {
            marioYRef.current = nextY;
          }

          // Fall into pit
          if (marioYRef.current > HEIGHT + 20) {
            isDyingRef.current = true;
            deathTimerRef.current = 0;
            marioVyRef.current = -7.5;
            playSfx('hit');
            onTriggerScreenShake?.('intense');
          }

          // Smooth Camera tracking (Mario stays roughly in the center-left)
          const targetCamX = Math.max(0, marioXRef.current - WIDTH * 0.38);
          cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;

          // Update mushrooms
          for (let m = mushroomsRef.current.length - 1; m >= 0; m--) {
            const shroom = mushroomsRef.current[m];
            shroom.vy += GRAVITY;
            shroom.x += shroom.vx;
            shroom.y += shroom.vy;

            // Ground collision
            for (const b of blocksRef.current) {
              if (
                shroom.x + 20 > b.x &&
                shroom.x < b.x + b.w &&
                shroom.y + 20 >= b.y &&
                shroom.y <= b.y + 10
              ) {
                shroom.y = b.y - 20;
                shroom.vy = 0;
              }
            }

            // Check Mario collected mushroom
            if (
              marioXRef.current + mWidth > shroom.x &&
              marioXRef.current < shroom.x + 20 &&
              marioYRef.current + mHeight > shroom.y &&
              marioYRef.current < shroom.y + 20
            ) {
              mushroomsRef.current.splice(m, 1);
              isSuperRef.current = true;
              playSfx('level');
              onTriggerParticles?.('stars', 30);
              setScore((s) => {
                const ns = s + 1000;
                onScoreChange(ns);
                return ns;
              });
              popupsRef.current.push({
                x: marioXRef.current,
                y: marioYRef.current - 15,
                text: 'SUPER! +1000',
                color: '#ef4444',
                life: 1.2,
              });
            }
          }

          // Update Goombas
          goombasRef.current.forEach((g) => {
            if (!g.alive) {
              if (g.squashedTimer > 0) g.squashedTimer--;
              return;
            }

            // Patrol movement
            g.x += g.vx;

            // Reverse when hitting pipes or edges
            blocksRef.current.forEach((b) => {
              if (
                b.type === 'pipe' &&
                g.y + 24 > b.y &&
                g.y < b.y + b.h &&
                ((g.vx > 0 && g.x + 24 >= b.x && g.x < b.x) ||
                  (g.vx < 0 && g.x <= b.x + b.w && g.x + 24 > b.x + b.w))
              ) {
                g.vx = -g.vx;
              }
            });

            // Mario vs Goomba collision
            if (
              marioXRef.current + mWidth > g.x + 4 &&
              marioXRef.current < g.x + 20 &&
              marioYRef.current + mHeight > g.y + 2 &&
              marioYRef.current < g.y + 24
            ) {
              // Stomping Goomba from top
              if (marioVyRef.current > 0 && marioYRef.current + mHeight <= g.y + 12) {
                g.alive = false;
                g.squashedTimer = 25;
                marioVyRef.current = JUMP_FORCE * 0.75; // bounce upward!
                playSfx('hit');
                onTriggerScreenShake?.('subtle');

                setScore((s) => {
                  const ns = s + 200;
                  onScoreChange(ns);
                  return ns;
                });

                popupsRef.current.push({
                  x: g.x,
                  y: g.y - 10,
                  text: '+200',
                  color: '#fbbf24',
                  life: 0.9,
                });

                // Stomp particles
                for (let p = 0; p < 6; p++) {
                  particlesRef.current.push({
                    x: g.x + 12,
                    y: g.y + 12,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2,
                    color: '#b45309',
                    size: 3,
                    life: 0.6,
                  });
                }
              }
              // Getting damaged
              else if (invulnerableRef.current === 0) {
                if (isSuperRef.current) {
                  isSuperRef.current = false;
                  invulnerableRef.current = 60;
                  playSfx('hit');
                  onTriggerScreenShake?.('subtle');
                } else {
                  isDyingRef.current = true;
                  deathTimerRef.current = 0;
                  marioVyRef.current = -7.5;
                  playSfx('hit');
                  onTriggerScreenShake?.('intense');
                }
              }
            }
          });

          // Flagpole trigger
          if (marioXRef.current >= flagpoleXRef.current && !stageClearRef.current) {
            stageClearRef.current = true;
            playSfx('fanfare');
            onTriggerScreenShake?.('subtle');
            onTriggerParticles?.('fireworks', 50);
          }
        }

        // Block bump bounce relaxation
        blocksRef.current.forEach((b) => {
          if (b.bumpOffset && b.bumpOffset < 0) {
            b.bumpOffset += 1;
          }
        });

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03;
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Update popups
        for (let i = popupsRef.current.length - 1; i >= 0; i--) {
          const pop = popupsRef.current[i];
          pop.y -= 0.8;
          pop.life -= 0.025;
          if (pop.life <= 0) {
            popupsRef.current.splice(i, 1);
          }
        }

        // --- 2. RENDER ---
        ctx.save();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Sky backdrop (Classic 8-bit NES Cyan Blue)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        skyGrad.addColorStop(0, '#5c94fc');
        skyGrad.addColorStop(1, '#92beff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.translate(-cameraXRef.current, 0);

        // Distant Hills and Clouds (Parallax effect)
        for (let c = 0; c < 15; c++) {
          const cloudX = c * 240 + 60;
          const cloudY = 70 + (c % 3) * 30;

          // Fluffy white cloud
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, 18, 0, Math.PI * 2);
          ctx.arc(cloudX + 22, cloudY - 6, 22, 0, Math.PI * 2);
          ctx.arc(cloudX + 44, cloudY, 18, 0, Math.PI * 2);
          ctx.fill();

          // Green hills in background
          const hillX = c * 380 + 100;
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.arc(hillX, HEIGHT - 48, 80, Math.PI, 0);
          ctx.fill();
          // Hill highlight
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(hillX - 8, HEIGHT - 54, 70, Math.PI * 1.1, Math.PI * 1.9);
          ctx.fill();
        }

        // Render Blocks
        blocksRef.current.forEach((b) => {
          // Cull off-screen blocks
          if (b.x + b.w < cameraXRef.current - 50 || b.x > cameraXRef.current + WIDTH + 50) {
            return;
          }

          const drawY = b.y + (b.bumpOffset || 0);

          if (b.type === 'ground') {
            // Brown earth with green grass cap
            ctx.fillStyle = '#9a3412';
            ctx.fillRect(b.x, drawY, b.w, b.h);
            // Grass strip
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(b.x, drawY, b.w, 6);
            ctx.fillStyle = '#15803d';
            ctx.fillRect(b.x, drawY + 6, b.w, 2);
            // Brick grout
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, drawY, b.w, b.h);
          } else if (b.type === 'brick') {
            // Classic red-orange brick
            ctx.fillStyle = '#c2410c';
            ctx.fillRect(b.x, drawY, b.w, b.h);
            ctx.strokeStyle = '#431407';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(b.x, drawY, b.w, b.h);
            // Brick pattern
            ctx.beginPath();
            ctx.moveTo(b.x, drawY + 16);
            ctx.lineTo(b.x + b.w, drawY + 16);
            ctx.moveTo(b.x + 16, drawY);
            ctx.lineTo(b.x + 16, drawY + 16);
            ctx.moveTo(b.x + 8, drawY + 16);
            ctx.lineTo(b.x + 8, drawY + 32);
            ctx.moveTo(b.x + 24, drawY + 16);
            ctx.lineTo(b.x + 24, drawY + 32);
            ctx.stroke();
          } else if (b.type === 'question') {
            // Golden pulsing question block
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(b.x, drawY, b.w, b.h);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, drawY, b.w, b.h);

            // Inner bevel
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(b.x + 3, drawY + 3, b.w - 6, 3);
            ctx.fillRect(b.x + 3, drawY + 3, 3, b.h - 6);

            // Bold Question Mark '?'
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('?', b.x + 16, drawY + 23);
          } else if (b.type === 'empty') {
            // Spent brown metallic block
            ctx.fillStyle = '#78350f';
            ctx.fillRect(b.x, drawY, b.w, b.h);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, drawY, b.w, b.h);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(b.x + 4, drawY + 4, 3, 3);
            ctx.fillRect(b.x + b.w - 7, drawY + 4, 3, 3);
            ctx.fillRect(b.x + 4, drawY + b.h - 7, 3, 3);
            ctx.fillRect(b.x + b.w - 7, drawY + b.h - 7, 3, 3);
          } else if (b.type === 'pipe') {
            // Green warp pipe
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(b.x, drawY, b.w, b.h);

            // Pipe top lip rim
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(b.x - 3, drawY, b.w + 6, 18);
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x - 3, drawY, b.w + 6, 18);
            ctx.strokeRect(b.x, drawY + 18, b.w, b.h - 18);

            // Pipe shine highlight
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(b.x + 4, drawY + 18, 5, b.h - 18);
            ctx.fillRect(b.x + 2, drawY + 2, 6, 14);
          }
        });

        // Render Flagpole & Castle
        const flagX = flagpoleXRef.current;
        // Flagpole base
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(flagX - 10, HEIGHT - 76, 26, 28);
        ctx.strokeStyle = '#14532d';
        ctx.strokeRect(flagX - 10, HEIGHT - 76, 26, 28);

        // Tall metal pole
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(flagX, HEIGHT - 330, 6, 254);
        // Golden sphere top
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(flagX + 3, HEIGHT - 332, 8, 0, Math.PI * 2);
        ctx.fill();

        // Triangular goal flag
        const flagSlideY = stageClearRef.current ? HEIGHT - 110 : HEIGHT - 320;
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(flagX + 6, flagSlideY);
        ctx.lineTo(flagX + 38, flagSlideY + 14);
        ctx.lineTo(flagX + 6, flagSlideY + 28);
        ctx.closePath();
        ctx.fill();

        // Peach's Castle at the end
        const castleX = flagX + 90;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(castleX, HEIGHT - 180, 110, 132);
        // Castle battlements
        ctx.fillRect(castleX - 6, HEIGHT - 196, 24, 20);
        ctx.fillRect(castleX + 43, HEIGHT - 196, 24, 20);
        ctx.fillRect(castleX + 92, HEIGHT - 196, 24, 20);
        // Castle door entrance
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(castleX + 55, HEIGHT - 84, 18, Math.PI, 0);
        ctx.rect(castleX + 37, HEIGHT - 84, 36, 36);
        ctx.fill();

        // Render Mushrooms
        mushroomsRef.current.forEach((m) => {
          // Cap
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(m.x + 10, m.y + 8, 10, Math.PI, 0);
          ctx.fill();
          // White polka dots
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(m.x + 10, m.y + 4, 3, 0, Math.PI * 2);
          ctx.arc(m.x + 4, m.y + 7, 2, 0, Math.PI * 2);
          ctx.arc(m.x + 16, m.y + 7, 2, 0, Math.PI * 2);
          ctx.fill();
          // Stem
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(m.x + 4, m.y + 8, 12, 10);
        });

        // Render Goombas
        goombasRef.current.forEach((g) => {
          if (!g.alive && g.squashedTimer <= 0) return;

          if (!g.alive) {
            // Squashed Goomba
            ctx.fillStyle = '#9a3412';
            ctx.fillRect(g.x, g.y + 14, 24, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(g.x + 5, g.y + 16, 4, 3);
            ctx.fillRect(g.x + 15, g.y + 16, 4, 3);
          } else {
            // Brown mushroom body
            ctx.fillStyle = '#9a3412';
            ctx.beginPath();
            ctx.arc(g.x + 12, g.y + 10, 11, Math.PI, 0);
            ctx.rect(g.x + 1, g.y + 10, 22, 6);
            ctx.fill();

            // Face
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(g.x + 4, g.y + 12, 16, 8);

            // Mean angled eyebrows & eyes
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(g.x + 6, g.y + 13, 3, 5);
            ctx.fillRect(g.x + 15, g.y + 13, 3, 5);

            // Wobbly feet
            const footWalk = Math.sin(Date.now() * 0.015 + g.id) * 3;
            ctx.fillStyle = '#000000';
            ctx.fillRect(g.x + 2 + footWalk, g.y + 18, 7, 5);
            ctx.fillRect(g.x + 15 - footWalk, g.y + 18, 7, 5);
          }
        });

        // Render Mario!
        if (invulnerableRef.current % 4 < 2) {
          const mx = marioXRef.current;
          const my = marioYRef.current;
          const isSuper = isSuperRef.current;

          ctx.save();
          if (!isFacingRightRef.current) {
            ctx.translate(mx + 24, my);
            ctx.scale(-1, 1);
          } else {
            ctx.translate(mx, my);
          }

          if (isDyingRef.current) {
            // Death hop pose
            ctx.fillStyle = '#ef4444'; // Red cap
            ctx.fillRect(2, 0, 16, 6);
            ctx.fillStyle = '#fed7aa'; // Face
            ctx.fillRect(4, 6, 12, 6);
            ctx.fillStyle = '#2563eb'; // Blue overalls
            ctx.fillRect(2, 12, 16, 12);
          } else {
            // Mario Pixel Art Sprite
            // 1. Red Cap
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(2, 0, 16, 5);
            ctx.fillRect(0, 5, 20, 3);

            // 2. Face & Nose
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(2, 8, 14, 8);
            ctx.fillRect(16, 10, 5, 4); // Big nose

            // 3. Eye & Mustache & Sideburn
            ctx.fillStyle = '#451a03';
            ctx.fillRect(12, 8, 3, 4); // Eye
            ctx.fillRect(10, 13, 10, 3); // Mustache
            ctx.fillRect(2, 8, 4, 6); // Sideburn

            // 4. Red Shirt / Arms
            ctx.fillStyle = '#ef4444';
            const armSwing = Math.sin(walkFrameRef.current) * 4;
            ctx.fillRect(2, 16, 16, 6);
            ctx.fillRect(isGroundedRef.current ? 0 : -2, 16 + (isGroundedRef.current ? armSwing : -6), 4, 6);

            // 5. Blue Overalls & Yellow Buttons
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(4, 20, 14, isSuper ? 14 : 6);
            // Yellow suspender button
            ctx.fillStyle = '#facc15';
            ctx.fillRect(7, 21, 2, 2);
            ctx.fillRect(13, 21, 2, 2);

            // 6. Brown Boots / Legs
            const legSwing = Math.sin(walkFrameRef.current) * 5;
            ctx.fillStyle = '#78350f';
            if (!isGroundedRef.current) {
              // Jumping pose: one leg up, one extended
              ctx.fillRect(2, isSuper ? 34 : 26, 7, 5);
              ctx.fillRect(12, isSuper ? 30 : 22, 8, 5);
            } else {
              ctx.fillRect(2 + legSwing, isSuper ? 34 : 26, 7, 5);
              ctx.fillRect(12 - legSwing, isSuper ? 34 : 26, 7, 5);
            }
          }
          ctx.restore();
        }

        // Render Particles
        particlesRef.current.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        // Render Floating Score Popups
        popupsRef.current.forEach((pop) => {
          ctx.fillStyle = pop.color;
          ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.globalAlpha = Math.max(0, pop.life);
          ctx.fillText(pop.text, pop.x, pop.y);
        });
        ctx.globalAlpha = 1.0;

        ctx.restore(); // Restore camera translation

        // --- 3. HUD (Fixed on screen) ---
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';

        // MARIO score
        ctx.fillText('MARIO', 16, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillText(score.toString().padStart(6, '0'), 16, 36);

        // COINS
        ctx.fillStyle = '#facc15';
        ctx.fillText(`● x${coins.toString().padStart(2, '0')}`, 130, 36);

        // WORLD
        ctx.fillStyle = '#ffffff';
        ctx.fillText('WORLD', 230, 22);
        ctx.fillText(`1-${level}`, 240, 36);

        // LIVES
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`♥ x${lives}`, 320, 36);

        // Pause Overlay
        if (isPaused) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '16px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('GAME PAUSED', WIDTH / 2, HEIGHT / 2);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPaused,
    score,
    coins,
    lives,
    level,
    triggerJump,
    onScoreChange,
    onGameOver,
    onTriggerScreenShake,
    onTriggerParticles,
    onGameCompleted,
    playSfx,
    initLevel,
  ]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="max-w-full max-h-full object-contain rounded shadow-2xl"
      />
    </div>
  );
};