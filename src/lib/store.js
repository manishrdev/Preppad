import { useSyncExternalStore } from 'react';
import { BUILTIN_QUESTIONS, BUILTIN_NOTES, levelForYears } from '../data/index.js';

const KEY = 'preppad_state_v1';

export const defaultState = () => ({
  profile: { name: '', years: 3, levelMode: 'auto', customLevels: [2], topics: [], onboarded: false, updatedAt: 0 },
  cards: {}, // qid -> { box, due, seen, updatedAt }
  history: [], // mock interviews
  custom: { questions: [], notes: [] }, // AI generated / user added
  updatedAt: 0,
});

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) {
      const d = defaultState();
      return { ...d, ...raw, profile: { ...d.profile, ...raw.profile }, custom: { ...d.custom, ...raw.custom } };
    }
  } catch { /* ignore */ }
  return defaultState();
}

let state = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be unavailable */ }
}
function emit() { listeners.forEach((l) => l()); }

export const getState = () => state;
export const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export function update(fn) {
  state = { ...fn(state), updatedAt: Date.now() };
  persist();
  emit();
}
export function replaceState(next) {
  state = next;
  persist();
  emit();
}
export const useStore = () => useSyncExternalStore(subscribe, getState);

/* ---------- profile / levels ---------- */
export function levelInfo(profile) {
  const auto = levelForYears(profile.years);
  if (profile.levelMode === 'custom' && profile.customLevels?.length) {
    const ls = [...profile.customLevels].sort();
    return { primary: ls[ls.length - 1], levels: ls };
  }
  return { primary: auto, levels: auto > 1 ? [auto - 1, auto] : [1] };
}

export function setProfile(patch) {
  update((s) => ({ ...s, profile: { ...s.profile, ...patch, updatedAt: Date.now() } }));
}

/* ---------- question bank ---------- */
export const allQuestions = (s) => [...BUILTIN_QUESTIONS, ...s.custom.questions];
export const allNotes = (s) => [...BUILTIN_NOTES, ...s.custom.notes];

export function addCustom(kind, items) {
  update((s) => {
    const existing = new Set(s.custom[kind].map((x) => x.id));
    const fresh = items.filter((x) => !existing.has(x.id));
    return { ...s, custom: { ...s.custom, [kind]: [...s.custom[kind], ...fresh] } };
  });
}
export function removeCustom(kind, id) {
  update((s) => ({ ...s, custom: { ...s.custom, [kind]: s.custom[kind].filter((x) => x.id !== id) } }));
}

/* weighted random sample: primary level questions are ~3x more likely */
export function pickQuestions(s, { topics, levels, primary, count }) {
  const pool = allQuestions(s).filter((q) => topics.includes(q.topic));
  const weight = (q) => (levels.includes(q.level) ? (q.level === primary ? 3 : 2) : 0.3);
  const ranked = pool
    .map((q) => ({ q, k: -Math.log(Math.random()) / weight(q) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.q);
  return ranked.slice(0, count);
}

/* ---------- flashcards (Leitner boxes) ---------- */
const DAY = 86400000;
export const BOX_DAYS = [0, 0, 1, 3, 7, 14];
export function rateCard(qid, rating) {
  update((s) => {
    const c = s.cards[qid] || { box: 1, seen: 0 };
    let box = c.box;
    if (rating === 'know') box = Math.min(5, box + 1);
    else if (rating === 'unsure') box = Math.max(1, box);
    else box = 1;
    const due = Date.now() + BOX_DAYS[box] * DAY;
    return { ...s, cards: { ...s.cards, [qid]: { box, due, seen: (c.seen || 0) + 1, updatedAt: Date.now() } } };
  });
}

/* ---------- interviews ---------- */
export function saveInterview(rec) {
  update((s) => ({ ...s, history: [rec, ...s.history.filter((h) => h.id !== rec.id)].slice(0, 200) }));
}

/* ---------- cloud merge: last-write-wins per item ---------- */
export function mergeStates(local, remote) {
  if (!remote) return local;
  const cards = { ...remote.cards };
  for (const [id, c] of Object.entries(local.cards || {})) {
    if (!cards[id] || (c.updatedAt || 0) >= (cards[id].updatedAt || 0)) cards[id] = c;
  }
  const byId = (arr) => new Map((arr || []).map((x) => [x.id, x]));
  const hist = byId(remote.history);
  for (const h of local.history || []) hist.set(h.id, h);
  const cq = byId(remote.custom?.questions);
  const cn = byId(remote.custom?.notes);
  for (const q of local.custom.questions) cq.set(q.id, q);
  for (const n of local.custom.notes) cn.set(n.id, n);
  const profile = (remote.profile?.updatedAt || 0) > (local.profile.updatedAt || 0) ? remote.profile : local.profile;
  return {
    ...local,
    profile: { ...local.profile, ...profile },
    cards,
    history: [...hist.values()].sort((a, b) => b.date - a.date).slice(0, 200),
    custom: { questions: [...cq.values()], notes: [...cn.values()] },
    updatedAt: Date.now(),
  };
}

/* ---------- AI/API settings live outside synced state (secrets stay local) ---------- */
const AI_KEY = 'preppad_ai_v1';
export const loadAI = () => {
  try { return { provider: 'gemini', model: '', key: '', ...JSON.parse(localStorage.getItem(AI_KEY)) }; }
  catch { return { provider: 'gemini', model: '', key: '' }; }
};
export const saveAI = (cfg) => { try { localStorage.setItem(AI_KEY, JSON.stringify(cfg)); } catch { /* ignore */ } };

export const exportData = () => JSON.stringify(state, null, 2);
export function importData(text) {
  const d = JSON.parse(text);
  if (!d || typeof d !== 'object' || !d.profile) throw new Error('Not a PrepPad export');
  replaceState({ ...defaultState(), ...d, profile: { ...defaultState().profile, ...d.profile } });
}
export function resetAll() { replaceState(defaultState()); }
