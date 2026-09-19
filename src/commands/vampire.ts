import { register } from '../core/registry';
import { info } from '../core/formatter';

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const RANDOM: Record<string, string[]> = {
  vampirequote: [
    '“The night is our kingdom, the moon our crown.” 🩸',
    '“Immortality is a lonely throne.”',
    '“We do not fear death; we are its cousin.”',
  ],
  vampirejoke: [
    'Why did the vampire go to art school? To learn how to draw blood. 🦇',
    'Vampires love Twitter — they like to follow people.',
  ],
  vampireriddle: [
    'I live in shadow, drink the night, fear only the dawn. What am I? (A vampire) 🧛',
    'The more you take, the more you leave behind. What am I? (Footsteps)',
  ],
  vampirestatus: [
    '🩸 *ONLINE* — Shadows awaken.',
    '🌙 *RISEN* — The night belongs to us.',
    '🦇 *HUNTING* — Beware the dark.',
  ],
};

for (const [name, list] of Object.entries(RANDOM)) {
  register({
    name,
    category: 'vampire',
    description: `Vampire ${name}`,
    handler: async (ctx) => ctx.reply(info(name.toUpperCase(), pick(list))),
  });
}

register({ name: 'vampire', category: 'vampire', description: 'Vampire greeting', handler: async (ctx) => ctx.reply(info('VAMPIRE', '🩸 Welcome to VAMPIRE RISE MD.')) });
register({ name: 'blood', category: 'vampire', description: 'Blood', handler: async (ctx) => ctx.reply(info('BLOOD', '🩸 *Blood consumed.*')) });
register({ name: 'night', category: 'vampire', description: 'Night', handler: async (ctx) => ctx.reply(info('NIGHT', '🌙 The night is young.')) });
register({ name: 'moon', category: 'vampire', description: 'Moon', handler: async (ctx) => ctx.reply(info('MOON', '🌕 The moon watches over us.')) });
register({ name: 'castle', category: 'vampire', description: 'Castle', handler: async (ctx) => ctx.reply(info('CASTLE', '🏰 The castle stands eternal.')) });
register({ name: 'dark', category: 'vampire', description: 'Dark', handler: async (ctx) => ctx.reply(info('DARK', '🖤 Darkness is home.')) });
register({ name: 'rise', category: 'vampire', description: 'Rise', handler: async (ctx) => ctx.reply(info('RISE', '🧛 *VAMPIRE RISE.*')) });
register({ name: 'awaken', category: 'vampire', description: 'Awaken', handler: async (ctx) => ctx.reply(info('AWAKEN', '🦇 The vampire awakens.')) });
register({ name: 'bat', category: 'vampire', description: 'Bat', handler: async (ctx) => ctx.reply(info('BAT', '🦇 Flap flap.')) });
register({ name: 'bite', category: 'vampire', description: 'Bite', handler: async (ctx) => ctx.reply(info('BITE', '🩸 *Bitten.*')) });
register({ name: 'hunt', category: 'vampire', description: 'Hunt', handler: async (ctx) => ctx.reply(info('HUNT', '🎯 The hunt begins.')) });
register({ name: 'immortal', category: 'vampire', description: 'Immortal', handler: async (ctx) => ctx.reply(info('IMMORTAL', '♾️ Forever.')) });
register({ name: 'shadow', category: 'vampire', description: 'Shadow', handler: async (ctx) => ctx.reply(info('SHADOW', '🕶️ In every shadow.')) });
register({ name: 'curse', category: 'vampire', description: 'Curse', handler: async (ctx) => ctx.reply(info('CURSE', '☠️ Cursed.')) });
register({ name: 'undead', category: 'vampire', description: 'Undead', handler: async (ctx) => ctx.reply(info('UNDEAD', '🧟 Not alive. Not dead.')) });
register({ name: 'crypt', category: 'vampire', description: 'Crypt', handler: async (ctx) => ctx.reply(info('CRYPT', '⚰️ Welcome to the crypt.')) });
register({ name: 'vampirequiz', category: 'vampire', description: 'Vampire quiz', handler: async (ctx) => ctx.reply(info('VAMPIRE QUIZ', 'What feeds a vampire? (Blood) 🩸')) });
register({ name: 'vampirerandom', category: 'vampire', description: 'Random vampire thought', handler: async (ctx) => ctx.reply(info('VAMPIRE', pick(RANDOM.vampirequote))) });