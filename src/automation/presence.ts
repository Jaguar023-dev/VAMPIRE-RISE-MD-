import type { WASocket } from '@whiskeysockets/baileys';
import { getRuntime } from '../core/config';

export function attachPresence(sock: WASocket) {
  setInterval(async () => {
    const r = getRuntime();
    try {
      if (r.alwaysonline) {
        await sock.sendPresenceUpdate('available').catch(() => {});
      }
      if (r.autotyping) {
        await sock.sendPresenceUpdate('composing').catch(() => {});
      } else if (r.autorecording) {
        await sock.sendPresenceUpdate('recording').catch(() => {});
      }
    } catch { /* noop */ }
  }, 30_000);
}