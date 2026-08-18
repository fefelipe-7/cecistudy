import { describe, expect, it } from 'vitest';
import {
  parseRoute,
  routeToStack,
  stackToHash,
  DEFAULT_SUB_TAB,
} from '../routing';
import type { NavScreen, QuizConfig, QuizPlayState, QuizAnswer, StudyQuestion } from '../../types';

const QUESTION: StudyQuestion = {
  id: 'q1',
  question: 'pergunta?',
  answer: 'A',
  area: 'clínica',
};

const QUIZ_CONFIG: QuizConfig = {
  areas: ['clínica'],
  temas: [],
  escolas: [],
  dificuldades: ['basica'],
  count: 1,
};

const QUIZ_PLAY_STATE: QuizPlayState = {
  pool: [QUESTION],
  config: QUIZ_CONFIG,
  answers: [],
  currentIdx: 0,
  startTime: 0,
  questionStartTime: 0,
};

const QUIZ_RESULT_ARGS = {
  answers: [] as QuizAnswer[],
  config: QUIZ_CONFIG,
  startTime: 0,
  correctCount: 0,
  totalCount: 1,
};

const QUIZ_PLAY_SCREEN: NavScreen = { kind: 'quiz-play', state: QUIZ_PLAY_STATE };
const QUIZ_RESULT_SCREEN: NavScreen = {
  kind: 'quiz-result',
  ...QUIZ_RESULT_ARGS,
};

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

  it('reconhece telas dedicadas de estudos (sem sub-tabs)', () => {
    expect(parseRoute('#/estudos/foco')).toEqual({ tab: 'estudos', studyScreen: 'focus' });
    expect(parseRoute('#/estudos/revisar')).toEqual({ tab: 'estudos', studyScreen: 'revisar' });
    expect(parseRoute('#/estudos/leituras')).toEqual({ tab: 'estudos', studyScreen: 'leituras' });
    expect(parseRoute('#/estudos/historico')).toEqual({ tab: 'estudos', studyScreen: 'historico' });
    // retrocompat: antigas sub-tabs → telas dedicadas / quiz
    expect(parseRoute('#/estudos/flashcards')).toEqual({ tab: 'estudos', studyScreen: 'revisar' });
    expect(parseRoute('#/estudos/questoes')).toEqual({ tab: 'estudos', quizCategory: true });
  });

  it('perfil não tem sub-tabs — segmento desconhecido cai na aba base', () => {
    expect(parseRoute('#/perfil/xyz')).toEqual({ tab: 'perfil' });
  });

  it('reconhece o diário de estágio em /perfil/estagio', () => {
    expect(parseRoute('#/perfil/estagio')).toEqual({ tab: 'perfil', internshipDiary: true });
  });

  it('reconhece as telas de tcc e stickers em /perfil', () => {
    expect(parseRoute('#/perfil/tcc')).toEqual({ tab: 'perfil', tcc: true });
    expect(parseRoute('#/perfil/stickers')).toEqual({ tab: 'perfil', stickers: true });
  });

  it('reconhece telas especiais da biblioteca', () => {
    expect(parseRoute('#/biblioteca/notas')).toEqual({ tab: 'biblioteca', notes: true });
    expect(parseRoute('#/biblioteca/templo')).toEqual({ tab: 'biblioteca', temple: true });
  });

  it('reconhece detalhe e transformação de nota avulsa', () => {
    expect(parseRoute('#/biblioteca/notas/note-1')).toEqual({
      tab: 'biblioteca',
      noteDetailId: 'note-1',
    });
    expect(parseRoute('#/biblioteca/notas/note-1/transformar')).toEqual({
      tab: 'biblioteca',
      noteTransformId: 'note-1',
    });
  });

  it('reconhece famílias de psicoterapias e detalhe de família', () => {
    expect(parseRoute('#/biblioteca/familias')).toEqual({ tab: 'biblioteca', families: true });
    expect(parseRoute('#/biblioteca/familias/fam-01')).toEqual({
      tab: 'biblioteca',
      familyId: 'fam-01',
    });
    expect(parseRoute('#/biblioteca/abordagens/psic-04-01')).toEqual({
      tab: 'biblioteca',
      approachId: 'psic-04-01',
    });
  });

  it('reconhece sub-tab da biblioteca', () => {
    expect(parseRoute('#/biblioteca/conceitos')).toEqual({ tab: 'biblioteca', subTab: 'conceitos' });
  });

  it('reconhece a tela de streak com base dinâmica', () => {
    expect(parseRoute('#/streak')).toEqual({ tab: 'home', streak: true });
    expect(parseRoute('#/perfil/streak')).toEqual({ tab: 'perfil', streak: true });
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
    expect(parseRoute('#/novo/flashcard').wizard).toBe('flashcard');
    expect(parseRoute('#/novo/prova').wizard).toBe('exam');
    expect(parseRoute('#/novo/tarefa').wizard).toBe('task');
    expect(parseRoute('#/novo/prova-atividade').wizard).toBe('task-exam');
    expect(parseRoute('#/novo/leitura').wizard).toBe('reading');
    expect(parseRoute('#/novo/estudo').wizard).toBe('session');
    expect(parseRoute('#/novo/estagio').wizard).toBe('internship');
    expect(parseRoute('#/novo/autor').wizard).toBe('author');
    expect(parseRoute('#/novo/conceito').wizard).toBe('concept');
    expect(parseRoute('#/novo/material').wizard).toBe('material');
    // matéria (course) round-trip: o slug "materia" precisa existir no mapa reverso
    expect(parseRoute('#/novo/materia').wizard).toBe('course');
    expect(parseRoute('#/faculdade/c3/novo/materia')).toEqual({
      baseTab: 'faculdade',
      baseCourseId: 'c3',
      wizard: 'course',
    });
    expect(parseRoute('#/faculdade/novo/materia')).toEqual({
      baseTab: 'faculdade',
      wizard: 'course',
    });
    expect(parseRoute('#/faculdade/c3/novo/prova')).toEqual({
      baseTab: 'faculdade',
      baseCourseId: 'c3',
      wizard: 'exam',
    });
    // slug desconhecido → rota cai em home sem wizard
    expect(parseRoute('#/novo/xyz').wizard).toBeUndefined();
  });

  it('não confunde notas (plural) da biblioteca com composição', () => {
    expect(parseRoute('#/biblioteca/notas')).toEqual({ tab: 'biblioteca', notes: true });
    expect(parseRoute('#/faculdade/aulas')).toEqual({ tab: 'faculdade', subTab: 'aulas' });
  });

  it('degrada rotas de quiz (jogo/resultado) ao seletor de categorias', () => {
    expect(parseRoute('#/estudos/quiz')).toEqual({ tab: 'estudos', quizCategory: true });
    expect(parseRoute('#/estudos/quiz/play')).toEqual({ tab: 'estudos', quizCategory: true });
    expect(parseRoute('#/estudos/quiz/result')).toEqual({ tab: 'estudos', quizCategory: true });
    // hashes antigos/não-parseáveis (estado transitório não é serializável)
    expect(parseRoute('#/quiz/play')).toEqual({ tab: 'estudos', quizCategory: true });
    expect(parseRoute('#/quiz/result')).toEqual({ tab: 'estudos', quizCategory: true });
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

  it('monta pilha de telas dedicadas de estudos', () => {
    expect(routeToStack({ tab: 'estudos', studyScreen: 'focus' })).toEqual([
      { kind: 'tab', tab: 'estudos' },
      { kind: 'study', screen: 'focus' },
    ]);
    expect(routeToStack({ tab: 'estudos', studyScreen: 'revisar' })).toEqual([
      { kind: 'tab', tab: 'estudos' },
      { kind: 'study', screen: 'revisar' },
    ]);
  });

  it('monta pilha com disciplina', () => {
    expect(routeToStack({ tab: 'faculdade', focusedCourseId: 'c3' })).toEqual([
      { kind: 'tab', tab: 'faculdade' },
      { kind: 'course', courseId: 'c3' },
    ]);
  });

  it('monta pilha de telas auxiliares', () => {
    expect(routeToStack({ notes: true })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'notes' },
    ]);
    expect(routeToStack({ noteDetailId: 'note-1' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'notes' },
      { kind: 'noteDetail', noteId: 'note-1' },
    ]);
    expect(routeToStack({ noteTransformId: 'note-1' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'notes' },
      { kind: 'noteTransform', noteId: 'note-1' },
    ]);
    expect(routeToStack({ temple: true })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'temple' },
    ]);
    expect(routeToStack({ streak: true })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'streak' },
    ]);
    expect(routeToStack({ tab: 'perfil', streak: true })).toEqual([
      { kind: 'tab', tab: 'perfil' },
      { kind: 'streak' },
    ]);
    expect(routeToStack({ internshipDiary: true })).toEqual([
      { kind: 'tab', tab: 'perfil' },
      { kind: 'internshipDiary' },
    ]);
    expect(routeToStack({ tcc: true })).toEqual([
      { kind: 'tab', tab: 'perfil' },
      { kind: 'tcc' },
    ]);
    expect(routeToStack({ stickers: true })).toEqual([
      { kind: 'tab', tab: 'perfil' },
      { kind: 'stickers' },
    ]);
    expect(routeToStack({ tab: 'biblioteca', approachId: 'psic-04-01' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'approach', approachId: 'psic-04-01' },
    ]);
    expect(routeToStack({ tab: 'biblioteca', families: true })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'families' },
    ]);
    expect(routeToStack({ tab: 'biblioteca', familyId: 'fam-01' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'family', familyId: 'fam-01' },
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
    expect(routeToStack({ wizard: 'internship' })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'wizard', type: 'internship' },
    ]);
    expect(routeToStack({ wizard: 'task-exam' })).toEqual([
      { kind: 'tab', tab: 'home' },
      { kind: 'wizard', type: 'task-exam' },
    ]);
    expect(routeToStack({ baseTab: 'biblioteca', wizard: 'reading' })).toEqual([
      { kind: 'tab', tab: 'biblioteca' },
      { kind: 'wizard', type: 'reading' },
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
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }], 'conceitos')).toBe('#/biblioteca/conceitos');
  });

  it('serializa telas dedicadas de estudos', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }, { kind: 'study', screen: 'focus' }])).toBe('#/estudos/foco');
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }, { kind: 'study', screen: 'revisar' }])).toBe('#/estudos/revisar');
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }, { kind: 'study', screen: 'leituras' }])).toBe('#/estudos/leituras');
    expect(stackToHash([{ kind: 'tab', tab: 'estudos' }, { kind: 'study', screen: 'historico' }])).toBe('#/estudos/historico');
  });

  it('serializa telas auxiliares ignorando sub-tab', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }], 'aulas')).toBe('#/faculdade/c3');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'streak' }])).toBe('#/streak');
    expect(stackToHash([{ kind: 'tab', tab: 'perfil' }, { kind: 'streak' }])).toBe('#/perfil/streak');
    expect(stackToHash([{ kind: 'tab', tab: 'perfil' }, { kind: 'internshipDiary' }])).toBe('#/perfil/estagio');
    expect(stackToHash([{ kind: 'tab', tab: 'perfil' }, { kind: 'tcc' }])).toBe('#/perfil/tcc');
    expect(stackToHash([{ kind: 'tab', tab: 'perfil' }, { kind: 'stickers' }])).toBe('#/perfil/stickers');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }])).toBe('#/biblioteca/notas');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }, { kind: 'noteDetail', noteId: 'note-1' }])).toBe('#/biblioteca/notas/note-1');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }, { kind: 'noteTransform', noteId: 'note-1' }])).toBe('#/biblioteca/notas/note-1/transformar');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'approach', approachId: 'psic-04-01' }])).toBe('#/biblioteca/abordagens/psic-04-01');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'families' }])).toBe('#/biblioteca/familias');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'family', familyId: 'fam-01' }])).toBe('#/biblioteca/familias/fam-01');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'compose' }])).toBe('#/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'composeDetails' }])).toBe('#/nota/detalhes');
  });

  it('serializa telas de quiz com rota parseável por etapa', () => {
    const base = [{ kind: 'tab' as const, tab: 'estudos' as const }, { kind: 'quiz-category' as const }];
    expect(stackToHash(base)).toBe('#/estudos/quiz');
    expect(stackToHash([...base, QUIZ_PLAY_SCREEN])).toBe('#/estudos/quiz/play');
    expect(stackToHash([...base, QUIZ_PLAY_SCREEN, QUIZ_RESULT_SCREEN])).toBe('#/estudos/quiz/result');
  });

  it('serializa composição com a base (aba/curso) preservada', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'compose' }])).toBe('#/biblioteca/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'compose' }])).toBe('#/faculdade/c3/nota');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'composeDetails' }])).toBe('#/biblioteca/nota/detalhes');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'composeDetails' }])).toBe('#/faculdade/c3/nota/detalhes');
  });

  it('serializa wizard de criação com a base preservada', () => {
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'wizard', type: 'internship' }])).toBe('#/novo/estagio');
    expect(stackToHash([{ kind: 'tab', tab: 'home' }, { kind: 'wizard', type: 'task-exam' }])).toBe('#/novo/prova-atividade');
    expect(stackToHash([{ kind: 'tab', tab: 'biblioteca' }, { kind: 'wizard', type: 'reading' }])).toBe('#/biblioteca/novo/leitura');
    expect(stackToHash([{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c3' }, { kind: 'wizard', type: 'exam' }])).toBe('#/faculdade/c3/novo/prova');
  });
});

