// DOM overlays: HUD meters, speech bubble, wardrobe, letter, cards, title.
// Text lives in the DOM (not the 192px canvas) so it stays crisp on phones.

import { ACCESSORIES, drawAccIcon, drawPreview } from '../art/placeholder.js';
import { CONFIG } from '../config.js';
import { sfx } from '../sfx.js';

const $ = (sel) => document.querySelector(sel);

// ---------- HUD ----------

export function updateMeters(state) {
  for (const el of document.querySelectorAll('.meter')) {
    const v = state[el.dataset.key];
    el.querySelector('i').style.width = `${Math.max(0, Math.min(100, v))}%`;
    el.classList.toggle('low', v < CONFIG.meters.low);
  }
}


// ---------- experience ----------

// Level badge, gold bar (XP into this level) and the next accessory to unlock.
export function updateXp(state) {
  const { levels, unlocks } = CONFIG.xp;
  const max = state.level > levels.length;
  const before = levels.slice(0, state.level - 1).reduce((a, b) => a + b, 0);
  const need = levels[state.level - 1];
  $('#xp-level').textContent = `Lv ${state.level}`;
  $('#xp .bar i').style.width = max ? '100%' : `${((state.xp - before) / need) * 100}%`;
  const next = $('#xp-next');
  next.classList.toggle('max', max);
  if (!max) drawAccIcon(next.querySelector('canvas'), unlocks[state.level]);
}

export function flashLevelUp() {
  const el = $('#xp');
  el.classList.remove('flash');
  void el.offsetWidth; // restart the animation
  el.classList.add('flash');
  document.querySelector('#actions [data-action="wardrobe"]').classList.add('new');
}

// "+10" rising from a point in game coordinates.
export function floatText(game, gx, gy, text) {
  const wrap = $('#stage-wrap');
  const r = game.canvas.getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  const s = r.width / game.scale.width;
  const el = document.createElement('span');
  el.className = 'float-xp';
  el.textContent = text;
  el.style.left = `${r.left - w.left + gx * s}px`;
  el.style.top = `${r.top - w.top + gy * s}px`;
  wrap.append(el);
  el.addEventListener('animationend', () => el.remove());
}

export function onAction(handler) {
  for (const b of document.querySelectorAll('#actions button')) {
    b.addEventListener('click', () => handler(b.dataset.action));
  }
}

export function setActionsEnabled(on) {
  for (const b of document.querySelectorAll('#actions button')) b.disabled = !on;
}

// ---------- speech bubble ----------

let bubbleTimer = null;

export function say(text, ms = 2600) {
  const el = $('#bubble');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(bubbleTimer);
  if (ms) bubbleTimer = setTimeout(() => (el.hidden = true), ms);
}

export function hideBubble() {
  clearTimeout(bubbleTimer);
  $('#bubble').hidden = true;
}

// Position the bubble over a point in game coordinates.
export function placeBubble(game, gx, gy) {
  const canvas = game.canvas;
  const wrap = $('#stage-wrap').getBoundingClientRect();
  const r = canvas.getBoundingClientRect();
  const s = r.width / game.scale.width;
  const el = $('#bubble');
  // Keep the whole bubble inside the stage (the cat can stand near the walls);
  // the tail moves instead so it still points at the cat.
  const x = r.left - wrap.left + gx * s;
  const half = el.offsetWidth / 2;
  const lo = r.left - wrap.left + half + 4, hi = r.right - wrap.left - half - 4;
  const cx = lo > hi ? (lo + hi) / 2 : Math.min(Math.max(x, lo), hi);
  el.style.left = `${cx}px`;
  el.style.top = `${r.top - wrap.top + gy * s - 6}px`;
  el.style.setProperty('--tail', `${Math.min(Math.max(x - cx + half, 14), half * 2 - 14)}px`);
}

// ---------- wardrobe ----------

export function buildWardrobe(getEquipped, onToggle, onLocked) {
  const grid = $('#wardrobe-grid');
  grid.innerHTML = '';
  for (const a of ACCESSORIES) {
    const b = document.createElement('button');
    b.dataset.id = a.id;
    b.hidden = !!a.secret; // secret costumes appear once unlocked
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    drawPreview(c, [a.id]);
    const label = document.createElement('span');
    label.textContent = a.label;
    b.append(c, label);
    const lock = document.createElement('em');
    b.append(lock);
    b.addEventListener('click', () => {
      if (b.classList.contains('locked')) return onLocked(a);
      onToggle(a);
      refreshWardrobe(getEquipped());
    });
    grid.append(b);
  }
  $('#wardrobe [data-close]').addEventListener('click', () => toggleWardrobe(false));
  refreshWardrobe(getEquipped());
}

export function refreshWardrobe(equipped) {
  const on = new Set(Object.values(equipped));
  for (const b of document.querySelectorAll('#wardrobe-grid button')) b.classList.toggle('on', on.has(b.dataset.id));
}

// Ladder accessories not reached yet: dark silhouette + "Lv N".
export function setLocks(unlocked) {
  const ladder = CONFIG.xp.unlocks;
  for (const b of document.querySelectorAll('#wardrobe-grid button')) {
    const lv = ladder.indexOf(b.dataset.id) + 1;
    const locked = lv > 0 && !unlocked.includes(b.dataset.id);
    b.style.order = lv > 0 ? lv : 100; // ladder order, secret costumes last
    if (b.classList.contains('locked') !== locked || !b.dataset.drawn) {
      // locked: the accessory's own silhouette (a teaser), unlocked: worn by the cat
      const c = b.querySelector('canvas');
      if (locked) drawAccIcon(c, b.dataset.id);
      else drawPreview(c, [b.dataset.id]);
      b.dataset.drawn = '1';
    }
    b.classList.toggle('locked', locked);
    b.querySelector('em').textContent = locked ? `Lv ${lv}` : '';
  }
}

