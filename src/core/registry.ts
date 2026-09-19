import type { WASocket, proto } from '@whiskeysockets/baileys';

export interface CommandContext {
  sock: WASocket;
  msg: proto.IWebMessageInfo;
  jid: string;
  sender: string;
  senderNumber: string;
  isGroup: boolean;
  isDev: boolean;
  fromMe: boolean;
  prefix: string;
  command: string;
  args: string[];
  text: string;
  reply: (text: string, mentions?: string[]) => Promise<any>;
  react: (emoji: string) => Promise<any>;
  quoted?: proto.IMessage | null;
}

export interface Command {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  devOnly?: boolean;
  adminOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  hidden?: boolean;
  handler: (ctx: CommandContext) => Promise<any>;
}

const map = new Map<string, Command>();

export function register(cmd: Command) {
  map.set(cmd.name.toLowerCase(), cmd);
  for (const a of cmd.aliases || []) map.set(a.toLowerCase(), cmd);
}

export function getCommand(name: string): Command | undefined {
  return map.get(name.toLowerCase());
}

export function allCommands(): Command[] {
  const seen = new Set<string>();
  const out: Command[] = [];
  for (const c of map.values()) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    out.push(c);
  }
  return out;
}