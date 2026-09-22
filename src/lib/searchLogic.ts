// Lógica pura da busquinha do cantinho (plano busca 2.0 / S.1).
// Agnóstica de entidade: o modal adapta cada coleção para `SearchEntry`.
// - `normalize`: minúsculo + sem acento (pt-BR: "analise" acha "análise")
// - score por campo: título ×3, tag ×2, corpo ×1, com AND entre palavras
// - `titleRanges`: índices NO TEXTO ORIGINAL (p/ <mark>), mapeando o NFD

export type SearchType =
  | 'concept'
  | 'author'
  | 'course'
  | 'class'
  | 'reading'
  | 'approach'
  | 'task'
  | 'exam'
  | 'note';

export interface SearchEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  type: SearchType;
  /** Rótulo pt-BR da entidade (ex.: 'conceito', 'tarefa'). */
  badge: string;
}

export type MatchField = 'title' | 'tag' | 'body';

export interface RankedResult extends SearchEntry {
  score: number;
  matchField: MatchField;
  /** Trechos do título original para destacar ([início, fim) ). */
  titleRanges: [number, number][];
}

export interface SearchSection {
  key: string;
  /** Rótulo minúsculo da seção (ex.: 'aulas'). */
  label: string;
  items: RankedResult[];
}

/** Ordem fixa das seções + rótulos (onde cada tipo "mora" no cantinho). */
const SECTION_OF: Record<SearchType, { key: string; label: string }> = {
  class: { key: 'aulas', label: 'aulas' },
  course: { key: 'disciplinas', label: 'disciplinas' },
  task: { key: 'tarefas', label: 'tarefas' },
  exam: { key: 'provas', label: 'provas' },
  concept: { key: 'conceitos', label: 'conceitos' },
  author: { key: 'autores', label: 'autores' },
  approach: { key: 'abordagens', label: 'abordagens' },
  reading: { key: 'leituras', label: 'leituras' },
  note: { key: 'notas', label: 'notas avulsas' },
};

const SECTION_ORDER = [
  'aulas',
  'disciplinas',
  'tarefas',
  'provas',
  'conceitos',
  'autores',
  'abordagens',
  'leituras',
  'notas',
];

const TITLE_WEIGHT = 3;
const TAG_WEIGHT = 2;
const BODY_WEIGHT = 1;

export const MAX_RECENTS = 6;

/** Minúsculo, sem acento, sem espaço nas bordas. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Divide a query em palavras normalizadas (AND entre elas). */
function tokensOf(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/**
 * Normaliza o título e devolve o mapa índice-normalizado → índice-original
 * (em code points, combinando com o fatiamento da UI). O NFD separa base +
 * diacrítico ("é" → "e" + ́); cada base herda o índice do code point original.
 */
function normalizeWithMap(title: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  let orig = 0;
  for (const ch of title.toLowerCase()) {
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (let i = 0; i < base.length; i++) {
      text += base[i];
      map.push(orig);
    }
    orig += 1;
  }
  return { text, map };
}

/**
 * Ranges [início, fim) no TÍTULO ORIGINAL para cada palavra da query.
 * Retorna [] se alguma palavra não aparece (semântica AND).
 */
export function titleRanges(title: string, query: string): [number, number][] {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return [];
  const { text, map } = normalizeWithMap(title);
  // Comprimento em code points (combina com o mapa e com o fatiamento da UI)
  const origLen = [...title].length;
  const ranges: [number, number][] = [];
  for (const tok of tokens) {
    let from = 0;
    let found = false;
    while (true) {
      const idx = text.indexOf(tok, from);
      if (idx === -1) break;
      found = true;
      const start = map[idx] ?? idx;
      const endOrig = map[idx + tok.length] ?? origLen;
      ranges.push([start, endOrig]);
      from = idx + tok.length;
    }
    if (!found) return [];
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}

/** Fatia o título em trechos normais/destaque a partir dos ranges (code points). */
export function splitMarked(title: string, ranges: [number, number][]): { text: string; mark: boolean }[] {
  const chars = [...title];
  const out: { text: string; mark: boolean }[] = [];
  let cursor = 0;
  for (const [s, e] of ranges) {
    if (s > cursor) out.push({ text: chars.slice(cursor, s).join(''), mark: false });
    out.push({ text: chars.slice(s, Math.max(e, s + 1)).join(''), mark: true });
    cursor = Math.max(e, s + 1);
  }
  if (cursor < chars.length) out.push({ text: chars.slice(cursor).join(''), mark: false });
  return out.filter((seg) => seg.text.length > 0);
}

/** Pontua a entrada (0 = descarta). AND: toda palavra precisa aparecer em algum campo. */
function scoreEntry(e: SearchEntry, tokens: string[]): { score: number; matchField: MatchField } | null {
  const titleNorm = normalize(e.title);
  const bodyNorm = normalize(e.body);
  const tagsNorm = e.tags.map(normalize);

  let score = 0;
  let matchField: MatchField = 'body';
  for (const tok of tokens) {
    const inTitle = titleNorm.includes(tok);
    const inTag = !inTitle && tagsNorm.some((t) => t.includes(tok));
    const inBody = !inTitle && !inTag && bodyNorm.includes(tok);
    if (!inTitle && !inTag && !inBody) return null;
    if (inTitle) {
      score += TITLE_WEIGHT;
      matchField = 'title';
    } else if (inTag) {
      score += TAG_WEIGHT;
      if (matchField !== 'title') matchField = 'tag';
    } else {
      score += BODY_WEIGHT;
    }
  }
  return { score, matchField };
}

/** Busca ordenada por relevância (maior score primeiro, estável). */
export function search(entries: SearchEntry[], query: string): RankedResult[] {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return [];
  const ranked: RankedResult[] = [];
  for (const e of entries) {
    const s = scoreEntry(e, tokens);
    if (!s) continue;
    ranked.push({
      ...e,
      score: s.score,
      matchField: s.matchField,
      titleRanges: titleRanges(e.title, query),
    });
  }
  return ranked
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.score - a.r.score || a.i - b.i)
    .map(({ r }) => r);
}

/** Agrupa por seção na ordem fixa, omitindo vazias. */
export function groupResults(results: RankedResult[]): SearchSection[] {
  const buckets = new Map<string, RankedResult[]>();
  for (const r of results) {
    const { key } = SECTION_OF[r.type];
    const list = buckets.get(key);
    if (list) list.push(r);
    else buckets.set(key, [r]);
  }
  return SECTION_ORDER.filter((key) => buckets.has(key)).map((key) => {
    const first = buckets.get(key)?.[0];
    return {
      key,
      label: first ? SECTION_OF[first.type].label : key,
      items: buckets.get(key) ?? [],
    };
  });
}

/** Empilha a busca nos recentes: no topo, sem duplicar, capa em MAX_RECENTS. */
export function pushRecent(recents: string[], query: string): string[] {
  const q = query.trim();
  if (!q) return recents;
  const norm = normalize(q);
  return [q, ...recents.filter((r) => normalize(r) !== norm)].slice(0, MAX_RECENTS);
}
