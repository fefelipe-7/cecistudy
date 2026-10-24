import React, { Suspense, lazy, memo, useEffect } from 'react';
import { CELEBRACAO, frase } from '../lib/voice';
import { useMobileApp } from '@/context/mobileApp';
import { isUnknownSlideKind } from '@/context/slideKeys';
import type { NavScreen } from '@/types/navigation';
import { ViewSkeleton } from '../components/ui/Skeleton';
import { requestPrefetch, prefetchOnIntent } from '@/lib/performance/screenPrefetch';

// C1: views carregadas sob demanda — cada uma vira chunk próprio; o boot fica
// leve e a biblioteca (com o catálogo estático grande) só carrega ao ser aberta.
// As factories ficam nomeadas para o preload pós-boot (preloadScreenChunks):
// assim a 1ª visita a uma aba já anima o conteúdo real, não o skeleton.
const loadHomeView = () => import('../components/views/HomeView').then((m) => ({ default: m.HomeView }));
const loadFaculdadeView = () => import('../components/views/FaculdadeView').then((m) => ({ default: m.FaculdadeView }));
const loadEstudosView = () => import('../components/views/EstudosView').then((m) => ({ default: m.EstudosView }));
const loadBibliotecaView = () => import('../components/views/BibliotecaView').then((m) => ({ default: m.BibliotecaView }));
const loadPerfilView = () => import('../components/views/PerfilView').then((m) => ({ default: m.PerfilView }));
const loadStreakView = () => import('../components/views/StreakView').then((m) => ({ default: m.StreakView }));
const loadSyncScreen = () => import('../components/sync/SyncScreen').then((m) => ({ default: m.SyncScreen }));
const loadComposeNoteView = () => import('../components/views/ComposeNoteView').then((m) => ({ default: m.ComposeNoteView }));
const loadClassNoteDetailWizard = () => import('../components/views/ClassNoteDetailWizard').then((m) => ({ default: m.ClassNoteDetailWizard }));
const loadClassNoteDetailScreen = () => import('../components/courses/ClassNoteDetailScreen').then((m) => ({ default: m.ClassNoteDetailScreen }));
const loadRepertorioItemDetailScreen = () => import('../components/courses/RepertorioItemDetailScreen').then((m) => ({ default: m.RepertorioItemDetailScreen }));
const loadNoteDetailWizard = () => import('../components/views/NoteDetailWizard').then((m) => ({ default: m.NoteDetailWizard }));
const loadNoteTransformWizard = () => import('../components/views/NoteTransformWizard').then((m) => ({ default: m.NoteTransformWizard }));
const loadWizardRouter = () => import('../components/wizards/WizardRouter').then((m) => ({ default: m.WizardRouter }));
// SPEC-005: histórico de períodos — lazy como as demais telas de fluxo profundo.
const loadTermHistoryScreen = () => import('../components/terms/TermHistoryScreen').then((m) => ({ default: m.TermHistoryScreen }));

// Quiz components (lazy loaded)
const loadQuizCategorySelector = () => import('../components/quizzes/QuizGroupSelector').then((m) => ({ default: m.QuizGroupSelector }));
const loadQuizGroupDetail = () => import('../components/quizzes/QuizGroupDetail').then((m) => ({ default: m.QuizGroupDetail }));
const loadQuizLoadingScreen = () => import('../components/quizzes/QuizLoadingScreen').then((m) => ({ default: m.QuizLoadingScreen }));
const loadQuizPlayer = () => import('../components/quizzes/QuizPlayer').then((m) => ({ default: m.QuizPlayer }));
const loadQuizResultScreen = () => import('../components/quizzes/QuizResultScreen').then((m) => ({ default: m.QuizResultScreen }));

// Study screens (telas dedicadas da aba estudos)
const loadStudyFocusScreen = () => import('../components/estudos/StudyFocusScreen').then((m) => ({ default: m.StudyFocusScreen }));
const loadStudyRevisarScreen = () => import('../components/estudos/StudyRevisarScreen').then((m) => ({ default: m.StudyRevisarScreen }));
const loadStudyLeiturasScreen = () => import('../components/estudos/StudyLeiturasScreen').then((m) => ({ default: m.StudyLeiturasScreen }));
const loadStudyHistoricoScreen = () => import('../components/estudos/StudyHistoricoScreen').then((m) => ({ default: m.StudyHistoricoScreen }));

// Telas de domínio empilhadas sobre suas abas (estágio → faculdade, TCC → estudos)
const loadInternshipDiaryView = () => import('../components/views/InternshipDiaryView').then((m) => ({ default: m.InternshipDiaryView }));
const loadInternshipCaseView = () => import('../components/views/InternshipCaseView').then((m) => ({ default: m.InternshipCaseView }));
const loadTccView = () => import('../components/views/TccView').then((m) => ({ default: m.TccView }));
const loadCalendarScreen = () => import('../components/views/CalendarScreen').then((m) => ({ default: m.CalendarScreen }));

