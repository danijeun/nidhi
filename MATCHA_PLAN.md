# Plan: the food becomes a strawberry matcha

**Status: built 2026-10-18** with the defaults (straw, no lid, no stirring, button says "Matcha").

Today the cat's food is a blue water bowl (`bowl` sprite at 112,108). Feeding plays a
1.8 s head-down `eat` animation and adds +40 to the Food meter. This plan swaps the bowl
for an iced strawberry matcha that gets poured, sipped through a straw and refilled. The
game rules stay the same.

## 1. Research: what the drink looks like

Every recipe source describes the same drink
([Just One Cookbook](https://www.justonecookbook.com/strawberry-matcha-latte/),
[Hummingbird High](https://www.hummingbirdhigh.com/2022/08/iced-strawberry-matcha-latte.html),
[Blogilates](https://www.blogilates.com/blog/strawberry-matcha-layered-latte/),
[Harney & Sons](https://www.harney.com/blogs/news/adding-strawberry-iced-matcha-latte)):

- It's a tall clear glass over ice with three layers. **Strawberry purée at the bottom** (red, with fruit bits), **milk in the middle** (white, often with pink streaks bleeding up), and **matcha on top** (green).
- It's poured in that order (strawberry, then milk, then matcha), slowly over the ice so the layers stay separate.
- People stir it before drinking, which blends it into a pink-to-green gradient. Some versions top it with strawberry cold foam.
- Café versions often come with a dome lid and a wide straw.

The layering is what makes it recognizable. At 10 to 12 px wide it has to read as
"red / white / green stripes in a glass", so each layer needs at least 2 to 3 rows.

## 2. Research: how to draw glass in pixel art

- Clear glass is one of the hardest things in pixel art. The usual trick is to draw the
  **edges and a reflection**, not the glass itself: an outline, one bright highlight column
  on one side, and the liquid showing through
  ([PixelJoint thread](https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=20953),
  [Clip Studio transparency tutorial](https://tips.clip-studio.com/en-us/articles/3343)).
- Liquid reads better when it is slightly darker at the bottom and has a lighter surface
  line on top. Both happen naturally here: dark red at the bottom, a light foam line on top.
- Keep the empty part of the glass (above the liquid) as a plain outline with the floor
  showing through. That alone sells "transparent".

## 3. Colors (all from the Sweetie 16 palette the game already uses)

| Part | Color | Hex |
|---|---|---|
| Glass outline | ink | `#1a1c2c` |
| Glass highlight (1 px column) | white | `#f4f4f4` |
| Matcha | green | `#38b764` |
| Matcha foam / surface line | light green | `#a7f070` |
| Milk | white | `#f4f4f4` |
| Strawberry streaks + straw | pink | `#ff77a8` |
| Strawberry purée | red | `#b13e53` |
| Ice cubes | cyan | `#73eff7` |
| Coaster | wood (table color) | `#c98a5a` |

## 4. The sprite

A 10 x 14 px glass on a small coaster with a pink straw. At the feeding spot the cat
stands to the right of the glass facing left, so the straw leans **right**, toward the
cat's mouth.

```
     0123456789
 0   .......ss.     s = straw (pink)
 1   ......ss..
 2   o....s...o     o = outline, empty glass above the liquid
 3   ow...slllo     l = foam line (light green)
 4   owgggsgggo     g = matcha
 5   owgigsgigo     i = ice
 6   owmmmsmmmo     m = milk
 7   owmpmsmpmo     p = strawberry streaks
 8   owrrrsrrro     r = strawberry purée
 9   owrprrrpro
10   oooooooooo
11   cccccccccc     c = coaster
```
`w` is the glass highlight column. The final pixels get tuned against real renders, as I
did for the black cat.

**Fill levels** become a small sheet (`matcha`, frames 0 to 4): full, ¾, ½, ¼, empty
(ice and a pink tint left at the bottom). The level drops from the top.
(Realistically a straw drains the bottom layer first. That's a fun detail but it reads
worse at this size, so top-down it is.)

**Where it goes:** the cat's mouth sits 16 px above its feet and 3 px in from the edge of
its 32 px frame. With the cat at the feeding spot (127,111) facing left, the mouth lands
at about (114,95). So the glass goes at x≈111 with its base at y≈108, and the straw tip
ends right at the mouth. The feeding spot may move 1 to 2 px once it's tested in-game.

## 5. Animations and flow

New feeding sequence (the press still calls `feed()`; only what happens inside changes):

1. **Pour** (about 0.6 s): if the glass is empty it refills **in recipe order**:
   strawberry, then milk, then matcha, one layer per step, with a sparkle and a soft
   "pour" sound. That's 3 extra frames on the same sheet.
2. **Walk**: the cat walks to the feeding spot and faces the glass (same as now).
3. **Sip** (about 1.8 s, same length as today): a new `sip` cat animation. The cat stands
   with its head level, eyes closed and happy, and bobs gently. Meanwhile the glass drops
   full → ¾ → ½ → ¼ → empty, with a "slurp" sound and 1 or 2 hearts at the end.
4. Food meter +40 (unchanged), back to idle.
5. The glass **stays empty** until the next feed. An empty glass shows she's hungry
   without needing a speech bubble.

Edge cases: if she taps something else mid-sip, the current cancel logic (`this.cmd` ids)
already stops the sequence. The glass keeps whatever level it reached, and the meter
bump only happens if the sip finished, like today. Save the glass level in the existing
localStorage state so a reload doesn't magically refill it.

## 6. Words

| Where | Now | New |
|---|---|---|
| Meter label (`index.html`) | Food | Matcha |
| Button (`index.html`) | Feed | Matcha |
| Hungry line (`config.js`) | I am hungry... | I want my strawberry matcha... |
| Tap the glass when full (new) | | Strawberry matcha. Decaf, I promise. |
| Tap the glass when empty (new) | | It is empty! Make me another one? |

"Decaf, I promise" is a wink: caffeine really is bad for cats.
All text lives in `config.js`, so you can rewrite any of it.

## 7. Files to change

- `src/art/placeholder.js`: `drawMatcha(ctx, level)` with frames for the fill levels and the pour; a new `sip` tag in `TAGS` (stand pose, closed happy eyes, small bob); remove `bowl`.
- `src/scenes/Room.js`: replace the bowl sprite with the matcha sprite; rewrite `feed()` as pour → walk → sip; tapping the glass says its line; track the glass level.
- `src/state.js`: save the glass level (default full, so the first feed skips the pour).
- `src/sfx.js`: `pour` (a quick falling blip run) and `slurp` (a short rising wobble), both from the existing `seq` helper.
- `src/config.js`: the new lines above.
- `index.html`: meter and button labels.
- `README.md`, `PLAN.md`: mention the drink.

## 8. How I'll check it

- Render every glass frame and the `sip` frames at 6x on the floor color, as I did for the black cat. Check that the 3 layers read at 1x and that the straw tip lines up with the mouth.
- Check that every accessory still lines up during `sip` (shades, scarf and bell all anchor on the head).
- Check depth: the glass must draw behind the cat when the cat stands in front of it.
- Phone-size (390x844) screenshots in headless Chromium; no console errors.

Effort: about 1 to 2 hours, most of it tuning the art.

## 9. Your choices (my default in bold)

- **Straw, no lid** (the cat can sip it) vs. the café dome lid.
- **No stirring** vs. a "tap to stir" step that turns the layers into a pink-green gradient before she drinks (cute, about +20 min).
- Button label **"Matcha"** vs. keeping "Feed".

## 10. Small Harry Potter extras (optional, not in this plan)

- The red/white scarf accessory could become **Gryffindor red and gold** (or her house's colors, if you know her house).
- A tiny "9¾" sign on the wall, so the letter's line pays off in the room.
