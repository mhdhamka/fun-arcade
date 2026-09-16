import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('public', 'videos');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTH = 384;
const HEIGHT = 240;
const FPS = 30;
const DURATION_FRAMES = 120; // 4.0 seconds per loop

// Simple 4x6 pixel font for retro arcade HUD
const GLYPHS = {
  '0': [
    0b1110,
    0b1010,
    0b1010,
    0b1010,
    0b1110,
    0b0000,
  ],
  '1': [
    0b0100,
    0b1100,
    0b0100,
    0b0100,
    0b1110,
    0b0000,
  ],
  '2': [
    0b1110,
    0b0010,
    0b1110,
    0b1000,
    0b1110,
    0b0000,
  ],
  '3': [
    0b1110,
    0b0010,
    0b1110,
    0b0010,
    0b1110,
    0b0000,
  ],
  '4': [
    0b1010,
    0b1010,
    0b1110,
    0b0010,
    0b0010,
    0b0000,
  ],
  '5': [
    0b1110,
    0b1000,
    0b1110,
    0b0010,
    0b1110,
    0b0000,
  ],
  '6': [
    0b1110,
    0b1000,
    0b1110,
    0b1010,
    0b1110,
    0b0000,
  ],
  '7': [
    0b1110,
    0b0010,
    0b0010,
    0b0100,
    0b0100,
    0b0000,
  ],
  '8': [
    0b1110,
    0b1010,
    0b1110,
    0b1010,
    0b1110,
    0b0000,
  ],
  '9': [
    0b1110,
    0b1010,
    0b1110,
    0b0010,
    0b1110,
    0b0000,
  ],
  'A': [
    0b0110,
    0b1001,
    0b1111,
    0b1001,
    0b1001,
    0b0000,
  ],
  'B': [
    0b1110,
    0b1001,
    0b1110,
    0b1001,
    0b1110,
    0b0000,
  ],
  'C': [
    0b0111,
    0b1000,
    0b1000,
    0b1000,
    0b0111,
    0b0000,
  ],
  'D': [
    0b1110,
    0b1001,
    0b1001,
    0b1001,
    0b1110,
    0b0000,
  ],
  'E': [
    0b1111,
    0b1000,
    0b1110,
    0b1000,
    0b1111,
    0b0000,
  ],
  'F': [
    0b1111,
    0b1000,
    0b1110,
    0b1000,
    0b1000,
    0b0000,
  ],
  'G': [
    0b0111,
    0b1000,
    0b1011,
    0b1001,
    0b0111,
    0b0000,
  ],
  'H': [
    0b1001,
    0b1001,
    0b1111,
    0b1001,
    0b1001,
    0b0000,
  ],
  'I': [
    0b1110,
    0b0100,
    0b0100,
    0b0100,
    0b1110,
    0b0000,
  ],
  'K': [
    0b1001,
    0b1010,
    0b1100,
    0b1010,
    0b1001,
    0b0000,
  ],
  'L': [
    0b1000,
    0b1000,
    0b1000,
    0b1000,
    0b1111,
    0b0000,
  ],
  'M': [
    0b1001,
    0b1111,
    0b1001,
    0b1001,
    0b1001,
    0b0000,
  ],
  'N': [
    0b1001,
    0b1101,
    0b1011,
    0b1001,
    0b1001,
    0b0000,
  ],
  'O': [
    0b0110,
    0b1001,
    0b1001,
    0b1001,
    0b0110,
    0b0000,
  ],
  'P': [
    0b1110,
    0b1001,
    0b1110,
    0b1000,
    0b1000,
    0b0000,
  ],
  'R': [
    0b1110,
    0b1001,
    0b1110,
    0b1010,
    0b1001,
    0b0000,
  ],
  'S': [
    0b0111,
    0b1000,
    0b0110,
    0b0001,
    0b1110,
    0b0000,
  ],
  'T': [
    0b1111,
    0b0100,
    0b0100,
    0b0100,
    0b0100,
    0b0000,
  ],
  'U': [
    0b1001,
    0b1001,
    0b1001,
    0b1001,
    0b0110,
    0b0000,
  ],
  'V': [
    0b1001,
    0b1001,
    0b1001,
    0b0110,
    0b0100,
    0b0000,
  ],
  'W': [
    0b1001,
    0b1001,
    0b1001,
    0b1111,
    0b1001,
    0b0000,
  ],
  'X': [
    0b1001,
    0b0110,
    0b0100,
    0b0110,
    0b1001,
    0b0000,
  ],
  'Y': [
    0b1001,
    0b1001,
    0b0110,
    0b0100,
    0b0100,
    0b0000,
  ],
  ':': [
    0b0000,
    0b0100,
    0b0000,
    0b0100,
    0b0000,
    0b0000,
  ],
  '+': [
    0b0000,
    0b0100,
    0b1110,
    0b0100,
    0b0000,
    0b0000,
  ],
  '-': [
    0b0000,
    0b0000,
    0b1110,
    0b0000,
    0b0000,
    0b0000,
  ],
  '/': [
    0b0001,
    0b0010,
    0b0100,
    0b1000,
    0b0000,
    0b0000,
  ],
  ' ': [
    0b0000,
    0b0000,
    0b0000,
    0b0000,
    0b0000,
    0b0000,
  ],
};

