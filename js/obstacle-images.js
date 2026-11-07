// Obstacle images in assets/obstacles/<name>.png (generated from the code art).
// To change an obstacle, just replace its png. Any size works: the image is
// scaled to height h and placed like the original:
//   dx     = horizontal offset of the image centre from the obstacle centre (px)
//   bottom = where the image's bottom edge sits relative to the hitbox bottom (px)
//   h      = height the image is drawn at (px, the game is 800x300)
//   outline = true draws a thin dark outline around the image (more contrast)
// Delete a png to go back to the built-in code art for that obstacle.
const OBSTACLE_IMAGES = {
  box:        { dx: 0, bottom: 0, h: 33, outline: true },
  desk:       { dx: 0, bottom: 0, h: 36, outline: true },
  glasses:    { dx: 0, bottom: 0, h: 18 },
  paperplane:   { dx: 8, bottom: 0, h: 24 },
  mug:          { dx: 3, bottom: 0, h: 33 },
  chair:        { dx: 2, bottom: 0, h: 48 },
  tree:       { dx: 0, bottom: 0, h: 138, outline: true },
  powerline:  { dx: 2, bottom: 0, h: 129, outline: true },
  geese:        { dx: -7, bottom: 3, h: 71 },
  balloon:      { dx: 0, bottom: 8, h: 78 },
  windturbine:  { dx: -1, bottom: 3, h: 168 },
  radiomast:    { dx: 1, bottom: 1, h: 151, outline: true },
  glider:     { dx: 2, bottom: -1, h: 74, outline: true },
  fence:      { dx: 0, bottom: 3, h: 42 },
  hay:          { dx: 2, bottom: 3, h: 42 },
  trough:       { dx: 0, bottom: 3, h: 30 },
  lowglider:  { dx: 2, bottom: 4, h: 82, outline: true },
  mosquitoes:   { dx: 3, bottom: -1, h: 48 },
  fish:         { dx: 3, bottom: -2, h: 105 },
  buoy:       { dx: 0, bottom: 0, h: 125, outline: true },
  rock:       { dx: 0, bottom: 0, h: 125, outline: true },
  duck:       { dx: -4, bottom: 3, h: 33 },
  boat:       { dx: 0, bottom: -12, h: 65, outline: true },
  seagull:      { dx: 0, bottom: -3, h: 27 },
  skirock:    { dx: 0, bottom: 0, h: 24, outline: true },
  snowman:    { dx: 0, bottom: 0, h: 54, outline: true },
  reindeer:     { dx: -7, bottom: 3, h: 69 },
  snowball:   { dx: 9, bottom: -1, h: 18, outline: true },
  owl:          { dx: 0, bottom: 1, h: 32 },
  books:      { dx: -1, bottom: 0, h: 30, outline: true },
  plant:        { dx: 0, bottom: 3, h: 63 },
  espresso:     { dx: 3, bottom: 0, h: 42 },
  yarnball:     { dx: 4, bottom: 3, h: 32 },
  knittingsock: { dx: 0, bottom: 0, h: 36, outline: true },
};
