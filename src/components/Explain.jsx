import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadAI } from '../lib/store.js';
import { explainChat, EXPLAIN_MODES, effectiveModel } from '../lib/ai.js';
import { topicName } from '../data/index.js';
import Markdown from './Markdown.jsx';
import Icon from './icons.jsx';

const Ctx = createContext(() => {});
export const useExplain = () => useContext(Ctx);

export function ExplainButton({ item, label = 'Explain with AI' }) {
  const open = useExplain();
  return (
    <button className="btn sm ai-btn" onClick={() => open(item)}><Icon name="sparkles" size={14} /> {label}</button>
  );
}

const cache = new Map(); // in-memory, per page load

export function ExplainProvider({ children }) {
  const [item, setItem] = useState(null);
  const openIt = useCallback((it) => setItem({ ...it, topicLabel: it.topicLabel || topicName(it.topicId) }), []);
  return (
    <Ctx.Provider value={openIt}>
      {children}
      {item && <Drawer key={item.title} item={item} onClose={() => setItem(null)} />}
    </Ctx.Provider>
  );
}

function Drawer({ item, onClose }) {
  const [mode, setMode] = useState('simple');
  const [thread, setThread] = useState([]); // follow-ups after the first answer
  const [first, setFirst] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const cfg = loadAI();
  const hasKey = !!cfg.key;

  const runMode = useCallback(async (m) => {
    setMode(m); setThread([]); setErr('');
    const ck = `${item.title}|${m}`;
    if (cache.has(ck)) { setFirst(cache.get(ck)); return; }
    setFirst(null); setBusy(true);
    try {
      const text = await explainChat(loadAI(), item, m, []);
      cache.set(ck, text); setFirst(text);
    } catch (e) { setErr(e.message || String(e)); }
    setBusy(false);
  }, [item]);

  useEffect(() => { if (hasKey) runMode('simple'); }, []); // eslint-disable-line
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [thread, first, busy]);

  const ask = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || first === null) return;
    const history = [{ role: 'assistant', content: first }, ...thread, { role: 'user', content: text }];
    setThread([...thread, { role: 'user', content: text }]); setInput(''); setBusy(true); setErr('');
    try {
      // explainChat sends [firstUser, ...thread]; our thread starts with the assistant reply.
      const reply = await explainChat(loadAI(), item, mode, history);
      setThread((t) => [...t, { role: 'assistant', content: reply }]);
    } catch (e2) { setErr(e2.message || String(e2)); }
    setBusy(false);
  };

  return (
    <div className="drawer-wrap" role="dialog" aria-modal="true" aria-label="Explain with AI">
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <span className="eyebrow">Explain with AI</span>
            <h3 className="drawer-title">{item.title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </header>
        {!hasKey ? (
          <div className="drawer-body">
            <div className="notice">Add an API key to get plain-language explanations, deeper dives and worked examples. Gemini has a free tier.</div>
            <a className="btn primary" href="#/settings" onClick={onClose}>Open Settings</a>
          </div>
        ) : (
          <>
            <div className="drawer-modes">
              {Object.entries(EXPLAIN_MODES).map(([k, v]) => (
                <button key={k} className={mode === k ? 'on' : ''} disabled={busy} onClick={() => runMode(k)}>{v.label}</button>
              ))}
            </div>
            <div className="drawer-body" ref={bodyRef}>
              {first === null && busy && <div className="thinking"><span className="dots"><i /><i /><i /></span> Thinking…</div>}
              {first !== null && <Markdown text={first} />}
              {thread.map((m, n) => m.role === 'user'
                ? <div key={n} className="bubble-user">{m.content}</div>
                : <Markdown key={n} text={m.content} />)}
              {first !== null && busy && <div className="thinking"><span className="dots"><i /><i /><i /></span></div>}
              {err && <div className="notice err">{err}</div>}
            </div>
            <form className="drawer-foot" onSubmit={ask}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow-up question" aria-label="Follow-up question" disabled={first === null} />
              <button className="btn primary" disabled={!input.trim() || busy || first === null}>Ask</button>
            </form>
            <div className="drawer-note">AI can make mistakes. Check important details. Model: {effectiveModel(cfg)}</div>
          </>
        )}
      </aside>
    </div>
  );
}
