import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeGameProps } from '../../types/arcade';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;
const CANVAS_WIDTH = COLS * BLOCK_SIZE;
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface TetrominoDef {
  shape: number[][];
  color: string;
  glow: string;
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4',
    glow: '#22d3ee',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6',
    glow: '#60a5fa',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316',
    glow: '#fb923c',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308',
    glow: '#facc15',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#10b981',
    glow: '#34d399',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7',
    glow: '#c084fc',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444',
    glow: '#f87171',
  },
};

const TETROMINO_KEYS: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

function getRandomPiece(): TetrominoType {
  return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
}

export const TetrisGame: React.FC<ArcadeGameProps> = ({
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
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextPiece, setNextPiece] = useState<TetrominoType>('T');
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);

  // Active matrix grid (0 or color string)
  const gridRef = useRef<(string | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  // Active piece state
  const activeTypeRef = useRef<TetrominoType>('I');
  const activeShapeRef = useRef<number[][]>(TETROMINOES.I.shape);
  const piecePosRef = useRef<{ x: number; y: number }>({ x: 3, y: 0 });

  const nextPieceRef = useRef<TetrominoType>('T');
  const holdPieceRef = useRef<TetrominoType | null>(null);
  const canHoldRef = useRef(true);

  const dropCounterRef = useRef(0);
  const lastTimeRef = useRef(0);
  const gameOverRef = useRef(false);
  const clearingLinesRef = useRef<{ row: number; alpha: number }[]>([]);
  const lastInputTimestampRef = useRef(0);

  // Helper to check collision
  const checkCollision = (shape: number[][], offset: { x: number; y: number }): boolean => {
    const grid = gridRef.current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = offset.x + c;
          const newY = offset.y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && grid[newY][newX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Rotate matrix clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Spawn piece
  const spawnNewPiece = useCallback(
    (typeToSpawn?: TetrominoType) => {
      const type = typeToSpawn || nextPieceRef.current;
      const nextType = getRandomPiece();

      activeTypeRef.current = type;
      activeShapeRef.current = TETROMINOES[type].shape;
      piecePosRef.current = {
        x: Math.floor((COLS - TETROMINOES[type].shape[0].length) / 2),
        y: 0,
      };

      nextPieceRef.current = nextType;
      setNextPiece(nextType);
      canHoldRef.current = true;
      setCanHold(true);

      // Check immediate top-out game over
      if (checkCollision(activeShapeRef.current, piecePosRef.current)) {
        gameOverRef.current = true;
        playSfx('gameover');
        onGameOver(score);
      }
    },
    [onGameOver, playSfx, score]
  );

  // Lock piece into grid
  const lockPiece = useCallback(() => {
    const shape = activeShapeRef.current;
    const pos = piecePosRef.current;
    const color = TETROMINOES[activeTypeRef.current].color;
    const grid = gridRef.current;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const targetY = pos.y + r;
          const targetX = pos.x + c;
          if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
            grid[targetY][targetX] = color;
          }
        }
      }
    }

    playSfx('hit');

    // Check full rows
    let clearedCount = 0;
    const newClearingLines: { row: number; alpha: number }[] = [];

    for (let r = ROWS - 1; r >= 0; r--) {
      const isFull = grid[r].every((cell) => cell !== null);
      if (isFull) {
        clearedCount++;
        newClearingLines.push({ row: r, alpha: 1.0 });
      }
    }

    if (clearedCount > 0) {
      clearingLinesRef.current = newClearingLines;
      playSfx('clear');

      // Clear the rows and shift down
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r].every((cell) => cell !== null)) {
          grid.splice(r, 1);
          grid.unshift(Array(COLS).fill(null));
          r++; // re-check same row index after shift
        }
      }

      // Point scoring table (classic Nintendo scoring scaled)
      const pointValues = [0, 100, 300, 500, 800];
      const addedPoints = (pointValues[clearedCount] || 100) * level;

      if (clearedCount >= 4) {
        // Quad TETRIS clear!
        onTriggerScreenShake?.('intense');
        onTriggerParticles?.('fireworks', 70);
        onGameCompleted?.(score + addedPoints, 'QUAD TETRIS CLEAR!');
      } else {
        onTriggerScreenShake?.('subtle');
        onTriggerParticles?.('stars', clearedCount * 18);
      }

      setScore((s) => {
        const newTotal = s + addedPoints;
        onScoreChange(newTotal);
        return newTotal;
      });

      setLines((prevLines) => {
        const newLines = prevLines + clearedCount;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          playSfx('level');
          onTriggerScreenShake?.('intense');
          onTriggerParticles?.('confetti', 80);
          onGameCompleted?.(score + addedPoints, `LEVEL ${newLevel} REACHED!`);
        }
        return newLines;
      });
    }

    spawnNewPiece();
  }, [
    level,
    onGameCompleted,
    onScoreChange,
    onTriggerParticles,
    onTriggerScreenShake,
    playSfx,
    score,
    spawnNewPiece,
  ]);

  // Movement methods
  const moveLeft = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    const newPos = { ...piecePosRef.current, x: piecePosRef.current.x - 1 };
    if (!checkCollision(activeShapeRef.current, newPos)) {
      piecePosRef.current = newPos;
      playSfx('select');
    }
  }, [isPaused, playSfx]);

  const moveRight = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    const newPos = { ...piecePosRef.current, x: piecePosRef.current.x + 1 };
    if (!checkCollision(activeShapeRef.current, newPos)) {
      piecePosRef.current = newPos;
      playSfx('select');
    }
  }, [isPaused, playSfx]);

  const softDrop = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    const newPos = { ...piecePosRef.current, y: piecePosRef.current.y + 1 };
    if (!checkCollision(activeShapeRef.current, newPos)) {
      piecePosRef.current = newPos;
      setScore((s) => {
        const updated = s + 1;
        onScoreChange(updated);
        return updated;
      });
    } else {
      lockPiece();
    }
  }, [isPaused, lockPiece, onScoreChange]);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    let dropDistance = 0;
    while (!checkCollision(activeShapeRef.current, {
      x: piecePosRef.current.x,
      y: piecePosRef.current.y + 1,
    })) {
      piecePosRef.current.y += 1;
      dropDistance++;
    }
    setScore((s) => {
      const updated = s + dropDistance * 2;
      onScoreChange(updated);
      return updated;
    });
    lockPiece();
  }, [isPaused, lockPiece, onScoreChange]);

  const rotate = useCallback(() => {
    if (gameOverRef.current || isPaused) return;
    const rotated = rotateMatrix(activeShapeRef.current);
    // Try basic rotation
    if (!checkCollision(rotated, piecePosRef.current)) {
      activeShapeRef.current = rotated;
      playSfx('select');
      return;
    }
    // Wall kick left
    if (!checkCollision(rotated, { x: piecePosRef.current.x - 1, y: piecePosRef.current.y })) {
      piecePosRef.current.x -= 1;
      activeShapeRef.current = rotated;
      playSfx('select');
      return;
    }
    // Wall kick right
    if (!checkCollision(rotated, { x: piecePosRef.current.x + 1, y: piecePosRef.current.y })) {
      piecePosRef.current.x += 1;
      activeShapeRef.current = rotated;
      playSfx('select');
      return;
    }
  }, [isPaused, playSfx]);

  const holdCurrentPiece = useCallback(() => {
    if (gameOverRef.current || isPaused || !canHoldRef.current) return;
    const cur = activeTypeRef.current;
    if (holdPieceRef.current === null) {
      holdPieceRef.current = cur;
      setHoldPiece(cur);
      spawnNewPiece();
    } else {
      const prevHold = holdPieceRef.current;
      holdPieceRef.current = cur;
      setHoldPiece(cur);
      spawnNewPiece(prevHold);
    }
    canHoldRef.current = false;
    setCanHold(false);
    playSfx('select');
  }, [isPaused, playSfx, spawnNewPiece]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveLeft();
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveRight();
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotate();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          softDrop();
          e.preventDefault();
          break;
        case ' ':
          hardDrop();
          e.preventDefault();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          holdCurrentPiece();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hardDrop, holdCurrentPiece, moveLeft, moveRight, rotate, softDrop]);

  // Virtual arcade controller mapping
  useEffect(() => {
    if (!virtualInput || virtualInput.timestamp <= lastInputTimestampRef.current) return;
    lastInputTimestampRef.current = virtualInput.timestamp;

    if (virtualInput.left) moveLeft();
    else if (virtualInput.right) moveRight();
    else if (virtualInput.down) softDrop();
    else if (virtualInput.up) rotate();

    if (virtualInput.actionA) hardDrop();
    if (virtualInput.actionB) holdCurrentPiece();
  }, [virtualInput, moveLeft, moveRight, softDrop, rotate, hardDrop, holdCurrentPiece]);

  // Initialize first piece & main loop
  useEffect(() => {
    nextPieceRef.current = getRandomPiece();
    setNextPiece(nextPieceRef.current);
    spawnNewPiece();

    let animId: number;
    const loop = (time: number) => {
      if (gameOverRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      const dropInterval = Math.max(120, 800 - (level - 1) * 70);

      if (!isPaused) {
        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;
        dropCounterRef.current += delta;

        if (dropCounterRef.current > dropInterval) {
          dropCounterRef.current = 0;
          softDrop();
        }
      } else {
        lastTimeRef.current = time;
      }

      // Render
      if (ctx && canvas) {
        // Clear background
        ctx.fillStyle = '#060911';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
          ctx.beginPath();
          ctx.moveTo(x * BLOCK_SIZE, 0);
          ctx.lineTo(x * BLOCK_SIZE, CANVAS_HEIGHT);
          ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * BLOCK_SIZE);
          ctx.lineTo(CANVAS_WIDTH, y * BLOCK_SIZE);
          ctx.stroke();
        }

        // Draw locked cells in grid
        const grid = gridRef.current;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const cellColor = grid[r][c];
            if (cellColor) {
              ctx.fillStyle = cellColor;
              ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
              // Highlight edge
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(c * BLOCK_SIZE + 2, r * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 3);
            }
          }
        }

        // Draw Ghost Piece (Shadow where piece lands)
        let ghostY = piecePosRef.current.y;
        while (!checkCollision(activeShapeRef.current, { x: piecePosRef.current.x, y: ghostY + 1 })) {
          ghostY++;
        }

        const activeShape = activeShapeRef.current;
        const pos = piecePosRef.current;
        const color = TETROMINOES[activeTypeRef.current].color;

        // Draw Ghost outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        for (let r = 0; r < activeShape.length; r++) {
          for (let c = 0; c < activeShape[r].length; c++) {
            if (activeShape[r][c] !== 0) {
              const gx = (pos.x + c) * BLOCK_SIZE;
              const gy = (ghostY + r) * BLOCK_SIZE;
              ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            }
          }
        }
        ctx.setLineDash([]);

        // Draw Active Falling Piece
        ctx.shadowColor = TETROMINOES[activeTypeRef.current].glow;
        ctx.shadowBlur = 8;
        for (let r = 0; r < activeShape.length; r++) {
          for (let c = 0; c < activeShape[r].length; c++) {
            if (activeShape[r][c] !== 0) {
              const px = (pos.x + c) * BLOCK_SIZE;
              const py = (pos.y + r) * BLOCK_SIZE;
              ctx.fillStyle = color;
              ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, 3);
            }
          }
        }
        ctx.shadowBlur = 0;

        // Draw Line Clearing Flash
        const clearing = clearingLinesRef.current;
        for (let i = clearing.length - 1; i >= 0; i--) {
          const cl = clearing[i];
          ctx.fillStyle = `rgba(255, 255, 255, ${cl.alpha})`;
          ctx.fillRect(0, cl.row * BLOCK_SIZE, CANVAS_WIDTH, BLOCK_SIZE);
          cl.alpha -= 0.1;
          if (cl.alpha <= 0) {
            clearing.splice(i, 1);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [level, isPaused, softDrop, spawnNewPiece]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
      {/* Side HUD: Hold & Stats */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 w-full sm:w-28 order-2 sm:order-1">
        {/* Hold Box */}
        <div className="flex-1 sm:flex-none w-full bg-slate-900/90 border-2 border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] font-retro text-slate-400 mb-1">HOLD (C)</div>
          <div className="h-12 flex items-center justify-center">
            {holdPiece ? (
              <span
                className="text-xs font-retro font-bold px-2 py-1 rounded"
                style={{
                  color: TETROMINOES[holdPiece].color,
                  textShadow: `0 0 8px ${TETROMINOES[holdPiece].glow}`,
                }}
              >
                {holdPiece}
              </span>
            ) : (
              <span className="text-[10px] text-slate-600 font-retro">-</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 sm:flex-none w-full bg-slate-900/90 border-2 border-slate-800 rounded-lg p-2.5 space-y-2 text-center font-retro text-[10px]">
          <div>
            <div className="text-slate-400 text-[9px]">LEVEL</div>
            <div className="text-amber-400 font-bold text-xs">{level}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[9px]">LINES</div>
            <div className="text-emerald-400 font-bold text-xs">{lines}</div>
          </div>
        </div>
      </div>

      {/* Main Playfield Matrix */}
      <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-black order-1 sm:order-2">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pixelated block"
        />
      </div>

      {/* Next Box HUD */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 w-full sm:w-28 order-3">
        <div className="flex-1 sm:flex-none w-full bg-slate-900/90 border-2 border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] font-retro text-slate-400 mb-1">NEXT</div>
          <div className="h-12 flex items-center justify-center">
            <span
              className="text-sm font-retro font-bold px-2 py-1 rounded"
              style={{
                color: TETROMINOES[nextPiece].color,
                textShadow: `0 0 8px ${TETROMINOES[nextPiece].glow}`,
              }}
            >
              {nextPiece}
            </span>
          </div>
        </div>

        <div className="hidden sm:block w-full text-[9px] text-slate-400 font-retro bg-slate-900/70 border border-slate-800/80 rounded p-2 text-left space-y-1">
          <div><span className="text-cyan-400 font-bold">▲</span> Rotate</div>
          <div><span className="text-cyan-400 font-bold">◄ ►</span> Shift</div>
          <div><span className="text-cyan-400 font-bold">▼</span> Soft</div>
          <div><span className="text-cyan-400 font-bold">SPC</span> Drop</div>
        </div>
      </div>
    </div>
  );
};
