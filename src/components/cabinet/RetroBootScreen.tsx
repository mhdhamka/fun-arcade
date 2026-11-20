import React, { useState, useEffect, useRef } from 'react';
import { GameModule } from '../../types/arcade';
import { soundManager } from '../../services/audio';
import {
  Cpu,
  HardDrive,
  CheckCircle2,
  Zap,
  FastForward,
  Terminal,
  Disc,
} from 'lucide-react';

export interface RetroBootScreenProps {
  game: GameModule;
  onComplete: () => void;
  onCancel?: () => void;
  skipable?: boolean;
  soundEnabled?: boolean;
  /** Speed multiplier for testing or faster boots (default: 1.0) */
  speedMultiplier?: number;
}

interface LogLine {
  id: string;
  text: string;
  status: 'ok' | 'loading' | 'info' | 'pass';
  timestamp: string;
}

// Simulated ROM sizes and cartridge chip IDs per game
const CARTRIDGE_SPECS: Record<string, { romSize: string; chip: string; mapper: string; crc: string }> = {
  snake: { romSize: '64 KB ROM', chip: 'ARC-MOS-6502', mapper: 'MAPPER-00', crc: '0x8F4A2C' },
  flappy: { romSize: '128 KB ROM', chip: 'ARC-Z80-A', mapper: 'MAPPER-01', crc: '0x3D19E4' },
  tetris: { romSize: '256 KB ROM', chip: 'ARC-68000', mapper: 'MMC-3B', crc: '0xB72109' },
  invaders: { romSize: '128 KB ROM', chip: 'ARC-8080-RGB', mapper: 'MAPPER-00', crc: '0x4E89F1' },
  mario: { romSize: '512 KB ROM', chip: 'ARC-RICOH-2A03', mapper: 'MMC-5A', crc: '0xFA9033' },
  angrybirds: { romSize: '384 KB ROM', chip: 'ARC-ARM-V4', mapper: 'MAPPER-04', crc: '0x1C765D' },
  breakout: { romSize: '192 KB ROM', chip: 'ARC-Z80-PRO', mapper: 'MAPPER-02', crc: '0x6B41E8' },
  asteroids: { romSize: '256 KB ROM', chip: 'ARC-DVG-VEC', mapper: 'VECTOR-01', crc: '0x9D20C7' },
  regularshow: { romSize: '768 KB 3-IN-1', chip: 'ARC-TRIPLE-90', mapper: 'MULTI-CART', crc: '0x3A91F4' },
};