describe('round-trip hash ↔ rota', () => {
  it('reconstrói a rota a partir do hash serializado (abas + sub-tabs)', () => {
    const cases = ['#/home', '#/faculdade', '#/faculdade/c3', '#/faculdade/aulas', '#/estudos/foco', '#/estudos/revisar', '#/estudos/leituras', '#/estudos/historico', '#/biblioteca/conceitos', '#/biblioteca/notas', '#/biblioteca/notas/note-1', '#/biblioteca/notas/note-1/transformar', '#/biblioteca/templo', '#/biblioteca/familias', '#/biblioteca/familias/fam-01', '#/biblioteca/abordagens/psic-04-01', '#/streak', '#/perfil/streak', '#/perfil/estagio', '#/perfil/tcc', '#/perfil/stickers', '#/nota', '#/nota/detalhes', '#/biblioteca/nota', '#/faculdade/c3/nota', '#/biblioteca/nota/detalhes', '#/faculdade/c3/nota/detalhes', '#/novo/estagio', '#/novo/prova-atividade', '#/biblioteca/novo/leitura', '#/faculdade/c3/novo/prova', '#/novo/materia', '#/faculdade/novo/materia', '#/estudos/quiz'];
    for (const h of cases) {
      const route = parseRoute(h);
      const stack = routeToStack(route);
      expect(stackToHash(stack, route.subTab)).toBe(h);
    }
  });

  it('sub-tab da aba base sobrevive à serialização quando não padrão', () => {
    const route = parseRoute('#/biblioteca/conceitos');
    expect(route.subTab).toBe('conceitos');
    const stack = routeToStack(route);
    const h = stackToHash(stack, route.subTab);
    expect(h).toBe('#/biblioteca/conceitos');
    expect(parseRoute(h).subTab).toBe('conceitos');
  });
});