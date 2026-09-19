import axios from 'axios';
import { addProvider } from './index';

/**
 * Lightweight AI providers. If keys are missing they throw, allowing fallback.
 * Add or remove providers at runtime via dev commands.
 */

addProvider({
  id: 'openai',
  type: 'ai',
  name: 'OpenAI',
  enabled: !!process.env.OPENAI_API_KEY,
  run: async (prompt: string) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY missing');
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 45000 }
    );
    return res.data.choices?.[0]?.message?.content?.trim() || '';
  },
});

addProvider({
  id: 'gemini',
  type: 'ai',
  name: 'Google Gemini',
  enabled: !!process.env.GEMINI_API_KEY,
  run: async (prompt: string) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY missing');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 45000 });
    return res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  },
});

addProvider({
  id: 'deepseek',
  type: 'ai',
  name: 'DeepSeek',
  enabled: !!process.env.DEEPSEEK_API_KEY,
  run: async (prompt: string) => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error('DEEPSEEK_API_KEY missing');
    const res = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
      },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 45000 }
    );
    return res.data.choices?.[0]?.message?.content?.trim() || '';
  },
});

addProvider({
  id: 'pollinations',
  type: 'ai',
  name: 'Pollinations (free fallback)',
  enabled: true,
  run: async (prompt: string) => {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url, { timeout: 45000 });
    return typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
  },
});

addProvider({
  id: 'pollinations-image',
  type: 'image',
  name: 'Pollinations Image',
  enabled: true,
  run: async (prompt: string) => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
    return Buffer.from(res.data);
  },
});