class SoftwareCanvas {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.buf = Buffer.alloc(w * h * 3);
  }

  clear(r = 0, g = 0, b = 0) {
    for (let i = 0; i < this.buf.length; i += 3) {
      this.buf[i] = r;
      this.buf[i + 1] = g;
      this.buf[i + 2] = b;
    }
  }

  setPixel(x, y, r, g, b) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 3;
    this.buf[idx] = r;
    this.buf[idx + 1] = g;
    this.buf[idx + 2] = b;
  }

  blendPixel(x, y, r, g, b, alpha = 1) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 3;
    const invA = 1 - alpha;
    this.buf[idx] = Math.min(255, Math.floor(this.buf[idx] * invA + r * alpha));
    this.buf[idx + 1] = Math.min(255, Math.floor(this.buf[idx + 1] * invA + g * alpha));
    this.buf[idx + 2] = Math.min(255, Math.floor(this.buf[idx + 2] * invA + b * alpha));
  }

  fillRect(x, y, w, h, r, g, b, alpha = 1) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.floor(x + w));
    const y1 = Math.min(this.height, Math.floor(y + h));

    if (alpha >= 1) {
      for (let py = y0; py < y1; py++) {
        let idx = (py * this.width + x0) * 3;
        for (let px = x0; px < x1; px++) {
          this.buf[idx] = r;
          this.buf[idx + 1] = g;
          this.buf[idx + 2] = b;
          idx += 3;
        }
      }
    } else {
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          this.blendPixel(px, py, r, g, b, alpha);
        }
      }
    }
  }

  strokeRect(x, y, w, h, r, g, b, thickness = 1) {
    this.fillRect(x, y, w, thickness, r, g, b);
    this.fillRect(x, y + h - thickness, w, thickness, r, g, b);
    this.fillRect(x, y, thickness, h, r, g, b);
    this.fillRect(x + w - thickness, y, thickness, h, r, g, b);
  }

  drawText(text, x, y, scale = 1, r = 255, g = 255, b = 255) {
    text = (text + '').toUpperCase();
    let cx = x;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const glyph = GLYPHS[ch] || GLYPHS[' '];
      for (let gy = 0; gy < glyph.length; gy++) {
        const row = glyph[gy];
        for (let gx = 0; gx < 4; gx++) {
          if ((row >> (3 - gx)) & 1) {
            this.fillRect(cx + gx * scale, y + gy * scale, scale, scale, r, g, b);
          }
        }
      }
      cx += 5 * scale;
    }
  }

  applyScanlines(darken = 0.85) {
    for (let y = 0; y < this.height; y += 2) {
      let idx = y * this.width * 3;
      for (let x = 0; x < this.width; x++) {
        this.buf[idx] = Math.floor(this.buf[idx] * darken);
        this.buf[idx + 1] = Math.floor(this.buf[idx + 1] * darken);
        this.buf[idx + 2] = Math.floor(this.buf[idx + 2] * darken);
        idx += 3;
      }
    }
  }
}

