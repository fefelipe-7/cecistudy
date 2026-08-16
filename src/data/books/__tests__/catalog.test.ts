import { describe, expect, it } from 'vitest';
import {
  catalogBooks,
  interdisciplinaryBooks,
  articles,
  psychotherapyCollections,
  complementaryCollections,
  articleGroups,
  mixedCollections,
} from '../index';
import { PSYCHOTHERAPY_FAMILIES, INTERDISCIPLINARY_AREAS } from '../families';

describe('catálogo de psicoterapias (apenas obras com edição brasileira)', () => {
  it('mantém apenas títulos em português (sem o marcador de edição não confirmada)', () => {
    expect(catalogBooks).toHaveLength(12);
    for (const b of catalogBooks) {
      expect(b.nome).not.toContain('sem edição brasileira confirmada');
    }
  });

  it('tem ids únicos', () => {
    const ids = new Set(catalogBooks.map((b) => b.id));
    expect(ids.size).toBe(catalogBooks.length);
  });

  it('distribui os livros pelas famílias com edição brasileira', () => {
    const byFamily = catalogBooks.reduce<Record<string, number>>((acc, b) => {
      acc[b.familia] = (acc[b.familia] ?? 0) + 1;
      return acc;
    }, {});
    expect(byFamily['01_psicanalitica_psicodinamica']).toBe(8);
    expect(byFamily['02_existencial_humanista']).toBe(1);
    expect(byFamily['07_interpessoal_relacional']).toBe(1);
    expect(byFamily['10_pragmaticos_objetivo']).toBe(2);
  });

  it('atribui cores de capa e acento a todos os livros', () => {
    for (const b of catalogBooks) {
      expect(b.coverColor).toMatch(/^#/);
      expect(b.accentColor).toMatch(/^#/);
    }
  });
});

describe('coleção interdisciplinar (100 livros)', () => {
  it('tem 100 livros com ids únicos', () => {
    expect(interdisciplinaryBooks).toHaveLength(100);
    const ids = new Set(interdisciplinaryBooks.map((b) => b.id));
    expect(ids.size).toBe(100);
  });

  it('distribui 10 livros por cada uma das 10 áreas', () => {
    const areas = Object.keys(INTERDISCIPLINARY_AREAS);
    expect(areas).toHaveLength(10);
    for (const area of areas) {
      expect(interdisciplinaryBooks.filter((b) => b.area === area)).toHaveLength(10);
    }
  });

  it('usa prefixo de id distinto do catálogo', () => {
    expect(interdisciplinaryBooks[0].id).toMatch(/^inter-/);
    expect(catalogBooks[0].id).toMatch(/^cat-/);
  });
});

describe('artigos científicos (150)', () => {
  it('tem 150 artigos com ids únicos e link direto', () => {
    expect(articles).toHaveLength(150);
    const ids = new Set(articles.map((a) => a.id));
    expect(ids.size).toBe(150);
    for (const a of articles) {
      expect(a.linkDireto).toBeTruthy();
    }
  });

  it('distribui 15 artigos por família', () => {
    for (const familia of Object.keys(PSYCHOTHERAPY_FAMILIES)) {
      expect(articles.filter((a) => a.familia === familia)).toHaveLength(15);
    }
  });
});

describe('coleções curadas geradas', () => {
  it('catálogo: só famílias com edição brasileira viram coleção', () => {
    expect(psychotherapyCollections).toHaveLength(4);
    for (const col of psychotherapyCollections) {
      expect(col.blockCategory).toBe('psicoterapias');
      expect(col.books.length).toBeGreaterThan(0);
    }
  });

  it('bagagem complementar: 10 coleções de áreas, 10 obras cada', () => {
    expect(complementaryCollections).toHaveLength(10);
    for (const col of complementaryCollections) {
      expect(col.blockCategory).toBe('complementar');
      expect(col.books).toHaveLength(10);
    }
  });

  it('os livros das coleções mapeiam para CollectionBook sem status (status deriva do readingProgress)', () => {
    const book = psychotherapyCollections[0].books[0];
    expect(book.id).toMatch(/^cat-/);
    expect(book.description).toBeTruthy();
    expect(book.quote).toBeTruthy();
    // status não existe mais no tipo - é derivado do readingProgress do usuário
    expect('status' in book).toBe(false);
  });
});

describe('categorias mistas (livros + artigos)', () => {
  it('gera coleções mistas com ids únicos e metadados', () => {
    expect(mixedCollections.length).toBeGreaterThan(0);
    const ids = new Set(mixedCollections.map((c) => c.id));
    expect(ids.size).toBe(mixedCollections.length);
    for (const col of mixedCollections) {
      expect(col.title).toBeTruthy();
      expect(col.icon).toBeTruthy();
      expect(col.color).toMatch(/^#/);
      expect(col.accent).toMatch(/^#/);
    }
  });

  it('cada coleção mista tem ao menos um livro e um artigo', () => {
    for (const col of mixedCollections) {
      expect(col.books.length).toBeGreaterThan(0);
      expect(col.articles.length).toBeGreaterThan(0);
    }
  });

  it('ids de livros e artigos não colidem entre si nas coleções mistas', () => {
    const bookIds = new Set(mixedCollections.flatMap((c) => c.books.map((b) => b.id)));
    const articleIds = new Set(mixedCollections.flatMap((c) => c.articles.map((a) => a.id)));
    for (const id of articleIds) {
      expect(bookIds.has(id)).toBe(false);
    }
  });
});

describe('grupos de artigos', () => {
  it('gera 10 grupos (um por família) cobrindo todos os artigos', () => {
    expect(articleGroups).toHaveLength(10);
    const total = articleGroups.reduce((acc, g) => acc + g.articles.length, 0);
    expect(total).toBe(150);
    for (const g of articleGroups) {
      expect(g.articles).toHaveLength(15);
      expect(g.label).toBeTruthy();
    }
  });
});
