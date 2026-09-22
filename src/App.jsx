import React, { useEffect, useState } from 'react';
import { useRoute } from './lib/router.js';
import { useStore } from './lib/store.js';
import { SyncProvider, useSync } from './lib/useSync.jsx';
import Icon, { Logo } from './components/icons.jsx';
import Onboarding from './components/Onboarding.jsx';
import Home from './components/Home.jsx';
import Roadmap from './components/Roadmap.jsx';
import Mock from './components/Mock.jsx';
import Flashcards from './components/Flashcards.jsx';
import Notes from './components/Notes.jsx';
import Browse from './components/Browse.jsx';
import Generate from './components/Generate.jsx';
import { ExplainProvider } from './components/Explain.jsx';
import Settings from './components/Settings.jsx';

const NAV = [
  ['home', 'home', 'Dashboard', 'Home'],
  ['roadmap', 'flag', 'Roadmap', 'Plan'],
  ['mock', 'mic', 'Mock interview', 'Mock'],
  ['cards', 'cards', 'Flash cards', 'Cards'],
  ['notes', 'notes', 'Concept notes', 'Notes'],
  ['browse', 'bank', 'Question bank', 'Bank'],
  ['generate', 'sparkles', 'Generate with AI', 'AI'],
  ['settings', 'settings', 'Settings', 'Settings'],
];
const VIEWS = { home: Home, roadmap: Roadmap, mock: Mock, cards: Flashcards, notes: Notes, browse: Browse, generate: Generate, settings: Settings };

/* ---- theme: light / dark, defaulting to the system setting ---- */
const THEME_KEY = 'preppad_theme';
function useTheme() {
  const read = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const [theme, setTheme] = useState(read());
  const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const effective = theme || (systemDark() ? 'dark' : 'light');
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme;
  }, [theme]);
  const toggle = () => {
    const next = effective === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };
  return { effective, toggle };
}

function SyncStatus() {
  const { status, configured, user } = useSync();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const label = !configured ? 'This device' : !user ? 'Not signed in' : status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing' : status === 'error' ? 'Sync error' : 'Signed out';
  const cls = !configured || !user ? '' : status;
  return <span className={`sync ${cls}`}>{label}{!online && ' · offline'}</span>;
}

function Shell() {
  const route = useRoute();
  const { profile } = useStore();
  const theme = useTheme();
  if (!profile.onboarded) return <Onboarding />;
  const View = VIEWS[route] || Home;
  const active = VIEWS[route] ? route : 'home';
  const initial = (profile.name || 'You').trim().charAt(0).toUpperCase();
  const ThemeBtn = (
    <button className="icon-btn" onClick={theme.toggle} aria-label="Toggle dark mode" title="Toggle theme">
      <Icon name={theme.effective === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/home"><Logo /> PrepPad</a>
        <nav className="side-nav" aria-label="Primary">
          {NAV.slice(0, 6).map(([id, icon, label]) => (
            <a key={id} href={`#/${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'page' : undefined}>
              <Icon name={icon} /> {label}
            </a>
          ))}
          <div className="eyebrow side-label">Tools</div>
          {NAV.slice(6).map(([id, icon, label]) => (
            <a key={id} href={`#/${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'page' : undefined}>
              <Icon name={icon} /> {label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <div className="row between">
            <div className="user-chip">
              <span className="avatar">{initial}</span>
              <div style={{ minWidth: 0 }}><b>{profile.name || 'Guest'}</b><SyncStatus /></div>
            </div>
            {ThemeBtn}
          </div>
        </div>
      </aside>
      <div>
        <div className="mobile-top"><a className="brand" href="#/home" style={{ padding: 0 }}><Logo size={24} /> PrepPad</a>{ThemeBtn}</div>
        <main className="content"><View /></main>
      </div>
      <nav className="bottom-nav" aria-label="Primary mobile">
        {NAV.map(([id, icon, , short]) => (
          <a key={id} href={`#/${id}`} className={active === id ? 'active' : ''}><Icon name={icon} size={20} />{short}</a>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return <SyncProvider><ExplainProvider><Shell /></ExplainProvider></SyncProvider>;
}
