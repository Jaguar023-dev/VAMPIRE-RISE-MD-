import fs from 'fs';
import path from 'path';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { CONFIG } from './config';
import { logger } from '../utils/logger';

const SESSION_DIR = path.resolve('session');

export async function initAuthState() {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  // If SESSION_ID is provided as base64 credentials, materialize it once.
  const credsPath = path.join(SESSION_DIR, 'creds.json');
  if (CONFIG.SESSION_ID && !fs.existsSync(credsPath)) {
    try {
      const decoded = Buffer.from(CONFIG.SESSION_ID, 'base64').toString('utf-8');
      // Could be either a full creds.json content or "creds.json content" from some generators.
      const parsed = JSON.parse(decoded);
      fs.writeFileSync(credsPath, JSON.stringify(parsed, null, 2));
      logger.info('Session materialised from SESSION_ID');
    } catch (e) {
      logger.warn('Failed to decode SESSION_ID — falling back to QR pairing.');
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  return { state, saveCreds };
}

export function sessionFolder() {
  return SESSION_DIR;
}