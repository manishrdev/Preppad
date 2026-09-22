import React, { useState } from 'react';
import { TOPICS, TOPIC_GROUPS, DSA_PATTERN_SUBJECTS } from '../data/index.js';
import { useStore, topicReadiness, subjectReadiness, overallReadiness, dayStreak } from '../lib/store.js';
import { PageHeader, Stat } from './ui.jsx';
import Icon from './icons.jsx';

const pct = (v) => Math.round(v * 100);

// green once a topic is genuinely strong, red while it is barely touched, accent in between.
function barColor(p) {
  if (p >= 70) return 'var(--good)';
  if (p > 0 && p < 10) return 'var(--bad)';
  return undefined;
}

function Bar({ label, value, sub, onClick, expanded }) {
  const p = pct(value);
  const row = (
    <div className={sub ? 'meter sub' : 'meter'}>
      <span className="name">{label}</span>
      <div className="bar"><i style={{ width: `${p}%`, background: barColor(p) }} /></div>
      <b>{p}%</b>
    </div>
  );
  if (!onClick) return row;
  return (
    <div className={`expand-row ${expanded ? 'open' : ''}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
      <span className="name"><Icon name="chevron" className="chev" size={15} /> {label}</span>
      <div className="bar"><i style={{ width: `${p}%`, background: barColor(p) }} /></div>
      <b>{p}%</b>
    </div>
  );
}

function GroupCard({ group, topics, s, dsaOpen, setDsaOpen }) {
  const avg = Math.round((topics.reduce((sum, t) => sum + topicReadiness(s, t.id), 0) / topics.length) * 100);
  return (
    <section className="card group-card">
      <div className="card-title"><h3>{group}</h3><span className="avg">{avg}% avg</span></div>
      {topics.map((t) => {
        if (t.id === 'dsa') {
          const open = dsaOpen;
          return (
            <div key={t.id}>
              <Bar label={t.name} value={topicReadiness(s, t.id)} onClick={() => setDsaOpen(!open)} expanded={open} />
              {open && (
                <div className="sub-list">
                  {DSA_PATTERN_SUBJECTS.map((subject) => (
                    <Bar key={subject} label={subject} value={subjectReadiness(s, 'dsa', subject)} sub />
                  ))}
                </div>
              )}
            </div>
          );
        }
        return <Bar key={t.id} label={t.name} value={topicReadiness(s, t.id)} />;
      })}
    </section>
  );
}

export default function Roadmap() {
  const s = useStore();
  const [dsaOpen, setDsaOpen] = useState(false);

  const streak = dayStreak(s);
  const overall = pct(overallReadiness(s));
  const started = TOPICS.filter((t) => topicReadiness(s, t.id) > 0).length;
  const strong = TOPICS.filter((t) => topicReadiness(s, t.id) >= 0.7).length;

  return (
    <div className="stack-lg">
      <PageHeader
        title="Your roadmap"
        sub="Holistic readiness across every PrepPad topic — computed from your mock interview scores and flash card mastery. No schedule to keep, just where you actually stand."
        actions={streak > 0 ? <span className="streak-badge">🔥 {streak}-day streak</span> : undefined}
      />

      <div className="stats">
        <Stat label="Day streak" value={streak} sub="any mock interview or flash card review counts" />
        <Stat label="Overall readiness" value={`${overall}%`} sub={`average across all ${TOPICS.length} topics`} />
        <Stat label="Topics started" value={`${started} / ${TOPICS.length}`} />
        <Stat label="Topics strong (70%+)" value={`${strong} / ${TOPICS.length}`} />
      </div>

      {TOPIC_GROUPS.map((group) => (
        <GroupCard
          key={group}
          group={group}
          topics={TOPICS.filter((t) => t.group === group)}
          s={s}
          dsaOpen={dsaOpen}
          setDsaOpen={setDsaOpen}
        />
      ))}
    </div>
  );
}
