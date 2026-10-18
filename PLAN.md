# Kitty Proposal Game: Plan

A tiny tamagotchi style web game: adopt a pixel cat, dress it up with accessories, care for it in a small room, and at the end the cat walks to the table, reads a note, and the note asks her to be your girlfriend.

---

## 1. Verdict on the tools

| Tool | Good for this? | Why |
|---|---|---|
| **Figma** | Only for mockups | It is a vector tool. It anti-aliases edges, has no real frame-by-frame animation and no sprite sheet export. Fine to sketch the screen layout and UI, wrong for drawing the sprites. |
| **Pixel Studio** | Yes, good free choice | Free (Pro is a one-time purchase), runs on phone and desktop, has layers, onion skin, frame animation, exports PNG / GIF / sprite sheets. Being able to draw on your phone is a real advantage. |
| **Aseprite** (~$20, or compile from source for free) | Best choice | The standard for game pixel art. Animation **tags** (idle, walk, read), layers per accessory, and a **JSON + sprite sheet export that Phaser loads directly** (`this.load.aseprite`). Saves you writing frame lists by hand. |
| LibreSprite / Piskel | Free fallbacks | LibreSprite is an old Aseprite fork; Piskel runs in the browser. |

**Recommendation:** Figma (optional) for a 15 minute layout sketch, **Aseprite** for sprites if you'll spend $20, otherwise **Pixel Studio**. The rest of this plan works with either; with Pixel Studio you just write the frame config by hand.

---

## 2. Tech stack

- **Engine: Phaser 4** (stable since April 2026, v4.1 at time of writing) + **Vite**. Reasons: huge docs/examples base, built-in Aseprite loader, tweens, particles, input, scaling, camera. Phaser 3.90 is equally fine if you find more tutorials for it.
  - Lighter alternative: **KAPLAY** (very quick to prototype, smaller community).
  - Honest option: plain HTML + CSS + JS with `image-rendering: pixelated` is enough for a game this size. Pick Phaser if you want animations and particles to be painless.
- **UI overlays** (wardrobe menu, letter, buttons): plain HTML/CSS on top of the canvas. Easier to style and fully readable on mobile.
- **Fonts:** a pixel font from Google Fonts (`Press Start 2P`, `Pixelify Sans`, `Silkscreen`).
- **Save state:** `localStorage` (cat name, chosen accessories, stats, whether the note has been read).
- **Audio:** chiptune loop from BeepBox (compose your own) or CC0 tracks from OpenGameArt / itch.io; SFX from jsfxr.
- **Hosting:** Netlify, Vercel or GitHub Pages. Free, HTTPS, custom short URL.
- **PWA manifest** (optional, recommended): she can "Add to Home Screen" and it opens full screen like an app. It becomes a keepsake she keeps after the proposal.

No backend required.

---

## 3. Game design

### Core loop (target total play time 5 to 10 minutes)

1. **Title screen**: "Tap to start" (also unlocks audio on iOS). Title can be the cat's name or an inside joke.
2. **Meet the cat**: short intro bubble ("Hi! I'm ___. I just moved in. Can you take care of me?"). Optionally she names it.
3. **Tamagotchi phase**: three meters, never fatal:
   - **Hunger**: strawberry matcha (pour, then sip through a straw; see `MATCHA_PLAN.md`)
   - **Happiness**: pet (tap the cat, hearts pop)
   - **Energy**: nap on the bed
   - Meters decay slowly while playing (seconds, not real hours, so the reveal happens in the same sitting).
4. **Dress up**: wardrobe button opens a drawer of accessories. Tap to equip, tap again to remove. One slot per category (head, face, neck).
5. **Free roam**: tap anywhere on the floor and the cat walks there. Tap furniture for small reactions (window: looks outside; plant: bats at it; photo frame: shows a real photo of you two).
6. **The trigger**: once happiness is full AND at least one accessory is on (or after N interactions), the note on the table starts sparkling and the cat gets a "!" bubble. She taps it (or it happens automatically).
7. **The reveal cutscene**: input locks, cat walks to the table, hops up, sits, picks up the note, reading animation. Screen dims, letter unfolds in the center with a typewriter effect.
8. **The question**: your message, then two buttons.
9. **Yes**: celebration: heart/confetti particles, cat happy dance with whatever outfit she chose, music change, final screen (date, a photo, "Day 1").

