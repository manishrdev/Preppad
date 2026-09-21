// Bring-your-own-key AI top-up. Calls go straight from the browser to the provider,
// so the key never touches any server of ours. Keys are stored only in this browser.
import { LEVELS, topicName } from '../data/index.js';

export const PROVIDERS = {
  gemini: { label: 'Google Gemini (free tier available)', model: 'gemini-2.0-flash', link: 'https://aistudio.google.com/apikey' },
  anthropic: { label: 'Anthropic Claude', model: 'claude-sonnet-4-5', link: 'https://console.anthropic.com/settings/keys' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', link: 'https://platform.openai.com/api-keys' },
};

async function callModel(cfg, system, user) {
  const model = cfg.model || PROVIDERS[cfg.provider].model;
  if (!cfg.key) throw new Error('Add an API key in Settings first.');
  let res;
  if (cfg.provider === 'gemini') {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error?.message || `Gemini error ${res.status}`);
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  }
  if (cfg.provider === 'anthropic') {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 4096, system, messages: [{ role: 'user', content: user }] }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error?.message || `Anthropic error ${res.status}`);
    return j.content?.map((c) => c.text).join('') || '';
  }
  res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error?.message || `OpenAI error ${res.status}`);
  return j.choices?.[0]?.message?.content || '';
}

function parseJSON(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('The model did not return valid JSON. Try again.');
  }
}

const uid = () => Math.random().toString(36).slice(2, 9);

export async function generateQuestions(cfg, { topic, custom, level, years, count }) {
  const subject = custom?.trim() || topicName(topic);
  const lv = LEVELS.find((l) => l.id === level);
  const system = 'You are a senior engineering interviewer. Reply with JSON only.';
  const user = `Create ${count} highly-asked, realistic interview questions on "${subject}" for a candidate with about ${years} years of experience (${lv.name} level).
Cover a mix of concept, practical and scenario questions appropriate for that level. Answers must be accurate, concise (2-5 sentences, plain text; use \\n for short code) and mention trade-offs where relevant.
Return exactly: {"questions":[{"q":"...","a":"..."}]}`;
  const data = parseJSON(await callModel(cfg, system, user));
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list) || !list.length) throw new Error('No questions returned.');
  return list
    .filter((x) => x.q && x.a)
    .map((x) => ({ id: `ai-${uid()}`, topic: custom ? 'custom' : topic, subject: custom?.trim() || undefined, level, q: String(x.q), a: String(x.a), source: 'ai' }));
}

export async function generateNote(cfg, { topic, custom, concept, level }) {
  const subject = custom?.trim() || topicName(topic);
  const lv = LEVELS.find((l) => l.id === level);
  const system = 'You are a friendly teacher who writes short hand-written style revision notes. Reply with JSON only.';
  const user = `Write a revision note explaining "${concept}" in the context of ${subject} for a ${lv.name} interview candidate.
Return exactly: {"title":"...","points":["4-6 short bullet phrases"],"code":"optional short code snippet or empty string","diagram":{"type":"flow","items":["3-5 short labels"]}}
Use "stack" instead of "flow" if the concept is layered. Keep labels under 22 characters.`;
  const n = parseJSON(await callModel(cfg, system, user));
  if (!n.title || !Array.isArray(n.points)) throw new Error('Note was malformed. Try again.');
  return {
    id: `ai-n-${uid()}`, topic: custom ? 'custom' : topic, source: 'ai',
    title: String(n.title), points: n.points.map(String), code: n.code || undefined,
    diagram: n.diagram?.items?.length ? { type: n.diagram.type === 'stack' ? 'stack' : 'flow', items: n.diagram.items.map(String) } : undefined,
  };
}
