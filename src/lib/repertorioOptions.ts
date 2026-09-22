/**
 * Opções do seletor de repertório da disciplina (SPEC-001): bibliografia
 * = leituras/materiais pessoais + obras do catálogo estático (livros de
 * psicoterapia, interdisciplinares e artigos). Conceitos/autores usam o
 * `useAcervoTheory` (banco pessoal + acervo ✦) — este módulo é só o lado
 * de bibliografia, puro e síncrono.
 *
 * Dedupe por nome normalizado (padrão do acervo em `acervoBridge.ts`):
 * uma obra do catálogo cujo título já existe como leitura pessoal não é
 * oferecida de novo (evita duplicata aparente no seletor).
 */
import { normalizeText } from './readingMatching';
import type { MaterialItem, ReadingItem } from '../types';
import type {
  CatalogWorkRef,
  RepertorioCatalog,
} from './courseRepertorio';

export type BibliographySource =
  | 'reading'
  | 'material'
  | 'cat-book'
  | 'inter-book'
  | 'article';

export interface BibliographyOption {
  /** id real (prefixo conforme a fonte) armazenado em `Course.bibliographyIds`. */
  id: string;
  label: string;
  hint?: string;
  source: BibliographySource;
  /** Rótulo curto de origem exibido como badge (ex.: "livro", "artigo"). */
  badge: string;
}

const SOURCE_BADGE: Record<BibliographySource, string> = {
  reading: 'minha leitura',
  material: 'material',
  'cat-book': 'livro',
  'inter-book': 'livro',
  article: 'artigo',
};

/** Nome para o dedupe de títulos (o catálogo usa `nome`/`titulo`). */
function workTitle(work: CatalogWorkRef): string {
  return work.title;
}

export interface BibliographyOptionsInput {
  readings: ReadingItem[];
  materials: MaterialItem[];
  catalog?: RepertorioCatalog;
}

/**
 * Constrói as opções de bibliografia: banco pessoal primeiro (leituras +
 * materiais), depois o catálogo estático (deduplicado por título contra o
 * banco pessoal).
 */
export function buildBibliographyOptions(input: BibliographyOptionsInput): BibliographyOption[] {
  const options: BibliographyOption[] = [];

  input.readings.forEach((r) => {
    options.push({
      id: r.id,
      label: r.title,
      hint: `por ${r.author}${r.status === 'concluido' ? ' • concluída' : ''}`,
      source: 'reading',
      badge: SOURCE_BADGE.reading,
    });
  });

  input.materials.forEach((m) => {
    options.push({
      id: m.id,
      label: m.title,
      hint: `${m.type} • ${m.author}`,
      source: 'material',
      badge: SOURCE_BADGE.material,
    });
  });

  const catalog = input.catalog;
  if (!catalog) return options;

  // Dedupe: obras do catálogo cujo título já existe no banco pessoal somem
  // (a usuária já tem a leitura; vincular a pessoal é mais útil).
  const takenTitles = new Set<string>();
  input.readings.forEach((r) => takenTitles.add(normalizeText(r.title)));
  input.materials.forEach((m) => takenTitles.add(normalizeText(m.title)));
  const catalogueWork = (works: CatalogWorkRef[], source: 'cat-book' | 'inter-book' | 'article') =>
    works
      .filter((w) => !takenTitles.has(normalizeText(workTitle(w))))
      .map((w): BibliographyOption => ({
        id: w.id,
        label: w.title,
        hint: `por ${w.author}`,
        source,
        badge: SOURCE_BADGE[source],
      }));

  options.push(...catalogueWork(catalog.books, 'cat-book'));
  options.push(...catalogueWork(catalog.interdisciplinary, 'inter-book'));
  options.push(...catalogueWork(catalog.articles, 'article'));

  return options;
}