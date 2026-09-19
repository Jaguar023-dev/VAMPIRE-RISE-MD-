import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RUNTIME_PATH = path.resolve('config/runtime.json');

export interface Runtime {
  prefix: string;
  mode: 'private' | 'public';
  banner: string;
  chatbot: boolean;
  autoviewstatus: boolean;
  autoreadstatus: boolean;
  autodownloadstatus: boolean;
  autoreactstatus: boolean;
  autoreplystatus: boolean;
  autoread: boolean;
  autotyping: boolean;
  autorecording: boolean;
  alwaysonline: boolean;
  anticall: boolean;
  antilink: boolean;
  antispam: boolean;
  antiflood: boolean;
  antidelete: boolean;
  autobio: boolean;
  vars: Record<string, any>;
}

export const DEFAULTS: Runtime = {
  prefix: '.',
  mode: 'private',
  banner: 'https://files.catbox.moe/9lcczo.jpg',
  chatbot: false,
  autoviewstatus: false,
  autoreadstatus: false,
  autodownloadstatus: false,
  autoreactstatus: false,
  autoreplystatus: false,
  autoread: false,
  autotyping: false,
  autorecording: false,
  alwaysonline: false,
  anticall: false,
  antilink: false,
  antispam: false,
  antiflood: false,
  antidelete: false,
  autobio: false,
  vars: {},
};

export const CONFIG = {
  BOT_NAME: 'VAMPIRE RISE MD',
  DEVELOPER: 'KENYAN JAGUAR',
  DEV_NUMBER: '254115953912',
  SESSION_ID: process.env.SESSION_ID || '',
  PORT: parseInt(process.env.PORT || '3000', 10),
  ALLOWED_PREFIXES: ['.', '!', '#'] as string[],
  STARTUP_AUDIO: path.resolve('assets/startup.mp3'),
  TMP_DIR: path.resolve('tmp'),
};

let runtime: Runtime = { ...DEFAULTS };
let saveTimer: NodeJS.Timeout | null = null;

export function loadRuntime(): Runtime {
  try {
    if (fs.existsSync(RUNTIME_PATH)) {
      const data = JSON.parse(fs.readFileSync(RUNTIME_PATH, 'utf-8'));
      runtime = { ...DEFAULTS, ...data };
    } else {
      persist(true);
    }
  } catch {
    runtime = { ...DEFAULTS };
  }
  return runtime;
}

export function getRuntime(): Runtime {
  return runtime;
}

export function setRuntime(patch: Partial<Runtime>) {
  runtime = { ...runtime, ...patch };
  persist();
}

function persist(immediate = false) {
  const write = () => {
    try {
      fs.mkdirSync(path.dirname(RUNTIME_PATH), { recursive: true });
      fs.writeFileSync(RUNTIME_PATH, JSON.stringify(runtime, null, 2));
    } catch {
      /* ignore */
    }
  };
  if (immediate) return write();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 250);
}

export function ensureDirs() {
  for (const d of [path.resolve('config'), CONFIG.TMP_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}