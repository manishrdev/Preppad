import React from 'react';
import { LEVELS, topicIcon, topicName } from '../data/index.js';

export const LevelBadge = ({ level }) => (
  <span className={`badge lv${level}`}>{LEVELS[level - 1]?.name}</span>
);

export const TopicTag = ({ q }) => (
  <span className="tag">{topicIcon(q.topic)} {q.subject || topicName(q.topic)}</span>
);

export const Answer = ({ text }) => <div className="answer">{text}</div>;

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-v">{value}</div>
      <div className="stat-l">{label}</div>
      {sub && <div className="stat-s">{sub}</div>}
    </div>
  );
}
