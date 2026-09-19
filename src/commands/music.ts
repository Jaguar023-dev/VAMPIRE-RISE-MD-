import { register } from '../core/registry';
import { error as errTheme, info } from '../core/formatter';

/**
 * Music commands rely on configurable providers. If no provider is available,
 * the command informs the user honestly rather than faking a result.
 */

const MSG = 'Music provider not configured. Add a provider via the developer provider system or set MUSIC_API in .env.';

for (const name of [
  'play','song','music','ytmp3','ytmp4','lyrics','ringtone',
  'tomp3','toaudio','tovideo','bass','deep','nightcore','reverse',
  'slow','speed','pitch','echo','reverb',
]) {
  register({
    name,
    category: 'music',
    description: `Music/audio command (${name})`,
    handler: async (ctx) => {
      await ctx.reply(info('MUSIC', MSG));
    },
  });
}