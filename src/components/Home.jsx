import React from 'react';
import { LEVELS, topicName, BUILTIN_QUESTIONS } from '../data/index.js';
import { useStore, levelInfo, allQuestions } from '../lib/store.js';
import { Stat, PageHeader, TopicDot, Empty } from './ui.jsx';
import Icon from './icons.jsx';
import { go } from '../lib/router.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const qs = allQuestions(s);
  const cards = Object.values(s.cards);
  const mastered = cards.filter((c) => c.box >= 4).length;
  const dueNow = qs.filter((q) => s.profile.topics.includes(q.topic) && info.levels.includes(q.level) && (!s.cards[q.id] || s.cards[q.id].due <= Date.now())).length;
  const graded = s.history.filter((h) => h.score !== null);
  const avg = graded.length ? Math.round((graded.reduce((a, h) => a + h.score, 0) / graded.length) * 100) : null;

  const acc = {};
  const byId = new Map(qs.map((q) => [q.id, q]));
  for (const h of s.history) for (const it of h.items || []) {
    const q = byId.get(it.qid); if (!q || !it.grade) continue;
    const a = (acc[q.topic] ||= { n: 0, pts: 0 });
    a.n++; a.pts += it.grade === 'got' ? 1 : it.grade === 'partial' ? 0.5 : 0;
  }
  const weak = Object.entries(acc).filter(([, a]) => a.n >= 2).map(([t, a]) => ({ t, pct: Math.round((a.pts / a.n) * 100) })).sort((a, b) => a.pct - b.pct).slice(0, 5);

  return (
    <div className="stack-lg">
      <PageHeader
        title={`${greeting()}${s.profile.name ? `, ${s.profile.name}` : ''}`}
        sub={`${LEVELS[info.primary - 1].name} track · ${s.profile.topics.length} topics · ${BUILTIN_QUESTIONS.length}+ curated questions`}
        actions={<button className="btn" onClick={() => go('settings')}><Icon name="settings" size={15} /> Edit track</button>}
      />

      <div className="actions-grid">
        <button className="action primary" onClick={() => go('mock')}>
          <span className="ai"><Icon name="mic" size={18} /></span>
          <div><h3>Mock interview</h3><p>Timed Q&A tuned to your level. Answers revealed at the end.</p></div>
          <Icon name="arrow" className="go" size={18} />
        </button>
        <button className="action" onClick={() => go('cards')}>
          <span className="ai"><Icon name="cards" size={18} /></span>
          <div><h3>Flash cards</h3><p>{dueNow} card{dueNow === 1 ? '' : 's'} due or new for your topics.</p></div>
          <Icon name="arrow" className="go" size={18} />
        </button>
        <button className="action" onClick={() => go('notes')}>
          <span className="ai"><Icon name="notes" size={18} /></span>
          <div><h3>Concept notes</h3><p>Hand-drawn revision sheets for quick recall.</p></div>
          <Icon name="arrow" className="go" size={18} />
        </button>
      </div>

      <div className="stats">
        <Stat label="Interviews taken" value={s.history.length} />
        <Stat label="Average score" value={avg === null ? '–' : `${avg}%`} sub="self-graded" />
        <Stat label="Cards studied" value={cards.length} />
        <Stat label="Cards mastered" value={mastered} sub="box 4 and above" />
      </div>

      <div className="grid2">
        <section className="card">
          <div className="card-title"><h3>Focus areas</h3><span className="eyebrow">Lowest scoring</span></div>
          {weak.length ? weak.map((w) => (
            <div key={w.t} className="meter">
              <span className="name"><TopicDot id={w.t} />{topicName(w.t)}</span>
              <div className="bar"><i style={{ width: `${w.pct}%`, background: w.pct < 50 ? 'var(--bad)' : w.pct < 75 ? 'var(--warn)' : 'var(--good)' }} /></div>
              <b>{w.pct}%</b>
            </div>
          )) : <Empty>Grade a mock interview and your weakest topics will show up here.</Empty>}
        </section>
        <section className="card">
          <div className="card-title"><h3>Recent interviews</h3>{s.history.length > 0 && <span className="eyebrow">{s.history.length} total</span>}</div>
          {s.history.length ? s.history.slice(0, 5).map((h) => (
            <div key={h.id} className="list-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.topics.slice(0, 3).map(topicName).join(', ')}{h.topics.length > 3 ? ` +${h.topics.length - 3}` : ''}
                </div>
                <div className="tiny faint">{new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {h.total} questions</div>
              </div>
              <span className={`pill ${h.score === null ? 'neutral' : h.score >= 0.75 ? 'good' : h.score >= 0.5 ? 'warn' : 'bad'}`}>
                {h.score === null ? 'Ungraded' : `${Math.round(h.score * 100)}%`}
              </span>
            </div>
          )) : <Empty>No interviews yet. Your first one takes about 10 minutes.</Empty>}
        </section>
      </div>
    </div>
  );
}