const HomeView = memo(lazy(loadHomeView));
const FaculdadeView = memo(lazy(loadFaculdadeView));
const EstudosView = memo(lazy(loadEstudosView));
const BibliotecaView = memo(lazy(loadBibliotecaView));
const PerfilView = memo(lazy(loadPerfilView));
const StreakView = lazy(loadStreakView);
const SyncScreen = lazy(loadSyncScreen);
const ComposeNoteView = lazy(loadComposeNoteView);
const ClassNoteDetailWizard = lazy(loadClassNoteDetailWizard);
const ClassNoteDetailScreen = lazy(loadClassNoteDetailScreen);
const RepertorioItemDetailScreen = lazy(loadRepertorioItemDetailScreen);
const NoteDetailWizard = lazy(loadNoteDetailWizard);
const NoteTransformWizard = lazy(loadNoteTransformWizard);
const WizardRouter = lazy(loadWizardRouter);
const TermHistoryScreen = lazy(loadTermHistoryScreen);

// Quiz components (lazy loaded)
const QuizGroupSelector = lazy(loadQuizCategorySelector);
const QuizGroupDetail = lazy(loadQuizGroupDetail);
const QuizLoadingScreen = lazy(loadQuizLoadingScreen);
const QuizPlayer = lazy(loadQuizPlayer);
const QuizResultScreen = lazy(loadQuizResultScreen);

// Study screens (telas dedicadas da aba estudos)
const StudyFocusScreen = lazy(loadStudyFocusScreen);
const StudyRevisarScreen = lazy(loadStudyRevisarScreen);
const StudyLeiturasScreen = lazy(loadStudyLeiturasScreen);
const StudyHistoricoScreen = lazy(loadStudyHistoricoScreen);

// Telas de domínio empilhadas sobre suas abas (estágio → faculdade, TCC → estudos)
const InternshipDiaryView = lazy(loadInternshipDiaryView);
const InternshipCaseView = lazy(loadInternshipCaseView);
const TccView = lazy(loadTccView);
const CalendarScreen = lazy(loadCalendarScreen);

/** Fallback discreto enquanto um chunk de view carrega (primeira visita à aba). */
export const ViewFallback = () => <ViewSkeleton rows={5} />;

/**
 * Chaves dos chunks de tela — a política de prefetch (spec-performance §7
 * Fase 3) só aceita lista EXPLícita destas; o preload global de todos os
 * loaders foi removido (27 loaders varridos de uma vez, sem intenção).
 * As chaves das 4 abas casam com o `aria-label` do BottomNav (intenção
 * observável via pointerdown).
 */
export type ScreenKey =
  | 'home'
  | 'faculdade'
  | 'estudos'
  | 'biblioteca'
  | 'perfil'
  | 'streak'
  | 'sync'
  | 'composeNote'
  | 'classNoteDetailWizard'
  | 'classNoteDetail'
  | 'repertorioItemDetail'
  | 'noteDetailWizard'
  | 'noteTransformWizard'
  | 'wizardRouter'
  | 'termHistory'
  | 'quizCategorySelector'
  | 'quizGroupDetail'
  | 'quizLoading'
  | 'quizPlayer'
  | 'quizResult'
  | 'studyFocus'
  | 'studyRevisar'
  | 'studyLeituras'
  | 'studyHistorico'
  | 'internshipDiary'
  | 'internshipCase'
  | 'tcc'
  | 'calendar';

/** Factories dos chunks — reutilizadas pelo lazy e pelo prefetch com política. */
const SCREEN_CHUNK_LOADERS: Record<ScreenKey, () => Promise<unknown>> = {
  home: loadHomeView,
  faculdade: loadFaculdadeView,
  estudos: loadEstudosView,
  biblioteca: loadBibliotecaView,
  perfil: loadPerfilView,
  streak: loadStreakView,
  sync: loadSyncScreen,
  composeNote: loadComposeNoteView,
  classNoteDetailWizard: loadClassNoteDetailWizard,
  classNoteDetail: loadClassNoteDetailScreen,
  repertorioItemDetail: loadRepertorioItemDetailScreen,
  noteDetailWizard: loadNoteDetailWizard,
  noteTransformWizard: loadNoteTransformWizard,
  wizardRouter: loadWizardRouter,
  termHistory: loadTermHistoryScreen,
  quizCategorySelector: loadQuizCategorySelector,
  quizGroupDetail: loadQuizGroupDetail,
  quizLoading: loadQuizLoadingScreen,
  quizPlayer: loadQuizPlayer,
  quizResult: loadQuizResultScreen,
  studyFocus: loadStudyFocusScreen,
  studyRevisar: loadStudyRevisarScreen,
  studyLeituras: loadStudyLeiturasScreen,
  studyHistorico: loadStudyHistoricoScreen,
  internshipDiary: loadInternshipDiaryView,
  internshipCase: loadInternshipCaseView,
  tcc: loadTccView,
  calendar: loadCalendarScreen,
};

