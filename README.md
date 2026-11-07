# Iskän päivä

A small pixel-art runner made as a Father's Day gift: Lauri's way home from work, through six levels, ending at the sauna.

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Play locally

Open `index.html` in a browser (Chrome works best).

- **Up**: Space, Arrow Up, W, or a mouse click. On a phone, tap the top half of the screen (or swipe up).
- **Down**: hold Arrow Down, S or Shift. On a phone, touch and hold the bottom half (or swipe down).
- **P / Esc**: pause.
- **Sound on/off**: the speaker button at the top right, or the **M** key. The game remembers the setting.

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

**Dev mode is off** (`DEV: false` in `js/config.js`), so the public version has no debug keys or test URL options. Set it to `true` while you work on the game locally, and back to `false` before uploading.

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

### Sounds and music

- **Voice effects:** `assets/sounds/jump.wav` ("hop") and `assets/sounds/duck.wav` ("uhh"). Replace them with your own recordings under the same names, or set other paths in `SOUNDS` in `js/config.js`. Unused hooks you can fill: `hit`, `gate`, `gameover`, `victory` and `click`.
- **Background music:** a chiptune generated in code in `js/music.js`, so there's no music file. The melody, bass and tempo are written out at the top of that file.
- **Volumes:** `CONFIG.AUDIO` in `js/config.js` (`music` and `effects`, from 0 to 1). Set `music` to 0 to turn the music off completely.
- **When sound starts:** browsers only allow sound after the first tap or key press, so the music starts then.

## Dev helpers (only when `DEV: true` in `js/config.js`)

- `D`: show hitboxes and FPS.
- `N`: skip to the end of the current level.
- URL options:
  - `index.html?level=4` starts directly in level 4.
  - `&god=1` makes Lauri invincible.
  - `&debug=1` turns on debug view from the start.
  - `?scene=comic&panel=2`, `?scene=finale`, `?scene=victory` and `?scene=gameover` open a single screen.
  - `?level=1&bot=1&sim=600` lets a bot play the whole game instantly and writes the result to the page title. This is useful after changing difficulty settings.
  - `?level=5&show=owl,snowhorse` places those obstacles on screen right away, to preview new or replaced obstacle images.
  - `?export=obstacles` redraws every obstacle from the built-in pixel art so they can be saved again as pngs. Only needed if the code art changes; your replaced pngs are not touched by it.
