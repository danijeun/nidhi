import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { ACCESSORIES, FRAMES, jointTip, matchaFrame } from '../art/placeholder.js';
import { Cat } from '../objects/Cat.js';
import { sfx } from '../sfx.js';
import { DEBUG, params } from '../state.js';
import * as ui from '../ui/ui.js';

// Nidhi's room in game pixels (canvas is 192x256, portrait). See ROOM_PLAN.md.
const FLOOR = { x1: 10, x2: 182, y1: 96, y2: 248 };
// Where the cat's feet can't go on the floor (furniture footprints, already
// widened by the cat's half width). Floor taps inside get pushed out to `x`.
const BLOCKED = [
  { x1: 0, x2: 58, y1: 0, y2: 146, x: 58 }, // bed
  { x1: 0, x2: 40, y1: 146, y2: 200, x: 40 }, // drawer
  { x1: 140, x2: 192, y1: 0, y2: 156, x: 140 }, // desk
  { x1: 148, x2: 192, y1: 156, y2: 208, x: 148 }, // water dispenser (behind the fridge)
  { x1: 144, x2: 192, y1: 208, y2: 256, x: 144 }, // fridge
];
const NOTE = { x: 160, y: 120 };

// Match a typed name against CONFIG.nameEggs, ignoring case, accents, dots and extra spaces.
const norm = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
const findEgg = (name) => CONFIG.nameEggs.find((e) => e.names.some((n) => norm(n) === norm(name)));
// The matcha sits on the fridge top, left of the microwave (bottom-left corner here).
// The cat stands on the microwave at SPOTS.microwaveTop and leans down ('drink'
// pose): its mouth is 26 px right of the glass's left edge and 6 px above its feet,
// which puts it exactly on the straw tip (glass top, column 11).
const GLASS = { x: 153, y: 222 };
const SPOTS = {
  start: [96, 190],
  fridgeFront: [136, 238],
  microwaveTop: [GLASS.x + 26, GLASS.y - 11],
  bedFoot: [60, 142],
  bed: [28, 118], // lying on the blanket
  deskFront: [134, 132],
  deskTop: [166, 124],
  window: [96, 98],
  drawer: [44, 180],
  plant: [46, 172], // right of the drawer so the cat never covers the plant (taps must reach it)
  dispenser: [142, 192],
};
// Depths: furniture is sorted by its bottom edge, a perched cat sits just above its perch.
const DEPTH = { bed: 136, drawer: 190, desk: 150, dispenser: 204, fridge: 250 };

