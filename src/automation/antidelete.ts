// src/automation/antidelete.ts
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { CONFIG, getRuntime } from '../core/config';
import { normalizeNumber } from '../utils/helpers';
import { logger } from '../utils/logger';

// In-memory cache of recent messages so we can reconstruct them when deleted.
// Keyed by message ID. Bounded to avoid memory growth.
const MESSAGE_CACHE = new Map<string, proto.IWebMessageInfo>();
const MAX_CACHE = 500;

function cacheMessage(msg: proto.IWebMessageInfo) {
  const id = msg.key?.id;
  if (!id) return;
  MESSAGE_CACHE.set(id, msg);
  if (MESSAGE_CACHE.size > MAX_CACHE) {
    const firstKey = MESSAGE_CACHE.keys().next().value;
    if (firstKey) MESSAGE_CACHE.delete(firstKey);
  }
}

function popMessage(id: string): proto.IWebMessageInfo | undefined {
  const m = MESSAGE_CACHE.get(id);
  if (m) MESSAGE_CACHE.delete(id);
  return m;
}

function pickOwnerJid(): string {
  return `${CONFIG.DEV_NUMBER}@s.whatsapp.net`;
}

/**
 * Build a human-readable summary + forward the deleted payload.
 */
async function forwardDeleted(
  sock: WASocket,
  deleted: proto.IWebMessageInfo,
  deletedBy: string,
  chatJid: string
) {
  const ownerJid = pickOwnerJid();
  const msg = deleted.message || {};
  const sender = normalizeNumber(deleted.key?.participant || deleted.key?.remoteJid || '');
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });

  // Header info
  const meta = [
    '╭━━━〔 🩸 *ANTI-DELETE* 〕━━━╮',
    '┃',
    `┃ 🗑️ DELETED BY : ${deletedBy}`,
    `┃ 👤 ORIGINAL  : ${sender}`,
    `┃ 💬 CHAT      : ${chatJid}`,
    `┃ 🕒 TIME      : ${when}`,
    '┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
  ].join('\n');

  await sock.sendMessage(ownerJid, { text: meta }).catch(() => {});

  // Forward the actual content
  try {
    if (msg.conversation || msg.extendedTextMessage?.text) {
      const text = msg.conversation || msg.extendedTextMessage?.text || '';
      await sock.sendMessage(ownerJid, {
        text: `📝 *Deleted text:*\n\n${text}`,
      });
      return;
    }

    if (msg.imageMessage) {
      await sock.sendMessage(ownerJid, {
        image: await downloadAs(sock, deleted, 'buffer'),
        caption: `🖼️ *Deleted image*\n${msg.imageMessage.caption || ''}`,
        mimetype: msg.imageMessage.mimetype || 'image/jpeg',
      });
      return;
    }

    if (msg.videoMessage) {
      await sock.sendMessage(ownerJid, {
        video: await downloadAs(sock, deleted, 'buffer'),
        caption: `🎥 *Deleted video*\n${msg.videoMessage.caption || ''}`,
        mimetype: msg.videoMessage.mimetype || 'video/mp4',
      });
      return;
    }

    if (msg.audioMessage) {
      await sock.sendMessage(ownerJid, {
        audio: await downloadAs(sock, deleted, 'buffer'),
        mimetype: msg.audioMessage.mimetype || 'audio/mp4',
        ptt: !!msg.audioMessage.ptt,
      });
      return;
    }

    if (msg.documentMessage) {
      await sock.sendMessage(ownerJid, {
        document: await downloadAs(sock, deleted, 'buffer'),
        fileName: msg.documentMessage.fileName || 'document',
        mimetype: msg.documentMessage.mimetype || 'application/octet-stream',
      });
      return;
    }

    if (msg.stickerMessage) {
      await sock.sendMessage(ownerJid, {
        sticker: await downloadAs(sock, deleted, 'buffer'),
      });
      return;
    }

    // Fallback
    await sock.sendMessage(ownerJid, {
      text: `⚠️ *Deleted message type:* ${Object.keys(msg).join(', ') || 'unknown'}`,
    });
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'antidelete forward failed');
    await sock.sendMessage(ownerJid, {
      text: `⚠️ Could not forward deleted content: ${(e as Error).message}`,
    }).catch(() => {});
  }
}

async function downloadAs(sock: WASocket, msg: proto.IWebMessageInfo, _type: 'buffer'): Promise<Buffer> {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  return downloadMediaMessage(msg as any, 'buffer', {});
}

export function attachAntiDelete(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    const enabled = getRuntime().antidelete;
    for (const msg of messages) {
      if (!enabled) {
        // Still cache so we can capture deletes if enabled later in the same session
        cacheMessage(msg);
        continue;
      }

      const m = msg.message;
      if (!m) continue;

      // Detect revoke (delete)
      const proto = m.protocolMessage;
      if (proto && proto.type === 0 /* REVOKE */) {
        const targetId = proto.key?.id;
        if (!targetId) continue;
        const original = popMessage(targetId);
        if (!original) {
          // We don't have the original — inform owner
          await sock
            .sendMessage(`${CONFIG.DEV_NUMBER}@s.whatsapp.net`, {
              text:
                `🗑️ *A message was deleted* in ${msg.key?.remoteJid}\n` +
                `(Content unavailable — was sent before antidelete was enabled.)`,
            })
            .catch(() => {});
          continue;
        }

        const deletedBy = normalizeNumber(
          msg.key?.participant || msg.key?.remoteJid || ''
        );
        await forwardDeleted(sock, original, deletedBy, msg.key?.remoteJid || '');
        continue;
      }

      // Cache everything else for later revocation detection
      cacheMessage(msg);
    }
  });
}