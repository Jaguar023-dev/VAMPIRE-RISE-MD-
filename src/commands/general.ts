// src/commands/general.ts
import axios from 'axios';
import os from 'os';
import { register } from '../core/registry';
import { box, info, success, error as errTheme } from '../core/formatter';
import { CONFIG, getRuntime } from '../core/config';
import { formatBytes, formatUptime, isValidUrl } from '../utils/helpers';

// -----------------------------------------------------------------------------
// TIME / DATE
// -----------------------------------------------------------------------------

register({
  name: 'date',
  aliases: ['today'],
  category: 'general',
  description: 'Show the current date',
  handler: async (ctx) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    });
    await ctx.reply(info('DATE', date));
  },
});

register({
  name: 'clock',
  aliases: ['now'],
  category: 'general',
  description: 'Show the current time (Nairobi)',
  handler: async (ctx) => {
    const now = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Africa/Nairobi',
    });
    await ctx.reply(info('TIME', `${now} (Africa/Nairobi)`));
  },
});

register({
  name: 'countdown',
  category: 'general',
  description: 'Days until a date (.countdown 2025-12-31)',
  handler: async (ctx) => {
    const target = ctx.args[0];
    if (!target) return ctx.reply(errTheme('USAGE', '.countdown YYYY-MM-DD'));
    const t = new Date(target);
    if (isNaN(t.getTime())) return ctx.reply(errTheme('INVALID DATE', target));
    const diff = Math.ceil((t.getTime() - Date.now()) / 86400000);
    await ctx.reply(
      info('COUNTDOWN', diff >= 0 ? `${diff} day(s) until ${target}` : `${-diff} day(s) since ${target}`)
    );
  },
});

// -----------------------------------------------------------------------------
// TEXT UTILITIES
// -----------------------------------------------------------------------------

register({
  name: 'upper',
  aliases: ['uppercase'],
  category: 'general',
  description: 'Convert text to uppercase',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.upper <text>'));
    await ctx.reply(t.toUpperCase());
  },
});

register({
  name: 'lower',
  aliases: ['lowercase'],
  category: 'general',
  description: 'Convert text to lowercase',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.lower <text>'));
    await ctx.reply(t.toLowerCase());
  },
});

register({
  name: 'reverse',
  category: 'general',
  description: 'Reverse a string',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.reverse <text>'));
    await ctx.reply(t.split('').reverse().join(''));
  },
});

register({
  name: 'length',
  aliases: ['count'],
  category: 'general',
  description: 'Count characters and words',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.length <text>'));
    const words = t.trim().split(/\s+/).filter(Boolean).length;
    await ctx.reply(
      box('TEXT STATS', [
        ['CHARS', String(t.length)],
        ['WORDS', String(words)],
        ['LINES', String(t.split('\n').length)],
      ])
    );
  },
});

register({
  name: 'b64encode',
  aliases: ['base64'],
  category: 'general',
  description: 'Base64-encode text',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.b64encode <text>'));
    await ctx.reply(info('BASE64', Buffer.from(t).toString('base64')));
  },
});

register({
  name: 'b64decode',
  aliases: ['unbase64'],
  category: 'general',
  description: 'Base64-decode text',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.b64decode <base64>'));
    try {
      await ctx.reply(info('DECODED', Buffer.from(t, 'base64').toString('utf-8')));
    } catch {
      await ctx.reply(errTheme('INVALID BASE64', 'Could not decode.'));
    }
  },
});

register({
  name: 'urlencode',
  category: 'general',
  description: 'URL-encode text',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.urlencode <text>'));
    await ctx.reply(info('URL-ENCODED', encodeURIComponent(t)));
  },
});

register({
  name: 'urldecode',
  category: 'general',
  description: 'URL-decode text',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.urldecode <text>'));
    try {
      await ctx.reply(info('URL-DECODED', decodeURIComponent(t)));
    } catch {
      await ctx.reply(errTheme('INVALID INPUT', 'Could not decode.'));
    }
  },
});

register({
  name: 'hash',
  category: 'general',
  description: 'Hash text (.hash md5|sha1|sha256 <text>)',
  handler: async (ctx) => {
    const alg = (ctx.args[0] || '').toLowerCase();
    const text = ctx.args.slice(1).join(' ');
    const allowed = ['md5', 'sha1', 'sha256', 'sha512'];
    if (!allowed.includes(alg) || !text) {
      return ctx.reply(errTheme('USAGE', `.hash ${allowed.join('|')} <text>`));
    }
    const crypto = require('crypto');
    const out = crypto.createHash(alg).update(text).digest('hex');
    await ctx.reply(info(alg.toUpperCase(), out));
  },
});

