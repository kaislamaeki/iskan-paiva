# Iskän päivä

A small pixel-art runner made as a Father's Day gift: Lauri's way home from work, through six levels, ending at the sauna.

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Play locally

Open `index.html` in a browser (Chrome works best).

- **Up**: Space, Arrow Up, W, or a mouse click. On mobile, tap or swipe up.
- **Down**: hold Arrow Down or S. On mobile, swipe down.
- **P / Esc**: pause.

## Deploy to GitHub Pages

1. Create a new repository on GitHub, for example `iskan-paiva`.
2. Upload all the files (`index.html`, `style.css`, `js/`, `assets/`), either by drag and drop on the GitHub website or with git:
   ```
   git init
   git add .
   git commit -m "Iskän päivä"
   git branch -M main
   git remote add origin https://github.com/<your-user>/iskan-paiva.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. Save.
4. After a minute the game is live at `https://<your-user>.github.io/iskan-paiva/`.

**Before sharing the final version:** set `DEV: false` in `js/config.js`. This turns off the debug and level-skip keys and the test URL options.

## Where to change things

| What | File |
|---|---|
| All text (Finnish/English, comic, personal message) | `js/strings.js` |
| Speed, jump, gaps between obstacles, points per level, lives | `js/config.js` (`CONFIG`) |
| Face photos | `js/config.js` (`FACES`) |
| Sounds | `js/config.js` (`SOUNDS`) |
| Levels, obstacle sets, gates | `js/levels.js` |
| Obstacle images (replace a png to change an obstacle) | `assets/obstacles/`, placement in `js/obstacle-images.js` |
| Pixel art (characters, gates, built-in obstacle art) | `js/art.js` |
| Backgrounds | `js/backgrounds.js` |
| Intro comic | `js/comic.js` |

### Adding face photos

Put a cut-out face with a transparent background in `assets/faces/`, for example `assets/faces/lauri.png`. Then change one line in `js/config.js`:

```js
lauri: 'assets/faces/lauri.png',
```

The photo replaces the pixel head everywhere: in every level, in the comic and at the gates. Square-ish crops around the face work best.

### Changing obstacle images

Every obstacle has its own image in `assets/obstacles/`, for example `box.png`, `tree.png` and `boat.png`. To change how an obstacle looks, replace its png with your own picture under the same file name. There's nothing to change in the code.

- **Size:** any size works. The game scales your image to the height of the original and stands it on the same spot, so a big photo is fine.
- **Background:** use a transparent background (PNG) so only the object shows.
- **Placement:** if a replacement sits a bit off, adjust its numbers in `js/obstacle-images.js`. `dx` moves it left or right, `bottom` moves it up or down, and `h` sets its height.
- **Going back:** delete a png and the game draws that obstacle with the built-in pixel art again.
- **Collisions:** what counts as a hit is set separately in `js/levels.js`, so a different-looking image never changes how hard the game is.

### Adding sounds

Put the files in `assets/sounds/` and set the paths in `SOUNDS` in `js/config.js`. The available hooks are `jump`, `hit`, `gate`, `gameover`, `victory` and `click`.

## Dev helpers (only when `DEV: true`)

- `D`: show hitboxes and FPS.
- `N`: skip to the end of the current level.
- URL options:
  - `index.html?level=4` starts directly in level 4.
  - `&god=1` makes Lauri invincible.
  - `&debug=1` turns on debug view from the start.
  - `?scene=comic&panel=2`, `?scene=finale`, `?scene=victory` and `?scene=gameover` open a single screen.
  - `?level=1&bot=1&sim=600` lets a bot play the whole game instantly and writes the result to the page title. This is useful after changing difficulty settings.
  - `?export=obstacles` redraws every obstacle from the built-in pixel art so they can be saved again as pngs. Only needed if the code art changes; your replaced pngs are not touched by it.
