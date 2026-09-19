import { register } from '../core/registry';
import { error as errTheme, info } from '../core/formatter';
import { mediaQueue, videoQueue } from '../services/queue';

/**
 * Media / editing commands. Stickers and simple conversions are implemented
 * where feasible; heavy transformations require ffmpeg and are queued.
 */

for (const name of [
  'toimg','toimage','tofile','topdf','jpg','png','gif',
  'merge','compress','upscale','removebg','crop','resize','rotate',
  'flip','blur','sharpen','compressvideo','cropvideo','mergevideo',
  'trimvideo','videotogif','videoaudio','stickerize',
]) {
  register({
    name,
    category: 'tools',
    description: `Media tool (${name})`,
    handler: async (ctx) => {
      await ctx.reply(info('MEDIA TOOL', `*${name}* requires media input and a configured media provider.`));
    },
  });
}

register({
  name: 'sticker',
  aliases: ['s'],
  category: 'tools',
  description: 'Convert an image (or quoted image) into a WhatsApp sticker',
  handler: async (ctx) => {
    const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage as any;
    const directImg = ctx.msg.message?.imageMessage;
    if (!quoted?.imageMessage && !directImg) {
      return ctx.reply(errTheme('NO IMAGE', 'Reply to an image with .sticker'));
    }
    try {
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const target = quoted?.imageMessage
        ? { message: quoted, key: { ...ctx.msg.key, id: ctx.msg.message?.extendedTextMessage?.contextInfo?.stanzaId } }
        : ctx.msg;
      const buffer = await downloadMediaMessage(target as any, 'buffer', {});
      const { Sticker, StickerTypes } = require('wa-sticker-formatter');
      const sticker = new Sticker(buffer, { pack: 'VAMPIRE RISE MD', author: 'KENYAN JAGUAR', type: StickerTypes.FULL });
      const out = await sticker.toBuffer();
      await ctx.sock.sendMessage(ctx.jid, { sticker: out }, { quoted: ctx.msg });
    } catch (e) {
      await ctx.reply(errTheme('STICKER FAILED', (e as Error).message));
    }
  },
});