// Render Games
function renderSnakeFrame(canvas, frameIdx) {
  canvas.clear(10, 15, 20); // Dark retro slate

  // Subtle grid
  const cellSize = 16;
  for (let x = 0; x < canvas.width; x += cellSize) {
    for (let y = 30; y < canvas.height - 10; y += cellSize) {
      canvas.setPixel(x, y, 20, 30, 40);
    }
  }

  // Border frame
  canvas.strokeRect(8, 26, canvas.width - 16, canvas.height - 34, 30, 50, 60, 2);

  // Snake choreography
  // 120 frames. Path starts around (8, 6), moves down, right, up, eats apple, turns right, catches star.
  const t = frameIdx / DURATION_FRAMES;
  const path = [
    { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 },
    { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 12, y: 4 },
    { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 }, { x: 13, y: 7 },
    { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 }, { x: 17, y: 7 },
    { x: 17, y: 6 }, { x: 17, y: 5 }, { x: 18, y: 5 }, { x: 19, y: 5 },
    { x: 20, y: 5 }, { x: 20, y: 6 }, { x: 20, y: 7 }, { x: 20, y: 8 },
    { x: 19, y: 8 }, { x: 18, y: 8 }, { x: 17, y: 8 }, { x: 16, y: 8 },
    { x: 15, y: 8 }, { x: 14, y: 8 }, { x: 13, y: 8 }, { x: 12, y: 8 },
    { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 },
    { x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }, { x: 5, y: 7 },
    { x: 5, y: 6 }, { x: 5, y: 5 }
  ];

  const totalSteps = path.length;
  const headPosFloat = (t * totalSteps * 1.5) % totalSteps;
  const headIdx = Math.floor(headPosFloat);
  const snakeLen = frameIdx < 35 ? 7 : frameIdx < 80 ? 9 : 12;

  // Apple position
  const appleX = 14;
  const appleY = 7;
  const appleEaten = frameIdx >= 35 && frameIdx < 85;

  if (!appleEaten) {
    const pulse = Math.sin(frameIdx * 0.3) * 2;
    const ax = appleX * cellSize + 2 - pulse / 2;
    const ay = appleY * cellSize + 2 - pulse / 2;
    const as = cellSize - 4 + pulse;
    canvas.fillRect(ax, ay, as, as, 239, 68, 68); // Bright Red
    canvas.fillRect(ax + 3, ay + 3, 3, 3, 255, 255, 255); // Highlight
    canvas.fillRect(ax + as / 2 - 1, ay - 3, 2, 3, 34, 197, 94); // Green Stem
  }

  // Golden Bonus Star
  if (frameIdx >= 40 && frameIdx < 85) {
    const starX = 19 * cellSize + 3;
    const starY = 6 * cellSize + 3;
    const flash = (frameIdx % 6 < 3);
    const starCol = flash ? [253, 224, 71] : [245, 158, 11];
    canvas.fillRect(starX, starY, 10, 10, starCol[0], starCol[1], starCol[2]);
    canvas.fillRect(starX + 3, starY - 3, 4, 16, starCol[0], starCol[1], starCol[2]);
    canvas.fillRect(starX - 3, starY + 3, 16, 4, starCol[0], starCol[1], starCol[2]);
  }

  // Draw snake body
  for (let i = snakeLen - 1; i >= 0; i--) {
    const pIdx = (headIdx - i + totalSteps * 10) % totalSteps;
    const pt = path[pIdx];
    const px = pt.x * cellSize + 2;
    const py = pt.y * cellSize + 2;
    const isHead = i === 0;

    if (isHead) {
      canvas.fillRect(px - 1, py - 1, cellSize - 2, cellSize - 2, 52, 211, 153); // Emerald head
      // Eyes
      canvas.fillRect(px + 2, py + 2, 3, 3, 0, 0, 0);
      canvas.fillRect(px + 8, py + 2, 3, 3, 0, 0, 0);
    } else {
      const grad = Math.floor(180 - i * 8);
      canvas.fillRect(px, py, cellSize - 4, cellSize - 4, 16, Math.max(100, grad), 110);
    }
  }

  // Particle bursts
  if (frameIdx >= 35 && frameIdx < 45) {
    const age = frameIdx - 35;
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const dist = age * 4;
      const bx = appleX * cellSize + 8 + Math.cos(angle) * dist;
      const by = appleY * cellSize + 8 + Math.sin(angle) * dist;
      canvas.fillRect(bx, by, 3, 3, 255, 200, 50, 1 - age / 10);
    }
  }

  // HUD
  const score = frameIdx < 35 ? 120 : frameIdx < 85 ? 130 : 180;
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('SNAKE CLASSIC', 12, 8, 2, 52, 211, 153);
  canvas.drawText(`SCORE:${score}`, 190, 8, 2, 255, 255, 255);
  canvas.drawText('LEN:12', 310, 8, 2, 251, 191, 36);

  canvas.applyScanlines();
}

