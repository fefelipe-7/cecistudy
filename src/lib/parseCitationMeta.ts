/**
 * Parsers puros do enriquecimento de leitura (SPEC-012 §7.3, F7.5).
 *
 * A rede fica no adaptador (`enrichReading.ts`); aqui só transformação de
 * string/JSON em campos bibliográficos. Reutilizáveis em web e nativo, e
 * testáveis sem mock de `fetch`.
 *
 * Ordem de confiança (Q12):
 *   0. Crossref por DOI (`mapCrossrefWork`) — autores já vêm separados.
 *   1. metatags Highwire (`citation_*`).
 *   2. JSON-LD `ScholarlyArticle`/`Article`.
 *   3. `og:title` / `<title>` (autor fica vazio).
 */
import {
  parseAuthorString,
  type ReadingItem,
  type RefAuthor,
} from '../types';

/** Campos bibliográficos que o enriquecimento sabe preencher. */
export interface EnrichmentFields {
  title?: string;
  authors?: RefAuthor[];
  year?: string;
  container?: string;
  publisher?: string;
  place?: string;
  edition?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
};

/**
 * Título provisório = o host da URL (posto pelo `captureLink`, §8.5). É o único
 * caso em que o enriquecimento pode **sobrescrever** o título: trata-se de
 * placeholder, não de algo que a usuária digitou.
 */
export const isProvisionalTitle = (reading: { title: string; url?: string }): boolean =>
  !!reading.url && reading.title === hostOf(reading.url);

// ---------------------------------------------------------------------------
// DOI
// ---------------------------------------------------------------------------

/** Normaliza DOI: tira prefixo (`https://doi.org/`, `doi:`), minúsculas. */
export const normalizeDoi = (raw: string): string | null => {
  const trimmed = raw.trim();
  const doi = trimmed
    .replace(/^https?:\/\/dx\.doi\.org\//i, '')
    .replace(/^https?:\/\/doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim()
    .toLowerCase();
  if (!/^10\.\d{4,9}\/[^\s]+$/.test(doi)) return null;
  return doi;
};

/**
 * Extrai o DOI de um texto livre (URL `doi.org/…`, `doi:10.…`, ou `10.…` solto).
 * DOI inválido devolve `null` — o Crossref não é consultado.
 */
export const extractDoi = (text: string): string | null => {
  const fromUrl =
    /(?:doi\.org\/|dx\.doi\.org\/|doi:\s*|^|\s)(10\.\d{4,9}\/[^\s?&]+)/i.exec(text);
  return fromUrl ? normalizeDoi(fromUrl[1]) : null;
};

// ---------------------------------------------------------------------------
// HTML (metatags Highwire → JSON-LD → og:title) — §7.3
// ---------------------------------------------------------------------------

const decodeHtml = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));

interface MetaEntry {
  name: string;
  property: string;
  content: string;
}

const metaEntries = (html: string): MetaEntry[] => {
  const out: MetaEntry[] = [];
  const tagRe = /<meta\b[^>]*>/gi;
  const nameRe = /(?:name|property)=["']([^"']*)["']/i;
  const nameReBare = /(?:name|property)=([^\s>]+)/i;
  const contentRe = /content=["']([^"']*)["']/i;
  const contentReBare = /content=([^\s>]+)/i;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    const tag = m[0];
    const hitName = nameRe.exec(tag) ?? nameReBare.exec(tag);
    const hitContent = contentRe.exec(tag) ?? contentReBare.exec(tag);
    const name = hitName ? decodeHtml(hitName[1].trim()) : '';
    const content = hitContent ? decodeHtml(hitContent[1].trim()) : '';
    if (name && content) out.push({ name, property: name, content });
  }
  return out;
};

const metaContent = (html: string, key: string): string[] => {
  const keyL = key.toLowerCase();
  return metaEntries(html)
    .filter((e) => e.name.toLowerCase() === keyL)
    .map((e) => e.content);
};

