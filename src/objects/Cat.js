import Phaser from 'phaser';
import { ACCESSORIES } from '../art/placeholder.js';
import { CONFIG } from '../config.js';

// The cat is a container: base sprite + one sprite per equipped accessory.
// Every accessory sheet shares the cat's frame layout, so playing the same tag
// on all children keeps them aligned with zero offset math.
export class Cat extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    this.base = scene.add.sprite(0, 0, 'cat', 0).setOrigin(0.5, 1);
    this.add(this.base);
    this.slots = { head: null, face: null, neck: null, mouth: null };
    this.tag = 'idle';
    this.facingLeft = false;
    this.moveTween = null;
    this.moveResolve = null;
    this.setSize(24, 26);
    this.play('idle');
  }

  play(tag) {
    this.tag = tag;
    for (const child of this.list) {
      const prefix = child === this.base ? 'cat' : `acc-${child.accId}`;
      child.play(`${prefix}-${tag}`);
    }
    return this;
  }

  face(left) {
    this.facingLeft = left;
    for (const child of this.list) child.setFlipX(left);
  }

  equip(slot, id) {
    this.slots[slot]?.destroy();
    this.slots[slot] = null;
    if (id) {
      const s = this.scene.add.sprite(0, 0, `acc-${id}`, 0).setOrigin(0.5, 1);
      s.accId = id;
      s.setFlipX(this.facingLeft);
      this.add(s);
      this.slots[slot] = s;
    }
    this.play(this.tag); // resync every layer to frame 0 of the current tag
  }

  equippedIds() {
    return Object.values(this.slots).filter(Boolean).map((s) => s.accId);
  }

  stopMoving() {
    this.moveTween?.stop();
    this.moveTween = null;
    this.moveResolve?.(false);
    this.moveResolve = null;
  }

  // Walk in a straight line. Resolves true on arrival, false if interrupted.
  walkTo(x, y) {
    this.stopMoving();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (dist < 1) return Promise.resolve(true);
    if (Math.abs(x - this.x) > 0.5) this.face(x < this.x);
    this.play('walk');
    return new Promise((resolve) => {
      this.moveResolve = resolve;
      this.moveTween = this.scene.tweens.add({
        targets: this,
        x: Math.round(x),
        y: Math.round(y),
        duration: (dist / CONFIG.catSpeed) * 1000,
        onComplete: () => {
          this.moveTween = null;
          this.moveResolve = null;
          this.play('idle');
          resolve(true);
        },
      });
    });
  }

  // Arc jump between two points.
  jumpTo(x, y, height = 14, duration = 420) {
    this.stopMoving();
    const sx = this.x, sy = this.y;
    if (Math.abs(x - sx) > 0.5) this.face(x < sx);
    this.play('jump');
    return new Promise((resolve) => {
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        onUpdate: (tw) => {
          const t = tw.getValue();
          this.x = Math.round(Phaser.Math.Linear(sx, x, t));
          this.y = Math.round(Phaser.Math.Linear(sy, y, t) - Math.sin(Math.PI * t) * height);
        },
        onComplete: () => {
          this.play('idle');
          resolve(true);
        },
      });
    });
  }
}

export { ACCESSORIES };
