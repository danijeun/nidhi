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

export const ROOM = { w: 192, h: 256, wallH: 90 };

function drawRoom(ctx) {
  const { w, h, wallH } = ROOM;
  rect(ctx, 0, 0, w, wallH, '#566c86');
  for (let y = 6; y < wallH - 6; y += 10) for (let x = (y / 10) % 2 ? 4 : 9; x < w; x += 10) rect(ctx, x, y, 1, 1, '#6a82a0');
  rect(ctx, 0, wallH, w, h - wallH, '#a0603b');
  for (let y = wallH + 10; y < h; y += 12) rect(ctx, 0, y, w, 1, '#7a4628');
  for (let y = wallH; y < h; y += 12) {
    const off = ((y - wallH) / 12) % 2 ? 22 : 48;
    for (let x = off; x < w; x += 52) rect(ctx, x, y, 1, 12, '#7a4628');
  }
  rect(ctx, 0, wallH - 4, w, 4, '#333c57'); // baseboard

  // window
  rect(ctx, 22, 22, 40, 34, PAL.white);
  rect(ctx, 25, 25, 34, 28, '#73eff7');
  rect(ctx, 41, 25, 2, 28, PAL.white);
  rect(ctx, 25, 38, 34, 2, PAL.white);
  rect(ctx, 30, 30, 6, 2, PAL.white); // cloud
  rect(ctx, 28, 32, 10, 2, PAL.white);

  // rug
  const cx = 92, cy = 190, rx = 48, ry = 22;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d <= 1) rect(ctx, cx + x, cy + y, 1, 1, d > 0.8 ? PAL.red : d > 0.55 ? PAL.pink : '#e06090');
  }
}

// Furniture: each its own texture so it can be depth sorted and tapped.
const FURNITURE = {
  table: { w: 40, h: 30, draw(ctx) {
    rect(ctx, 0, 0, 40, 10, PAL.out);
    rect(ctx, 1, 1, 38, 8, '#c98a5a');
    rect(ctx, 0, 10, 40, 4, PAL.out);
    rect(ctx, 1, 10, 38, 3, '#7a4628');
    for (const x of [2, 34]) { rect(ctx, x, 14, 4, 16, PAL.out); rect(ctx, x + 1, 14, 2, 15, '#7a4628'); }
  } },
  note: { w: 8, h: 6, draw(ctx) {
    rect(ctx, 0, 0, 8, 6, PAL.out);
    rect(ctx, 1, 1, 6, 4, PAL.white);
    heart3(ctx, 2, 2, PAL.red);
  } },
  bed: { w: 36, h: 16, draw(ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 36; x++) {
      const d = ((x - 17.5) ** 2) / 324 + ((y - 7.5) ** 2) / 64;
      if (d <= 1) rect(ctx, x, y, 1, 1, d > 0.8 ? PAL.out : d > 0.45 ? '#5d275d' : '#8a3f8a');
    }
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
  photo: { w: 26, h: 24, draw(ctx) {
    rect(ctx, 0, 0, 26, 24, PAL.out);
    rect(ctx, 1, 1, 24, 22, PAL.yellow);
    rect(ctx, 4, 4, 18, 16, PAL.white);
    heart3(ctx, 8, 9, PAL.red);
    heart3(ctx, 14, 10, PAL.pink);
  } },
};

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
  for (const [k, v] of Object.entries({ ...FURNITURE, ...FX })) addSingle(scene, k, v.w, v.h, v.draw);

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
