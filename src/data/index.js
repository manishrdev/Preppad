import { java, oops, ds, javaVersions, python, sql } from './core.js';
import { spring, springboot, maven, restapi } from './backend.js';
import { jenkins, cicd, aws, architecture } from './devops.js';
import { react, javascript, html } from './web.js';

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

export const TOPICS = raw.map(([id, name, icon]) => ({ id, name, icon }));

export const BUILTIN_QUESTIONS = raw.flatMap(([topic, , , d]) =>
  d.questions.map(([level, q, a], i) => ({ id: `${topic}-${i + 1}`, topic, level, q, a, source: 'builtin' }))
);

export const BUILTIN_NOTES = raw.flatMap(([topic, , , d]) =>
  d.notes.map((n, i) => ({ id: `${topic}-n${i + 1}`, topic, ...n, source: 'builtin' }))
);

export const CUSTOM_TOPIC = { id: 'custom', name: 'My Custom Topics', icon: '✨' };
export const topicName = (id) => [...TOPICS, CUSTOM_TOPIC].find((t) => t.id === id)?.name || id;
export const topicIcon = (id) => [...TOPICS, CUSTOM_TOPIC].find((t) => t.id === id)?.icon || '📘';
