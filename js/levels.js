// Level configuration. Names/hints come from strings.js.
//
// Player body sets (hitbox sizes in canvas px, measured from the ground):
//   standH / duckH : hitbox height standing / ducking
//   highBottom     : how high above the ground "duck" obstacles float
//                    (must be above the ducking sprite, below the standing hitbox top)
const PLAYER_SETS = {
  office: { mode: 'run', hitW: 20, standH: 42, duckW: 38, duckH: 22, duckDX: 4, highBottom: 32 },
  home:   { mode: 'run', hitW: 20, standH: 42, duckW: 38, duckH: 22, duckDX: 4, highBottom: 32 },
  horse:  { mode: 'run', hitW: 38, hitDX: 3, standH: 60, duckW: 40, duckH: 40, duckDX: 6, highBottom: 50 },
  ski:    { mode: 'run', hitW: 22, standH: 50, duckW: 30, duckH: 30, duckDX: 4, highBottom: 41 },
  glide:  { mode: 'glide' },
  swim:   { mode: 'swim' },
};

// Obstacles: kind 'low' = avoid with UP, 'high' = avoid with DOWN.
// w/h = hitbox size (the sprite is drawn a bit bigger). For glide/swim the
// vertical extent comes from CONFIG.GLIDE / CONFIG.SWIM, so only w matters
// (and h for swim 'high' obstacles, plus an optional 'bottom' y where one ends).
const LEVELS = [
  {
    id: 'office', player: 'office', bg: 'office', gate: 'rooftop',
    obstacles: [
      { key: 'box',     kind: 'low',  w: 28, h: 26, weight: 3 },
      { key: 'desk',    kind: 'low',  w: 42, h: 24, weight: 2 },
      { key: 'glasses', kind: 'high', w: 34, h: 18, weight: 2 },
      { key: 'paperplane', kind: 'high', w: 30, h: 18, weight: 2 },
      { key: 'mug',     kind: 'high', w: 22, h: 20, weight: 2 },
      { key: 'chair',   kind: 'low',  w: 30, h: 34, weight: 2 },
    ],
  },
  {
    id: 'glide', player: 'glide', bg: 'glide', gate: 'barn',
    obstacles: [
      { key: 'tree',      kind: 'low',  w: 30, weight: 3 },
      { key: 'powerline', kind: 'low',  w: 90, weight: 1 },
      { key: 'geese',     kind: 'high', w: 40, weight: 2 },
      { key: 'balloon',   kind: 'high', w: 40, weight: 2 },
      { key: 'windturbine', kind: 'low', w: 34, weight: 2 },
      { key: 'radiomast', kind: 'low',  w: 24, weight: 1 },
      { key: 'glider',    kind: 'high', w: 30, weight: 2 },
    ],
  },
  {
    id: 'horse', player: 'horse', bg: 'horse', gate: 'pier',
    obstacles: [
      { key: 'fence',     kind: 'low',  w: 36, h: 30, weight: 2 },
      { key: 'hay',       kind: 'low',  w: 28, h: 28, weight: 2 },
      { key: 'trough',    kind: 'low',  w: 50, h: 20, weight: 2 },
      { key: 'lowglider', kind: 'high', w: 26, h: 20, weight: 2 },
    ],
  },
  {
    id: 'swim', player: 'swim', bg: 'swim', gate: 'iceArch',
    obstacles: [
      { key: 'log',    kind: 'low',  w: 46, weight: 2 },
      { key: 'buoy',   kind: 'low',  w: 18, weight: 2 },
      { key: 'rock',   kind: 'low',  w: 38, weight: 2 },
      { key: 'duck',   kind: 'high', w: 32, h: 24, bottom: 208, weight: 2 },
      { key: 'boat',   kind: 'high', w: 72, h: 62, weight: 1 },
      { key: 'branch', kind: 'high', w: 40, h: 96, weight: 1 },
    ],
  },
  {
    id: 'ski', player: 'ski', bg: 'ski', gate: 'house',
    obstacles: [
      { key: 'skirock',    kind: 'low',  w: 28, h: 20, weight: 2 },
      { key: 'snowman',    kind: 'low',  w: 22, h: 33, weight: 2 },
      { key: 'snowbranch', kind: 'high', w: 34, h: 20, weight: 1 },
      { key: 'liftchair',  kind: 'high', w: 30, h: 20, weight: 1 },
      { key: 'snowball',   kind: 'high', w: 18, h: 20, weight: 1 },
      { key: 'snowhorse',  kind: 'low',  w: 30, h: 28, weight: 2 },
      { key: 'owl',        kind: 'high', w: 34, h: 22, weight: 2 },
    ],
  },
  {
    id: 'home', player: 'home', bg: 'home', gate: 'backDoor',
    obstacles: [
      { key: 'books',  kind: 'low',  w: 26, h: 26, weight: 2 },
      { key: 'yarn',   kind: 'low',  w: 22, h: 20, weight: 2 },
      { key: 'sock',   kind: 'high', w: 20, h: 20, weight: 1 },
      { key: 'beanie', kind: 'high', w: 22, h: 18, weight: 1 },
      { key: 'gloves', kind: 'high', w: 26, h: 18, weight: 1 },
      { key: 'yarnball',     kind: 'low',  w: 26, h: 22, weight: 2 },
      { key: 'knittingsock', kind: 'high', w: 22, h: 20, weight: 1 },
    ],
  },
];

LEVELS.forEach((L, i) => {
  L.index = i;
  L.name = STR.levels[i].name;
  L.hint = STR.levels[i].hint;
  L.mode = PLAYER_SETS[L.player].mode;
  L.length = L.length || CONFIG.LEVEL_LENGTH;
  L.baseSpeed = CONFIG.SPEED.base + i * CONFIG.SPEED.perLevel;
});

// Where the ground (or water surface) is for gates and auto-walking
function groundFor(mode) {
  if (mode === 'glide') return CONFIG.GLIDE.groundY;
  if (mode === 'swim') return CONFIG.SWIM.surfaceY;
  return CONFIG.RUN.groundY;
}
