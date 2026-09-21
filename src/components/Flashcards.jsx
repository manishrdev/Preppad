import React, { useCallback, useEffect, useState } from 'react';
import { useStore, levelInfo, allDeck, rateCard } from '../lib/store.js';
import { TopicPicker, LevelChips } from './Profile.jsx';
import { LevelBadge, TopicTag, Empty, PageHeader, Segmented } from './ui.jsx';
import Icon from './icons.jsx';
import { ExplainButton } from './Explain.jsx';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export default function Flashcards() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const [cfg, setCfg] = useState({ topics: s.profile.topics.length ? s.profile.topics : ['java'], levels: info.levels, mode: 'due' });
  const [deck, setDeck] = useState(null);

  const base = allDeck(s).filter((q) => cfg.topics.includes(q.topic) && cfg.levels.includes(q.level));
  const now = Date.now();
  const counts = {
    all: base.length,
    due: base.filter((q) => !s.cards[q.id] || s.cards[q.id].due <= now).length,
    weak: base.filter((q) => s.cards[q.id] && s.cards[q.id].box <= 2).length,
  };
  const pool = base.filter((q) => {
    const c = s.cards[q.id];
    if (cfg.mode === 'due') return !c || c.due <= now;
    if (cfg.mode === 'weak') return c && c.box <= 2;
    return true;
  });

  if (deck) return <Deck cards={deck} exit={() => setDeck(null)} />;

  return (
    <div>
      <PageHeader title="Flash cards" sub="Spaced repetition: cards you know return less often, cards you miss come back sooner." />
      <div className="card">
        <div className="form-grid">
          <div className="lab"><h3>Topics</h3></div>
          <TopicPicker value={cfg.topics} onChange={(topics) => setCfg({ ...cfg, topics })} custom={s.custom.questions.length > 0} />
        </div>
        <div className="form-grid">
          <div className="lab"><h3>Difficulty</h3></div>
          <LevelChips levels={cfg.levels} onChange={(levels) => setCfg({ ...cfg, levels })} onReset={() => setCfg({ ...cfg, levels: info.levels })} />
        </div>
        <div className="form-grid">
          <div className="lab"><h3>Deck</h3><p>Choose which cards to study.</p></div>
          <Segmented label="Deck mode" value={cfg.mode} onChange={(mode) => setCfg({ ...cfg, mode })}
            options={[['due', `Due and new · ${counts.due}`], ['weak', `Weak spots · ${counts.weak}`], ['all', `Everything · ${counts.all}`]]} />
        </div>
        <div className="bar-actions">
          <span className="hint">{Math.min(50, pool.length)} cards in this session</span>
          <button className="btn primary lg" disabled={!pool.length} onClick={() => setDeck(shuffle(pool).slice(0, 50))}>
            <Icon name="play" size={14} /> Start studying
          </button>
        </div>
        {!pool.length && <div style={{ marginTop: 16 }}><Empty>No cards match. Try another deck mode, add topics, or generate more on the AI page.</Empty></div>}
      </div>
    </div>
  );
}

function Deck({ cards, exit }) {
  const s = useStore();
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
      <div className="deck stack-lg" style={{ paddingTop: 24 }}>
        <PageHeader title="Session complete" sub={`You reviewed ${cards.length} cards.`} />
        <div className="stats">
          <div className="stat"><div className="stat-l">Know it</div><div className="stat-v" style={{ color: 'var(--good)' }}>{tally.know}</div></div>
          <div className="stat"><div className="stat-l">Unsure</div><div className="stat-v" style={{ color: 'var(--warn)' }}>{tally.unsure}</div></div>
          <div className="stat"><div className="stat-l">Again</div><div className="stat-v" style={{ color: 'var(--bad)' }}>{tally.again}</div></div>
          <div className="stat"><div className="stat-l">Total</div><div className="stat-v">{cards.length}</div></div>
        </div>
        <div><button className="btn primary" onClick={exit}>Back to decks</button></div>
      </div>
    );
  }
  const box = s.cards[c.id]?.box || 0;
  return (
    <div className="deck stack">
      <div className="row between">
        <span className="muted small">Card {i + 1} of {cards.length}</span>
        <button className="btn sm quiet" onClick={exit}><Icon name="x" size={14} /> End session</button>
      </div>
      <div className="progress" aria-hidden="true">
        {cards.length <= 40 ? cards.map((x, n) => <i key={x.id} className={n < i ? 'done' : n === i ? 'now' : ''} />) : <><i className="done" style={{ flex: i || 0.0001 }} /><i style={{ flex: cards.length - i }} /></>}
      </div>
      <div className={`flip ${flip ? 'flipped' : ''}`} onClick={() => setFlip(!flip)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setFlip(!flip); }} aria-label={flip ? 'Showing answer, click to see question' : 'Click to reveal the answer'}>
        <div className="flip-inner">
          <div className="face front">
            <div className="row gap wrap"><TopicTag q={c} /><LevelBadge level={c.level} /></div>
            <h2 className="question">{c.q}</h2>
            <div className="face-foot"><span>Press <kbd>Space</kbd> to reveal</span>
              <span className="boxes" title={`Box ${box} of 5`}>{[1, 2, 3, 4, 5].map((b) => <i key={b} className={b <= box ? 'on' : ''} />)}</span></div>
          </div>
          <div className="face back">
            <div className="row gap wrap"><TopicTag q={c} /><LevelBadge level={c.level} /></div>
            <div className="answer">{c.a}</div>
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <ExplainButton item={{ kind: 'flash card', topicId: c.topic, topicLabel: c.subject, level: c.level, title: c.q, body: c.a }} label="Explain this card with AI" />
      </div>
      <div className={`rate ${flip ? '' : 'off'}`}>
        <button className="btn" disabled={!flip} onClick={() => rate('again')}>Again <kbd>1</kbd></button>
        <button className="btn" disabled={!flip} onClick={() => rate('unsure')}>Unsure <kbd>2</kbd></button>
        <button className="btn primary" disabled={!flip} onClick={() => rate('know')}>Know it <kbd>3</kbd></button>
      </div>
    </div>
  );
}
