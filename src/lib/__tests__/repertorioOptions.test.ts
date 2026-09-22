import { describe, it, expect } from 'vitest';
import { buildBibliographyOptions } from '../repertorioOptions';
import type { MaterialItem, ReadingItem } from '../../types';

const readings: ReadingItem[] = [
  { id: 'r-1', title: 'Interpretação dos Sonhos', author: 'Freud', type: 'livro', status: 'lendo' },
  { id: 'r-2', title: 'O Mal-Estar', author: 'Freud', type: 'livro', status: 'concluido' },
];

const materials: MaterialItem[] = [
  { id: 'm-1', title: 'slides aula', type: 'slides', author: 'x', tags: [], addedAt: '2026-01-01' },
];

const catalog = {
  books: [{ id: 'cat-1', title: 'Manual de DSM', author: 'APA' }],
  interdisciplinary: [{ id: 'inter-1', title: 'Filosofia da Mente', author: 'Chalmers' }],
  articles: [{ id: 'art-1', title: 'Interpretação dos Sonhos', author: 'Freud' }],
};

describe('buildBibliographyOptions', () => {
  it('ordena banco pessoal (leitura + material) antes do catálogo', () => {
    const options = buildBibliographyOptions({ readings, materials, catalog });
    expect(options.map((o) => o.source)).toEqual(['reading', 'reading', 'material', 'cat-book', 'inter-book']);
  });

  it('dedupe: obra do catálogo com título já presente entre leituras pessoais some', () => {
    const options = buildBibliographyOptions({ readings, materials, catalog });
    // art-1 título é 'Interpretação dos Sonhos', igual a r-1 → deve sumir
    expect(options.map((o) => o.id)).not.toContain('art-1');
  });

  it('sem catálogo → só banco pessoal', () => {
    const options = buildBibliographyOptions({ readings, materials });
    expect(options.map((o) => o.source)).toEqual(['reading', 'reading', 'material']);
  });

  it('expõe hint e badge por fonte', () => {
    const options = buildBibliographyOptions({ readings, materials, catalog });
    const book = options.find((o) => o.source === 'cat-book');
    expect(book?.badge).toBe('livro');
    expect(book?.hint).toBe('por APA');
    const reading = options.find((o) => o.source === 'reading');
    expect(reading?.hint).toContain('por Freud');
  });
});