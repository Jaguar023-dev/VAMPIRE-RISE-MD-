import { getRuntime, setRuntime } from '../core/config';
import { runFirst } from '../providers';
import { logger } from '../utils/logger';

const seen = new Set<string>();

export function isChatbotOn() {
  return getRuntime().chatbot;
}

export function setChatbot(on: boolean) {
  setRuntime({ chatbot: on });
}

export async function chatbotReply(prompt: string, msgId: string): Promise<string | null> {
  if (!isChatbotOn()) return null;
  if (seen.has(msgId)) return null;
  seen.add(msgId);
  if (seen.size > 500) {
    // Prevent unbounded memory; keep last 250
    const arr = Array.from(seen).slice(-250);
    seen.clear();
    arr.forEach((x) => seen.add(x));
  }
  try {
    const { result } = await runFirst('ai', prompt);
    return String(result || '').slice(0, 4000);
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'chatbot ai failed');
    return null;
  }
}