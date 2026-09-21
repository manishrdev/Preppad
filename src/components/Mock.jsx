import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from '../data/index.js';
import { useStore, levelInfo, pickQuestions, saveInterview, rateCard } from '../lib/store.js';
import { TopicPicker, LevelChips } from './Profile.jsx';
import { LevelBadge, TopicTag, Answer, PageHeader, Ring, Segmented } from './ui.jsx';
import Icon from './icons.jsx';
import { ExplainButton } from './Explain.jsx';
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
  if (phase === 'run') {
    return <Run session={session} onDone={(answers) => {
      const done = { ...session, answers };
      setSession(done);
      persist(done);
      setPhase('results');
    }} />;
  }
  return <Results session={session} setSession={setSession} again={() => setPhase('setup')} />;
}

function persist(sess) {
  const items = sess.qs.map((q) => ({ qid: q.id, answer: sess.answers[q.id] || '', grade: sess.grades[q.id] || null }));
  const graded = items.filter((i) => i.grade);
  const score = graded.length ? graded.reduce((a, i) => a + (i.grade === 'got' ? 1 : i.grade === 'partial' ? 0.5 : 0), 0) / sess.qs.length : null;
  saveInterview({ id: sess.id, date: sess.date, topics: sess.cfg.topics, levels: sess.cfg.levels, total: sess.qs.length, score, items });
}

function Setup({ cfg, setCfg, start, info, customTopics }) {
  return (
    <div>
      <PageHeader title="Mock interview" sub="Answer in your own words, like a real interview. Model answers stay hidden until you finish." />
      <div className="card">
        <div className="form-grid">
          <div className="lab"><h3>Topics</h3><p>Questions are drawn from everything you select.</p></div>
          <TopicPicker value={cfg.topics} onChange={(topics) => setCfg({ ...cfg, topics })} custom={customTopics} />
        </div>
        <div className="form-grid">
          <div className="lab"><h3>Difficulty</h3><p>Defaults to your profile. Adjust to stretch or warm up.</p></div>
          <LevelChips levels={cfg.levels} onChange={(levels) => setCfg({ ...cfg, levels })} onReset={() => setCfg({ ...cfg, levels: info.levels })} />
        </div>
        <div className="form-grid">
          <div className="lab"><h3>Format</h3><p>Length and pacing of the session.</p></div>
          <div className="stack">
            <div className="field"><span>Questions</span>
              <Segmented label="Question count" value={cfg.count} onChange={(count) => setCfg({ ...cfg, count })} options={[5, 10, 15, 20, 30].map((n) => [n, n])} />
            </div>
            <div className="field"><span>Time per question</span>
              <Segmented label="Timer" value={cfg.timer} onChange={(timer) => setCfg({ ...cfg, timer })} options={[[0, 'Off'], [90, '1.5 min'], [180, '3 min'], [300, '5 min']]} />
            </div>
          </div>
        </div>
        <div className="bar-actions">
          <span className="hint">{cfg.topics.length} topic{cfg.topics.length === 1 ? '' : 's'} · {cfg.levels.map((l) => LEVELS[l - 1].name).join(', ')}</span>
          <button className="btn primary lg" disabled={!cfg.topics.length} onClick={start}><Icon name="play" size={14} /> Start interview</button>
        </div>
      </div>
    </div>
  );
}

