import React, { Suspense, lazy, memo, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, MotionConfig, motion, useMotionValue } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { setupNativeShell } from './lib/native';
import { initOta } from './lib/ota';
import { screenVariants, overlayVariants } from './lib/motion';
import { nativeNavigation } from './navigation/native-navigation';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { QuickAddModal } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { EditCourseModal } from './components/courses/EditCourseModal';
import { EditTccModal } from './components/tcc/EditTccModal';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ManageDataModal } from './components/ui/ManageDataModal';
import { BootSplash } from './components/ui/BootSplash';

import { OnboardingScreen } from './components/views/OnboardingScreen';

// C1: views carregadas sob demanda — cada uma vira chunk próprio; o boot fica
// leve e a biblioteca (com o catálogo estático grande) só carrega ao ser aberta.
const HomeView = lazy(() => import('./components/views/HomeView').then((m) => ({ default: m.HomeView })));
const FaculdadeView = lazy(() => import('./components/views/FaculdadeView').then((m) => ({ default: m.FaculdadeView })));
const EstudosView = lazy(() => import('./components/views/EstudosView').then((m) => ({ default: m.EstudosView })));
const BibliotecaView = lazy(() => import('./components/views/BibliotecaView').then((m) => ({ default: m.BibliotecaView })));
const PerfilView = lazy(() => import('./components/views/PerfilView').then((m) => ({ default: m.PerfilView })));
const StreakView = lazy(() => import('./components/views/StreakView').then((m) => ({ default: m.StreakView })));
const ComposeNoteView = lazy(() => import('./components/views/ComposeNoteView').then((m) => ({ default: m.ComposeNoteView })));
const ClassNoteDetailWizard = lazy(() => import('./components/views/ClassNoteDetailWizard').then((m) => ({ default: m.ClassNoteDetailWizard })));
const NoteDetailWizard = lazy(() => import('./components/views/NoteDetailWizard').then((m) => ({ default: m.NoteDetailWizard })));
const NoteTransformWizard = lazy(() => import('./components/views/NoteTransformWizard').then((m) => ({ default: m.NoteTransformWizard })));
const WizardRouter = lazy(() => import('./components/wizards/WizardRouter').then((m) => ({ default: m.WizardRouter })));
import { Modal } from './components/ui/Modal';
import { OtaUpdateModal } from './components/ui/OtaUpdateModal';
import { ViewSkeleton } from './components/ui/Skeleton';
import { EdgeSwipeBack } from './components/ui/EdgeSwipeBack';
import { FileText } from 'lucide-react';
import { QuickType, QuizPlayState, QuizConfig, QuizAnswer } from './types';

// Componentes orientados a props com memo: não re-renderizam quando o AppShell
// re-renderiza por mudança de dados (ex.: togglar tarefa) sem que suas props mudem.
const HeaderNavMemo = memo(HeaderNav);
const BottomNavMemo = memo(BottomNav);
const DesktopSidebarMemo = memo(DesktopSidebar);
const QuickAddModalMemo = memo(QuickAddModal);
const GlobalSearchModalMemo = memo(GlobalSearchModal);
const EditCourseModalMemo = memo(EditCourseModal);
const ToastMemo = memo(Toast);

// Quiz components (lazy loaded)
const QuizCategorySelector = lazy(() => import('./components/quizzes/QuizCategorySelector').then((m) => ({ default: m.QuizCategorySelector })));
const QuizLoadingScreen = lazy(() => import('./components/quizzes/QuizLoadingScreen').then((m) => ({ default: m.QuizLoadingScreen })));
const QuizPlayer = lazy(() => import('./components/quizzes/QuizPlayer').then((m) => ({ default: m.QuizPlayer })));
const QuizResultScreen = lazy(() => import('./components/quizzes/QuizResultScreen').then((m) => ({ default: m.QuizResultScreen })));

// Study screens (telas dedicadas da aba estudos)
const StudyFocusScreen = lazy(() => import('./components/estudos/StudyFocusScreen').then((m) => ({ default: m.StudyFocusScreen })));
const StudyRevisarScreen = lazy(() => import('./components/estudos/StudyRevisarScreen').then((m) => ({ default: m.StudyRevisarScreen })));
const StudyLeiturasScreen = lazy(() => import('./components/estudos/StudyLeiturasScreen').then((m) => ({ default: m.StudyLeiturasScreen })));
const StudyHistoricoScreen = lazy(() => import('./components/estudos/StudyHistoricoScreen').then((m) => ({ default: m.StudyHistoricoScreen })));

