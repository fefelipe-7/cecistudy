import { type Easing, type Variants } from 'framer-motion';

/**
 * Identidade visual de tela da casca desktop + variantes de transição.
 *
 * No desktop o master-detail da faculdade é UMA tela: focar/abrir uma disciplina
 * troca apenas a pane de detalhe (DetailPaneFade), nunca a tela inteira. Por isso a
 * key da camada de slide NÃO usa `focusedCourseId` — refocos não remontam a tela.
 */

/** Estado mínimo (somente leitura) necessário para derivar a identidade da tela. */
export interface DesktopSlideState {
  isKnowledgeGraphOpen: boolean;
  isProjectsOpen: boolean;
  isInboxOpen: boolean;
  isStreakScreenOpen: boolean;
  isSyncScreenOpen: boolean;
  isQuizGroupDetailOpen: boolean;
  isQuizLoadingOpen: boolean;
  isQuizCategoryOpen: boolean;
  isQuizPlayOpen: boolean;
  isQuizResultOpen: boolean;
  isInternshipDiaryOpen: boolean;
  isTccScreenOpen: boolean;
  isNotesScreenOpen: boolean;
  isTempleScreenOpen: boolean;
  isFamiliesScreenOpen: boolean;
  isStickersScreenOpen: boolean;
  focusedStudyScreen: string | null;
  focusedComparisonSlug: string | null;
  focusedTempleSection: string | null;
  focusedFamilyId: string | null;
  focusedApproachId: string | null;
  activeTab: string;
  subTabFaculdade: string;
}

/**
 * Key da camada de slide desktop. Espelha a precedência de render do SlideContent:
 * painéis de tela cheia (grafo/projetos/inbox) → telas auxiliares (streak/sync/quiz/
 * estudos/TCC/estágio) → abas de base. Na faculdade o calendário é tela própria
 * (sub-tab), mas o master-detail de disciplinas é estável — abrir curso não muda a key.
 */
export function computeDesktopSlideKey(s: DesktopSlideState): string {
  if (s.isKnowledgeGraphOpen) return 'grafo';
  if (s.isProjectsOpen) return 'projetos';
  if (s.isInboxOpen) return 'inbox';
  if (s.isStreakScreenOpen) return 'streak';
  if (s.isSyncScreenOpen) return 'sync';
  if (s.isQuizGroupDetailOpen) return 'quiz-detalhe';
  if (s.isQuizLoadingOpen) return 'quiz-loading';
  if (s.isQuizCategoryOpen) return 'quiz-categorias';
  if (s.focusedStudyScreen) return `estudos-${s.focusedStudyScreen}`;
  if (s.isQuizPlayOpen) return 'quiz-jogo';
  if (s.isQuizResultOpen) return 'quiz-resultado';

  if (s.activeTab === 'biblioteca') {
    if (s.isNotesScreenOpen) return 'biblioteca-notas';
    if (s.isTempleScreenOpen) return 'biblioteca-templo';
    if (s.focusedComparisonSlug) return `biblioteca-comparacoes-${s.focusedComparisonSlug}`;
    if (s.focusedTempleSection) return `biblioteca-templo-${s.focusedTempleSection}`;
    if (s.isFamiliesScreenOpen) return 'biblioteca-familias';
    if (s.focusedFamilyId) return `biblioteca-familia-${s.focusedFamilyId}`;
    if (s.focusedApproachId) return `biblioteca-abordagem-${s.focusedApproachId}`;
    return 'biblioteca';
  }
  if (s.activeTab === 'faculdade') {
    if (s.isInternshipDiaryOpen) return 'estagio';
    return `faculdade-${s.subTabFaculdade}`;
  }
  if (s.activeTab === 'estudos') {
    if (s.isTccScreenOpen) return 'tcc';
    return 'estudos';
  }
  if (s.activeTab === 'perfil') {
    if (s.isStickersScreenOpen) return 'perfil-figurinhas';
    return 'perfil';
  }
  return `tab-${s.activeTab}`;
}

/** Ease suave sem overshoot (entrada) — cubic-bezier iOS-like. */
export const DESKTOP_EASE: Easing = [0.22, 1, 0.36, 1];

/** Ease de saída (aceleração curta). */
export const DESKTOP_EXIT_EASE: Easing = 'easeIn';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const reduced = prefersReducedMotion();

/**
 * Transição da camada de slide desktop: crossfade com micro subida.
 * A tela nova entra subindo suavemente enquanto a antiga esvanece por baixo
 * (popLayout pinada no lugar) — sem pulo nem "meio-slide".
 */
export const desktopScreenVariants: Variants = {
  enter: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
  center: reduced
    ? { opacity: 1 }
    : { opacity: 1, y: 0, transition: { duration: 0.32, ease: DESKTOP_EASE } },
  exit: reduced
    ? { opacity: 0 }
    : { opacity: 0, y: -8, transition: { duration: 0.2, ease: DESKTOP_EXIT_EASE } },
};

/** Transição do painel da janela centralizada (compose/wizards). */
export const desktopOverlayVariants: Variants = {
  enter: reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 },
  center: reduced
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: DESKTOP_EASE } },
  exit: reduced
    ? { opacity: 0 }
    : { opacity: 0, y: 8, scale: 0.99, transition: { duration: 0.16, ease: DESKTOP_EXIT_EASE } },
};