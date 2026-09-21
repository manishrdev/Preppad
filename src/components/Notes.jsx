import React, { useState } from 'react';
import { TOPICS, TOPIC_GROUPS, CUSTOM_TOPIC } from '../data/index.js';
import { useStore, allNotes, removeCustom } from '../lib/store.js';
import Sketch from './Sketch.jsx';
import Icon from './icons.jsx';
import { ExplainButton } from './Explain.jsx';
import { Empty, PageHeader, TopicDot } from './ui.jsx';
import { topicName } from '../data/index.js';

export default function Notes() {
  const s = useStore();
  const notes = allNotes(s);
  const [topic, setTopic] = useState(s.profile.topics[0] || 'all');
  const [q, setQ] = useState('');
  const shown = notes.filter((n) => (topic === 'all' || n.topic === topic) &&
    (!q || (n.title + n.points.join(' ')).toLowerCase().includes(q.toLowerCase())));
  const hasCustom = s.custom.notes.length > 0;

  return (
    <div className="stack-lg">
      <PageHeader title="Concept notes" sub="Hand-written style revision sheets with sketches. Need one on something specific? Generate it with AI."
        actions={<a className="btn" href="#/generate"><Icon name="sparkles" size={15} /> Generate a note</a>} />
      <div className="filters" style={{ gridTemplateColumns: '1fr 240px' }}>
        <div className="search"><Icon name="bank" size={16} /><input placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search notes" /></div>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="all">All topics</option>
          {TOPIC_GROUPS.map((g) => (
            <optgroup key={g} label={g}>{TOPICS.filter((t) => t.group === g).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
          ))}
          {hasCustom && <option value="custom">{CUSTOM_TOPIC.name}</option>}
        </select>
      </div>
      {!shown.length && <Empty>No notes match your search.</Empty>}
      <div className="notes-grid">
        {shown.map((n) => (
          <article key={n.id} className="paper">
            <div className="paper-tape" />
            <h2>{n.title}</h2>
            <span className="tag"><TopicDot id={n.topic} />{topicName(n.topic)}</span>
            {n.diagram && <Sketch diagram={n.diagram} seed={n.id} />}
            <ul className="hand-list">{n.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            {n.code && <pre className="sticky"><code>{n.code}</code></pre>}
            <ExplainButton item={{ kind: 'concept note', topicId: n.topic, title: n.title, body: n.points.join('\n- ') + (n.code ? '\nCode:\n' + n.code : '') }} label="Explain with AI" />
            {n.source === 'ai' && <button className="link" onClick={() => removeCustom('notes', n.id)}>Remove this note</button>}
          </article>
        ))}
      </div>
    </div>
  );
}
