import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

interface Block {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  type: 'wood' | 'stone' | 'ice' | 'tnt';
  health: number;
  maxHealth: number;
}

interface Pig {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alive: boolean;
  hasHelmet?: boolean;
}

interface Bird {
  type: 'red' | 'yellow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  state: 'idle' | 'aiming' | 'flying' | 'dead';
  abilityUsed: boolean;
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
const GRAVITY = 0.28;
const SLING_X = 85;
const SLING_Y = 370;
const MAX_PULL = 68;

export const AngryBirdsGame: React.FC<ArcadeGameProps> = ({
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
  const [level, setLevel] = useState(1);
  const [birdsRemaining, setBirdsRemaining] = useState(4);

  // Active Bird state
  const activeBirdRef = useRef<Bird>({
    type: 'red',
    x: SLING_X,
    y: SLING_Y,
    vx: 0,
    vy: 0,
    radius: 12,
    state: 'idle',
    abilityUsed: false,
  });

  // Pull vector for slingshot
  const pullRef = useRef({ x: 0, y: 0, isDragging: false });
  const keyAimRef = useRef({ angle: -35, power: 45 }); // For gamepad/keyboard control
  const birdsQueueRef = useRef<('red' | 'yellow')[]>(['red', 'yellow', 'red', 'yellow']);
  const blocksRef = useRef<Block[]>([]);
  const pigsRef = useRef<Pig[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<Popup[]>([]);
  const flightTimerRef = useRef(0);
  const gameOverRef = useRef(false);
  const levelTransitionRef = useRef(false);

  // Level Generator
  const initLevel = useCallback((lvl: number) => {
    levelTransitionRef.current = false;
    birdsQueueRef.current = lvl % 2 === 1 ? ['red', 'yellow', 'red', 'yellow'] : ['yellow', 'red', 'yellow', 'red'];
    setBirdsRemaining(birdsQueueRef.current.length);

    activeBirdRef.current = {
      type: birdsQueueRef.current[0],
      x: SLING_X,
      y: SLING_Y,
      vx: 0,
      vy: 0,
      radius: 12,
      state: 'idle',
      abilityUsed: false,
    };
    pullRef.current = { x: 0, y: 0, isDragging: false };

    const blocks: Block[] = [];
    const pigs: Pig[] = [];

    const groundY = 440;

    if (lvl === 1) {
      // Classic 2-pillar structure
      // Left wooden column
      blocks.push({
        id: 1,
        x: 240,
        y: groundY - 60,
        w: 16,
        h: 60,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'wood',
        health: 20,
        maxHealth: 20,
      });
      // Right wooden column
      blocks.push({
        id: 2,
        x: 310,
        y: groundY - 60,
        w: 16,
        h: 60,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'wood',
        health: 20,
        maxHealth: 20,
      });
      // Crossbeam plank
      blocks.push({
        id: 3,
        x: 230,
        y: groundY - 76,
        w: 106,
        h: 16,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'wood',
        health: 20,
        maxHealth: 20,
      });
      // Top ice pillar
      blocks.push({
        id: 4,
        x: 275,
        y: groundY - 120,
        w: 16,
        h: 44,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'ice',
        health: 12,
        maxHealth: 12,
      });

      // Ground Pig inside shelter
      pigs.push({
        id: 1,
        x: 275,
        y: groundY - 14,
        radius: 14,
        vx: 0,
        vy: 0,
        alive: true,
      });
      // Top Pig
      pigs.push({
        id: 2,
        x: 283,
        y: groundY - 134,
        radius: 12,
        vx: 0,
        vy: 0,
        alive: true,
      });
    } else if (lvl === 2) {
      // Stone Bunker with TNT
      // Stone bases
      blocks.push({
        id: 10,
        x: 230,
        y: groundY - 48,
        w: 32,
        h: 48,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'stone',
        health: 45,
        maxHealth: 45,
      });
      blocks.push({
        id: 11,
        x: 320,
        y: groundY - 48,
        w: 32,
        h: 48,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'stone',
        health: 45,
        maxHealth: 45,
      });
      // TNT crate in the center
      blocks.push({
        id: 12,
        x: 275,
        y: groundY - 28,
        w: 28,
        h: 28,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'tnt',
        health: 5,
        maxHealth: 5,
      });
      // Stone Slab on top
      blocks.push({
        id: 13,
        x: 220,
        y: groundY - 64,
        w: 140,
        h: 16,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'stone',
        health: 45,
        maxHealth: 45,
      });
      // Top Wooden Columns
      blocks.push({
        id: 14,
        x: 250,
        y: groundY - 114,
        w: 16,
        h: 50,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'wood',
        health: 20,
        maxHealth: 20,
      });
      blocks.push({
        id: 15,
        x: 310,
        y: groundY - 114,
        w: 16,
        h: 50,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        type: 'wood',
        health: 20,
        maxHealth: 20,
      });

      // Helmet Pig on upper floor
      pigs.push({
        id: 21,
        x: 288,
        y: groundY - 78,
        radius: 14,
        vx: 0,
        vy: 0,
        alive: true,
        hasHelmet: true,
      });
      // Side Pig
      pigs.push({
        id: 22,
        x: 288,
        y: groundY - 128,
        radius: 12,
        vx: 0,
        vy: 0,
        alive: true,
      });
    } else {
      // High Skyscraper tower with multi-tier ice & wood
      const tiers = [0, 50, 100, 150];
      tiers.forEach((ty, idx) => {
        blocks.push({
          id: 30 + idx * 2,
          x: 260,
          y: groundY - ty - 45,
          w: 14,
          h: 45,
          vx: 0,
          vy: 0,
          angle: 0,
          vAngle: 0,
          type: idx % 2 === 0 ? 'wood' : 'ice',
          health: 18,
          maxHealth: 18,
        });
        blocks.push({
          id: 31 + idx * 2,
          x: 315,
          y: groundY - ty - 45,
          w: 14,
          h: 45,
          vx: 0,
          vy: 0,
          angle: 0,
          vAngle: 0,
          type: idx % 2 === 0 ? 'wood' : 'ice',
          health: 18,
          maxHealth: 18,
        });
        blocks.push({
          id: 40 + idx,
          x: 250,
          y: groundY - ty - 56,
          w: 90,
          h: 12,
          vx: 0,
          vy: 0,
          angle: 0,
          vAngle: 0,
          type: 'wood',
          health: 18,
          maxHealth: 18,
        });
      });

      // Pigs on tiers
      pigs.push({ id: 50, x: 294, y: groundY - 14, radius: 13, vx: 0, vy: 0, alive: true });
      pigs.push({ id: 51, x: 294, y: groundY - 70, radius: 13, vx: 0, vy: 0, alive: true });
      pigs.push({ id: 52, x: 294, y: groundY - 170, radius: 14, vx: 0, vy: 0, alive: true, hasHelmet: true });
    }

    blocksRef.current = blocks;
    pigsRef.current = pigs;
    particlesRef.current = [];
    popupsRef.current = [];
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [initLevel, level]);

  // Launch Bird
  const launchBird = useCallback(
    (pullX: number, pullY: number) => {
      const bird = activeBirdRef.current;
      if (bird.state !== 'idle' && bird.state !== 'aiming') return;

      // Invert pull vector to get launch velocity
      const power = 0.16;
      bird.vx = -pullX * power;
      bird.vy = -pullY * power;
      bird.state = 'flying';
      flightTimerRef.current = 0;
      pullRef.current = { x: 0, y: 0, isDragging: false };

      playSfx('jump');
      onTriggerScreenShake?.('subtle');

      // Feathers launch puff
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: SLING_X,
          y: SLING_Y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          color: bird.type === 'yellow' ? '#eab308' : '#ef4444',
          size: 3,
          life: 0.8,
        });
      }
    },
    [onTriggerScreenShake, playSfx]
  );

  // Trigger special airborne ability
  const triggerSpecialAbility = useCallback(() => {
    const bird = activeBirdRef.current;
    if (bird.state === 'flying' && !bird.abilityUsed) {
      bird.abilityUsed = true;

      if (bird.type === 'yellow') {
        // Yellow Chuck Turbo Dash!
        bird.vx *= 2.2;
        bird.vy *= 0.6;
        playSfx('laser');
        onTriggerScreenShake?.('intense');

        // Speed burst particles
        for (let i = 0; i < 15; i++) {
          particlesRef.current.push({
            x: bird.x - 10,
            y: bird.y + (Math.random() * 8 - 4),
            vx: -Math.random() * 4 - 2,
            vy: (Math.random() - 0.5) * 2,
            color: '#fbbf24',
            size: 4,
            life: 0.9,
          });
        }
      } else {
        // Red Bird shockwave ground pound!
        bird.vy += 3.5;
        playSfx('hit');
        onTriggerScreenShake?.('subtle');
      }
    }
  }, [onTriggerScreenShake, playSfx]);

  // Mouse & Touch drag handling on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || gameOverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (activeBirdRef.current.state === 'flying') {
      triggerSpecialAbility();
      return;
    }

