import { register } from '../core/registry';
import { runFirst } from '../providers';
import { aiQueue } from '../services/queue';
import { error as errTheme, info } from '../core/formatter';
import { isValidUrl } from '../utils/helpers';
import axios from 'axios';

const AI_ALIASES = [
  'ai','chatgpt','gpt','gpt4','deepseek','gemini','perplexity','ask','explain','summarize',
  'writer','rewrite','paraphrase','correct','code','debug','solve','math','analyze','translate',
];

async function runAI(ctx: any, prompt: string, opts: any = {}) {
  if (!prompt) { await ctx.reply(errTheme('MISSING PROMPT', 'Provide a prompt.')); return; }
  await ctx.react('⏳');
  try {
    const { provider, result } = await aiQueue.add(() => runFirst('ai', prompt, opts));
    await ctx.reply(info(`AI (${provider})`, String(result).slice(0, 3500)));
    await ctx.react('🩸');
  } catch (e) {
    await ctx.reply(errTheme('AI FAILED', (e as Error).message));
    await ctx.react('❌');
  }
}

for (const name of AI_ALIASES) {
  register({
    name,
    category: 'ai',
    description: `AI command (${name})`,
    handler: async (ctx) => runAI(ctx, ctx.args.join(' ').trim()),
  });
}

register({
  name: 'imagine',
  category: 'ai',
  description: 'Generate an image from a prompt',
  handler: async (ctx) => {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.reply(errTheme('MISSING PROMPT', 'What should I imagine?'));
    await ctx.react('🎨');
    try {
      const { result } = await runFirst('image', prompt);
      await ctx.sock.sendMessage(ctx.jid, { image: result, caption: `🩸 *${prompt}*` }, { quoted: ctx.msg });
      await ctx.react('🩸');
    } catch (e) {
      await ctx.reply(errTheme('IMAGE FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'stt',
  category: 'ai',
  description: 'Speech-to-text (requires audio reply)',
  handler: async (ctx) => {
    await ctx.reply(errTheme('NOT AVAILABLE', 'Speech-to-text requires an external STT provider to be configured.'));
  },
});

register({
  name: 'tts',
  category: 'ai',
  description: 'Text-to-speech',
  handler: async (ctx) => {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.reply(errTheme('MISSING TEXT', 'Provide text to speak.'));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text.slice(0, 200))}`;
    await ctx.sock.sendMessage(ctx.jid, { audio: { url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.msg });
  },
});

register({
  name: 'translate',
  category: 'ai',
  description: 'Translate text: .translate <lang> <text>',
  handler: async (ctx) => {
    const [lang, ...rest] = ctx.args;
    const text = rest.join(' ').trim();
    if (!lang || !text) return ctx.reply(errTheme('USAGE', '.translate <lang> <text>'));
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await axios.get(url, { timeout: 20000 });
      const out = (res.data?.[0] || []).map((x: any) => x[0]).join('');
      await ctx.reply(info('TRANSLATION', out));
    } catch (e) {
      await ctx.reply(errTheme('TRANSLATE FAILED', (e as Error).message));
    }
  },
});