import React from 'react';
import { LEVELS, TOPICS, topicIcon, topicName, BUILTIN_QUESTIONS } from '../data/index.js';
import { useStore, levelInfo, allQuestions } from '../lib/store.js';
import { Stat } from './ui.jsx';
import { go } from '../lib/router.js';

export default function Home() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const qs = allQuestions(s);
  const cards = Object.values(s.cards);
  const mastered = cards.filter((c) => c.box >= 4).length;
  const dueNow = qs.filter((q) => s.profile.topics.includes(q.topic) && (!s.cards[q.id] || s.cards[q.id].due <= Date.now())).length;
  const graded = s.history.filter((h) => h.score !== null);
  const avg = graded.length ? Math.round((graded.reduce((a, h) => a + h.score, 0) / graded.length) * 100) : null;

  // per-topic accuracy from graded interviews
  const acc = {};
  const byId = new Map(qs.map((q) => [q.id, q]));
  for (const h of s.history) for (const it of h.items || []) {
    const q = byId.get(it.qid); if (!q || !it.grade) continue;
    const a = (acc[q.topic] ||= { n: 0, pts: 0 });
    a.n++; a.pts += it.grade === 'got' ? 1 : it.grade === 'partial' ? 0.5 : 0;
  }
  const weak = Object.entries(acc).filter(([, a]) => a.n >= 2).map(([t, a]) => ({ t, pct: Math.round((a.pts / a.n) * 100) })).sort((a, b) => a.pct - b.pct).slice(0, 4);

  return (
    <div className="stack">
      <div className="card hero">
        <h1 className="hand big">Hi{s.profile.name ? `, ${s.profile.name}` : ''} 👋</h1>
        <p>Preparing at <b>{LEVELS[info.primary - 1].name}</b> level ({s.profile.years} yrs) across <b>{s.profile.topics.length}</b> topics. {BUILTIN_QUESTIONS.length}+ questions ready.</p>
        <div className="row gap wrap">
          <button className="btn primary" onClick={() => go('mock')}>🎤 Start a mock interview</button>
          <button className="btn" onClick={() => go('cards')}>🃏 Flash cards ({dueNow} due)</button>
          <button className="btn" onClick={() => go('notes')}>📓 Read notes</button>
        </div>
      </div>
      <div className="grid4">
        <Stat label="Interviews taken" value={s.history.length} />
        <Stat label="Average score" value={avg === null ? '—' : `${avg}%`} sub="self-graded" />
        <Stat label="Cards studied" value={cards.length} />
        <Stat label="Cards mastered" value={mastered} sub="box 4+" />
      </div>
      <div className="grid2">
        <div className="card stack">
          <h3>Focus areas</h3>
          {weak.length ? weak.map((w) => (
            <div key={w.t} className="bar-row">
              <span>{topicIcon(w.t)} {topicName(w.t)}</span>
              <div className="bar"><div style={{ width: `${w.pct}%` }} /></div>
              <b>{w.pct}%</b>
            </div>
          )) : <p className="muted">Complete and grade a mock interview and your weakest topics show up here.</p>}
        </div>
        <div className="card stack">
          <h3>Recent interviews</h3>
          {s.history.length ? s.history.slice(0, 5).map((h) => (
            <div key={h.id} className="row between">
              <span>{new Date(h.date).toLocaleDateString()} - {h.topics.slice(0, 3).map(topicName).join(', ')}{h.topics.length > 3 ? '…' : ''}</span>
              <b>{h.score === null ? 'ungraded' : `${Math.round(h.score * 100)}%`}</b>
            </div>
          )) : <p className="muted">Nothing yet - your first mock interview is a click away.</p>}
        </div>
      </div>
      <div className="card stack">
        <h3>Topics</h3>
        <div className="chips">{TOPICS.map((t) => (
          <span key={t.id} className={`chip static ${s.profile.topics.includes(t.id) ? 'on' : ''}`}>{t.icon} {t.name}</span>
        ))}</div>
      </div>
    </div>
  );
}
