import React from 'react';
import { LEVELS, topicName, topicHue } from '../data/index.js';

export const TopicDot = ({ id }) => (
  <span className="tdot" style={{ background: `hsl(${topicHue(id)} 65% 55%)` }} aria-hidden="true" />
);

export const LevelBadge = ({ level }) => (
  <span className={`lvl lv${level}`}><i />{LEVELS[level - 1]?.name}</span>
);

export const TopicTag = ({ q }) => (
  <span className="tag"><TopicDot id={q.topic} />{q.subject || topicName(q.topic)}</span>
);

export const Answer = ({ text }) => <div className="answer">{text}</div>;

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function PageHeader({ title, sub, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="row gap">{actions}</div>}
    </header>
  );
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, text]) => (
        <button key={k} type="button" className={value === k ? 'on' : ''} aria-pressed={value === k} onClick={() => onChange(k)}>{text}</button>
      ))}
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 8, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null || value === undefined ? 0 : Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-label">{label ?? (value === null ? '–' : `${Math.round(v * 100)}%`)}</span>
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-l">{label}</div>
      <div className="stat-v">{value}</div>
      {sub && <div className="stat-s">{sub}</div>}
    </div>
  );
}
