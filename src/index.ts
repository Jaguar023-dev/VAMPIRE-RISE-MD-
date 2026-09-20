import './commands/_index';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';

import { CONFIG, ensureDirs, loadRuntime, getRuntime } from './core/config';
import { initAuthState } from './core/session';
import { attachMessageHandler } from './handlers/message';
import { attachStatusAutomation } from './automation/status';
import { attachPresence } from './automation/presence';
import { logger, banner } from './utils/logger';
import { formatUptime } from './utils/helpers';
import './providers/ai';
import './providers/news';
import { attachAntiDelete } from './automation/antidelete';
import { attachViewOnceForwarder } from './automation/viewonce';
import { attachAntiGroupMention } from './automation/antigroupmention';

ensureDirs();
loadRuntime();

const startTime = Date.now();
let sock: ReturnType<typeof makeWASocket> | null = null;
let shuttingDown = false;

async function start() {
  banner('VAMPIRE RISE MD — AWAKENING');
  const { state, saveCreds } = await initAuthState();
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: logger.child({ module: 'baileys' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as any),
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info('Scan the QR code to pair.');
    }
    if (connection === 'open') {
      logger.info('✅ Connected to WhatsApp.');
      await onConnected();
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      logger.warn({ code }, 'Connection closed.');
      if (shouldReconnect && !shuttingDown) {
        setTimeout(() => start().catch((e) => logger.error(e)), 3000);
      } else {
        logger.error('Logged out. Please re-authenticate.');
        process.exit(0);
      }
    }
  });

    attachMessageHandler(sock);
  attachStatusAutomation(sock);
  attachPresence(sock);
  attachAntiDelete(sock);            
  attachViewOnceForwarder(sock);     
  attachAntiGroupMention(sock);      

  // Anti-call
  sock.ev.on('call', async (calls) => {
    if (!getRuntime().anticall) return;
    for (const c of calls) {
      try { await sock!.rejectCall(c.id, c.from); } catch {}
    }
  });
}

async function onConnected() {
  const r = getRuntime();
  const self = sock?.user?.id || '';
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });

  const startup = [
    '╭━━━〔 🩸 *VAMPIRE RISE MD* 〕━━━╮',
    '┃',
    '┃ 🧛 *AWAKENING…*',
    '┃ ━━━━━━━━━━━━━━━━━━━━━',
    '┃ 🔌 CONNECTION : ESTABLISHED',
    '┃ 🔐 SESSION    : ACTIVATED',
    '┃ 🟢 ONLINE     : YES',
    '┃ ⚡ ACTIVE     : YES',
    '┃ 🩸 AWAKENED   : YES',
    `┃ 🕒 TIME       : ${now}`,
    '┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    `🩸 *${CONFIG.BOT_NAME}*`,
    `> 🦇 ${CONFIG.DEVELOPER}`,
  ].join('\n');

  // Notify self (the bot's own chat) so the owner sees startup.
  try {
    if (self) await sock!.sendMessage(self, { text: startup });
  } catch {}

  // Play startup audio if file exists
  try {
    if (self && fs.existsSync(CONFIG.STARTUP_AUDIO)) {
      const buffer = fs.readFileSync(CONFIG.STARTUP_AUDIO);
      await sock!.sendMessage(self, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
    }
  } catch (e) {
    logger.debug({ err: (e as Error).message }, 'startup audio failed');
  }

  logger.info({ mode: r.mode, prefix: r.prefix }, 'VAMPIRE RISE MD is online.');
}

// ---------- Health server ----------
const app = express();
app.get('/', (_req, res) => res.json({ status: 'ok', bot: CONFIG.BOT_NAME }));
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    bot: CONFIG.BOT_NAME,
    developer: CONFIG.DEVELOPER,
    uptime: formatUptime((Date.now() - startTime) / 1000),
    mode: getRuntime().mode,
    prefix: getRuntime().prefix,
    connected: !!sock?.user,
  });
});
app.listen(CONFIG.PORT, () => logger.info(`/health on port ${CONFIG.PORT}`));

// ---------- Graceful shutdown ----------
async function shutdown(sig: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${sig}, shutting down…`);
  try { await sock?.logout().catch(() => {}); } catch {}
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (e) => logger.error({ err: (e as any)?.message }, 'unhandledRejection'));
process.on('uncaughtException', (e) => logger.error({ err: e.message }, 'uncaughtException'));

// ---------- Boot ----------
start().catch((e) => {
  logger.error(e, 'Fatal startup error');
  process.exit(1);
});