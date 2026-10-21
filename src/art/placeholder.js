// Placeholder pixel art, drawn in code so the game runs before any real art exists.
//
// The layout mirrors what a real Aseprite / Pixel Studio export should look like:
//   - cat sheet: one row of 32x32 frames, animations are ranges of frames (TAGS)
//   - every accessory: its OWN sheet with the SAME frame layout, drawn on the same
//     32x32 canvas so it lines up with the cat frame by frame
// To swap in real art, load PNG sheets with the same keys and frame order.

export const FRAME = 32;

// Black cat, all Sweetie 16 colors. Not pure black: a blue-tinted dark fur
// leaves room for a darker outline and a lighter rim light, so the
// silhouette still reads on the floor, the bed and dark screens.
export const PAL = {
  out: '#1a1c2c',
  fur: '#333c57',
  rim: '#566c86', // light catching the top edges
  eye: '#ffcd75', // amber eyes, the classic black cat look
  whisker: '#94b0c2',
  pink: '#ff77a8',
  red: '#b13e53',
  white: '#f4f4f4',
  blue: '#41a6f6',
  navy: '#3b5dc9',
  green: '#38b764',
  yellow: '#ffcd75',
  gray: '#94b0c2',
};

// Animation tags: name -> frame specs. Order defines the frame index in every sheet.
const walkLegs = [0, 1, 2, 3];
export const TAGS = {
  idle: { rate: 2, repeat: -1, frames: [{ pose: 'stand', bob: 0, tail: 0 }, { pose: 'stand', bob: 1, tail: 1 }] },
  walk: { rate: 8, repeat: -1, frames: walkLegs.map((p) => ({ pose: 'stand', bob: p % 2, tail: p % 2, legs: p })) },
  happy: { rate: 6, repeat: -1, frames: [{ pose: 'stand', bob: -2, eyes: 'happy', tail: 1 }, { pose: 'stand', bob: 0, eyes: 'happy', tail: 0 }] },
  sip: { rate: 3, repeat: -1, frames: [{ pose: 'stand', bob: 0, eyes: 'closed' }, { pose: 'stand', bob: 1, eyes: 'closed' }] },
  sleep: { rate: 1.5, repeat: -1, frames: [{ pose: 'lie', bob: 0, eyes: 'closed' }, { pose: 'lie', bob: 1, eyes: 'closed' }] },
  sit: { rate: 1, repeat: -1, frames: [{ pose: 'sit', bob: 0 }] },
  jump: { rate: 1, repeat: -1, frames: [{ pose: 'stand', bob: -1, legs: 'stretch', tail: 1 }] },
  read: { rate: 2, repeat: -1, frames: [{ pose: 'sit', bob: 0, eyes: 'down', note: true }, { pose: 'sit', bob: 1, eyes: 'down', note: true }] },
  // Standing on the microwave, head down over the edge to the straw.
  drink: { rate: 3, repeat: -1, frames: [{ pose: 'lean', bob: 0, eyes: 'closed' }, { pose: 'lean', bob: 1, eyes: 'closed' }] },
};

// Flatten tags into one frame list and remember where each tag starts.
export const FRAMES = [];
for (const [name, tag] of Object.entries(TAGS)) {
  tag.start = FRAMES.length;
  for (const f of tag.frames) FRAMES.push(f);
}

export const ACCESSORIES = [
  { id: 'bow', slot: 'head', label: 'Bow' },
  { id: 'partyhat', slot: 'head', label: 'Party hat' },
  { id: 'crown', slot: 'head', label: 'Flowers' },
  { id: 'sunglasses', slot: 'face', label: 'Shades' },
  { id: 'heartglasses', slot: 'face', label: 'Hearts' },
  { id: 'scarf', slot: 'neck', label: 'Scarf' },
  { id: 'collar', slot: 'neck', label: 'Bell' },
  // Harry Potter costume: secret, only unlocked by naming the cat Harry.
  { id: 'harryhair', slot: 'head', label: 'Hair + scar', secret: true },
  { id: 'roundglasses', slot: 'face', label: 'Round specs', secret: true },
  { id: 'gryffindor', slot: 'neck', label: 'Gryffindor', secret: true },
  // Cool guy "deal with it" shades: secret, unlocked by naming the cat Dani.
  { id: 'coolshades', slot: 'face', label: 'Cool shades', secret: true },
  // Snoop Dogg costume: secret, unlocked by tapping the plant 10 times.
  { id: 'braids', slot: 'head', label: 'Braids', secret: true },
  { id: 'snoopshades', slot: 'face', label: 'Snoop shades', secret: true },
  { id: 'goldchain', slot: 'neck', label: 'Gold chain', secret: true },
  { id: 'joint', slot: 'mouth', label: 'Joint', secret: true },
];

// Where the joint's lit tip is in a frame (for the smoke particles).
// Past the right braid, but never off the 32px frame (it would bleed into the next one).
const tipX = (h) => Math.min(h.x + 13, FRAME - 1);
export const jointTip = (f) => {
  const h = geometry(f).head;
  return { x: tipX(h), y: h.y + 7 };
};

// ---------- drawing helpers ----------

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

