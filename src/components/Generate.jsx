import React, { useState } from 'react';
import { LEVELS, TOPICS, TOPIC_GROUPS } from '../data/index.js';
import { useStore, levelInfo, addCustom, loadAI } from '../lib/store.js';
import { generateQuestions, generateNote } from '../lib/ai.js';
import { LevelBadge, TopicTag, Answer, PageHeader, Segmented } from './ui.jsx';
import Icon from './icons.jsx';
import Sketch from './Sketch.jsx';

export default function Generate() {
  const s = useStore();
  const info = levelInfo(s.profile);
  const ai = loadAI();
  const [tab, setTab] = useState('questions');
  const [topic, setTopic] = useState(s.profile.topics[0] || 'java');
  const [custom, setCustom] = useState('');
  const [level, setLevel] = useState(info.primary);
  const [count, setCount] = useState(6);
  const [concept, setConcept] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [results, setResults] = useState([]);
  const [added, setAdded] = useState(false);

  const run = async () => {
    setBusy(true); setErr(''); setResults([]); setAdded(false);
    try {
      const useCustom = topic === '__custom' ? custom : '';
      if (topic === '__custom' && !custom.trim()) throw new Error('Type the topic you want, for example Kafka or Kubernetes.');
      if (tab === 'questions') {
        setResults(await generateQuestions(loadAI(), { topic, custom: useCustom, level, years: s.profile.years, count }));
      } else {
        if (!concept.trim()) throw new Error('Type the concept to explain, for example "Circuit breaker".');
        setResults([await generateNote(loadAI(), { topic, custom: useCustom, concept, level })]);
      }
    } catch (e) { setErr(e.message || String(e)); }
    setBusy(false);
  };
  const add = () => { addCustom(tab === 'questions' ? 'questions' : 'notes', results); setAdded(true); };

  return (
    <div className="stack-lg">
      <PageHeader title="Generate with AI" sub="Top up the built-in bank with fresh questions, or write a concept note on any technology. Uses your own API key and needs an internet connection." />
      {!ai.key && (
        <div className="notice"><Icon name="sparkles" size={16} /><span>No API key yet. <a href="#/settings">Add one in Settings</a>. A free Gemini key works.</span></div>
      )}
      <div className="card stack">
        <Segmented label="What to generate" value={tab} onChange={(t) => { setTab(t); setResults([]); }} options={[['questions', 'Interview questions'], ['note', 'Concept note']]} />
        <div className="grid3">
          <label className="field"><span>Topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPIC_GROUPS.map((g) => <optgroup key={g} label={g}>{TOPICS.filter((t) => t.group === g).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>)}
              <option value="__custom">Something else…</option>
            </select>
          </label>
          <label className="field"><span>Level</span>
            <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.years}</option>)}
            </select>
          </label>
          {tab === 'questions' ? (
            <label className="field"><span>How many</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>{[3, 6, 10, 15].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
          ) : (
            <label className="field"><span>Concept</span><input value={concept} placeholder="e.g. Circuit breaker" onChange={(e) => setConcept(e.target.value)} /></label>
          )}
        </div>
        {topic === '__custom' && (
          <label className="field"><span>Your topic</span>
            <input value={custom} placeholder="Kafka, Kubernetes, Terraform, Angular…" onChange={(e) => setCustom(e.target.value)} />
          </label>
        )}
        <div className="row between">
          <span className="hint">Your key stays in this browser and is sent only to the provider you choose.</span>
          <button className="btn primary" disabled={busy || !ai.key} onClick={run}>{busy ? 'Generating…' : 'Generate'}</button>
        </div>
        {err && <div className="notice err">{err}</div>}
      </div>

      {results.length > 0 && (
        <div className="stack">
          <div className="row between">
            <h2>Preview</h2>
            <button className="btn primary" disabled={added} onClick={add}>{added ? <><Icon name="check" size={15} /> Added</> : `Add ${results.length} to my bank`}</button>
          </div>
          {tab === 'questions' ? (
            <div className="card flush">
              {results.map((x) => (
                <div key={x.id} className="q-row">
                  <div className="row gap wrap"><TopicTag q={x} /><LevelBadge level={x.level} /><span className="pill ai">AI generated</span></div>
                  <h3 className="question" style={{ fontSize: '1.02rem' }}>{x.q}</h3>
                  <Answer text={x.a} />
                </div>
              ))}
            </div>
          ) : results.map((n) => (
            <article key={n.id} className="paper" style={{ maxWidth: 440 }}>
              <div className="paper-tape" />
              <h2>{n.title}</h2>
              {n.diagram && <Sketch diagram={n.diagram} seed={n.id} />}
              <ul className="hand-list">{n.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
              {n.code && <pre className="sticky"><code>{n.code}</code></pre>}
            </article>
          ))}
          <p className="hint">AI output can contain mistakes. Verify anything you plan to quote in an interview.</p>
        </div>
      )}
    </div>
  );
}
