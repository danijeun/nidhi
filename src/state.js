import { CONFIG } from './config.js';

// No saving on purpose: every refresh starts the story over from the title screen.
// State lives in memory for one visit only.

export const params = new URLSearchParams(location.search);
export const DEBUG = params.has('debug');

export function newState() {
  // Clear the save older versions of the game left in this browser.
  try { localStorage.removeItem('kitty-save-v1'); } catch {}
  return {
    ...CONFIG.meters.start,
    catName: null, // she picks it on the naming screen
    equipped: { head: null, face: null, neck: null, mouth: null },
    plantTaps: 0,
    triedOn: [],
    glass: 4, // strawberry matcha left, in quarters (4 = full)
    interactions: 0,
    playSeconds: 0,
    answer: null, // 'yes' | 'think' | null
    xp: 0, // total XP this visit
    level: 1,
    unlocked: [CONFIG.xp.unlocks[0]], // accessory ids from the XP ladder
    discovered: [], // things in her room tapped at least once (first visit gives XP)
  };
}
