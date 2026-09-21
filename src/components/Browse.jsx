import React, { useState } from 'react';
import { LEVELS, TOPICS } from '../data/index.js';
import { useStore, allQuestions, removeCustom } from '../lib/store.js';
import { LevelBadge, TopicTag, Answer, Empty } from './ui.jsx';

export default function Browse() {
  const s = useStore();
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const [showAll, setShowAll] = useState(false);

  const list = allQuestions(s).filter((x) =>
    (topic === 'all' || x.topic === topic) && (level === 'all' || x.level === Number(level)) &&
    (!q || (x.q + x.a).toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="stack">
      <div className="card stack">
        <h1>Question bank</h1>
        <div className="grid3">
          <input placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All topics</option>
            {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            {s.custom.questions.length > 0 && <option value="custom">✨ My Custom Topics</option>}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.years})</option>)}
          </select>
        </div>
        <label className="row gap check"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all answers</label>
        <p className="muted small">{list.length} questions</p>
      </div>
      {!list.length && <Empty>Nothing matches those filters.</Empty>}
      {list.map((x) => {
        const isOpen = showAll || open[x.id];
        return (
          <div key={x.id} className="card qcard">
            <div className="row gap wrap"><TopicTag q={x} /><LevelBadge level={x.level} />{x.source === 'ai' && <span className="badge ai">AI</span>}</div>
            <h3 className="question">{x.q}</h3>
            {isOpen ? <Answer text={x.a} /> : null}
            <div className="row gap">
              <button className="btn sm" onClick={() => setOpen({ ...open, [x.id]: !open[x.id] })}>{isOpen && !showAll ? 'Hide answer' : 'Show answer'}</button>
              {x.source === 'ai' && <button className="link" onClick={() => removeCustom('questions', x.id)}>remove</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
