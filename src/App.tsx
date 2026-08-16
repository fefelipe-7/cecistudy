import React, { Suspense, lazy, memo, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { setupNativeShell } from './lib/native';
import { initOta } from './lib/ota';
import { screenVariants, overlayVariants } from './lib/motion';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { EditCourseModal } from './components/courses/EditCourseModal';
import { EditTccModal } from './components/tcc/EditTccModal';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

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
const WizardRouter = lazy(() => import('./components/wizards/WizardRouter').then((m) => ({ default: m.WizardRouter })));
import { Modal } from './components/ui/Modal';
import { OtaUpdateModal } from './components/ui/OtaUpdateModal';
import { ViewSkeleton } from './components/ui/Skeleton';
import { FileText } from 'lucide-react';
import { QuickType, QuizPlayState, QuizConfig, QuizAnswer } from './types';

// Componentes orientados a props com memo: não re-renderizam quando o AppShell
// re-renderiza por mudança de dados (ex.: togglar tarefa) sem que suas props mudem.
const HeaderNavMemo = memo(HeaderNav);
const BottomNavMemo = memo(BottomNav);
const QuickAddModalMemo = memo(QuickAddModal);
const GlobalSearchModalMemo = memo(GlobalSearchModal);
const EditCourseModalMemo = memo(EditCourseModal);
const ToastMemo = memo(Toast);

// Quiz components (lazy loaded)
const QuizCategorySelector = lazy(() => import('./components/quizzes/QuizCategorySelector').then((m) => ({ default: m.QuizCategorySelector })));
const QuizPlayer = lazy(() => import('./components/quizzes/QuizPlayer').then((m) => ({ default: m.QuizPlayer })));
const QuizResultScreen = lazy(() => import('./components/quizzes/QuizResultScreen').then((m) => ({ default: m.QuizResultScreen })));

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
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-4 text-ceci-primary animate-in zoom-in-95 duration-200"
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

  // Android back button: fecha modais → pop de telas → sai do app na raiz
  const appRef = useRef(app);
  appRef.current = app;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', () => {
      const a = appRef.current;
      if (a.isQuickAddOpen) {
        a.closeQuickAdd();
      } else if (a.isSearchOpen) {
        a.closeSearch();
      } else if (a.isEditCourseOpen) {
        a.closeEditCourse();
      } else if (a.isDetailPromptOpen) {
        a.closeDetailPrompt();
      } else if (a.isComposeDetailsOpen) {
        a.closeComposeDetails();
      } else if (a.isComposeScreenOpen) {
        a.closeCompose();
      } else if (a.isWizardOpen) {
        a.closeWizard();
      } else if (a.isStreakScreenOpen) {
        a.closeStreak();
      } else if (a.isInternshipDiaryOpen) {
        a.closeInternshipDiary();
      } else if (a.isTccScreenOpen) {
        a.closeTccScreen();
      } else if (a.isStickersScreenOpen) {
        a.closeStickersScreen();
      } else if (a.isNotesScreenOpen) {
        a.closeNotesScreen();
      } else if (a.isTempleScreenOpen) {
        a.closeTemple();
      } else if (a.isFamiliesScreenOpen) {
        a.closeFamilies();
      } else if (a.focusedFamilyId) {
        a.closeFamily();
      } else if (a.focusedApproachId) {
        a.closeApproach();
      } else if (a.focusedCourseId) {
        a.closeCourseDetail();
      } else {
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
    openQuickAdd,
    openCompose,
    closeQuickAdd,
    closeSearch,
  } = app;

  const isAuxFlow = app.isComposeScreenOpen || app.isComposeDetailsOpen || app.isWizardOpen;

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
    <div className="min-h-screen text-ceci-primary flex flex-col font-sans antialiased selection:bg-rose-100 selection:text-ceci-brand-strong">

      {/* Top Header */}
      {!isAuxFlow && (
        <HeaderNavMemo
          profile={profile}
          headerConfig={headerConfig}
          onOpenSearch={openSearch}
          onOpenQuickAdd={openQuickAdd}
          onNavigateToPerfil={onNavigateToPerfil}
        />
      )}

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main
        className={`flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-4 sm:px-5 relative ${
          app.isBottomNavVisible
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'
            : 'pb-6'
        }`}
      >
        {/* === Camada 1: slide horizontal (base + auxiliares de 1º nível) === */}
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
            ) : app.isQuizCategoryOpen ? (
              <Suspense fallback={<ViewFallback />}>
                <QuizCategorySelector
                  questions={app.questions}
                  onStart={(config, pool) => app.openQuizPlay(pool, config)}
                  onClose={app.closeQuizCategory}
                />
              </Suspense>
            ) : app.isQuizPlayOpen ? (
              <Suspense fallback={<ViewFallback />}>
                <QuizPlayer
                  state={app.currentQuizPlayState!}
                  onAnswer={(answer) => {
                    // Update the quiz play state with the new answer
                    const current = app.currentQuizPlayState!;
                    const updatedState: QuizPlayState = {
                      ...current,
                      answers: [...current.answers, answer],
                      currentIdx: current.currentIdx + 1,
                      questionStartTime: Date.now(),
                    };
                    // We need to update the stack with the new state
                    const stack = app.navigationStack.map((screen) =>
                      screen.kind === 'quiz-play' ? { ...screen, state: updatedState } : screen
                    );
                    app.setStack(stack);
                    app.syncHash(stack);
                  }}
                  onFinish={(answers, config, startTime, correctCount, totalCount) => {
                    app.openQuizResult(answers, config, startTime, correctCount, totalCount);
                  }}
                  onClose={app.closeQuizPlay}
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
                    app.closeQuizResult();
                    app.closeQuizPlay();
                    app.closeQuizCategory();
                    app.showToast('sessão de quiz guardada ♡');
                  }}
                  onRetry={() => {
                    // Reopen quiz-play with same config
                    const pool = app.currentQuizResultPool!;
                    app.openQuizPlay(pool, app.currentQuizResultConfig!);
                    app.closeQuizResult();
                  }}
                  onNewQuiz={() => {
                    app.closeQuizResult();
                    app.closeQuizPlay();
                    // quiz-category stays open
                  }}
                  onClose={() => {
                    app.closeQuizResult();
                    app.closeQuizPlay();
                    app.closeQuizCategory();
                  }}
                />
              </Suspense>
            ) : (
              <>
                <Suspense fallback={<ViewFallback />}>
                  {activeTab === 'home' && <HomeView />}
                  {activeTab === 'faculdade' && <FaculdadeView />}
                  {activeTab === 'estudos' && <EstudosView />}
                  {activeTab === 'biblioteca' && <BibliotecaView />}
                  {activeTab === 'perfil' && <PerfilView />}
                </Suspense>
              </>
            )}
          </motion.div>
        </AnimatePresence>

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
              {app.isComposeScreenOpen ? (
                <Suspense fallback={<ViewFallback />}>
                  <ComposeNoteView />
                </Suspense>
              ) : app.isComposeDetailsOpen ? (
                <Suspense fallback={<ViewFallback />}>
                  <ClassNoteDetailWizard />
                </Suspense>
              ) : app.isWizardOpen ? (
                <Suspense fallback={<ViewFallback />}>
                  <WizardRouter />
                </Suspense>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation Bar (escondida em telas auxiliares) */}
      {app.isBottomNavVisible && (
        <BottomNavMemo
          activeTab={activeTab}
          onChangeTab={handleNavigate}
          onOpenWizard={app.openWizard}
          onOpenTaskExamWizard={app.openTaskExamWizard}
          onOpenCompose={openCompose}
        />
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

      {/* Editar matéria (aberta pelo menu do header de disciplina) */}
      <EditCourseModalMemo
        isOpen={app.isEditCourseOpen}
        course={app.focusedCourse}
        onClose={app.closeEditCourse}
        onSave={app.handleUpdateCourse}
      />

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
          <AppShell />
        </AppProvider>
      </ErrorBoundary>
    </MotionConfig>
  );
}
