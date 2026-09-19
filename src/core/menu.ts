import fs from 'fs';
import path from 'path';
import { allCommands } from './registry';
import { getRuntime } from './config';
import { CONFIG } from './config';

const CATS_PATH = path.resolve('config/categories.json');

interface Cat { title: string; order: number; enabled: boolean }
type Cats = Record<string, Cat>;

function loadCats(): Cats {
  try {
    return JSON.parse(fs.readFileSync(CATS_PATH, 'utf-8')) as Cats;
  } catch {
    return {};
  }
}

export function enabledCategories(): Array<{ key: string; title: string; order: number }> {
  const cats = loadCats();
  return Object.entries(cats)
    .filter(([, c]) => c.enabled)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, c]) => ({ key, title: c.title, order: c.order }));
}

export function buildMainMenu(): string {
  const cats = enabledCategories();
  const r = getRuntime();
  const lines: string[] = [];
  lines.push('╭━━━〔 🩸 *VAMPIRE RISE MD* 〕━━━╮');
  lines.push('┃');
  lines.push('┃ 🧛 *MAIN MENU*');
  lines.push('┃ ━━━━━━━━━━━━━━━━━━━━━━━━━');
  cats.forEach((c, i) => {
    lines.push(`┃ ${String(i + 1).padStart(2, '0')}. ${c.title}`);
  });
  lines.push('┃ ━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`┃ ⚙️ PREFIX  : ${r.prefix}`);
  lines.push(`┃ 🛡️ MODE    : ${r.mode.toUpperCase()}`);
  lines.push('┃');
  lines.push('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
  lines.push('');
  lines.push('🩸 *Reply with a category number.*');
  lines.push('> 🦇 ' + CONFIG.DEVELOPER);
  return lines.join('\n');
}

export function buildCategoryMenu(key: string): string | null {
  const cats = enabledCategories();
  const idx = cats.findIndex((c) => c.key === key);
  if (idx < 0) return null;
  const cat = cats[idx];
  const cmds = allCommands()
    .filter((c) => c.category === key && !c.hidden && !c.devOnly)
    .sort((a, b) => a.name.localeCompare(b.name));
  const lines: string[] = [];
  lines.push(`╭━━━〔 ${cat.title} 〕━━━╮`);
  lines.push('┃');
  cmds.forEach((c, i) => {
    lines.push(`┃ ${String(i + 1).padStart(2, '0')}. ${c.name} — ${c.description}`);
  });
  lines.push('┃');
  lines.push('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
  lines.push('');
  lines.push('💬 *.back* → main menu   *.home* → home');
  lines.push('> 🦇 ' + CONFIG.DEVELOPER);
  return lines.join('\n');
}

export function getCategoryByIndex(i: number) {
  const cats = enabledCategories();
  return cats[i - 1];
}