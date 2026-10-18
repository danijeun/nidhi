import Phaser from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Room } from './scenes/Room.js';
import { newState } from './state.js';
import { unlockAudio } from './sfx.js';
import { askCatName, setActionsEnabled, showTitle } from './ui/ui.js';
import { ROOM } from './art/placeholder.js';

const state = newState();
setActionsEnabled(false);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  width: ROOM.w,
  height: ROOM.h,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1c2c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Room],
});
game.registry.set('state', state);

showTitle().then(async () => {
  unlockAudio();
  state.catName = await askCatName();
  const room = game.scene.getScene('Room');
  if (room.sys.isActive()) room.begin();
  else room.events.once('create', () => room.begin());
});

window.__game = game; // handy in the console while developing
