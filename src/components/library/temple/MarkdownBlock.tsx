import React from 'react';

/**
 * Renderer minimalista p/ o markdown das fichas editoriais dos autores:
 * parágrafos, ### subtítulos, tabelas, listas, diagramas em code block e
 * ênfase inline (**negrito**, *itálico*, [n] citações, [texto](url)).
 * Não é um renderer genérico — cobre só o que o corpus editorial usa.
 */

type Inline = React.ReactNode;

function renderInline(text: string, keyPrefix: string): Inline[] {
  const nodes: Inline[] = [];
  const regex =
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[\d+\]|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-ceci-primary">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)!;
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-ceci-academic-strong underline decoration-ceci-border-academic hover:decoration-ceci-academic-strong break-all"
        >
          {label}
        </a>
      );
    } else if (/^\[\d+\]$/.test(token)) {
      nodes.push(
        <sup key={key} className="text-[10px] text-ceci-muted font-medium">
          {token.slice(1, -1)}
        </sup>
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderTable(lines: string[], keyPrefix: string): Inline {
  const rows = lines
    .filter((l) => !/^\|[\s|:-]+\|$/.test(l.trim())) // separador |---|---|
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim())
    );
  if (rows.length === 0) return null;
  const [head, ...body] = rows;
  return (
    <div key={keyPrefix} className="overflow-x-auto scrollbar-none -mx-1 px-1">
      <table className="w-full text-xs border-collapse">
        {head && (
          <thead>
            <tr>
              {head.map((cell, ci) => (
                <th
                  key={ci}
                  className="text-left font-semibold text-ceci-secondary uppercase tracking-wider py-2 pr-3 border-b border-ceci-border-default"
                >
                  {renderInline(cell, `${keyPrefix}-h${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-ceci-border-subtle last:border-b-0">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 pr-3 align-top text-ceci-primary leading-relaxed">
                  {renderInline(cell, `${keyPrefix}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const MarkdownBlock: React.FC<{ source: string; muted?: boolean }> = ({
  source,
  muted = false,
}) => {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // code block (diagramas em texto)
    if (trimmed.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre
          key={key++}
          className="font-mono text-[11px] leading-relaxed bg-surface-muted border border-ceci-border-subtle rounded-xl p-3 overflow-x-auto scrollbar-none text-ceci-secondary whitespace-pre"
        >
          {buf.join('\n')}
        </pre>
      );
      continue;
    }

    // tabela
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|[\s|:-]+\|\s*$/.test(lines[i + 1])) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        buf.push(lines[i]);
        i++;
      }
      blocks.push(<React.Fragment key={key++}>{renderTable(buf, `t${key}`)}</React.Fragment>);
      continue;
    }

    // subtítulo ###
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={key++} className="text-sm font-bold font-display text-ceci-primary pt-1">
          {renderInline(trimmed.slice(4), `h${key}`)}
        </h3>
      );
      i++;
      continue;
    }

    // listas (- / * / 1.)
    const isBullet = /^[-*]\s+/.test(trimmed);
    const isOrdered = /^\d+[.)]\s+/.test(trimmed);
    if (isBullet || isOrdered) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (isBullet && /^[-*]\s+/.test(t)) items.push(t.replace(/^[-*]\s+/, ''));
        else if (isOrdered && /^\d+[.)]\s+/.test(t)) items.push(t.replace(/^\d+[.)]\s+/, ''));
        else break;
        i++;
      }
      const ListTag = (isOrdered ? 'ol' : 'ul') as 'ol' | 'ul';
      blocks.push(
        <ListTag
          key={key++}
          className={`space-y-1.5 text-sm text-ceci-primary leading-relaxed ${
            isOrdered ? 'list-decimal' : 'list-disc'
          } pl-5 marker:text-ceci-brand`}
        >
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item, `l${key}-${ii}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // parágrafo (agrupa linhas contíguas não vazias)
    if (trimmed !== '') {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^\s*(\||```|###|[-*]\s|\d+[.)]\s)/.test(lines[i])) {
        buf.push(lines[i].trim());
        i++;
      }
      blocks.push(
        <p
          key={key++}
          className={`text-sm leading-relaxed ${muted ? 'text-ceci-secondary' : 'text-ceci-primary'}`}
        >
          {renderInline(buf.join(' '), `p${key}`)}
        </p>
      );
      continue;
    }

    i++;
  }

  return <div className="space-y-3">{blocks}</div>;
};
