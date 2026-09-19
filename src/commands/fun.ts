import { register } from '../core/registry';
import { info, error as errTheme } from '../core/formatter';
import axios from 'axios';

const JOKES = [
  'Why did the vampire read the newspaper? He heard it had great circulation. 🦇',
  'I wanted to be a vampire, but it was a pain in the neck. 🧛',
  'Vampires never get colds — they are immune to coffin. 😂',
];
const QUOTES = [
  'The night is dark and full of terrors. — Game of Thrones',
  'We are all in the gutter, but some of us are looking at the stars. — Oscar Wilde',
  'Death is not the greatest loss in life. — Norman Cousins',
];

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

register({
  name: 'joke',
  category: 'fun',
  description: 'Random joke',
  handler: async (ctx) => ctx.reply(info('JOKE', pick(JOKES))),
});

register({
  name: 'quote',
  category: 'fun',
  description: 'Random quote',
  handler: async (ctx) => ctx.reply(info('QUOTE', pick(QUOTES))),
});

register({
  name: 'fact',
  category: 'fun',
  description: 'Random fact',
  handler: async (ctx) => {
    try {
      const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random', { timeout: 15000 });
      await ctx.reply(info('FACT', res.data.text));
    } catch {
      await ctx.reply(info('FACT', 'Bats are the only mammals that can truly fly. 🦇'));
    }
  },
});

register({
  name: 'advice',
  category: 'fun',
  description: 'Random advice',
  handler: async (ctx) => {
    try {
      const res = await axios.get('https://api.adviceslip.com/advice', { timeout: 15000 });
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      await ctx.reply(info('ADVICE', data?.slip?.advice || 'Stay hydrated.'));
    } catch {
      await ctx.reply(info('ADVICE', 'Stay hydrated.'));
    }
  },
});

register({
  name: 'meme',
  category: 'fun',
  description: 'Random meme',
  handler: async (ctx) => {
    try {
      const res = await axios.get('https://meme-api.com/gimme', { timeout: 15000 });
      await ctx.sock.sendMessage(ctx.jid, { image: { url: res.data.url }, caption: `😂 ${res.data.title}` }, { quoted: ctx.msg });
    } catch {
      await ctx.reply(errTheme('MEME FAILED', 'Try again later.'));
    }
  },
});

register({
  name: 'randompic',
  aliases: ['pic', 'image'],
  category: 'fun',
  description: 'Random picture',
  handler: async (ctx) => {
    const url = `https://picsum.photos/seed/${Date.now()}/900/900`;
    await ctx.sock.sendMessage(ctx.jid, { image: { url }, caption: '🩸 Random picture' }, { quoted: ctx.msg });
  },
});

register({
  name: 'roast',
  category: 'fun',
  description: 'Roast someone',
  handler: async (ctx) => {
    const who = ctx.args[0] || 'you';
    const roasts = [
      `${who} is the reason the shampoo has instructions.`,
      `${who} is not stupid; they just have bad luck when they think.`,
      `${who} is proof that evolution can go in reverse.`,
    ];
    await ctx.reply(info('ROAST', pick(roasts)));
  },
});

register({
  name: 'ship',
  aliases: ['couple'],
  category: 'fun',
  description: 'Ship two names',
  handler: async (ctx) => {
    const [a, b] = ctx.args;
    if (!a || !b) return ctx.reply(errTheme('USAGE', '.ship Alice Bob'));
    const pct = Math.floor(Math.random() * 101);
    await ctx.reply(info('SHIP', `💞 ${a} + ${b} = *${pct}%*`));
  },
});

register({
  name: 'friendship',
  category: 'fun',
  description: 'Friendship percentage',
  handler: async (ctx) => {
    const [a, b] = ctx.args;
    if (!a || !b) return ctx.reply(errTheme('USAGE', '.friendship Alice Bob'));
    const pct = Math.floor(Math.random() * 101);
    await ctx.reply(info('FRIENDSHIP', `🤝 ${a} + ${b} = *${pct}%*`));
  },
});

register({
  name: 'rate',
  category: 'fun',
  description: 'Rate something',
  handler: async (ctx) => {
    const thing = ctx.args.join(' ') || 'that';
    const pct = Math.floor(Math.random() * 11);
    await ctx.reply(info('RATING', `${thing}: *${pct}/10*`));
  },
});

register({
  name: 'rizz',
  category: 'fun',
  description: 'Random rizz line',
  handler: async (ctx) => {
    const lines = [
      'Are you a vampire? Because you just took my breath away. 🩸',
      'Do you believe in love at first bite? 🦇',
      'You must be the moon — because I rise for you.',
    ];
    await ctx.reply(info('RIZZ', pick(lines)));
  },
});

register({
  name: 'compliment',
  category: 'fun',
  description: 'Give a compliment',
  handler: async (ctx) => {
    const who = ctx.args[0] || 'you';
    const lines = [`${who}, you light up the darkest night.`, `${who}, you are the reason bats smile.`];
    await ctx.reply(info('COMPLIMENT', pick(lines)));
  },
});

register({
  name: 'truth',
  category: 'fun',
  description: 'Truth question',
  handler: async (ctx) => ctx.reply(info('TRUTH', 'What is your biggest fear?')),
});

register({
  name: 'dare',
  category: 'fun',
  description: 'Dare',
  handler: async (ctx) => ctx.reply(info('DARE', 'Send a voice note singing your favourite song.')),
});

register({
  name: 'trivia',
  category: 'fun',
  description: 'Random trivia',
  handler: async (ctx) => ctx.reply(info('TRIVIA', 'Which is the only mammal capable of true flight? 🦇')),
});

register({
  name: 'quiz',
  category: 'fun',
  description: 'Random quiz question',
  handler: async (ctx) => ctx.reply(info('QUIZ', 'How many bones in the human body? (206)')),
});

register({
  name: 'riddle',
  category: 'fun',
  description: 'Random riddle',
  handler: async (ctx) => ctx.reply(info('RIDDLE', 'I speak without a mouth and hear without ears. What am I? (Echo)')),
});

register({
  name: 'reaction',
  category: 'fun',
  description: 'React to a quoted message',
  handler: async (ctx) => {
    const emojis = ['🩸','🦇','🧛','🌙','🖤','😂','😮','🔥'];
    await ctx.react(pick(emojis));
    await ctx.reply(info('REACTION', 'Reacted. 🩸'));
  },
});

// Simple game commands (state-in-memory would grow; keep them playful one-shot)
register({
  name: 'tictactoe',
  aliases: ['ttt'],
  category: 'fun',
  description: 'Start a tic-tac-toe game',
  handler: async (ctx) => ctx.reply(info('TICTACTOE', 'Use the bot in a private chat to start a full game (feature stub).')),
});
register({
  name: 'wordle',
  category: 'fun',
  description: 'Start a wordle game',
  handler: async (ctx) => ctx.reply(info('WORDLE', 'Wordle will be available once a word list provider is configured.')),
});
register({
  name: 'guessnumber',
  category: 'fun',
  description: 'Guess a number (1..10)',
  handler: async (ctx) => {
    const guess = Number(ctx.args[0]);
    if (!guess) return ctx.reply(errTheme('USAGE', '.guessnumber <1-10>'));
    const n = Math.floor(Math.random() * 10) + 1;
    await ctx.reply(info('GUESS', `You: ${guess} — Bot: ${n} — ${guess === n ? 'You win! 🩸' : 'Try again.'}`));
  },
});