import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../core/config';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, '_').slice(0, 120);
}

export function tmpPath(ext: string): string {
  if (!fs.existsSync(CONFIG.TMP_DIR)) fs.mkdirSync(CONFIG.TMP_DIR, { recursive: true });
  return path.join(CONFIG.TMP_DIR, `${crypto.randomBytes(8).toString('hex')}.${ext}`);
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

export function normalizeNumber(jid: string): string {
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

export async function safeUnlink(p: string) {
  try { await fs.promises.unlink(p); } catch { /* noop */ }
}