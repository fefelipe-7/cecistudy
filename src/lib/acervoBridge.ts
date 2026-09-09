/**
 * Ponte acervo ⇄ banco pessoal: converte registros editoriais do templo
 * (`TempleConceptIndexEntry` / `TempleAuthor`) em rascunhos das entidades
 * pessoais (`PsychologyConcept` / `PsychologyAuthor`) — "copiar ao selecionar".
 *
 * Puro e síncrono: quem carrega o acervo é o loader dual (`templeData.ts`);
 * quem persiste é o AppContext (`adoptAcervoConcept/Author`).
 */
import type {
  PsychologyAuthor,
  PsychologyConcept,
  TempleAuthor,
  TempleConceptIndexEntry,
} from '../types';
import { normalizeText } from './readingMatching';

export type ConceptDraft = Omit<PsychologyConcept, 'id'>;
export type AuthorDraft = Omit<PsychologyAuthor, 'id'>;

/** Prefixos de pseudo-id usados nos seletores antes da adoção. */
export const ACERVO_CONCEPT_PREFIX = 'acervo-c:';
export const ACERVO_AUTHOR_PREFIX = 'acervo-a:';
export const isAcervoOptionId = (id: string): boolean =>
  id.startsWith(ACERVO_CONCEPT_PREFIX) || id.startsWith(ACERVO_AUTHOR_PREFIX);

/** Conceito do acervo → rascunho pessoal (sem abordagem/autores vinculados ainda). */
export function templeConceptToDraft(entry: TempleConceptIndexEntry): ConceptDraft {
  return {
    name: entry.name,
    definition: entry.definition,
    authorIds: [],
    courseIds: [],
    tags: entry.domainName ? ['acervo', entry.domainName.toLowerCase()] : ['acervo'],
  };
}

/** Autor curado do acervo → rascunho pessoal. */
export function templeAuthorToDraft(author: TempleAuthor): AuthorDraft {
  const lifespan = [author.born, author.died].filter(Boolean).join(' – ');
  return {
    name: author.name,
    bio: author.oneLiner ?? '',
    lifespan: lifespan || undefined,
    keyConcepts: [],
    majorWorks: author.mainWork ? [author.mainWork] : [],
  };
}

/** Itens do acervo cujo nome normalizado ainda não existe no banco pessoal. */
export function filterNewNames<T extends { name: string; id?: string }>(
  acervoItems: T[],
  personalItems: { name: string }[]
): T[] {
  const taken = new Set(personalItems.map((p) => normalizeText(p.name)));
  return acervoItems.filter((item) => {
    if (!item.name?.trim()) return false;
    return !taken.has(normalizeText(item.name));
  });
}
