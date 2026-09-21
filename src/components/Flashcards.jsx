import React, { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '../data/index.js';
import { useStore, levelInfo, allQuestions, rateCard } from '../lib/store.js';
import { Chip, TopicPicker } from './Profile.jsx';
import { LevelBadge, TopicTag, Empty } from './ui.jsx';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export default function Flashcards() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const [cfg, setCfg] = useState({ topics: s.profile.topics.length ? s.profile.topics : ['java'], levels: info.levels, mode: 'due' });
  const [deck, setDeck] = useState(null);

  const pool = () => {
    const now = Date.now();
    return allQuestions(s).filter((q) => {
      if (!cfg.topics.includes(q.topic) || !cfg.levels.includes(q.level)) return false;
      const c = s.cards[q.id];
      if (cfg.mode === 'due') return !c || c.due <= now;
      if (cfg.mode === 'weak') return c && c.box <= 2;
      return true;
    });
  };
  const counts = (() => {
    const base = allQuestions(s).filter((q) => cfg.topics.includes(q.topic) && cfg.levels.includes(q.level));
    const now = Date.now();
    return {
      all: base.length,
      due: base.filter((q) => !s.cards[q.id] || s.cards[q.id].due <= now).length,
      weak: base.filter((q) => s.cards[q.id] && s.cards[q.id].box <= 2).length,
    };
  })();

  if (deck) return <Deck cards={deck} exit={() => setDeck(null)} />;

  const toggleLevel = (id) => {
    const cur = new Set(cfg.levels);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size) setCfg({ ...cfg, levels: [...cur].sort() });
  };

  return (
    <div className="card stack">
      <h1>Flash cards</h1>
      <p className="muted">Spaced repetition: cards you know come back less often, cards you miss come back sooner.</p>
      <h3>Topics</h3>
      <TopicPicker value={cfg.topics} onChange={(topics) => setCfg({ ...cfg, topics })} extra={s.custom.questions.length ? [{ id: 'custom', name: 'My Custom Topics', icon: '✨' }] : []} />
      <h3>Levels</h3>
      <div className="chips">
        {LEVELS.map((l) => <Chip key={l.id} on={cfg.levels.includes(l.id)} onClick={() => toggleLevel(l.id)}>{l.name} <small>{l.years}</small></Chip>)}
        <button className="link" onClick={() => setCfg({ ...cfg, levels: info.levels })}>Reset to my profile</button>
      </div>
      <h3>Deck</h3>
      <div className="seg">
        {[['due', `Due & new (${counts.due})`], ['weak', `Weak spots (${counts.weak})`], ['all', `Everything (${counts.all})`]].map(([k, label]) => (
          <button key={k} className={cfg.mode === k ? 'on' : ''} onClick={() => setCfg({ ...cfg, mode: k })}>{label}</button>
        ))}
      </div>
      <div className="row end">
        <button className="btn primary" disabled={!pool().length} onClick={() => setDeck(shuffle(pool()).slice(0, 50))}>
          Start ({Math.min(50, pool().length)} cards)
        </button>
      </div>
      {!pool().length && <Empty>No cards match. Try another mode, more topics, or generate more on the Generate page.</Empty>}
    </div>
  );
}

function Deck({ cards, exit }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [tally, setTally] = useState({ know: 0, unsure: 0, again: 0 });
  const done = i >= cards.length;
  const c = cards[i];

  const rate = useCallback((r) => {
    if (!flip) return;
    rateCard(c.id, r);
    setTally((t) => ({ ...t, [r]: t[r] + 1 }));
    setFlip(false);
    setI((n) => n + 1);
  }, [flip, c]);

  useEffect(() => {
    const on = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || done) return;
      if (e.code === 'Space') { e.preventDefault(); setFlip((f) => !f); }
      if (e.key === '1') rate('again');
      if (e.key === '2') rate('unsure');
      if (e.key === '3') rate('know');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [rate, done]);

  if (done) {
    return (
      <div className="card stack center">
        <h1>Deck complete 🎉</h1>
        <p>✅ Know: <b>{tally.know}</b> &nbsp; 🤔 Unsure: <b>{tally.unsure}</b> &nbsp; 🔁 Again: <b>{tally.again}</b></p>
        <div className="row gap center-row"><button className="btn primary" onClick={exit}>Back to decks</button></div>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row between"><span className="muted">Card {i + 1} / {cards.length}</span><button className="btn ghost sm" onClick={exit}>Exit</button></div>
      <div className="progress"><div style={{ width: `${(i / cards.length) * 100}%` }} /></div>
      <div className={`flip ${flip ? 'flipped' : ''}`} onClick={() => setFlip(!flip)} role="button" tabIndex={0} aria-label="Flip card">
        <div className="flip-inner">
          <div className="face front">
            <div className="row gap"><TopicTag q={c} /><LevelBadge level={c.level} /></div>
            <h2 className="question">{c.q}</h2>
            <p className="muted small">Tap or press space to reveal the answer</p>
          </div>
          <div className="face back">
            <b className="muted small">Answer</b>
            <div className="answer">{c.a}</div>
          </div>
        </div>
      </div>
      <div className={`row gap center-row rate ${flip ? '' : 'disabled'}`}>
        <button className="btn" disabled={!flip} onClick={() => rate('again')}>🔁 Again <kbd>1</kbd></button>
        <button className="btn" disabled={!flip} onClick={() => rate('unsure')}>🤔 Unsure <kbd>2</kbd></button>
        <button className="btn primary" disabled={!flip} onClick={() => rate('know')}>✅ Know it <kbd>3</kbd></button>
      </div>
    </div>
  );
}
