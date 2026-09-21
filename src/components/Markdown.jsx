import React from 'react';

// Tiny, safe Markdown renderer (no innerHTML). Supports headings, bullets, numbered lists,
// fenced code, **bold**, *italic* and `inline code`.
function inline(text, key) {
  const out = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0; let m; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('`')) out.push(<code key={`${key}-${i++}`}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('**')) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>);
    else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={blocks.length}><code>{buf.join('\n')}</code></pre>);
    } else if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ''));
      blocks.push(<ul key={blocks.length}>{items.map((t, n) => <li key={n}>{inline(t, n)}</li>)}</ul>);
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push(<ol key={blocks.length}>{items.map((t, n) => <li key={n}>{inline(t, n)}</li>)}</ol>);
    } else if (/^#{1,4}\s+/.test(line)) {
      blocks.push(<h4 key={blocks.length}>{inline(line.replace(/^#{1,4}\s+/, ''), 'h')}</h4>);
      i++;
    } else if (!line.trim()) {
      i++;
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(```|\s*[-*•]\s+|\s*\d+[.)]\s+|#{1,4}\s+)/.test(lines[i])) buf.push(lines[i++]);
      blocks.push(<p key={blocks.length}>{inline(buf.join(' '), 'p')}</p>);
    }
  }
  return <div className="md">{blocks}</div>;
}
