import { BUILTIN_QUESTIONS, BUILTIN_NOTES, BUILTIN_CARDS, TOPICS } from '../src/data/index.js';
let bad = 0;
const ids = new Set();
for (const q of BUILTIN_QUESTIONS) {
  if (ids.has(q.id)) { console.error('dup', q.id); bad++; }
  ids.add(q.id);
  if (![1,2,3,4].includes(q.level) || !q.q || !q.a) { console.error('bad', q.id); bad++; }
}
for (const t of TOPICS) {
  const qs = BUILTIN_QUESTIONS.filter(q => q.topic === t.id);
  const lv = [1,2,3,4].map(l => qs.filter(q => q.level === l).length).join('/');
  console.log(t.name.padEnd(16), String(qs.length).padStart(3), 'Q  levels', lv, ' notes', BUILTIN_NOTES.filter(n => n.topic === t.id).length);
}
console.log('Total questions', BUILTIN_QUESTIONS.length, 'notes', BUILTIN_NOTES.length);
const dist = [1,2,3,4].map(l => BUILTIN_QUESTIONS.filter(q => q.level === l).length);
console.log('Cards', BUILTIN_CARDS.length, ' level split', dist.join('/'));
const seen = new Set();
for (const q of BUILTIN_QUESTIONS) { const k = q.q.toLowerCase().trim(); if (seen.has(k)) { console.error('duplicate question text', q.id); bad++; } seen.add(k); }
if (BUILTIN_QUESTIONS.length < 500) { console.error('Need at least 500 questions'); bad++; }
if (bad) process.exit(1);