function renderFlappyFrame(canvas, frameIdx) {
  // Twilight gradient sky
  for (let y = 0; y < canvas.height; y++) {
    const t = y / canvas.height;
    const r = Math.floor(15 * (1 - t) + 10 * t);
    const g = Math.floor(20 * (1 - t) + 15 * t);
    const b = Math.floor(45 * (1 - t) + 30 * t);
    canvas.fillRect(0, y, canvas.width, 1, r, g, b);
  }

  // Twinkling stars
  const starSeeds = [
    [30, 40], [80, 25], [140, 50], [210, 30], [290, 45], [350, 20],
    [55, 90], [180, 80], [260, 95], [320, 70]
  ];
  starSeeds.forEach(([sx, sy], i) => {
    const tw = (Math.sin(frameIdx * 0.2 + i) + 1) * 0.5;
    const bright = Math.floor(160 + tw * 95);
    canvas.fillRect(sx, sy, 2, 2, bright, bright, 255);
  });

  // Distant cyberpunk city skyline
  const buildings = [
    [10, 160, 35, 80], [45, 140, 40, 100], [85, 170, 30, 70],
    [115, 130, 45, 110], [160, 150, 35, 90], [195, 135, 50, 105],
    [245, 160, 40, 80], [285, 145, 35, 95], [320, 125, 45, 115]
  ];
  buildings.forEach(([bx, by, bw, bh]) => {
    canvas.fillRect(bx, by, bw, bh, 20, 25, 45);
    // Glowing windows
    for (let wy = by + 10; wy < by + bh - 10; wy += 12) {
      for (let wx = bx + 6; wx < bx + bw - 6; wx += 9) {
        if ((wx + wy) % 5 === 0) {
          canvas.fillRect(wx, wy, 4, 5, 245, 158, 11, 0.7);
        } else if ((wx + wy) % 3 === 0) {
          canvas.fillRect(wx, wy, 4, 5, 6, 182, 212, 0.7);
        }
      }
    }
  });

  // Pipes scrolling
  const pipeSpeed = 2.5;
  const pipeWidth = 36;
  const gapSize = 68;

  const pipes = [
    { x: (400 - (frameIdx * pipeSpeed) % 480) - 50, gapY: 100 },
    { x: (640 - (frameIdx * pipeSpeed) % 480) - 50, gapY: 120 }
  ];

  pipes.forEach(({ x, gapY }) => {
    if (x > -pipeWidth && x < canvas.width) {
      // Top pipe
      canvas.fillRect(x, 24, pipeWidth, gapY - 24, 34, 197, 94);
      canvas.strokeRect(x, 24, pipeWidth, gapY - 24, 21, 128, 61, 2);
      // Top pipe rim
      canvas.fillRect(x - 3, gapY - 14, pipeWidth + 6, 14, 74, 222, 128);
      canvas.strokeRect(x - 3, gapY - 14, pipeWidth + 6, 14, 21, 128, 61, 2);

      // Bottom pipe
      const bTop = gapY + gapSize;
      const bH = canvas.height - bTop - 18;
      canvas.fillRect(x, bTop, pipeWidth, bH, 34, 197, 94);
      canvas.strokeRect(x, bTop, pipeWidth, bH, 21, 128, 61, 2);
      // Bottom pipe rim
      canvas.fillRect(x - 3, bTop, pipeWidth + 6, 14, 74, 222, 128);
      canvas.strokeRect(x - 3, bTop, pipeWidth + 6, 14, 21, 128, 61, 2);
    }
  });

  // Flappy Bird position & animation
  const birdX = 90;
  // Bird bobbing up and down with flaps
  const flapCycle = frameIdx % 16;
  const flapUp = flapCycle < 6;
  const flapY = Math.sin(frameIdx * 0.12) * 18 + Math.cos(frameIdx * 0.25) * 8;
  const birdY = 110 + flapY;

  // Bird body (Yellow)
  canvas.fillRect(birdX, birdY, 18, 14, 250, 204, 21);
  canvas.fillRect(birdX + 2, birdY - 2, 12, 3, 250, 204, 21);
  // Big pixel eye
  canvas.fillRect(birdX + 11, birdY + 1, 5, 5, 255, 255, 255);
  canvas.fillRect(birdX + 13, birdY + 2, 2, 2, 0, 0, 0);
  // Orange beak
  canvas.fillRect(birdX + 17, birdY + 5, 6, 5, 249, 115, 22);
  // Flapping wing
  if (flapUp) {
    canvas.fillRect(birdX + 2, birdY - 4, 8, 6, 254, 240, 138);
  } else {
    canvas.fillRect(birdX + 2, birdY + 5, 8, 6, 254, 240, 138);
  }

  // Exhaust trail behind bird
  for (let t = 1; t <= 4; t++) {
    const tx = birdX - t * 6 - (frameIdx % 4);
    const ty = birdY + 6 + (Math.sin(frameIdx + t) * 3);
    canvas.fillRect(tx, ty, 3, 3, 255, 255, 255, 0.7 - t * 0.15);
  }

  // Scrolling ground
  canvas.fillRect(0, canvas.height - 18, canvas.width, 18, 78, 52, 46);
  canvas.fillRect(0, canvas.height - 18, canvas.width, 4, 34, 197, 94); // Green grass strip
  const gOffset = (frameIdx * pipeSpeed * 1.5) % 16;
  for (let gx = -gOffset; gx < canvas.width; gx += 16) {
    canvas.fillRect(gx, canvas.height - 12, 8, 3, 100, 70, 60);
  }

  // HUD
  const score = Math.floor(frameIdx / 15) + 6;
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('FLAPPY PIXELS', 12, 8, 2, 250, 204, 21);
  canvas.drawText(`SCORE:${score}`, 200, 8, 2, 255, 255, 255);
  canvas.drawText('BEST:38', 305, 8, 2, 249, 115, 22);

  canvas.applyScanlines();
}

