// All tuning values live here. Tweak freely.
const CONFIG = {
  WIDTH: 800,
  HEIGHT: 300,

  // Dev helpers: D = debug (hitboxes + FPS), N = skip to next level.
  // URL params (only when DEV): ?level=3  ?god=1  ?scene=comic|finale|victory|gameover  ?gate=1
  // Set to false for the final version.
  DEV: true,

  START_LIVES: 3,
  INVINCIBLE_TIME: 1.5,     // seconds of blinking after a hit
  CLEAR_AHEAD: 280,         // obstacles closer than this (px) are removed after a hit

  LEVEL_LENGTH: 400,        // points needed per level (a level can override with `length`)
  PX_PER_POINT: 25,         // distance in px that gives one point
  PLAYER_X: 130,            // where Lauri stands on screen

  SPEED: {
    base: 250,              // px/s at the start of level 1
    perLevel: 14,           // added to base speed per level
    accel: 1.8,             // px/s gained every second within a level
    maxBonus: 60,           // cap for the in-level speed gain
  },

  FIRST_OBSTACLE_DELAY: 1.8, // seconds before the first obstacle of a level
  GAP: {                     // minimum time (s) between obstacles, per movement mode
    run: 1.15,
    glide: 1.4,
    swim: 1.3,
    randomExtra: 0.9,        // up to this many extra seconds, random
  },

  // Running levels (office, horse, skiing, home office)
  RUN: {
    groundY: 256,
    gravity: 2100,
    jumpVel: 660,            // peak height = jumpVel² / (2·gravity) ≈ 104 px
    fastFall: 2.4,           // gravity multiplier while holding down in the air
    jumpBuffer: 0.15,        // a jump pressed slightly too early still counts
    coyote: 0.08,
  },

  // Paragliding level
  GLIDE: {
    baseY: 150,              // pilot centre at rest
    offset: 80,              // how far up a rise goes
    diveOffset: 104,         // how far down a dive goes (deep enough that the canopy clears birds/gliders)
    hold: 0.55,              // seconds it stays up/down after the key is released
    stiffness: 95,           // spring back to base (higher = snappier)
    damping: 19.5,
    groundY: 284,
    lowTop: 156,             // trees/power lines reach up to here
    highTop: 76,             // birds/gliders span highTop..highBottom
    highBottom: 144,
    hitW: 22, hitH: 34,
  },

  // Swimming level
  SWIM: {
    surfaceY: 205,
    bottomY: 300,
    gravity: 1900,
    leapVel: 640,
    diveDepth: 64,
    hold: 0.55,
    stiffness: 95,
    damping: 19.5,
    lowTop: 192,             // logs/buoys/rocks: lowTop..bottom
    highBottom: 226,         // ducks/boats/branches end here
    hitW: 30, hitH: 18,
  },

  TOUCH: {
    split: 0.5,              // touch above this fraction of the screen height = UP, below = DOWN
    swipe: 24,               // px (screen) a finger must move to count as a swipe
    downMin: 0.3,            // a quick tap on the bottom half still ducks at least this long (s)
  },

  TRANSITION: {
    fade: 0.45,              // fade out/in seconds
    card: 2.4,               // level intro card seconds (tap skips)
    gateWalk: 70,            // px/s Lauri walks into the gate
    gateMinWait: 0.8,        // s at the gate before a click moves on (the game waits for a click)
  },
};

// Faces. Replace null with a path to a transparent PNG to swap the
// pixel-art placeholder head for a photo, e.g.
//   lauri: 'assets/faces/lauri.png',
const FACES = {
  lauri: 'assets/faces/lauri.png',
  touko: 'assets/faces/touko.png',
  pyry: 'assets/faces/pyry.png',
  annamaria: 'assets/faces/annamaria.png',
  kaisla: 'assets/faces/kaisla.png',
  dave: 'assets/faces/dave.png',
};

// Small pixel-art faces (16 px wide) are lined up by their chin: the first
// row below the chin. Rows under it (long hair) hang beside the shoulders.
// Shirt colours are set per person in PEOPLE in js/art.js.
const FACE_CHIN_ROW = 13;

// Sounds. Put a path here and it plays; null = silent. Replace the wav files to change them.
const SOUNDS = {
  jump: 'assets/sounds/jump.wav',   // male voice "hop" on every jump / rise / leap
  duck: 'assets/sounds/duck.wav',   // male voice "hnngh" when ducking / diving
  hit: null,
  gate: null,
  gameover: null,
  victory: null,
  click: null,
};