export class Room extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    this.state = this.registry.get('state');
    this.cmd = 0;
    this.busy = true; // input locked until the title screen is dismissed
    this.ready = false;
    this.perch = null; // { down: [x, y], depth } while the cat is up on furniture
    this.landing = null; // promise of a jump that is in progress
    this.lastPet = 0;
    this.lastNag = 0;
    this.tick = 0;

    this.add.image(0, 0, 'room').setOrigin(0).setDepth(-1000);
    this.photo = this.add.image(134, 24, 'photo').setOrigin(0).setDepth(-999).setInteractive();
    this.windowZone = this.add.zone(96, 35, 40, 34).setInteractive();
    this.friends = this.add.image(0, 2, 'friends').setOrigin(0).setDepth(-999).setInteractive();
    this.bed = this.add.image(4, 136, 'bed').setOrigin(0, 1).setDepth(DEPTH.bed).setInteractive();
    this.drawer = this.add.image(2, 190, 'drawer').setOrigin(0, 1).setDepth(DEPTH.drawer).setInteractive();
    this.plant = this.add.image(15, 160, 'plant').setOrigin(0.5, 1).setDepth(DEPTH.drawer + 1).setInteractive();
    this.desk = this.add.image(148, 150, 'desk').setOrigin(0, 1).setDepth(DEPTH.desk).setInteractive();
    this.monitor = this.add.image(171, 108, 'monitor', 0).setOrigin(0, 1).setDepth(DEPTH.desk + 1).setInteractive();
    this.note = this.add.image(NOTE.x, NOTE.y, 'note').setOrigin(0.5, 1).setDepth(DEPTH.desk + 2).setInteractive();
    this.fridge = this.add.image(154, 250, 'fridge').setOrigin(0, 1).setDepth(DEPTH.fridge).setInteractive();
    this.microwave = this.add.image(168, 221, 'microwave').setOrigin(0, 1).setDepth(DEPTH.fridge + 1).setInteractive();
    this.glass = this.add.sprite(GLASS.x, GLASS.y, 'matcha', matchaFrame(this.state.glass)).setOrigin(0, 1).setDepth(DEPTH.fridge + 4).setInteractive();
    this.dispenser = this.add.image(162, 204, 'dispenser').setOrigin(0, 1).setDepth(DEPTH.dispenser).setInteractive();
    this.water = this.add.rectangle(171, 169, 1, 9, 0x73eff7).setOrigin(0.5, 0).setDepth(DEPTH.dispenser + 1).setVisible(false);

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

    ui.buildWardrobe(
      () => this.state.equipped,
      (a) => this.toggleAccessory(a),
      (a) => ui.say(CONFIG.xp.locked.replace('{level}', CONFIG.xp.unlocks.indexOf(a.id) + 1)),
    );
    this.lastXp = {}; // cooldowns per XP source
    if (params.get('xp') === 'max') this.gainXp(CONFIG.xp.levels.reduce((a, b) => a + b, 0), { quiet: true });
    ui.setLocks(this.state.unlocked);
    ui.updateXp(this.state);
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
    this.cat.setDepth(this.perch ? this.perch.depth : this.cat.y);
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
    this.discover(target);
    if (target === this.cat.base) return this.ready ? this.reveal() : this.pet();
    if (target === this.glass) return this.feed();
    if (target === this.bed) return this.nap();
    if (target === this.fridge) return this.feed();
    if (target === this.drawer) return this.openDrawer();
    if (target === this.dispenser) return this.getWater();
    if (target === this.microwave) return this.visit(SPOTS.fridgeFront, CONFIG.flavor.microwave);
    if (target === this.note || target === this.desk || target === this.monitor) {
      if (this.state.answer === 'yes') return this.rereadLetter();
      return this.ready ? this.reveal() : this.noteNotYet();
    }
    if (target === this.plant) return this.tapPlant();
    if (target === this.windowZone) return this.visit(SPOTS.window, CONFIG.flavor.window);
    if (target === this.photo) return this.showPhoto();
    if (target === this.friends) return this.lookAtFriends();
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

  // Jump down first if the cat is up on furniture, then walk.
  // Resolves true on arrival, false if a newer command took over.
  async go(x, y, id = this.cmd) {
    await this.ground();
    if (id !== this.cmd) return false;
    return (await this.cat.walkTo(x, y)) && id === this.cmd;
  }

  async ground() {
    while (this.landing) await this.landing;
    if (!this.perch) return;
    const down = this.perch.down;
    this.perch = null;
    this.zz.stop();
    await (this.landing = this.cat.jumpTo(...down).finally(() => (this.landing = null)));
  }

  // Walk to `from`, then jump up to `to` and stay there until the next walk.
  async climb(from, to, depth, id = this.cmd) {
    while (this.landing) await this.landing;
    if (this.perch?.to === to) return id === this.cmd; // already up there
    if (!(await this.go(...from, id))) return false;
    this.perch = { down: from, to, depth };
    await (this.landing = this.cat.jumpTo(...to).finally(() => (this.landing = null)));
    return id === this.cmd;
  }

  async walkFloor(x, y) {
    const id = this.newCmd();
    x = Phaser.Math.Clamp(x, FLOOR.x1, FLOOR.x2);
    y = Phaser.Math.Clamp(y, FLOOR.y1, FLOOR.y2);
    const b = BLOCKED.find((r) => x >= r.x1 && x < r.x2 && y >= r.y1 && y < r.y2);
    if (b) x = b.x;
    await this.go(x, y, id);
  }

  async visit([x, y], line) {
    const id = this.newCmd();
    if (!(await this.go(x, y, id))) return;
    if (line) ui.say(line);
  }

  // Her drawer is where the accessories live.
  async openDrawer() {
    const id = this.newCmd();
    if (!(await this.go(...SPOTS.drawer, id))) return;
    this.cat.face(true);
    ui.toggleWardrobe(true);
  }

  // Tri-temp dispenser: a short stream from the cold spout.
  async getWater() {
    const id = this.newCmd();
    if (!(await this.go(...SPOTS.dispenser, id))) return;
    this.cat.face(false);
    this.water.setVisible(true);
    sfx.water();
    ui.say(CONFIG.flavor.dispenser);
    this.gainXp(CONFIG.xp.gain.water, { source: 'water' });
    await this.wait(1100);
    this.water.setVisible(false);
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
    const ok = (await this.go(...SPOTS.plant, id))
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
    this.gainXp(CONFIG.xp.gain.pet, { source: 'pet' });
    const id = this.cmd;
    this.time.delayedCall(1200, () => id === this.cmd && this.cat.play('idle'));
  }

  // Pour (if needed) while the cat jumps onto the microwave, then lean down and sip the glass empty.
  async feed() {
    const id = this.newCmd();
    const climbing = this.climb(SPOTS.fridgeFront, SPOTS.microwaveTop, DEPTH.fridge + 3, id);
    if (this.state.glass < 4) await (this.pouring ??= this.pour().finally(() => (this.pouring = null)));
    if (!(await climbing) || id !== this.cmd) return;
    this.cat.face(true);
    this.cat.play('drink');
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
    this.gainXp(this.needed('hunger') * CONFIG.xp.gain.feed);
    this.bump('hunger', CONFIG.meters.feed);
    this.cat.play('idle');
    await this.wait(500);
    if (id === this.cmd) await this.ground(); // hop back down
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

  // Hop onto her bed and sleep on the blanket. The cat stays in bed until the next walk.
  async nap() {
    const id = this.newCmd();
    if (!(await this.climb(SPOTS.bedFoot, SPOTS.bed, DEPTH.bed + 1, id))) return;
    this.cat.face(false);
    this.cat.play('sleep');
    this.zz.start();
    sfx.sleep();
    ui.say(CONFIG.flavor.nap, 3200);
    await this.wait(3500);
    if (id !== this.cmd) return;
    this.zz.stop();
    this.gainXp(this.needed('energy') * CONFIG.xp.gain.nap);
    this.bump('energy', CONFIG.meters.nap);
    this.cat.play('idle');
  }

  // ---------- experience ----------

  // Caring when a need is actually low is worth more.
  needed(key) {
    return this.state[key] < CONFIG.xp.neededBelow ? CONFIG.xp.neededMultiplier : 1;
  }

  // First tap on each thing in her room gives a little XP.
  discover(target) {
    const keys = new Map([
      [this.windowZone, 'window'], [this.photo, 'photo'], [this.friends, 'friends'], [this.plant, 'plant'],
      [this.microwave, 'microwave'], [this.dispenser, 'dispenser'], [this.drawer, 'drawer'], [this.desk, 'desk'],
    ]);
    const key = keys.get(target);
    if (!key || this.state.discovered.includes(key)) return;
    this.state.discovered.push(key);
    this.gainXp(CONFIG.xp.gain.discover);
  }

  // Add XP, level up as many times as it covers, unlock the matching accessories.
  gainXp(amount, { source, quiet } = {}) {
    if (!amount) return;
    if (source) {
      const cd = CONFIG.xp.cooldownMs[source] ?? 0;
      if (this.time.now - (this.lastXp[source] ?? -Infinity) < cd) return;
      this.lastXp[source] = this.time.now;
    }
    const s = this.state;
    const { levels, unlocks } = CONFIG.xp;
    s.xp += amount;
    if (!quiet) ui.floatText(this.game, this.cat.x, this.cat.y - 30, `+${amount}`);
    const gained = [];
    while (s.level <= levels.length && s.xp >= levels.slice(0, s.level).reduce((a, b) => a + b, 0)) {
      s.level++;
      const id = unlocks[s.level - 1];
      if (id && !s.unlocked.includes(id)) { s.unlocked.push(id); gained.push(id); }
    }
    ui.updateXp(s);
    if (!gained.length) return;
    ui.setLocks(s.unlocked);
    if (quiet) return;
    const letterNow = !this.ready && s.level >= CONFIG.trigger.level && s.level - gained.length < CONFIG.trigger.level;
    this.levelUpPending = true;
    this.checkTrigger();
    this.levelUpPending = false;
    const item = ACCESSORIES.find((a) => a.id === gained.at(-1));
    ui.flashLevelUp();
    sfx.levelUp();
    this.pourFx.explode(10, this.cat.x, this.cat.y - 20);
    this.time.delayedCall(500, () => {
      if (this.busy) return;
      const line = letterNow && this.ready ? CONFIG.trigger.levelLine : CONFIG.xp.levelUp;
      ui.say(line.replace('{level}', s.level).replace('{item}', item.label), letterNow ? 4500 : 3200);
    });
  }

  async noteNotYet() {
    const id = this.newCmd();
    if (!(await this.go(...SPOTS.deskFront, id))) return;
    this.cat.face(false);
    ui.say(CONFIG.flavor.noteEarly);
  }

  // After "Yes" the note stays on the desk so she can read it again.
  async rereadLetter() {
    this.newCmd();
    this.busy = true;
    ui.setActionsEnabled(false);
    await ui.showLetter({ reread: true });
    this.busy = false;
    ui.setActionsEnabled(true);
  }

  // Her photo wall: walk to the foot of the bed, look up, say something.
  async lookAtFriends() {
    const id = this.newCmd();
    if (!(await this.go(...SPOTS.bedFoot, id))) return;
    this.cat.face(true);
    ui.say(CONFIG.flavor.friends);
    if (CONFIG.friendsCard.src) {
      await this.wait(1200);
      if (id === this.cmd) ui.showCard(CONFIG.friendsCard);
    }
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
      this.gainXp(CONFIG.xp.gain.firstTry);
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
    if (s.level < t.level && s.playSeconds >= t.catchUpSeconds) {
      // safety net: never make her wait more than catchUpSeconds for the letter
      if (this.catchingUp) return;
      this.catchingUp = true;
      ui.say(t.catchUpLine, 2500);
      this.time.delayedCall(2200, () => {
        const need = CONFIG.xp.levels.slice(0, t.level - 1).reduce((a, b) => a + b, 0) - s.xp;
        this.gainXp(Math.max(0, need)); // calls checkTrigger again once the level is reached
      });
      return;
    }
    if (!(DEBUG || s.level >= t.level || s.answer === 'think')) return;

    this.ready = true;
    this.monitor.setFrame(1); // heart on the screen
    this.sparkles.start();
    this.noteTween = this.tweens.add({ targets: this.note, y: this.note.y - 2, duration: 400, yoyo: true, repeat: -1 });
    this.bang.setVisible(true);
    sfx.sparkle();
    if (!this.levelUpPending) ui.say(CONFIG.flavor.noteReady, 4000); // a level up line already mentions it
  }

  async reveal() {
    if (this.busy) return;
    this.busy = true;
    this.newCmd();
    ui.setActionsEnabled(false);
    ui.toggleWardrobe(false);
    ui.hideBubble();
    this.bang.setVisible(false);

    await this.climb(SPOTS.deskFront, SPOTS.deskTop, DEPTH.desk + 5);
    this.noteTween?.stop();
    this.note.setY(NOTE.y);
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
    this.note.setY(NOTE.y).setVisible(true); // back on the desk either way
    if (answer !== 'yes') this.monitor.setFrame(0); // after Yes the heart stays on

    await this.ground();
    this.cat.play(answer === 'yes' ? 'happy' : 'idle');
    this.ready = false;
    this.busy = false;
    ui.setActionsEnabled(true);
    this.checkTrigger();
  }
}
