import React, { useRef, useState } from 'react';
import { useStore, setProfile, loadAI, saveAI, exportData, importData, resetAll } from '../lib/store.js';
import { LevelPicker, TopicPicker } from './Profile.jsx';
import { PROVIDERS, listModels, pickBest, clearResolved, effectiveModel } from '../lib/ai.js';
import * as cloud from '../lib/cloud.js';
import { useSync } from '../lib/useSync.jsx';
import { PageHeader } from './ui.jsx';
import Icon from './icons.jsx';

export default function Settings() {
  const { profile } = useStore();
  return (
    <div>
      <PageHeader title="Settings" sub="Your profile, integrations and data." />
      <div className="card">
        <div className="form-grid">
          <div className="lab"><h3>Profile</h3><p>Used to pitch questions at the right level.</p></div>
          <div className="stack">
            <label className="field"><span>Name</span><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></label>
            <LevelPicker profile={profile} onChange={setProfile} />
          </div>
        </div>
        <div className="form-grid">
          <div className="lab"><h3>Default topics</h3><p>Preselected in mock interviews and flash cards.</p></div>
          <TopicPicker value={profile.topics} onChange={(topics) => setProfile({ topics })} />
        </div>
        <AISettings />
        <CloudSettings />
        <DataSettings />
      </div>
    </div>
  );
}

function AISettings() {
  const [cfg, setCfg] = useState(loadAI());
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState([]);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  const p = PROVIDERS[cfg.provider];
  const change = (patch) => { setCfg({ ...cfg, ...patch }); setSaved(false); setTest(null); if (patch.provider || 'key' in patch) setModels([]); };
  const check = async () => {
    setBusy(true); setTest(null);
    try {
      const ids = await listModels(cfg);
      setModels(ids);
      setTest({ ok: true, msg: `Key works. ${ids.length} models available. Recommended: ${pickBest(cfg.provider, ids)}.`, best: pickBest(cfg.provider, ids) });
    } catch (e) { setTest({ ok: false, msg: e.message }); }
    setBusy(false);
  };
  const save = () => { clearResolved(); saveAI(cfg); setSaved(true); };
  return (
    <div className="form-grid">
      <div className="lab"><h3>AI features</h3><p>Powers question generation and "Explain with AI". Calls go directly from your browser to the provider. The key is never synced or uploaded.</p></div>
      <div className="stack">
        <div className="grid2">
          <label className="field"><span>Provider</span>
            <select value={cfg.provider} onChange={(e) => change({ provider: e.target.value, model: '' })}>
              {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Model (optional)</span>
            <input list="ai-models" value={cfg.model} placeholder={`Auto (${effectiveModel(cfg)})`} onChange={(e) => change({ model: e.target.value.trim() })} />
            <datalist id="ai-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
          </label>
        </div>
        <label className="field"><span>API key</span>
          <input type="password" autoComplete="off" value={cfg.key} placeholder="Paste your key" onChange={(e) => change({ key: e.target.value.trim() })} />
        </label>
        <p className="hint">Leave the model blank and PrepPad picks a current one, switching automatically if a model is retired.</p>
        {test && <div className={`notice ${test.ok ? '' : 'err'}`}>{test.msg}{test.ok && cfg.model !== test.best && <> <button className="btn sm" onClick={() => change({ model: test.best })}>Use it</button></>}</div>}
        <div className="row between wrap">
          <a className="small" href={p.link} target="_blank" rel="noreferrer">Get an API key</a>
          <div className="row">
            <button className="btn" disabled={!cfg.key || busy} onClick={check}>{busy ? 'Checking…' : 'Test key & load models'}</button>
            <button className="btn primary" onClick={save}>{saved ? <><Icon name="check" size={15} /> Saved</> : 'Save'}</button>
          </div>
        </div>
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

  return (
    <div className="form-grid">
      <div className="lab"><h3>Cloud sync</h3><p>Optional. Keep progress across devices with your own free Firebase project.</p></div>
      {!sync.configured ? (
        <div className="stack">
          <label className="field"><span>Firebase web config</span>
            <textarea rows={5} value={text} placeholder={'{ apiKey: "…", authDomain: "…", projectId: "…", appId: "…" }'} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="row between"><span className="hint">See DEPLOY.md for the 5 minute setup.</span>
            <button className="btn primary" onClick={() => guard(() => { cloud.saveFirebaseConfig(text); sync.reconfigure(); })}>Enable sync</button></div>
          {msg && <div className="notice err">{msg}</div>}
        </div>
      ) : (
        <div className="stack">
          {sync.user ? (
            <div className="row between wrap">
              <div><b>{sync.user.email || sync.user.name}</b><div className="small muted">Status: {sync.status}</div></div>
              <button className="btn" onClick={() => guard(cloud.signOutUser)}>Sign out</button>
            </div>
          ) : (
            <>
              <button className="btn" onClick={() => guard(cloud.signInGoogle)}><Icon name="cloud" size={16} /> Continue with Google</button>
              <div className="grid2">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
                <input type="password" placeholder="Password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Password" />
              </div>
              <div className="row gap">
                <button className="btn primary" onClick={() => guard(() => cloud.signInEmail(email, pw, false))}>Sign in</button>
                <button className="btn" onClick={() => guard(() => cloud.signInEmail(email, pw, true))}>Create account</button>
              </div>
            </>
          )}
          {(msg || sync.error) && <div className="notice err">{msg || sync.error}</div>}
          <div><button className="link" onClick={() => { cloud.clearFirebaseConfig(); window.location.reload(); }}>Remove saved Firebase config</button></div>
        </div>
      )}
    </div>
  );
}

function DataSettings() {
  const file = useRef();
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    a.download = `preppad-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  return (
    <div className="form-grid">
      <div className="lab"><h3>Your data</h3><p>Back up, restore, or start over.</p></div>
      <div className="stack">
        <div className="row gap wrap">
          <button className="btn" onClick={download}><Icon name="download" size={15} /> Export backup</button>
          <button className="btn" onClick={() => file.current.click()}><Icon name="upload" size={15} /> Import backup</button>
          {confirm ? (
            <>
              <button className="btn danger" onClick={() => { resetAll(); setConfirm(false); }}>Yes, erase everything</button>
              <button className="btn quiet" onClick={() => setConfirm(false)}>Cancel</button>
            </>
          ) : <button className="btn quiet danger" onClick={() => setConfirm(true)}><Icon name="trash" size={15} /> Reset all data</button>}
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            try { importData(await e.target.files[0].text()); setMsg('Backup imported.'); } catch (er) { setMsg(er.message); }
          }} />
        </div>
        {msg && <p className="hint">{msg}</p>}
      </div>
    </div>
  );
}
