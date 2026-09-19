// src/core/config.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RUNTIME_PATH = path.resolve('config/runtime.json');

interface Runtime {
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
  vars: Record<string, any>;
}

const DEFAULTS: Runtime = {
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
  vars: {},
};

let runtime: Runtime = { ...DEFAULTS };
let saveTimer: NodeJS.Timeout | null = null;

export function loadRuntime() {
  try {
    if (fs.existsSync(RUNTIME_PATH)) {
      const data = JSON.parse(fs.readFileSync(RUNTIME_PATH, 'utf-8'));
      runtime = { ...DEFAULTS, ...data };
    } else {
      saveRuntime(true);
    }
  } catch (e) {
    runtime = { ...DEFAULTS };
  }
  return runtime;
}

export function getRuntime(): Runtime {
  return runtime;
}

export function setRuntime(patch: Partial<Runtime>) {
  runtime = { ...runtime, ...patch };
  saveRuntime();
}

function saveRuntime(immediate = false) {
  if (immediate) {
    fs.mkdirSync(path.dirname(RUNTIME_PATH), { recursive: true });
    fs.writeFileSync(RUNTIME_PATH, JSON.stringify(runtime, null, 2));
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(RUNTIME_PATH), { recursive: true });
      fs.writeFileSync(RUNTIME_PATH, JSON.stringify(runtime, null, 2));
    } catch {}
  }, 250);
}

export const CONFIG = {
  BOT_NAME: 'VAMPIRE RISE MD',
  DEVELOPER: 'KENYAN JAGUAR',
  DEV_NUMBER: '254115953912',
  SESSION_ID: process.env.SESSION_ID || '',
  PORT: parseInt(process.env.PORT || '3000'),
  ALLOWED_PREFIXES: ['.', '!', '#'],
};