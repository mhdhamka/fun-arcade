import { GameModule, GameId } from '../types/arcade';
import { SnakeGame } from './snake/SnakeGame';
import { FlappyGame } from './flappy/FlappyGame';
import { TetrisGame } from './tetris/TetrisGame';
import { SpaceInvadersGame } from './invaders/SpaceInvadersGame';
import { MarioGame } from './mario/MarioGame';
import { AngryBirdsGame } from './angrybirds/AngryBirdsGame';
import { BreakoutGame } from './breakout/BreakoutGame';
import { AsteroidsGame } from './asteroids/AsteroidsGame';
import { RegularShowGame } from './regularshow/RegularShowGame';

import snakePoster from '../assets/images/snake_gameplay_poster_1789070139773.jpg';
import flappyPoster from '../assets/images/flappy_gameplay_poster_1789070154602.jpg';
import tetrisPoster from '../assets/images/tetris_gameplay_poster_1789070166544.jpg';
import invadersPoster from '../assets/images/invaders_gameplay_poster_1789070177790.jpg';
import marioPoster from '../assets/images/mario_gameplay_poster_1789157825904.jpg';
import angrybirdsPoster from '../assets/images/angrybirds_gameplay_poster_1789157837811.jpg';
import breakoutPoster from '../assets/images/breakout_gameplay_poster_1795161862311.jpg';
import asteroidsPoster from '../assets/images/asteroids_gameplay_poster_1795161862319.jpg';
import regularCartPoster from '../assets/images/regular_cart_poster.svg';

