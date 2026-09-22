import { describe, it, expect } from 'vitest';
import {
  resolveCourseRepertorio,
  COURSE_REPERTORY_PREFIXES,
  isCatalogWorkId,
  isPersonalBibliographyId,
  CourseRepertorioEntities,
} from '../courseRepertorio';
import type { Course } from '../../types';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'Psicopatologia I',
    professor: 'Ana',
    semester: '6º semestre',
    schedule: [],
    color: '#FFD3DD',
    icon: 'Brain',
    ...overrides,
  };
}

const BASE_ENTITIES: CourseRepertorioEntities = {
  concepts: [
    { id: 'con-1', name: 'recalque', definition: 'def', authorIds: ['aut-1'], courseIds: [], tags: [] },
    { id: 'con-2', name: 'transferência', definition: 'def2', authorIds: ['aut-2'], courseIds: ['c1'], tags: [] },
  ],
  authors: [
    { id: 'aut-1', name: 'Freud', bio: 'bio', keyConcepts: [], majorWorks: [] },
    { id: 'aut-2', name: 'Lacan', bio: 'bio2', keyConcepts: [], majorWorks: [] },
  ],
  readings: [
    { id: 'r-1', title: 'Interpretação dos Sonhos', author: 'Freud', type: 'livro', status: 'lendo' },
    { id: 'r-2', title: 'O Mal-Estar', author: 'Freud', type: 'livro', status: 'nao_iniciado', courseId: 'c1' },
  ],
  materials: [{ id: 'm-1', title: 'slides aula', type: 'slides', author: 'x', tags: [], addedAt: '2026-01-01' }],
  classes: [
    { id: 'cl-1', courseId: 'c1', title: 'aula 1', number: 1, date: '2026-08-01', summary: 's', authorIds: ['aut-2'] },
  ],
  catalog: {
    books: [{ id: 'cat-1', title: 'Manual de DSM', author: 'APA' }],
    interdisciplinary: [{ id: 'inter-1', title: 'Filosofia da Mente', author: 'Chalmers' }],
    articles: [{ id: 'art-1', title: 'Evidências da TCC', author: 'Beck' }],
  },
};

describe('courseRepertorio — prefixos', () => {
  it('expõe os prefixos por fonte (tabela SPEC-001)', () => {
    expect(COURSE_REPERTORY_PREFIXES).toContain('r-');
    expect(COURSE_REPERTORY_PREFIXES).toContain('m-');
    expect(COURSE_REPERTORY_PREFIXES).toContain('cat-');
    expect(COURSE_REPERTORY_PREFIXES).toContain('inter-');
    expect(COURSE_REPERTORY_PREFIXES).toContain('art-');
  });

  it('classifica id de catálogo vs pessoal', () => {
    expect(isCatalogWorkId('cat-1')).toBe(true);
    expect(isCatalogWorkId('inter-1')).toBe(true);
    expect(isCatalogWorkId('art-1')).toBe(true);
    expect(isCatalogWorkId('r-1')).toBe(false);
    expect(isPersonalBibliographyId('r-1')).toBe(true);
    expect(isPersonalBibliographyId('m-1')).toBe(true);
    expect(isPersonalBibliographyId('cat-1')).toBe(false);
  });
});

describe('resolveCourseRepertorio', () => {
  it('curso sem vínculos → só o caminho legado', () => {
    const res = resolveCourseRepertorio(makeCourse(), BASE_ENTITIES);
    // legado: con-2 (courseIds), aut-2 (transitivo), r-2 (courseId)
    expect(res.concepts.map((c) => c.id)).toEqual(['con-2']);
    expect(res.authors.map((a) => a.id)).toEqual(['aut-2']);
    expect(res.bibliography.map((b) => ('ref' in b ? b.ref.id : b.title))).toEqual(['r-2']);
  });

  it('vínculos explícitos somam-se ao legado, sem duplicar', () => {
    const res = resolveCourseRepertorio(
      makeCourse({ conceptIds: ['con-1'], authorIds: ['aut-1'], bibliographyIds: ['cat-1'] }),
      BASE_ENTITIES
    );
    expect(res.concepts.map((c) => c.id)).toEqual(['con-1', 'con-2']);
    expect(res.authors.map((a) => a.id)).toEqual(['aut-1', 'aut-2']);
    expect(res.bibliography).toHaveLength(2); // cat-1 + r-2 (legado)
    expect(res.bibliography[0]).toEqual({ kind: 'cat-book', title: 'Manual de DSM', author: 'APA' });
  });

  it('bibliografia resolve todos os prefixos do catálogo', () => {
    const res = resolveCourseRepertorio(
      makeCourse({
        bibliographyIds: ['cat-1', 'inter-1', 'art-1', 'r-1', 'm-1'],
      }),
      BASE_ENTITIES
    );
    // explícitos (cat→inter→art→r→m) + legado r-2 (courseId c1)
    expect(res.bibliography.map((b) => b.kind)).toEqual([
      'cat-book',
      'inter-book',
      'article',
      'reading',
      'material',
      'reading',
    ]);
    const cat = res.bibliography[0];
    expect(cat).toEqual({ kind: 'cat-book', title: 'Manual de DSM', author: 'APA' });
    const inter = res.bibliography[1];
    expect(inter).toEqual({ kind: 'inter-book', title: 'Filosofia da Mente', author: 'Chalmers' });
    const art = res.bibliography[2];
    expect(art).toEqual({ kind: 'article', title: 'Evidências da TCC', author: 'Beck' });
  });

  it('id de vínculo órfão é ignorado (sem entidade no banco)', () => {
    const res = resolveCourseRepertorio(
      makeCourse({ conceptIds: ['con-inexistente'], bibliographyIds: ['cat-999'] }),
      BASE_ENTITIES
    );
    expect(res.concepts).toHaveLength(1); // só legado
    expect(res.bibliography).toHaveLength(1); // só legado r-2
  });

  it('dedup evita leitura duplicada quando vinculada e legada', () => {
    const res = resolveCourseRepertorio(
      makeCourse({ bibliographyIds: ['r-2'] }), // r-2 já é legada (courseId c1)
      BASE_ENTITIES
    );
    expect(res.bibliography.map((b) => ('ref' in b && b.kind === 'reading' ? b.ref.id : '')).filter(Boolean)).toEqual(['r-2']);
  });

  it('inclui materiais do caminho legado na bibliografia', () => {
    const entities: CourseRepertorioEntities = {
      ...BASE_ENTITIES,
      materials: [{ ...BASE_ENTITIES.materials[0], courseId: 'c1' }],
    };
    const res = resolveCourseRepertorio(makeCourse(), entities);
    expect(res.bibliography.some((b) => b.kind === 'material' && 'ref' in b && b.ref.id === 'm-1')).toBe(true);
  });
});