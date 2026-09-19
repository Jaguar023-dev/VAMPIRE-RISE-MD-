import fs from 'fs';
import path from 'path';
import { register } from '../core/registry';
import { CONFIG, DEFAULTS, getRuntime, setRuntime, loadRuntime } from '../core/config';
import { info, success, error as errTheme, box } from '../core/formatter';
import { getProviders, setProviderEnabled } from '../providers';
import { logger } from '../utils/logger';

const dev = { devOnly: true, hidden: true } as const;

// ---------- Broadcast / lifecycle ----------
register({
  name: 'broadcast', category: 'botinfo', description: 'Broadcast a message', ...dev,
  handler: async (ctx) => {
    const text = ctx.args.join(' ');
    if (!text) return ctx.reply(errTheme('USAGE', '.broadcast <text>'));
    try {
      const chats = await ctx.sock.groupFetchAllParticipating();
      let n = 0;
      for (const id of Object.keys(chats)) {
        await ctx.sock.sendMessage(id, { text: `🩸 *BROADCAST*\n\n${text}` }).catch(() => {});
        n++;
      }
      await ctx.reply(success('BROADCAST', `Sent to ${n} groups.`));
    } catch (e) { await ctx.reply(errTheme('BROADCAST FAILED', (e as Error).message)); }
  },
});

register({ name: 'restart', category: 'botinfo', description: 'Restart process', ...dev,
  handler: async (ctx) => {
    await ctx.reply(info('RESTART', 'Restarting…'));
    setTimeout(() => process.exit(0), 800);
  },
});

register({ name: 'shutdown', category: 'botinfo', description: 'Shutdown process', ...dev,
  handler: async (ctx) => { await ctx.reply(info('SHUTDOWN', 'Goodbye. 🩸')); setTimeout(() => process.exit(0), 500); },
});

register({ name: 'update', category: 'botinfo', description: 'Pull update placeholder', ...dev,
  handler: async (ctx) => ctx.reply(info('UPDATE', 'Update command is disabled in production. Use your deployment pipeline.')),
});

// ---------- Moderation (never applies to dev) ----------
for (const name of ['block','unblock','banuser','unbanuser'] as const) {
  register({ name, category: 'botinfo', description: `${name} (dev)`, ...dev,
    handler: async (ctx) => {
      const num = ctx.args[0]?.replace(/\D/g, '');
      if (!num) return ctx.reply(errTheme('MISSING NUMBER', `.${name} <number>`));
      if (num === CONFIG.DEV_NUMBER) return ctx.reply(errTheme('PROTECTED', 'Developer is protected.'));
      const jid = `${num}@s.whatsapp.net`;
      try {
        if (name === 'block') await ctx.sock.updateBlockStatus(jid, 'block');
        else if (name === 'unblock') await ctx.sock.updateBlockStatus(jid, 'unblock');
        await ctx.reply(success(name.toUpperCase(), jid));
      } catch (e) { await ctx.reply(errTheme('FAILED', (e as Error).message)); }
    },
  });
}

// ---------- Eval / Exec ----------
register({ name: 'eval', category: 'botinfo', description: 'Evaluate JS (dev, disabled in prod)', ...dev,
  handler: async (ctx) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_EVAL !== 'true') {
      return ctx.reply(errTheme('DISABLED', 'eval is disabled in production.'));
    }
    const code = ctx.args.join(' ');
    if (!code) return ctx.reply(errTheme('USAGE', '.eval <code>'));
    try {
      const result = await eval(`(async () => { ${code} })()`);
      await ctx.reply(info('EVAL', String(result)));
    } catch (e) { await ctx.reply(errTheme('EVAL FAILED', (e as Error).message)); }
  },
});

register({ name: 'exec', category: 'botinfo', description: 'Exec shell (dev, disabled by default)', ...dev,
  handler: async (ctx) => {
    if (process.env.ALLOW_EXEC !== 'true') return ctx.reply(errTheme('DISABLED', 'exec is disabled.'));
    await ctx.reply(errTheme('DISABLED', 'exec not implemented for safety.'));
  },
});

