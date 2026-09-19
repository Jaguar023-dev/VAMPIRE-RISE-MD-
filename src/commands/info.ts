import os from 'os';
import { register } from '../core/registry';
import { box, info, success } from '../core/formatter';
import { CONFIG, getRuntime } from '../core/config';
import { formatUptime, formatBytes } from '../utils/helpers';
import { buildMainMenu, buildCategoryMenu } from '../core/menu';
import { setMenuState } from '../handlers/menuReply';

const startTime = Date.now();

register({
  name: 'ping',
  category: 'botinfo',
  description: 'Check bot latency',
  handler: async (ctx) => {
    const t = Date.now();
    await ctx.reply(info('PONG', 'Measuring...'));
    await ctx.reply(info('PONG', `Latency: *${Date.now() - t} ms*`));
  },
});

register({
  name: 'alive',
  category: 'botinfo',
  description: 'Show bot alive status',
  handler: async (ctx) => {
    await ctx.reply(
      box('BOT ALIVE', [
        ['STATUS', 'ONLINE 🟢'],
        ['UPTIME', formatUptime((Date.now() - startTime) / 1000)],
        ['MODE', getRuntime().mode.toUpperCase()],
      ])
    );
  },
});

register({
  name: 'uptime',
  category: 'botinfo',
  description: 'Show uptime',
  handler: async (ctx) => {
    await ctx.reply(info('UPTIME', formatUptime((Date.now() - startTime) / 1000)));
  },
});

register({
  name: 'system',
  aliases: ['systemstatus'],
  category: 'botinfo',
  description: 'System information',
  handler: async (ctx) => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    await ctx.reply(
      box('SYSTEM INFORMATION', [
        ['OS', `${os.type()} ${os.release()}`],
        ['CPU', os.cpus()[0]?.model || 'unknown'],
        ['CORES', String(os.cpus().length)],
        ['RAM', `${formatBytes(used)} / ${formatBytes(total)}`],
        ['UPTIME', formatUptime(os.uptime())],
      ])
    );
  },
});

register({
  name: 'stats',
  category: 'botinfo',
  description: 'Bot statistics',
  handler: async (ctx) => {
    await ctx.reply(
      box('STATS', [
        ['MODE', getRuntime().mode.toUpperCase()],
        ['PREFIX', getRuntime().prefix],
        ['CHATBOT', getRuntime().chatbot ? 'ON' : 'OFF'],
        ['MEMORY', formatBytes(process.memoryUsage().rss)],
      ])
    );
  },
});

register({
  name: 'version',
  category: 'botinfo',
  description: 'Bot version',
  handler: async (ctx) => {
    await ctx.reply(info('VERSION', `${CONFIG.BOT_NAME} — v1.0.0`));
  },
});

register({
  name: 'about',
  aliases: ['bot'],
  category: 'web',
  description: 'About the bot',
  handler: async (ctx) => {
    await ctx.reply(
      box('ABOUT', [
        ['BOT', CONFIG.BOT_NAME],
        ['DEV', CONFIG.DEVELOPER],
        ['MODE', getRuntime().mode.toUpperCase()],
        ['STACK', 'Node.js + Baileys'],
      ])
    );
  },
});

register({
  name: 'owner',
  aliases: ['dev', 'developer'],
  category: 'botinfo',
  description: 'Show bot owner',
  handler: async (ctx) => {
    await ctx.reply(info('OWNER', `${CONFIG.DEVELOPER}\n📞 +${CONFIG.DEV_NUMBER}`));
  },
});

register({
  name: 'support',
  category: 'botinfo',
  description: 'Support contact',
  handler: async (ctx) => {
    await ctx.reply(info('SUPPORT', `Contact ${CONFIG.DEVELOPER} — +${CONFIG.DEV_NUMBER}`));
  },
});

register({
  name: 'help',
  aliases: ['menu', 'cmd', 'commands', 'list'],
  category: 'botinfo',
  description: 'Open the main menu',
  handler: async (ctx) => {
    const r = getRuntime();
    await ctx.sock.sendMessage(
      ctx.jid,
      { image: { url: r.banner }, caption: buildMainMenu() },
      { quoted: ctx.msg }
    );
    setMenuState(ctx.jid, 'main');
  },
});

register({
  name: 'github',
  aliases: ['repo'],
  category: 'botinfo',
  description: 'Project repository',
  handler: async (ctx) => {
    await ctx.reply(info('GITHUB', 'Repository: https://github.com/ (set your repo URL)'));
  },
});