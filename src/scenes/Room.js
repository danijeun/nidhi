import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { ACCESSORIES, FRAMES, jointTip, matchaFrame } from '../art/placeholder.js';
import { Cat } from '../objects/Cat.js';
import { sfx } from '../sfx.js';
import { DEBUG } from '../state.js';
import * as ui from '../ui/ui.js';

// Room layout in game pixels (canvas is 192x256, portrait).
const FLOOR = { x1: 12, x2: 180, y1: 100, y2: 248 };
const NOTE_Y = 137;

// Match a typed name against CONFIG.nameEggs, ignoring case, accents, dots and extra spaces.
const norm = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
const findEgg = (name) => CONFIG.nameEggs.find((e) => e.names.some((n) => norm(n) === norm(name)));
const GLASS = { x: 102, y: 112 }; // bottom-left corner; the straw tip meets the cat's mouth at SPOTS.eat
const SPOTS = {
  start: [90, 180],
  eat: [127, 111],
  nap: [40, 228],
  tableFront: [124, 166],
  tableTop: [146, 137],
  window: [44, 106],
  plant: [152, 116], // left of the plant so the cat never covers it (taps must reach the plant)
};

export class Room extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    this.state = this.registry.get('state');
    this.cmd = 0;
    this.busy = true; // input locked until the title screen is dismissed
    this.ready = false;
    this.onTable = false;
    this.lastPet = 0;
    this.lastNag = 0;
    this.tick = 0;

    this.add.image(0, 0, 'room').setOrigin(0).setDepth(-1000);
    this.photo = this.add.image(120, 26, 'photo').setOrigin(0).setDepth(-999).setInteractive();
    this.windowZone = this.add.zone(42, 39, 40, 34).setInteractive();
    this.bed = this.add.image(40, 238, 'bed').setOrigin(0.5, 1).setDepth(210).setInteractive();
    this.glass = this.add.sprite(GLASS.x, GLASS.y, 'matcha', matchaFrame(this.state.glass)).setOrigin(0, 1).setDepth(GLASS.y).setInteractive();
    this.plant = this.add.image(178, 112, 'plant').setOrigin(0.5, 1).setDepth(112).setInteractive();
    this.table = this.add.image(150, 160, 'table').setOrigin(0.5, 1).setDepth(160).setInteractive();
    this.note = this.add.image(158, NOTE_Y, 'note').setOrigin(0.5, 1).setDepth(161).setInteractive();

    this.cat = new Cat(this, ...SPOTS.start);
    this.cat.base.setInteractive();
    for (const [slot, id] of Object.entries(this.state.equipped)) if (id) this.cat.equip(slot, id);

    this.bang = this.add.image(0, 0, 'bang').setDepth(1000).setVisible(false);

    this.hearts = this.add.particles(0, 0, 'heart', {
      speedY: { min: -40, max: -20 }, speedX: { min: -14, max: 14 },
      lifespan: 900, alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(1001);
    this.pourFx = this.add.particles(GLASS.x + 6, GLASS.y - 10, 'sparkle', {
      x: { min: -6, max: 6 }, y: { min: -4, max: 4 }, lifespan: 500,
      scale: { start: 1, end: 0 }, emitting: false,
    }).setDepth(1001);
    this.sparkles = this.add.particles(this.note.x, this.note.y - 3, 'sparkle', {
      x: { min: -6, max: 6 }, y: { min: -6, max: 4 }, lifespan: 600,
      scale: { start: 1, end: 0 }, frequency: 220, emitting: false,
    }).setDepth(1001);
    this.smoke = this.add.particles(0, 0, 'smoke', {
      speedY: { min: -12, max: -7 }, speedX: { min: 1, max: 4 },
      lifespan: 1500, alpha: { start: 0.9, end: 0 }, scale: { start: 0.6, end: 1.4 },
      frequency: 500, emitting: false,
    }).setDepth(1001);
    this.zz = this.add.particles(0, 0, 'zz', {
      speedY: { min: -12, max: -8 }, speedX: { min: 2, max: 6 },
      lifespan: 1600, alpha: { start: 1, end: 0 }, frequency: 700, emitting: false,
    }).setDepth(1001);
    this.confetti = this.add.particles(96, -4, 'confetti', {
      frame: [0, 1, 2, 3, 4], x: { min: -96, max: 96 },
      speedY: { min: 25, max: 55 }, speedX: { min: -12, max: 12 },
      rotate: { min: 0, max: 360 }, lifespan: 4500, frequency: 30, emitting: false,
    }).setDepth(1002);

    this.input.on('pointerdown', (p, over) => this.onTap(p, over));

    ui.buildWardrobe(() => this.state.equipped, (a) => this.toggleAccessory(a));
    ui.onAction((a) => this.onAction(a));
    ui.updateMeters(this.state);

    if (DEBUG) Object.assign(this.state, { happy: 100, interactions: 99 });
  }

  // Called by main.js once the title and naming screens are done.
  begin() {
    this.busy = false;
    ui.setActionsEnabled(true);
    const egg = findEgg(this.state.catName);
    if (egg) this.nameEgg(egg);
    else ui.say(this.fill(CONFIG.flavor.hello), 5000);
    this.checkTrigger();
  }

  fill(text) {
    return text.replaceAll('{cat}', this.state.catName || CONFIG.catName);
  }

  // A name easter egg: the cat's special line + effect, then the normal hello.
  nameEgg(egg) {
    if (egg.rename) this.state.catName = egg.rename;
    this.wearAll(egg.wear);
    if (egg.drop) this.dropOn(egg.wear);
    const x = this.cat.x, y = this.cat.y - 24;
    if (egg.effect === 'hearts') this.hearts.explode(8, x, y);
    if (egg.effect === 'sparkle') this.pourFx.explode(10, x, y);
    if (egg.effect === 'confetti') {
      this.confetti.start();
      this.time.delayedCall(2500, () => this.confetti.stop());
    }
    sfx.sparkle();
    const pose = egg.pose ?? 'happy';
    this.cat.play(pose);
    const wait = egg.drop ? 2100 : 0; // let a drop land first, the bubble would hide it
    this.time.delayedCall(wait, () => ui.say(this.fill(egg.say), 5000));
    this.time.delayedCall(wait + 5300, () => {
      if (this.cat.tag === pose) this.cat.play('idle');
      if (!this.busy) ui.say(this.fill(CONFIG.flavor.hello), 5000);
    });
  }

  // ---------- loop ----------

  update(time, dt) {
    if (!this.onTable) this.cat.setDepth(this.cat.y);
    this.bang.setPosition(this.cat.x, this.cat.y - 36 + Math.round(Math.sin(time / 150)));
    ui.placeBubble(this.game, this.cat.x, this.cat.y - 30);
    this.zz.setPosition(this.cat.x + (this.cat.facingLeft ? -6 : 6), this.cat.y - 14);
    this.updateSmoke();

    if (this.busy) return;
    this.tick += dt;
    if (this.tick < 1000) return;
    this.tick -= 1000;

    const s = this.state;
    const d = CONFIG.meters.decay;
    s.hunger = Math.max(0, s.hunger - d.hunger);
    s.happy = Math.max(0, s.happy - d.happy);
    if (this.cat.tag !== 'sleep') s.energy = Math.max(0, s.energy - d.energy);
    s.playSeconds++;
    ui.updateMeters(s);
    this.nag();
    this.checkTrigger();
  }

  nag() {
    const s = this.state;
    if (this.time.now - this.lastNag < 20000) return;
    const low = CONFIG.meters.low;
    if (s.hunger < low) ui.say(CONFIG.flavor.hungry);
    else if (s.energy < low) ui.say(CONFIG.flavor.sleepy);
    else return;
    this.lastNag = this.time.now;
  }

  // ---------- input ----------

  onTap(p, over) {
    if (this.busy) return;
    const target = over[0];
    if (!target) return this.walkFloor(p.worldX, p.worldY);
    sfx.tap();
    if (target === this.cat.base) return this.ready ? this.reveal() : this.pet();
    if (target === this.glass) return this.feed();
    if (target === this.bed) return this.nap();
    if (target === this.note || target === this.table) {
      if (this.state.answer === 'yes') return this.rereadLetter();
      return this.ready ? this.reveal() : this.noteNotYet();
    }
    if (target === this.plant) return this.tapPlant();
    if (target === this.windowZone) return this.visit(SPOTS.window, CONFIG.flavor.window);
    if (target === this.photo) return this.showPhoto();
  }

  onAction(action) {
    if (this.busy) return;
    if (action === 'feed') this.feed();
    else if (action === 'nap') this.nap();
    else if (action === 'wardrobe') ui.toggleWardrobe();
  }

  // ---------- commands ----------
  // Each command bumps this.cmd; awaited steps bail out if a newer command started.

  newCmd() {
    this.cat.stopMoving();
    this.zz.stop();
    return ++this.cmd;
  }

  wait(ms) {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  async walkFloor(x, y) {
    this.newCmd();
    await this.cat.walkTo(
      Phaser.Math.Clamp(x, FLOOR.x1, FLOOR.x2),
      Phaser.Math.Clamp(y, FLOOR.y1, FLOOR.y2),
    );
  }

  async visit([x, y], line) {
    const id = this.newCmd();
    if (!(await this.cat.walkTo(x, y)) || id !== this.cmd) return;
    if (line) ui.say(line);
  }

  // Plant easter egg: from the Nth tap on, the cat decides to smoke it instead.
  // Fires once; extra taps while it plays are ignored so fast clicking can't cancel it.
  async tapPlant() {
    const egg = CONFIG.plantEgg;
    if (this.plantEggRunning) return;
    const n = ++this.state.plantTaps;
    if (this.plantEggDone || n < egg.taps) return this.visit(SPOTS.plant, CONFIG.flavor.plant);

    this.plantEggRunning = true;
    const id = this.newCmd();
    const ok = (await this.cat.walkTo(...SPOTS.plant)) && id === this.cmd
      && (ui.say(egg.say, 3200), await this.wait(3000), id === this.cmd);
    this.plantEggRunning = false;
    if (!ok) return; // interrupted by another action: the next plant tap tries again

    this.plantEggDone = true;
    this.smoke.explode(14, this.cat.x, this.cat.y - 16); // poof
    sfx.sparkle();
    this.wearAll(egg.wear);
    this.cat.play('happy');
    ui.say(egg.then, 3000);
    this.time.delayedCall(1500, () => id === this.cmd && this.cat.play('idle'));
  }

  // Unlock secret accessories in the wardrobe and put them on.
  wearAll(ids) {
    for (const id of [ids ?? []].flat()) {
      const a = ACCESSORIES.find((x) => x.id === id);
      if (!a) continue;
      ui.unlockAccessory(id);
      if (this.state.equipped[a.slot] !== a.id) this.toggleAccessory(a);
    }
    ui.refreshWardrobe(this.state.equipped);
  }

  // "Deal with it": slide worn accessories down onto the cat from above.
  dropOn(ids) {
    for (const id of [ids ?? []].flat()) {
      const sprite = Object.values(this.cat.slots).find((s) => s?.accId === id);
      if (!sprite) continue;
      sprite.y = -48;
      this.tweens.add({ targets: sprite, y: 0, delay: 500, duration: 1500, ease: 'Linear' });
    }
  }

  // Smoke drifts from the joint's tip while it is worn.
  updateSmoke() {
    const on = this.state.equipped.mouth === 'joint' && this.cat.visible;
    if (!on) return this.smoke.emitting && this.smoke.stop();
    const f = FRAMES[this.cat.base.frame.name] ?? FRAMES[0];
    const tip = jointTip(f);
    const fx = this.cat.facingLeft ? 31 - tip.x : tip.x;
    this.smoke.setPosition(this.cat.x - 16 + fx + 0.5, this.cat.y - 32 + tip.y);
    if (!this.smoke.emitting) this.smoke.start();
  }

  pet() {
    this.newCmd();
    this.cat.play('happy');
    this.hearts.explode(3, this.cat.x, this.cat.y - 24);
    sfx.pet();
    if (this.time.now - this.lastPet > 600) {
      this.bump('happy', CONFIG.meters.pet);
      this.lastPet = this.time.now;
    }
    const id = this.cmd;
    this.time.delayedCall(1200, () => id === this.cmd && this.cat.play('idle'));
  }

  // Pour (if needed) while the cat walks over, then sip the glass empty.
  async feed() {
    const id = this.newCmd();
    const walking = this.cat.walkTo(...SPOTS.eat);
    if (this.state.glass < 4) await (this.pouring ??= this.pour().finally(() => (this.pouring = null)));
    if (!(await walking) || id !== this.cmd) return;
    this.cat.face(true);
    this.cat.play('sip');
    sfx.slurp();
    if (!this.saidMatcha) {
      this.saidMatcha = true;
      ui.say(CONFIG.flavor.matcha);
    }
    for (let q = 3; q >= 0; q--) {
      await this.wait(450);
      if (id !== this.cmd) return; // interrupted: the glass keeps what is left
      this.setGlass(q);
    }
    this.hearts.explode(2, this.cat.x, this.cat.y - 24);
    this.bump('hunger', CONFIG.meters.feed);
    this.cat.play('idle');
  }

  // Refill in recipe order: strawberry, then milk, then matcha. Not cancellable.
  async pour() {
    sfx.pour();
    this.pourFx.explode(4);
    for (const frame of [5, 6]) {
      this.glass.setFrame(frame);
      await this.wait(220);
    }
    this.setGlass(4);
    this.pourFx.explode(4);
  }

  setGlass(quarters) {
    this.state.glass = quarters;
    this.glass.setFrame(matchaFrame(quarters));
  }

  async nap() {
    const id = this.newCmd();
    if (!(await this.cat.walkTo(...SPOTS.nap)) || id !== this.cmd) return;
    this.cat.play('sleep');
    this.zz.start();
    sfx.sleep();
    await this.wait(3500);
    if (id !== this.cmd) return;
    this.zz.stop();
    this.bump('energy', CONFIG.meters.nap);
    this.cat.play('idle');
  }

  async noteNotYet() {
    const id = this.newCmd();
    if (!(await this.cat.walkTo(...SPOTS.tableFront)) || id !== this.cmd) return;
    this.cat.face(false);
    ui.say(CONFIG.flavor.noteEarly);
  }

  // After "Yes" the note stays on the table so she can read it again.
  async rereadLetter() {
    this.newCmd();
    this.busy = true;
    ui.setActionsEnabled(false);
    await ui.showLetter({ reread: true });
    this.busy = false;
    ui.setActionsEnabled(true);
  }

  showPhoto() {
    this.newCmd();
    ui.showCard(CONFIG.photoCard);
  }

  toggleAccessory(a) {
    const eq = this.state.equipped;
    eq[a.slot] = eq[a.slot] === a.id ? null : a.id;
    this.cat.equip(a.slot, eq[a.slot]);
    sfx.equip();
    if (eq[a.slot] && !this.state.triedOn.includes(a.id)) {
      this.state.triedOn.push(a.id);
      this.bump('happy', CONFIG.meters.equipFirstTime);
      this.hearts.explode(2, this.cat.x, this.cat.y - 24);
    }
    this.checkTrigger();
  }

  bump(key, amount) {
    this.state[key] = Math.min(100, this.state[key] + amount);
    this.state.interactions++;
    ui.updateMeters(this.state);
    this.checkTrigger();
  }

  // ---------- the note ----------

  checkTrigger() {
    if (this.ready || this.busy || this.state.answer === 'yes') return;
    const s = this.state;
    const t = CONFIG.trigger;
    const worn = Object.values(s.equipped).filter(Boolean).length;
    const earned = s.happy >= t.happy && worn >= t.accessories && s.interactions >= t.interactions;
    if (!(DEBUG || earned || s.playSeconds >= t.fallbackSeconds || s.answer === 'think')) return;

    this.ready = true;
    this.sparkles.start();
    this.noteTween = this.tweens.add({ targets: this.note, y: this.note.y - 2, duration: 400, yoyo: true, repeat: -1 });
    this.bang.setVisible(true);
    sfx.sparkle();
    ui.say(CONFIG.flavor.noteReady, 4000);
  }

  async reveal() {
    if (this.busy) return;
    this.busy = true;
    this.newCmd();
    ui.setActionsEnabled(false);
    ui.toggleWardrobe(false);
    ui.hideBubble();
    this.bang.setVisible(false);

    await this.cat.walkTo(...SPOTS.tableFront);
    this.onTable = true;
    this.cat.setDepth(this.table.depth + 5);
    await this.cat.jumpTo(...SPOTS.tableTop);
    this.noteTween?.stop();
    this.note.setY(NOTE_Y);
    this.sparkles.stop();
    this.note.setVisible(false); // the cat is holding it
    this.cat.face(false);
    this.cat.play('read');
    sfx.paper();
    await this.wait(2000);

    const answer = await ui.showLetter();
    const s = this.state;
    s.answer = answer;
    if (answer === 'yes') {
      s.happy = 100;
      this.cat.play('happy');
      this.confetti.start();
      this.heartLoop = this.time.addEvent({ delay: 300, loop: true, callback: () => this.hearts.explode(2, this.cat.x, this.cat.y - 24) });
      sfx.yes();
      ui.updateMeters(s);
      await ui.showCard({ ...CONFIG.yesCard, body: this.fill(CONFIG.yesCard.body) });
      this.time.delayedCall(6000, () => { this.confetti.stop(); this.heartLoop?.remove(); });
    } else {
      this.cat.play('sit');
      await ui.showCard({ ...CONFIG.thinkCard, body: this.fill(CONFIG.thinkCard.body) });
    }
    this.note.setY(NOTE_Y).setVisible(true); // back on the table either way

    await this.cat.jumpTo(...SPOTS.tableFront);
    this.onTable = false;
    this.cat.play(answer === 'yes' ? 'happy' : 'idle');
    this.ready = false;
    this.busy = false;
    ui.setActionsEnabled(true);
    this.checkTrigger();
  }
}
