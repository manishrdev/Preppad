import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from '../data/index.js';
import { useStore, levelInfo, pickQuestions, saveInterview, rateCard } from '../lib/store.js';
import { Chip, TopicPicker } from './Profile.jsx';
import { LevelBadge, TopicTag, Answer } from './ui.jsx';
import { go } from '../lib/router.js';

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Mock() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const [phase, setPhase] = useState('setup');
  const [cfg, setCfg] = useState({
    topics: s.profile.topics.length ? s.profile.topics : ['java'],
    levels: info.levels, count: 10, timer: 0,
  });
  const [session, setSession] = useState(null);

  const start = () => {
    const primary = Math.max(...cfg.levels);
    const qs = pickQuestions(s, { topics: cfg.topics, levels: cfg.levels, primary, count: cfg.count });
    if (!qs.length) return;
    setSession({ id: uid(), date: Date.now(), cfg, qs, answers: {}, grades: {} });
    setPhase('run');
  };

  if (phase === 'setup') return <Setup cfg={cfg} setCfg={setCfg} start={start} info={info} customTopics={s.custom.questions.length > 0} />;
  if (phase === 'run') return <Run session={session} onDone={(answers, skipped) => {
    const done = { ...session, answers, skipped };
    setSession(done);
    persist(done);
    setPhase('results');
  }} />;
  return <Results session={session} setSession={setSession} again={() => setPhase('setup')} />;
}

function persist(sess) {
  const items = sess.qs.map((q) => ({ qid: q.id, answer: sess.answers[q.id] || '', grade: sess.grades[q.id] || null }));
  const graded = items.filter((i) => i.grade);
  const score = graded.length ? graded.reduce((a, i) => a + (i.grade === 'got' ? 1 : i.grade === 'partial' ? 0.5 : 0), 0) / sess.qs.length : null;
  saveInterview({
    id: sess.id, date: sess.date, topics: sess.cfg.topics, levels: sess.cfg.levels,
    total: sess.qs.length, score, items,
  });
}

function Setup({ cfg, setCfg, start, info, customTopics }) {
  const toggleLevel = (id) => {
    const cur = new Set(cfg.levels);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size) setCfg({ ...cfg, levels: [...cur].sort() });
  };
  return (
    <div className="card stack">
      <h1>Mock interview</h1>
      <p className="muted">Answer in your own words, just like a real interview. Model answers stay hidden until you finish.</p>
      <h3>Topics</h3>
      <TopicPicker value={cfg.topics} onChange={(topics) => setCfg({ ...cfg, topics })} extra={customTopics ? [{ id: 'custom', name: 'My Custom Topics', icon: '✨' }] : []} />
      <h3>Question levels</h3>
      <div className="chips">
        {LEVELS.map((l) => (
          <Chip key={l.id} on={cfg.levels.includes(l.id)} onClick={() => toggleLevel(l.id)}>
            {l.name} <small>{l.years}</small>
          </Chip>
        ))}
        <button className="link" onClick={() => setCfg({ ...cfg, levels: info.levels })}>Reset to my profile</button>
      </div>
      <div className="grid2">
        <label className="field"><span>Number of questions</span>
          <select value={cfg.count} onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })}>
            {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="field"><span>Time per question</span>
          <select value={cfg.timer} onChange={(e) => setCfg({ ...cfg, timer: Number(e.target.value) })}>
            <option value={0}>No timer</option>
            <option value={90}>1.5 min</option>
            <option value={180}>3 min</option>
            <option value={300}>5 min</option>
          </select>
        </label>
      </div>
      <div className="row end">
        <button className="btn primary" disabled={!cfg.topics.length} onClick={start}>Start interview</button>
      </div>
    </div>
  );
}

function Run({ session, onDone }) {
  const { qs, cfg } = session;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(cfg.timer);
  const ref = useRef();
  const q = qs[i];

  useEffect(() => { setLeft(cfg.timer); ref.current?.focus(); }, [i, cfg.timer]);
  useEffect(() => {
    if (!cfg.timer) return;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [i, cfg.timer]);

  const next = () => (i + 1 >= qs.length ? onDone(answers) : setI(i + 1));
  const pct = Math.round((i / qs.length) * 100);

  return (
    <div className="card stack">
      <div className="row between">
        <span className="muted">Question {i + 1} of {qs.length}</span>
        {cfg.timer > 0 && <span className={`timer ${left < 20 ? 'warn' : ''}`}>⏱ {fmt(left)}</span>}
      </div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <div className="row gap"><TopicTag q={q} /><LevelBadge level={q.level} /></div>
      <h2 className="question">{q.q}</h2>
      <textarea
        ref={ref} rows={8} placeholder="Type your answer, or talk it through out loud and jot key points here…"
        value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
      />
      <div className="row between">
        <button className="btn ghost" onClick={() => { if (confirm('End the interview now? Unanswered questions will still be reviewed.')) onDone(answers); }}>End early</button>
        <div className="row gap">
          <button className="btn" onClick={next}>Skip</button>
          <button className="btn primary" onClick={next}>{i + 1 >= qs.length ? 'Finish' : 'Next'}</button>
        </div>
      </div>
      {left === 0 && cfg.timer > 0 && <p className="muted small">Time is up for this question - wrap up and move on, as you would in a real interview.</p>}
    </div>
  );
}

function Results({ session, setSession, again }) {
  const grade = (qid, g) => {
    const next = { ...session, grades: { ...session.grades, [qid]: g } };
    setSession(next);
    persist(next);
    if (g === 'missed') rateCard(qid, 'again');
  };
  const counts = useMemo(() => {
    const c = { got: 0, partial: 0, missed: 0 };
    Object.values(session.grades).forEach((g) => { c[g]++; });
    return c;
  }, [session.grades]);
  const graded = counts.got + counts.partial + counts.missed;
  const pct = graded ? Math.round(((counts.got + counts.partial * 0.5) / session.qs.length) * 100) : null;

  return (
    <div className="stack">
      <div className="card row between wrap">
        <div>
          <h1>Interview complete</h1>
          <p className="muted">Compare your answers with the model answers and grade yourself honestly. Missed questions are added to your flash cards.</p>
        </div>
        <div className="scorebox">
          <div className="score">{pct === null ? '—' : `${pct}%`}</div>
          <div className="muted small">{graded}/{session.qs.length} graded</div>
        </div>
      </div>
      {session.qs.map((q, n) => {
        const g = session.grades[q.id];
        return (
          <div key={q.id} className={`card stack review ${g || ''}`}>
            <div className="row gap wrap"><span className="muted">#{n + 1}</span><TopicTag q={q} /><LevelBadge level={q.level} /></div>
            <h3 className="question">{q.q}</h3>
            <div className="yours"><b>Your answer</b><p>{session.answers[q.id] || <i className="muted">Skipped / no answer</i>}</p></div>
            <div className="model"><b>Model answer</b><Answer text={q.a} /></div>
            <div className="row gap grade">
              <span className="muted small">How did you do?</span>
              {[['got', '✅ Nailed it'], ['partial', '🟡 Partly'], ['missed', '❌ Missed']].map(([k, label]) => (
                <button key={k} className={`btn sm ${g === k ? 'primary' : ''}`} onClick={() => grade(q.id, k)}>{label}</button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="row end gap">
        <button className="btn" onClick={() => go('cards')}>Practice flash cards</button>
        <button className="btn primary" onClick={again}>New interview</button>
      </div>
    </div>
  );
}
