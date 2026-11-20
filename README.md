<div align="center">

<pre>
  _____ _   _ _   _       _    ____   ____    _    ____  _____ 
 |  ___| | | | \ | |     / \  |  _ \ / ___|  / \  |  _ \| ____|
 | |_  | | | |  \| |    / _ \ | |_) | |     / _ \ | | | |  _|  
 |  _| | |_| | |\  |   / ___ \|  _ <| |___ / ___ \| |_| | |___ 
 |_|    \___/|_| \_|  /_/   \_\_| \_\\____/_/   \_\____/|_____|
 
<pre>

### `PRESS START · MODULAR RETRO ARCADE CABINET · 60 FPS HTML5 CANVAS`

[![React 19](https://img.shields.io/badge/React-19-06b6d4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3b82f6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-a855f7?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Web Audio](https://img.shields.io/badge/Audio-8--Bit_Synth-eab308?style=for-the-badge)](#8-bit-procedural-audio)

**INSERT COIN.** A modular web-based retro arcade platform featuring **9 playable HTML5 Canvas cartridges**, procedural 8-bit Web Audio synthesis, customizable physical cabinet chassis & vinyl sticker decals, CRT scanline emulation, global rival leaderboards, and unlockable career achievements.

</div>

---

## Cartridge Library (`9 Playable Cabinets`)

| # | Cartridge | Genre | Signature Mechanic |
| :-: | :--- | :--- | :--- |
| **01** | **SNAKE CLASSIC** | `GRID ARCADE` | Eat pixel apples & timed golden stars as speed climbs |
| **02** | **FLAPPY PIXELS** | `GRAVITY RUNNER` | Precision tap-to-flap flight through neon warp pipes |
| **03** | **TETRIS MATRIX** | `PUZZLE BLOCK` | Ghost projection, Hold piece (`C`), and 4-line Quad clears |
| **04** | **SPACE INVADERS** | `GALACTIC SHOOTER` | Destructible bunkers, marching armada, and Red Mystery UFO |
| **05** | **SUPER MARIO** | `PLATFORM RUNNER` | Mystery `[?]` blocks, Super Mushrooms, Goombas, and flagpole |
| **06** | **ANGRY BIRDS** | `PHYSICS SLINGSHOT` | Parabolic slingshot arcs, TNT chain blasts, and tower physics |
| **07** | **NEON BREAKER** | `BRICK BREAKER` | Armored steel bricks, `WIDE`/`MULTI`/`LASER` capsules & turrets |
| **08** | **ASTRO BLASTER** | `VECTOR SHOOTER` | 360° drift thrusters, splitting asteroids, UFOs & Hyperspace |
| **09** | **REGULAR SHOW 3-IN-1** | `3-IN-1 ACTION` | **Put the Hurt on Him**, **Escape from the Moon**, **Destroy the Destroyer** |

<details>
<summary><strong>Open Cartridge Manuals & Controls (Click to Expand)</strong></summary>

### 🥋🌒👾 REGULAR SHOW 3-IN-1 (`3 Playable Sub-Levels`)
Boot into the authentic **Yellow / Orange / Red `SELECT GAME`** screen and jump between all three park arcade games:
1. **Put the Hurt on Him!** *(Gold)* — 2.5D Death Kwon Do park brawler. Chain 3-hit combos (`Space`), unleash **Death Chop** shockwaves (`X` at 50% meter), and grab Grilled Cheese & Rigjuice.
2. **Escape from the Moon** *(Orange)* — Drive the Park Golf Cart across lunar craters and ramps (`Space` jump, `X` Rigjuice Nitro) to outrun the Moon Monster.
3. **Destroy the Destroyer!** *(Red)* — 4-way arena shooter against the haunted *Destroyer of Worlds* cabinet boss (`Space` twin blasters, `X` Power Bomb).

*Quick Shortcuts:* `1` / `2` / `3` jump straight to any sub-level · `M` returns to `SELECT GAME`.

### NEON BREAKER & ASTRO BLASTER
- **Neon Breaker:** Slide paddle with `Mouse` / `Touch` / `◄ ►`, press `Space` to launch or fire twin lasers when Laser pickup is active.
- **Astro Blaster:** `◄ ►` rotate, `▲` thrust, `Space` fire plasma, `Shift / X` emergency Hyperspace Warp.

</details>

---

## Cabinet Features & Hardware Stack

<details>
<summary><strong>Physical Cabinet Customizer & Vinyl Sticker Workshop</strong></summary>

- **7 Authentic Cabinet Housings:** *1982 Walnut Woodgrain*, *Neo-Tokyo 2099*, *Aero City Candy Cab*, *Midnight Carbon Stealth*, *Radical 90s Memphis Pop*, *Atomic Phosphor Vector*, and *Vegas High-Roller Gold*.
- **4 Corner Mount Slots + Decal Studio:** Stick die-cut vinyl & holographic decals onto Top-Left/Right bezels and Bottom-Left/Right control decks with rotation, scale, gloss/worn/holo filters, or upload custom PNG art.

</details>

<details>
<summary><strong>Procedural 8-Bit Audio Synthesizer</strong></summary>

- Zero external MP3/WAV files — every coin drop, laser pew, jump, impact, pause chime, and victory fanfare is synthesized live via the **Web Audio API**.
- Includes **Master Output Gain (`0%–100%`)**, toggleable **Ambient Arcade Hall Hum**, and an in-app **Audio Test Bench**.

</details>

<details>
<summary><strong>Hall of Fame, Avatars & Achievements</strong></summary>

- **8x8 Pixel Avatar Editor:** Pick a preset retro hero or paint your own custom pixel portrait.
- **Global Rivals Leaderboard:** Compete against 13 seeded arcade rivals across all 9 games with `localStorage` persistence.
- **15 Career Badges:** Track progression toward *Insert Coin*, *First Win*, *Arcade Polymath*, *Brick Architect*, *Void Ace*, *Park Legend*, and more.

</details>

---

## Universal Arcade Controls

| Input | Keyboard | Touch / On-Screen |
| :--- | :--- | :--- |
| **Move / Steer** | `▲ ▼ ◄ ►` or `W A S D` | Virtual D-Pad |
| **Primary Action (`A`)** | `Space` / `Z` / `Enter` | Red `A` Button |
| **Special Action (`B`)** | `Shift` / `X` / `C` | Amber `B` Button |
| **Pause Cabinet** | `P` / `Escape` *(auto-pauses on tab switch)* | Top Bar `PAUSE` |
| **Fast-Forward Boot** | `Space` / Click | Click Boot Screen |

---

## Local Setup (`Insert Coin to Run`)

```bash
# 1. Install dependencies
npm install

# 2. Start the arcade dev server (http://localhost:3000)
npm run dev

# 3. Typecheck & build production bundle
npx tsc --noEmit; npm run build
```

<div align="center">

**BUILT FOR RETRO GAMING ENTHUSIASTS · `60 FPS NATIVE` · `ZERO EXTERNAL AUDIO ASSETS`**

</div>