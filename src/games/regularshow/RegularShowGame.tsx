import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';
import { Check } from 'lucide-react';

type ModeId = 'hurt' | 'moon' | 'destroyer';
type ScreenState = 'menu' | 'playing' | 'stage_clear';

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
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

// Mode 1: Put the Hurt on Him
interface BrawlerEnemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  kind: 'punk' | 'bruiser' | 'boss';
  facing: 1 | -1;
  atkCooldown: number;
  hurtTimer: number;
  walkPhase: number;
}

interface BrawlerPickup {
  x: number;
  y: number;
  kind: 'rigjuice' | 'cheese';
  life: number;
}

// Mode 2: Escape from the Moon
interface MoonObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'rock' | 'crater' | 'ramp' | 'rigjuice';
  hit?: boolean;
}

// Mode 3: Destroy the Destroyer
interface PlayerShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface BossProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'orb' | 'skull';
}

const CANVAS_W = 480;
const CANVAS_H = 420;

const MODE_META: {
  id: ModeId;
  title: string;
  shortTitle: string;
  bgTop: string;
  bgBottom: string;
  pillColor: string;
}[] = [
  {
    id: 'hurt',
    title: 'PUT THE HURT ON HIM!',
    shortTitle: 'PUT THE HURT',
    bgTop: '#facc15',
    bgBottom: '#ca8a04',
    pillColor: 'border-yellow-400/70 bg-yellow-500/15 text-yellow-300',
  },
  {
    id: 'moon',
    title: 'ESCAPE FROM THE MOON',
    shortTitle: 'MOON ESCAPE',
    bgTop: '#fb923c',
    bgBottom: '#c2410c',
    pillColor: 'border-orange-400/70 bg-orange-500/15 text-orange-300',
  },
  {
    id: 'destroyer',
    title: 'DESTROY THE DESTROYER!',
    shortTitle: 'DESTROYER',
    bgTop: '#ef4444',
    bgBottom: '#991b1b',
    pillColor: 'border-rose-400/70 bg-rose-500/15 text-rose-300',
  },
];

const CATCHPHRASES = ['OOOOOH!', 'STEP OFF!', 'HM! HM!', 'DEATH PUNCH!'];