function renderTetrisFrame(canvas, frameIdx) {
  canvas.clear(10, 14, 26); // Matrix dark background

  const matrixX = 110;
  const matrixY = 28;
  const matrixW = 160;
  const matrixH = 200;
  const blockSize = 16;

  // Matrix background grid
  canvas.fillRect(matrixX, matrixY, matrixW, matrixH, 5, 8, 18);
  canvas.strokeRect(matrixX - 2, matrixY - 2, matrixW + 4, matrixH + 4, 30, 58, 138, 2);

  for (let gx = 0; gx < matrixW; gx += blockSize) {
    for (let gy = 0; gy < matrixH; gy += blockSize) {
      canvas.setPixel(matrixX + gx, matrixY + gy, 20, 35, 60);
    }
  }

  // Pre-stacked bottom blocks
  const stack = [
    // Bottom row (row 11)
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    // Row 10
    [1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    // Row 9
    [0, 1, 0, 1, 0, 0, 1, 1, 0, 0],
    // Row 8
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  ];

  const palette = [
    [6, 182, 212],  // Cyan
    [234, 179, 8],  // Yellow
    [168, 85, 247], // Purple
    [34, 197, 94],  // Green
    [239, 68, 68],  // Red
    [249, 115, 22], // Orange
    [59, 130, 246], // Blue
  ];

  // Draw stack
  stack.forEach((row, rIdx) => {
    const by = matrixY + matrixH - (stack.length - rIdx) * blockSize;
    row.forEach((filled, cIdx) => {
      if (filled) {
        const bx = matrixX + cIdx * blockSize;
        const color = palette[(cIdx + rIdx) % palette.length];
        canvas.fillRect(bx + 1, by + 1, blockSize - 2, blockSize - 2, color[0], color[1], color[2]);
        canvas.fillRect(bx + 2, by + 2, blockSize - 4, 2, 255, 255, 255, 0.4); // Highlight
      }
    });
  });

  // Falling Tetromino: Cyan I-piece or Purple T-piece
  // Drop animation over 120 frames
  const dropProgress = (frameIdx % 60) / 60;
  const fallY = matrixY + Math.floor(dropProgress * (matrixH - 5 * blockSize));
  const pieceX = matrixX + 4 * blockSize;

  // Ghost piece projection at bottom
  const ghostY = matrixY + matrixH - 5 * blockSize;
  for (let i = 0; i < 4; i++) {
    canvas.strokeRect(pieceX, ghostY + i * blockSize, blockSize, blockSize, 6, 182, 212, 1);
  }

  // Active Falling Cyan I-Bar
  for (let i = 0; i < 4; i++) {
    const py = fallY + i * blockSize;
    canvas.fillRect(pieceX + 1, py + 1, blockSize - 2, blockSize - 2, 6, 182, 212);
    canvas.fillRect(pieceX + 2, py + 2, blockSize - 4, 2, 255, 255, 255, 0.6);
  }

  // Line Clear flash at frame ~55
  if (frameIdx >= 52 && frameIdx <= 58) {
    const flashRowY = matrixY + matrixH - blockSize;
    canvas.fillRect(matrixX, flashRowY, matrixW, blockSize, 255, 255, 255);
  }

  // Sidebar Preview: Next Piece
  const nextX = matrixX + matrixW + 16;
  const nextY = matrixY + 20;
  canvas.fillRect(nextX - 8, nextY - 14, 80, 75, 15, 23, 42);
  canvas.strokeRect(nextX - 8, nextY - 14, 80, 75, 30, 58, 138, 1);
  canvas.drawText('NEXT', nextX, nextY - 6, 2, 148, 163, 184);

  // Purple T-piece in preview
  const tCol = palette[2];
  canvas.fillRect(nextX + 16, nextY + 18, 36, 12, tCol[0], tCol[1], tCol[2]);
  canvas.fillRect(nextX + 28, nextY + 30, 12, 12, tCol[0], tCol[1], tCol[2]);

  // Sidebar Stats
  const statX = 14;
  const statY = matrixY + 20;
  canvas.fillRect(statX, statY, 80, 110, 15, 23, 42);
  canvas.strokeRect(statX, statY, 80, 110, 30, 58, 138, 1);
  canvas.drawText('STATS', statX + 8, statY + 8, 2, 6, 182, 212);
  canvas.drawText('LINES', statX + 8, statY + 28, 1, 148, 163, 184);
  canvas.drawText('024', statX + 8, statY + 40, 2, 255, 255, 255);
  canvas.drawText('LEVEL', statX + 8, statY + 62, 1, 148, 163, 184);
  canvas.drawText('04', statX + 8, statY + 74, 2, 234, 179, 8);
  canvas.drawText('SCORE', statX + 8, statY + 92, 1, 148, 163, 184);

  // Top Marquee Header
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('TETRIS MATRIX', 12, 8, 2, 6, 182, 212);
  canvas.drawText('SCORE:008450', 200, 8, 2, 255, 255, 255);

  canvas.applyScanlines();
}

function renderInvadersFrame(canvas, frameIdx) {
  canvas.clear(5, 7, 15); // Deep space

  // Scrolling starfield
  for (let i = 0; i < 40; i++) {
    const sx = (i * 37 + 13) % canvas.width;
    const sy = (i * 53 + frameIdx * 1.5) % (canvas.height - 24) + 24;
    const b = (i % 3 === 0) ? 255 : 160;
    canvas.setPixel(sx, sy, b, b, b);
  }

  // Red Mystery UFO at top
  const ufoSpeed = 3;
  const ufoX = (frameIdx * ufoSpeed) % (canvas.width + 120) - 60;
  if (ufoX > -40 && ufoX < canvas.width) {
    const uy = 34;
    canvas.fillRect(ufoX + 6, uy, 20, 4, 239, 68, 68);
    canvas.fillRect(ufoX + 2, uy + 4, 28, 6, 248, 113, 113);
    canvas.fillRect(ufoX + 8, uy + 10, 16, 3, 239, 68, 68);
    // Center siren light
    const flash = (frameIdx % 4 < 2);
    canvas.fillRect(ufoX + 13, uy + 5, 6, 4, flash ? 255 : 200, flash ? 255 : 50, 50);
  }

  // Fleet of Invaders
  const fleetStep = Math.floor(frameIdx / 15) % 2; // 2-frame walking pose
  const fleetOsc = Math.sin(frameIdx * 0.08) * 30;
  const fleetBaseX = 65 + fleetOsc;
  const fleetBaseY = 56;

  const invaderTypes = [
    { name: 'squid', col: [56, 189, 248], pts: 30 },
    { name: 'crab', col: [168, 85, 247], pts: 20 },
    { name: 'octopus', col: [74, 222, 128], pts: 10 },
  ];

  invaderTypes.forEach((inv, rIdx) => {
    const iy = fleetBaseY + rIdx * 24;
    for (let c = 0; c < 6; c++) {
      // Skip one invader that gets shot down around frame 60
      if (rIdx === 1 && c === 3 && frameIdx > 50 && frameIdx < 90) {
        continue;
      }
      const ix = fleetBaseX + c * 38;
      // Draw 14x10 pixel alien
      canvas.fillRect(ix + 3, iy, 8, 2, inv.col[0], inv.col[1], inv.col[2]);
      canvas.fillRect(ix + 1, iy + 2, 12, 4, inv.col[0], inv.col[1], inv.col[2]);
      canvas.fillRect(ix, iy + 6, 14, 2, inv.col[0], inv.col[1], inv.col[2]);
      // Eyes
      canvas.fillRect(ix + 3, iy + 3, 2, 2, 0, 0, 0);
      canvas.fillRect(ix + 9, iy + 3, 2, 2, 0, 0, 0);
      // Legs (2 animation poses)
      if (fleetStep === 0) {
        canvas.fillRect(ix + 1, iy + 8, 3, 3, inv.col[0], inv.col[1], inv.col[2]);
        canvas.fillRect(ix + 10, iy + 8, 3, 3, inv.col[0], inv.col[1], inv.col[2]);
      } else {
        canvas.fillRect(ix + 4, iy + 8, 2, 3, inv.col[0], inv.col[1], inv.col[2]);
        canvas.fillRect(ix + 8, iy + 8, 2, 3, inv.col[0], inv.col[1], inv.col[2]);
      }
    }
  });

  // Green Defense Bunkers
  const bunkerY = 160;
  const bunkers = [70, 150, 230, 310];
  bunkers.forEach((bx) => {
    canvas.fillRect(bx, bunkerY, 32, 16, 34, 197, 94);
    // Bunker arch doorway cutout
    canvas.fillRect(bx + 10, bunkerY + 8, 12, 10, 5, 7, 15);
    // Bunker battle damage notch
    canvas.fillRect(bx + 4, bunkerY + 2, 4, 4, 5, 7, 15);
  });

  // Player Cannon Ship
  const shipOsc = Math.sin(frameIdx * 0.1) * 60;
  const shipX = 180 + shipOsc;
  const shipY = 205;
  canvas.fillRect(shipX + 2, shipY + 6, 28, 8, 56, 189, 248);
  canvas.fillRect(shipX + 8, shipY + 2, 16, 6, 56, 189, 248);
  canvas.fillRect(shipX + 14, shipY - 3, 4, 5, 255, 255, 255); // Gun barrel

  // Lasers fired
  const laserCycle = frameIdx % 30;
  if (laserCycle < 24) {
    const lY = shipY - 10 - laserCycle * 6;
    canvas.fillRect(shipX + 15, lY, 2, 8, 253, 224, 71);
  }

  // Explosion sparks at frame 50-60
  if (frameIdx >= 50 && frameIdx <= 65) {
    const age = frameIdx - 50;
    const hitX = fleetBaseX + 3 * 38 + 7;
    const hitY = fleetBaseY + 1 * 24 + 5;
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const d = age * 3;
      canvas.fillRect(hitX + Math.cos(angle) * d, hitY + Math.sin(angle) * d, 2, 2, 255, 255, 255);
    }
  }

  // Ground line
  canvas.fillRect(0, 225, canvas.width, 2, 34, 197, 94);

  // HUD
  const score = frameIdx < 50 ? 1450 : 1650;
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('SPACE INVADERS', 12, 8, 2, 56, 189, 248);
  canvas.drawText(`SCORE:${score}`, 200, 8, 2, 255, 255, 255);
  canvas.drawText('LIVES:3', 315, 8, 2, 74, 222, 128);

  canvas.applyScanlines();
}

