import React, { useState } from 'react';
import { TOPICS, topicIcon, topicName } from '../data/index.js';
import { useStore, allNotes, removeCustom } from '../lib/store.js';
import Sketch from './Sketch.jsx';
import { Chip } from './Profile.jsx';
import { Empty } from './ui.jsx';

export default function Notes() {
  const s = useStore();
  const notes = allNotes(s);
  const [topic, setTopic] = useState(s.profile.topics[0] || 'all');
  const [q, setQ] = useState('');
  const shown = notes.filter((n) => (topic === 'all' || n.topic === topic) &&
    (!q || (n.title + n.points.join(' ')).toLowerCase().includes(q.toLowerCase())));
  const hasCustom = s.custom.notes.length > 0;

  return (
    <div className="stack">
      <div className="card stack">
        <h1>Concept notes</h1>
        <p className="muted">Quick hand-written style revision sheets. Need one on something specific? Use <a href="#/generate">Generate</a> to have AI write a note.</p>
        <input placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <Chip on={topic === 'all'} onClick={() => setTopic('all')}>All</Chip>
          {[...TOPICS, ...(hasCustom ? [{ id: 'custom', name: 'My Custom Topics', icon: '✨' }] : [])].map((t) => (
            <Chip key={t.id} on={topic === t.id} onClick={() => setTopic(t.id)}>{t.icon} {t.name}</Chip>
          ))}
        </div>
      </div>
      {!shown.length && <Empty>No notes found.</Empty>}
      <div className="notes-grid">
        {shown.map((n) => (
          <article key={n.id} className="paper">
            <div className="paper-tape" />
            <header className="row between">
              <h2 className="hand">{n.title}</h2>
              <span className="tag paper-tag">{topicIcon(n.topic)} {topicName(n.topic)}</span>
            </header>
            {n.diagram && <Sketch diagram={n.diagram} seed={n.id} />}
            <ul className="hand-list">
              {n.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {n.code && <pre className="sticky"><code>{n.code}</code></pre>}
            {n.source === 'ai' && (
              <button className="link tiny" onClick={() => removeCustom('notes', n.id)}>remove AI note</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