register({
  name: 'uuid',
  category: 'general',
  description: 'Generate a UUID v4',
  handler: async (ctx) => {
    const crypto = require('crypto');
    await ctx.reply(info('UUID', crypto.randomUUID()));
  },
});

register({
  name: 'password',
  aliases: ['genpass'],
  category: 'general',
  description: 'Generate a strong password (.password [length])',
  handler: async (ctx) => {
    const len = Math.min(Math.max(parseInt(ctx.args[0] || '16', 10), 8), 64);
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    const crypto = require('crypto');
    let pw = '';
    for (let i = 0; i < len; i++) pw += chars[crypto.randomInt(chars.length)];
    await ctx.reply(info('PASSWORD', pw));
  },
});

// -----------------------------------------------------------------------------
// NUMBER / MATH HELPERS
// -----------------------------------------------------------------------------

register({
  name: 'random',
  aliases: ['rand'],
  category: 'general',
  description: 'Random number between two bounds (.random 1 100)',
  handler: async (ctx) => {
    const min = parseInt(ctx.args[0] || '1', 10);
    const max = parseInt(ctx.args[1] || '100', 10);
    if (isNaN(min) || isNaN(max) || min > max) {
      return ctx.reply(errTheme('USAGE', '.random <min> <max>'));
    }
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    await ctx.reply(info('RANDOM', `${n} (between ${min} and ${max})`));
  },
});

register({
  name: 'coinflip',
  aliases: ['flip', 'cointoss'],
  category: 'general',
  description: 'Flip a coin',
  handler: async (ctx) => {
    const r = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
    await ctx.reply(info('COIN FLIP', `🪙 *${r}*`));
  },
});

register({
  name: 'dice',
  aliases: ['roll'],
  category: 'general',
  description: 'Roll dice (.dice [sides], default 6)',
  handler: async (ctx) => {
    const sides = Math.max(2, Math.min(parseInt(ctx.args[0] || '6', 10) || 6, 1000));
    const n = Math.floor(Math.random() * sides) + 1;
    await ctx.reply(info('DICE', `🎲 You rolled *${n}* (d${sides})`));
  },
});

register({
  name: 'percent',
  category: 'general',
  description: 'Calculate percentage (.percent 25 200 = 25% of 200)',
  handler: async (ctx) => {
    const p = parseFloat(ctx.args[0]);
    const n = parseFloat(ctx.args[1]);
    if (isNaN(p) || isNaN(n)) return ctx.reply(errTheme('USAGE', '.percent 25 200'));
    await ctx.reply(info('PERCENT', `${p}% of ${n} = *${(p * n) / 100}*`));
  },
});

register({
  name: 'average',
  aliases: ['avg', 'mean'],
  category: 'general',
  description: 'Average of numbers (.average 10 20 30)',
  handler: async (ctx) => {
    const nums = ctx.args.map((x) => parseFloat(x)).filter((x) => !isNaN(x));
    if (!nums.length) return ctx.reply(errTheme('USAGE', '.average <n1> <n2> ...'));
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    await ctx.reply(info('AVERAGE', `*${avg.toFixed(4)}* of ${nums.length} value(s)`));
  },
});

// -----------------------------------------------------------------------------
// UNIT CONVERSIONS
// -----------------------------------------------------------------------------

const CONVERSIONS: Record<string, Record<string, (v: number) => number>> = {
  km: { miles: (v) => v * 0.621371, m: (v) => v * 1000 },
  miles: { km: (v) => v * 1.60934, m: (v) => v * 1609.34 },
  m: { km: (v) => v / 1000, ft: (v) => v * 3.28084 },
  ft: { m: (v) => v / 3.28084, cm: (v) => v * 30.48 },
  cm: { ft: (v) => v / 30.48, inch: (v) => v / 2.54 },
  inch: { cm: (v) => v * 2.54 },
  kg: { lb: (v) => v * 2.20462, g: (v) => v * 1000 },
  lb: { kg: (v) => v / 2.20462 },
  g: { kg: (v) => v / 1000, oz: (v) => v / 28.3495 },
  oz: { g: (v) => v * 28.3495 },
  c: { f: (v) => (v * 9) / 5 + 32, k: (v) => v + 273.15 },
  f: { c: (v) => ((v - 32) * 5) / 9, k: (v) => ((v - 32) * 5) / 9 + 273.15 },
  k: { c: (v) => v - 273.15, f: (v) => ((v - 273.15) * 9) / 5 + 32 },
};

