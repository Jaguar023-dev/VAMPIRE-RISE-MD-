import { register } from '../core/registry';
import { getRuntime, setRuntime } from '../core/config';
import { info } from '../core/formatter';

const TOGGLES = [
  'anticall','antilink','antispam','antiflood','antibot','antidelete',
  'autoread','alwaysonline','autotyping','autorecording',
  'autoviewstatus','autoreadstatus','autodownloadstatus','autoreactstatus','autoreplystatus',
];

for (const name of TOGGLES) {
  register({
    name,
    category: 'general',
    description: `Toggle ${name}`,
    handler: async (ctx) => {
      const mode = (ctx.args[0] || '').toLowerCase();
      const r = getRuntime() as any;
      const current = !!r[name];
      const next = mode === 'on' ? true : mode === 'off' ? false : !current;
      setRuntime({ [name]: next } as any);
      await ctx.reply(info(name.toUpperCase(), `Now *${next ? 'ON' : 'OFF'}*.`));
    },
  });
}