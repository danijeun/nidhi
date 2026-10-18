# Kitty

A tiny tamagotchi style game: care for a pixel cat, dress it up, and let it read the note on the table.

## Run

```bash
npm install
npm run dev          # http://localhost:5173  (also on your LAN, so you can open it on your phone)
npm run build        # static site in dist/, deploy to Netlify / GitHub Pages
```

URL flags while developing:

- `?debug=1` the note is ready immediately (skip straight to testing the reveal)
- Nothing is saved: every refresh starts over from the title and naming screens

## Where things live

| File | What |
|---|---|
| `src/config.js` | **Everything personal**: cat name, the letter, button labels, cat lines, photo caption, meter tuning, unlock rules |
| `src/art/placeholder.js` | Placeholder pixel art drawn in code: cat sheet, accessory sheets, room, furniture, effects |
| `src/objects/Cat.js` | Cat = base sprite + one sprite per accessory, all playing the same animation tag |
| `src/scenes/Room.js` | The game: layout, taps, meters, matcha (pour + sip) / nap / pet, note trigger, reveal cutscene |
| `src/ui/ui.js` | DOM overlays: meters, speech bubble, wardrobe, letter typewriter, cards, title |
| `public/assets/photo.jpg` | Put a real photo here; the photo frame on the wall opens it |

## Swapping in real art

Every sheet is one row of 32x32 frames in this order (see `TAGS` in `src/art/placeholder.js`):

| Frames | Tag |
|---|---|
| 0-1 | idle |
| 2-5 | walk |
| 6-7 | happy |
| 8-9 | eat |
| 10-11 | sleep |
| 12 | sit |
| 13 | jump |
| 14-15 | read |

Draw the cat facing right. Draw each accessory on its own layer of the same canvas and export it as its own sheet with the same frames, so it lines up automatically. Then load the PNGs in `src/scenes/Boot.js` under the same keys (`cat`, `acc-bow`, ...) instead of calling `registerPlaceholderArt` for those keys. The room is 192x256.