export const RegularShowGame: React.FC<ArcadeGameProps> = ({
  onScoreChange,
  onGameOver,
  isPaused,
  playSfx,
  virtualInput,
  onTriggerScreenShake,
  onTriggerParticles,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [screen, setScreen] = useState<ScreenState>('menu');
  const [selectedMenuIdx, setSelectedMenuIdx] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<ModeId>('hurt');
  const [clearedModes, setClearedModes] = useState<Record<ModeId, boolean>>({
    hurt: false,
    moon: false,
    destroyer: false,
  });
  const [hudSubInfo, setHudSubInfo] = useState<string>('SELECT A REGULAR SHOW SUB-LEVEL');
  const [clearBanner, setClearBanner] = useState<{
    title: string;
    subtitle: string;
    bonus: number;
    nextMode: ModeId;
  }>({
    title: 'SUB-LEVEL CLEARED!',
    subtitle: 'OOOOOH! READY FOR THE NEXT CHALLENGE?',
    bonus: 600,
    nextMode: 'moon',
  });

  const screenRef = useRef<ScreenState>('menu');
  const selectedMenuIdxRef = useRef<number>(0);
  const activeModeRef = useRef<ModeId>('hurt');
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const callbacksRef = useRef({
    onScoreChange,
    onGameOver,
    playSfx,
    onTriggerScreenShake,
    onTriggerParticles,
  });
  callbacksRef.current = {
    onScoreChange,
    onGameOver,
    playSfx,
    onTriggerScreenShake,
    onTriggerParticles,
  };

  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const tickRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);

  // Input refs
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    actionA: false,
    actionB: false,
  });
  const prevActionARef = useRef(false);
  const prevActionBRef = useRef(false);
  const menuMoveCooldownRef = useRef(0);
  const lastVirtualTsRef = useRef(0);

  // Mode 1: Put the Hurt on Him state
  const hurtStateRef = useRef({
    px: 130,
    py: 315,
    facing: 1 as 1 | -1,
    hp: 100,
    maxHp: 100,
    meter: 50,
    combo: 0,
    comboTimer: 0,
    atkTimer: 0,
    atkStep: 0,
    specialTimer: 0,
    invuln: 0,
    stage: 1,
    wave: 1,
    enemiesToSpawn: 0,
    spawnTimer: 30,
    walkPhase: 0,
    enemies: [] as BrawlerEnemy[],
    pickups: [] as BrawlerPickup[],
    nextId: 1,
  });

  // Mode 2: Escape from the Moon state
  const moonStateRef = useRef({
    cartX: 210,
    cartY: 342,
    vy: 0,
    onGround: true,
    hp: 3,
    fuel: 85,
    boosting: false,
    invuln: 0,
    speed: 4.3,
    distance: 0,
    sectorGoal: 850,
    sector: 1,
    monsterOffset: 8,
    obstacleTimer: 45,
    obstacles: [] as MoonObstacle[],
    stars: Array.from({ length: 44 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * 245,
      size: Math.random() > 0.72 ? 2 : 1,
      speed: 0.3 + Math.random() * 0.7,
    })),
  });

  // Mode 3: Destroy the Destroyer state
  const destroyerStateRef = useRef({
    px: CANVAS_W / 2,
    py: 350,
    hp: 4,
    maxHp: 4,
    invuln: 0,
    bombCharge: 50,
    shootCooldown: 0,
    bossLevel: 1,
    bossX: CANVAS_W / 2,
    bossY: 94,
    bossVx: 1.5,
    bossHp: 110,
    bossMaxHp: 110,
    bossFlash: 0,
    attackTimer: 52,
    beamState: 'none' as 'none' | 'warn' | 'fire',
    beamTimer: 0,
    beamX: CANVAS_W / 2,
    shots: [] as PlayerShot[],
    projectiles: [] as BossProjectile[],
  });

  const addScore = useCallback((pts: number) => {
    scoreRef.current += pts;
    callbacksRef.current.onScoreChange(scoreRef.current);
  }, []);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 10, speed = 3.5) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = 0.8 + Math.random() * speed;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          color,
          size: 2 + Math.random() * 3,
          life: 18 + Math.floor(Math.random() * 14),
        });
      }
    },
    []
  );

  const spawnText = useCallback((x: number, y: number, text: string, color = '#ffffff') => {
    textsRef.current.push({ x, y, vy: -1.05, text, color, life: 38 });
  }, []);

  const triggerGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    callbacksRef.current.playSfx('gameover');
    callbacksRef.current.onTriggerScreenShake?.('intense');
    callbacksRef.current.onGameOver(scoreRef.current);
  }, []);

  const initMode = useCallback((mode: ModeId, keepLevel = false) => {
    particlesRef.current = [];
    textsRef.current = [];
    activeModeRef.current = mode;
    setActiveMode(mode);
    screenRef.current = 'playing';
    setScreen('playing');

    const idx = MODE_META.findIndex((m) => m.id === mode);
    if (idx >= 0) {
      selectedMenuIdxRef.current = idx;
      setSelectedMenuIdx(idx);
    }

    if (mode === 'hurt') {
      const prevStage = keepLevel ? hurtStateRef.current.stage : 1;
      hurtStateRef.current = {
        px: 130,
        py: 315,
        facing: 1,
        hp: 100,
        maxHp: 100,
        meter: 50,
        combo: 0,
        comboTimer: 0,
        atkTimer: 0,
        atkStep: 0,
        specialTimer: 0,
        invuln: 20,
        stage: prevStage,
        wave: 1,
        enemiesToSpawn: 3 + prevStage,
        spawnTimer: 22,
        walkPhase: 0,
        enemies: [],
        pickups: [],
        nextId: 1,
      };
      setHudSubInfo(`PUT THE HURT ON HIM · STAGE ${prevStage}`);
    } else if (mode === 'moon') {
      const prevSector = keepLevel ? moonStateRef.current.sector : 1;
      moonStateRef.current = {
        ...moonStateRef.current,
        cartX: 210,
        cartY: 342,
        vy: 0,
        onGround: true,
        hp: 3,
        fuel: 85,
        boosting: false,
        invuln: 30,
        speed: 4.3 + (prevSector - 1) * 0.55,
        distance: 0,
        sectorGoal: 850 + (prevSector - 1) * 250,
        sector: prevSector,
        monsterOffset: 8,
        obstacleTimer: 45,
        obstacles: [],
      };
      setHudSubInfo(`ESCAPE FROM THE MOON · SECTOR ${prevSector}`);
    } else if (mode === 'destroyer') {
      const prevLvl = keepLevel ? destroyerStateRef.current.bossLevel : 1;
      const maxHp = 105 + (prevLvl - 1) * 50;
      destroyerStateRef.current = {
        px: CANVAS_W / 2,
        py: 350,
        hp: 4,
        maxHp: 4,
        invuln: 30,
        bombCharge: 50,
        shootCooldown: 0,
        bossLevel: prevLvl,
        bossX: CANVAS_W / 2,
        bossY: 94,
        bossVx: 1.5 + (prevLvl - 1) * 0.35,
        bossHp: maxHp,
        bossMaxHp: maxHp,
        bossFlash: 0,
        attackTimer: 50,
        beamState: 'none',
        beamTimer: 0,
        beamX: CANVAS_W / 2,
        shots: [],
        projectiles: [],
      };
      setHudSubInfo(`DESTROY THE DESTROYER · MK.${prevLvl}`);
    }

    callbacksRef.current.playSfx('start');
  }, []);

  const returnToModeSelect = useCallback(() => {
    if (gameOverRef.current) return;
    screenRef.current = 'menu';
    setScreen('menu');
    setHudSubInfo('SELECT A REGULAR SHOW SUB-LEVEL');
    callbacksRef.current.playSfx('select');
  }, []);

  const handleNextSubLevel = useCallback(() => {
    const next = clearBanner.nextMode;
    if (next === activeModeRef.current) {
      if (next === 'hurt') hurtStateRef.current.stage += 1;
      else if (next === 'moon') moonStateRef.current.sector += 1;
      else destroyerStateRef.current.bossLevel += 1;
      initMode(next, true);
    } else {
      initMode(next, false);
    }
  }, [clearBanner.nextMode, initMode]);

  const handleReplaySameMode = useCallback(() => {
    const mode = activeModeRef.current;
    if (mode === 'hurt') hurtStateRef.current.stage += 1;
    else if (mode === 'moon') moonStateRef.current.sector += 1;
    else destroyerStateRef.current.bossLevel += 1;
    initMode(mode, true);
  }, [initMode]);

  // Sync virtual controller input
  useEffect(() => {
    if (virtualInput.timestamp !== lastVirtualTsRef.current) {
      lastVirtualTsRef.current = virtualInput.timestamp;
      keysRef.current = {
        up: virtualInput.up,
        down: virtualInput.down,
        left: virtualInput.left,
        right: virtualInput.right,
        actionA: virtualInput.actionA,
        actionB: virtualInput.actionB,
      };
    }
  }, [virtualInput]);

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = true;
      if (k === 'arrowright' || k === 'd') keysRef.current.right = true;
      if (k === 'arrowup' || k === 'w') keysRef.current.up = true;
      if (k === 'arrowdown' || k === 's') keysRef.current.down = true;
      if (e.code === 'Space' || k === 'z' || k === 'enter') keysRef.current.actionA = true;
      if (k === 'shift' || k === 'x') keysRef.current.actionB = true;

      if (!gameOverRef.current && !isPausedRef.current) {
        if (k === '1') initMode('hurt');
        else if (k === '2') initMode('moon');
        else if (k === '3') initMode('destroyer');
        else if (k === 'm' && screenRef.current !== 'menu') returnToModeSelect();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = false;
      if (k === 'arrowright' || k === 'd') keysRef.current.right = false;
      if (k === 'arrowup' || k === 'w') keysRef.current.up = false;
      if (k === 'arrowdown' || k === 's') keysRef.current.down = false;
      if (e.code === 'Space' || k === 'z' || k === 'enter') keysRef.current.actionA = false;
      if (k === 'shift' || k === 'x') keysRef.current.actionB = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [initMode, returnToModeSelect]);

  // Canvas click for selecting one of the 3 panels on menu
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPausedRef.current || gameOverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;

    if (screenRef.current === 'menu') {
      const idx = x < 160 ? 0 : x < 320 ? 1 : 2;
      selectedMenuIdxRef.current = idx;
      setSelectedMenuIdx(idx);
      initMode(MODE_META[idx].id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (screenRef.current !== 'menu' || isPausedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const idx = x < 160 ? 0 : x < 320 ? 1 : 2;
    if (idx !== selectedMenuIdxRef.current) {
      selectedMenuIdxRef.current = idx;
      setSelectedMenuIdx(idx);
    }
  };

  // Main 60 FPS loop
  useEffect(() => {
    let rafId = 0;

    const markCleared = (mode: ModeId, title: string, bonus: number, nextMode: ModeId) => {
      setClearedModes((prev) => {
        const updated = { ...prev, [mode]: true };
        const allCleared = updated.hurt && updated.moon && updated.destroyer;
        setClearBanner({
          title,
          subtitle: allCleared
            ? 'TRIPLE CROWN! ALL 3 REGULAR SHOW SUB-LEVELS CONQUERED!'
            : `NEXT UP: ${MODE_META.find((m) => m.id === nextMode)?.title}`,
          bonus,
          nextMode,
        });
        return updated;
      });
      screenRef.current = 'stage_clear';
      setScreen('stage_clear');
    };

    const updateMenu = () => {
      if (menuMoveCooldownRef.current > 0) menuMoveCooldownRef.current--;
      const k = keysRef.current;
      if (menuMoveCooldownRef.current === 0) {
        if (k.left) {
          selectedMenuIdxRef.current = (selectedMenuIdxRef.current + 2) % 3;
          setSelectedMenuIdx(selectedMenuIdxRef.current);
          callbacksRef.current.playSfx('select');
          menuMoveCooldownRef.current = 14;
        } else if (k.right) {
          selectedMenuIdxRef.current = (selectedMenuIdxRef.current + 1) % 3;
          setSelectedMenuIdx(selectedMenuIdxRef.current);
          callbacksRef.current.playSfx('select');
          menuMoveCooldownRef.current = 14;
        }
      }

      const justPressedA = k.actionA && !prevActionARef.current;
      if (justPressedA) {
        initMode(MODE_META[selectedMenuIdxRef.current].id);
      }
    };

    const updateHurtMode = () => {
      const s = hurtStateRef.current;
      const k = keysRef.current;
      const justA = k.actionA && !prevActionARef.current;
      const justB = k.actionB && !prevActionBRef.current;

      if (s.invuln > 0) s.invuln--;
      if (s.atkTimer > 0) s.atkTimer--;
      if (s.specialTimer > 0) s.specialTimer--;
      if (s.comboTimer > 0) {
        s.comboTimer--;
        if (s.comboTimer === 0) s.combo = 0;
      }

      let dx = 0;
      let dy = 0;
      if (k.left) {
        dx = -3.1;
        s.facing = -1;
      }
      if (k.right) {
        dx = 3.1;
        s.facing = 1;
      }
      if (k.up) dy = -2.2;
      if (k.down) dy = 2.2;

      if (s.atkTimer > 4) {
        dx *= 0.35;
        dy *= 0.35;
      }

      s.px = Math.max(24, Math.min(CANVAS_W - 24, s.px + dx));
      s.py = Math.max(242, Math.min(396, s.py + dy));
      if (dx !== 0 || dy !== 0) s.walkPhase += 0.24;

      // Death Kwon Do Combo
      if (justA && s.atkTimer <= 2) {
        s.atkStep = (s.atkStep + 1) % 3;
        s.atkTimer = 14;
        callbacksRef.current.playSfx('laser');

        const reach = s.atkStep === 2 ? 58 : 46;
        const dmg = s.atkStep === 2 ? 32 : 20;
        let hitAny = false;

        s.enemies.forEach((en) => {
          const forwardDist = (en.x - s.px) * s.facing;
          const yDist = Math.abs(en.y - s.py);
          if (forwardDist >= -14 && forwardDist <= reach && yDist <= 28) {
            en.hp -= dmg;
            en.hurtTimer = 10;
            en.x += s.facing * (s.atkStep === 2 ? 26 : 12);
            hitAny = true;
            s.combo += 1;
            s.comboTimer = 125;
            s.meter = Math.min(100, s.meter + 12);
            const pts =
              (s.atkStep === 2 ? 45 : 25) * Math.min(5, Math.max(1, Math.floor(s.combo / 2)));
            addScore(pts);
            spawnParticles(en.x, en.y - 18, '#facc15', 8, 3);
            const phrase =
              s.atkStep === 2
                ? CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)]
                : 'WHACK!';
            spawnText(en.x, en.y - 40, phrase, s.atkStep === 2 ? '#facc15' : '#ffffff');
          }
        });

        if (hitAny) {
          callbacksRef.current.playSfx('hit');
          if (s.atkStep === 2) callbacksRef.current.onTriggerScreenShake?.('subtle');
        }
      }

      // Death Chop Shockwave
      if (justB && s.meter >= 50 && s.specialTimer === 0) {
        s.meter -= 50;
        s.specialTimer = 26;
        callbacksRef.current.playSfx('fanfare');
        callbacksRef.current.onTriggerScreenShake?.('intense');
        spawnParticles(s.px, s.py - 16, '#ef4444', 24, 5.5);
        spawnText(s.px, s.py - 50, 'DEATH CHOP!!', '#facc15');

        s.enemies.forEach((en) => {
          const dist = Math.hypot(en.x - s.px, en.y - s.py);
          if (dist <= 118) {
            en.hp -= 55;
            en.hurtTimer = 16;
            en.x += (en.x >= s.px ? 1 : -1) * 44;
            s.combo += 1;
            s.comboTimer = 130;
            addScore(80);
          }
        });
      }

      if (s.enemiesToSpawn > 0) {
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          s.enemiesToSpawn--;
          s.spawnTimer = Math.max(35, 76 - s.stage * 8);
          const fromLeft = Math.random() > 0.5;
          const isBoss = s.wave === 3 && s.enemiesToSpawn === 0;
          const kind: BrawlerEnemy['kind'] = isBoss
            ? 'boss'
            : Math.random() > 0.62
              ? 'bruiser'
              : 'punk';
          const maxHp =
            kind === 'boss'
              ? 140 + s.stage * 35
              : kind === 'bruiser'
                ? 65 + s.stage * 10
                : 40 + s.stage * 6;
          s.enemies.push({
            id: s.nextId++,
            x: fromLeft ? -20 : CANVAS_W + 20,
            y: 256 + Math.random() * 124,
            hp: maxHp,
            maxHp,
            kind,
            facing: fromLeft ? 1 : -1,
            atkCooldown: 35,
            hurtTimer: 0,
            walkPhase: Math.random() * 6,
          });
        }
      }

      const survivors: BrawlerEnemy[] = [];
      for (const en of s.enemies) {
        if (en.hp <= 0) {
          const bounty = en.kind === 'boss' ? 350 : en.kind === 'bruiser' ? 140 : 90;
          addScore(bounty);
          spawnParticles(en.x, en.y - 16, '#fb923c', 16, 4);
          spawnText(en.x, en.y - 38, `+${bounty}`, '#38bdf8');
          callbacksRef.current.playSfx('point');
          if (Math.random() < 0.36 || en.kind === 'bruiser') {
            s.pickups.push({
              x: Math.max(30, Math.min(CANVAS_W - 30, en.x)),
              y: en.y,
              kind: Math.random() > 0.45 ? 'cheese' : 'rigjuice',
              life: 480,
            });
          }
          continue;
        }

        if (en.hurtTimer > 0) en.hurtTimer--;
        if (en.atkCooldown > 0) en.atkCooldown--;

        const dxE = s.px - en.x;
        const dyE = s.py - en.y;
        en.facing = dxE >= 0 ? 1 : -1;
        const spd = en.kind === 'punk' ? 1.45 : en.kind === 'bruiser' ? 1.05 : 1.3;

        if (en.hurtTimer === 0) {
          if (Math.abs(dxE) > 28) en.x += Math.sign(dxE) * spd;
          if (Math.abs(dyE) > 10) en.y += Math.sign(dyE) * (spd * 0.75);
          en.walkPhase += 0.16;

          if (Math.abs(dxE) <= 34 && Math.abs(dyE) <= 22 && en.atkCooldown === 0) {
            en.atkCooldown = en.kind === 'boss' ? 46 : 62;
            if (s.invuln === 0) {
              const hitDmg = en.kind === 'boss' ? 18 : en.kind === 'bruiser' ? 14 : 10;
              s.hp = Math.max(0, s.hp - hitDmg);
              s.invuln = 34;
              s.combo = 0;
              callbacksRef.current.playSfx('hit');
              callbacksRef.current.onTriggerScreenShake?.('subtle');
              spawnParticles(s.px, s.py - 18, '#ef4444', 10, 3);
              spawnText(s.px, s.py - 42, `-${hitDmg} HP`, '#f87171');
            }
          }
        }
        en.x = Math.max(-25, Math.min(CANVAS_W + 25, en.x));
        survivors.push(en);
      }
      s.enemies = survivors;

      s.pickups = s.pickups.filter((pk) => {
        pk.life--;
        if (pk.life <= 0) return false;
        if (Math.abs(pk.x - s.px) < 26 && Math.abs(pk.y - s.py) < 24) {
          if (pk.kind === 'cheese') {
            s.hp = Math.min(s.maxHp, s.hp + 25);
            spawnText(s.px, s.py - 44, 'GRILLED CHEESE +25!', '#4ade80');
          } else {
            s.meter = Math.min(100, s.meter + 35);
            spawnText(s.px, s.py - 44, 'RIGJUICE +CHOP!', '#38bdf8');
          }
          addScore(100);
          callbacksRef.current.playSfx('coin');
          return false;
        }
        return true;
      });

      if (s.hp <= 0) {
        triggerGameOver();
        return;
      }

      if (s.enemiesToSpawn === 0 && s.enemies.length === 0) {
        if (s.wave < 3) {
          s.wave += 1;
          s.enemiesToSpawn = 3 + s.wave + s.stage;
          s.spawnTimer = 42;
          callbacksRef.current.playSfx('level');
          spawnText(CANVAS_W / 2, 160, s.wave === 3 ? 'SENSEI INCOMING!' : `WAVE ${s.wave}!`, '#facc15');
        } else {
          const bonus = 600 * s.stage;
          addScore(bonus);
          callbacksRef.current.playSfx('fanfare');
          callbacksRef.current.onTriggerParticles?.('confetti', 35);
          markCleared('hurt', `PUT THE HURT STAGE ${s.stage} CLEARED!`, bonus, 'moon');
        }
      }
    };

    const updateMoonMode = () => {
      const m = moonStateRef.current;
      const k = keysRef.current;
      const justA = k.actionA && !prevActionARef.current;

      if (m.invuln > 0) m.invuln--;

      m.stars.forEach((st) => {
        st.x -= st.speed * (m.boosting ? 2.2 : 1);
        if (st.x < 0) st.x = CANVAS_W;
      });

      if (k.left) m.cartX = Math.max(122, m.cartX - 2.6);
      if (k.right) m.cartX = Math.min(342, m.cartX + 2.6);

      if (k.actionB && m.fuel > 1) {
        m.boosting = true;
        m.fuel = Math.max(0, m.fuel - 0.85);
        m.monsterOffset = Math.max(0, m.monsterOffset - 0.35);
        if (tickRef.current % 3 === 0) {
          spawnParticles(m.cartX - 28, m.cartY - 8, '#38bdf8', 2, 2.2);
        }
      } else {
        m.boosting = false;
        m.fuel = Math.min(100, m.fuel + 0.08);
      }

      const wantJump = justA || (k.up && m.onGround);
      if (wantJump && m.onGround) {
        m.vy = -8.6;
        m.onGround = false;
        callbacksRef.current.playSfx('jump');
        spawnParticles(m.cartX, m.cartY, '#fed7aa', 6, 2);
      }

      const groundY = 342;
      m.vy += 0.34;
      m.cartY += m.vy;
      if (m.cartY >= groundY) {
        m.cartY = groundY;
        m.vy = 0;
        m.onGround = true;
      }

      const activeSpeed = m.speed * (m.boosting ? 1.55 : 1);
      m.distance += activeSpeed * 0.45;
      if (tickRef.current % 6 === 0) {
        addScore(m.boosting ? 8 : 4);
      }

      m.monsterOffset = Math.min(115, m.monsterOffset + 0.028 * (1 + m.sector * 0.12));

      m.obstacleTimer--;
      if (m.obstacleTimer <= 0) {
        m.obstacleTimer = Math.max(30, Math.floor(60 - m.sector * 5 + Math.random() * 24));
        const roll = Math.random();
        if (roll < 0.38) {
          m.obstacles.push({ x: CANVAS_W + 30, y: groundY - 24, w: 26, h: 24, kind: 'rock' });
        } else if (roll < 0.65) {
          m.obstacles.push({ x: CANVAS_W + 30, y: groundY - 6, w: 40, h: 12, kind: 'crater' });
        } else if (roll < 0.82) {
          m.obstacles.push({ x: CANVAS_W + 30, y: groundY - 18, w: 34, h: 18, kind: 'ramp' });
        } else {
          m.obstacles.push({
            x: CANVAS_W + 30,
            y: groundY - 65 - Math.random() * 55,
            w: 18,
            h: 24,
            kind: 'rigjuice',
          });
        }
      }

      const cartRect = { x: m.cartX - 22, y: m.cartY - 26, w: 44, h: 26 };
      m.obstacles = m.obstacles.filter((obs) => {
        obs.x -= activeSpeed;
        if (obs.x + obs.w < -20) return false;

        const overlap =
          !obs.hit &&
          cartRect.x < obs.x + obs.w &&
          cartRect.x + cartRect.w > obs.x &&
          cartRect.y < obs.y + obs.h &&
          cartRect.y + cartRect.h > obs.y;

        if (overlap) {
          obs.hit = true;
          if (obs.kind === 'rigjuice') {
            m.fuel = Math.min(100, m.fuel + 35);
            addScore(75);
            callbacksRef.current.playSfx('coin');
            spawnText(m.cartX, m.cartY - 42, 'RIGJUICE NITRO!', '#38bdf8');
            return false;
          } else if (obs.kind === 'ramp') {
            m.vy = -10.5;
            m.onGround = false;
            addScore(100);
            callbacksRef.current.playSfx('jump');
            spawnText(m.cartX, m.cartY - 44, 'OOOOOH! +100', '#facc15');
            return true;
          } else if (m.boosting && obs.kind === 'rock') {
            addScore(150);
            callbacksRef.current.playSfx('hit');
            spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#fb923c', 14, 4);
            spawnText(obs.x, obs.y - 20, 'SMASH +150', '#facc15');
            return false;
          } else if (m.invuln === 0) {
            m.hp -= 1;
            m.invuln = 48;
            m.monsterOffset = Math.min(115, m.monsterOffset + 22);
            m.cartX = Math.max(122, m.cartX - 18);
            callbacksRef.current.playSfx('hit');
            callbacksRef.current.onTriggerScreenShake?.('subtle');
            spawnParticles(m.cartX, m.cartY - 12, '#ef4444', 12, 3.5);
            spawnText(m.cartX, m.cartY - 44, 'MY MOM!', '#f87171');
          }
        }
        return true;
      });

      const monsterFrontX = 56 + m.monsterOffset;
      if (m.hp <= 0 || monsterFrontX >= m.cartX - 20) {
        triggerGameOver();
        return;
      }

      if (m.distance >= m.sectorGoal) {
        const bonus = 800 * m.sector;
        addScore(bonus);
        callbacksRef.current.playSfx('fanfare');
        callbacksRef.current.onTriggerParticles?.('stars', 30);
        markCleared('moon', `MOON SECTOR ${m.sector} ESCAPED!`, bonus, 'destroyer');
      }
    };

    const updateDestroyerMode = () => {
      const d = destroyerStateRef.current;
      const k = keysRef.current;
      const justB = k.actionB && !prevActionBRef.current;

      if (d.invuln > 0) d.invuln--;
      if (d.shootCooldown > 0) d.shootCooldown--;
      if (d.bossFlash > 0) d.bossFlash--;

      let dx = 0;
      let dy = 0;
      if (k.left) dx = -3.6;
      if (k.right) dx = 3.6;
      if (k.up) dy = -3.2;
      if (k.down) dy = 3.2;
      d.px = Math.max(22, Math.min(CANVAS_W - 22, d.px + dx));
      d.py = Math.max(198, Math.min(CANVAS_H - 24, d.py + dy));

      if (k.actionA && d.shootCooldown === 0) {
        d.shootCooldown = 9;
        d.shots.push({ x: d.px - 6, y: d.py - 14, vx: 0, vy: -7.5 });
        d.shots.push({ x: d.px + 6, y: d.py - 14, vx: 0, vy: -7.5 });
        callbacksRef.current.playSfx('laser');
      }

      if (justB && d.bombCharge >= 100) {
        d.bombCharge = 0;
        d.projectiles = [];
        d.bossHp = Math.max(0, d.bossHp - 28);
        d.bossFlash = 14;
        addScore(250);
        callbacksRef.current.playSfx('fanfare');
        callbacksRef.current.onTriggerScreenShake?.('intense');
        spawnParticles(d.bossX, d.bossY, '#22d3ee', 28, 6);
        spawnText(d.bossX, d.bossY + 38, 'THE POWER BLAST!', '#22d3ee');
      }

      const rageMult = d.bossHp < d.bossMaxHp * 0.4 ? 1.45 : 1;
      d.bossX += d.bossVx * rageMult;
      if (d.bossX > CANVAS_W - 86 || d.bossX < 86) {
        d.bossVx *= -1;
        d.bossX = Math.max(86, Math.min(CANVAS_W - 86, d.bossX));
      }

      if (d.beamState === 'warn') {
        d.beamTimer--;
        if (d.beamTimer <= 0) {
          d.beamState = 'fire';
          d.beamTimer = 34;
          callbacksRef.current.playSfx('hit');
          callbacksRef.current.onTriggerScreenShake?.('subtle');
        }
      } else if (d.beamState === 'fire') {
        d.beamTimer--;
        if (Math.abs(d.px - d.beamX) < 24 && d.invuln === 0) {
          d.hp--;
          d.invuln = 50;
          callbacksRef.current.playSfx('hit');
          callbacksRef.current.onTriggerScreenShake?.('intense');
          spawnParticles(d.px, d.py, '#ef4444', 14, 4);
        }
        if (d.beamTimer <= 0) d.beamState = 'none';
      } else {
        d.attackTimer--;
        if (d.attackTimer <= 0) {
          d.attackTimer = Math.max(24, Math.floor((56 - d.bossLevel * 6) / rageMult));
          const pattern = Math.floor(Math.random() * 3);
          if (pattern === 0) {
            const angle = Math.atan2(d.py - (d.bossY + 30), d.px - d.bossX);
            [-0.18, 0.18].forEach((offset) => {
              d.projectiles.push({
                x: d.bossX,
                y: d.bossY + 32,
                vx: Math.cos(angle + offset) * (3.1 + d.bossLevel * 0.3),
                vy: Math.sin(angle + offset) * (3.1 + d.bossLevel * 0.3),
                radius: 6,
                kind: 'orb',
              });
            });
          } else if (pattern === 1) {
            const count = 5 + Math.min(3, d.bossLevel);
            for (let i = 0; i < count; i++) {
              const a = Math.PI * 0.2 + (i / (count - 1)) * (Math.PI * 0.6);
              d.projectiles.push({
                x: d.bossX,
                y: d.bossY + 28,
                vx: Math.cos(a) * 2.4,
                vy: Math.sin(a) * 2.4,
                radius: 7,
                kind: 'skull',
              });
            }
          } else {
            d.beamState = 'warn';
            d.beamX = d.px;
            d.beamTimer = 38;
          }
        }
      }

      d.shots = d.shots.filter((sh) => {
        sh.x += sh.vx;
        sh.y += sh.vy;
        if (sh.y < -10) return false;
        if (Math.abs(sh.x - d.bossX) < 58 && Math.abs(sh.y - d.bossY) < 46) {
          d.bossHp = Math.max(0, d.bossHp - 1);
          d.bossFlash = 3;
          d.bombCharge = Math.min(100, d.bombCharge + 2.5);
          addScore(15);
          spawnParticles(sh.x, sh.y, '#facc15', 3, 2);
          return false;
        }
        return true;
      });

      d.projectiles = d.projectiles.filter((pr) => {
        pr.x += pr.vx;
        pr.y += pr.vy;
        if (pr.x < -15 || pr.x > CANVAS_W + 15 || pr.y > CANVAS_H + 15) return false;
        if (Math.hypot(pr.x - d.px, pr.y - d.py) < pr.radius + 9 && d.invuln === 0) {
          d.hp--;
          d.invuln = 50;
          callbacksRef.current.playSfx('hit');
          callbacksRef.current.onTriggerScreenShake?.('intense');
          spawnParticles(d.px, d.py, '#ef4444', 12, 3.5);
          spawnText(d.px, d.py - 20, 'WHOA!', '#f87171');
          return false;
        }
        return true;
      });

      if (d.hp <= 0) {
        triggerGameOver();
        return;
      }

      if (d.bossHp <= 0) {
        const bonus = 1200 * d.bossLevel;
        addScore(bonus);
        callbacksRef.current.playSfx('fanfare');
        callbacksRef.current.onTriggerParticles?.('fireworks', 45);
        callbacksRef.current.onTriggerScreenShake?.('intense');
        markCleared('destroyer', `DESTROYER MK.${d.bossLevel} VANQUISHED!`, bonus, 'hurt');
      }
    };

    const drawMenu = (ctx: CanvasRenderingContext2D) => {
      const panelW = CANVAS_W / 3;
      MODE_META.forEach((m, idx) => {
        const x = idx * panelW;
        const isSel = selectedMenuIdxRef.current === idx;

        const grad = ctx.createLinearGradient(x, 0, x, CANVAS_H);
        grad.addColorStop(0, m.bgTop);
        grad.addColorStop(1, m.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, panelW, CANVAS_H);

        // White Chalk Sketchy Line-Art matching Regular Show screenshot
        ctx.save();
        ctx.strokeStyle = isSel ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.34)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (m.id === 'hurt') {
          // Park swings & muscular brawler wireframe
          ctx.beginPath();
          ctx.moveTo(x + 12, 370);
          ctx.lineTo(x + 36, 250);
          ctx.lineTo(x + 148, 250);
          ctx.lineTo(x + 156, 370);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x + 80, 272, 16, 0, Math.PI * 2);
          ctx.moveTo(x + 54, 294);
          ctx.lineTo(x + 106, 294);
          ctx.lineTo(x + 114, 336);
          ctx.lineTo(x + 46, 336);
          ctx.closePath();
          ctx.stroke();
          // Raised fists
          ctx.strokeRect(x + 34, 286, 16, 18);
          ctx.strokeRect(x + 110, 286, 16, 18);
        } else if (m.id === 'moon') {
          // Cratered Moon & Pixel Stars
          ctx.beginPath();
          ctx.arc(x + 80, 146, 52, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + 60, 130, 11, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + 100, 146, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + 74, 168, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(x + 18, 108, 4, 4);
          ctx.fillRect(x + 136, 116, 4, 4);
          ctx.fillRect(x + 26, 198, 4, 4);
        } else {
          // 3D Isometric Destroyer of Worlds Arcade Cabinet
          ctx.beginPath();
          ctx.moveTo(x + 32, 224);
          ctx.lineTo(x + 116, 214);
          ctx.lineTo(x + 138, 240);
          ctx.lineTo(x + 132, 368);
          ctx.lineTo(x + 30, 368);
          ctx.lineTo(x + 24, 252);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 116, 214);
          ctx.lineTo(x + 112, 368);
          ctx.stroke();
          // Angry CRT Screen
          ctx.strokeRect(x + 38, 250, 66, 46);
          ctx.beginPath();
          ctx.moveTo(x + 48, 266);
          ctx.lineTo(x + 62, 272);
          ctx.moveTo(x + 94, 266);
          ctx.lineTo(x + 80, 272);
          ctx.moveTo(x + 48, 286);
          ctx.lineTo(x + 58, 280);
          ctx.lineTo(x + 68, 286);
          ctx.lineTo(x + 78, 280);
          ctx.lineTo(x + 92, 286);
          ctx.stroke();
          // Coin Door
          ctx.strokeRect(x + 46, 316, 50, 38);
        }
        ctx.restore();

        if (!isSel) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(x, 0, panelW, CANVAS_H);
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 3, 3, panelW - 6, CANVAS_H - 6);
        }

        // Stacked Regular Show Title Typography
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.font = '900 18px "Chakra Petch", sans-serif';
        const words = m.title.split(' ');
        const startY = m.id === 'moon' ? 244 : 112;
        words.forEach((w, wi) => {
          const ty = startY + wi * 24;
          ctx.strokeText(w, x + panelW / 2, ty);
          ctx.fillText(w, x + panelW / 2, ty);
        });

        // Bottom Select Tag
        ctx.fillStyle = '#090d16';
        ctx.fillRect(x + 22, CANVAS_H - 46, panelW - 44, 24);
        ctx.strokeStyle = isSel ? '#facc15' : '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 22, CANVAS_H - 46, panelW - 44, 24);
        ctx.fillStyle = isSel ? '#facc15' : '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          isSel ? '▶ PLAY [SPACE]' : `[${idx + 1}] ${m.shortTitle}`,
          x + panelW / 2,
          CANVAS_H - 30
        );
      });

      // Top Red & White SELECT GAME Banner
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(104, 16, 272, 44);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4;
      ctx.strokeRect(104, 16, 272, 44);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(109, 21, 262, 34);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4;
      ctx.font = '900 22px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('SELECT GAME', CANVAS_W / 2, 46);
      ctx.fillText('SELECT GAME', CANVAS_W / 2, 46);
    };

    const drawHurtMode = (ctx: CanvasRenderingContext2D) => {
      const s = hurtStateRef.current;

      // Sunset Park Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 236);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.55, '#38bdf8');
      sky.addColorStop(1, '#fde047');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_W, 236);

      // Cartoon Fluffy Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      [
        [85, 75, 24],
        [108, 70, 28],
        [330, 88, 22],
        [355, 84, 26],
      ].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // The Park House silhouette in center-back!
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(185, 138, 110, 68);
      ctx.fillStyle = '#1d4ed8'; // Blue gable roof
      ctx.beginPath();
      ctx.moveTo(175, 138);
      ctx.lineTo(240, 102);
      ctx.lineTo(305, 138);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(228, 168, 24, 38); // Porch door
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(198, 152, 18, 18);
      ctx.fillRect(264, 152, 18, 18);

      // Park Trees & Hedges
      for (let i = 0; i < 4; i++) {
        const tx = i < 2 ? 42 + i * 75 : 345 + (i - 2) * 85;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 7, 178, 14, 38);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(tx, 156, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(tx - 8, 148, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lush Park Grass Strip
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 206, CANVAS_W, 32);

      // Park Asphalt Path
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 238, CANVAS_W, CANVAS_H - 238);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 238, CANVAS_W, 5);

      type DrawItem = { y: number; draw: () => void };
      const items: DrawItem[] = [];

      s.pickups.forEach((pk) => {
        items.push({
          y: pk.y,
          draw: () => {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(pk.x - 10, pk.y - 2, 20, 6);
            ctx.fillStyle = pk.kind === 'cheese' ? '#facc15' : '#06b6d4';
            ctx.fillRect(pk.x - 9, pk.y - 18, 18, 14);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(pk.x - 9, pk.y - 18, 18, 14);
          },
        });
      });

      s.enemies.forEach((en) => {
        items.push({
          y: en.y,
          draw: () => {
            const scale = en.kind === 'boss' ? 1.45 : en.kind === 'bruiser' ? 1.2 : 1;
            const w = 22 * scale;
            const h = 36 * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(en.x, en.y, 15 * scale, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            const bob = Math.sin(en.walkPhase) * 2.5;
            // Bruisers get Muscle-Man green skin & dark tank; Boss gets crimson Death Kwon Do Sensei robes
            ctx.fillStyle =
              en.hurtTimer > 0
                ? '#ffffff'
                : en.kind === 'boss'
                  ? '#b91c1c'
                  : en.kind === 'bruiser'
                    ? '#4ade80'
                    : '#f97316';
            ctx.fillRect(en.x - w / 2, en.y - h + bob, w, h);

            if (en.kind === 'boss') {
              // Sensei white beard & mullet
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(en.x - w / 3, en.y - h + 12 + bob, (w * 2) / 3, 12);
            } else {
              ctx.fillStyle = '#090d16';
              ctx.fillRect(en.x - w / 2, en.y - h + 6 + bob, w, 5);
            }

            const bw = 28 * scale;
            ctx.fillStyle = '#090d16';
            ctx.fillRect(en.x - bw / 2, en.y - h - 10, bw, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(en.x - bw / 2, en.y - h - 10, bw * (en.hp / en.maxHp), 4);
          },
        });
      });

      // Playable Blue-Jay Death Kwon Do Brawler!
      items.push({
        y: s.py,
        draw: () => {
          if (s.invuln > 0 && Math.floor(s.invuln / 4) % 2 === 1) return;
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.beginPath();
          ctx.ellipse(s.px, s.py, 16, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          const bob = Math.sin(s.walkPhase) * 2;
          // Torn Death Kwon Do Jean Shorts
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(s.px - 9, s.py - 16 + bob, 18, 14);
          // White Chest / Death Kwon Do Vest
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(s.px - 10, s.py - 32 + bob, 20, 16);
          // Blue Jay Feathers & Head Crest
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(s.px - 10, s.py - 48 + bob, 20, 16);
          // Crest & Mullet
          ctx.fillStyle = '#78350f';
          ctx.fillRect(s.px - s.facing * 12, s.py - 46 + bob, 8, 14);
          // Beak
          ctx.fillStyle = '#090d16';
          ctx.fillRect(s.px + s.facing * 9, s.py - 41 + bob, s.facing * 7, 4);
          // Red Death Kwon Do Headband
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(s.px - 10, s.py - 45 + bob, 20, 4);

          if (s.atkTimer > 4) {
            ctx.fillStyle = s.atkStep === 2 ? '#facc15' : '#38bdf8';
            ctx.fillRect(s.px + s.facing * 14, s.py - 28 + bob, s.facing * 26, 8);
          }
          if (s.specialTimer > 12) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(s.px, s.py - 16, (28 - s.specialTimer) * 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        },
      });

      items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

      // Top HUD
      ctx.fillStyle = 'rgba(9,13,22,0.85)';
      ctx.fillRect(10, 10, CANVAS_W - 20, 34);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, CANVAS_W - 20, 34);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('HP', 20, 31);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(42, 21, 108, 12);
      ctx.fillStyle = s.hp > 30 ? '#22c55e' : '#ef4444';
      ctx.fillRect(42, 21, 108 * (s.hp / s.maxHp), 12);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('CHOP', 164, 31);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(198, 21, 88, 12);
      ctx.fillStyle = s.meter >= 50 ? '#facc15' : '#0ea5e9';
      ctx.fillRect(198, 21, 88 * (s.meter / 100), 12);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#facc15';
      ctx.fillText(
        `STG ${s.stage} W${s.wave}/3${s.combo > 1 ? ` · ${s.combo}x` : ''}`,
        CANVAS_W - 20,
        31
      );
    };

    const drawMoonMode = (ctx: CanvasRenderingContext2D) => {
      const m = moonStateRef.current;

      const bg = ctx.createLinearGradient(0, 0, 0, 342);
      bg.addColorStop(0, '#090d16');
      bg.addColorStop(1, '#7c2d12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, 342);

      ctx.fillStyle = '#ffffff';
      m.stars.forEach((st) => ctx.fillRect(st.x, st.y, st.size, st.size));

      // Floating Park Chunk + Distant Earth
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(390, 88, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(378, 76, 15, 11);
      ctx.fillRect(394, 90, 10, 11);

      // Lunar Ground
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, 342, CANVAS_W, CANVAS_H - 342);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(0, 342, CANVAS_W, 5);

      m.obstacles.forEach((obs) => {
        if (obs.kind === 'rock') {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = '#ffedd5';
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        } else if (obs.kind === 'crater') {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        } else if (obs.kind === 'ramp') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.h);
          ctx.lineTo(obs.x + obs.w, obs.y);
          ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
          ctx.closePath();
          ctx.fill();
        } else if (obs.kind === 'rigjuice') {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
      });

      // Park Golf Cart with Blue Jay + Raccoon drivers!
      if (!(m.invuln > 0 && Math.floor(m.invuln / 4) % 2 === 1)) {
        const cx = m.cartX;
        const cy = m.cartY;
        ctx.fillStyle = m.boosting ? '#38bdf8' : '#f8fafc';
        ctx.fillRect(cx - 26, cy - 22, 52, 14);
        // Park Green Stripe
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(cx - 26, cy - 16, 52, 4);
        // Roof & struts
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 20, cy - 40, 40, 5);
        ctx.fillRect(cx - 17, cy - 35, 3, 13);
        ctx.fillRect(cx + 13, cy - 35, 3, 13);
        // Raccoon (left seat) & Blue Jay (right seat)
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx - 11, cy - 30, 9, 8);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cx + 2, cy - 34, 10, 12);
        // Tires
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 5, 7, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 5, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Giant Moon Monster (Regular Show "The Power" style!)
      const mx = 10 + m.monsterOffset;
      const jaw = Math.sin(tickRef.current * 0.2) * 8;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(mx, 286, 62, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(mx + 14, 256, 15, 10);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(mx + 8, 284 - jaw / 2, 46, 18 + Math.abs(jaw));
      // White Saw Teeth
      ctx.fillStyle = '#ffffff';
      for (let t = 12; t < 48; t += 10) {
        ctx.fillRect(mx + t, 284 - jaw / 2, 5, 5);
      }

      // Top HUD
      ctx.fillStyle = 'rgba(9,13,22,0.85)';
      ctx.fillRect(10, 10, CANVAS_W - 20, 34);
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, CANVAS_W - 20, 34);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CART: ${'♥'.repeat(m.hp)}`, 20, 31);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('NITRO', 142, 31);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(182, 21, 95, 12);
      ctx.fillStyle = m.boosting ? '#facc15' : '#38bdf8';
      ctx.fillRect(182, 21, 95 * (m.fuel / 100), 12);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText(`SEC ${m.sector} · ${Math.floor(m.distance)}/${m.sectorGoal}m`, CANVAS_W - 20, 31);
    };

    const drawDestroyerMode = (ctx: CanvasRenderingContext2D) => {
      const d = destroyerStateRef.current;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.strokeStyle = 'rgba(239,68,68,0.18)';
      ctx.lineWidth = 1;
      const gridOffset = (tickRef.current * 2) % 32;
      for (let gx = 0; gx < CANVAS_W; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }
      for (let gy = gridOffset; gy < CANVAS_H; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }

      if (d.beamState === 'warn') {
        ctx.strokeStyle = tickRef.current % 6 < 3 ? '#facc15' : '#ef4444';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.beamX, d.bossY + 35);
        ctx.lineTo(d.beamX, CANVAS_H);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (d.beamState === 'fire') {
        ctx.fillStyle = 'rgba(239,68,68,0.45)';
        ctx.fillRect(d.beamX - 22, d.bossY + 35, 44, CANVAS_H - d.bossY);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.beamX - 8, d.bossY + 35, 16, CANVAS_H - d.bossY);
      }

      // Destroyer of Worlds Haunted 3D Arcade Cabinet Boss
      const bx = d.bossX;
      const by = d.bossY;
      ctx.fillStyle = d.bossFlash > 0 ? '#ffffff' : '#991b1b';
      ctx.fillRect(bx - 56, by - 46, 112, 92);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx - 56, by - 46, 112, 92);

      // Marquee header
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bx - 50, by - 42, 100, 10);
      ctx.fillStyle = '#090d16';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DESTROYER OF WORLDS', bx, by - 34);

      // Boss CRT Screen
      ctx.fillStyle = '#090d16';
      ctx.fillRect(bx - 42, by - 28, 84, 46);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx - 28, by - 18, 16, 10);
      ctx.fillRect(bx + 12, by - 18, 16, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 26, by + 2, 52, 8);
      // Coin slot weak core
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bx - 16, by + 26, 32, 14);

      ctx.fillStyle = '#22d3ee';
      d.shots.forEach((sh) => ctx.fillRect(sh.x - 2, sh.y - 6, 4, 12));

      d.projectiles.forEach((pr) => {
        ctx.fillStyle = pr.kind === 'skull' ? '#facc15' : '#ef4444';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Player Defender Blaster Ship
      if (!(d.invuln > 0 && Math.floor(d.invuln / 4) % 2 === 1)) {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(d.px, d.py - 17);
        ctx.lineTo(d.px + 15, d.py + 12);
        ctx.lineTo(d.px, d.py + 6);
        ctx.lineTo(d.px - 15, d.py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Top Boss HUD
      ctx.fillStyle = 'rgba(9,13,22,0.85)';
      ctx.fillRect(10, 10, CANVAS_W - 20, 34);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, CANVAS_W - 20, 34);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`HP: ${'♥'.repeat(d.hp)}`, 20, 31);

      ctx.fillStyle = '#f87171';
      ctx.fillText('BOSS', 110, 31);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(142, 21, 145, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(142, 21, 145 * (d.bossHp / d.bossMaxHp), 12);

      ctx.textAlign = 'right';
      ctx.fillStyle = d.bombCharge >= 100 ? '#facc15' : '#22d3ee';
      ctx.fillText(
        d.bombCharge >= 100 ? 'POWER BOMB [X]' : `POWER ${Math.floor(d.bombCharge)}%`,
        CANVAS_W - 20,
        31
      );
    };

    const step = () => {
      tickRef.current++;

      if (!isPausedRef.current && !gameOverRef.current) {
        if (screenRef.current === 'menu') {
          updateMenu();
        } else if (screenRef.current === 'playing') {
          if (activeModeRef.current === 'hurt') updateHurtMode();
          else if (activeModeRef.current === 'moon') updateMoonMode();
          else if (activeModeRef.current === 'destroyer') updateDestroyerMode();
        }

        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          return p.life > 0;
        });

        textsRef.current = textsRef.current.filter((t) => {
          t.y += t.vy;
          t.life--;
          return t.life > 0;
        });

        prevActionARef.current = keysRef.current.actionA;
        prevActionBRef.current = keysRef.current.actionB;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        if (screenRef.current === 'menu') {
          drawMenu(ctx);
        } else {
          if (activeModeRef.current === 'hurt') drawHurtMode(ctx);
          else if (activeModeRef.current === 'moon') drawMoonMode(ctx);
          else drawDestroyerMode(ctx);

          particlesRef.current.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          });

          textsRef.current.forEach((t) => {
            ctx.fillStyle = '#090d16';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x + 1, t.y + 1);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
          });
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [addScore, initMode, spawnParticles, spawnText, triggerGameOver]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* 3-in-1 Sub-Level Arcade Switcher Bar */}
      <div className="w-full max-w-[480px] flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-2 mb-2 bg-slate-900/95 border border-slate-800 rounded-xl text-[9px] font-retro">
        <div className="flex items-center gap-1.5 flex-wrap">
          {MODE_META.map((m, idx) => {
            const isCurrent = screen !== 'menu' && activeMode === m.id;
            const isCleared = clearedModes[m.id];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => initMode(m.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border transition cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? m.pillColor
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>[{idx + 1}] {m.shortTitle}</span>
                {isCleared && <Check className="w-2.5 h-2.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={returnToModeSelect}
          className={`px-2 py-1 rounded-md border transition cursor-pointer whitespace-nowrap ${
            screen === 'menu'
              ? 'bg-red-600/20 border-red-500 text-red-300'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
          }`}
        >
          SELECT GAME
        </button>
      </div>

      {/* Main CRT Canvas Stage */}
      <div className="relative w-full max-w-[480px] aspect-[480/420] rounded-xl overflow-hidden border-2 border-slate-800 bg-black shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className={`w-full h-full block ${screen === 'menu' ? 'cursor-pointer' : ''}`}
        />

        {/* Sub-Level Cleared Overlay */}
        {screen === 'stage_clear' && (
          <div className="absolute inset-0 bg-black/82 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-[10px] font-retro text-emerald-400 tracking-widest mb-1 tabular-nums">
              SUB-LEVEL BONUS +{clearBanner.bonus.toLocaleString()} PTS
            </span>
            <h3 className="text-lg sm:text-xl font-retro text-amber-300 mb-2">
              {clearBanner.title}
            </h3>
            <p className="text-xs font-mono text-slate-300 mb-5 max-w-xs">
              {clearBanner.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={handleNextSubLevel}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-retro text-[10px] rounded-lg cursor-pointer transition whitespace-nowrap"
              >
                NEXT SUB-LEVEL
              </button>
              <button
                type="button"
                onClick={handleReplaySameMode}
                className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-retro text-[10px] rounded-lg cursor-pointer transition whitespace-nowrap"
              >
                HARDER ROUND
              </button>
              <button
                type="button"
                onClick={returnToModeSelect}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-retro text-[10px] rounded-lg cursor-pointer transition whitespace-nowrap"
              >
                MENU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mode-specific Controls Footer */}
      <div className="w-full max-w-[480px] mt-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate">
          {screen === 'menu'
            ? `${hudSubInfo} · Click panel or press 1 / 2 / 3`
            : activeMode === 'hurt'
              ? 'Move: Arrows/WASD · Punch/Kick: SPACE · Death Chop (50%): X'
              : activeMode === 'moon'
                ? 'Steer: ◄ ► · Jump: SPACE/▲ · Rigjuice Nitro: X'
                : 'Move: Arrows/WASD · Blaster: SPACE · Power Bomb (100%): X'}
        </span>
      </div>
    </div>
  );
};
