import React, { useRef, useState } from 'react';
import { useStore, setProfile, loadAI, saveAI, exportData, importData, resetAll } from '../lib/store.js';
import { LevelPicker, TopicPicker } from './Profile.jsx';
import { PROVIDERS } from '../lib/ai.js';
import * as cloud from '../lib/cloud.js';
import { useSync } from '../lib/useSync.jsx';

export default function Settings() {
  const { profile } = useStore();
  return (
    <div className="stack">
      <div className="card stack">
        <h1>Settings</h1>
        <h3>Profile</h3>
        <label className="field"><span>Name</span><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></label>
        <LevelPicker profile={profile} onChange={setProfile} />
        <h3>Default topics</h3>
        <TopicPicker value={profile.topics} onChange={(topics) => setProfile({ topics })} />
      </div>
      <AISettings />
      <CloudSettings />
      <DataSettings />
    </div>
  );
}

function AISettings() {
  const [cfg, setCfg] = useState(loadAI());
  const [saved, setSaved] = useState(false);
  const p = PROVIDERS[cfg.provider];
  const change = (patch) => { setCfg({ ...cfg, ...patch }); setSaved(false); };
  return (
    <div className="card stack">
      <h3>AI top-up (optional)</h3>
      <p className="muted small">Used by the Generate page. Calls go directly from your browser to the provider. The key is kept only in this browser and is never synced or uploaded.</p>
      <div className="grid2">
        <label className="field"><span>Provider</span>
          <select value={cfg.provider} onChange={(e) => change({ provider: e.target.value, model: '' })}>
            {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="field"><span>Model (blank = {p.model})</span>
          <input value={cfg.model} placeholder={p.model} onChange={(e) => change({ model: e.target.value })} />
        </label>
      </div>
      <label className="field"><span>API key</span>
        <input type="password" autoComplete="off" value={cfg.key} placeholder="Paste key" onChange={(e) => change({ key: e.target.value.trim() })} />
      </label>
      <div className="row between">
        <a href={p.link} target="_blank" rel="noreferrer">Get a key</a>
        <button className="btn primary" onClick={() => { saveAI(cfg); setSaved(true); }}>{saved ? 'Saved ✓' : 'Save'}</button>
      </div>
    </div>
  );
}

function CloudSettings() {
  const sync = useSync();
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const guard = async (fn) => { setMsg(''); try { await fn(); } catch (e) { setMsg(e.message || String(e)); } };

  if (!sync.configured) {
    return (
      <div className="card stack">
        <h3>Cloud sync (optional)</h3>
        <p className="muted small">Sign in to keep progress, flash-card boxes and generated content in sync across devices using your own free Firebase project (Auth + Firestore). See the README for the 5-minute setup, then paste the web app config here.</p>
        <textarea rows={5} value={text} placeholder={'{ apiKey: "...", authDomain: "...", projectId: "...", appId: "..." }'} onChange={(e) => setText(e.target.value)} />
        <div className="row end"><button className="btn primary" onClick={() => guard(() => { cloud.saveFirebaseConfig(text); sync.reconfigure(); })}>Enable cloud sync</button></div>
        {msg && <div className="notice err">{msg}</div>}
      </div>
    );
  }
  return (
    <div className="card stack">
      <h3>Cloud sync</h3>
      {sync.user ? (
        <>
          <p>Signed in as <b>{sync.user.email || sync.user.name}</b> - status: <b>{sync.status}</b></p>
          <div className="row end"><button className="btn" onClick={() => guard(cloud.signOutUser)}>Sign out</button></div>
        </>
      ) : (
        <>
          <button className="btn" onClick={() => guard(cloud.signInGoogle)}>Continue with Google</button>
          <div className="grid2">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password (6+ chars)" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="row gap">
            <button className="btn primary" onClick={() => guard(() => cloud.signInEmail(email, pw, false))}>Sign in</button>
            <button className="btn" onClick={() => guard(() => cloud.signInEmail(email, pw, true))}>Create account</button>
          </div>
        </>
      )}
      {(msg || sync.error) && <div className="notice err">{msg || sync.error}</div>}
      <button className="link" onClick={() => { cloud.clearFirebaseConfig(); location.reload(); }}>Remove saved Firebase config</button>
    </div>
  );
}

function DataSettings() {
  const file = useRef();
  const [msg, setMsg] = useState('');
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    a.download = `preppad-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  return (
    <div className="card stack">
      <h3>Your data</h3>
      <div className="row gap wrap">
        <button className="btn" onClick={download}>Export backup</button>
        <button className="btn" onClick={() => file.current.click()}>Import backup</button>
        <button className="btn danger" onClick={() => { if (confirm('Erase all progress and custom content on this device?')) resetAll(); }}>Reset everything</button>
        <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
          try { importData(await e.target.files[0].text()); setMsg('Imported.'); } catch (er) { setMsg(er.message); }
        }} />
      </div>
      {msg && <p className="muted small">{msg}</p>}
    </div>
  );
}