// Draw parts with a merged 1px outline: all outlines first, then all fills.
function parts(ctx, ox, list) {
  for (const p of list) if (p.o !== false) rect(ctx, ox + p.x - 1, p.y - 1, p.w + 2, p.h + 2, PAL.out);
  for (const p of list) rect(ctx, ox + p.x, p.y, p.w, p.h, p.c);
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Geometry of the cat for one frame. Accessories use the same head anchor.
export function geometry(f) {
  const b = f.bob || 0;
  if (f.pose === 'sit') {
    return {
      head: { x: 15, y: 6 + b },
      body: [{ x: 10, y: 16 + b, w: 12, h: 12 - b }],
      legs: [{ x: 18, y: 26, w: 2, h: 4 }, { x: 21, y: 26, w: 2, h: 4 }],
      tail: [{ x: 4, y: 27, w: 7, h: 2 }],
    };
  }
  // Head lowered to paw level and pushed forward, tail up. The mouth (where a
  // straw meets it) is at column head.x + 11, row head.y + 6.
  if (f.pose === 'lean') {
    return {
      head: { x: 19, y: 20 + b },
      body: [{ x: 7, y: 18, w: 14, h: 9 }],
      legs: [8, 11, 16, 19].map((x) => ({ x, y: 27, w: 2, h: 4 })),
      tail: [{ x: 5, y: 10, w: 2, h: 9 }],
    };
  }
  if (f.pose === 'lie') {
    return {
      head: { x: 19, y: 19 + b },
      body: [{ x: 5, y: 23 + b, w: 18, h: 6 - b }],
      legs: [],
      tail: [{ x: 1, y: 27, w: 5, h: 2 }],
    };
  }
  const offsets = { 0: [0, 0, 0, 0], 1: [-1, 1, 1, -1], 2: [0, 0, 0, 0], 3: [1, -1, -1, 1] }[f.legs] || [0, 0, 0, 0];
  const legH = f.legs === 'stretch' ? 5 : 4;
  const legs = [8, 11, 17, 20].map((x, i) => ({ x: x + offsets[i], y: 27, w: 2, h: legH }));
  const tail = f.tail
    ? [{ x: 3, y: 14 + b, w: 2, h: 7 }, { x: 4, y: 20 + b, w: 4, h: 2 }]
    : [{ x: 4, y: 13 + b, w: 2, h: 8 }, { x: 5, y: 20 + b, w: 3, h: 2 }];
  const head = { x: 18, y: 10 + b };
  return { head, body: [{ x: 7, y: 19 + b, w: 15, h: 8 }], legs, tail };
}

function drawCatFrame(ctx, ox, f) {
  const g = geometry(f);
  const h = g.head;
  const headParts = [
    { x: h.x, y: h.y + 1, w: 11, h: 8, c: PAL.fur },
    { x: h.x + 1, y: h.y, w: 9, h: 10, c: PAL.fur },
    { x: h.x + 1, y: h.y - 3, w: 2, h: 3, c: PAL.fur }, // ears
    { x: h.x + 7, y: h.y - 3, w: 2, h: 3, c: PAL.fur },
  ];
  const all = [
    ...g.tail.map((p) => ({ ...p, c: PAL.fur })),
    ...g.body.map((p) => ({ ...p, c: PAL.fur })),
    ...g.legs.map((p) => ({ ...p, c: PAL.fur })),
    ...headParts,
  ];
  parts(ctx, ox, all);

  // rim light along the top edges (skip columns the head covers)
  const body = g.body[0];
  for (let x = body.x + 1; x < body.x + body.w - 1; x++) {
    if (x < h.x - 1 || x > h.x + 11 || body.y < h.y - 4 || body.y > h.y + 10) rect(ctx, ox + x, body.y, 1, 1, PAL.rim);
  }
  const t = g.tail[0];
  rect(ctx, ox + t.x, t.y, t.w > t.h ? t.w : 1, 1, PAL.rim);
  rect(ctx, ox + h.x + 3, h.y, 4, 1, PAL.rim); // top of head
  rect(ctx, ox + h.x + 1, h.y - 3, 1, 1, PAL.rim); // ear tips
  rect(ctx, ox + h.x + 7, h.y - 3, 1, 1, PAL.rim);
  rect(ctx, ox + h.x + 2, h.y - 2, 1, 2, PAL.pink); // inner ears
  rect(ctx, ox + h.x + 8, h.y - 2, 1, 2, PAL.pink);

  // eyes: 2px wide amber, pupils toward the right (the way the cat faces)
  const eyes = f.eyes || 'open';
  const ey = h.y + 4;
  for (const ex of [h.x + 3, h.x + 8]) {
    if (eyes === 'open') {
      rect(ctx, ox + ex, ey, 2, 2, PAL.eye);
      rect(ctx, ox + ex + 1, ey, 1, 2, PAL.out);
    } else if (eyes === 'closed') rect(ctx, ox + ex, ey + 1, 2, 1, PAL.whisker);
    else if (eyes === 'down') rect(ctx, ox + ex, ey + 1, 2, 1, PAL.eye);
    else if (eyes === 'happy') {
      rect(ctx, ox + ex - 1, ey + 1, 1, 1, PAL.eye);
      rect(ctx, ox + ex, ey, 2, 1, PAL.eye);
      rect(ctx, ox + ex + 2, ey + 1, 1, 1, PAL.eye);
    }
  }
  rect(ctx, ox + h.x + 6, h.y + 6, 1, 1, PAL.pink); // nose
  rect(ctx, ox + h.x + 2, h.y + 7, 1, 1, PAL.red); // blush
  rect(ctx, ox + h.x + 9, h.y + 7, 1, 1, PAL.red);
  for (const [dx, dy] of [[-1, 6], [-2, 5], [11, 6], [12, 5]]) rect(ctx, ox + h.x + dx, h.y + dy, 1, 1, PAL.whisker);

  if (f.note) {
    parts(ctx, ox, [{ x: h.x + 2, y: h.y + 9, w: 7, h: 5, c: PAL.white }]);
    rect(ctx, ox + h.x + 5, h.y + 11, 1, 1, PAL.red);
    rect(ctx, ox + h.x + 1, h.y + 11, 1, 2, PAL.fur); // paws
    rect(ctx, ox + h.x + 9, h.y + 11, 1, 2, PAL.fur);
  }
}

function heart3(ctx, x, y, c) {
  rect(ctx, x, y, 1, 1, c);
  rect(ctx, x + 2, y, 1, 1, c);
  rect(ctx, x, y + 1, 3, 1, c);
  rect(ctx, x + 1, y + 2, 1, 1, c);
}

const ACC_DRAW = {
  bow(ctx, ox, h) {
    parts(ctx, ox, [
      { x: h.x, y: h.y - 3, w: 2, h: 3, c: PAL.pink },
      { x: h.x + 3, y: h.y - 3, w: 2, h: 3, c: PAL.pink },
      { x: h.x + 2, y: h.y - 2, w: 1, h: 1, c: PAL.red },
    ]);
  },
  partyhat(ctx, ox, h) {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const w = 1 + Math.floor(i / 1.5);
      rows.push({ x: h.x + 5 - Math.floor(w / 2), y: h.y - 7 + i, w, h: 1, c: i % 2 ? PAL.blue : PAL.yellow });
    }
    parts(ctx, ox, rows);
    rect(ctx, ox + h.x + 4, h.y - 9, 2, 2, PAL.pink);
  },
  crown(ctx, ox, h) {
    const cols = [PAL.pink, PAL.yellow, PAL.white];
    rect(ctx, ox + h.x, h.y, 11, 1, PAL.green);
    for (let i = 0; i < 6; i++) rect(ctx, ox + h.x + i * 2, h.y - 1, 1, 1, cols[i % 3]);
  },
  sunglasses(ctx, ox, h) {
    rect(ctx, ox + h.x + 2, h.y + 3, 3, 3, PAL.out);
    rect(ctx, ox + h.x + 7, h.y + 3, 3, 3, PAL.out);
    rect(ctx, ox + h.x + 5, h.y + 3, 2, 1, PAL.out);
    rect(ctx, ox + h.x, h.y + 3, 2, 1, PAL.out);
    rect(ctx, ox + h.x + 3, h.y + 3, 1, 1, PAL.gray);
    rect(ctx, ox + h.x + 8, h.y + 3, 1, 1, PAL.gray);
  },
  heartglasses(ctx, ox, h) {
    heart3(ctx, ox + h.x + 2, h.y + 3, PAL.red);
    heart3(ctx, ox + h.x + 7, h.y + 3, PAL.red);
    rect(ctx, ox + h.x + 5, h.y + 3, 2, 1, PAL.red);
  },
  scarf(ctx, ox, h) {
    parts(ctx, ox, [
      { x: h.x - 1, y: h.y + 8, w: 8, h: 2, c: PAL.red },
      { x: h.x, y: h.y + 10, w: 2, h: 3, c: PAL.red },
    ]);
    rect(ctx, ox + h.x + 1, h.y + 8, 1, 2, PAL.white);
    rect(ctx, ox + h.x + 4, h.y + 8, 1, 2, PAL.white);
  },
  // Messy black hair + the lightning scar. Hair is the outline color (darker
  // than the fur) with rim highlights so it reads on a black cat. The scar sits
  // on Harry's right side of the forehead (viewer's left), above the eye.
  harryhair(ctx, ox, h) {
    const px = (x, y, c) => rect(ctx, ox + h.x + x, h.y + y, 1, 1, c);
    for (const [x, y] of [
      [4, -3], [3, -2], [4, -2], [6, -2], [3, -1], [4, -1], [5, -1], [6, -1], // messy top between the ears
      [6, 0], [7, 0], [8, 0], [9, 0], [7, 1], [9, 1], [9, 2], // jagged fringe on the right
      [1, 0], [2, 0], [3, 0], [3, 1], // left side, keeps the scar apart from the pink ear
    ]) px(x, y, PAL.out);
    px(4, -3, PAL.rim);
    px(6, -2, PAL.rim);
    px(8, 0, PAL.rim);
    for (const [x, y] of [[5, 0], [4, 1], [5, 1], [4, 2]]) px(x, y, PAL.pink); // lightning bolt
  },
  // Round wire glasses around both eyes, silver so they show on dark fur.
  roundglasses(ctx, ox, h) {
    const c = PAL.whisker;
    for (const ex of [h.x + 3, h.x + 8]) {
      rect(ctx, ox + ex, h.y + 3, 2, 1, c);
      rect(ctx, ox + ex, h.y + 6, 2, 1, c);
      rect(ctx, ox + ex - 1, h.y + 4, 1, 2, c);
      rect(ctx, ox + ex + 2, h.y + 4, 1, 2, c);
    }
    rect(ctx, ox + h.x + 6, h.y + 4, 1, 1, c); // bridge
    rect(ctx, ox + h.x + 1, h.y + 4, 1, 1, c); // arm
  },
  // House scarf: scarlet with gold stripes.
  gryffindor(ctx, ox, h) {
    parts(ctx, ox, [
      { x: h.x - 1, y: h.y + 8, w: 8, h: 2, c: PAL.red },
      { x: h.x, y: h.y + 10, w: 2, h: 3, c: PAL.red },
    ]);
    for (const x of [0, 2, 4, 6]) rect(ctx, ox + h.x + x - 1, h.y + 8, 1, 2, PAL.yellow);
    rect(ctx, ox + h.x, h.y + 11, 2, 1, PAL.yellow);
  },
  // Long braids down both sides of the face. Alternating dark/light pixels read
  // as a braided texture and keep them visible against the black fur.
  braids(ctx, ox, h) {
    const px = (x, y, c) => rect(ctx, ox + h.x + x, h.y + y, 1, 1, c);
    rect(ctx, ox + h.x + 3, h.y, 4, 1, PAL.out); // hairline between the ears
    for (const bx of [-2, 11]) { // 2px wide, just outside each side of the head
      for (let y = 1; y <= 11; y++) for (const dx of [0, 1]) px(bx + dx, y, (y + dx) % 2 ? PAL.out : PAL.rim);
      px(bx, 12, PAL.yellow); // beads at the ends
      px(bx + 1, 12, PAL.yellow);
    }
  },
  // Wide dark shades with a gold top bar so they show on a black cat.
  snoopshades(ctx, ox, h) {
    rect(ctx, ox + h.x + 1, h.y + 3, 10, 1, PAL.yellow);
    rect(ctx, ox + h.x + 2, h.y + 4, 3, 2, PAL.out);
    rect(ctx, ox + h.x + 7, h.y + 4, 3, 2, PAL.out);
    rect(ctx, ox + h.x + 2, h.y + 4, 1, 1, PAL.white); // glint
    rect(ctx, ox + h.x + 7, h.y + 4, 1, 1, PAL.white);
  },
  goldchain(ctx, ox, h) {
    for (let x = -1; x <= 7; x++) rect(ctx, ox + h.x + x, h.y + 9, 1, 1, x % 2 ? PAL.yellow : '#c98a5a');
    parts(ctx, ox, [{ x: h.x + 2, y: h.y + 10, w: 3, h: 3, c: PAL.yellow }]); // medallion
    rect(ctx, ox + h.x + 3, h.y + 11, 1, 1, PAL.white);
  },
  // "Deal with it" pixel shades: a thick black bar, stepped lenses and white
  // glints. The glints carry them on the black fur.
  coolshades(ctx, ox, h) {
    const px = (x, y, c) => rect(ctx, ox + h.x + x, h.y + y, 1, 1, c);
    rect(ctx, ox + h.x - 1, h.y + 2, 13, 1, PAL.whisker); // silver shine along the top
    rect(ctx, ox + h.x - 1, h.y + 3, 13, 1, PAL.out); // bar sticks out past the head
    rect(ctx, ox + h.x + 1, h.y + 4, 4, 2, PAL.out);
    rect(ctx, ox + h.x + 6, h.y + 4, 4, 2, PAL.out);
    rect(ctx, ox + h.x + 2, h.y + 6, 3, 1, PAL.out); // stepped bottom
    rect(ctx, ox + h.x + 7, h.y + 6, 3, 1, PAL.out);
    for (const lx of [1, 6]) { px(lx + 1, 4, PAL.white); px(lx + 2, 4, PAL.white); px(lx + 2, 5, PAL.white); } // glints
  },
  // Joint from the corner of the mouth, lit tip on the end.
  joint(ctx, ox, h) {
    const tip = tipX(h);
    rect(ctx, ox + h.x + 8, h.y + 7, tip - h.x - 8, 1, PAL.white);
    rect(ctx, ox + tip, h.y + 7, 1, 1, '#ef7d57'); // ember
    rect(ctx, ox + tip, h.y + 6, 1, 1, PAL.gray); // ash
  },
  collar(ctx, ox, h) {
    rect(ctx, ox + h.x - 1, h.y + 9, 8, 1, PAL.navy);
    parts(ctx, ox, [{ x: h.x + 4, y: h.y + 10, w: 2, h: 2, c: PAL.yellow }]);
  },
};