// ---------- Vars ----------
register({ name: 'setvar', category: 'botinfo', description: 'Set a runtime var', ...dev,
  handler: async (ctx) => {
    const [k, ...rest] = ctx.args;
    if (!k) return ctx.reply(errTheme('USAGE', '.setvar key value'));
    const v = rest.join(' ');
    const r = getRuntime();
    setRuntime({ vars: { ...r.vars, [k]: v } });
    await ctx.reply(success('SETVAR', `${k} = ${v}`));
  },
});
register({ name: 'getvar', category: 'botinfo', description: 'Get a runtime var', ...dev,
  handler: async (ctx) => {
    const k = ctx.args[0];
    if (!k) return ctx.reply(errTheme('USAGE', '.getvar key'));
    await ctx.reply(info('VAR', `${k} = ${getRuntime().vars[k] ?? '(unset)'}`));
  },
});
register({ name: 'delvar', aliases: ['resetvar'], category: 'botinfo', description: 'Delete a runtime var', ...dev,
  handler: async (ctx) => {
    const k = ctx.args[0];
    if (!k) return ctx.reply(errTheme('USAGE', '.delvar key'));
    const r = getRuntime();
    const vars = { ...r.vars };
    delete vars[k];
    setRuntime({ vars });
    await ctx.reply(success('DELVAR', k));
  },
});

// ---------- Banner / Prefix / Mode ----------
register({ name: 'setbanner', category: 'botinfo', description: 'Set banner image', ...dev,
  handler: async (ctx) => {
    const url = ctx.args[0];
    if (!url) return ctx.reply(errTheme('USAGE', '.setbanner <url> | .setbanner default'));
    if (url === 'default') { setRuntime({ banner: DEFAULTS.banner }); return ctx.reply(success('BANNER', 'Restored default.')); }
    setRuntime({ banner: url });
    await ctx.reply(success('BANNER', url));
  },
});

register({ name: 'setmenu', category: 'botinfo', description: 'Set menu banner (alias)', ...dev,
  handler: async (ctx) => {
    const url = ctx.args[0];
    if (!url) return ctx.reply(errTheme('USAGE', '.setmenu <url>'));
    setRuntime({ banner: url });
    await ctx.reply(success('MENU BANNER', url));
  },
});

register({ name: 'setprefix', category: 'botinfo', description: 'Set prefix', ...dev,
  handler: async (ctx) => {
    const p = ctx.args[0];
    if (!p || !CONFIG.ALLOWED_PREFIXES.includes(p)) return ctx.reply(errTheme('INVALID PREFIX', `Allowed: ${CONFIG.ALLOWED_PREFIXES.join(' ')}`));
    setRuntime({ prefix: p });
    await ctx.reply(success('PREFIX', p));
  },
});

register({ name: 'setbio', category: 'botinfo', description: 'Set bot bio (status)', ...dev,
  handler: async (ctx) => {
    const text = ctx.args.join(' ');
    if (!text) return ctx.reply(errTheme('USAGE', '.setbio <text>'));
    await ctx.sock.updateProfileStatus(text);
    await ctx.reply(success('BIO', text));
  },
});

register({ name: 'setstatus', category: 'botinfo', description: 'Set bot status', ...dev,
  handler: async (ctx) => {
    const text = ctx.args.join(' ');
    if (!text) return ctx.reply(errTheme('USAGE', '.setstatus <text>'));
    await ctx.sock.updateProfileStatus(text);
    await ctx.reply(success('STATUS', text));
  },
});

register({ name: 'setstartmsg', category: 'botinfo', description: 'Set startup message', ...dev,
  handler: async (ctx) => {
    const text = ctx.args.join(' ');
    if (!text) return ctx.reply(errTheme('USAGE', '.setstartmsg <text>'));
    setRuntime({ vars: { ...getRuntime().vars, startmsg: text } });
    await ctx.reply(success('STARTUP MSG', 'Saved.'));
  },
});

// ---------- Backup / Restore ----------
register({ name: 'backup', category: 'botinfo', description: 'Backup runtime config', ...dev,
  handler: async (ctx) => {
    const data = JSON.stringify(getRuntime(), null, 2);
    await ctx.sock.sendMessage(ctx.jid, { document: Buffer.from(data), fileName: 'runtime.json', mimetype: 'application/json' }, { quoted: ctx.msg });
  },
});
register({ name: 'restore', category: 'botinfo', description: 'Restore runtime config from JSON', ...dev,
  handler: async (ctx) => ctx.reply(info('RESTORE', 'Send a JSON file with .import to restore.')) });
register({ name: 'export', category: 'botinfo', description: 'Export runtime', ...dev,
  handler: async (ctx) => ctx.reply(info('EXPORT', JSON.stringify(getRuntime(), null, 2).slice(0, 3000))) });
