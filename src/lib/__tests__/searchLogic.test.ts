import { describe, expect, it } from 'vitest';
import {
  groupResults,
  normalize,
  pushRecent,
  search,
  titleRanges,
  type SearchEntry,
} from '../searchLogic';

const entry = (over: Partial<SearchEntry> = {}): SearchEntry => ({
  id: 'x-1',
  title: 'tríade cognitiva da depressão',
  body: 'beck explica os pensamentos automáticos',
  tags: ['tcc', 'beck'],
  type: 'concept',
  badge: 'conceito',
  ...over,
});

describe('normalize', () => {
  it('ignora acento, caixa e espaços', () => {
    expect(normalize('  Análise Cognitiva ')).toBe('analise cognitiva');
    expect(normalize('AÇÚCAR')).toBe('acucar');
  });
});

describe('titleRanges', () => {
  it('acha o termo no título com índices originais', () => {
    expect(titleRanges('tríade cognitiva', 'triade')).toEqual([[0, 6]]);
  });

  it('acha múltiplas ocorrências', () => {
    expect(titleRanges('aula 1 e aula 2', 'aula')).toEqual([[0, 4], [9, 13]]);
  });

  it('exige todas as palavras (AND)', () => {
    expect(titleRanges('tríade cognitiva', 'triade beck')).toEqual([]);
    expect(titleRanges('tríade cognitiva de beck', 'triade beck')).toEqual([[0, 6], [20, 24]]);
  });

  it('retorna vazio sem match', () => {
    expect(titleRanges('freud e o inconsciente', 'beck')).toEqual([]);
  });
});

describe('search', () => {
  it('query vazia retorna vazio', () => {
    expect(search([entry()], '')).toEqual([]);
    expect(search([entry()], '   ')).toEqual([]);
  });

  it('título pesa mais que corpo', () => {
    const titleHit = entry({ id: 't', title: 'ansiedade generalizada', body: 'outro assunto' });
    const bodyHit = entry({ id: 'b', title: 'outro assunto', body: 'fala de ansiedade aqui' });
    const [first, second] = search([bodyHit, titleHit], 'ansiedade');
    expect(first.id).toBe('t');
    expect(second.id).toBe('b');
  });

  it('tag conta mais que corpo e menos que título', () => {
    const tagHit = entry({ id: 'g', title: 'outro', body: 'nada', tags: ['ansiedade'] });
    const bodyHit = entry({ id: 'b', title: 'outro', body: 'ansiedade aqui', tags: [] });
    const [first] = search([bodyHit, tagHit], 'ansiedade');
    expect(first.id).toBe('g');
  });

  it('ignora acento nos dois lados', () => {
    const [hit] = search([entry()], 'analise');
    expect(hit).toBeUndefined();
    const e2 = entry({ id: 'a', title: 'análise do comportamento', body: '', tags: [] });
    expect(search([e2], 'analise')[0]?.id).toBe('a');
  });

  it('expõe o campo do match e os ranges do título', () => {
    const [hit] = search([entry()], 'beck');
    expect(hit.matchField).toBe('tag');
    expect(hit.titleRanges).toEqual([]);
    const [t] = search([entry()], 'triade');
    expect(t.matchField).toBe('title');
    expect(t.titleRanges).toEqual([[0, 6]]);
  });
});

describe('groupResults', () => {
  it('agrupa por seção em ordem fixa e some vazias', () => {
    const items = [
      entry({ id: 'n1', type: 'note' }),
      entry({ id: 'c1', type: 'class' }),
      entry({ id: 'a1', type: 'author' }),
    ].map((e) => ({ ...e, score: 1, matchField: 'title' as const, titleRanges: [] as [number, number][] }));
    const groups = groupResults(items);
    expect(groups.map((g) => g.key)).toEqual(['aulas', 'autores', 'notas']);
    expect(groups.map((g) => g.label)).toEqual(['aulas', 'autores', 'notas avulsas']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['c1']);
  });
});

describe('pushRecent', () => {
  it('empilha no começo sem duplicar (case-insensitive) e capa em 6', () => {
    let recents: string[] = [];
    recents = pushRecent(recents, 'beck');
    recents = pushRecent(recents, 'ansiedade');
    recents = pushRecent(recents, 'Beck');
    expect(recents).toEqual(['Beck', 'ansiedade']);
    for (const q of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) recents = pushRecent(recents, q);
    expect(recents).toHaveLength(6);
    expect(recents[0]).toBe('g');
  });

  it('ignora query vazia', () => {
    expect(pushRecent(['beck'], '  ')).toEqual(['beck']);
  });
});
