import { register } from '../core/registry';
import { info } from '../core/formatter';

/**
 * Sports commands are placeholders that require an external sports provider.
 * We never fabricate live results.
 */

for (const name of [
  'scores','fixtures','results','standings','live','table','team','player',
  'football','premierleague','laliga','championsleague','fifa','pl','ll',
]) {
  register({
    name,
    category: 'sports',
    description: `Sports command (${name})`,
    handler: async (ctx) => {
      await ctx.reply(info('SPORTS', 'Sports provider not configured. Add a sports provider to enable live data.'));
    },
  });
}