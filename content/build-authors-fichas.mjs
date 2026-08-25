/**
 * Fichas curadas dos autores (`content/editorial/authorsCurated.json`).
 *
 * Fonte: corpus editorial em `content/authors-curated/` (139 autores canônicos,
 * auditoria em `cecistudy_auditoria_final.md`): manifest CSV + fichas markdown.
 *
 * Os autores são uma entidade de CONSULTA, totalmente separada das questões —
 * não existe mais contagem "questões que citam". Cada ficha vira um objeto
 * estruturado com identificação + seções editoriais (markdown) para a tela.
 *
 * Saída: { schemaVersion, generatedAt, families[], authors[] } com
 * authors[].sections = [{ title, body }] na ordem da ficha.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import path from 'path';
import { ROOT, EDITORIAL_DIR } from './temple-lib.mjs';

const CORPUS_DIR = path.join(ROOT, 'content', 'authors-curated');
const OUT_FILE = path.join(EDITORIAL_DIR, 'authorsCurated.json');

/** Parser CSV mínimo com suporte a campos entre aspas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

/** Separa o corpo da ficha em blocos por heading `## `. */
function splitSections(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;
  let buffer = [];
  for (const line of lines) {
    const match = /^## (.+)$/.exec(line.trim());
    if (match) {
      if (current) sections.push({ title: current, body: buffer.join('\n').trim() });
      current = match[1].trim();
      buffer = [];
    } else if (current) {
      buffer.push(line);
    }
  }
  if (current) sections.push({ title: current, body: buffer.join('\n').trim() });
  return sections;
}

/** Linha do blockquote "> **Em uma frase:** …" */
function extractOneLiner(markdown) {
  const match = /^>\s*\*\*Em uma frase:\*\*\s*(.+)$/m.exec(markdown);
  return match ? match[1].trim() : null;
}

/** Tabela "Identificação" → campos nomeados. */
function parseIdentification(body) {
  const rows = [...body.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)].slice(1);
  const get = (label) => rows.find((r) => r[1].toLowerCase() === label.toLowerCase())?.[2]?.trim();
  return {
    fullName: clean(get('Nome completo')),
    born: clean(get('Nascimento')),
    died: clean(get('Falecimento')),
    origin: clean(get('Nacionalidade e pertencimento histórico')),
    family: clean(get('Família teórica principal')),
    mainWork: clean(get('Obra principal sugerida')),
  };
}

function clean(v) {
  if (!v) return undefined;
  const t = String(v)
    .replace(/\[\d+\]/g, '') // citações [1]
    .replace(/\*/g, '') // ênfase markdown (*Obra*)
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > 0 ? t : undefined;
}

function main() {
  const manifestRows = parseCsv(readFileSync(path.join(CORPUS_DIR, 'cecistudy_canonical_manifest.csv'), 'utf8'));
  const header = manifestRows[0];
  const colOf = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const files = new Set(readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.md')));

  const families = new Set();
  const authors = [];

  for (const row of manifestRows.slice(1)) {
    const order = Number(row[colOf['order']]);
    const name = row[colOf['name']].trim();
    const aliases = (row[colOf['aliases']] ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    const authorFamilies = row[colOf['families']]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const filename = row[colOf['filename']].trim();

    const mdPath = path.join(CORPUS_DIR, filename);
    if (!files.has(filename)) {
      console.warn(`[authors-curated] ficha ausente: ${filename}`);
      continue;
    }
    files.delete(filename);

    const markdown = readFileSync(mdPath, 'utf8');
    const slug = filename.replace(/^cecistudy_ficha_/, '').replace(/\.md$/, '');
    const identification = (() => {
      const section = splitSections(markdown).find((s) => s.title.toLowerCase() === 'identificação');
      return section ? parseIdentification(section.body) : {};
    })();

    const SKIP_SECTIONS = new Set(['identificação', 'referências']);
    const sections = splitSections(markdown)
      .filter((s) => !SKIP_SECTIONS.has(s.title.toLowerCase()))
      .map((s) => ({ title: s.title, body: s.body }));

    for (const f of authorFamilies) families.add(f);

    authors.push({
      id: `author-${slug}`,
      name,
      slug,
      order,
      families: authorFamilies,
      aliases,
      oneLiner: extractOneLiner(markdown),
      ...identification,
      sections,
    });
  }

  if (files.size > 0) {
    console.warn(`[authors-curated] arquivos fora do manifest: ${[...files].join(', ')}`);
  }

  authors.sort((a, b) => a.order - b.order);

  const out = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    stats: { authors: authors.length, families: families.size },
    families: [...families],
    authors,
  };

  mkdirSync(EDITORIAL_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`);

  console.log(
    `[authors-curated] ${out.stats.authors} fichas · ${out.stats.families} famílias · ` +
      `${authors.filter((a) => a.oneLiner).length} com "em uma frase"`
  );
}

try {
  main();
} catch (e) {
  console.error('[authors-curated] falhou:', e);
  process.exit(1);
}
