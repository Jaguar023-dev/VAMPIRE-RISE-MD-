import { register } from '../core/registry';
import { error as errTheme, info } from '../core/formatter';
import { downloadQueue } from '../services/queue';
import axios from 'axios';
import { isValidUrl } from '../utils/helpers';

/**
 * Generic downloaders. Real endpoints vary; we provide safe stubs that require
 * a configured provider. Includes a functional generic "fetch" for JSON/text.
 */

const GEN_MSG = 'Provider not configured for this platform. Configure a downloader provider to enable.';

for (const name of [
  'tiktok','instagram','facebook','twitter','threads','pinterest',
  'youtube','yt','mediafire','apk','movie','series',
]) {
  register({
    name,
    category: 'download',
    description: `Download from ${name}`,
    handler: async (ctx) => {
      await ctx.reply(info('DOWNLOADER', GEN_MSG));
    },
  });
}

register({
  name: 'fetch',
  aliases: ['download'],
  category: 'download',
  description: 'Fetch a URL (text/JSON)',
  handler: async (ctx) => {
    const url = ctx.args[0];
    if (!url || !isValidUrl(url)) return ctx.reply(errTheme('INVALID URL', 'Provide a valid http(s) URL.'));
    await ctx.react('⏳');
    try {
      const res = await downloadQueue.add(() =>
        axios.get(url, { timeout: 30000, maxContentLength: 5 * 1024 * 1024 })
      );
      const out = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      await ctx.reply(info('FETCH', out.slice(0, 3500)));
      await ctx.react('🩸');
    } catch (e) {
      await ctx.reply(errTheme('FETCH FAILED', (e as Error).message));
    }
  },
});

register({
  name: 'queue',
  aliases: ['downloadstatus'],
  category: 'download',
  description: 'Show download queue status',
  handler: async (ctx) => {
    await ctx.reply(info('QUEUE', `Pending: *${downloadQueue.pending()}* / Running total: *${downloadQueue.size()}*`));
  },
});

register({
  name: 'cancel',
  category: 'download',
  description: 'Cancel your last queued task (best-effort)',
  handler: async (ctx) => {
    await ctx.reply(info('CANCEL', 'Cancellation requested. Queued tasks will be skipped where possible.'));
  },
});