### About the "No" button
The meme where "No" runs away from the cursor is cute, but this is a real question. Keep a genuine, graceful second option ("I need to think about it") that ends warmly ("The cat will wait for you"). It removes pressure, and the moment feels more sincere.

### Personalization (this is what makes it land)
- Accessories referencing your story: something from your first date, her favorite color, a flower she likes, a tiny version of something you gave her.
- Room objects: a pixelated photo of the two of you in the frame, a poster of a place you went, her favorite snack as the cat food.
- If she has a cat or loves a specific breed, model the cat on it.
- The letter in your own words. Short. Specific memories beat grand statements.

---

## 4. Art spec

Pick the sizes once and never change them; everything depends on them.

- **Resolution:** game canvas **256 x 192** (or 192 x 256 portrait, see §6), scaled up by an integer (x3, x4) with nearest-neighbor. Never scale by fractions or pixels blur.
- **Palette:** pick one 16 to 32 color palette from Lospec (e.g. "Resurrect 64" subset, "Pear36", "SWEETIE 16") and use it for everything. This alone makes amateur pixel art look cohesive.
- **Cat:** **32 x 32** frame, drawn facing right; flip in code for left.

### Cat animations (minimum viable)
| Tag | Frames | Notes |
|---|---|---|
| idle | 2 to 4 | breathing / tail swish |
| walk | 4 | |
| sit | 1 to 2 | |
| happy | 2 to 4 | bounce, used on pet and on "Yes" |
| eat | 2 | |
| sleep | 2 | Zzz handled as separate small sprite |
| jump | 3 | onto the table |
| read | 2 to 4 | holding the note |

~20 to 25 frames total. That is very doable.

### Accessories: the one technical decision that matters
Accessories are **separate sprites layered on top of the cat**, not baked into cat frames (otherwise you need every outfit x every animation).

Do it like this:
1. In Aseprite / Pixel Studio, put the cat on the bottom layer and each accessory on its own layer **on the same 32 x 32 canvas**.
2. Animate each accessory layer frame by frame alongside the cat (usually just shifting it 1 px when the head bobs).
3. Export **each layer as its own sprite sheet with identical frame layout**. In code, every accessory sprite just plays the same animation tag as the cat at the same position. Perfect alignment, zero math.

Shortcut if time runs out: draw accessories as a single static image and attach them with a per-frame head offset table (`{idle: [[0,0],[0,1]], walk: [...]}`).

Target 6 to 8 accessories: bow, party hat, flower crown, sunglasses, heart glasses, scarf, bell collar, one inside-joke item.

### Room
- One screen, three-quarter top-down view (like Stardew / Animal Crossing interiors).
- Back wall with window + photo frame, floor with rug.
- Objects: **table with the note** (note is its own sprite so it can sparkle), bed/cushion, food bowl, plant, maybe a lamp.
- Draw the room as one background PNG, plus separate sprites for anything that animates or sits in front of the cat (table front legs, plant) for depth.

### UI
- Meter icons (fish, heart, moon), wardrobe button, accessory icons (16 x 16), speech bubble 9-slice, the letter (paper texture, can be HTML).

### If you want to start before drawing
Use a free cat pack from itch.io as placeholders so code and art progress in parallel, then swap in your own sprites at the same frame size.

---

## 5. Code architecture

```
nidhi/
  index.html
  public/
    assets/  cat.png cat.json  acc_*.png  room.png  ui/  audio/
    manifest.webmanifest  icon-192.png  icon-512.png
  src/
    main.js            // Phaser config: pixelArt:true, Scale.FIT, roundPixels
    config.js          // all tunables: decay rates, trigger rules, letter text, accessory list
    state.js           // in-memory state only (no saving: a refresh restarts the story)
    scenes/
      Boot.js          // preload everything, loading bar
      Title.js         // tap to start (unlocks audio)
      Room.js          // main loop: cat, furniture, input, meters
      Reveal.js        // scripted cutscene + letter overlay
      Celebrate.js
    objects/
      Cat.js           // container: base sprite + accessory sprites, state machine
    ui/
      wardrobe.html/css/js  // DOM overlay
      letter.js        // typewriter effect, buttons
```