const authorsFromNames = (names: string[]): RefAuthor[] => {
  const out: RefAuthor[] = [];
  for (const name of names) {
    // Highwire costuma trazer "Sobrenome, Nome"; sem vírgula **não adivinha**
    // (§7.3) — deixa para "conferir autores".
    const parsed = parseAuthorString(name);
    if (parsed) out.push(parsed);
  }
  return out;
};

const firstYear = (value?: string): string | undefined => {
  const hit = /(19|20)\d{2}/.exec(value ?? '');
  return hit ? hit[0] : undefined;
};

/** Quebra "72-89", "72–89", "e72-e89" em faixa; valor único (ex.: "e0881") mantém. */
const normalizePages = (value?: string): string | undefined => {
  const raw = value?.replace(/[–—]/g, '-').trim();
  if (!raw) return undefined;
  const range = /^(e?\d+)-(e?\d+)$/.exec(raw);
  if (range) {
    const strip = (s: string) => s.replace(/^e/, '');
    return `${strip(range[1])}-${strip(range[2])}`;
  }
  return raw;
};

/** Extrai `container`, `volume`, `pages`, `publisher` de um gráfico JSON-LD. */
const isArticleNode = (
  node: unknown,
): node is {
  ['@type']?: string | string[];
  headline?: string;
  name?: string;
  author?: unknown;
  datePublished?: string;
  isPartOf?: unknown;
  publisher?: unknown;
  volumeNumber?: string;
  issueNumber?: string;
  pageStart?: string;
  pageEnd?: string;
  pagination?: string;
  identifier?: unknown;
} => {
  if (!node || typeof node !== 'object') return false;
  const n = node as { '@type'?: string | string[] };
  const types = Array.isArray(n['@type']) ? n['@type'] : n['@type'] ? [n['@type']] : [];
  return types.includes('Article') || types.includes('ScholarlyArticle');
};

const ldAuthors = (author?: unknown): RefAuthor[] => {
  const list = Array.isArray(author) ? author : author == null ? [] : [author];
  const out: RefAuthor[] = [];
  for (const a of list) {
    if (!a || typeof a !== 'object') continue;
    const rec = a as { familyName?: string; givenName?: string; name?: string };
    if (rec.familyName) {
      out.push(rec.givenName ? { family: rec.familyName, given: rec.givenName } : { family: rec.familyName });
    } else if (rec.name) {
      const parsed = parseAuthorString(rec.name);
      if (parsed) out.push(parsed);
    }
  }
  return out;
};

const jsonLdTitleOf = (node: { headline?: string; name?: string }): string | undefined =>
  node.headline?.trim() || node.name?.trim();

/** Lê o `identifier` (string ou objeto com `@id`) e tenta extrair DOI. */
const ldIdentifierDoi = (identifier?: unknown): string | null => {
  if (typeof identifier === 'string') return extractDoi(identifier);
  if (identifier && typeof identifier === 'object') {
    const id = (identifier as { '@id'?: string })?.['@id'];
    if (id) return extractDoi(id);
  }
  return null;
};

const jsonLdBlocks = (html: string): unknown[] => {
  const blocks: unknown[] = [];
  const scriptRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim()) as unknown;
      blocks.push(parsed);
    } catch {
      // bloco JSON-LD inválido não derruba o resto do parse
    }
  }
  return blocks;
};

