import type { WASocket, proto } from '@whiskeysockets/baileys';
import { getRuntime } from '../core/config';
import { statusQueue } from '../services/queue';
import { logger } from '../utils/logger';

const processed = new Set<string>();

export function attachStatusAutomation(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    const r = getRuntime();
    for (const msg of messages) {
      const jid = msg.key?.remoteJid || '';
      if (!jid.startsWith('status@broadcast')) continue;
      const id = msg.key?.id || '';
      if (!id || processed.has(id)) continue;
      processed.add(id);
      if (processed.size > 2000) {
        const arr = Array.from(processed).slice(-1000);
        processed.clear();
        arr.forEach((x) => processed.add(x));
      }

      statusQueue.add(async () => {
        try {
          if (r.autoviewstatus) {
            await sock.readMessages([msg.key]).catch(() => {});
          }
          if (r.autoreadstatus) {
            await sock.readMessages([msg.key]).catch(() => {});
          }
          if (r.autoreactstatus) {
            const emojis = ['🩸','🦇','🧛','🌙','🖤'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } } as any).catch(() => {});
          }
          if (r.autodownloadstatus) {
            // Downloading status media is not universally supported — log only.
            logger.info({ id }, 'autodownloadstatus: media preservation requested (soft no-op)');
          }
        } catch (e) {
          logger.debug({ err: (e as Error).message }, 'status task failed');
        }
      }, id);
    }
  });
}