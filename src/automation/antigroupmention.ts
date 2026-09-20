// src/automation/antigroupmention.ts
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { CONFIG, getRuntime } from '../core/config';
import { normalizeNumber } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * When a status mentions a group you're in, WhatsApp creates a
 * "statusMentionMessage" inside that group. With anti-group-mention enabled,
 * the bot deletes the group-message side of the mention.
 */
export function attachAntiGroupMention(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    if (!getRuntime().antigroupmention) return;

    for (const msg of messages) {
      const m: any = msg.message;
      if (!m) continue;

      // WhatsApp puts the mention inside statusMentionMessage
      const mention = m.statusMentionMessage;
      if (!mention) continue;

      const chatJid = msg.key?.remoteJid || '';
      const sender = normalizeNumber(msg.key?.participant || chatJid);
      const id = msg.key?.id;

      try {
        // Delete the message we just received
        if (id && chatJid) {
          await sock.sendMessage(chatJid, {
            delete: { remoteJid: chatJid, fromMe: false, id, participant: msg.key?.participant },
          } as any);
        }

        // Notify owner (silent to the group)
        const ownerJid = `${CONFIG.DEV_NUMBER}@s.whatsapp.net`;
        const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });
        await sock.sendMessage(ownerJid, {
          text: [
            '╭━━━〔 🩸 *ANTI-GROUP-MENTION* 〕━━━╮',
            '┃',
            `┃ 🚫 Deleted status group mention`,
            `┃ 👤 FROM : ${sender}`,
            `┃ 💬 CHAT : ${chatJid}`,
            `┃ 🕒 TIME : ${when}`,
            '┃',
            '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
          ].join('\n'),
        }).catch(() => {});
      } catch (e) {
        logger.warn({ err: (e as Error).message }, 'anti-group-mention delete failed');
      }
    }
  });
}