// Telas de domínio empilhadas sobre suas abas (estágio → faculdade, TCC → estudos)
const InternshipDiaryView = lazy(() => import('./components/views/InternshipDiaryView').then((m) => ({ default: m.InternshipDiaryView })));
const TccView = lazy(() => import('./components/views/TccView').then((m) => ({ default: m.TccView })));

/** Fallback discreto enquanto um chunk de view carrega (primeira visita à aba). */
const ViewFallback = () => <ViewSkeleton rows={5} />;

/** Prompt "quer dar mais detalhes?" após salvar uma aula (memoizado). */
const DetailPromptModal = memo(function DetailPromptModal({
  open,
  noteId,
  onClose,
  onOpenComposeDetails,
  onShowToast,
}: {
  open: boolean;
  noteId: string | null;
  onClose: () => void;
  onOpenComposeDetails: (id: string) => void;
  onShowToast: (message: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-4 text-ceci-primary"
    >
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
          <FileText className="w-5 h-5" />
        </span>
        <div>
          <h3 className="font-display font-bold text-lg text-ceci-primary leading-tight">
            aula registrada ♡
          </h3>
          <p className="text-xs text-ceci-secondary">
            quer dar mais detalhes sobre essa anotação de aula?
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <button
          onClick={() => {
            if (noteId) onOpenComposeDetails(noteId);
            onClose();
          }}
          className="w-full bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
        >
          dar mais detalhes
        </button>
        <button
          onClick={() => {
            onClose();
            onShowToast('aula registrada no diário ♡');
          }}
          className="w-full bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
        >
          fazer depois
        </button>
      </div>
    </Modal>
  );
});

function AppShell() {
  const app = useApp();

  useEffect(() => {
    setupNativeShell();
  }, []);

  // Inicializa plugin de swipe-back nativo (iOS)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Habilita o plugin
    nativeNavigation.enable();
    // Escuta evento de conclusão do gesto para navegar logicamente
    const handleSwipeBackCompleted = () => {
      app.handleSystemBack();
    };
    // Capacitor usa window.addEventListener para eventos customizados padrão
    window.addEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    return () => {
      window.removeEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    };
  }, []);

  // Mantém o estado de canGoBack sincronizado com o nativo
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    nativeNavigation.setCanGoBack(app.canGoBack);
  }, [app.canGoBack]);

  // Gesto de "voltar pela borda" (iOS): transform da camada de slide acompanha o dedo
  const swipeX = useMotionValue(0);

  // Android back button: fecha modais → pop de telas → sai do app na raiz
  const appRef = useRef(app);
  appRef.current = app;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', () => {
      const a = appRef.current;
      const handled = a.handleSystemBack();
      if (!handled) {
        void CapacitorApp.exitApp();
      }
    });
    return () => {
      void handler.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    profile,
    headerConfig,
    activeTab,
    courses,
    handleNavigate,
    openSearch,
    openCompose,
    closeQuickAdd,
    closeSearch,
  } = app;

  const isAuxFlow =
    app.isComposeScreenOpen ||
    app.isComposeDetailsOpen ||
    app.isWizardOpen ||
    app.isNoteDetailOpen ||
    app.isNoteTransformOpen;

  // Callbacks estáveis para os filhos memoizados (evita re-render quando dados mudam)
  const onNavigateToPerfil = useCallback(() => handleNavigate('perfil'), [handleNavigate]);
  const onPickQuickAdd = useCallback(
    (type: QuickType) => {
      if (type === 'class') openCompose();
      else app.openWizard(type);
    },
    [openCompose, app.openWizard]
  );

  // Keyboard shortcut (Cmd+K) for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  // OTA self-hosted: checa atualização web (só nativo, após o onboarding concluído)
  useEffect(() => {
    if (app.onboarding.completed) void initOta();
  }, [app.onboarding.completed]);

  // Primeiro acesso → onboarding em tela cheia (sem header/nav)
  if (!app.onboarding.completed) {
    return <OnboardingScreen />;
  }

  return (
    <div className="min-h-screen text-ceci-primary flex flex-col font-sans antialiased selection:bg-rose-100 selection:text-ceci-brand-strong lg:pl-60">

      {/* Gesto de "voltar pela borda" (iOS): desliza a camada de slide e volta um nível */}
       {!Capacitor.isNativePlatform() && (
         <EdgeSwipeBack swipeX={swipeX} onBack={app.handleSystemBack} canGoBack={app.canGoBack} />
       )}

      {/* Sidebar desktop (≥ lg) — espelha a visibilidade da barra inferior */}
      {app.isBottomNavVisible && (
        <DesktopSidebarMemo
          activeTab={activeTab}
          onChangeTab={handleNavigate}
          onOpenWizard={app.openWizard}
          onOpenTaskExamWizard={app.openTaskExamWizard}
          onOpenCompose={openCompose}
        />
      )}

      {/* Top Header */}
      {!isAuxFlow && (
        <HeaderNavMemo
          profile={profile}
          headerConfig={headerConfig}
          onOpenSearch={openSearch}
          onNavigateToPerfil={onNavigateToPerfil}
        />
      )}

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main
        className={`flex-1 max-w-md sm:max-w-xl lg:max-w-3xl xl:max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-5 lg:px-8 relative ${
          app.isBottomNavVisible
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-10'
            : 'pb-6'
        }`}
      >
        {/* === Camada 1: slide horizontal (base + auxiliares de 1º nível) === */}
        <motion.div style={{ x: swipeX }} className="will-change-transform">
          <AnimatePresence mode="popLayout" custom={app.navDirection} initial={false}>
            <motion.div
              key={app.slideKey}
              custom={app.navDirection}
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
            {app.isStreakScreenOpen ? (
              <Suspense fallback={<ViewFallback />}>
                <StreakView />
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
                <QuizCategorySelector
                  questions={app.questions}
                  onStart={(config) => app.openQuizLoading(config)}
                  onClose={app.closeQuizCategory}
                  ensureQuestionsLoaded={app.ensureQuestionsLoaded}
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
                    app.showToast('sessão de quiz guardada ♡');
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
            ) : (
              <>
                <Suspense fallback={<ViewFallback />}>
                  {activeTab === 'home' && <HomeView />}
                  {activeTab === 'faculdade' &&
                    (app.isInternshipDiaryOpen ? (
                      <InternshipDiaryView />
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
                    />
                  )}
                  {activeTab === 'perfil' && (
                    <PerfilView mode={app.isStickersScreenOpen ? 'stickers' : 'profile'} />
                  )}
                </Suspense>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        </motion.div>

        {/* === Camada 2: overlay (fade+scale) — compose/wizard não disputam o slide === */}
        <AnimatePresence mode="wait" initial={false}>
          {app.overlayKey && (
            <motion.div
              key={app.overlayKey}
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-40 overflow-y-auto px-3.5 py-4 sm:px-5 bg-canvas"
            >
              {/* Desktop (≥ lg): formulários centrados numa coluna em vez de tela cheia */}
              <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation Bar (escondida em telas auxiliares e no desktop ≥ lg) */}
      {app.isBottomNavVisible && (
        <div className="lg:hidden">
          <BottomNavMemo
            activeTab={activeTab}
            onChangeTab={handleNavigate}
            onOpenWizard={app.openWizard}
            onOpenTaskExamWizard={app.openTaskExamWizard}
            onOpenCompose={openCompose}
          />
        </div>
      )}

      {/* Quick Add (escolha de tipo → abre o wizard em tela cheia) */}
      <QuickAddModalMemo
        isOpen={app.isQuickAddOpen}
        onClose={closeQuickAdd}
        onPick={onPickQuickAdd}
      />

      {/* Global Search Modal */}
      <GlobalSearchModalMemo
        isOpen={app.isSearchOpen}
        onClose={closeSearch}
        courses={courses}
        classes={app.classes}
        authors={app.authors}
        concepts={app.concepts}
        approaches={app.approaches}
        readings={app.readings}
        onNavigate={handleNavigate}
      />

      {/* Editar matéria (aberta pelo menu do header de disciplina ou long-press) */}
      <EditCourseModalMemo
        isOpen={app.isEditCourseOpen}
        course={app.editCourseId
          ? app.courses.find((c) => c.id === app.editCourseId) ?? app.focusedCourse
          : app.focusedCourse}
        onClose={app.closeEditCourse}
        onSave={app.handleUpdateCourse}
        classNotes={app.classes}
        exams={app.exams}
      />

      {/* Menu universal de editar/excluir (long-press / clique direito) */}
      <ManageDataModal />

      {/* Editar tcc (aberto pela tela de tcc / header detail) */}
      <EditTccModal
        isOpen={app.isEditTccOpen}
        tcc={app.tcc}
        onClose={app.closeEditTcc}
        onSave={app.handleUpdateTcc}
      />

      {/* Prompt "quer dar mais detalhes?" após salvar uma aula */}
      <DetailPromptModal
        open={app.isDetailPromptOpen}
        noteId={app.detailNoteId}
        onClose={app.closeDetailPrompt}
        onOpenComposeDetails={app.openComposeDetails}
        onShowToast={app.showToast}
      />

      {/* Aviso de atualização OTA pronta (só nativo) */}
      <OtaUpdateModal />

      {/* Toast de feedback */}
      <ToastMemo message={app.toast} />

    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <AppProvider>
          <BootSplash />
          <AppShell />
        </AppProvider>
      </ErrorBoundary>
    </MotionConfig>
  );
}
