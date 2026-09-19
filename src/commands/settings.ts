import { register } from '../core/registry';
import { getRuntime, setRuntime } from '../core/config';
import { info, box } from '../core/formatter';
import { setChatbot } from '../services/chatbot';

register({
  name: 'settings',
  aliases: ['status', 'auto'],
  category: 'botinfo',
  description: 'Show runtime settings',
  handler: async (ctx) => {
    const r = getRuntime() as any;
    const rows: Array<[string, string]> = [
      ['PREFIX', r.prefix],
      ['MODE', r.mode.toUpperCase()],
      ['CHATBOT', r.chatbot ? 'ON' : 'OFF'],
      ['AUTOVIEWSTATUS', r.autoviewstatus ? 'ON' : 'OFF'],
      ['AUTOREACTSTATUS', r.autoreactstatus ? 'ON' : 'OFF'],
    ];
    await ctx.reply(box('SETTINGS', rows));
  },
});

register({
  name: 'chatbot',
  category: 'chat',
  description: 'Toggle chatbot (on/off)',
  handler: async (ctx) => {
    const mode = (ctx.args[0] || '').toLowerCase();
    const current = getRuntime().chatbot;
    const next = mode === 'on' ? true : mode === 'off' ? false : !current;
    setChatbot(next);
    await ctx.reply(info('CHATBOT', `Chatbot is now *${next ? 'ON' : 'OFF'}*.`));
  },
});

for (const [name, key] of [
  ['autoreply', 'autoreplystatus'],
  ['autoreact', 'autoreactstatus'],
  ['presence', 'autotyping'],
  ['autobio', 'autobio'],
] as const) {
  register({
    name,
    category: 'botinfo',
    description: `Toggle ${name}`,
    handler: async (ctx) => {
      const mode = (ctx.args[0] || '').toLowerCase();
      const r = getRuntime() as any;
      const current = !!r[key];
      const next = mode === 'on' ? true : mode === 'off' ? false : !current;
      setRuntime({ [key]: next } as any);
      await ctx.reply(info(name.toUpperCase(), `Now *${next ? 'ON' : 'OFF'}*.`));
    },
  });
}