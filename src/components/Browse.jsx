import React, { useState } from 'react';
import { LEVELS, TOPICS, TOPIC_GROUPS, CUSTOM_TOPIC } from '../data/index.js';
import { useStore, allQuestions, removeCustom } from '../lib/store.js';
import { LevelBadge, TopicTag, Answer, Empty, PageHeader } from './ui.jsx';
import Icon from './icons.jsx';
import { ExplainButton } from './Explain.jsx';

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
    <div className="stack-lg">
      <PageHeader title="Question bank" sub={`Browse every question and answer. ${allQuestions(s).length} in total.`} />
      <div className="stack">
        <div className="filters">
          <div className="search"><Icon name="bank" size={16} /><input placeholder="Search questions and answers" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
            <option value="all">All topics</option>
            {TOPIC_GROUPS.map((g) => (
              <optgroup key={g} label={g}>{TOPICS.filter((t) => t.group === g).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
            ))}
            {s.custom.questions.length > 0 && <option value="custom">{CUSTOM_TOPIC.name}</option>}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level">
            <option value="all">All levels</option>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.years}</option>)}
          </select>
        </div>
        <div className="row between">
          <span className="small muted">{list.length} question{list.length === 1 ? '' : 's'}</span>
          <label className="check"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all answers</label>
        </div>
      </div>
      {!list.length ? <Empty>Nothing matches those filters.</Empty> : (
        <div className="card flush">
          {list.map((x) => {
            const isOpen = showAll || open[x.id];
            return (
              <div key={x.id} className="q-row">
                <div className="row gap wrap"><TopicTag q={x} /><LevelBadge level={x.level} />{x.source === 'ai' && <span className="pill ai">AI generated</span>}</div>
                <h3 className="question" style={{ fontSize: '1.02rem' }}>{x.q}</h3>
                {isOpen && <Answer text={x.a} />}
                <div className="row gap">
                  {!showAll && <button className="btn sm" onClick={() => setOpen({ ...open, [x.id]: !open[x.id] })}>{isOpen ? 'Hide answer' : 'Show answer'}</button>}
                  <ExplainButton item={{ kind: 'interview question', topicId: x.topic, topicLabel: x.subject, level: x.level, title: x.q, body: x.a }} />
                  {x.source === 'ai' && <button className="btn sm quiet danger" onClick={() => removeCustom('questions', x.id)}>Remove</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
