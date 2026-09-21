import React from 'react';
import { LEVELS, TOPICS, levelForYears } from '../data/index.js';
import { levelInfo } from '../lib/store.js';

export const Chip = ({ on, onClick, children, title }) => (
  <button type="button" className={`chip ${on ? 'on' : ''}`} onClick={onClick} title={title} aria-pressed={on}>{children}</button>
);

export function LevelPicker({ profile, onChange }) {
  const auto = levelForYears(profile.years);
  const info = levelInfo(profile);
  const toggle = (id) => {
    const cur = new Set(profile.customLevels || []);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size) onChange({ customLevels: [...cur].sort(), levelMode: 'custom' });
  };
  return (
    <div className="stack">
      <label className="field">
        <span>Years of experience: <b>{profile.years}{profile.years >= 15 ? '+' : ''}</b></span>
        <input type="range" min="0" max="15" value={profile.years} onChange={(e) => onChange({ years: Number(e.target.value) })} />
      </label>
      <div className="seg">
        <button type="button" className={profile.levelMode === 'auto' ? 'on' : ''} onClick={() => onChange({ levelMode: 'auto' })}>
          Match my experience
        </button>
        <button type="button" className={profile.levelMode === 'custom' ? 'on' : ''} onClick={() => onChange({ levelMode: 'custom' })}>
          Choose levels myself
        </button>
      </div>
      {profile.levelMode === 'auto' ? (
        <p className="muted">
          At {profile.years} years you are treated as <b>{LEVELS[auto - 1].name}</b>. Questions mostly target that level, with some
          {auto > 1 ? ` ${LEVELS[auto - 2].name.toLowerCase()} fundamentals` : ' stretch questions'} mixed in.
        </p>
      ) : (
        <div className="chips">
          {LEVELS.map((l) => (
            <Chip key={l.id} on={(profile.customLevels || []).includes(l.id)} onClick={() => toggle(l.id)}>
              {l.name} <small>{l.years}</small>
            </Chip>
          ))}
        </div>
      )}
      <p className="muted small">Active levels: {info.levels.map((l) => LEVELS[l - 1].name).join(', ')}</p>
    </div>
  );
}

export function TopicPicker({ value, onChange, extra = [] }) {
  const all = [...TOPICS, ...extra];
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div>
      <div className="chips">
        {all.map((t) => (
          <Chip key={t.id} on={value.includes(t.id)} onClick={() => toggle(t.id)}>{t.icon} {t.name}</Chip>
        ))}
      </div>
      <div className="row gap small-links">
        <button type="button" className="link" onClick={() => onChange(all.map((t) => t.id))}>Select all</button>
        <button type="button" className="link" onClick={() => onChange([])}>Clear</button>
      </div>
    </div>
  );
}