export const RetroBootScreen: React.FC<RetroBootScreenProps> = ({
  game,
  onComplete,
  onCancel,
  skipable = true,
  soundEnabled = true,
  speedMultiplier = 1.0,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('POWER-ON RESET');
  const [memoryHex, setMemoryHex] = useState<string>('0x0000');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  const specs = CARTRIDGE_SPECS[game.id] || {
    romSize: '256 KB ROM',
    chip: 'ARC-CPU-STANDARD',
    mapper: 'MAPPER-01',
    crc: '0x992B1F',
  };

  const accentColor = game.accentColor || '#38bdf8';

  // Handle fast-forward / skip
  const handleSkip = () => {
    if (!skipable || completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
    setCurrentStep('READY! LAUNCHING CARTRIDGE...');
    if (soundEnabled) {
      soundManager.play('start');
    }
    setTimeout(() => {
      onComplete();
    }, 120);
  };

  // Keyboard shortcut listener for spacebar / enter / escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipable, onCancel]);

  // Main Hardware Initialization Sequence Timeline
  useEffect(() => {
    completedRef.current = false;
    let isCancelled = false;

    const baseDelay = 220 / speedMultiplier;

    // Timeline event sequence
    const timeline: {
      delay: number;
      pct: number;
      step: string;
      log?: { text: string; status: 'ok' | 'loading' | 'info' | 'pass' };
      hex?: string;
      sfx?: 'select' | 'point' | 'level' | 'coin' | 'start';
    }[] = [
      {
        delay: baseDelay * 0.5,
        pct: 8,
        step: 'HARDWARE INITIALIZATION (POST)...',
        log: { text: 'SYSTEM BIOS v2.4 (C) 1984 FUN ARCADE CORP', status: 'info' },
        hex: '0x0800',
        sfx: 'select',
      },
      {
        delay: baseDelay * 1.0,
        pct: 18,
        step: 'TESTING MAIN SYSTEM RAM (64 KB)...',
        log: { text: 'CPU BUS: Z80A @ 4.0 MHz CLOCK SYNCHRONIZED', status: 'ok' },
        hex: '0x4000',
        sfx: 'point',
      },
      {
        delay: baseDelay * 1.5,
        pct: 32,
        step: 'RAM TEST: 0x0000 - 0xFFFF...',
        log: { text: 'MEMORY TEST: 65,536 BYTES VERIFIED [OK]', status: 'ok' },
        hex: '0xFFFF',
        sfx: 'point',
      },
      {
        delay: baseDelay * 2.2,
        pct: 46,
        step: 'VERIFYING VRAM & CRT RASTER TIMING (60Hz)...',
        log: { text: 'VRAM DUAL-PORT 32KB: 320x240 RGB BITMAP READY', status: 'ok' },
        hex: '0x7FFF',
        sfx: 'select',
      },
      {
        delay: baseDelay * 2.9,
        pct: 60,
        step: `DETECTED CARTRIDGE SLOT 1: ${game.title.toUpperCase()}`,
        log: {
          text: `MOUNTING CARTRIDGE: [${game.title.toUpperCase()}] (${specs.romSize})`,
          status: 'loading',
        },
        hex: '0x8000',
        sfx: 'point',
      },
      {
        delay: baseDelay * 3.7,
        pct: 74,
        step: 'DECOMPRESSING SPRITES & AUDIO TABLES...',
        log: { text: `CHIP DECODER [${specs.chip}]: BUS INTEGRITY 100%`, status: 'ok' },
        hex: '0xA400',
        sfx: 'select',
      },
      {
        delay: baseDelay * 4.5,
        pct: 88,
        step: 'CALIBRATING CONTROLLER BUS & AUDIO SYNTH...',
        log: { text: `ROM CHECKSUM CRC32: ${specs.crc} [PASS]`, status: 'pass' },
        hex: '0xD800',
        sfx: 'point',
      },
      {
        delay: baseDelay * 5.4,
        pct: 100,
        step: 'INITIALIZATION COMPLETE // PLAYER 1 READY',
        log: { text: 'HARDWARE READY: EXECUTE VECTOR -> 0x0100', status: 'ok' },
        hex: '0xFFFF',
        sfx: 'start',
      },
    ];

    const timeouts: number[] = [];

    timeline.forEach((item) => {
      const t = window.setTimeout(() => {
        if (isCancelled || completedRef.current) return;

        setProgress(item.pct);
        setCurrentStep(item.step);
        if (item.hex) setMemoryHex(item.hex);

        if (item.log) {
          const timestamp = `[00:${String(Math.floor(item.delay / 10)).padStart(4, '0')}]`;
          setLogs((prev) => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random()}`,
              text: item.log!.text,
              status: item.log!.status,
              timestamp,
            },
          ]);
        }

        if (item.sfx && soundEnabled) {
          soundManager.play(item.sfx);
        }

        if (item.pct === 100) {
          setIsCompleted(true);
          completedRef.current = true;
          // Hold 100% screen briefly so user sees the completed state
          const finishTimeout = window.setTimeout(() => {
            if (!isCancelled) {
              onComplete();
            }
          }, 320 / speedMultiplier);
          timeouts.push(finishTimeout);
        }
      }, item.delay);

      timeouts.push(t);
    });

    return () => {
      isCancelled = true;
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [game.id, speedMultiplier]);

  // Generate segmented retro blocks for the progress bar
  const totalBlocks = 20;
  const filledBlocks = Math.round((progress / 100) * totalBlocks);

  return (
    <div
      id="retro-boot-screen"
      onClick={handleSkip}
      className="relative w-full h-[380px] sm:h-[440px] bg-black text-slate-200 flex flex-col justify-between p-4 sm:p-6 select-none font-mono text-xs overflow-hidden cursor-pointer group"
      title={skipable ? 'Click anywhere or press [SPACE] to fast-forward' : undefined}
    >
      {/* Subtle Phosphor CRT Glow Ambience */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 75%)`,
        }}
      />

      {/* Top Banner: Retro BIOS & Hardware Header */}
      <div className="relative z-10 border-b border-slate-800 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-retro text-[10px] sm:text-xs text-emerald-400 tracking-wider">
            ARCADE HARDWARE SYSTEM · BOOT ROM v2.4
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
          <span className="hidden sm:inline">MEM: {memoryHex}</span>
          <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-retro text-[9px]">
            60 FPS NTSC
          </span>
        </div>
      </div>

      {/* Main Center Stage: Cartridge Slot & Hardware Diagnostics */}
      <div className="relative z-10 my-auto space-y-4 max-w-lg mx-auto w-full">
        {/* Cartridge Physical Insertion Badge */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded bg-slate-900 border flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: `${accentColor}88`,
                boxShadow: `0 0 12px ${accentColor}44`,
              }}
            >
              <Disc className="w-5 h-5" style={{ color: accentColor }} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-retro text-xs text-white truncate">{game.title}</span>
                <span
                  className="px-1.5 py-0.2 text-[8px] font-retro rounded border uppercase"
                  style={{
                    borderColor: `${accentColor}55`,
                    color: accentColor,
                  }}
                >
                  {game.genre}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{specs.romSize}</span>
                <span>•</span>
                <span>{specs.chip}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0 pl-2">
            <div className="text-[9px] font-retro text-amber-400">SLOT 1</div>
            <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ENGAGED</span>
            </div>
          </div>
        </div>

        {/* Real-time Hardware Initialization Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-retro">
            <span className="text-cyan-300 flex items-center gap-1.5 truncate">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{currentStep}</span>
            </span>
            <span className="text-amber-300 font-bold whitespace-nowrap ml-2">
              {progress}%
            </span>
          </div>

          {/* Stepped Retro Segmented Block Progress Bar */}
          <div className="w-full bg-slate-950 border-2 border-slate-700 rounded p-1 shadow-inner">
            <div className="grid grid-cols-20 gap-0.5 sm:gap-1 h-5 sm:h-6">
              {Array.from({ length: totalBlocks }).map((_, idx) => {
                const isFilled = idx < filledBlocks;
                const isLastFilled = idx === filledBlocks - 1;
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: isFilled ? accentColor : '#090d16',
                      boxShadow: isFilled ? `0 0 6px ${accentColor}88` : undefined,
                    }}
                    className={`rounded-[1px] transition-all duration-75 ${
                      isLastFilled ? 'animate-pulse' : ''
                    } ${isFilled ? 'opacity-100' : 'opacity-30'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Micro Memory Diagnostics Line */}
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-500" />
              <span>ROM DECOMPRESSION: {Math.min(100, Math.round(progress * 1.05))}%</span>
            </span>
            <span className="text-emerald-400">
              {progress >= 32 ? 'MEMORY TEST: OK' : 'CHECKING MEMORY...'}
            </span>
          </div>
        </div>

        {/* Retro Terminal Rolling Diagnostic Log */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded p-2.5 h-24 overflow-hidden font-mono text-[9px] sm:text-[10px] flex flex-col justify-end space-y-1">
          {logs.slice(-4).map((log) => (
            <div key={log.id} className="flex items-center gap-2 truncate">
              <span className="text-slate-500">{log.timestamp}</span>
              <span
                className={`truncate ${
                  log.status === 'ok'
                    ? 'text-emerald-400'
                    : log.status === 'pass'
                    ? 'text-cyan-300'
                    : log.status === 'loading'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                {log.text}
              </span>
              {log.status === 'ok' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer: Skip Guidance & Status Indicator */}
      <div className="relative z-10 border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="font-retro text-[9px] text-slate-300">
            {isCompleted ? 'LAUNCHING DISPLAY...' : 'HARDWARE CYCLES ACTIVE'}
          </span>
        </div>

        {skipable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 text-slate-300 hover:text-amber-300 font-mono text-[9px] transition cursor-pointer shadow-sm group-hover:border-amber-400/40"
          >
            <FastForward className="w-3 h-3 text-amber-400" />
            <span>[SPACE] SKIP</span>
          </button>
        )}
      </div>
    </div>
  );
};
