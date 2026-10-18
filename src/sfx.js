// Tiny WebAudio blips so the skeleton has feedback without audio files.
// Replace with real SFX / a chiptune loop later (jsfxr, BeepBox).

let ctx = null;

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}

function tone(freq, start, dur, type = 'square', vol = 0.06) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const seq = (notes, step = 0.08, type) => notes.forEach((f, i) => tone(f, i * step, step * 1.6, type));

export const sfx = {
  tap: () => tone(660, 0, 0.05),
  pet: () => seq([880, 1175], 0.07, 'triangle'),
  pour: () => seq([784, 698, 587, 523, 440], 0.05, 'triangle'),
  slurp: () => seq([294, 349, 330, 392, 370, 440, 415, 523], 0.09, 'triangle'),
  equip: () => seq([523, 784], 0.06),
  sleep: () => seq([392, 330, 262], 0.18, 'triangle'),
  sparkle: () => seq([1047, 1319, 1568, 2093], 0.07, 'triangle'),
  paper: () => tone(200, 0, 0.12, 'sawtooth', 0.03),
  type: () => tone(1400 + Math.random() * 300, 0, 0.02, 'square', 0.02),
  yes: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 'triangle'),
};
