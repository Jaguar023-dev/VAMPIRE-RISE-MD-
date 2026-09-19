import { CONFIG } from './config';

const W = 30;
const top = (title: string) =>
  `╭━━━〔 ${title} 〕${'━'.repeat(Math.max(0, W - title.length - 4))}╮`;
const bottom = '╰' + '━'.repeat(W) + '╯';

export const T = {
  title: (t: string) => top(t),
  bottom,
  row: (label: string, value: string) => `┃ ${label.padEnd(9)}: ${value}`,
  split: '┃ ━━━━━━━━━━━━━━━━━━━━━━━━━',
  blank: '┃',
  footer: `\n🩸 *${CONFIG.BOT_NAME}*\n> 🦇 ${CONFIG.DEVELOPER}`,
};

export function box(title: string, rows: Array<[string, string]>): string {
  const out = [T.title(title), T.blank];
  for (const [k, v] of rows) out.push(T.row(k, v));
  out.push(T.blank, T.bottom);
  return out.join('\n') + T.footer;
}

export function success(title: string, body?: string) {
  return `${T.title('✅ ' + title)}\n┃\n┃ ${body || 'Done.'}\n┃\n${T.bottom}${T.footer}`;
}

export function error(title: string, body?: string) {
  return `${T.title('⚠️ ' + title)}\n┃\n┃ ${body || 'Something went wrong.'}\n┃\n${T.bottom}${T.footer}`;
}

export function info(title: string, body?: string) {
  return `${T.title('🧛 ' + title)}\n┃\n┃ ${body || ''}\n┃\n${T.bottom}${T.footer}`;
}

export function theme(body: string, title = 'VAMPIRE RISE MD') {
  return `${T.title(title)}\n┃\n${body}\n┃\n${T.bottom}${T.footer}`;
}