const scrapeJsonLd = (html: string): EnrichmentFields => {
  const fields: EnrichmentFields = {};
  for (const block of jsonLdBlocks(html)) {
    const nodes: unknown[] = [];
    if (Array.isArray(block)) nodes.push(...block);
    else if (block && typeof block === 'object') {
      const b = block as { '@graph'?: unknown[] };
      if (Array.isArray(b['@graph'])) nodes.push(...b['@graph']);
      else nodes.push(block);
    }
    for (const node of nodes) {
      if (!isArticleNode(node)) continue;
      const title = jsonLdTitleOf(node);
      if (title && !fields.title) fields.title = title;
      const authors = ldAuthors(node.author);
      if (authors.length && !fields.authors) fields.authors = authors;
      const year = firstYear(node.datePublished);
      if (year && !fields.year) fields.year = year;
      const part = node.isPartOf;
      if (part && typeof part === 'object') {
        const p = part as { name?: string; volumeNumber?: string; issueNumber?: string; publisher?: unknown };
        if (p.name?.trim() && !fields.container) fields.container = p.name.trim();
        if (p.volumeNumber && !fields.volume) fields.volume = p.volumeNumber;
        if (p.issueNumber && !fields.issue) fields.issue = p.issueNumber;
        if (p.publisher && typeof p.publisher === 'object') {
          const name = (p.publisher as { name?: string }).name;
          if (name?.trim() && !fields.publisher) fields.publisher = name.trim();
        }
      }
      if (node.pagination && !fields.pages) fields.pages = normalizePages(node.pagination);
      else if (!fields.pages) {
        const raw = `${node.pageStart ?? ''}${node.pageStart && node.pageEnd ? '-' : ''}${node.pageEnd ?? ''}`;
        fields.pages = normalizePages(raw);
      }
      const doi = ldIdentifierDoi(node.identifier);
      if (doi && !fields.doi) fields.doi = doi;
      return fields;
    }
  }
  return fields;
};

/**
 * `parseCitationMeta(html, url)`: raspa a página em busca de metadados
 * bibliográficos. Ordem Highwire → JSON-LD → `og:title`/`<title>` (§7.3).
 * Só preenche o que achar; nunca apaga o que a usuária digitou (isso é o
 * `mergeEnrichment`).
 */
export const parseCitationMeta = (html: string, _url: string): EnrichmentFields => {
  const fields: EnrichmentFields = {};

  // 1. Highwire (`citation_*`) — periódicos e repositórios.
  const highwireTitle = metaContent(html, 'citation_title')[0];
  const highwireAuthors = metaContent(html, 'citation_author');
  if (highwireTitle) fields.title = decodeHtml(highwireTitle);
  if (highwireAuthors.length) fields.authors = authorsFromNames(highwireAuthors);
  const container = metaContent(html, 'citation_journal_title')[0]
    ?? metaContent(html, 'citation_inbook_title')[0]
    ?? metaContent(html, 'citation_book_title')[0];
  if (container) fields.container = decodeHtml(container);
  const date = metaContent(html, 'citation_publication_date')[0] ?? metaContent(html, 'citation_date')[0];
  if (date) fields.year = firstYear(date);
  const volume = metaContent(html, 'citation_volume')[0];
  if (volume) fields.volume = volume;
  const issue = metaContent(html, 'citation_issue')[0];
  if (issue) fields.issue = issue;
  const first = metaContent(html, 'citation_firstpage')[0];
  const last = metaContent(html, 'citation_lastpage')[0];
  if (first) fields.pages = last ? normalizePages(`${first}-${last}`) : normalizePages(first);
  const doi = metaContent(html, 'citation_doi')[0];
  if (doi) {
    const normalized = normalizeDoi(doi);
    if (normalized) fields.doi = normalized;
  }
  if (fields.title || (fields.authors && fields.authors.length > 0)) return fields;

  // 2. JSON-LD — quando a página não usa Highwire.
  const ld = scrapeJsonLd(html);
  if (ld.title || ld.authors?.length) return { ...ld, ...(fields.container ? { container: fields.container } : {}) };

  // 3. Fallback: `og:title` / `<title>` (autor fica vazio — §7.3).
  const og = metaContent(html, 'og:title')[0] || metaContent(html, 'title')[0];
  if (og) fields.title = decodeHtml(og);
  return fields;
};

// ---------------------------------------------------------------------------
// Crossref (API pública de metadados por DOI) — §7.3 item 0
// ---------------------------------------------------------------------------

