import Phaser from 'phaser';
import { registerPlaceholderArt } from '../art/placeholder.js';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  // Real art goes here later, e.g.
  //   this.load.aseprite('cat', 'assets/cat.png', 'assets/cat.json');
  preload() {}

  create() {
    registerPlaceholderArt(this);
    this.scene.start('Room');
  }
}
