import { CONFIG, getRuntime } from '../core/config';
import { normalizeNumber } from '../utils/helpers';

export function isDeveloper(jid: string): boolean {
  return normalizeNumber(jid) === CONFIG.DEV_NUMBER;
}

export function canUseCommand(senderJid: string, devOnly = false): { ok: boolean; reason?: string } {
  if (isDeveloper(senderJid)) return { ok: true };
  if (devOnly) return { ok: false, reason: 'Developer only.' };
  const r = getRuntime();
  if (r.mode === 'private') return { ok: false, reason: 'Bot is in private mode.' };
  return { ok: true };
}

export async function isGroupAdmin(sock: any, groupJid: string, userJid: string): Promise<boolean> {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const p = meta.participants.find((x: any) => x.id === userJid);
    return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'));
  } catch {
    return false;
  }
}

export async function isBotAdmin(sock: any, groupJid: string): Promise<boolean> {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const self = normalizeNumber(sock.user?.id || '');
    const p = meta.participants.find((x: any) => normalizeNumber(x.id) === self);
    return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'));
  } catch {
    return false;
  }
}