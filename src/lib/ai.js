// Bring-your-own-key AI features. Calls go straight from the browser to the provider,
// so the key never touches any server of ours. Keys are stored only in this browser.
import { LEVELS, topicName } from '../data/index.js';

export const PROVIDERS = {
  gemini: { label: 'Google Gemini (free tier available)', model: 'gemini-3.6-flash', link: 'https://aistudio.google.com/apikey' },
  anthropic: { label: 'Anthropic Claude', model: 'claude-sonnet-4-5', link: 'https://console.anthropic.com/settings/keys' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', link: 'https://platform.openai.com/api-keys' },
};

/* ---------------- model discovery ----------------
   Model names get retired often. If a call fails because the model is gone, we ask the provider
   which models it currently offers, pick the newest suitable one, remember it, and retry once. */
const RESOLVED_KEY = 'preppad_ai_resolved_v1';
const readResolved = () => { try { return JSON.parse(localStorage.getItem(RESOLVED_KEY)) || {}; } catch { return {}; } };
const writeResolved = (provider, model) => {
  try { localStorage.setItem(RESOLVED_KEY, JSON.stringify({ ...readResolved(), [provider]: model })); } catch { /* ignore */ }
};
export const clearResolved = () => { try { localStorage.removeItem(RESOLVED_KEY); } catch { /* ignore */ } };
// A model the user typed (or saved earlier) that turned out to be retired is remembered as replaced.
export const effectiveModel = (cfg) => {
  const r = readResolved();
  if (cfg.model) return r[`${cfg.provider}:${cfg.model}`] || cfg.model;
  return r[cfg.provider] || PROVIDERS[cfg.provider].model;
};

const isModelProblem = (status, message = '') =>
  status === 404 || /no longer available|not found|is not supported|does not exist|deprecated|decommission|retired|unknown model|invalid model/i.test(message);

function fail(message, status) {
  const e = new Error(message);
  e.status = status;
  e.modelProblem = isModelProblem(status, message);
  return e;
}

export async function listModels(cfg) {
  if (!cfg.key) throw new Error('Add an API key first.');
  if (cfg.provider === 'gemini') {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': cfg.key } });
    const j = await res.json();
    if (!res.ok) throw fail(j.error?.message || `Gemini error ${res.status}`, res.status);
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
      .filter((id) => id.startsWith('gemini'));
  }
  if (cfg.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    });
    const j = await res.json();
    if (!res.ok) throw fail(j.error?.message || `Anthropic error ${res.status}`, res.status);
    return (j.data || []).map((m) => m.id);
  }
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${cfg.key}` } });
  const j = await res.json();
  if (!res.ok) throw fail(j.error?.message || `OpenAI error ${res.status}`, res.status);
  return (j.data || []).sort((a, b) => (b.created || 0) - (a.created || 0)).map((m) => m.id)
    .filter((id) => /^gpt-/.test(id) && !/audio|realtime|image|transcribe|tts|search|instruct|embedding|moderation/.test(id));
}

const version = (id) => (id.match(/(\d+(?:\.\d+)*)/) || [0])[0].split('.').map(Number);
const cmpVersionDesc = (a, b) => {
  const x = version(a); const y = version(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((y[i] || 0) !== (x[i] || 0)) return (y[i] || 0) - (x[i] || 0);
  return 0;
};

export function pickBest(provider, ids) {
  if (!ids.length) return null;
  if (provider === 'gemini') {
    const stable = ids.filter((id) => /^gemini-[\d.]+-flash$/.test(id)).sort(cmpVersionDesc);
    if (stable.length) return stable[0];
    const flash = ids.filter((id) => /flash/.test(id) && !/lite|image|tts|live|preview|exp|thinking|audio/.test(id)).sort(cmpVersionDesc);
    return flash[0] || ids.find((id) => /flash/.test(id)) || ids[0];
  }
  if (provider === 'anthropic') return ids.find((id) => /sonnet/.test(id)) || ids.find((id) => /haiku/.test(id)) || ids[0];
  return ids.find((id) => /mini/.test(id)) || ids[0];
}

async function autoResolve(cfg) {
  const id = pickBest(cfg.provider, await listModels(cfg));
  if (!id) throw new Error('Your key works, but no usable models were returned for it.');
  writeResolved(cfg.provider, id);
  return id;
}

/* ---------------- low level call ---------------- */
async function callOnce(cfg, model, { system, messages, json }) {
  if (cfg.provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: json ? 0.8 : 0.5, ...(json ? { responseMimeType: 'application/json' } : {}) },
      }),
    });
    const j = await res.json();
    if (!res.ok) throw fail(j.error?.message || `Gemini error ${res.status}`, res.status);
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error(j.promptFeedback?.blockReason ? `The request was blocked (${j.promptFeedback.blockReason}).` : 'The model returned an empty response. Try again.');
    return text;
  }
  if (cfg.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 4096, system, messages }),
    });
    const j = await res.json();
    if (!res.ok) throw fail(j.error?.message || `Anthropic error ${res.status}`, res.status);
    return j.content?.map((c) => c.text || '').join('') || '';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  const j = await res.json();
  if (!res.ok) throw fail(j.error?.message || `OpenAI error ${res.status}`, res.status);
  return j.choices?.[0]?.message?.content || '';
}

async function callModel(cfg, opts) {
  if (!cfg.key) throw new Error('Add an API key in Settings first.');
  const first = effectiveModel(cfg);
  try {
    return await callOnce(cfg, first, opts);
  } catch (e) {
    if (!e.modelProblem) throw e;
    // The model is retired or unknown. Ask the provider what exists and retry once.
    let next;
    try { next = await autoResolve(cfg); } catch (e2) { throw new Error(`${e.message} (Could not look up replacement models: ${e2.message})`); }
    if (next === first) throw e;
    const out = await callOnce(cfg, next, opts);
    writeResolved(`${cfg.provider}:${first}`, next);
    return out;
  }
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

/* ---------------- generation ---------------- */
export async function generateQuestions(cfg, { topic, custom, level, years, count }) {
  const subject = custom?.trim() || topicName(topic);
  const lv = LEVELS.find((l) => l.id === level);
  const system = 'You are a senior engineering interviewer. Reply with JSON only.';
  const user = `Create ${count} highly-asked, realistic interview questions on "${subject}" for a candidate with about ${years} years of experience (${lv.name} level).
