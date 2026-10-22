import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Course, NavScreen } from '../../types';
import {
  BARRA_APARECE,
  buildContextBarConfig,
  type ContextBarConfigInput,
} from '../contextBarConfig';

const course: Course = {
  id: 'c1',
  name: 'psicologia clínica',
} as Course;

const handlers = {
  openWizard: vi.fn(),
  openCompose: vi.fn(),
  openEditCourse: vi.fn(),
  toggleBookmarkCourse: vi.fn(),
  setIsCreatingLooseNote: vi.fn(),
  openSearch: vi.fn(),
  openStudy: vi.fn(),
  openInternshipWizard: vi.fn(),
  openTccSheet: vi.fn(),
  openTccCapture: vi.fn(),
  openInternshipCaseSession: vi.fn(),
  handleNavigate: vi.fn(),
};

const baseInput: ContextBarConfigInput = {
  ...handlers,
  currentScreen: { kind: 'tab', tab: 'home' } as NavScreen,
  screenKey: 'tab-home',
  focusedCourse: undefined,
  bookmarkedCourseIds: [],
};

describe('buildContextBarConfig', () => {
  beforeEach(() => {
    // Os handlers são mocks compartilhados: sem limpar, uma chamada de um
    // teste anterior aparece no assertion do próximo.
    vi.clearAllMocks();
  });

  it('não aparece nas telas primárias (a barra de abas está lá)', () => {
    expect(buildContextBarConfig(baseInput)).toBeNull();
  });

  it('não aparece nos fluxos de formulário (que têm rodapé próprio)', () => {
    for (const kind of ['compose', 'composeDetails', 'wizard', 'noteDetail', 'noteTransform'] as const) {
      expect(buildContextBarConfig({ ...baseInput, currentScreen: { kind } as NavScreen })).toBeNull();
    }
  });

  it('não aparece nas telas que já têm FixedBottomBar', () => {
    for (const kind of [
      'classNote',
      'quiz-category',
      'quiz-group-detail',
      'quiz-result',
    ] as const) {
      expect(buildContextBarConfig({ ...baseInput, currentScreen: { kind } as NavScreen })).toBeNull();
    }
    expect(
      buildContextBarConfig({ ...baseInput, currentScreen: { kind: 'study', screen: 'leituras' } }),
    ).toBeNull();
    // foco imersivo é full-screen landscape: sem chrome
    expect(
      buildContextBarConfig({ ...baseInput, currentScreen: { kind: 'study', screen: 'focus' } }),
    ).toBeNull();
  });

  it('streak: a barra vai para o mesmo destino do botão da tela', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'streak' },
      screenKey: 'streak',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('ir-para-estudar');
    expect(cfg?.primaryActions[0].label).toBe('ir para estudar');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.handleNavigate).toHaveBeenCalledWith('estudos', 'sessoes');
  });

  it('disciplina: a barra oferece as mesmas ações do menu "novo registro" da tela', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'course', courseId: 'c1' },
      screenKey: 'course-c1',
      focusedCourse: course,
    });
    // Quatro candidatas — a setinha de expansão passa a existir de verdade.
    expect(cfg?.primaryActions.map((a) => a.label)).toEqual([
      'anotar aula',
      'nova prova',
      'registrar estudo',
      'registrar leitura',
    ]);
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openCompose).toHaveBeenCalledWith('c1');
    cfg?.primaryActions[1].onSelect();
    expect(handlers.openWizard).toHaveBeenCalledWith('exam', 'c1');
    cfg?.primaryActions[2].onSelect();
    expect(handlers.openWizard).toHaveBeenCalledWith('session', 'c1');
    cfg?.primaryActions[3].onSelect();
    expect(handlers.openWizard).toHaveBeenCalledWith('reading', 'c1');
  });

  it('estágio > diário: a barra é a dona da primária e abre o wizard de estágio', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'internshipDiary', tab: 'diario' },
      screenKey: 'estagio-diario',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('nova-anotacao-estagio');
    expect(cfg?.primaryActions[0].label).toBe('anotar');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openInternshipWizard).toHaveBeenCalledTimes(1);
  });

  it('estágio > pacientes: a barra semeia o kind do atendimento', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'internshipDiary', tab: 'pacientes' },
      screenKey: 'estagio-pacientes',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('novo-atendimento');
    expect(cfg?.primaryActions[0].label).toBe('anotar atendimento');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openInternshipWizard).toHaveBeenCalledWith({
      kind: 'atendimento_clinico',
    });
  });

  it('estágio > supervisão: a barra semeia o kind da supervisão', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'internshipDiary', tab: 'supervisao' },
      screenKey: 'estagio-supervisao',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('nova-supervisao');
    expect(cfg?.primaryActions[0].label).toBe('anotar supervisão');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openInternshipWizard).toHaveBeenCalledWith({ kind: 'supervisao' });
  });

  it('estágio > caso: a barra pede a sessão com o caso preenchido (quem semeia é o motor)', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'internshipCase', patientKey: 'abc' },
      screenKey: 'estagio-caso-abc',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('nova-sessao-caso');
    expect(cfg?.primaryActions[0].label).toBe('nova sessão');
    cfg?.primaryActions[0].onSelect();
    // A barra **não** semeia a chave normalizada ("ms"): quem conhece o caso
    // é o motor (`openInternshipCaseSession`).
    expect(handlers.openInternshipCaseSession).toHaveBeenCalledTimes(1);
    expect(handlers.openInternshipWizard).not.toHaveBeenCalled();
  });

  it('estudos > revisar: ação principal "criar flashcard" chama openWizard flashcard', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'study', screen: 'revisar' },
      screenKey: 'estudos-revisar',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('criar-flashcard');
    expect(cfg?.primaryActions[0].label).toBe('criar flashcard');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openWizard).toHaveBeenCalledWith('flashcard');
  });

  it('estudos > histórico: sem ação principal (só voltar)', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'study', screen: 'historico' },
      screenKey: 'estudos-historico',
    });
    expect(cfg?.primaryActions).toHaveLength(0);
  });

  it('tcc > visão: o herói é o dono da primária, a barra mostra só "voltar"', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'tcc' },
      screenKey: 'tcc',
    });
    expect(cfg?.primaryActions).toHaveLength(0);
  });

  it('tcc > capítulos: a barra abre a folha de capítulo, não o wizard do tcc', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'tcc', tab: 'capitulos' },
      screenKey: 'tcc-capitulos',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('tcc-capitulos');
    expect(cfg?.primaryActions[0].label).toBe('adicionar capítulo');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openTccSheet).toHaveBeenCalledWith({ type: 'chapter', id: 'new' });
    expect(handlers.openWizard).not.toHaveBeenCalled();
  });

  it('tcc > leituras: nova referência e guardar link', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'tcc', tab: 'leituras' },
      screenKey: 'tcc-leituras',
    });
    expect(cfg?.primaryActions).toHaveLength(2);
    expect(cfg?.primaryActions[0].label).toBe('nova referência');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openTccSheet).toHaveBeenCalledWith({ type: 'reference', id: 'new' });
    cfg?.primaryActions[1].onSelect();
    expect(handlers.openTccCapture).toHaveBeenCalled();
  });

  it('tcc > orientação: agendar reunião e adicionar pendência', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'tcc', tab: 'orientacao' },
      screenKey: 'tcc-orientacao',
    });
    expect(cfg?.primaryActions).toHaveLength(2);
    expect(cfg?.primaryActions[0].label).toBe('agendar reunião');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openTccSheet).toHaveBeenCalledWith({
      type: 'meeting',
      id: 'new',
      intent: 'agendar',
    });
    cfg?.primaryActions[1].onSelect();
    expect(handlers.openTccSheet).toHaveBeenCalledWith({ type: 'task', id: 'new' });
  });

  it('tcc > escrita: registrar escrita abre a folha de log, não uma tarefa', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'tcc', tab: 'escrita' },
      screenKey: 'tcc-escrita',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].label).toBe('registrar escrita');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.openTccSheet).toHaveBeenCalledWith({ type: 'writing' });
    expect(handlers.openWizard).not.toHaveBeenCalled();
  });

  it('biblioteca > notas: a barra abre o formulário inline, não o compose', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'notes' },
      screenKey: 'biblioteca-notas',
    });
    expect(cfg?.primaryActions).toHaveLength(1);
    expect(cfg?.primaryActions[0].id).toBe('nova-nota');
    expect(cfg?.primaryActions[0].label).toBe('nova nota');
    cfg?.primaryActions[0].onSelect();
    expect(handlers.setIsCreatingLooseNote).toHaveBeenCalledWith(true);
    expect(handlers.openCompose).not.toHaveBeenCalled();
  });

  it('biblioteca > templo / seção / comparação / abordagem / família: sem ação principal', () => {
    for (const screen of [
      { kind: 'temple' },
      { kind: 'templeSection', section: 'conceitos' },
      { kind: 'comparison', slug: 'x' },
      { kind: 'approach', approachId: 'a' },
      { kind: 'family', familyId: 'f' },
    ] as const) {
      const cfg = buildContextBarConfig({ ...baseInput, currentScreen: screen as NavScreen });
      expect(cfg?.primaryActions).toHaveLength(0);
    }
  });

  it('perfil > histórico de períodos: sem ação principal', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'termHistory' },
      screenKey: 'perfil-historico',
    });
    expect(cfg?.primaryActions).toHaveLength(0);
  });

  it('demais auxiliares sem ação cadastrada: sem ação principal (só voltar)', () => {
    const cfg = buildContextBarConfig({
      ...baseInput,
      currentScreen: { kind: 'stickers' },
      screenKey: 'perfil-stickers',
    });
    expect(cfg?.primaryActions).toHaveLength(0);
  });

  it('o contextKey é a identidade da tela (seleção reinicia ao trocar)', () => {
    const a = buildContextBarConfig({ ...baseInput, currentScreen: { kind: 'notes' }, screenKey: 'notes' });
    const b = buildContextBarConfig({ ...baseInput, currentScreen: { kind: 'streak' }, screenKey: 'streak' });
    expect(a?.contextKey).toBe('notes');
    expect(b?.contextKey).toBe('streak');
  });
});