export function unlockAccessory(id) {
  const b = document.querySelector(`#wardrobe-grid button[data-id="${id}"]`);
  if (b) b.hidden = false;
}

export function toggleWardrobe(force) {
  const el = $('#wardrobe');
  el.hidden = force === undefined ? !el.hidden : !force;
  if (!el.hidden) document.querySelector('#actions [data-action="wardrobe"]').classList.remove('new');
  $('#app').classList.toggle('dressing', !el.hidden);
  window.dispatchEvent(new Event('resize')); // let Phaser re-fit the smaller stage
  sfx.tap();
}

// ---------- title ----------

export function showTitle() {
  return new Promise((resolve) => {
    const el = $('#title');
    $('#title-name').textContent = CONFIG.titleText;
    drawPreview($('#title-cat'));
    el.hidden = false;
    el.addEventListener('pointerup', () => { el.hidden = true; resolve(); }, { once: true });
  });
}

// ---------- naming ----------

// Ask for the cat's name once. Empty keeps the suggested name.
export function askCatName() {
  return new Promise((resolve) => {
    const el = $('#naming');
    const form = $('#naming-form');
    const input = $('#naming-input');
    $('#naming-title').textContent = CONFIG.naming.title;
    $('#naming-body').textContent = CONFIG.naming.body;
    $('#naming-ok').textContent = CONFIG.naming.button;
    input.value = '';
    input.placeholder = CONFIG.catName;
    el.hidden = false;
    input.focus();
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = input.value.replace(/\s+/g, ' ').trim().slice(0, 16) || CONFIG.catName;
      el.hidden = true;
      form.onsubmit = null;
      sfx.tap();
      resolve(name);
    };
  });
}

// ---------- letter ----------

// reread: after "Yes", show the whole letter at once with just a Close button.
export function showLetter({ reread = false } = {}) {
  return new Promise((resolve) => {
    const el = $('#letter');
    const text = $('#letter-text');
    const buttons = $('#letter-buttons');
    const yes = $('#btn-yes');
    const think = $('#btn-think');
    yes.textContent = reread ? CONFIG.closeLabel : CONFIG.yesLabel;
    think.textContent = CONFIG.thinkLabel;
    think.hidden = reread;
    text.innerHTML = '';
    buttons.hidden = false;
    buttons.classList.add('waiting'); // keeps its space, invisible until the typing ends
    el.hidden = false;
    sfx.paper();

    // One block per paragraph. Each block holds the typed part plus the rest of
    // its text invisible, so the whole letter is laid out from the start: the
    // box doesn't grow and words don't jump to the next line while typing.
    const parts = [
      ...CONFIG.letter.map((t) => ({ t, cls: 'para' })),
      CONFIG.signoff && { t: CONFIG.signoff, cls: 'signoff' },
      { t: CONFIG.question, cls: 'question' },
    ].filter(Boolean).map(({ t, cls }) => {
      const block = document.createElement('p');
      block.className = cls;
      const typed = document.createElement('span');
      const ghost = document.createElement('span');
      ghost.className = 'ghost';
      ghost.textContent = t;
      block.append(typed, ghost);
      text.append(block);
      return { t, block, typed, ghost };
    });
    const paper = el.querySelector('.paper');
    paper.scrollTop = 0;

    let part = 0, i = 0, timer = null;
    const finish = () => {
      clearInterval(timer);
      for (const p of parts) { p.typed.textContent = p.t; p.ghost.textContent = ''; }
      buttons.classList.remove('waiting');
      if (!reread) buttons.scrollIntoView({ block: 'nearest' });
      el.removeEventListener('pointerup', finish);
    };
    timer = setInterval(() => {
      const p = parts[part];
      i++;
      p.typed.textContent = p.t.slice(0, i);
      p.ghost.textContent = p.t.slice(i);
      if (i === 1) p.block.scrollIntoView({ block: 'nearest' }); // small phones: follow the typing
      if (i % 2) sfx.type();
      if (i >= p.t.length) {
        part++;
        i = 0;
        if (part >= parts.length) finish();
      }
    }, 38);
    el.addEventListener('pointerup', finish); // tap to skip the typing
    if (reread) finish();

    const choose = (answer) => {
      el.hidden = true;
      yes.onclick = think.onclick = null;
      resolve(answer);
    };
    yes.onclick = (e) => { e.stopPropagation(); choose('yes'); };
    think.onclick = (e) => { e.stopPropagation(); choose('think'); };
  });
}

// ---------- generic card ----------

export function showCard({ title, body, button, src }) {
  return new Promise((resolve) => {
    $('#card-title').textContent = title;
    $('#card-body').textContent = body;
    const img = $('#card-photo');
    if (src) {
      img.hidden = false;
      img.onerror = () => {
        img.hidden = true;
        $('#card-body').textContent = `${body}\n\n(Put a photo at public/${src})`;
      };
      img.src = src;
    } else img.hidden = true;
    const btn = $('#card-close');
    btn.textContent = button;
    $('#card').hidden = false;
    btn.onclick = () => {
      $('#card').hidden = true;
      sfx.tap();
      resolve();
    };
  });
}
