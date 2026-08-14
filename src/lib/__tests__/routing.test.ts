import { describe, expect, it } from 'vitest';
import {
  parseRoute,
  routeToStack,
  stackToHash,
  DEFAULT_SUB_TAB,
} from '../routing';

describe('parseRoute', () => {
  it('retorna home para hash vazio ou raiz', () => {
    expect(parseRoute('')).toEqual({ tab: 'home' });
    expect(parseRoute('#/')).toEqual({ tab: 'home' });
    expect(parseRoute('#/home')).toEqual({ tab: 'home' });
  });

  it('reconhece as 5 abas', () => {
    expect(parseRoute('#/faculdade').tab).toBe('faculdade');
    expect(parseRoute('#/estudos').tab).toBe('estudos');
    expect(parseRoute('#/biblioteca').tab).toBe('biblioteca');
    expect(parseRoute('#/perfil').tab).toBe('perfil');
  });

  it('reconhece disciplina (courseId) em /faculdade/:id', () => {
    expect(parseRoute('#/faculdade/c3')).toEqual({ tab: 'faculdade', focusedCourseId: 'c3' });
  });

  it('distingue sub-tab de courseId em /faculdade', () => {
    expect(parseRoute('#/faculdade/aulas')).toEqual({ tab: 'faculdade', subTab: 'aulas' });
    expect(parseRoute('#/faculdade/calendario')).toEqual({ tab: 'faculdade', subTab: 'calendario' });
  });

  it('reconhece sub-tabs de estudos e perfil', () => {
    expect(parseRoute('#/estudos/leituras')).toEqual({ tab: 'estudos', subTab: 'leituras' });
    expect(parseRoute('#/perfil/stickers')).toEqual({ tab: 'perfil', subTab: 'stickers' });
  });

  it('reconhece telas especiais da biblioteca', () => {
    expect(parseRoute('#/biblioteca/notas')).toEqual({ tab: 'biblioteca', notes: true });
    expect(parseRoute('#/biblioteca/templo')).toEqual({ tab: 'biblioteca', temple: true });
  });

  it('reconhece sub-tab da biblioteca', () => {
    expect(parseRoute('#/biblioteca/conceitos')).toEqual({ tab: 'biblioteca', subTab: 'conceitos' });
  });

  it('reconhece mood', () => {
    expect(parseRoute('#/mood')).toEqual({ mood: true });
  });

  it('reconhece composição de nota e wizard de detalhes', () => {
    expect(parseRoute('#/nota')).toEqual({ compose: true });
    expect(parseRoute('#/nota/detalhes')).toEqual({ composeDetails: true });
  });

  it('desconhecido cai em home', () => {
    expect(parseRoute('#/xyz')).toEqual({ tab: 'home' });
  });
});

describe('routeToStack', () => {
  it('monta pilha simples de tab', () => {
    expect(routeToStack({ tab: 'home' })).toEqual([{ kind: 'tab', tab: 'home' }]);
    expect(routeToStack({ tab: 'estudos', subTab: 'leituras' })).toEqual([
      { kind: 'tab', tab: 'estudos' },
    ]);
  });

  it('monta pilha com disciplina', () => {
    expect(routeToStack({ tab: 'faculdade', focusedCourseId: 'c3' })).toEqual([
      { kind: 'tab', tab: 'faculdade' },
      { kind: 'course', courseId: 'c3' },
    ]);
  });

  it('monta pilha de telas auxiliares', () => {
    expect(routeToStack({ mood: true })).toEqual([{ kind: 'tab', tab: 'home' }, { kind: 'mood' }]);
    expect(routeToStack({ notes: true })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'notes' },
    ]);
    expect(routeToStack({ temple: true })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'temple' },
    ]);
    expect(routeToStack({ compose: true })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'compose' },
    ]);
    expect(routeToStack({ composeDetails: true })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'compose' },
      { kind: 'composeDetails' },
    ]);
  });
});

describe('stackToHash', () => {
  it('serializa tab base sem sub-tab padrão', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'home' }])).toBe('#/home');
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }], 'sessoes')).toBe('#/estudos');
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }], DEFAULT_SUB_TAB.estudos)).toBe('#/estudos');
  });

  it('serializa sub-tab quando diferente da padrão', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }], 'leituras')).toBe('#/estudos/leituras');
    expect(stackToHash([{ kind: 'tab', tab: 'perfil' }], 'stickers')).toBe('#/perfil/stickers');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }], 'conceitos')).toBe('#/biblioteca/conceitos');
  });

  it('serializa telas auxiliares ignorando sub-tab', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }], 'aulas')).toBe('#/faculdade/c3');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'mood' }])).toBe('#/mood');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }])).toBe('#/biblioteca/notas');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'compose' }])).toBe('#/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'compose' }, { kind: 'composeDetails' }])).toBe('#/nota/detalhes');
  });
});

describe('round-trip hash ↔ rota', () => {
  it('reconstrói a rota a partir do hash serializado (abas + sub-tabs)', () => {
    const cases = ['#/home', '#/faculdade', '#/faculdade/c3', '#/faculdade/aulas', '#/estudos/leituras', '#/biblioteca/conceitos', '#/perfil/stickers', '#/biblioteca/notas', '#/biblioteca/templo', '#/mood', '#/nota', '#/nota/detalhes'];
    for (const h of cases) {
      const route = parseRoute(h);
      const stack = routeToStack(route);
      expect(stackToHash(stack, route.subTab)).toBe(h);
    }
  });

  it('sub-tab da aba base sobrevive à serialização quando não padrão', () => {
    const route = parseRoute('#/perfil/stickers');
    expect(route.subTab).toBe('stickers');
    const stack = routeToStack(route);
    const h = stackToHash(stack, route.subTab);
    expect(h).toBe('#/perfil/stickers');
    expect(parseRoute(h).subTab).toBe('stickers');
  });
});