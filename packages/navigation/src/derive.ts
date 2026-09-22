// Derivação pura da tela a partir do topo da pilha de navegação.
// Moveu/extraiu a lógica de src/context/AppContext.tsx (seções de derivados de navegação).
// Aqui só mora o que é FUNÇÃO PURA da pilha (flags + ids + chaves de animação);
// a resolução de objetos (focusedCourse, focusedNote...) fica no provider, que tem os dados.
import type {
  NavTab,
  NavScreen,
  WizardFlow,
  StudyScreen,
  QuestionGroup,
  QuizConfig,
  QuizPlayState,
  QuizAnswer,
  StudyQuestion,
} from './types';
import type { TempleSection } from './temple';

/** Flags/chaves/ids derivados puramente da pilha (sem resolução de objetos de dados). */
export interface DerivedNav {
  currentScreen: NavScreen;
  activeTab: NavTab;
  isBottomNavVisible: boolean;
  hasTabBase: boolean;
  screenKey: string;
  slideBaseKey: string;
  overlayKey: string;
  // flags de tela
  isStreakScreenOpen: boolean;
  isInternshipDiaryOpen: boolean;
  isTccScreenOpen: boolean;
  isStickersScreenOpen: boolean;
  isSyncScreenOpen: boolean;
  isNotesScreenOpen: boolean;
  isNoteDetailOpen: boolean;
  isNoteTransformOpen: boolean;
  focusedNoteId: string | null;
  isTempleScreenOpen: boolean;
  focusedTempleSection: TempleSection | null;
  isFamiliesScreenOpen: boolean;
  focusedFamilyId: string | null;
  focusedApproachId: string | null;
  focusedComparisonSlug: string | null;
  isComposeScreenOpen: boolean;
  isComposeDetailsOpen: boolean;
  isWizardOpen: boolean;
  currentWizardType: WizardFlow | null;
  isQuizCategoryOpen: boolean;
  isQuizGroupDetailOpen: boolean;
  currentQuizGroup: QuestionGroup | null;
  isQuizLoadingOpen: boolean;
  currentQuizLoadingConfig: QuizConfig | null;
  isQuizPlayOpen: boolean;
  isQuizResultOpen: boolean;
  currentQuizPlayState: QuizPlayState | null;
  currentQuizResultAnswers: QuizAnswer[] | null;
  currentQuizResultConfig: QuizConfig | null;
  currentQuizResultStartTime: number | null;
  currentQuizResultCorrectCount: number | null;
  currentQuizResultTotalCount: number | null;
  currentQuizResultPool: StudyQuestion[] | null;
  focusedCourseId: string | null;
  focusedStudyScreen: StudyScreen | null;
  /** Sessão de foco imersiva em tela (chrome preto + orientação landscape). */
  isFocusImmersiveOpen: boolean;
}

/**
 * Deriva flags, ids e chaves de animação da pilha.
 * O pool do resultado é resolvido pelo screen (cache) ou via fallback
 * ao quiz-play remanescente (política: o resultado carrega o pool próprio).
 */
