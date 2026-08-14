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

  it('reconhece composição de nota e wizard de detalhes (com base)', () => {
    expect(parseRoute('#/nota')).toEqual({ compose: true, baseTab: 'home' });
    expect(parseRoute('#/nota/detalhes')).toEqual({ composeDetails: true, baseTab: 'home' });
    expect(parseRoute('#/biblioteca/nota')).toEqual({ compose: true, baseTab: 'biblioteca' });
    expect(parseRoute('#/estudos/nota/detalhes')).toEqual({
      composeDetails: true,
      baseTab: 'estudos',
    });
    expect(parseRoute('#/faculdade/c3/nota')).toEqual({
      compose: true,
      baseTab: 'faculdade',
      baseCourseId: 'c3',
    });
    expect(parseRoute('#/faculdade/c3/nota/detalhes')).toEqual({
      composeDetails: true,
      baseTab: 'faculdade',
      baseCourseId: 'c3',
    });
  });

  it('reconhece wizards de criação (com base opcional)', () => {
    expect(parseRoute('#/novo/conceito')).toEqual({ baseTab: 'home', wizard: 'concept' });
    expect(parseRoute('#/novo/flashcard').wizard).toBe('flashcard');
    expect(parseRoute('#/novo/prova').wizard).toBe('exam');
    expect(parseRoute('#/novo/tarefa').wizard).toBe('task');
    expect(parseRoute('#/novo/prova-atividade').wizard).toBe('task-exam');
    expect(parseRoute('#/novo/leitura').wizard).toBe('reading');
    expect(parseRoute('#/novo/estudo').wizard).toBe('session');
    expect(parseRoute('#/novo/estagio').wizard).toBe('internship');
    expect(parseRoute('#/novo/autor').wizard).toBe('author');
    expect(parseRoute('#/biblioteca/novo/conceito')).toEqual({
      baseTab: 'biblioteca',
      wizard: 'concept',
    });
    expect(parseRoute('#/faculdade/c3/novo/prova')).toEqual({
      baseTab: 'faculdade',
      baseCourseId: 'c3',
      wizard: 'exam',
    });
    expect(parseRoute('#/novo/xyz').wizard).toBeUndefined();
  });

  it('não confunde notas (plural) da biblioteca com composição', () => {
    expect(parseRoute('#/biblioteca/notas')).toEqual({ tab: 'biblioteca', notes: true });
    expect(parseRoute('#/faculdade/aulas')).toEqual({ tab: 'faculdade', subTab: 'aulas' });
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
    expect(routeToStack({ compose: true, baseTab: 'biblioteca' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'compose' },
    ]);
    expect(routeToStack({ compose: true, baseTab: 'faculdade', baseCourseId: 'c3' })).toEqual([
      { kind: 'tab', tab: 'faculdade' },
      { kind: 'course', courseId: 'c3' },
      { kind: 'compose' },
    ]);
    // wizard NÃO ganha compose fantasma (é empilhado após o compose já fechado)
    expect(routeToStack({ composeDetails: true })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'composeDetails' },
    ]);
    expect(routeToStack({ composeDetails: true, baseTab: 'faculdade', baseCourseId: 'c3' })).toEqual([
      { kind: 'tab', tab: 'faculdade' },
      { kind: 'course', courseId: 'c3' },
      { kind: 'composeDetails' },
    ]);
  });

  it('monta pilha de wizard de criação', () => {
    expect(routeToStack({ wizard: 'concept' })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'wizard', type: 'concept' },
    ]);
    expect(routeToStack({ wizard: 'task-exam' })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'wizard', type: 'task-exam' },
    ]);
    expect(routeToStack({ baseTab: 'biblioteca', wizard: 'concept' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'wizard', type: 'concept' },
    ]);
    expect(routeToStack({ baseTab: 'faculdade', baseCourseId: 'c3', wizard: 'exam' })).toEqual([
      { kind: 'tab', tab: 'faculdade' },
      { kind: 'course', courseId: 'c3' },
      { kind: 'wizard', type: 'exam' },
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
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'composeDetails' }])).toBe('#/nota/detalhes');
  });

  it('serializa composição com a base (aba/curso) preservada', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'compose' }])).toBe('#/biblioteca/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'compose' }])).toBe('#/faculdade/c3/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'composeDetails' }])).toBe('#/biblioteca/nota/detalhes');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'composeDetails' }])).toBe('#/faculdade/c3/nota/detalhes');
  });

  it('serializa wizard de criação com a base preservada', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'wizard', type: 'concept' }])).toBe('#/novo/conceito');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'wizard', type: 'task-exam' }])).toBe('#/novo/prova-atividade');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'wizard', type: 'concept' }])).toBe('#/biblioteca/novo/conceito');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'wizard', type: 'exam' }])).toBe('#/faculdade/c3/novo/prova');
  });
});

describe('round-trip hash ↔ rota', () => {
  it('reconstrói a rota a partir do hash serializado (abas + sub-tabs)', () => {
    const cases = ['#/home', '#/faculdade', '#/faculdade/c3', '#/faculdade/aulas', '#/estudos/leituras', '#/biblioteca/conceitos', '#/perfil/stickers', '#/biblioteca/notas', '#/biblioteca/templo', '#/mood', '#/nota', '#/nota/detalhes', '#/biblioteca/nota', '#/faculdade/c3/nota', '#/biblioteca/nota/detalhes', '#/faculdade/c3/nota/detalhes', '#/novo/conceito', '#/novo/prova-atividade', '#/biblioteca/novo/conceito', '#/faculdade/c3/novo/prova'];
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