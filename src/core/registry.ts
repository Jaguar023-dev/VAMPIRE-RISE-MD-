// src/core/registry.ts
export interface CommandContext {
  sock: any;
  msg: any;
  jid: string;
  sender: string;
  senderNumber: string;
  isGroup: boolean;
  isDev: boolean;
  isFromMe: boolean;
  prefix: string;
  command: string;
  args: string[];
  text: string;
  reply: (text: string, mentions?: string[]) => Promise<any>;
  react: (emoji: string) => Promise<any>;
  quoted: any;
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
  handler: (ctx: CommandContext) => Promise<void>;
}

const commands = new Map<string, Command>();
const byName = new Map<string, Command>();

export function register(cmd: Command) {
  byName.set(cmd.name.toLowerCase(), cmd);
  commands.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const a of cmd.aliases) commands.set(a.toLowerCase(), cmd);
  }
}

export function getCommand(name: string): Command | undefined {
  return commands.get(name.toLowerCase());
}

export function getAllCommands(): Command[] {
  const seen = new Set<string>();
  const out: Command[] = [];
  for (const c of commands.values()) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    out.push(c);
  }
  return out;
}