    if (activeBirdRef.current.state === 'idle') {
      pullRef.current.isDragging = true;
      activeBirdRef.current.state = 'aiming';
      handlePointerMove(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pullRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    let dx = currentX - SLING_X;
    let dy = currentY - SLING_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_PULL) {
      dx = (dx / dist) * MAX_PULL;
      dy = (dy / dist) * MAX_PULL;
    }

    pullRef.current.x = dx;
    pullRef.current.y = dy;
    activeBirdRef.current.x = SLING_X + dx;
    activeBirdRef.current.y = SLING_Y + dy;
  };

  const handlePointerUp = () => {
    if (pullRef.current.isDragging) {
      pullRef.current.isDragging = false;
      const pullX = pullRef.current.x;
      const pullY = pullRef.current.y;
      const dist = Math.sqrt(pullX * pullX + pullY * pullY);

      if (dist > 12) {
        launchBird(pullX, pullY);
      } else {
        // Reset to slingshot rest position
        activeBirdRef.current.state = 'idle';
        activeBirdRef.current.x = SLING_X;
        activeBirdRef.current.y = SLING_Y;
        pullRef.current = { x: 0, y: 0, isDragging: false };
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || gameOverRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keyAimRef.current.angle = Math.max(-80, keyAimRef.current.angle - 3);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        keyAimRef.current.angle = Math.min(10, keyAimRef.current.angle + 3);
      }
      if (e.key === 'ArrowUp' || e.key === 'w') {
        keyAimRef.current.power = Math.min(MAX_PULL, keyAimRef.current.power + 4);
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        keyAimRef.current.power = Math.max(15, keyAimRef.current.power - 4);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeBirdRef.current.state === 'idle') {
          // Launch using keyAim
          const rad = (keyAimRef.current.angle * Math.PI) / 180;
          const px = -Math.cos(rad) * keyAimRef.current.power;
          const py = Math.sin(rad) * keyAimRef.current.power;
          launchBird(px, py);
        } else if (activeBirdRef.current.state === 'flying') {
          triggerSpecialAbility();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, launchBird, triggerSpecialAbility]);

  // Virtual controller listener
  useEffect(() => {
    if (!virtualInput) return;
    if (virtualInput.left) {
      keyAimRef.current.angle = Math.max(-80, keyAimRef.current.angle - 4);
    }
    if (virtualInput.right) {
      keyAimRef.current.angle = Math.min(10, keyAimRef.current.angle + 4);
    }
    if (virtualInput.up) {
      keyAimRef.current.power = Math.min(MAX_PULL, keyAimRef.current.power + 5);
    }
    if (virtualInput.down) {
      keyAimRef.current.power = Math.max(15, keyAimRef.current.power - 5);
    }
    if (virtualInput.actionA) {
      if (activeBirdRef.current.state === 'idle') {
        const rad = (keyAimRef.current.angle * Math.PI) / 180;
        const px = -Math.cos(rad) * keyAimRef.current.power;
        const py = Math.sin(rad) * keyAimRef.current.power;
        launchBird(px, py);
      } else if (activeBirdRef.current.state === 'flying') {
        triggerSpecialAbility();
      }
    }
    if (virtualInput.actionB) {
      triggerSpecialAbility();
    }
  }, [virtualInput, launchBird, triggerSpecialAbility]);

  // Advance to next bird or check win/loss
  const advanceTurn = useCallback(() => {
    // Check if all pigs are dead
    const alivePigs = pigsRef.current.filter((p) => p.alive);
    if (alivePigs.length === 0 && !levelTransitionRef.current) {
      levelTransitionRef.current = true;
      playSfx('fanfare');
      onTriggerScreenShake?.('subtle');
      onTriggerParticles?.('fireworks', 80);

      const levelClearBonus = 5000 + birdsQueueRef.current.length * 2000;
      setScore((s) => {
        const ns = s + levelClearBonus;
        onScoreChange(ns);
        return ns;
      });

      popupsRef.current.push({
        x: WIDTH / 2,
        y: HEIGHT / 2 - 30,
        text: `LEVEL CLEARED! +${levelClearBonus}`,
        color: '#22c55e',
        life: 2.0,
      });

      onGameCompleted?.(score + levelClearBonus, `FORTRESS ${level} DESTROYED!`);

      setTimeout(() => {
        setLevel((lvl) => lvl + 1);
        initLevel(level + 1);
      }, 2000);
      return;
    }

    // Remove current bird from queue
    birdsQueueRef.current.shift();
    setBirdsRemaining(birdsQueueRef.current.length);

    if (birdsQueueRef.current.length > 0) {
      // Setup next bird
      activeBirdRef.current = {
        type: birdsQueueRef.current[0],
        x: SLING_X,
        y: SLING_Y,
        vx: 0,
        vy: 0,
        radius: 12,
        state: 'idle',
        abilityUsed: false,
      };
    } else {
      // Out of birds!
      if (alivePigs.length > 0) {
        gameOverRef.current = true;
        playSfx('gameover');
        onGameOver(score);
      }
    }
  }, [initLevel, level, onGameCompleted, onGameOver, onScoreChange, onTriggerParticles, onTriggerScreenShake, playSfx, score]);

  // Trigger TNT explosion
  const explodeTNT = useCallback(
    (tx: number, ty: number) => {
      playSfx('hit');
      onTriggerScreenShake?.('intense');
      onTriggerParticles?.('stars', 60);

      // Huge explosion particles
      for (let p = 0; p < 35; p++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 3;
        particlesRef.current.push({
          x: tx,
          y: ty,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: p % 3 === 0 ? '#ef4444' : p % 2 === 0 ? '#f97316' : '#fde047',
          size: Math.random() * 5 + 3,
          life: 1.2,
        });
      }

      popupsRef.current.push({
        x: tx,
        y: ty - 20,
        text: 'BOOM! +3000',
        color: '#f97316',
        life: 1.2,
      });

      setScore((s) => {
        const ns = s + 3000;
        onScoreChange(ns);
        return ns;
      });

      // Blast nearby blocks
      blocksRef.current.forEach((b) => {
        const dx = b.x + b.w / 2 - tx;
        const dy = b.y + b.h / 2 - ty;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          const force = (120 - d) / 12;
          b.vx += (dx / d) * force;
          b.vy += (dy / d) * force - 3;
          b.health -= 35;
        }
      });

      // Blast nearby pigs
      pigsRef.current.forEach((pig) => {
        if (!pig.alive) return;
        const dx = pig.x - tx;
        const dy = pig.y - ty;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          pig.alive = false;
          playSfx('point');
          popupsRef.current.push({
            x: pig.x,
            y: pig.y - 12,
            text: '+5000',
            color: '#22c55e',
            life: 1.0,
          });
          setScore((s) => {
            const ns = s + 5000;
            onScoreChange(ns);
            return ns;
          });
        }
      });
    },
    [onScoreChange, onTriggerParticles, onTriggerScreenShake, playSfx]
  );

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      if (!isPaused) {
        // --- 1. PHYSICS UPDATE ---
        const bird = activeBirdRef.current;
        const groundY = 440;

        if (bird.state === 'flying') {
          flightTimerRef.current++;
          bird.vy += GRAVITY;
          bird.x += bird.vx;
          bird.y += bird.vy;

          // Trail particles
          if (flightTimerRef.current % 3 === 0) {
            particlesRef.current.push({
              x: bird.x,
              y: bird.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              color: 'rgba(255, 255, 255, 0.4)',
              size: 3,
              life: 0.6,
            });
          }

          // Ground bounce
          if (bird.y + bird.radius >= groundY) {
            bird.y = groundY - bird.radius;
            bird.vy = -bird.vy * 0.35;
            bird.vx *= 0.6;
            if (Math.abs(bird.vx) < 0.5 && Math.abs(bird.vy) < 0.5) {
              bird.state = 'dead';
              advanceTurn();
            }
          }

          // Bird vs Blocks Collision
          blocksRef.current.forEach((b) => {
            if (b.health <= 0) return;
            if (
              bird.x + bird.radius > b.x &&
              bird.x - bird.radius < b.x + b.w &&
              bird.y + bird.radius > b.y &&
              bird.y - bird.radius < b.y + b.h
            ) {
              const impactSpeed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
              const damage = Math.round(impactSpeed * 6);
              b.health -= damage;

              if (b.type === 'tnt') {
                explodeTNT(b.x + b.w / 2, b.y + b.h / 2);
                b.health = 0;
              } else {
                playSfx('hit');
                onTriggerScreenShake?.(impactSpeed > 7 ? 'intense' : 'subtle');

                // Transfer velocity
                b.vx += bird.vx * 0.4;
                b.vy += bird.vy * 0.3;
                b.vAngle += (Math.random() - 0.5) * 0.15;
                bird.vx *= 0.4;
                bird.vy *= 0.4;

                // Debris particles
                for (let d = 0; d < 5; d++) {
                  particlesRef.current.push({
                    x: bird.x,
                    y: bird.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    color: b.type === 'wood' ? '#b45309' : b.type === 'stone' ? '#94a3b8' : '#38bdf8',
                    size: 3,
                    life: 0.7,
                  });
                }

                if (b.health <= 0) {
                  setScore((s) => {
                    const ns = s + 500;
                    onScoreChange(ns);
                    return ns;
                  });
                }
              }
            }
          });

          // Bird vs Pigs Collision
          pigsRef.current.forEach((pig) => {
            if (!pig.alive) return;
            const dx = bird.x - pig.x;
            const dy = bird.y - pig.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bird.radius + pig.radius) {
              pig.alive = false;
              playSfx('point');
              onTriggerScreenShake?.('intense');
              onTriggerParticles?.('stars', 25);

              // Pig pop smoke & feathers
              for (let p = 0; p < 12; p++) {
                particlesRef.current.push({
                  x: pig.x,
                  y: pig.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#22c55e',
                  size: 4,
                  life: 0.9,
                });
              }

              popupsRef.current.push({
                x: pig.x,
                y: pig.y - 10,
                text: '+5000',
                color: '#22c55e',
                life: 1.0,
              });

              setScore((s) => {
                const ns = s + 5000;
                onScoreChange(ns);
                return ns;
              });
            }
          });

          // Flight timeout
          if (flightTimerRef.current > 180 || bird.x > WIDTH + 60) {
            bird.state = 'dead';
            advanceTurn();
          }
        }

        // Update Blocks Physics
        blocksRef.current.forEach((b) => {
          if (b.health <= 0) return;
          b.vy += GRAVITY * 0.7;
          b.x += b.vx;
          b.y += b.vy;
          b.angle += b.vAngle;
          b.vx *= 0.94;
          b.vAngle *= 0.92;

          if (b.y + b.h >= groundY) {
            b.y = groundY - b.h;
            b.vy = 0;
          }

          // Check if falling block crushes pigs underneath
          pigsRef.current.forEach((pig) => {
            if (!pig.alive) return;
            if (
              pig.x > b.x &&
              pig.x < b.x + b.w &&
              pig.y + pig.radius > b.y &&
              pig.y < b.y + b.h &&
              (Math.abs(b.vy) > 1.5 || Math.abs(b.vx) > 1.5)
            ) {
              pig.alive = false;
              playSfx('point');
              popupsRef.current.push({
                x: pig.x,
                y: pig.y - 12,
                text: '+5000',
                color: '#22c55e',
                life: 1.0,
              });
              setScore((s) => {
                const ns = s + 5000;
                onScoreChange(ns);
                return ns;
              });
            }
          });
        });

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.035;
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Update popups
        for (let i = popupsRef.current.length - 1; i >= 0; i--) {
          const pop = popupsRef.current[i];
          pop.y -= 0.7;
          pop.life -= 0.025;
          if (pop.life <= 0) {
            popupsRef.current.splice(i, 1);
          }
        }

        // --- 2. RENDER ---
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Sunset Horizon Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        sky.addColorStop(0, '#0284c7'); // Rich blue top
        sky.addColorStop(0.5, '#38bdf8'); // Sky cyan
        sky.addColorStop(0.75, '#fed7aa'); // Warm twilight peach
        sky.addColorStop(1, '#ea580c'); // Sunset orange
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Distant Hills
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(80, groundY, 140, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(280, groundY, 180, Math.PI, 0);
        ctx.fill();

        // Ground Strip
        ctx.fillStyle = '#15803d'; // Lush grass
        ctx.fillRect(0, groundY, WIDTH, 16);
        ctx.fillStyle = '#78350f'; // Dirt strata
        ctx.fillRect(0, groundY + 16, WIDTH, HEIGHT - (groundY + 16));

        // Slingshot Fork
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(SLING_X - 6, groundY);
        ctx.lineTo(SLING_X - 6, SLING_Y + 15);
        ctx.lineTo(SLING_X - 16, SLING_Y);
        ctx.lineTo(SLING_X - 10, SLING_Y);
        ctx.lineTo(SLING_X, SLING_Y + 20);
        ctx.lineTo(SLING_X + 10, SLING_Y);
        ctx.lineTo(SLING_X + 16, SLING_Y);
        ctx.lineTo(SLING_X + 6, SLING_Y + 15);
        ctx.lineTo(SLING_X + 6, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Trajectory Preview Dots
        if (bird.state === 'aiming' || (bird.state === 'idle' && pullRef.current.isDragging)) {
          const simVx = -pullRef.current.x * 0.16;
          const simVy = -pullRef.current.y * 0.16;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

          let curX = bird.x;
          let curY = bird.y;
          let curVy = simVy;

          for (let step = 0; step < 22; step++) {
            curX += simVx;
            curVy += GRAVITY;
            curY += curVy;

            if (curY >= groundY) break;

            ctx.beginPath();
            ctx.arc(curX, curY, step % 2 === 0 ? 2.5 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Slingshot Rubber Band (Left branch to bird)
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(SLING_X - 12, SLING_Y + 4);
        ctx.lineTo(bird.x, bird.y);
        ctx.stroke();

        // Queued Reserve Birds on the ground
        birdsQueueRef.current.slice(1).forEach((qType, qIdx) => {
          const qx = SLING_X - 35 - qIdx * 20;
          const qy = groundY - 10;
          ctx.fillStyle = qType === 'yellow' ? '#eab308' : '#ef4444';
          ctx.beginPath();
          ctx.arc(qx, qy, 9, 0, Math.PI * 2);
          ctx.fill();
        });

        // Render Blocks
        blocksRef.current.forEach((b) => {
          if (b.health <= 0) return;
          ctx.save();
          ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
          ctx.rotate(b.angle);

          if (b.type === 'wood') {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
            // Wood grain lines
            ctx.beginPath();
            ctx.moveTo(-b.w / 2 + 3, 0);
            ctx.lineTo(b.w / 2 - 3, 0);
            ctx.stroke();
          } else if (b.type === 'stone') {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
          } else if (b.type === 'ice') {
            ctx.fillStyle = 'rgba(125, 211, 252, 0.7)';
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
          } else if (b.type === 'tnt') {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 2;
            ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('TNT', 0, 3);
          }

          ctx.restore();
        });

        // Render Pigs
        pigsRef.current.forEach((pig) => {
          if (!pig.alive) return;
          // Green body
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(pig.x, pig.y, pig.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Green Snout
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.ellipse(pig.x - 2, pig.y + 1, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Nostrils
          ctx.fillStyle = '#14532d';
          ctx.fillRect(pig.x - 5, pig.y, 2, 3);
          ctx.fillRect(pig.x - 1, pig.y, 2, 3);

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pig.x - 4, pig.y - 4, 3, 0, Math.PI * 2);
          ctx.arc(pig.x + 2, pig.y - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(pig.x - 5, pig.y - 4, 1.5, 0, Math.PI * 2);
          ctx.arc(pig.x + 1, pig.y - 4, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Helmet for boss pig
          if (pig.hasHelmet) {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(pig.x, pig.y - 4, pig.radius + 1, Math.PI, 0);
            ctx.fill();
          }
        });

        // Render Active Bird
        if (bird.state !== 'dead') {
          ctx.save();
          ctx.translate(bird.x, bird.y);

          if (bird.type === 'red') {
            // Classic Red Bird
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // White belly
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(1, 4, 6, 0, Math.PI);
            ctx.fill();

            // Big black eyebrows
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(1, -6, 8, 3);

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(3, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Yellow triangular beak
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(6, -2);
            ctx.lineTo(13, 1);
            ctx.lineTo(6, 4);
            ctx.closePath();
            ctx.fill();
          } else {
            // Yellow Chuck Bird (Triangle)
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(-10, -12);
            ctx.lineTo(-8, 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Beak
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(12, -2);
            ctx.lineTo(18, 1);
            ctx.lineTo(12, 4);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }

        // Slingshot Front Rubber Band (Right branch to bird)
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(SLING_X + 12, SLING_Y + 4);
        ctx.lineTo(bird.x, bird.y);
        ctx.stroke();

        // Render Particles
        particlesRef.current.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        // Render Score Popups
        popupsRef.current.forEach((pop) => {
          ctx.fillStyle = pop.color;
          ctx.font = 'bold 11px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.globalAlpha = Math.max(0, pop.life);
          ctx.fillText(pop.text, pop.x, pop.y);
        });
        ctx.globalAlpha = 1.0;

        // --- 3. HUD ---
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';

        // Score
        ctx.fillText('SCORE', 16, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillText(score.toString().padStart(6, '0'), 16, 36);

        // Birds Left
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`BIRDS: ${birdsRemaining}`, 150, 36);

        // Level
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`LEVEL ${level}`, 290, 36);

        // Instructions hint
        if (bird.state === 'idle') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DRAG SLINGSHOT OR PRESS SPACE', WIDTH / 2, HEIGHT - 14);
        } else if (bird.state === 'flying' && !bird.abilityUsed && bird.type === 'yellow') {
          ctx.fillStyle = '#facc15';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('TAP SCREEN / SPACE FOR SPEED BOOST!', WIDTH / 2, HEIGHT - 14);
        }

        // Pause Overlay
        if (isPaused) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          ctx.fillStyle = '#f97316';
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
    level,
    birdsRemaining,
    advanceTurn,
    onScoreChange,
    onGameOver,
    onTriggerScreenShake,
    onTriggerParticles,
    onGameCompleted,
    playSfx,
    explodeTNT,
  ]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="max-w-full max-h-full object-contain rounded shadow-2xl cursor-crosshair touch-none"
      />
    </div>
  );
};