export function deriveScreen(
  stack: NavScreen[],
  resolveQuizResultPool?: (stack: NavScreen[]) => StudyQuestion[] | null
): DerivedNav {
  const currentScreen = stack[stack.length - 1];
  const activeTab: NavTab =
    currentScreen.kind === 'tab' ? currentScreen.tab : stack[0]?.kind === 'tab' ? stack[0].tab : 'home';

  const resolvedPool =
    currentScreen.kind === 'quiz-result'
      ? currentScreen.pool
      : resolveQuizResultPool
        ? resolveQuizResultPool(stack)
        : null;

  const focusedNoteId =
    currentScreen.kind === 'noteDetail' || currentScreen.kind === 'noteTransform'
      ? currentScreen.noteId
      : null;

  const screenKey =
    currentScreen.kind === 'tab'
      ? `tab-${currentScreen.tab}`
      : currentScreen.kind === 'course'
        ? `course-${currentScreen.courseId}`
        : currentScreen.kind === 'notes'
          ? 'notes'
          : currentScreen.kind === 'temple'
            ? 'temple'
            : currentScreen.kind === 'comparison'
              ? `comparison-${currentScreen.slug}`
              : currentScreen.kind === 'families'
                ? 'families'
                : currentScreen.kind === 'family'
                  ? `family-${currentScreen.familyId}`
                  : currentScreen.kind === 'approach'
                    ? `approach-${currentScreen.approachId}`
                    : currentScreen.kind === 'compose'
                      ? 'compose'
                      : currentScreen.kind === 'composeDetails'
                        ? 'composeDetails'
                        : currentScreen.kind === 'wizard'
                          ? `wizard-${currentScreen.type}`
                          : currentScreen.kind === 'streak'
                            ? 'streak'
                            : currentScreen.kind === 'internshipDiary'
                              ? 'internshipDiary'
                              : currentScreen.kind === 'tcc'
                                ? 'tcc'
                                : currentScreen.kind === 'stickers'
                                  ? 'stickers'
                                  : currentScreen.kind === 'sync'
                                    ? 'sync'
                                    : currentScreen.kind === 'study'
                                      ? `study-${currentScreen.screen}`
                                      : currentScreen.kind === 'quiz-loading'
                                        ? 'quiz-loading'
                                        : 'tab-home';

  const slideBaseKey =
    currentScreen.kind === 'tab'
      ? `tab-${currentScreen.tab}`
      : currentScreen.kind === 'course'
        ? `course-${currentScreen.courseId}`
        : currentScreen.kind === 'notes'
          ? 'notes'
          : currentScreen.kind === 'noteDetail' || currentScreen.kind === 'noteTransform'
            ? 'notes'
            : currentScreen.kind === 'temple'
              ? 'temple'
              : currentScreen.kind === 'templeSection'
                ? `temple-${currentScreen.section}`
                : currentScreen.kind === 'comparison'
                  ? `comparison-${currentScreen.slug}`
                  : currentScreen.kind === 'families'
                    ? 'families'
                    : currentScreen.kind === 'family'
                      ? `family-${currentScreen.familyId}`
                      : currentScreen.kind === 'approach'
                        ? `approach-${currentScreen.approachId}`
                        : currentScreen.kind === 'streak'
                          ? 'streak'
                          : currentScreen.kind === 'internshipDiary'
                            ? 'internshipDiary'
                            : currentScreen.kind === 'tcc'
                              ? 'tcc'
                              : currentScreen.kind === 'stickers'
                                ? 'stickers'
                                : currentScreen.kind === 'sync'
                                  ? 'sync'
                                  : currentScreen.kind === 'study'
                                    ? `study-${currentScreen.screen}`
                                    : currentScreen.kind === 'quiz-loading'
                                      ? 'quiz-loading'
                                      : stack[0]?.kind === 'tab'
                                        ? `tab-${stack[0].tab}`
                                        : stack[0]?.kind === 'course'
                                          ? `course-${stack[0].courseId}`
                                          : 'tab-home';

  const overlayKey =
    currentScreen.kind === 'compose'
      ? 'compose'
      : currentScreen.kind === 'composeDetails'
        ? 'composeDetails'
        : currentScreen.kind === 'wizard'
          ? `wizard-${currentScreen.type}`
          : currentScreen.kind === 'noteDetail'
            ? `noteDetail-${currentScreen.noteId}`
            : currentScreen.kind === 'noteTransform'
              ? `noteTransform-${currentScreen.noteId}`
              : '';

  return {
    currentScreen,
    activeTab,
    isBottomNavVisible: currentScreen.kind === 'tab',
    hasTabBase: stack[0]?.kind === 'tab',
    screenKey,
    slideBaseKey,
    overlayKey,
    isStreakScreenOpen: currentScreen.kind === 'streak',
    isInternshipDiaryOpen: currentScreen.kind === 'internshipDiary',
    isTccScreenOpen: currentScreen.kind === 'tcc',
    isStickersScreenOpen: currentScreen.kind === 'stickers',
    isSyncScreenOpen: currentScreen.kind === 'sync',
    isNotesScreenOpen: currentScreen.kind === 'notes',
    isNoteDetailOpen: currentScreen.kind === 'noteDetail',
    isNoteTransformOpen: currentScreen.kind === 'noteTransform',
    focusedNoteId,
    isTempleScreenOpen: currentScreen.kind === 'temple',
    focusedTempleSection: currentScreen.kind === 'templeSection' ? currentScreen.section : null,
    isFamiliesScreenOpen: currentScreen.kind === 'families',
    focusedFamilyId: currentScreen.kind === 'family' ? currentScreen.familyId : null,
    focusedApproachId: currentScreen.kind === 'approach' ? currentScreen.approachId : null,
    focusedComparisonSlug: currentScreen.kind === 'comparison' ? currentScreen.slug : null,
    isComposeScreenOpen: currentScreen.kind === 'compose',
    isComposeDetailsOpen: currentScreen.kind === 'composeDetails',
    isWizardOpen: currentScreen.kind === 'wizard',
    currentWizardType: currentScreen.kind === 'wizard' ? currentScreen.type : null,
    isQuizCategoryOpen: currentScreen.kind === 'quiz-category',
    isQuizGroupDetailOpen: currentScreen.kind === 'quiz-group-detail',
    currentQuizGroup: currentScreen.kind === 'quiz-group-detail' ? currentScreen.group : null,
    isQuizLoadingOpen: currentScreen.kind === 'quiz-loading',
    currentQuizLoadingConfig: currentScreen.kind === 'quiz-loading' ? currentScreen.config : null,
    isQuizPlayOpen: currentScreen.kind === 'quiz-play',
    isQuizResultOpen: currentScreen.kind === 'quiz-result',
    currentQuizPlayState: currentScreen.kind === 'quiz-play' ? currentScreen.state : null,
    currentQuizResultAnswers: currentScreen.kind === 'quiz-result' ? currentScreen.answers : null,
    currentQuizResultConfig: currentScreen.kind === 'quiz-result' ? currentScreen.config : null,
    currentQuizResultStartTime: currentScreen.kind === 'quiz-result' ? currentScreen.startTime : null,
    currentQuizResultCorrectCount: currentScreen.kind === 'quiz-result' ? currentScreen.correctCount : null,
    currentQuizResultTotalCount: currentScreen.kind === 'quiz-result' ? currentScreen.totalCount : null,
    currentQuizResultPool: resolvedPool,
    focusedCourseId: currentScreen.kind === 'course' ? currentScreen.courseId : null,
    focusedStudyScreen: currentScreen.kind === 'study' ? currentScreen.screen : null,
    isFocusImmersiveOpen: currentScreen.kind === 'study' && currentScreen.screen === 'focus',
  };
}

/** Resolve o pool do resultado a partir do quiz-play remanescente na pilha. */
export function resolveQuizResultPoolFromStack(stack: NavScreen[]): StudyQuestion[] | null {
  const play = stack.find((s): s is Extract<NavScreen, { kind: 'quiz-play' }> => s.kind === 'quiz-play');
  return play ? play.state.pool : null;
}
