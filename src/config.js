// Everything personal or tunable lives here. Edit this file, not the game logic.

export const CONFIG = {
  titleText: 'Hello!', // big text on the title screen
  catName: 'Mochi', // suggested name in the naming box (she picks the real one)

  // Naming screen, shown once after the title on the first play.
  naming: {
    title: 'A kitten moved in!',
    body: 'What will you name your kitten?',
    button: "That's the one",
  },

  // Easter eggs: if the name she types matches (case, dots and accents ignored),
  // the cat reacts when it arrives. Add your own inside jokes here.
  //   say:    what the cat says ({cat} = the name)
  //   effect: 'hearts' | 'sparkle' | 'confetti' (optional)
  //   wear:   accessory id(s) to unlock and put on, e.g. 'scarf' or ['a', 'b'] (optional)
  //   rename: change the name to this (optional)
  //   drop:   the worn items fall onto the cat from above (optional)
  //   pose:   cat animation while it talks, default 'happy' (optional)
  // Easter egg: tap the plant this many times and the cat gets ideas.
  plantEgg: {
    taps: 10,
    say: 'Maybe I cannot eat it...\nI guess I could smoke it.',
    then: 'Fo shizzle.',
    wear: ['braids', 'snoopshades', 'goldchain', 'joint'],
  },

  nameEggs: [
    { names: ['nidhi'], say: "Nidhi? That's YOUR name, silly!\nOkay... two Nidhis it is.", effect: 'hearts' },
    { names: ['dani'], say: "Ughh, I'm a cat?\nDogs are way better.", wear: 'coolshades', drop: true, pose: 'sit' },
    // Harry unlocks a secret costume (hair + scar, round glasses, Gryffindor scarf)
    // and puts it on. It then stays in the wardrobe for this visit.
    { names: ['harry', 'harry potter'], say: 'Yer a cat, Harry!', effect: 'sparkle', wear: ['harryhair', 'roundglasses', 'gryffindor'] },
  ],

  // The letter. Each string is a paragraph; it types out one character at a time.
  // TODO: write this in your own words. Short and specific beats long and grand.
  // Short paragraphs on purpose: on a phone each one wraps to 2 to 5 lines.
  letter: [
    'Hi Nidhi,',
    'I found this note on the table and I think it’s for you.',
    'I’m not really good at writing letters, but I wanted to tell you that I like you a lot. I guess you already know that.',
    'I still wanted to ask, though, because I know how important it is to you to make things official.',
    'I’ve been working on this for a while. It’s not perfect, but I hope you like it. And I really hope you say yes :)',
  ],
  // Sign-off under the letter, right aligned. Harry Potter: Platform 9¾.
  signoff: 'luv u 9¾',
  question: 'Will you be my girlfriend?',
  yesLabel: 'Yes!',
  thinkLabel: 'Let me think',
  closeLabel: 'Close', // reading the letter again after Yes

  yesCard: {
    title: 'LETS FFF GOOOOOO!!',
    body: '{cat} is very happy.', // TODO ({cat} = the cat's name)
    button: 'Back to the room',
  },
  thinkCard: {
    title: 'Take your time',
    body: '{cat} will keep the note safe on the desk.', // TODO
    button: 'Back to the room',
  },

  // Things the cat says when tapping furniture. TODO: personalize.
  flavor: {
    window: 'I wonder if this is the best spot on campus to jump from. Would I die?',
    plant: 'I am not allowed to eat this one.',
    dispenser: 'Thanks god I have the dispenser... \nI hate tap water.', // the water dispenser
    microwave: 'Do NOT microwave the matcha.',
    friends: 'So many pictures of YOU and your friends!', // the photo wall over the bed
    photo: null, // the photo frame opens the photo card instead
    noteEarly: 'Not yet! Take care of me first.',
    noteReady: 'What is that on the desk?',
    hungry: 'I want my strawberry matcha...',
    matcha: 'Strawberry matcha!', // said on the first sip each visit
    nap: 'Ewww why is the bed sweaty?', // said when the cat lies down on her bed
    sleepy: 'I am so tired like that mf.', // reminder when the Nap meter is low
    hello: 'Hi Nidhi! I am {cat}.\nI just moved in. Will you take care of me?',
  },

  // Optional: tapping the photo wall also opens this card. Set src to a real photo
  // (e.g. 'assets/friends.jpg' in public/assets/) to turn it on.
  friendsCard: {
    title: 'The wall',
    body: 'Nidhi and the people she loves.',
    src: null,
    button: 'Close',
  },

  photoCard: {
    title: 'Nidhi and that random guy',
    body: 'Sum pic of us \n(so u can see yourself whenever you want)', // TODO
    src: 'assets/photo.jpg', // drop a real photo at public/assets/photo.jpg
    button: 'Close',
  },

  // Meters run 0..100. Decay is per second of play.
  meters: {
    start: { hunger: 55, happy: 35, energy: 60 },
    decay: { hunger: 0.6, happy: 0.35, energy: 0.3 },
    feed: 40,
    pet: 10,
    nap: 45,
    equipFirstTime: 8,
    low: 25,
  },

  // When does the note start sparkling?
  // The letter unlocks when the cat reaches this level. Normal play gets there in
  // about 2.5 to 3 minutes. Safety net: after catchUpSeconds of play the cat jumps
  // straight to that level, so the letter is always ready well before 5 minutes.
  trigger: {
    level: 5,
    catchUpSeconds: 210,
    catchUpLine: 'You took such good care of me!',
    levelLine: 'Level {level}! And... what is that on the desk?', // said when the letter unlocks
  },

  // Experience: caring for the cat earns XP, every level unlocks the next accessory.
  // Secret costumes (name / plant eggs) are not on this ladder. See XP_PLAN.md.
  xp: {
    levels: [20, 25, 30, 35, 45, 55], // XP needed to go from level 1 to 2, 2 to 3, ... (letter at level 5 = 110 XP)
    unlocks: ['bow', 'sunglasses', 'collar', 'partyhat', 'heartglasses', 'scarf', 'crown'], // level 1, 2, 3, ...
    gain: { feed: 10, nap: 10, pet: 3, water: 4, firstTry: 5, discover: 5 },
    neededBelow: 50, // feeding / napping when that meter is under this...
    neededMultiplier: 2, // ...is worth this many times more
    cooldownMs: { pet: 3000, water: 10000 },
    levelUp: 'Level {level}! I unlocked the {item}.',
    locked: 'Unlocks at level {level}.',
  },

  catSpeed: 42, // px per second in game pixels
};
