import React from 'react';
import { useStore, setProfile } from '../lib/store.js';
import { LevelPicker, TopicPicker } from './Profile.jsx';
import { go } from '../lib/router.js';

export default function Onboarding() {
  const { profile } = useStore();
  const ready = profile.topics.length > 0;
  return (
    <div className="onboard">
      <div className="card paper-card">
        <h1 className="hand big">Welcome to PrepPad 📝</h1>
        <p className="muted">Tell me about your experience so every mock interview, flash card and note is pitched at the right level. You can change this any time in Settings.</p>
        <label className="field">
          <span>Your name (optional)</span>
          <input value={profile.name} placeholder="e.g. Manish" onChange={(e) => setProfile({ name: e.target.value })} />
        </label>
        <h3>Experience</h3>
        <LevelPicker profile={profile} onChange={setProfile} />
        <h3>What are you preparing for?</h3>
        <TopicPicker value={profile.topics} onChange={(topics) => setProfile({ topics })} />
        <div className="row end">
          <button className="btn primary" disabled={!ready} onClick={() => { setProfile({ onboarded: true }); go('home'); }}>
            {ready ? "Let's start" : 'Pick at least one topic'}
          </button>
        </div>
      </div>
    </div>
  );
}