function renderMarioFrame(canvas, frameIdx) {
  // 1. Sky blue background
  canvas.fillRect(0, 0, canvas.width, canvas.height, 92, 148, 252);

  // Clouds
  for (let c = 0; c < 3; c++) {
    const cx = (c * 140 + frameIdx * 0.5) % (canvas.width + 80) - 40;
    canvas.fillRect(cx, 40 + c * 20, 48, 14, 255, 255, 255);
    canvas.fillRect(cx + 8, 34 + c * 20, 32, 20, 255, 255, 255);
  }

  // Green hills
  canvas.fillRect(40, 165, 80, 45, 22, 163, 74);
  canvas.fillRect(240, 155, 90, 55, 34, 197, 94);

  // Question blocks & Bricks
  const bump = (frameIdx >= 45 && frameIdx <= 55) ? -4 : 0;
  canvas.fillRect(140, 120 + bump, 20, 20, 245, 158, 11); // [?] block
  canvas.drawText('?', 146, 124 + bump, 2, 120, 53, 15);
  canvas.fillRect(165, 120, 20, 20, 194, 65, 12); // brick
  canvas.fillRect(190, 120, 20, 20, 245, 158, 11); // [?] block
  canvas.drawText('?', 196, 124, 2, 120, 53, 15);

  // Coin pop effect
  if (frameIdx >= 48 && frameIdx <= 75) {
    const coinY = 110 - (frameIdx - 48) * 1.8;
    canvas.fillRect(145, Math.max(70, coinY), 10, 12, 250, 204, 21);
  }

  // Warp pipe
  canvas.fillRect(250, 165, 32, 45, 22, 163, 74);
  canvas.fillRect(246, 155, 40, 12, 34, 197, 94);

  // Mario character animation
  // Running across screen and leaping
  const mProgress = (frameIdx / DURATION_FRAMES);
  let mx = 30 + mProgress * 280;
  let my = 188;

  // Jump arc over pipe
  if (frameIdx >= 35 && frameIdx <= 75) {
    const jPhase = (frameIdx - 35) / 40; // 0 to 1
    const jumpH = Math.sin(jPhase * Math.PI) * 65;
    my -= jumpH;
  }

  // Draw Mario sprite
  canvas.fillRect(mx + 2, my - 20, 12, 4, 239, 68, 68); // Red cap
  canvas.fillRect(mx + 4, my - 16, 10, 6, 254, 215, 170); // Face
  canvas.fillRect(mx + 10, my - 13, 6, 3, 69, 26, 3); // Mustache
  canvas.fillRect(mx + 2, my - 10, 12, 6, 239, 68, 68); // Red shirt
  canvas.fillRect(mx + 3, my - 4, 10, 6, 37, 99, 235); // Blue overalls
  canvas.fillRect(mx + 2, my + 2, 5, 4, 120, 53, 15); // Boot 1
  canvas.fillRect(mx + 9, my + 2, 5, 4, 120, 53, 15); // Boot 2

  // Goomba enemy
  const gx = 210 - (frameIdx % 40) * 0.8;
  const gy = 196;
  if (frameIdx < 70) {
    canvas.fillRect(gx, gy - 8, 14, 8, 154, 52, 18); // Body
    canvas.fillRect(gx + 2, gy, 10, 4, 254, 215, 170); // Face
    canvas.fillRect(gx + 3, gy + 4, 4, 2, 0, 0, 0); // Foot
    canvas.fillRect(gx + 8, gy + 4, 4, 2, 0, 0, 0); // Foot
  }

  // Ground
  canvas.fillRect(0, 210, canvas.width, 30, 154, 52, 18);
  canvas.fillRect(0, 210, canvas.width, 4, 34, 197, 94); // Grass strip

  // HUD
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('SUPER MARIO', 12, 8, 2, 239, 68, 68);
  canvas.drawText('SCORE:001400', 170, 8, 2, 250, 204, 21);
  canvas.drawText('WORLD 1-1', 295, 8, 2, 255, 255, 255);

  canvas.applyScanlines();
}

