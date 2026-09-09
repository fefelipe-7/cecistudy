import { describe, expect, it } from 'vitest';
import {
  computeDesktopSlideKey,
  type DesktopSlideState,
} from '../screenTransition';

const base = (over: Partial<DesktopSlideState> = {}): DesktopSlideState => ({
  isKnowledgeGraphOpen: false,
  isProjectsOpen: false,
  isInboxOpen: false,
  isStreakScreenOpen: false,
  isSyncScreenOpen: false,
  isQuizGroupDetailOpen: false,
  isQuizLoadingOpen: false,
  isQuizCategoryOpen: false,
  isQuizPlayOpen: false,
  isQuizResultOpen: false,
  isInternshipDiaryOpen: false,
  isTccScreenOpen: false,
  isNotesScreenOpen: false,
  isTempleScreenOpen: false,
  isFamiliesScreenOpen: false,
  isStickersScreenOpen: false,
  focusedStudyScreen: null,
  focusedComparisonSlug: null,
  focusedTempleSection: null,
  focusedFamilyId: null,
  focusedApproachId: null,
  activeTab: 'home',
  subTabFaculdade: 'disciplinas',
  ...over,
});

describe('computeDesktopSlideKey', () => {
  it('master-detail: focar/abrir disciplina não troca a tela (key estável)', () => {
    expect(
      computeDesktopSlideKey(base({ activeTab: 'faculdade', subTabFaculdade: 'disciplinas' }))
    ).toBe('faculdade-disciplinas');
  });

  it('sub-tabs da faculdade (disciplinas × calendário) são telas distintas', () => {
    expect(computeDesktopSlideKey(base({ activeTab: 'faculdade' }))).toBe('faculdade-disciplinas');
    expect(
      computeDesktopSlideKey(base({ activeTab: 'faculdade', subTabFaculdade: 'calendario' }))
    ).toBe('faculdade-calendario');
  });

  it('trocar de aba gera outra key', () => {
    expect(computeDesktopSlideKey(base())).toBe('tab-home');
    expect(computeDesktopSlideKey(base({ activeTab: 'biblioteca' }))).toBe('biblioteca');
    expect(computeDesktopSlideKey(base({ activeTab: 'estudos' }))).toBe('estudos');
    expect(computeDesktopSlideKey(base({ activeTab: 'perfil' }))).toBe('perfil');
  });

  it('painéis de tela cheia do desktop (grafo/projetos/inbox) têm keys próprias', () => {
    expect(computeDesktopSlideKey(base({ isKnowledgeGraphOpen: true }))).toBe('grafo');
    expect(computeDesktopSlideKey(base({ isProjectsOpen: true }))).toBe('projetos');
    expect(computeDesktopSlideKey(base({ isInboxOpen: true }))).toBe('inbox');
  });

  it('telas auxiliares da camada compartilhada geram keys próprias', () => {
    expect(computeDesktopSlideKey(base({ isStreakScreenOpen: true }))).toBe('streak');
    expect(computeDesktopSlideKey(base({ isSyncScreenOpen: true }))).toBe('sync');
    expect(computeDesktopSlideKey(base({ isQuizPlayOpen: true, activeTab: 'estudos' }))).toBe('quiz-jogo');
    expect(computeDesktopSlideKey(base({ isQuizResultOpen: true, activeTab: 'estudos' }))).toBe('quiz-resultado');
    expect(computeDesktopSlideKey(base({ focusedStudyScreen: 'focus' }))).toBe('estudos-focus');
    expect(computeDesktopSlideKey(base({ activeTab: 'estudos', isTccScreenOpen: true }))).toBe('tcc');
    expect(
      computeDesktopSlideKey(base({ activeTab: 'faculdade', isInternshipDiaryOpen: true }))
    ).toBe('estagio');
  });

  it('modos internos da biblioteca/perfil geram keys próprias', () => {
    expect(computeDesktopSlideKey(base({ activeTab: 'biblioteca', isNotesScreenOpen: true }))).toBe(
      'biblioteca-notas'
    );
    expect(computeDesktopSlideKey(base({ activeTab: 'biblioteca', isTempleScreenOpen: true }))).toBe(
      'biblioteca-templo'
    );
    expect(
      computeDesktopSlideKey(base({ activeTab: 'biblioteca', focusedApproachId: 'psic-01-01' }))
    ).toBe('biblioteca-abordagem-psic-01-01');
    expect(
      computeDesktopSlideKey(base({ activeTab: 'biblioteca', focusedComparisonSlug: 'freud-x' }))
    ).toBe('biblioteca-comparacoes-freud-x');
    expect(
      computeDesktopSlideKey(base({ activeTab: 'perfil', isStickersScreenOpen: true }))
    ).toBe('perfil-figurinhas');
  });

  it('painel de tela cheia tem precedência sobre a aba', () => {
    expect(
      computeDesktopSlideKey(base({ activeTab: 'faculdade', isKnowledgeGraphOpen: true }))
    ).toBe('grafo');
  });
});