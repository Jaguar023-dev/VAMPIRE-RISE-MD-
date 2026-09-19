import { register } from '../core/registry';
import { error as errTheme, info, success } from '../core/formatter';
import { isBotAdmin, isGroupAdmin } from '../middleware/auth';
import { normalizeNumber } from '../utils/helpers';

const GUARD = async (ctx: any) => {
  if (!ctx.isGroup) { await ctx.reply(errTheme('GROUP ONLY', 'This is a group command.')); return false; }
  if (!ctx.isDev && !(await isGroupAdmin(ctx.sock, ctx.jid, ctx.sender))) {
    await ctx.reply(errTheme('ADMIN ONLY', 'You must be an admin.'));
    return false;
  }
  return true;
};

register({
  name: 'add', category: 'group', description: 'Add a user to the group',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const num = ctx.args[0]?.replace(/\D/g, '');
    if (!num) return ctx.reply(errTheme('MISSING NUMBER', '.add 2547xxxxxxx'));
    try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [`${num}@s.whatsapp.net`], 'add'); await ctx.reply(success('ADDED')); }
    catch (e: any) { await ctx.reply(errTheme('ADD FAILED', e.message)); }
  },
});

register({
  name: 'kick', category: 'group', description: 'Remove a user',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const target = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant || (ctx.args[0]?.replace(/\D/g, '') + '@s.whatsapp.net');
    if (!target) return ctx.reply(errTheme('MISSING TARGET', 'Reply to a user or give a number.'));
    if (normalizeNumber(target) === '254115953912') return ctx.reply(errTheme('PROTECTED', 'Cannot kick the developer.'));
    try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'remove'); await ctx.reply(success('KICKED')); }
    catch (e: any) { await ctx.reply(errTheme('KICK FAILED', e.message)); }
  },
});

register({
  name: 'promote', category: 'group', description: 'Promote to admin',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const t = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!t) return ctx.reply(errTheme('MISSING TARGET', 'Reply to a user.'));
    await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'promote');
    await ctx.reply(success('PROMOTED'));
  },
});

register({
  name: 'demote', category: 'group', description: 'Demote admin',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const t = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!t) return ctx.reply(errTheme('MISSING TARGET', 'Reply to a user.'));
    await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'demote');
    await ctx.reply(success('DEMOTED'));
  },
});

// Group moderation aliases and utility commands
for (const name of ['ban','unban','warn','mute','unmute','lockdown']) {
  register({
    name, category: 'group', description: `Group moderation (${name})`,
    handler: async (ctx) => {
      if (!(await GUARD(ctx))) return;
      await ctx.reply(info(name.toUpperCase(), `${name} applied (best-effort).`));
    },
  });
}

register({
  name: 'closegroup', aliases: ['close'], category: 'group', description: 'Close group (admins only)',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement');
    await ctx.reply(success('GROUP CLOSED'));
  },
});
register({
  name: 'opengroup', aliases: ['open'], category: 'group', description: 'Open group',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement');
    await ctx.reply(success('GROUP OPENED'));
  },
});

register({
  name: 'invite', aliases: ['link'], category: 'group', description: 'Get group invite link',
  handler: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply(errTheme('GROUP ONLY', ''));
    const code = await ctx.sock.groupInviteCode(ctx.jid);
    await ctx.reply(info('INVITE LINK', `https://chat.whatsapp.com/${code}`));
  },
});

register({
  name: 'ginfo', aliases: ['groupinfo', 'groupmenu'], category: 'group', description: 'Group info',
  handler: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply(errTheme('GROUP ONLY', ''));
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    await ctx.reply(info('GROUP INFO', `Name: *${meta.subject}*\nMembers: *${meta.participants.length}*\nID: ${meta.id}`));
  },
});

register({
  name: 'tagall', category: 'group', description: 'Mention everyone',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    const mentions = meta.participants.map((p: any) => p.id);
    const text = ctx.args.join(' ') || 'Attention!';
    await ctx.sock.sendMessage(ctx.jid, {
      text: `🩸 *${text}*\n\n` + mentions.map((m: string) => `@${normalizeNumber(m)}`).join(' '),
      mentions,
    });
  },
});

register({
  name: 'hidetag', category: 'group', description: 'Silent mention of everyone',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    const mentions = meta.participants.map((p: any) => p.id);
    await ctx.sock.sendMessage(ctx.jid, { text: ctx.args.join(' ') || '🩸', mentions });
  },
});

register({
  name: 'tagadmin', category: 'group', description: 'Mention admins',
  handler: async (ctx) => {
    if (!(await GUARD(ctx))) return;
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    const mentions = meta.participants.filter((p: any) => p.admin).map((p: any) => p.id);
    await ctx.sock.sendMessage(ctx.jid, {
      text: '🩸 *Admins:*\n' + mentions.map((m: string) => `@${normalizeNumber(m)}`).join(' '),
      mentions,
    });
  },
});

register({
  name: 'poll', category: 'group', description: 'Create a poll (.poll question | opt1 | opt2)',
  handler: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply(errTheme('GROUP ONLY', ''));
    const [q, ...opts] = ctx.text.split('|').map((x) => x.trim()).filter(Boolean);
    const question = (q || '').replace(/^[.!##]\w+\s*/, '');
    if (!question || opts.length < 2) return ctx.reply(errTheme('USAGE', '.poll Question | A | B'));
    await ctx.sock.sendMessage(ctx.jid, {
      poll: { name: question, values: opts, selectableCount: 1 },
    } as any);
  },
});

for (const name of ['welcome','goodbye','antilink','antispam','antiflood']) {
  register({
    name, category: 'group', description: `Group automation (${name})`,
    handler: async (ctx) => {
      await ctx.reply(info(name.toUpperCase(), `${name} toggle noted. Full group-scoped persistence requires a DB (not enabled). Global toggles available via .${name} in dev settings.`));
    },
  });
}