export const ARCADE_GAMES: GameModule[] = [
  {
    id: 'snake',
    title: 'SNAKE CLASSIC',
    genre: 'GRID ARCADE',
    year: '1976',
    description: 'Guide the hungry serpent, gobble pixel apples & golden stars, and avoid crashing into your own tail or boundaries as speed escalates.',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    posterUrl: snakePoster,
    previewVideoUrl: '/videos/snake-gameplay.mp4',
    previewWebmUrl: '/videos/snake-gameplay.webm',
    instructions: [
      'Eat red apples to grow (+10 pts) and gain length',
      'Catch flashing golden stars before they fade (+50 pts)',
      'Avoid running into walls or your own body',
    ],
    controls: [
      { key: '▲ ▼ ◄ ►', action: 'Direct Serpent' },
      { key: 'W A S D', action: 'Alternative Direction' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: SnakeGame,
  },
  {
    id: 'flappy',
    title: 'FLAPPY PIXELS',
    genre: 'GRAVITY RUNNER',
    year: '2013',
    description: 'Tap to flap your wings and defy relentless gravity through a gauntlet of retro warp pipes in a night-sky cyber city.',
    accentColor: '#eab308',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    posterUrl: flappyPoster,
    previewVideoUrl: '/videos/flappy-gameplay.mp4',
    previewWebmUrl: '/videos/flappy-gameplay.webm',
    instructions: [
      'Tap or press Space to flap upward against gravity',
      'Thread through the pipe openings cleanly',
      'One collision is fatal — test your rhythm!',
    ],
    controls: [
      { key: 'SPACE / ▲', action: 'Flap Wings' },
      { key: 'CLICK / TAP', action: 'Touch Flap' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: FlappyGame,
  },
  {
    id: 'tetris',
    title: 'TETRIS MATRIX',
    genre: 'PUZZLE BLOCK',
    year: '1984',
    description: 'Stack geometric falling tetrominoes, plan multi-line clears, rotate into tight crevices, and survive escalating drop tempos.',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    posterUrl: tetrisPoster,
    previewVideoUrl: '/videos/tetris-gameplay.mp4',
    previewWebmUrl: '/videos/tetris-gameplay.webm',
    instructions: [
      'Rotate and guide tetrominoes to form complete horizontal lines',
      'Clear 4 lines at once for a massive TETRIS bonus (+800 pts)',
      'Use the Hold slot (C key) to stash tricky pieces for later',
    ],
    controls: [
      { key: '◄ ►', action: 'Move Lateral' },
      { key: '▲', action: 'Rotate Clockwise' },
      { key: '▼', action: 'Soft Drop' },
      { key: 'SPACE', action: 'Hard Drop' },
      { key: 'C / SHIFT', action: 'Hold Piece' },
      { key: 'P / ESC', action: 'Pause' },
    ],
    component: TetrisGame,
  },
  {
    id: 'invaders',
    title: 'SPACE INVADERS',
    genre: 'GALACTIC SHOOTER',
    year: '1978',
    description: 'Defend earth from marching waves of alien armada behind destructible energy shields and shoot down mystery red motherships.',
    accentColor: '#38bdf8',
    badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    posterUrl: invadersPoster,
    previewVideoUrl: '/videos/invaders-gameplay.mp4',
    previewWebmUrl: '/videos/invaders-gameplay.webm',
    instructions: [
      'Blast alien waves before they descend to ground level',
      'Take cover behind defensive bunkers which take progressive damage',
      'Snag the red Mystery UFO for 100-300 bonus points',
    ],
    controls: [
      { key: '◄ ► / A D', action: 'Move Cannon' },
      { key: 'SPACE / ▲', action: 'Fire Laser' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: SpaceInvadersGame,
  },
  {
    id: 'mario',
    title: 'SUPER MARIO',
    genre: 'PLATFORM RUNNER',
    year: '1985',
    description: 'Sprint and leap across the Mushroom Kingdom! Bump mystery question blocks, stomp Goombas, power up with Super Mushrooms, and capture the flagpole.',
    accentColor: '#ef4444',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    posterUrl: marioPoster,
    previewVideoUrl: '/videos/mario-gameplay.mp4',
    previewWebmUrl: '/videos/mario-gameplay.webm',
    instructions: [
      'Run and jump across pits and green warp pipes',
      'Headbutt [?] blocks for shiny coins (+100 pts) and Super Mushrooms (+1000 pts)',
      'Stomp Goombas from above (+200 pts) to clear your path',
      'Slide down the castle flagpole to clear the world stage!',
    ],
    controls: [
      { key: '◄ ► / A D', action: 'Move Mario' },
      { key: 'SPACE / ▲ / W', action: 'Jump' },
      { key: 'SHIFT / X', action: 'Dash Sprint' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: MarioGame,
  },
  {
    id: 'angrybirds',
    title: 'ANGRY BIRDS',
    genre: 'PHYSICS SLINGSHOT',
    year: '2009',
    description: 'Pull back the slingshot, aim parabolic arcs, and launch furious birds to smash wooden towers, detonate TNT crates, and topple greedy green pigs.',
    accentColor: '#f97316',
    badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    posterUrl: angrybirdsPoster,
    previewVideoUrl: '/videos/angrybirds-gameplay.mp4',
    previewWebmUrl: '/videos/angrybirds-gameplay.webm',
    instructions: [
      'Click & drag the slingshot or use arrow keys + space to pull and launch',
      'Yellow Chuck Bird: Tap screen or Space in mid-air for supersonic dash boost',
      'Smash TNT crates to detonate massive chain reactions (+3000 pts)',
      'Eliminate all green pigs (+5000 pts) to destroy the fortress and advance!',
    ],
    controls: [
      { key: 'CLICK & DRAG', action: 'Pull & Aim Slingshot' },
      { key: '◄ ► ▲ ▼', action: 'Adjust Angle & Power' },
      { key: 'SPACE', action: 'Launch / Boost' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: AngryBirdsGame,
  },
  {
    id: 'breakout',
    title: 'NEON BREAKER',
    genre: 'BRICK BREAKER',
    year: '1976',
    description: 'Deflect the plasma orb off your energy paddle to shatter neon brick matrices, catch power capsules, and unleash twin turret lasers.',
    accentColor: '#ec4899',
    badgeBg: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    posterUrl: breakoutPoster,
    instructions: [
      'Slide your paddle with Mouse/Touch or Left/Right keys to keep the ball in play',
      'Catch falling capsules: W (Wide Paddle), M (Multi-Ball), L (Laser), +Life',
      'Press Space or Click while Laser is active to fire twin turret bolts',
      'Break armored steel bricks twice to clear each neon stage',
    ],
    controls: [
      { key: 'MOUSE / ◄ ►', action: 'Move Paddle' },
      { key: 'SPACE / CLICK', action: 'Launch / Fire Laser' },
      { key: 'P / ESC', action: 'Pause Game' },
    ],
    component: BreakoutGame,
  },
  {
    id: 'asteroids',
    title: 'ASTRO BLASTER',
    genre: 'VECTOR SHOOTER',
    year: '1979',
    description: 'Pilot a phosphor-vector delta starfighter through deep space, split drifting asteroids into shards, and outmaneuver hostile alien saucers.',
    accentColor: '#22d3ee',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    posterUrl: asteroidsPoster,
    instructions: [
      'Rotate your starfighter and pulse thrusters to drift cleanly through asteroid belts',
      'Split large boulders into smaller fragments and watch out for screen wrapping',
      'Hunt down the Red Alien Saucer for +300 bonus points',
      'Hit Shift / X for an emergency Hyperspace Warp when cornered',
    ],
    controls: [
      { key: '◄ ► / A D', action: 'Rotate Ship' },
      { key: '▲ / W', action: 'Thrusters' },
      { key: 'SPACE / Z', action: 'Fire Plasma' },
      { key: 'SHIFT / X', action: 'Hyperspace Warp' },
    ],
    component: AsteroidsGame,
  },
  {
    id: 'regularshow',
    title: 'REGULAR SHOW 3-IN-1',
    genre: '3-IN-1 ACTION',
    year: '2012',
    description: 'Three classic Regular Show arcade sub-levels in one machine: Death Kwon Do street brawling in Put the Hurt on Him, golf-cart chasing in Escape from the Moon, and boss combat in Destroy the Destroyer!',
    accentColor: '#facc15',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    posterUrl: regularCartPoster,
    instructions: [
      'Choose any of the 3 sub-levels on the SELECT GAME screen (click or press 1, 2, 3)',
      'PUT THE HURT ON HIM: Punch/kick park thugs (Space) & unleash Death Chop (X) at 50% meter',
      'ESCAPE FROM THE MOON: Drive the park golf cart, jump craters (Space), and hit Nitro (X)',
      'DESTROY THE DESTROYER: Dodge sweeping beams, fire blasters (Space), and drop The Power Bomb (X)',
    ],
    controls: [
      { key: '▲ ▼ ◄ ►', action: 'Move / Steer / Select' },
      { key: 'SPACE / Z', action: 'Hit / Jump / Blaster' },
      { key: 'SHIFT / X', action: 'Chop / Nitro / Bomb' },
      { key: 'M', action: '3-in-1 Mode Select' },
    ],
    component: RegularShowGame,
  },
];

export function getGameById(id: GameId): GameModule | undefined {
  return ARCADE_GAMES.find((g) => g.id === id);
}