/**
 * Compatibilidade temporária (spec §3.1): aceita **lista explícita** de
 * chaves — nunca mais a varredura global. Delega à política do
 * `screenPrefetch` (saveData/visibilidade/limite de concorrência/dedup).
 */
export function preloadScreenChunks(keys: ScreenKey[]): void {
  for (const key of keys) {
    const load = SCREEN_CHUNK_LOADERS[key];
    if (load) requestPrefetch(`screen:${key}`, load);
  }
}

/**
 * Prefetch de tela após **intenção observável** (ex.: pointerdown na aba):
 * fura a fila de baixa prioridade porque a navegação é iminente.
 */
export function prefetchScreensOnIntent(keys: ScreenKey[]): void {
  for (const key of keys) {
    const load = SCREEN_CHUNK_LOADERS[key];
    if (load) prefetchOnIntent(`screen:${key}`, load);
  }
}

/**
 * Avisa em dev quando o topo da pilha é um `NavScreen.kind` que **não tem tela**
 * (`knowledge-graph`, `projects`, `inbox` — placeholders de desktop).
 *
 * Antes, esses kinds caíam silenciosamente na aba base: o app "funcionava" e
 * nenhuma tela aparecia, sem nenhuma pista de por quê. Aqui a falha vira visível
 * (SPEC-007 bug B4). Em produção é no-op: quem empilha um kind sem UI é bug de
 * código, não algo que a usuária possa resolver.
 */
function useUnknownSlideKindWarning(kind: NavScreen['kind'] | undefined): void {
  useEffect(() => {
    if (!kind || !isUnknownSlideKind({ kind } as NavScreen)) return;
    if (import.meta.env.DEV) {
      console.warn(
        `[cecistudy] NavScreen.kind "${kind}" não tem tela renderizada — a camada ` +
          'de slide vai mostrar a aba base. Adicione o caso no SlideContent ou remova o kind.',
      );
    }
  }, [kind]);
}

/**
 * Camada de slide: telas de base (tabs) + auxiliares de 1º nível
 * (curso, notas, templo, streak, quiz, study…). A pilha no AppContext é a
 * fonte da verdade.
 */
