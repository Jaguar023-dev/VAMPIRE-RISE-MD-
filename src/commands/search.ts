import axios from 'axios';
import { register } from '../core/registry';
import { error as errTheme, info, box } from '../core/formatter';
import { isValidUrl } from '../utils/helpers';

register({
  name: 'google',
  aliases: ['search', 'find'],
  category: 'tools',
  description: 'Search the web (DuckDuckGo HTML)',
  handler: async (ctx) => {
    const q = ctx.args.join(' ').trim();
    if (!q) return ctx.reply(errTheme('MISSING QUERY', 'Provide a search term.'));
    try {
      const res = await axios.get('https://html.duckduckgo.com/html/', { params: { q }, timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html: string = res.data;
      const items: string[] = [];
      const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      let m;
      while ((m = re.exec(html)) && items.length < 8) {
        const title = m[2].replace(/<[^>]+>/g, '');
        items.push(`• ${title}\n  ${m[1]}`);
      }
      await ctx.reply(info('SEARCH', items.join('\n\n') || 'No results.'));
    } catch (e) {
      await ctx.reply(errTheme('SEARCH FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'dictionary',
  category: 'tools',
  description: 'Define a word',
  handler: async (ctx) => {
    const w = ctx.args[0];
    if (!w) return ctx.reply(errTheme('MISSING WORD', 'Provide a word.'));
    try {
      const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`, { timeout: 15000 });
      const entry = res.data?.[0];
      const def = entry?.meanings?.[0]?.definitions?.[0]?.definition || 'No definition.';
      await ctx.reply(info(`DEFINITION — ${w}`, def));
    } catch (e) {
      await ctx.reply(errTheme('NOT FOUND', 'Word not found.'));
    }
  },
});

register({
  name: 'ip',
  aliases: ['whois'],
  category: 'tools',
  description: 'IP geolocation lookup',
  handler: async (ctx) => {
    const ip = ctx.args[0];
    if (!ip) return ctx.reply(errTheme('MISSING IP', 'Provide an IP or hostname.'));
    try {
      const res = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}`, { timeout: 15000 });
      const d = res.data;
      if (d.status !== 'success') throw new Error('Lookup failed');
      await ctx.reply(
        box('IP LOOKUP', [
          ['IP', d.query],
          ['ISP', d.isp],
          ['COUNTRY', d.country],
          ['CITY', d.city],
          ['TIMEZONE', d.timezone],
        ])
      );
    } catch (e) {
      await ctx.reply(errTheme('IP LOOKUP FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'weather',
  category: 'tools',
  description: 'Weather for a city',
  handler: async (ctx) => {
    const city = ctx.args.join(' ').trim();
    if (!city) return ctx.reply(errTheme('MISSING CITY', 'Provide a city name.'));
    try {
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 20000 });
      const c = res.data.current_condition?.[0];
      const area = res.data.nearest_area?.[0];
      await ctx.reply(
        box('WEATHER', [
          ['CITY', area?.areaName?.[0]?.value || city],
          ['TEMP', `${c?.temp_C || '?'}°C`],
          ['FEELS', `${c?.FeelsLikeC || '?'}°C`],
          ['HUMID', `${c?.humidity || '?'}%`],
          ['DESC', c?.weatherDesc?.[0]?.value || '—'],
        ])
      );
    } catch (e) {
      await ctx.reply(errTheme('WEATHER FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'time',
  category: 'tools',
  description: 'Current time in a timezone',
  handler: async (ctx) => {
    const tz = ctx.args[0] || 'Africa/Nairobi';
    try {
      const now = new Date().toLocaleString('en-GB', { timeZone: tz });
      await ctx.reply(info('TIME', `${tz}\n${now}`));
    } catch {
      await ctx.reply(errTheme('INVALID TIMEZONE', tz));
    }
  },
});

register({
  name: 'currency',
  category: 'tools',
  description: 'Currency conversion: .currency 100 USD KES',
  handler: async (ctx) => {
    const [amtStr, from, to] = ctx.args;
    const amt = Number(amtStr);
    if (!amt || !from || !to) return ctx.reply(errTheme('USAGE', '.currency 100 USD KES'));
    try {
      const res = await axios.get(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amt}`, { timeout: 20000 });
      const val = res.data?.result;
      await ctx.reply(info('CURRENCY', `${amt} ${from} = ${val} ${to}`));
    } catch (e) {
      await ctx.reply(errTheme('CURRENCY FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'calculator',
  aliases: ['calc'],
  category: 'tools',
  description: 'Evaluate an arithmetic expression (safe)',
  handler: async (ctx) => {
    const expr = ctx.args.join(' ');
    if (!expr) return ctx.reply(errTheme('MISSING EXPR', 'Provide an expression.'));
    if (!/^[0-9+\-*/().\s%^]+$/.test(expr)) {
      return ctx.reply(errTheme('INVALID EXPR', 'Only numbers and + - * / ( ) % ^ allowed.'));
    }
    try {
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict";return (${expr.replace(/\^/g, '**')})`)();
      await ctx.reply(info('CALCULATOR', `${expr} = *${val}*`));
    } catch {
      await ctx.reply(errTheme('CALC ERROR', 'Could not evaluate.'));
    }
  },
});

register({
  name: 'qr',
  category: 'tools',
  description: 'Generate a QR code for text/URL',
  handler: async (ctx) => {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.reply(errTheme('MISSING TEXT', 'Provide text or URL.'));
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
    await ctx.sock.sendMessage(ctx.jid, { image: { url }, caption: `🩸 QR: ${text}` }, { quoted: ctx.msg });
  },
});

register({
  name: 'shortlink',
  category: 'tools',
  description: 'Shorten a URL',
  handler: async (ctx) => {
    const url = ctx.args[0];
    if (!url || !isValidUrl(url)) return ctx.reply(errTheme('INVALID URL', 'Provide a valid URL.'));
    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
      await ctx.reply(info('SHORT URL', res.data));
    } catch (e) {
      await ctx.reply(errTheme('SHORTEN FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'imdb',
  category: 'tools',
  description: 'Look up a title on OMDb',
  handler: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return ctx.reply(errTheme('MISSING TITLE', 'Provide a title.'));
    try {
      const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=trilogy`, { timeout: 15000 });
      const d = res.data;
      if (d.Response === 'False') throw new Error(d.Error);
      await ctx.reply(
        box('IMDB', [
          ['TITLE', d.Title],
          ['YEAR', d.Year],
          ['RATED', d.Rated],
          ['GENRE', d.Genre],
          ['RUNTIME', d.Runtime],
          ['RATING', d.imdbRating],
        ])
      );
    } catch (e) {
      await ctx.reply(errTheme('IMDB FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'anime',
  category: 'tools',
  description: 'Search anime via Jikan (MyAnimeList)',
  handler: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return ctx.reply(errTheme('MISSING QUERY', 'Provide an anime title.'));
    try {
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`, { timeout: 20000 });
      const a = res.data?.data?.[0];
      if (!a) throw new Error('Not found');
      await ctx.reply(
        box('ANIME', [
          ['TITLE', a.title],
          ['EPISODES', String(a.episodes || '?')],
          ['SCORE', String(a.score || '?')],
          ['STATUS', a.status],
          ['SYNOPSIS', (a.synopsis || '').slice(0, 200) + '...'],
        ])
      );
    } catch (e) {
      await ctx.reply(errTheme('ANIME FAILED', (e as Error).message));
    }
  },
});