interface CrossrefJson {
  message?: {
    title?: string[];
    author?: { family?: string; given?: string; name?: string }[];
    ['container-title']?: string[];
    publisher?: string;
    volume?: string;
    issue?: string;
    page?: string;
    DOI?: string;
    ['published-print']?: { ['date-parts']?: number[][] };
    ['published-online']?: { ['date-parts']?: number[][] };
    issued?: { ['date-parts']?: number[][] };
  };
}

/**
 * `mapCrossrefWork(json)`: traduz a resposta do Crossref
 * (`GET api.crossref.org/works/<doi>`) em campos bibliográficos. Autores já vêm
 * separados (family/given) — é o que o §7.3 confia. Nunca lança: resposta
 * inesperada vira objeto vazio.
 */
export const mapCrossrefWork = (json: unknown): EnrichmentFields => {
  const record = (json as CrossrefJson)?.message;
  if (!record) return {};
  const fields: EnrichmentFields = {};
  const title = record.title?.[0]?.trim();
  if (title) fields.title = title;
  const authors = (record.author ?? []).map((a) => {
    if (a.family) return a.given ? { family: a.family, given: a.given } as RefAuthor : { family: a.family } as RefAuthor;
    const parsed = a.name ? parseAuthorString(a.name) : null;
    return parsed ?? null;
  }).filter((a): a is RefAuthor => a !== null);
  if (authors.length) fields.authors = authors;
  if (record['container-title']?.[0]) fields.container = record['container-title'][0];
  if (record.publisher) fields.publisher = record.publisher;
  if (record.volume) fields.volume = record.volume;
  if (record.issue) fields.issue = record.issue;
  if (record.page) fields.pages = normalizePages(record.page);
  if (record.DOI) {
    const doi = normalizeDoi(record.DOI);
    if (doi) fields.doi = doi;
  }
  const dateSrc = record['published-print'] ?? record['published-online'] ?? record.issued;
  const year = dateSrc?.['date-parts']?.[0]?.[0];
  if (typeof year === 'number') fields.year = String(year);
  return fields;
};

// ---------------------------------------------------------------------------
// Merge — preenche só campo vazio (§7.3)
// ---------------------------------------------------------------------------

type ReadingLike = Pick<
  ReadingItem,
  | 'title'
  | 'url'
  | 'authors'
  | 'year'
  | 'container'
  | 'publisher'
  | 'place'
  | 'edition'
  | 'volume'
  | 'issue'
  | 'pages'
  | 'doi'
>;

/**
 * `mergeEnrichment(reading, fields)`: devolve o patch que preenche **só** o que
 * está vazio. Nunca sobrescreve o que a usuária digitou; a única exceção é o
 * título provisório (host) posto pela captura. Marca `enrichStatus: 'ok'`.
 */
export const mergeEnrichment = (
  reading: ReadingLike,
  fields: EnrichmentFields,
): Partial<ReadingItem> => {
  const patch: Partial<ReadingItem> = {};
  const fill = <K extends keyof EnrichmentFields>(key: K, value?: string) => {
    const current = reading[key] as string | undefined;
    if ((current == null || current === '') && value) {
      (patch as Record<string, unknown>)[key] = value;
    }
  };

  if (!reading.authors || reading.authors.length === 0) {
    if (fields.authors?.length) patch.authors = fields.authors;
  }
  if (isProvisionalTitle(reading)) {
    if (fields.title) patch.title = fields.title;
  } else {
    fill('title', fields.title);
  }
  fill('year', fields.year);
  fill('container', fields.container);
  fill('publisher', fields.publisher);
  fill('place', fields.place);
  fill('edition', fields.edition);
  fill('volume', fields.volume);
  fill('issue', fields.issue);
  fill('pages', fields.pages);
  fill('doi', fields.doi);

  patch.enrichStatus = 'ok';
  return patch;
};