import { register } from '../core/registry';
import { info, error as errTheme } from '../core/formatter';
import { runFirst } from '../providers';
import { NEWS_FEEDS } from '../providers/newsFeeds';

for (const name of Object.keys(NEWS_FEEDS)) {
  register({
    name,
    category: 'updates',
    description: `News: ${name}`,
    handler: async (ctx) => {
      try {
        const { result } = await runFirst('news', { feed: NEWS_FEEDS[name] });
        const items = (result || []).slice(0, 6).map((x: any, i: number) => `${i + 1}. ${x.title}\n${x.link}`).join('\n\n');
        await ctx.reply(info(name.toUpperCase(), items || 'No headlines.'));
      } catch (e) {
        await ctx.reply(errTheme('NEWS FAILED', (e as Error).message));
      }
    },
  });
}

for (const [name, feed] of [
  ['kenya', NEWS_FEEDS.kenyanews],
  ['africa', NEWS_FEEDS.africanews],
  ['world', NEWS_FEEDS.worldnews],
] as const) {
  register({
    name,
    category: 'updates',
    description: `News: ${name}`,
    handler: async (ctx) => {
      try {
        const { result } = await runFirst('news', { feed });
        const items = (result || []).slice(0, 6).map((x: any, i: number) => `${i + 1}. ${x.title}\n${x.link}`).join('\n\n');
        await ctx.reply(info(name.toUpperCase(), items || 'No headlines.'));
      } catch (e) {
        await ctx.reply(errTheme('NEWS FAILED', (e as Error).message));
      }
    },
  });
}