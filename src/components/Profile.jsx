import React from 'react';
import { LEVELS, TOPICS, TOPIC_GROUPS, CUSTOM_TOPIC, levelForYears } from '../data/index.js';
import { levelInfo } from '../lib/store.js';
import { Segmented, TopicDot } from './ui.jsx';

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
        <span>Years of experience: <b style={{ color: 'var(--text)' }}>{profile.years}{profile.years >= 15 ? '+' : ''}</b></span>
        <input type="range" min="0" max="15" value={profile.years} onChange={(e) => onChange({ years: Number(e.target.value) })} />
      </label>
      <Segmented
        label="Level selection" value={profile.levelMode} onChange={(levelMode) => onChange({ levelMode })}
        options={[['auto', 'Match my experience'], ['custom', 'Choose manually']]}
      />
      {profile.levelMode === 'auto' ? (
        <p className="hint">
          {profile.years} years maps to <b style={{ color: 'var(--text-2)' }}>{LEVELS[auto - 1].name}</b>. Questions target that level, with
          {auto > 1 ? ` ${LEVELS[auto - 2].name.toLowerCase()} fundamentals` : ' a few stretch questions'} mixed in.
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
      <p className="hint">Active levels: {info.levels.map((l) => LEVELS[l - 1].name).join(', ')}</p>
    </div>
  );
}

export function LevelChips({ levels, onChange, onReset }) {
  const toggle = (id) => {
    const cur = new Set(levels);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size) onChange([...cur].sort());
  };
  return (
    <div className="chips">
      {LEVELS.map((l) => (
        <Chip key={l.id} on={levels.includes(l.id)} onClick={() => toggle(l.id)}>{l.name} <small>{l.years}</small></Chip>
      ))}
      {onReset && <button type="button" className="link" onClick={onReset}>Reset to profile</button>}
    </div>
  );
}

export function TopicPicker({ value, onChange, custom = false }) {
  const groups = TOPIC_GROUPS.map((g) => [g, TOPICS.filter((t) => t.group === g)]);
  if (custom) groups.push([CUSTOM_TOPIC.group, [CUSTOM_TOPIC]]);
  const all = groups.flatMap(([, ts]) => ts.map((t) => t.id));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const toggleGroup = (ids) => {
    const allOn = ids.every((i) => value.includes(i));
    onChange(allOn ? value.filter((v) => !ids.includes(v)) : [...new Set([...value, ...ids])]);
  };
  return (
    <div className="stack">
      <div className="row gap">
        <span className="hint">{value.length} selected</span>
        <button type="button" className="link" onClick={() => onChange(all)}>Select all</button>
        <button type="button" className="link" onClick={() => onChange([])}>Clear</button>
      </div>
      {groups.map(([g, ts]) => {
        const ids = ts.map((t) => t.id);
        return (
          <div key={g} className="group">
            <div className="group-head">
              <span className="eyebrow">{g}</span>
              <button type="button" className="link" onClick={() => toggleGroup(ids)}>
                {ids.every((i) => value.includes(i)) ? 'Deselect' : 'Select'} group
              </button>
            </div>
            <div className="chips">
              {ts.map((t) => (
                <Chip key={t.id} on={value.includes(t.id)} onClick={() => toggle(t.id)}><TopicDot id={t.id} />{t.name}</Chip>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