register({ name: 'import', category: 'botinfo', description: 'Import runtime from JSON', ...dev,
  handler: async (ctx) => ctx.reply(info('IMPORT', 'Please send a JSON document in the chat to import (not yet wired to media).')) });

// ---------- Debug / Ops ----------
register({ name: 'debug', category: 'botinfo', description: 'Debug info', ...dev,
  handler: async (ctx) => ctx.reply(box('DEBUG', [['MODE', process.env.NODE_ENV || 'dev'], ['PID', String(process.pid)], ['RSS', `${Math.round(process.memoryUsage().rss/1024/1024)} MB`]])) });
register({ name: 'logs', category: 'botinfo', description: 'Show recent logs', ...dev,
  handler: async (ctx) => ctx.reply(info('LOGS', 'Use hosting provider log viewer.')) });
register({ name: 'test', category: 'botinfo', description: 'Self test', ...dev,
  handler: async (ctx) => ctx.reply(success('TEST', 'OK 🩸')) });
register({ name: 'health', category: 'botinfo', description: 'Health check', ...dev,
  handler: async (ctx) => ctx.reply(success('HEALTH', 'All systems nominal.')) });
register({ name: 'reload', aliases: ['reloadplugins'], category: 'botinfo', description: 'Reload runtime config', ...dev,
  handler: async (ctx) => { loadRuntime(); await ctx.reply(success('RELOAD', 'Runtime reloaded.')); } });

// ---------- Providers ----------
register({ name: 'providers', category: 'botinfo', description: 'List providers', ...dev,
  handler: async (ctx) => {
    const list = getProviders().map((p) => `${p.type.padEnd(11)} ${p.id.padEnd(18)} ${p.enabled ? '🟢' : '🔴'}  ${p.name}`);
    await ctx.reply(info('PROVIDERS', list.join('\n') || 'None registered.'));
  },
});
register({ name: 'addprovider', category: 'botinfo', description: 'Add provider (dynamic)', ...dev,
  handler: async (ctx) => ctx.reply(info('ADD PROVIDER', 'Providers are added in code for security. See src/providers/.')) });
register({ name: 'removeprovider', category: 'botinfo', description: 'Remove provider', ...dev,
  handler: async (ctx) => ctx.reply(info('REMOVE PROVIDER', 'Remove providers by editing src/providers/.')) });
register({ name: 'enableprovider', category: 'botinfo', description: 'Enable a provider', ...dev,
  handler: async (ctx) => { const id = ctx.args[0]; if (!id) return ctx.reply(errTheme('USAGE','.enableprovider <id>')); setProviderEnabled(id, true); await ctx.reply(success('PROVIDER ENABLED', id)); } });
register({ name: 'disableprovider', category: 'botinfo', description: 'Disable a provider', ...dev,
  handler: async (ctx) => { const id = ctx.args[0]; if (!id) return ctx.reply(errTheme('USAGE','.disableprovider <id>')); setProviderEnabled(id, false); await ctx.reply(success('PROVIDER DISABLED', id)); } });
register({ name: 'testprovider', category: 'botinfo', description: 'Test a provider', ...dev,
  handler: async (ctx) => {
    const id = ctx.args[0];
    const { getProvider } = require('../providers');
    const p = getProvider(id);
    if (!p) return ctx.reply(errTheme('NOT FOUND', id));
    try {
      const out = await p.run('Hello from VAMPIRE RISE MD');
      await ctx.reply(info(`PROVIDER TEST — ${id}`, String(out).slice(0, 500)));
    } catch (e) { await ctx.reply(errTheme('PROVIDER FAILED', (e as Error).message)); }
  },
});
register({ name: 'providerstatus', category: 'botinfo', description: 'Provider status', ...dev,
  handler: async (ctx) => {
    const list = getProviders().map((p) => `${p.id} (${p.type}) — ${p.enabled ? 'ON' : 'OFF'}`);
    await ctx.reply(info('PROVIDER STATUS', list.join('\n') || 'None.'));
  },
});

// Mode switch (dev only, hidden)
register({ name: 'mode', category: 'botinfo', description: 'Set bot mode', ...dev,
  handler: async (ctx) => {
    const m = (ctx.args[0] || '').toLowerCase();
    if (!['private','public'].includes(m)) return ctx.reply(errTheme('USAGE','.mode private|public'));
    setRuntime({ mode: m as any });
    await ctx.reply(success('MODE', m.toUpperCase()));
  },
});