function drawAccFrame(ctx, ox, f, id) {
  ACC_DRAW[id](ctx, ox, geometry(f).head);
}

// ---------- room ----------
// Nidhi's room. Back wall with the window in the middle, wooden floor.
// Furniture against the side walls faces into the room: it shows its front
// plus a darker side face going back to the wall (like a product photo).

export const ROOM = { w: 192, h: 256, wallH: 84 };

const WOOD = { top: '#c98a5a', mid: '#a0603b', dark: '#7a4628' };

// Her colors: warm tan walls, navy wall to wall carpet (broadloom).
const WALL = { base: '#e3c08d', dot: '#d6b07c', side: '#cfa874', corner: '#b8925e' };
const CARPET = { base: '#0b2447', light: '#10305c', dark: '#081b38', edge: '#06152b' };

function drawRoom(ctx) {
  const { w, h, wallH } = ROOM;
  rect(ctx, 0, 0, w, wallH, WALL.base);
  for (let y = 6; y < wallH - 6; y += 10) for (let x = (y / 10) % 2 ? 4 : 9; x < w; x += 10) rect(ctx, x, y, 1, 1, WALL.dot);
  // side walls: darker strips meeting the back wall at the corners
  rect(ctx, 0, 0, 6, wallH, WALL.side);
  rect(ctx, w - 6, 0, 6, wallH, WALL.side);
  rect(ctx, 6, 0, 1, wallH, WALL.corner);
  rect(ctx, w - 7, 0, 1, wallH, WALL.corner);

  // Broadloom: one even color with a fine, low contrast pile grain (no planks,
  // no pattern, so it reads as a flat floor). Fixed seed: same carpet every load.
  rect(ctx, 0, wallH, w, h - wallH, CARPET.base);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = wallH; y < h; y++) for (let x = 0; x < w; x++) {
    const r = rnd();
    if (r < 0.06) rect(ctx, x, y, 1, 1, CARPET.light);
    else if (r < 0.11) rect(ctx, x, y, 1, 1, CARPET.dark);
  }
  rect(ctx, 0, wallH, w, 2, CARPET.edge); // shadow under the baseboard
  rect(ctx, 0, wallH, 2, h - wallH, CARPET.edge); // carpet meets the side walls
  rect(ctx, w - 2, wallH, 2, h - wallH, CARPET.edge);
  rect(ctx, 0, wallH - 4, w, 4, PAL.white); // baseboard
  rect(ctx, 0, wallH - 4, w, 1, WALL.corner);

  // window, middle of the back wall, pink curtains
  const wx = 76;
  rect(ctx, wx, 18, 40, 34, PAL.white);
  rect(ctx, wx + 3, 21, 34, 28, '#73eff7');
  rect(ctx, wx + 19, 21, 2, 28, PAL.white);
  rect(ctx, wx + 3, 34, 34, 2, PAL.white);
  rect(ctx, wx + 8, 26, 6, 2, PAL.white); // cloud
  rect(ctx, wx + 6, 28, 10, 2, PAL.white);
  rect(ctx, wx - 8, 12, 56, 2, PAL.out); // curtain rod
  for (const cx of [wx - 6, wx + 38]) {
    rect(ctx, cx, 14, 8, 44, PAL.out);
    rect(ctx, cx + 1, 14, 6, 43, PAL.pink);
    for (let y = 16; y < 56; y += 4) rect(ctx, cx + 3, y, 1, 2, '#e06090');
  }
  rect(ctx, wx, 52, 40, 3, PAL.out); // sill
  rect(ctx, wx + 1, 52, 38, 2, PAL.white);
}

