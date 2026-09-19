import type { WASocket, proto } from '@whiskeysockets/baileys';
import { CONFIG, getRuntime, DEFAULTS } from '../core/config';
import { getCommand, CommandContext } from '../core/registry';
import { isDeveloper, canUseCommand, isGroupAdmin } from '../middleware/auth';
import { normalizeNumber, sleep } from '../utils/helpers';
import { error as errTheme, info } from '../core/formatter';
import { chatbotReply } from '../services/chatbot';
import { handleMenuReply } from './menuReply';
import { logger } from '../utils/logger';

function extractText(msg: proto.IWebMessageInfo): string {
  const m: any = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  ).toString();
}

function findPrefix(text: string): string | null {
  const r = getRuntime();
  // Owner configured prefix first, then defaults
  const prefs = [r.prefix, ...CONFIG.ALLOWED_PREFIXES].filter(Boolean);
  for (const p of prefs) {
    if (p && text.startsWith(p)) return p;
  }
  return null;
}

const MENU_TRIGGERS = ['menu', '0', 'back', 'home'];

export function attachMessageHandler(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleSingle(sock, msg);
      } catch (e) {
        logger.error({ err: (e as Error).message }, 'message handler error');
      }
    }
  });
}

async function handleSingle(sock: WASocket, msg: proto.IWebMessageInfo) {
  const jid = msg.key?.remoteJid;
  if (!jid) return;
  if (jid === 'status@broadcast') return;

  const senderJid = msg.key?.participant || (msg.key?.fromMe ? sock.user?.id : jid) || jid;
  const senderNumber = normalizeNumber(senderJid);
  const isGroup = jid.endsWith('@g.us');
  const dev = isDeveloper(senderJid);
  const fromMe = !!msg.key?.fromMe;

  const text = extractText(msg);
  if (!text) return;

  const reply = async (t: string, mentions?: string[]) => {
    try {
      const r = getRuntime();
      if (r.autotyping) await sock.sendPresenceUpdate('composing', jid).catch(()=>{});
      await sleep(120);
      await sock.sendMessage(jid, { text: t, mentions }, { quoted: msg });
    } catch (e) {
      logger.debug({ err: (e as Error).message }, 'reply failed');
    }
  };
  const react = async (emoji: string) => {
    try {
      await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } } as any);
    } catch {}
  };

  const ctxBase = {
    sock, msg, jid, sender: senderJid, senderNumber,
    isGroup, isDev: dev, fromMe,
    reply, react,
    quoted: (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage as any) || null,
  } as Partial<CommandContext>;

  // 1) Menu numeric / back / home replies
  const handledByMenu = await handleMenuReply({ ...ctxBase as CommandContext, text });
  if (handledByMenu) return;

  // 2) Determine prefix & command
  const prefix = findPrefix(text);
  let commandName = '';
  let args: string[] = [];

  if (prefix) {
    const body = text.slice(prefix.length).trim();
    const parts = body.split(/\s+/);
    commandName = (parts.shift() || '').toLowerCase();
    args = parts;
  } else if (dev) {
    // Developer unprefixed command (single-word) — e.g. "menu", "ping"
    const first = text.trim().split(/\s+/)[0].toLowerCase();
    if (getCommand(first)) {
      commandName = first;
      args = text.trim().split(/\s+/).slice(1);
    } else {
      // Natural-language dev commands
      const nl = await handleDevNaturalLanguage(ctxBase as CommandContext, text);
      if (nl) return;
    }
  }

  // 3) Menu shortcuts
  if (!commandName && MENU_TRIGGERS.includes(text.trim().toLowerCase())) {
    commandName = 'menu';
  }

  if (!commandName) {
    // Chatbot auto-reply in private chat
    const r = getRuntime();
    if (r.chatbot && !isGroup && !fromMe) {
      const aiResp = await chatbotReply(text, msg.key?.id || '');
      if (aiResp) await reply(aiResp);
    }
    return;
  }

  const cmd = getCommand(commandName);
  if (!cmd) return;

  // Auth
  const auth = canUseCommand(senderJid, !!cmd.devOnly);
  if (!auth.ok) {
    await reply(errTheme('ACCESS DENIED', auth.reason));
    return;
  }

  if (cmd.groupOnly && !isGroup) {
    await reply(errTheme('GROUP ONLY', 'This command can only be used in groups.'));
    return;
  }
  if (cmd.privateOnly && isGroup) {
    await reply(errTheme('PRIVATE ONLY', 'This command can only be used in DMs.'));
    return;
  }
  if (cmd.adminOnly && isGroup) {
    const ok = dev || (await isGroupAdmin(sock, jid, senderJid));
    if (!ok) {
      await reply(errTheme('ADMIN ONLY', 'You must be a group admin.'));
      return;
    }
  }

  const fullCtx: CommandContext = {
    ...(ctxBase as CommandContext),
    prefix: prefix || '',
    command: commandName,
    args,
    text,
  };

  try {
    await cmd.handler(fullCtx);
  } catch (e) {
    logger.error({ cmd: cmd.name, err: (e as Error).message }, 'command failed');
    await reply(errTheme('COMMAND FAILED', (e as Error).message || 'Unknown error.'));
  }
}

/**
 * Very small, safe natural-language dev router. Only matches explicit safe patterns.
 * Never delegates to a shell or arbitrary exec.
 */
async function handleDevNaturalLanguage(ctx: CommandContext, text: string): Promise<boolean> {
  const t = text.toLowerCase();
  const rules: Array<{ re: RegExp; run: (m: RegExpMatchArray) => Promise<void> }> = [
    {
      re: /\b(activate|enable|turn on)\s+(anti[\s-]?(link|spam|flood|bot|delete|call))/i,
      run: async (m) => {
        const key = m[2].toLowerCase().replace(/[\s-]/g, '');
        const { setRuntime } = require('../core/config');
        setRuntime({ [key]: true } as any);
        await ctx.reply(info('AUTO-TOGGLE', `Enabled *${key}*.`));
      },
    },
    {
      re: /\b(deactivate|disable|turn off)\s+(anti[\s-]?(link|spam|flood|bot|delete|call))/i,
      run: async (m) => {
        const key = m[2].toLowerCase().replace(/[\s-]/g, '');
        const { setRuntime } = require('../core/config');
        setRuntime({ [key]: false } as any);
        await ctx.reply(info('AUTO-TOGGLE', `Disabled *${key}*.`));
      },
    },
    {
      re: /\b(public mode|go public)\b/i,
      run: async () => {
        const { setRuntime } = require('../core/config');
        setRuntime({ mode: 'public' });
        await ctx.reply(info('MODE', 'Bot is now in *public* mode.'));
      },
    },
    {
      re: /\b(private mode|go private)\b/i,
      run: async () => {
        const { setRuntime } = require('../core/config');
        setRuntime({ mode: 'private' });
        await ctx.reply(info('MODE', 'Bot is now in *private* mode.'));
      },
    },
  ];
  for (const rule of rules) {
    const m = t.match(rule.re);
    if (m) {
      await rule.run(m);
      return true;
    }
  }
  return false;
}