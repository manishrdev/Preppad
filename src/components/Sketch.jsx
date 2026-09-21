import React from 'react';

// Deterministic pseudo-random so a diagram looks the same on every render
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

// A wobbly hand-drawn rectangle
function roughRect(x, y, w, h, r) {
  const j = () => (r() - 0.5) * 4;
  const p = [[x + j(), y + j()], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + j(), y + h + j()]];
  const line = (a, b) => `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2 + j()},${(a[1] + b[1]) / 2 + j()} ${b[0] + j() / 2},${b[1] + j() / 2}`;
  return [line(p[0], p[1]), line(p[1], p[2]), line(p[2], p[3]), line(p[3], p[0]), line(p[0], [p[1][0] + 3, p[1][1] + 1])].join(' ');
}

function wrap(text, max = 17) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const COLORS = ['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#ddd6fe', '#fed7aa'];

export default function Sketch({ diagram, seed = 'x' }) {
  if (!diagram?.items?.length) return null;
  const r = rng(seed + diagram.items.join('|'));
  const items = diagram.items;
  const BW = 156, BH = 62, GX = 44, GY = 46;

  if (diagram.type === 'stack') {
    const W = BW + 60, H = items.length * (BH - 8 + 12) + 20;
    return (
      <svg className="sketch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="hand-drawn stack diagram">
        {items.map((t, i) => {
          const y = 10 + i * (BH + 4);
          return (
            <g key={i}>
              <path d={roughRect(30, y, BW, BH - 8, r)} fill={COLORS[i % COLORS.length]} stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" fillOpacity=".75" />
              <text x={30 + BW / 2} y={y + (BH - 8) / 2 + 6} textAnchor="middle" className="sk-text">
                {wrap(t, 20)[0]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // flow: wrap in rows of 3-4
  const cols = items.length <= 3 ? items.length : items.length === 4 ? 2 : 3;
  const rows = Math.ceil(items.length / cols);
  const W = cols * BW + (cols - 1) * GX + 24;
  const H = rows * BH + (rows - 1) * GY + 24;
  const pos = (i) => ({ x: 12 + (i % cols) * (BW + GX), y: 12 + Math.floor(i / cols) * (BH + GY) });
  return (
    <svg className="sketch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="hand-drawn flow diagram">
      <defs>
        <marker id={`ah-${seed}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1,1 L9,5 L1,9" fill="none" stroke="#2b2b2b" strokeWidth="1.8" strokeLinecap="round" />
        </marker>
      </defs>
      {items.map((t, i) => {
        const { x, y } = pos(i);
        const lines = wrap(t);
        const next = i < items.length - 1 ? pos(i + 1) : null;
        let arrow = null;
        if (next) {
          if (next.y === y) arrow = `M${x + BW + 3},${y + BH / 2} Q${x + BW + GX / 2},${y + BH / 2 + (r() - 0.5) * 8} ${next.x - 5},${next.y + BH / 2}`;
          else arrow = `M${x + BW / 2},${y + BH + 2} C${x + BW / 2},${y + BH + GY} ${next.x + BW / 2},${next.y - GY} ${next.x + BW / 2},${next.y - 5}`;
        }
        return (
          <g key={i}>
            <path d={roughRect(x, y, BW, BH, r)} fill={COLORS[i % COLORS.length]} fillOpacity=".75" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
            {lines.map((ln, li) => (
              <text key={li} x={x + BW / 2} y={y + BH / 2 + 6 - (lines.length - 1) * 9 + li * 18} textAnchor="middle" className="sk-text">{ln}</text>
            ))}
            {arrow && <path d={arrow} fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" markerEnd={`url(#ah-${seed})`} />}
          </g>
        );
      })}
    </svg>
  );
}