// Box outline + fill in one call.
function box(ctx, x, y, w, h, c) {
  rect(ctx, x, y, w, h, PAL.out);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, c);
}

// Furniture: each its own texture so it can be depth sorted and tapped.
// `frames` > 1 draws a strip of frames side by side (draw gets the frame index).
const FURNITURE = {
  // Top down bed: headboard + pillow against the back wall, foot toward the viewer.
  bed: { w: 46, h: 72, draw(ctx) {
    box(ctx, 0, 0, 46, 14, WOOD.top); // headboard
    rect(ctx, 1, 10, 44, 3, WOOD.dark);
    for (const x of [0, 42]) box(ctx, x, 0, 4, 16, WOOD.dark); // posts
    box(ctx, 2, 12, 42, 52, PAL.white); // mattress
    box(ctx, 6, 14, 34, 11, PAL.white); // pillow
    rect(ctx, 7, 22, 32, 2, '#dfe7ee');
    rect(ctx, 22, 15, 1, 8, '#dfe7ee'); // crease
    // blanket with a folded pink edge, hanging over the foot
    box(ctx, 2, 27, 42, 40, '#8a3f8a');
    rect(ctx, 3, 28, 40, 3, PAL.pink);
    rect(ctx, 3, 31, 40, 1, '#5d275d');
    for (let y = 36; y < 62; y += 7) for (let x = (y % 2 ? 8 : 12); x < 40; x += 10) heart3(ctx, x, y, '#b55fb5');
    rect(ctx, 3, 62, 40, 4, '#5d275d');
    box(ctx, 0, 64, 46, 6, WOOD.dark); // footboard
    rect(ctx, 1, 65, 44, 1, WOOD.top);
    for (const x of [0, 42]) box(ctx, x, 62, 4, 10, WOOD.dark);
  } },
  // Dresser on the left wall: side face against the wall, drawers face right.
  drawer: { w: 26, h: 36, draw(ctx) {
    box(ctx, 0, 0, 26, 7, WOOD.top); // top
    box(ctx, 0, 6, 7, 30, WOOD.dark); // side
    box(ctx, 6, 6, 20, 30, WOOD.mid); // front
    for (const y of [15, 24]) rect(ctx, 7, y, 18, 1, PAL.out);
    for (const y of [10, 19, 28]) { rect(ctx, 14, y, 4, 2, PAL.out); rect(ctx, 15, y, 2, 1, PAL.yellow); }
  } },
  // Desk along the right wall, seen from above.
  desk: { w: 42, h: 64, draw(ctx) {
    box(ctx, 0, 0, 42, 46, WOOD.top);
    for (const [x, y, l] of [[5, 8, 14], [20, 18, 16], [8, 30, 12], [24, 38, 10]]) rect(ctx, x, y, l, 1, '#b5784a');
    box(ctx, 0, 44, 42, 6, WOOD.dark); // front edge
    for (const x of [2, 36]) box(ctx, x, 49, 4, 15, WOOD.dark); // legs
  } },
  // Monitor turned toward the bed: screen on the left, back shell on the right.
  // Frame 0 = on, frame 1 = a heart (the note is ready).
  monitor: { w: 16, h: 22, frames: 2, draw(ctx, i) {
    rect(ctx, 5, 18, 10, 4, PAL.out); // base
    rect(ctx, 6, 19, 8, 2, '#566c86');
    rect(ctx, 9, 14, 3, 5, PAL.out); // neck
    rect(ctx, 10, 14, 1, 4, '#566c86');
    rect(ctx, 11, 1, 5, 13, PAL.out); // back shell
    rect(ctx, 12, 2, 3, 11, '#333c57');
    box(ctx, 0, 0, 12, 15, i ? '#29366f' : '#3b5dc9'); // screen
    if (i) {
      heart3(ctx, 3, 5, PAL.pink);
      heart3(ctx, 5, 5, PAL.pink);
      rect(ctx, 4, 6, 4, 2, PAL.pink);
      rect(ctx, 5, 8, 2, 1, PAL.pink);
    } else {
      for (const [y, l] of [[3, 7], [5, 5], [7, 8], [9, 4], [11, 6]]) rect(ctx, 2, y, l, 1, '#41a6f6');
      rect(ctx, 1, 1, 1, 3, '#73eff7'); // glare
    }
  } },
  note: { w: 8, h: 6, draw(ctx) {
    rect(ctx, 0, 0, 8, 6, PAL.out);
    rect(ctx, 1, 1, 6, 4, PAL.white);
    heart3(ctx, 2, 2, PAL.red);
  } },
  // Black mini fridge, door facing left (silver handle on the room side).
  // The lighter top face and highlight edge keep it readable on the navy carpet.
  fridge: { w: 34, h: 34, draw(ctx) {
    box(ctx, 0, 0, 34, 7, '#566c86'); // top
    rect(ctx, 1, 1, 32, 1, PAL.gray); // shine on the top edge
    box(ctx, 26, 6, 8, 28, PAL.out); // side
    box(ctx, 0, 6, 27, 28, '#333c57'); // front
    rect(ctx, 1, 7, 1, 26, '#566c86'); // highlight edge
    rect(ctx, 1, 13, 25, 1, PAL.out); // freezer door line
    rect(ctx, 3, 15, 1, 9, PAL.gray); // handle
    rect(ctx, 3, 9, 1, 2, PAL.gray);
    rect(ctx, 20, 9, 3, 1, PAL.gray); // logo
  } },
  // Black microwave on the fridge, same angle. The cat stands on its top.
  microwave: { w: 20, h: 13, draw(ctx) {
    box(ctx, 0, 0, 20, 5, PAL.gray); // top
    rect(ctx, 1, 1, 18, 1, PAL.white);
    box(ctx, 14, 4, 6, 9, PAL.out);
    box(ctx, 0, 4, 15, 9, '#333c57'); // front
    box(ctx, 2, 5, 8, 7, '#29366f'); // window
    rect(ctx, 3, 6, 2, 1, '#566c86');
    rect(ctx, 10, 6, 1, 5, PAL.gray); // handle
    for (const y of [6, 8]) rect(ctx, 12, y, 2, 1, PAL.gray); // buttons
    rect(ctx, 12, 10, 2, 1, PAL.green);
  } },
  // Global Industrial tri-temp UV-C water dispenser (WB670436), all black:
  // 3 buttons on top (hot is red), LED panel, recessed alcove with 3 spouts,
  // red hot water sticker, ribbed drip tray, plain lower cabinet, vented side.
  dispenser: { w: 26, h: 50, draw(ctx) {
    box(ctx, 0, 0, 26, 5, '#333c57'); // top
    for (const [x, c] of [[3, PAL.red], [8, PAL.gray], [13, PAL.gray]]) rect(ctx, x, 3, 3, 1, c); // buttons
    box(ctx, 19, 4, 7, 46, PAL.out); // side
    for (let y = 9; y < 46; y += 3) rect(ctx, 21, y, 3, 1, '#333c57'); // vents
    box(ctx, 0, 4, 20, 46, '#333c57'); // front
    rect(ctx, 1, 5, 1, 44, '#566c86'); // highlight edge
    for (const [x, c] of [[5, PAL.green], [8, PAL.blue], [11, PAL.white], [14, '#73eff7']]) rect(ctx, x, 9, 1, 1, c); // LEDs
    rect(ctx, 3, 13, 14, 13, PAL.out); // alcove
    for (const x of [5, 9, 13]) { rect(ctx, x, 12, 1, 1, PAL.white); rect(ctx, x, 14, 1, 1, PAL.gray); } // arrows + spouts
    rect(ctx, 8, 18, 3, 3, PAL.red); // hot water sticker
    rect(ctx, 9, 19, 1, 1, PAL.white);
    rect(ctx, 2, 25, 16, 3, PAL.out); // drip tray
    for (let x = 3; x < 17; x += 2) rect(ctx, x, 26, 1, 1, '#566c86');
    rect(ctx, 1, 29, 18, 1, PAL.out); // cabinet seam
  } },
  plant: { w: 16, h: 30, draw(ctx) {
    parts(ctx, 0, [
      { x: 7, y: 4, w: 2, h: 14, c: PAL.green },
      { x: 2, y: 6, w: 5, h: 4, c: PAL.green },
      { x: 9, y: 3, w: 5, h: 4, c: PAL.green },
      { x: 3, y: 12, w: 4, h: 3, c: PAL.green },
      { x: 9, y: 10, w: 5, h: 3, c: PAL.green },
      { x: 4, y: 19, w: 8, h: 10, c: PAL.red },
    ]);
  } },
  // Her photo wall in the top left corner: scattered polaroids of her and her
  // friends, a photo booth strip, washi tape, and two photos on the side wall.
  friends: { w: 70, h: 62, draw(ctx) { drawFriendsWall(ctx); } },
  photo: { w: 26, h: 24, draw(ctx) {
    rect(ctx, 0, 0, 26, 24, PAL.out);
    rect(ctx, 1, 1, 24, 22, PAL.yellow);
    rect(ctx, 4, 4, 18, 16, PAL.white);
    heart3(ctx, 8, 9, PAL.red);
    heart3(ctx, 14, 10, PAL.pink);
  } },
};