/**
 * Gate de cobertura (SPEC-022 D8 · I11): **todo** `kind` do `NavScreen` tem
 * classificação. O compilador já cobra isso (`Record<NavScreen['kind'], …>`),
 * mas este teste lê o tipo da fonte e falha com a lista de kinds faltantes —
 * assim a falha diz *quais* faltam, e não só "o build quebrou".
 */
describe('classificação de telas da barra contextual (SPEC-022 D8)', () => {
  const tiposPath = resolve(__dirname, '../../../packages/navigation/src/types.ts');

  it('todo kind do NavScreen está classificado em BARRA_APARECE', () => {
    const fonte = readFileSync(tiposPath, 'utf8');
    const kinds = [...fonte.matchAll(/kind:\s*'([a-zA-Z-]+)'/g)].map((m) => m[1]);
    expect(kinds.length).toBeGreaterThan(20);
    const faltando = kinds.filter((kind) => !(kind in BARRA_APARECE));
    expect(faltando).toEqual([]);
  });

  it('as telas que já têm rodapé próprio não recebem a barra', () => {
    for (const kind of [
      'classNote',
      'quiz-category',
      'quiz-group-detail',
      'quiz-result',
      'quiz-loading',
      'quiz-play',
    ] as const) {
      expect(BARRA_APARECE[kind]).toBe(false);
    }
  });

  it('a barra não aparece nas telas primárias e nos fluxos de formulário', () => {
    for (const kind of [
      'tab',
      'compose',
      'composeDetails',
      'noteDetail',
      'noteTransform',
      'wizard',
    ] as const) {
      expect(BARRA_APARECE[kind]).toBe(false);
    }
  });
});