### Key pieces
- **Cat state machine:** `idle | walking | eating | sleeping | happy | cutscene`. Walking: tween x/y to target at constant speed, pick `walk` tag, flip by direction.
- **Movement area:** a floor rectangle (or polygon); clamp tap targets into it. Depth sort `cat.depth = cat.y` so it walks behind/in front of furniture correctly. No pathfinding needed for one room; at most route around the table with one waypoint.
- **Accessories:** `Cat` is a `Phaser.GameObjects.Container`. `equip(slot, key)` adds/replaces a sprite in the container; every `play(tag)` call is forwarded to all children.
- **Reveal:** a timeline (chained tweens / `async` with promises): disable input → walk to table → jump → sit → read anim → fade → show letter overlay → typewriter → buttons.
- **Config file:** keep the letter text, trigger thresholds and accessory list in `config.js` so you can tweak without touching logic. Add `?debug=1` to skip straight to the reveal for testing.

---

## 6. Mobile first (she will almost certainly open it on her phone)

- Decide orientation up front. **Portrait (192 x 256 room + UI bar below)** fits phones best; landscape needs a "rotate your phone" prompt.
- Touch: tap to move, tap cat to pet; buttons at least 44 px.
- `Scale.FIT` + `autoCenter`, `pixelArt: true`, `<meta name="viewport" ...>`, disable double-tap zoom (`touch-action: manipulation`).
- iOS Safari: audio only after a user gesture (the title tap), test on a real iPhone if she has one.
- Keep total assets under ~3 MB so it loads instantly on cellular.

---

## 7. Timeline (about two weekends of part-time work)

| Phase | Work | Output |
|---|---|---|
| 0. Prep (1 evening) | Write the letter. List inside jokes for accessories/room. Pick palette and sizes. Sketch the screen (Figma or paper). | design locked |
| 1. Skeleton (1 evening) | Vite + Phaser, scenes, placeholder rectangles, tap to move, deploy to Netlify early. | URL that works on your phone |
| 2. Art pass A (weekend 1) | Cat idle + walk, room background, table + note. | cat walks around real room |
| 3. Systems (2 evenings) | Meters, feed/pet/sleep, wardrobe overlay, save/load. | playable tamagotchi |
| 4. Art pass B (weekend 2) | Remaining animations, 6 to 8 accessories, UI icons, photo frame. | full content |
| 5. Reveal (1 evening) | Cutscene, letter, Yes/think buttons, celebration particles, music. | the ending |
| 6. Polish + test (1 evening) | SFX, transitions, test on iPhone + Android, have a friend play it blind and watch where they get stuck. | ready |

If short on time, cut in this order: sleep/energy meter → jump animation → music → PWA. Never cut: the reveal, the personalized letter, the accessories.

---

## 8. Delivery

- Be there in person when she plays it. Send the link and watch, or hand her your phone. The game is the setup; the answer should happen face to face.
- Use an unlisted URL with no indexing (`<meta name="robots" content="noindex">`), and don't make the repo public until after.
- Have her real gift / flowers ready for the "Yes" moment.
- Afterwards, leave it running: the cat stays as a keepsake (the PWA makes this nicer). You can later add a new room or accessory for anniversaries.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Art takes longer than code | Placeholder pack first; small 32 px cat; limited palette; reuse frames |
| Blurry pixels | `pixelArt: true`, integer scaling, export PNG never JPG |
| Accessories misalign during animation | Same-canvas layer export (§4) |
| Audio silent on iPhone | Start audio on title tap |
| She gets stuck and never reaches the note | Trigger by interactions count with a timeout fallback (e.g. after 4 minutes the note sparkles anyway) |
| Bug at the moment of truth | `?debug=1` skip; test the full run 3 times on her phone type the day before |
