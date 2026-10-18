// DOM overlays: HUD meters, speech bubble, wardrobe, letter, cards, title.
// Text lives in the DOM (not the 192px canvas) so it stays crisp on phones.

import { ACCESSORIES, drawPreview } from '../art/placeholder.js';
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
  el.style.left = `${r.left - wrap.left + gx * s}px`;
  el.style.top = `${r.top - wrap.top + gy * s - 6}px`;
}

// ---------- wardrobe ----------

export function buildWardrobe(getEquipped, onToggle) {
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
    b.addEventListener('click', () => {
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

export function unlockAccessory(id) {
  const b = document.querySelector(`#wardrobe-grid button[data-id="${id}"]`);
  if (b) b.hidden = false;
}

export function toggleWardrobe(force) {
  const el = $('#wardrobe');
  el.hidden = force === undefined ? !el.hidden : !force;
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
    buttons.hidden = true;
    el.hidden = false;
    sfx.paper();

    const body = CONFIG.letter.join('\n\n') + '\n\n';
    const q = document.createElement('span');
    q.className = 'question';
    const bodyNode = document.createTextNode('');
    text.append(bodyNode, q);

    let i = 0;
    const total = body.length + CONFIG.question.length;
    let timer = null;
    const finish = () => {
      clearInterval(timer);
      bodyNode.data = body;
      q.textContent = CONFIG.question;
      buttons.hidden = false;
      el.removeEventListener('pointerup', finish);
    };
    timer = setInterval(() => {
      i++;
      if (i <= body.length) bodyNode.data = body.slice(0, i);
      else q.textContent = CONFIG.question.slice(0, i - body.length);
      if (i % 2) sfx.type();
      if (i >= total) finish();
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
