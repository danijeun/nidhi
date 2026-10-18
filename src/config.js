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
  letter: [
    'Hi Nidhi,',
    'I found this note on the table and I think it is for you.',
    'I am not really good at writing letters, but I wanted to tell you that I like you a lot. I guess you already know that, but I wanted to ask you anyway because I know how important is to you to make things official. I hope you will say yes. I have been working on this for a while, and I hope you like it. I know it is not perfect, but I hope you will like it anyway.',
    // Harry Potter: Platform 9¾ at King's Cross.
    'luv u 9¾',
  ],
  question: 'Will you be my girlfriend?',
  yesLabel: 'Yes!',
  thinkLabel: 'Let me think',
  closeLabel: 'Close', // reading the letter again after Yes

  yesCard: {
    title: 'LETS FFF GOOOOOO!!',
    body: '{cat} is very happy.\nSo am I.', // TODO ({cat} = the cat's name)
    button: 'Back to the room',
  },
  thinkCard: {
    title: 'Take your time',
    body: '{cat} will keep the note safe on the table.', // TODO
    button: 'Back to the room',
  },

  // Things the cat says when tapping furniture. TODO: personalize.
  flavor: {
    window: 'I wonder if this is the best spot on campus to jump from. Would I die?',
    plant: 'I am not allowed to eat this one.',
    photo: null, // the photo frame opens the photo card instead
    noteEarly: 'Not yet! Take care of me first.',
    noteReady: 'What is that on the table?',
    hungry: 'I want my strawberry matcha...',
    matcha: 'Strawberry matcha!', // said on the first sip each visit
    sleepy: 'I am so tired like that mf.',
    hello: 'Hi Nidhi! I am {cat}.\nI just moved in. Will you take care of me?',
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
  trigger: {
    happy: 80, // happiness at least this
    accessories: 1, // wearing at least this many
    interactions: 6, // at least this many feed/pet/nap/equip actions
    fallbackSeconds: 240, // or after this much play, no matter what
  },

  catSpeed: 42, // px per second in game pixels
};