function Run({ session, onDone }) {
  const { qs, cfg } = session;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(cfg.timer);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const ref = useRef();
  const q = qs[i];

  useEffect(() => { setLeft(cfg.timer); ref.current?.focus(); }, [i, cfg.timer]);
  useEffect(() => {
    if (!cfg.timer) return undefined;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [i, cfg.timer]);

  const next = () => (i + 1 >= qs.length ? onDone(answers) : setI(i + 1));
  const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); next(); } };

  return (
    <div className="focus stack">
      <div className="row between">
        <span className="muted small">Question {i + 1} of {qs.length}</span>
        <div className="row gap">
          {cfg.timer > 0 && <span className={`timer ${left < 20 ? 'warn' : ''}`}><Icon name="clock" size={14} />{fmt(left)}</span>}
          {confirmEnd ? (
            <>
              <button className="btn sm danger" onClick={() => onDone(answers)}>End and review</button>
              <button className="btn sm quiet" onClick={() => setConfirmEnd(false)}>Cancel</button>
            </>
          ) : <button className="btn sm quiet" onClick={() => setConfirmEnd(true)}>End early</button>}
        </div>
      </div>
      <div className="progress" aria-hidden="true">
        {qs.map((x, n) => <i key={x.id} className={n < i ? 'done' : n === i ? 'now' : ''} />)}
      </div>
      <div className="card focus-card stack">
        <div className="row gap wrap"><TopicTag q={q} /><LevelBadge level={q.level} /></div>
        <h2 className="question" style={{ fontSize: '1.45rem' }}>{q.q}</h2>
        <textarea
          ref={ref} placeholder="Type your answer, or talk it through out loud and jot down the key points…"
          value={answers[q.id] || ''} onKeyDown={onKey} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
        />
        <div className="row between">
          <span className="hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> for next</span>
          <div className="row gap">
            <button className="btn" onClick={next}>Skip</button>
            <button className="btn primary" onClick={next}>{i + 1 >= qs.length ? 'Finish' : 'Next'} <Icon name="arrow" size={15} /></button>
          </div>
        </div>
        {left === 0 && cfg.timer > 0 && <p className="hint">Time is up for this question. Wrap up and move on, as you would in a real interview.</p>}
      </div>
    </div>
  );
}

function Results({ session, setSession, again }) {
  const [open, setOpen] = useState({ 0: true });
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
  const score = graded ? (counts.got + counts.partial * 0.5) / session.qs.length : null;
  const allOpen = session.qs.every((_, n) => open[n]);

  return (
    <div className="stack-lg">
      <PageHeader title="Interview review" sub="Compare your answers with the model answers and grade yourself honestly. Missed questions are added to your flash cards." />
      <div className="card summary">
        <Ring value={score} size={96} stroke={9} />
        <div className="stack">
          <div className="summary-stats">
            <div><b>{counts.got}</b><span className="small muted">Nailed it</span></div>
            <div><b>{counts.partial}</b><span className="small muted">Partly</span></div>
            <div><b>{counts.missed}</b><span className="small muted">Missed</span></div>
            <div><b>{session.qs.length - graded}</b><span className="small muted">Not graded</span></div>
          </div>
          <div className="row gap wrap">
            <button className="btn primary" onClick={again}>New interview</button>
            <button className="btn" onClick={() => go('cards')}>Practise missed cards</button>
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="row between">
          <h3>Questions</h3>
          <button className="link" onClick={() => setOpen(Object.fromEntries(session.qs.map((_, n) => [n, !allOpen])))}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
        </div>
        {session.qs.map((q, n) => {
          const g = session.grades[q.id];
          return (
            <div key={q.id} className={`review-item ${open[n] ? 'open' : ''}`}>
              <button className="review-head" onClick={() => setOpen({ ...open, [n]: !open[n] })} aria-expanded={!!open[n]}>
                <span className="num">{n + 1}</span>
                <span className="q">{q.q}</span>
                {g && <span className={`pill ${g === 'got' ? 'good' : g === 'partial' ? 'warn' : 'bad'}`}>{g === 'got' ? 'Nailed' : g === 'partial' ? 'Partly' : 'Missed'}</span>}
                <Icon name="chevron" className="chev" size={16} />
              </button>
              {open[n] && (
                <div className="review-body">
                  <div className="row gap wrap"><TopicTag q={q} /><LevelBadge level={q.level} /></div>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="eyebrow">Your answer</span>
                    <div className="yours">{session.answers[q.id] || <span className="faint">Skipped, no answer given.</span>}</div>
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="eyebrow">Model answer</span>
                    <Answer text={q.a} />
                  </div>
                  <div><ExplainButton item={{ kind: 'interview question', topicId: q.topic, topicLabel: q.subject, level: q.level, title: q.q, body: q.a }} /></div>
                  <div className="grade-row">
                    <span className="small muted">How did you do?</span>
                    <div className="seg" role="group" aria-label="Self grade">
                      {[['got', 'Nailed it'], ['partial', 'Partly'], ['missed', 'Missed']].map(([k, label]) => (
                        <button key={k} className={g === k ? `on ${k}` : ''} aria-pressed={g === k} onClick={() => grade(q.id, k)}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
