import { describe, expect, it } from 'vitest';
import type { ClassNote, NavScreen } from '../../types';
import { buildHeaderConfig, type HeaderConfigInput } from '../headerConfig';

const baseInput: HeaderConfigInput = {
  currentScreen: { kind: 'tab', tab: 'home' } as NavScreen,
  focusedFamily: null,
  focusedApproach: null,
  focusedCourse: undefined,
  focusedClassNote: undefined,
  bookmarkedCourseIds: [],
  tccTitle: '',
  questionsCount: 10,
  currentQuizPlayState: null,
  quizResultCorrectCount: null,
  quizResultTotalCount: null,
  dueCardsCount: 3,
  onBack: () => undefined,
  openWizard: () => undefined,
  openCompose: () => undefined,
  openEditCourse: () => undefined,
  openEditTcc: () => undefined,
  toggleBookmarkCourse: () => undefined,
  setIsCreatingLooseNote: () => undefined,
  editManagedItem: () => undefined,
};

describe('buildHeaderConfig', () => {
  it('retorna null para a aba base (sem header detail)', () => {
    expect(buildHeaderConfig(baseInput)).toBeNull();
  });

  it('usa ícones conhecidos nas telas de estudo (P2: Clock/BookOpen/History)', () => {
    for (const [screen, icon] of [
      ['focus', 'Clock'],
      ['leituras', 'BookOpen'],
      ['historico', 'History'],
    ] as const) {
      const cfg = buildHeaderConfig({ ...baseInput, currentScreen: { kind: 'study', screen } });
      expect(cfg?.icon).toBe(icon);
    }
  });

  it('revisar inclui a contagem de cartões vencidos', () => {
    const cfg = buildHeaderConfig({ ...baseInput, currentScreen: { kind: 'study', screen: 'revisar' } });
    expect(cfg?.subtitle).toBe('3 cartões esperando por você');
  });

  it('quiz-result informa acertos/percentual quando há total', () => {
    const cfg = buildHeaderConfig({
      ...baseInput,
      currentScreen: { kind: 'quiz-result' } as NavScreen,
      quizResultCorrectCount: 2,
      quizResultTotalCount: 4,
    });
    expect(cfg?.subtitle).toBe('2 de 4 • 50% de acerto');
    expect(cfg?.icon).toBe('Trophy');
  });

  it('curso expõe ações contextuais e bookmark', () => {
    const cfg = buildHeaderConfig({
      ...baseInput,
      currentScreen: { kind: 'course', courseId: 'c1' },
      focusedCourse: {
        id: 'c1', name: 'TCC', code: 'PSI-300', professor: 'Prof. Ana',
        semester: '6º Semestre', schedule: [{ day: 1, start: '09:00', end: '12:00' }],
        icon: 'Brain', color: '#D85F79',
      } as HeaderConfigInput['focusedCourse'],
      bookmarkedCourseIds: ['c1'],
    });
    expect(cfg?.isBookmarked).toBe(true);
    expect(cfg?.actions?.length).toBe(3);
  });

  it('aula expõe header detail com título, curso e ação de editar', () => {
    const cfg = buildHeaderConfig({
      ...baseInput,
      currentScreen: { kind: 'classNote', classNoteId: 'cl-1', courseId: 'c1' } as NavScreen,
      focusedClassNote: {
        id: 'cl-1', courseId: 'c1', title: 'psicanálise em clips', number: 3,
        date: '2026-09-21', summary: 'resumo breve',
      } as ClassNote,
      focusedCourse: {
        id: 'c1', name: 'teorias clínicas', code: 'PSI-200', professor: 'Prof. Ana',
        semester: '6º Semestre', schedule: [], icon: 'Brain', color: '#D85F79',
      } as HeaderConfigInput['focusedCourse'],
    });
    expect(cfg?.title).toBe('aula 3 • psicanálise em clips');
    expect(cfg?.subtitle).toContain('teorias clínicas');
    expect(cfg?.actions?.[0]?.label).toBe('editar aula');
  });
});