function renderAngryBirdsFrame(canvas, frameIdx) {
  // Sunset sky gradient
  for (let y = 0; y < canvas.height; y++) {
    const ratio = y / canvas.height;
    const r = Math.floor(2 + ratio * 230);
    const g = Math.floor(132 - ratio * 40);
    const b = Math.floor(199 - ratio * 180);
    canvas.fillRect(0, y, canvas.width, 1, r, g, b);
  }

  // Distant green hills
  canvas.fillRect(40, 170, 120, 40, 21, 128, 61);
  canvas.fillRect(200, 160, 150, 50, 22, 163, 74);

  // Ground
  canvas.fillRect(0, 210, canvas.width, 30, 120, 53, 15);
  canvas.fillRect(0, 210, canvas.width, 4, 34, 197, 94);

  // Wooden Slingshot on left
  const slingX = 50;
  const slingY = 175;
  canvas.fillRect(slingX, slingY + 10, 6, 25, 120, 53, 15);
  canvas.fillRect(slingX - 8, slingY, 6, 12, 120, 53, 15);
  canvas.fillRect(slingX + 8, slingY, 6, 12, 120, 53, 15);

  // Fortress on right
  const fortX = 260;
  const isHit = frameIdx >= 45;
  const collapse = isHit ? Math.min(25, (frameIdx - 45) * 1.5) : 0;

  // Left pillar
  canvas.fillRect(fortX, 150 + collapse, 10, 60 - collapse * 0.5, 180, 83, 9);
  // Right pillar
  canvas.fillRect(fortX + 45, 150 + collapse, 10, 60 - collapse * 0.5, 180, 83, 9);
  // Crossbeam
  canvas.fillRect(fortX - 5, 142 + collapse, 65, 8, 180, 83, 9);
  // TNT crate
  canvas.fillRect(fortX + 18, 185, 20, 20, 220, 38, 38);
  canvas.drawText('TNT', fortX + 20, 190, 1, 254, 240, 138);

  // Green Pig inside fort
  if (frameIdx < 50) {
    canvas.fillRect(fortX + 20, 165, 16, 16, 34, 197, 94);
    canvas.fillRect(fortX + 24, 169, 8, 6, 74, 222, 128); // Snout
    canvas.fillRect(fortX + 22, 166, 3, 3, 255, 255, 255); // Eye
    canvas.fillRect(fortX + 29, 166, 3, 3, 255, 255, 255); // Eye
  } else if (frameIdx <= 65) {
    // Pig pop explosion stars
    const popAge = frameIdx - 50;
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      const dist = popAge * 2.5;
      canvas.fillRect(fortX + 28 + Math.cos(ang) * dist, 172 + Math.sin(ang) * dist, 3, 3, 74, 222, 128);
    }
  }

  // Red Bird flight
  let bx = slingX;
  let by = slingY;
  if (frameIdx < 20) {
    // Pulling back in slingshot
    const pull = (frameIdx / 20) * 16;
    bx -= pull;
    by += pull * 0.4;
    // Rubber bands
    canvas.fillRect(bx, by, slingX - bx, 2, 124, 45, 18);
  } else if (frameIdx < 50) {
    // Flying along parabola
    const fProgress = (frameIdx - 20) / 25; // 0 to 1
    bx = slingX + fProgress * (fortX + 20 - slingX);
    by = slingY - Math.sin(fProgress * Math.PI) * 55 + fProgress * 20;
  } else {
    // Post impact drop
    bx = fortX + 22 + (frameIdx - 50) * 0.5;
    by = Math.min(204, 185 + (frameIdx - 50) * 2);
  }

  // Render Red Bird
  canvas.fillRect(bx - 6, by - 6, 12, 12, 220, 38, 38); // Red body
  canvas.fillRect(bx + 3, by - 1, 5, 4, 245, 158, 11); // Yellow beak
  canvas.fillRect(bx - 2, by - 4, 4, 2, 15, 23, 42); // Eyebrow
  canvas.fillRect(bx, by - 2, 3, 3, 255, 255, 255); // Eye

  // HUD
  const score = frameIdx < 50 ? 9500 : 17500;
  canvas.fillRect(0, 0, canvas.width, 24, 15, 23, 42);
  canvas.drawText('ANGRY BIRDS', 12, 8, 2, 249, 115, 22);
  canvas.drawText(`SCORE:${score}`, 180, 8, 2, 250, 204, 21);
  canvas.drawText('BIRDS:3', 305, 8, 2, 255, 255, 255);

  canvas.applyScanlines();
}