export const SlideContent: React.FC = () => {
  const app = useMobileApp();
  const activeTab = app.activeTab;

  useUnknownSlideKindWarning(
    app.navigationStack[app.navigationStack.length - 1]?.kind,
  );

  return (
    <>
      {app.isStreakScreenOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <StreakView />
        </Suspense>
      ) : app.isSyncScreenOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <SyncScreen />
        </Suspense>
      ) : app.isQuizGroupDetailOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <QuizGroupDetail
            group={app.currentQuizGroup!}
            onBack={app.closeQuizDetail}
            onStart={(group) => app.openQuizLoading(group.filterConfig)}
          />
        </Suspense>
      ) : app.isQuizLoadingOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <QuizLoadingScreen
            config={app.currentQuizLoadingConfig!}
            onReady={(pool, config) => app.openQuizPlay(pool, config)}
            onCancel={app.closeQuizLoading}
          />
        </Suspense>
      ) : app.isQuizCategoryOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <QuizGroupSelector
            onSelectGroup={app.openQuizGroupDetail}
            onClose={app.closeQuizCategory}
          />
        </Suspense>
      ) : app.focusedStudyScreen ? (
        <Suspense fallback={<ViewFallback />}>
          {app.focusedStudyScreen === 'focus' && <StudyFocusScreen />}
          {app.focusedStudyScreen === 'revisar' && <StudyRevisarScreen />}
          {app.focusedStudyScreen === 'leituras' && <StudyLeiturasScreen />}
          {app.focusedStudyScreen === 'historico' && <StudyHistoricoScreen />}
        </Suspense>
      ) : app.isQuizPlayOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <QuizPlayer
            state={app.currentQuizPlayState!}
            onAnswer={(answer) => {
              // Registra a resposta (sem avançar o índice)
              const current = app.currentQuizPlayState!;
              app.updateQuizPlayState({
                answers: [...current.answers, answer],
              });
            }}
            onAdvance={() => {
              // Avança para próxima questão (sem adicionar resposta novamente)
              const current = app.currentQuizPlayState!;
              app.updateQuizPlayState({
                currentIdx: current.currentIdx + 1,
                questionStartTime: Date.now(),
              });
            }}
            onFinish={(answers, config, startTime, correctCount, totalCount) => {
              app.openQuizResult(answers, config, startTime, correctCount, totalCount);
            }}
          />
        </Suspense>
      ) : app.isQuizResultOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <QuizResultScreen
            answers={app.currentQuizResultAnswers!}
            config={app.currentQuizResultConfig!}
            startTime={app.currentQuizResultStartTime!}
            correctCount={app.currentQuizResultCorrectCount!}
            totalCount={app.currentQuizResultTotalCount!}
            onSave={(sessionId) => {
              app.handleSaveQuizSession({
                id: sessionId,
                config: app.currentQuizResultConfig!,
                answers: app.currentQuizResultAnswers!,
                startedAt: app.currentQuizResultStartTime!,
                finishedAt: Date.now(),
                totalTimeMs: Date.now() - app.currentQuizResultStartTime!,
                correctCount: app.currentQuizResultCorrectCount!,
                totalCount: app.currentQuizResultTotalCount!,
                scorePct: Math.round((app.currentQuizResultCorrectCount! / app.currentQuizResultTotalCount!) * 100),
                createdAt: new Date().toISOString().split('T')[0],
              });
              app.closeAllQuizScreens();
              app.showToast(frase(CELEBRACAO, 'sessaoDeQuizGuardada'));
            }}
            onRetry={() => {
              // Repete o mesmo quiz (mesmo pool + config). Se a pool não sobreviveu
              // (ex.: reload direto no hash de resultado), volta ao seletor.
              if (!app.currentQuizResultPool || app.currentQuizResultPool.length === 0) {
                app.newQuizFromResult();
                return;
              }
              app.openQuizPlay(app.currentQuizResultPool, app.currentQuizResultConfig!);
            }}
            onNewQuiz={() => {
              // Volta para o seletor de assuntos
              app.newQuizFromResult();
            }}
          />
        </Suspense>
      ) : app.isTermHistoryOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <TermHistoryScreen />
        </Suspense>
      ) : (
        <>
          <Suspense fallback={<ViewFallback />}>
            {activeTab === 'home' &&
              (app.isCalendarScreenOpen ? <CalendarScreen /> : <HomeView />)}
            {activeTab === 'faculdade' &&
              (app.isCalendarScreenOpen ? (
                <CalendarScreen />
              ) : app.isInternshipCaseOpen ? (
                <InternshipCaseView />
              ) : app.isInternshipDiaryOpen ? (
                <InternshipDiaryView />
              ) : app.isClassNoteDetailOpen ? (
                <ClassNoteDetailScreen />
              ) : app.isRepertorioItemOpen ? (
                <RepertorioItemDetailScreen />
              ) : (
                <FaculdadeView course={app.focusedCourse} />
              ))}
            {activeTab === 'estudos' &&
              (app.isTccScreenOpen ? <TccView /> : <EstudosView />)}
            {activeTab === 'biblioteca' && (
              <BibliotecaView
                mode={
                  app.isNotesScreenOpen
                    ? 'notes'
                    : app.isTempleScreenOpen
                      ? 'temple'
                      : app.focusedComparisonSlug
                        ? 'comparacoes'
                        : app.focusedTempleSection
                          ? app.focusedTempleSection
                          : app.isFamiliesScreenOpen
                            ? 'families'
                            : app.focusedFamilyId
                              ? 'family'
                              : app.focusedApproachId
                                ? 'approach'
                                : 'library'
                }
                familyId={app.focusedFamilyId ?? undefined}
                approachId={app.focusedApproachId ?? undefined}
                comparisonSlug={app.focusedComparisonSlug ?? undefined}
              />
            )}
            {activeTab === 'perfil' && (
              <PerfilView mode={app.isStickersScreenOpen ? 'stickers' : 'profile'} />
            )}
          </Suspense>
        </>
      )}
    </>
  );
};

/**
 * Camada overlay (fade+scale): fluxos profundos da pilha
 * (compose, wizards, detalhes de nota).
 */
export const OverlayContent: React.FC = () => {
  const app = useMobileApp();

  return (
    <>
      {app.isComposeScreenOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <ComposeNoteView />
        </Suspense>
      ) : app.isComposeDetailsOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <ClassNoteDetailWizard />
        </Suspense>
      ) : app.isNoteDetailOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <NoteDetailWizard />
        </Suspense>
      ) : app.isNoteTransformOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <NoteTransformWizard />
        </Suspense>
      ) : app.isWizardOpen ? (
        <Suspense fallback={<ViewFallback />}>
          <WizardRouter />
        </Suspense>
      ) : null}
    </>
  );
};
