import React from 'react';
import { useStore, setProfile } from '../lib/store.js';
import { LevelPicker, TopicPicker } from './Profile.jsx';
import { Logo } from './icons.jsx';
import { go } from '../lib/router.js';

export default function Onboarding() {
  const { profile } = useStore();
  const ready = profile.topics.length > 0;
  return (
    <div className="onboard">
      <div className="card onboard-card stack-lg" style={{ padding: 32 }}>
        <div className="stack">
          <div className="brand"><Logo /> PrepPad</div>
          <div>
            <h1>Let's set up your prep</h1>
            <p className="sub muted" style={{ marginTop: 6 }}>Questions, flash cards and notes are pitched at your level. You can change this any time in Settings.</p>
          </div>
        </div>
        <div className="stack">
          <h3><span className="step-num">1</span>About you</h3>
          <label className="field"><span>Name (optional)</span>
            <input value={profile.name} placeholder="Your name" onChange={(e) => setProfile({ name: e.target.value })} />
          </label>
        </div>
        <div className="stack">
          <h3><span className="step-num">2</span>Experience</h3>
          <LevelPicker profile={profile} onChange={setProfile} />
        </div>
        <div className="stack">
          <h3><span className="step-num">3</span>What are you preparing for?</h3>
          <TopicPicker value={profile.topics} onChange={(topics) => setProfile({ topics })} />
        </div>
        <div className="bar-actions" style={{ marginTop: 0 }}>
          <span className="hint">Progress is saved in this browser. Sign in later to sync across devices.</span>
          <button className="btn primary lg" disabled={!ready} onClick={() => { setProfile({ onboarded: true }); go('home'); }}>
            {ready ? 'Start preparing' : 'Pick at least one topic'}
          </button>
        </div>
      </div>
    </div>
  );
}