const GAMES = [
  { id: 'snake', render: renderSnakeFrame },
  { id: 'flappy', render: renderFlappyFrame },
  { id: 'tetris', render: renderTetrisFrame },
  { id: 'invaders', render: renderInvadersFrame },
  { id: 'mario', render: renderMarioFrame },
  { id: 'angrybirds', render: renderAngryBirdsFrame },
];

async function encodeVideo(game) {
  const mp4Path = path.join(OUTPUT_DIR, `${game.id}-gameplay.mp4`);
  const webmPath = path.join(OUTPUT_DIR, `${game.id}-gameplay.webm`);

  console.log(`Generating video for ${game.id}...`);

  // 1. Generate MP4 (H.264, web-optimized faststart, yuv420p)
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'ppm',
      '-r', String(FPS),
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '22',
      '-movflags', '+faststart',
      mp4Path
    ]);

    const canvas = new SoftwareCanvas(WIDTH, HEIGHT);
    const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`);

    for (let f = 0; f < DURATION_FRAMES; f++) {
      game.render(canvas, f);
      ffmpeg.stdin.write(header);
      ffmpeg.stdin.write(canvas.buf);
    }
    ffmpeg.stdin.end();

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`  -> Created ${mp4Path}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg MP4 failed with code ${code}`));
      }
    });
  });

  // 2. Generate WebM (VP8/VP9 web format)
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'ppm',
      '-r', String(FPS),
      '-i', '-',
      '-c:v', 'libvpx',
      '-b:v', '600k',
      '-crf', '24',
      webmPath
    ]);

    const canvas = new SoftwareCanvas(WIDTH, HEIGHT);
    const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`);

    for (let f = 0; f < DURATION_FRAMES; f++) {
      game.render(canvas, f);
      ffmpeg.stdin.write(header);
      ffmpeg.stdin.write(canvas.buf);
    }
    ffmpeg.stdin.end();

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`  -> Created ${webmPath}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg WebM failed with code ${code}`));
      }
    });
  });
}

async function main() {
  for (const game of GAMES) {
    await encodeVideo(game);
  }
  console.log('All gameplay animation videos successfully generated!');
}

main().catch((err) => {
  console.error('Error generating videos:', err);
  process.exit(1);
});
