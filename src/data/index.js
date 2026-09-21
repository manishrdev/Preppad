import { java, oops, ds, javaVersions, python, sql } from './core.js';
import { spring, springboot, maven, restapi } from './backend.js';
import { jenkins, cicd, aws, architecture } from './devops.js';
import { react, javascript, html } from './web.js';
import * as mCore from './more/core.js';
import * as mBackend from './more/backend.js';
import * as mDevops from './more/devops.js';
import * as mWeb from './more/web.js';
const more = { ...mCore, ...mBackend, ...mDevops, ...mWeb };

export const LEVELS = [
  { id: 1, name: 'Junior', years: '0-2 yrs', min: 0 },
  { id: 2, name: 'Mid-level', years: '3-5 yrs', min: 3 },
  { id: 3, name: 'Senior', years: '6-9 yrs', min: 6 },
  { id: 4, name: 'Lead / Architect', years: '10+ yrs', min: 10 },
];

export const levelForYears = (y) => {
  const yrs = Number(y) || 0;
  return [...LEVELS].reverse().find((l) => yrs >= l.min).id;
};

const raw = [
  ['java', 'Java', '☕', java],
  ['oops', 'OOP', '🧩', oops],
  ['ds', 'Data Structures', '🌳', ds],
  ['javaVersions', 'Java Versions', '🕰️', javaVersions],
  ['spring', 'Spring', '🌱', spring],
  ['springboot', 'Spring Boot', '🚀', springboot],
  ['restapi', 'REST API', '🔌', restapi],
  ['maven', 'Maven', '📦', maven],
  ['jenkins', 'Jenkins', '🤵', jenkins],
  ['cicd', 'CI/CD Pipeline', '♻️', cicd],
  ['aws', 'AWS', '☁️', aws],
  ['architecture', 'Architecture', '🏛️', architecture],
  ['react', 'React', '⚛️', react],
  ['javascript', 'JavaScript', '🟨', javascript],
  ['html', 'HTML & CSS', '🌐', html],
  ['python', 'Python', '🐍', python],
  ['sql', 'SQL', '🗄️', sql],
];

const GROUPS = {
  java: 'Languages & core', oops: 'Languages & core', ds: 'Languages & core', javaVersions: 'Languages & core',
  python: 'Languages & core', sql: 'Languages & core', javascript: 'Languages & core', html: 'Languages & core',
  spring: 'Frameworks & APIs', springboot: 'Frameworks & APIs', restapi: 'Frameworks & APIs', react: 'Frameworks & APIs',
  maven: 'Build, CI/CD & cloud', jenkins: 'Build, CI/CD & cloud', cicd: 'Build, CI/CD & cloud', aws: 'Build, CI/CD & cloud',
  architecture: 'Design & architecture',
};
export const TOPICS = raw.map(([id, name, icon]) => ({ id, name, icon, group: GROUPS[id] }));
export const TOPIC_GROUPS = [...new Set(Object.values(GROUPS))];

// stable colour per topic for the small dot next to its name
export const topicHue = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

// Original entries keep their ids; new content is appended so saved progress stays valid.
export const BUILTIN_QUESTIONS = raw.flatMap(([topic, , , d]) =>
  [...d.questions, ...(more[topic]?.questions || [])].map(([level, q, a], i) => ({ id: `${topic}-${i + 1}`, topic, level, q, a, source: 'builtin' }))
);

export const BUILTIN_NOTES = raw.flatMap(([topic, , , d]) =>
  [...d.notes, ...(more[topic]?.notes || [])].map((n, i) => ({ id: `${topic}-n${i + 1}`, topic, ...n, source: 'builtin' }))
);

// Short "quick recall" cards: used by Flash cards only (not mock interviews).
export const BUILTIN_CARDS = raw.flatMap(([topic]) =>
  (more[topic]?.cards || []).map(([level, q, a], i) => ({ id: `${topic}-c${i + 1}`, topic, level, q, a, source: 'builtin', kind: 'card' }))
);

export const CUSTOM_TOPIC = { id: 'custom', name: 'Custom topics', icon: '', group: 'Custom' };
export const topicName = (id) => [...TOPICS, CUSTOM_TOPIC].find((t) => t.id === id)?.name || id;
export const topicIcon = (id) => [...TOPICS, CUSTOM_TOPIC].find((t) => t.id === id)?.icon || '📘';