// ---------- photo wall ----------

const SKIN = ['#8d5524', '#a8693a', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac'];
const HAIR = ['#1a1c2c', '#3b2416', '#6b3e26', '#c9a15a', '#b13e53'];
const SHIRT = [PAL.pink, PAL.blue, PAL.green, PAL.yellow, PAL.white, '#ef7d57', '#5d275d', PAL.navy];
const SCENE = [
  ['#73eff7', '#41a6f6'], // sky
  ['#73eff7', '#ffcd75'], // beach: sky over sand
  ['#ff77a8', '#5d275d'], // party
  ['#a7f070', '#38b764'], // park
  ['#29366f', '#1a1c2c'], // night out
  ['#f4f4f4', '#94b0c2'], // indoors
];
const NIDHI = { skin: '#a8693a', hair: '#1a1c2c', long: true };

// One tiny person in a photo: hair, face, shirt. w = 2 or 3 px wide.
function person(ctx, x, y, w, p, shirt) {
  rect(ctx, x, y, w, 1, p.hair); // hair
  rect(ctx, x, y + 1, w, 2, p.skin); // face
  if (p.long) { rect(ctx, x - 1, y, 1, 4, p.hair); rect(ctx, x + w, y, 1, 4, p.hair); }
  rect(ctx, x - (w > 2 ? 1 : 0), y + 3, w + (w > 2 ? 2 : 0), 8, shirt); // shoulders (clipped by the photo)
}

// An 8x8 picture: a scene + 1 to 3 people, Nidhi in most of them.
function picture(ctx, x, y, w, h, rnd) {
  const [top, bottom] = SCENE[Math.floor(rnd() * SCENE.length)];
  rect(ctx, x, y, w, h, top);
  rect(ctx, x, y + Math.ceil(h / 2) + 1, w, Math.floor(h / 2) - 1, bottom);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const n = w < 6 ? 1 : 1 + Math.floor(rnd() * 3);
  const pw = n === 3 ? 2 : w < 6 ? 2 : 3;
  const gap = n === 1 ? 0 : Math.floor((w - n * pw) / n);
  let px = x + Math.floor((w - (n * pw + (n - 1) * gap)) / 2);
  const nidhiAt = rnd() < 0.8 ? Math.floor(rnd() * n) : -1;
  for (let i = 0; i < n; i++) {
    const p = i === nidhiAt ? NIDHI : {
      skin: SKIN[Math.floor(rnd() * SKIN.length)],
      hair: HAIR[Math.floor(rnd() * HAIR.length)],
      long: rnd() < 0.5,
    };
    person(ctx, px, y + 2 + (rnd() < 0.3 ? 1 : 0), pw, p, SHIRT[Math.floor(rnd() * SHIRT.length)]);
    px += pw + gap;
  }
  ctx.restore();
}

function polaroid(ctx, x, y, rnd) {
  rect(ctx, x, y, 10, 12, PAL.out);
  rect(ctx, x + 1, y + 1, 8, 10, PAL.white);
  picture(ctx, x + 1, y + 1, 8, 8, rnd);
}

function tape(ctx, x, y, c) {
  rect(ctx, x, y, 4, 2, c);
  rect(ctx, x + 1, y, 1, 1, PAL.white);
}

function drawFriendsWall(ctx) {
  let seed = 2024;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // two on the left side wall, seen edge on (thin)
  for (const y of [8, 30]) {
    rect(ctx, 1, y, 4, 11, PAL.out);
    rect(ctx, 2, y + 1, 2, 9, PAL.white);
    rect(ctx, 2, y + 2, 2, 5, SCENE[Math.floor(rnd() * SCENE.length)][0]);
    rect(ctx, 2, y + 4, 2, 2, NIDHI.skin);
  }
  // scattered on the back wall, back to front (later ones overlap earlier ones)
  const spots = [
    [9, 3], [21, 1], [33, 4], [46, 2], [57, 6],
    [11, 18], [24, 16], [36, 19], [58, 22],
    [8, 34], [20, 33], [33, 36],
  ];
  const tapes = [PAL.pink, PAL.yellow, '#a7f070'];
  spots.forEach(([x, y], i) => {
    polaroid(ctx, x, y, rnd);
    if (i % 3 !== 2) tape(ctx, x + 3, y - 1, tapes[i % 3]);
  });
  // photo booth strip
  const sx = 47, sy = 16;
  rect(ctx, sx, sy, 8, 27, PAL.out);
  rect(ctx, sx + 1, sy + 1, 6, 25, PAL.white);
  for (let k = 0; k < 4; k++) picture(ctx, sx + 2, sy + 2 + k * 6, 4, 5, () => (k === 0 ? 0.5 : rnd()));
  tape(ctx, sx + 2, sy - 1, PAL.pink);
}

// ---------- strawberry matcha ----------
// Iced strawberry matcha in a clear glass: strawberry purée at the bottom, milk in
// the middle, matcha on top (the order it is poured in). Glass is drawn as edges +
// one highlight column so the floor shows through the empty part.

export const MATCHA = {
  w: 13,
  h: 17,
  // rows of [strawberry, milk, matcha, foam], bottom up. Layers shrink together so
  // all three colors stay visible while she drinks.
  frames: [
    [3, 3, 3, 1], // 0 full
    [2, 2, 2, 1], // 1 three quarters
    [2, 1, 1, 1], // 2 half
    [1, 1, 1, 0], // 3 quarter
    [0, 0, 0, 0], // 4 empty
    [3, 0, 0, 0], // 5 pour step 1: strawberry
    [3, 3, 0, 0], // 6 pour step 2: + milk
  ],
};
// Frame index for a fill level in quarters (4 = full, 0 = empty).
export const matchaFrame = (quarters) => 4 - quarters;

function drawMatcha(ctx, ox, [red, milk, green, foam]) {
  const px = (x, y, c) => rect(ctx, ox + x, y, 1, 1, c);
  const IN_X = 3, IN_W = 7, BOTTOM = 13; // glass interior: x 3..9, rows up to 13

  // liquid, bottom up
  let y = BOTTOM;
  const band = (rows, c, deco) => {
    for (let i = 0; i < rows; i++, y--) {
      rect(ctx, ox + IN_X, y, IN_W, 1, c);
      deco?.(y, i);
    }
  };
  band(red, PAL.red, (yy, i) => { if (i === 0) { px(4, yy, PAL.pink); px(8, yy, PAL.pink); } else if (i === 1) px(6, yy, PAL.pink); });
  band(milk, PAL.white, (yy, i) => { if (i === 0) px(5, yy, PAL.pink); if (i === 1) px(8, yy, PAL.pink); });
  band(green, PAL.green);
  band(foam, '#a7f070');
  const top = y + 1; // first liquid row (or BOTTOM + 1 when empty)

  // ice: floats at the top of the liquid, rests on the bottom when empty
  const iceY = red + milk + green + foam ? Math.min(top + 1, BOTTOM - 1) : BOTTOM - 1;
  rect(ctx, ox + IN_X + 1, iceY, 2, 2, '#73eff7');
  px(IN_X + 1, iceY, PAL.white);
  if (!(red + milk + green + foam)) rect(ctx, ox + IN_X, BOTTOM, IN_W, 1, PAL.pink); // the last pink sip

  // straw: down into the drink, leaning up and right toward the cat's mouth
  for (let yy = 4; yy <= Math.min(top, BOTTOM); yy++) px(7, yy, PAL.pink); // hidden once it dips into the drink
  const outside = [[8, 3], [9, 2], [10, 1], [11, 0]];
  for (const [sx, sy] of outside) rect(ctx, ox + sx - 1, sy, 3, 1, PAL.out);
  for (const [sx, sy] of outside) px(sx, sy, PAL.pink);

  // glass: side walls, bottom, highlight, coaster
  rect(ctx, ox + 2, 3, 1, 12, PAL.out);
  rect(ctx, ox + 10, 3, 1, 12, PAL.out);
  rect(ctx, ox + 2, 14, 9, 1, PAL.out);
  rect(ctx, ox + IN_X, 5, 1, 6, PAL.white); // highlight streak
  px(2, 3, PAL.whisker); // rim glints
  px(10, 3, PAL.whisker);
  rect(ctx, ox + 1, 15, 11, 1, '#c98a5a');
  rect(ctx, ox + 1, 16, 11, 1, PAL.out);
  px(0, 15, PAL.out);
  px(12, 15, PAL.out);
}

// ---------- small effect sprites ----------

const FX = {
  heart: { w: 7, h: 6, draw(ctx) {
    const rows = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
    rows.forEach((r, y) => [...r].forEach((ch, x) => ch === 'x' && rect(ctx, x, y, 1, 1, PAL.pink)));
  } },
  sparkle: { w: 5, h: 5, draw(ctx) {
    rect(ctx, 2, 0, 1, 5, PAL.yellow);
    rect(ctx, 0, 2, 5, 1, PAL.yellow);
    rect(ctx, 2, 2, 1, 1, PAL.white);
  } },
  smoke: { w: 3, h: 3, draw(ctx) {
    rect(ctx, 1, 0, 1, 3, PAL.gray);
    rect(ctx, 0, 1, 3, 1, PAL.gray);
    rect(ctx, 1, 1, 1, 1, PAL.white);
  } },
  zz: { w: 4, h: 5, draw(ctx) {
    rect(ctx, 0, 0, 4, 1, PAL.white);
    rect(ctx, 2, 1, 1, 1, PAL.white);
    rect(ctx, 1, 2, 1, 2, PAL.white);
    rect(ctx, 0, 4, 4, 1, PAL.white);
  } },
  bang: { w: 3, h: 8, draw(ctx) {
    rect(ctx, 0, 0, 3, 8, PAL.out);
    rect(ctx, 1, 1, 1, 4, PAL.yellow);
    rect(ctx, 1, 6, 1, 1, PAL.yellow);
  } },
};

const CONFETTI = [PAL.pink, PAL.yellow, PAL.blue, PAL.green, PAL.white];

// ---------- registration with Phaser ----------

const canvases = {};

function addSheet(scene, key, drawFrame) {
  const c = canvas(FRAME * FRAMES.length, FRAME);
  const ctx = c.getContext('2d');
  FRAMES.forEach((f, i) => drawFrame(ctx, i * FRAME, f));
  canvases[key] = c;
  const tex = scene.textures.addCanvas(key, c);
  FRAMES.forEach((_, i) => tex.add(i, 0, i * FRAME, 0, FRAME, FRAME));
}

function addSingle(scene, key, w, h, draw) {
  const c = canvas(w, h);
  draw(c.getContext('2d'));
  canvases[key] = c;
  scene.textures.addCanvas(key, c);
}

function addAnims(scene, prefix) {
  for (const [name, tag] of Object.entries(TAGS)) {
    scene.anims.create({
      key: `${prefix}-${name}`,
      frames: tag.frames.map((_, i) => ({ key: prefix, frame: tag.start + i })),
      frameRate: tag.rate,
      repeat: tag.repeat,
    });
  }
}

export function registerPlaceholderArt(scene) {
  addSheet(scene, 'cat', drawCatFrame);
  addAnims(scene, 'cat');
  for (const a of ACCESSORIES) {
    addSheet(scene, `acc-${a.id}`, (ctx, ox, f) => drawAccFrame(ctx, ox, f, a.id));
    addAnims(scene, `acc-${a.id}`);
  }
  addSingle(scene, 'room', ROOM.w, ROOM.h, drawRoom);
  for (const [k, v] of Object.entries({ ...FURNITURE, ...FX })) {
    const n = v.frames ?? 1;
    if (n === 1) { addSingle(scene, k, v.w, v.h, v.draw); continue; }
    const c = canvas(v.w * n, v.h);
    const fctx = c.getContext('2d');
    for (let i = 0; i < n; i++) { fctx.save(); fctx.translate(i * v.w, 0); v.draw(fctx, i); fctx.restore(); }
    canvases[k] = c;
    const tex = scene.textures.addCanvas(k, c);
    for (let i = 0; i < n; i++) tex.add(i, 0, i * v.w, 0, v.w, v.h);
  }

  const m = canvas(MATCHA.w * MATCHA.frames.length, MATCHA.h);
  const mctx = m.getContext('2d');
  MATCHA.frames.forEach((layers, i) => drawMatcha(mctx, i * MATCHA.w, layers));
  canvases.matcha = m;
  const mtex = scene.textures.addCanvas('matcha', m);
  MATCHA.frames.forEach((_, i) => mtex.add(i, 0, i * MATCHA.w, 0, MATCHA.w, MATCHA.h));

  const c = canvas(3 * CONFETTI.length, 2);
  const ctx = c.getContext('2d');
  CONFETTI.forEach((col, i) => rect(ctx, i * 3, 0, 3, 2, col));
  const tex = scene.textures.addCanvas('confetti', c);
  CONFETTI.forEach((_, i) => tex.add(i, 0, i * 3, 0, 3, 2));
}

// Draw cat (+ optional accessories) at frame 0 into any canvas, for DOM previews.
export function drawPreview(target, accIds = [], frameIndex = 0) {
  const ctx = target.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  const sources = [canvases.cat ?? sheetFor('cat', drawCatFrame), ...accIds.map((id) => canvases[`acc-${id}`] ?? sheetFor(`acc-${id}`, (c, ox, f) => drawAccFrame(c, ox, f, id)))];
  for (const src of sources) ctx.drawImage(src, frameIndex * FRAME, 0, FRAME, FRAME, 0, 0, target.width, target.height);
}

function sheetFor(key, drawFrame) {
  const c = canvas(FRAME * FRAMES.length, FRAME);
  const ctx = c.getContext('2d');
  FRAMES.forEach((f, i) => drawFrame(ctx, i * FRAME, f));
  canvases[key] = c;
  return c;
}

// Just the accessory, cropped to its pixels and scaled up (for small icons).
export function drawAccIcon(target, id) {
  const src = canvases[`acc-${id}`] ?? sheetFor(`acc-${id}`, (c, ox, f) => drawAccFrame(c, ox, f, id));
  const data = src.getContext('2d').getImageData(0, 0, FRAME, FRAME).data;
  let x1 = FRAME, y1 = FRAME, x2 = -1, y2 = -1;
  for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
    if (data[(y * FRAME + x) * 4 + 3]) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
  }
  const ctx = target.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  if (x2 < 0) return;
  const w = x2 - x1 + 1, h = y2 - y1 + 1;
  const s = Math.max(1, Math.floor(Math.min(target.width / w, target.height / h)));
  ctx.drawImage(src, x1, y1, w, h, Math.floor((target.width - w * s) / 2), Math.floor((target.height - h * s) / 2), w * s, h * s);
}
