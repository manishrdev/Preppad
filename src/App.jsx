import React, { useEffect, useState } from 'react';
import { useRoute } from './lib/router.js';
import { useStore } from './lib/store.js';
import { SyncProvider, useSync } from './lib/useSync.jsx';
import Onboarding from './components/Onboarding.jsx';
import Home from './components/Home.jsx';
import Mock from './components/Mock.jsx';
import Flashcards from './components/Flashcards.jsx';
import Notes from './components/Notes.jsx';
import Browse from './components/Browse.jsx';
import Generate from './components/Generate.jsx';
import Settings from './components/Settings.jsx';

const NAV = [
  ['home', '🏠', 'Home'],
  ['mock', '🎤', 'Mock'],
  ['cards', '🃏', 'Cards'],
  ['notes', '📓', 'Notes'],
  ['browse', '📚', 'Bank'],
  ['generate', '✨', 'Generate'],
  ['settings', '⚙️', 'Settings'],
];
const VIEWS = { home: Home, mock: Mock, cards: Flashcards, notes: Notes, browse: Browse, generate: Generate, settings: Settings };

function SyncDot() {
  const { status, configured } = useSync();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const label = !configured ? 'Local' : status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing…' : status === 'error' ? 'Sync error' : 'Signed out';
  return <span className={`sync ${status}`} title={online ? 'Online' : 'Offline - built-in content still works'}>● {label}{!online && ' · offline'}</span>;
}

function Shell() {
  const route = useRoute();
  const { profile } = useStore();
  if (!profile.onboarded) return <Onboarding />;
  const View = VIEWS[route] || Home;
  return (
    <div className="app">
      <header className="top">
        <a className="brand hand" href="#/home">📝 PrepPad</a>
        <nav className="nav">
          {NAV.map(([id, icon, label]) => (
            <a key={id} href={`#/${id}`} className={route === id || (id === 'home' && !VIEWS[route]) ? 'active' : ''}>
              <span>{icon}</span><span className="lbl">{label}</span>
            </a>
          ))}
        </nav>
        <SyncDot />
      </header>
      <main className="main"><View /></main>
    </div>
  );
}

export default function App() {
  return <SyncProvider><Shell /></SyncProvider>;
}
