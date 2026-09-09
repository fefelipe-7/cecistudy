import { describe, expect, it } from 'vitest';
import {
  buildAuthorSuggestions,
  findCatalogMatches,
  findMyReadingMatches,
  normalizeText,
  type CatalogWorkRef,
} from '../readingMatching';
import type { ReadingItem } from '../../types';

const reading = (overrides: Partial<ReadingItem>): ReadingItem => ({
  id: 'r-1',
  title: '',
  author: '',
  type: 'livro',
  status: 'nao_iniciado',
  ...overrides,
});

const work = (id: string, title: string, author: string): CatalogWorkRef => ({
  id,
  title,
  author,
});

describe('normalizeText', () => {
  it('minúsculo, sem acentos, sem pontuação, espaços colapsados', () => {
    expect(normalizeText('A Interpretação dos Sonhos!')).toBe('a interpretacao dos sonhos');
    expect(normalizeText('  O   Diário   de Anne  ')).toBe('o diario de anne');
  });
});

describe('findMyReadingMatches', () => {
  const readings = [
    reading({ id: 'r-1', title: 'A interpretação dos sonhos', author: 'freud' }),
    reading({ id: 'r-2', title: 'O diário de Anne Frank', author: 'anne frank' }),
    reading({ id: 'r-3', title: 'interps dos sonhos', author: '' }),
  ];

  it('acha duplicata exata ignorando acentos/caixa', () => {
    const matches = findMyReadingMatches('a interpretacao dos sonhos', readings);
    expect(matches.map((m) => m.id)).toEqual(['r-1']);
  });

  it('casa por inclusão nos dois sentidos quando os títulos são grandes', () => {
    expect(findMyReadingMatches('interpretação dos sonhos', readings).map((m) => m.id)).toContain('r-1');
  });

  it('inclusão vale a partir de 4 caracteres normalizados', () => {
    expect(findMyReadingMatches('sonh', [readings[0]]).map((m) => m.id)).toEqual(['r-1']);
    expect(findMyReadingMatches('son', [readings[0]])).toEqual([]);
  });

  it('ignora a própria leitura em edição (excludeId)', () => {
    const matches = findMyReadingMatches('a interpretação dos sonhos', readings, 'r-1');
    expect(matches.find((m) => m.id === 'r-1')).toBeUndefined();
  });

  it('título vazio → sem matches', () => {
    expect(findMyReadingMatches('   ', readings)).toEqual([]);
  });
});

describe('findCatalogMatches', () => {
  const works = [
    work('cat-1', 'A interpretação dos sonhos', 'Sigmund Freud'),
    work('inter-2', 'O poder do hábito', 'Charles Duhigg'),
  ];

  it('acha obra do catálogo pelo título normalizado', () => {
    expect(findCatalogMatches('interpretacao dos sonhos', works).map((w) => w.id)).toEqual(['cat-1']);
  });

  it('não acha nada quando não há semelhança', () => {
    expect(findCatalogMatches('memórias póstumas de brás cubas', works)).toEqual([]);
  });
});

describe('buildAuthorSuggestions', () => {
  it('dedupe por nome normalizado preservando a primeira grafia', () => {
    const suggestions = buildAuthorSuggestions({
      authors: [{ name: 'Sigmund Freud' }],
      readings: [
        reading({ author: 'sigmund freud' }),
        reading({ author: '' }),
        reading({ author: 'Carl Jung' }),
      ],
      catalogWorks: [work('cat-1', 'x', 'Freud')],
    });
    expect(suggestions).toEqual(['Sigmund Freud', 'Carl Jung']);
  });

  it('ignora autores vazios das leituras rápidas', () => {
    const suggestions = buildAuthorSuggestions({
      authors: [],
      readings: [reading({ author: '' }), reading({ author: '   ' })],
    });
    expect(suggestions).toEqual([]);
  });
});