register({
  name: 'convert',
  category: 'general',
  description: 'Convert units (.convert 100 km miles)',
  handler: async (ctx) => {
    const [valStr, from, to] = ctx.args;
    const val = parseFloat(valStr);
    if (isNaN(val) || !from || !to) {
      return ctx.reply(errTheme('USAGE', '.convert 100 km miles'));
    }
    const f = from.toLowerCase();
    const t = to.toLowerCase();
    const fn = CONVERSIONS[f]?.[t];
    if (!fn) {
      const supported = Object.keys(CONVERSIONS).join(', ');
      return ctx.reply(errTheme('UNSUPPORTED CONVERSION', `Supported units: ${supported}`));
    }
    const result = fn(val);
    await ctx.reply(info('CONVERSION', `${val} ${from} = *${result.toFixed(4)} ${to}*`));
  },
});

// -----------------------------------------------------------------------------
// RANDOM PICKERS / LIST HELPERS
// -----------------------------------------------------------------------------

register({
  name: 'choose',
  aliases: ['pick'],
  category: 'general',
  description: 'Pick one option at random (.choose a b c)',
  handler: async (ctx) => {
    const opts = ctx.text
      .replace(/^[.!##]\w+\s*/, '')
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (opts.length < 2) return ctx.reply(errTheme('USAGE', '.choose option1, option2, ...'));
    const pick = opts[Math.floor(Math.random() * opts.length)];
    await ctx.reply(info('CHOICE', `🩸 *${pick}*`));
  },
});

register({
  name: 'shuffle',
  category: 'general',
  description: 'Shuffle a list (.shuffle a, b, c, ...)',
  handler: async (ctx) => {
    const items = ctx.text
      .replace(/^[.!##]\w+\s*/, '')
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length < 2) return ctx.reply(errTheme('USAGE', '.shuffle a, b, c'));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    await ctx.reply(info('SHUFFLED', items.map((x, i) => `${i + 1}. ${x}`).join('\n')));
  },
});

// -----------------------------------------------------------------------------
// NETWORK / INFO
// -----------------------------------------------------------------------------

register({
  name: 'myip',
  aliases: ['publicip'],
  category: 'general',
  description: 'Show the bot\'s public IP',
  handler: async (ctx) => {
    try {
      const res = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
      await ctx.reply(info('PUBLIC IP', res.data.ip));
    } catch (e) {
      await ctx.reply(errTheme('FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'host',
  aliases: ['hostname'],
  category: 'general',
  description: 'Show the bot\'s hostname and platform',
  handler: async (ctx) => {
    await ctx.reply(
      box('HOST', [
        ['HOSTNAME', os.hostname()],
        ['PLATFORM', `${os.platform()} ${os.arch()}`],
        ['UPTIME', formatUptime(os.uptime())],
        ['MEMORY', formatBytes(os.totalmem())],
      ])
    );
  },
});

register({
  name: 'speedtest',
  category: 'general',
  description: 'Quick latency test to a public endpoint',
  handler: async (ctx) => {
    const start = Date.now();
    try {
      await axios.get('https://www.google.com/generate_204', { timeout: 10000 });
      const ms = Date.now() - start;
      await ctx.reply(info('SPEEDTEST', `Round-trip to Google: *${ms} ms*`));
    } catch (e) {
      await ctx.reply(errTheme('SPEEDTEST FAILED', (e as Error).message));
    }
  },
});

// -----------------------------------------------------------------------------
// SMALL UTILITIES
// -----------------------------------------------------------------------------

register({
  name: 'echo',
  aliases: ['say'],
  category: 'general',
  description: 'Echo back your message',
  handler: async (ctx) => {
    const t = ctx.args.join(' ');
    if (!t) return ctx.reply(errTheme('USAGE', '.echo <text>'));
    await ctx.reply(t);
  },
});

register({
  name: 'pingme',
  category: 'general',
  description: 'Mention yourself',
  handler: async (ctx) => {
    await ctx.reply(`🩸 Hello @${ctx.senderNumber}`, [ctx.sender]);
  },
});

register({
  name: 'uptime2',
  category: 'general',
  description: 'Alias for uptime (second copy)',
  handler: async (ctx) => {
    // Placeholder to avoid clashing with the botinfo uptime command
    await ctx.reply(info('UPTIME', formatUptime(process.uptime())));
  },
});