Cover a mix of concept, practical and scenario questions appropriate for that level. Answers must be accurate, concise (2-5 sentences, plain text; use \\n for short code) and mention trade-offs where relevant.
Return exactly this JSON: {"questions":[{"q":"...","a":"..."}]}`;
  const data = parseJSON(await callModel(cfg, { system, messages: [{ role: 'user', content: user }], json: true }));
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list) || !list.length) throw new Error('No questions returned.');
  return list.filter((x) => x.q && x.a).map((x) => ({
    id: `ai-${uid()}`, topic: custom ? 'custom' : topic, subject: custom?.trim() || undefined, level, q: String(x.q), a: String(x.a), source: 'ai',
  }));
}

export async function generateNote(cfg, { topic, custom, concept, level }) {
  const subject = custom?.trim() || topicName(topic);
  const lv = LEVELS.find((l) => l.id === level);
  const system = 'You are a friendly teacher who writes short hand-written style revision notes. Reply with JSON only.';
  const user = `Write a revision note explaining "${concept}" in the context of ${subject} for a ${lv.name} interview candidate.
Return exactly this JSON: {"title":"...","points":["4-6 short bullet phrases"],"code":"optional short code snippet or empty string","diagram":{"type":"flow","items":["3-5 short labels"]}}
Use "stack" instead of "flow" if the concept is layered. Keep labels under 22 characters.`;
  const n = parseJSON(await callModel(cfg, { system, messages: [{ role: 'user', content: user }], json: true }));
  if (!n.title || !Array.isArray(n.points)) throw new Error('Note was malformed. Try again.');
  return {
    id: `ai-n-${uid()}`, topic: custom ? 'custom' : topic, source: 'ai',
    title: String(n.title), points: n.points.map(String), code: n.code || undefined,
    diagram: n.diagram?.items?.length ? { type: n.diagram.type === 'stack' ? 'stack' : 'flow', items: n.diagram.items.map(String) } : undefined,
  };
}

/* ---------------- explain ---------------- */
export const EXPLAIN_MODES = {
  simple: { label: 'Simple', ask: 'I did not fully understand this. Explain it simply, as if to a smart colleague who is new to the topic. Structure: a two-sentence summary; the intuition (an analogy if it helps); a short concrete example (code if relevant); how to say it well in an interview in 2-3 sentences; two likely follow-up questions.' },
  deep: { label: 'Go deeper', ask: 'Go deeper on this. Cover how it works internally, the trade-offs and alternatives, common pitfalls and misconceptions, and what a senior or lead interviewer would probe next. Be precise and concrete.' },
  example: { label: 'Worked example', ask: 'Walk me through a concrete worked example or realistic scenario that demonstrates this, step by step, with code or a small diagram in text where useful. Then summarise the takeaway in one line.' },
};

export async function explainChat(cfg, item, mode, thread) {
  const lv = item.level ? LEVELS.find((l) => l.id === item.level)?.name : '';
  const system = `You are a patient, accurate technical interview coach. Reply in concise Markdown (short paragraphs, bullet lists, fenced code blocks where useful). Keep it under about 350 words unless the user asks for more. If something is uncertain or version specific, say so instead of guessing.`;
  const context = `Topic: ${item.topicLabel}${lv ? `\nLevel: ${lv}` : ''}\nType: ${item.kind}\n\n${item.title}\n\n${item.body ? `Reference material:\n${item.body}` : ''}`;
  const first = `${context}\n\n${EXPLAIN_MODES[mode].ask}`;
  const messages = [{ role: 'user', content: first }, ...thread];
  return (await callModel(cfg, { system, messages, json: false })).trim();
}
