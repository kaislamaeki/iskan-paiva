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
      { key: 'box',     kind: 'low',  w: 28, h: 26 },
      { key: 'desk',    kind: 'low',  w: 42, h: 24 },
      { key: 'glasses', kind: 'high', w: 34, h: 18 },
      { key: 'paperplane', kind: 'high', w: 30, h: 18 },
      { key: 'mug',     kind: 'high', w: 22, h: 20 },
      { key: 'chair',   kind: 'low',  w: 30, h: 34 },
    ],
  },
  {
    id: 'glide', player: 'glide', bg: 'glide', gate: 'barn',
    obstacles: [
      { key: 'tree',      kind: 'low',  w: 30 },
      { key: 'powerline', kind: 'low',  w: 90 },
      { key: 'geese',     kind: 'high', w: 40 },
      { key: 'balloon',   kind: 'high', w: 40 },
      { key: 'windturbine', kind: 'low', w: 34 },
      { key: 'radiomast', kind: 'low',  w: 24 },
      { key: 'glider',    kind: 'high', w: 30 },
    ],
  },
  {
    id: 'horse', player: 'horse', bg: 'horse', gate: 'pier',
    obstacles: [
      { key: 'fence',     kind: 'low',  w: 36, h: 30 },
      { key: 'hay',       kind: 'low',  w: 28, h: 28 },
      { key: 'trough',    kind: 'low',  w: 50, h: 20 },
      { key: 'lowglider', kind: 'high', w: 26, h: 20 },
      { key: 'mosquitoes', kind: 'high', w: 34, h: 24, buzz: true },
    ],
  },
  {
    id: 'swim', player: 'swim', bg: 'swim', gate: 'iceArch',
    obstacles: [
      { key: 'fish',   kind: 'low',  w: 36 },
      { key: 'buoy',   kind: 'low',  w: 18 },
      { key: 'rock',   kind: 'low',  w: 38 },
      { key: 'duck',   kind: 'high', w: 32, h: 24, bottom: 208 },
      { key: 'boat',   kind: 'high', w: 72, h: 62 },
      { key: 'seagull', kind: 'high', w: 34, h: 24, bottom: 208 },
    ],
  },
  {
    id: 'ski', player: 'ski', bg: 'ski', gate: 'house',
    obstacles: [
      { key: 'skirock',    kind: 'low',  w: 28, h: 20 },
      { key: 'snowman',    kind: 'low',  w: 22, h: 33 },
      { key: 'snowball',   kind: 'high', w: 18, h: 20 },
      { key: 'reindeer',   kind: 'low',  w: 34, h: 30 },
      { key: 'owl',        kind: 'high', w: 34, h: 22 },
    ],
  },
  {
    id: 'home', player: 'home', bg: 'home', gate: 'backDoor',
    obstacles: [
      { key: 'books',  kind: 'low',  w: 26, h: 26 },
      { key: 'plant',        kind: 'low',  w: 26, h: 30 },
      { key: 'espresso',     kind: 'high', w: 24, h: 18 },
      { key: 'yarnball',     kind: 'low',  w: 26, h: 22 },
      { key: 'knittingsock', kind: 'high', w: 22, h: 20 },
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
