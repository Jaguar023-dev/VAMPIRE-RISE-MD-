import type { CommandContext } from '../core/registry';
import { buildCategoryMenu, getCategoryByIndex } from '../core/menu';
import { getRuntime, CONFIG } from '../core/config';
import { error as errTheme } from '../core/formatter';

const MENU_STATE = new Map<string, { shownAt: number; ctx: 'main' | string }>();

export function setMenuState(jid: string, state: 'main' | string) {
  MENU_STATE.set(jid, { shownAt: Date.now(), ctx: state });
}

export function getMenuState(jid: string) {
  return MENU_STATE.get(jid);
}

/**
 * Detects numeric replies to a menu, and .back / .home shortcuts.
 * Returns true if the message was consumed.
 */
export async function handleMenuReply(ctx: CommandContext): Promise<boolean> {
  const raw = ctx.text.trim().toLowerCase();
  if (!raw) return false;

  // .back / .home / 0 / "menu" -> main menu
  if (['back', 'home', '0', '.back', '.home'].includes(raw) || raw === 'menu' || raw === '.menu') {
    await sendMainMenu(ctx);
    return true;
  }

  // Numeric reply to a main menu (1..N)
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= 20) {
    const state = MENU_STATE.get(ctx.jid);
    // Only interpret number if a main menu was recently shown (5 min window)
    if (state && state.ctx === 'main' && Date.now() - state.shownAt < 5 * 60_000) {
      const cat = getCategoryByIndex(n);
      if (!cat) {
        await ctx.reply(errTheme('INVALID CATEGORY', `No category number ${n}.`));
        return true;
      }
      const body = buildCategoryMenu(cat.key);
      if (!body) return true;
      const r = getRuntime();
      await ctx.sock.sendMessage(ctx.jid, { image: { url: r.banner }, caption: body }, { quoted: ctx.msg });
      setMenuState(ctx.jid, cat.key);
      return true;
    }
  }
  return false;
}

async function sendMainMenu(ctx: CommandContext) {
  const { buildMainMenu } = require('../core/menu');
  const body = buildMainMenu();
  const r = getRuntime();
  await ctx.sock.sendMessage(
    ctx.jid,
    { image: { url: r.banner || CONFIG.BOT_NAME }, caption: body },
    { quoted: ctx.msg }
  );
  setMenuState(ctx.jid, 'main');
}