// Obstacle images in assets/obstacles/<name>.png (generated from the code art).
// To change an obstacle, just replace its png. Any size works: the image is
// scaled to height h and placed like the original:
//   dx     = horizontal offset of the image centre from the obstacle centre (px)
//   bottom = where the image's bottom edge sits relative to the hitbox bottom (px)
//   h      = height the image is drawn at (px, the game is 800x300)
// Delete a png to go back to the built-in code art for that obstacle.
const OBSTACLE_IMAGES = {
  box:        { dx: 0, bottom: 0, h: 33 },
  desk:       { dx: 0, bottom: 0, h: 36 },
  glasses:    { dx: 0, bottom: 0, h: 18 },
  paper:      { dx: 0, bottom: 2, h: 24 },
  tree:       { dx: 0, bottom: 0, h: 138 },
  powerline:  { dx: 2, bottom: 0, h: 129 },
  birds:      { dx: 1, bottom: -4, h: 62 },
  glider:     { dx: 2, bottom: -1, h: 74 },
  fence:      { dx: 2, bottom: 0, h: 33 },
  lowglider:  { dx: 2, bottom: 4, h: 82 },
  log:        { dx: -1, bottom: 0, h: 110 },
  buoy:       { dx: 0, bottom: 0, h: 125 },
  rock:       { dx: 0, bottom: 0, h: 125 },
  duck:       { dx: 3, bottom: -20, h: 23 },
  boat:       { dx: 0, bottom: -12, h: 65 },
  branch:     { dx: -43, bottom: 2, h: 192 },
  skirock:    { dx: 0, bottom: 0, h: 24 },
  snowman:    { dx: 0, bottom: 0, h: 54 },
  snowbranch: { dx: -27, bottom: 0, h: 215 },
  liftchair:  { dx: 0, bottom: 0, h: 156 },
  snowball:   { dx: 9, bottom: -1, h: 18 },
  books:      { dx: -1, bottom: 0, h: 30 },
  yarn:       { dx: 11, bottom: 0, h: 24 },
  sock:       { dx: 0, bottom: 2, h: 24 },
  beanie:     { dx: 0, bottom: 0, h: 18 },
  gloves:     { dx: 0, bottom: 2, h: 21 },
};
