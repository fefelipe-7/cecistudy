import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { setupNativeShell } from './lib/native';
import { screenVariants } from './lib/motion';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { EditCourseModal } from './components/courses/EditCourseModal';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import { HomeView } from './components/views/HomeView';
import { FaculdadeView } from './components/views/FaculdadeView';
import { EstudosView } from './components/views/EstudosView';
import { BibliotecaView } from './components/views/BibliotecaView';
import { PerfilView } from './components/views/PerfilView';
import { EstadoDeEspiritoView } from './components/views/EstadoDeEspiritoView';
import { ComposeNoteView } from './components/views/ComposeNoteView';
import { ClassNoteDetailWizard } from './components/views/ClassNoteDetailWizard';
import { WizardRouter } from './components/wizards/WizardRouter';
import { Modal } from './components/ui/Modal';
import { FileText } from 'lucide-react';

function AppShell() {
  const app = useApp();

  useEffect(() => {
    setupNativeShell();
  }, []);

  // Android back button: fecha modais → pop de telas → sai do app na raiz
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', () => {
      if (app.isQuickAddOpen) {
        app.closeQuickAdd();
      } else if (app.isSearchOpen) {
        app.closeSearch();
      } else if (app.isEditCourseOpen) {
        app.closeEditCourse();
      } else if (app.isDetailPromptOpen) {
        app.closeDetailPrompt();
      } else if (app.isComposeDetailsOpen) {
        app.closeComposeDetails();
      } else if (app.isComposeScreenOpen) {
        app.closeCompose();
      } else if (app.isWizardOpen) {
        app.closeWizard();
      } else if (app.isMoodViewOpen) {
        app.closeMoodView();
      } else if (app.isNotesScreenOpen) {
        app.closeNotesScreen();
      } else if (app.isTempleScreenOpen) {
        app.closeTemple();
      } else if (app.focusedCourseId) {
        app.closeCourseDetail();
      } else {
        void CapacitorApp.exitApp();
      }
    });
    return () => {
      void handler.then((h) => h.remove());
    };
  }, [app]);

  const {
    profile,
    headerConfig,
    activeTab,
    isMoodViewOpen,
    currentMood,
    courses,
    handleNavigate,
    handleSaveMood,
    openSearch,
    openQuickAdd,
    openCompose,
    closeMoodView,
    closeQuickAdd,
    closeSearch,
  } = app;

  const isAuxFlow = app.isComposeScreenOpen || app.isComposeDetailsOpen || app.isWizardOpen;
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

  return (
    <div className="min-h-screen text-ceci-primary flex flex-col font-sans antialiased selection:bg-rose-100 selection:text-ceci-brand-strong">

      {/* Top Header */}
      {!isAuxFlow && (
        <HeaderNav
          profile={profile}
          headerConfig={headerConfig}
          onOpenSearch={openSearch}
          onOpenQuickAdd={openQuickAdd}
          onNavigateToPerfil={() => handleNavigate('perfil', 'jornada')}
        />
      )}

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main
        className={`flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-4 sm:px-5 ${
          app.isBottomNavVisible
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'
            : 'pb-6'
        }`}
      >
        <AnimatePresence mode="popLayout" custom={app.navDirection} initial={false}>
          <motion.div
            key={app.screenKey}
            custom={app.navDirection}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {app.isComposeScreenOpen ? (
              <ComposeNoteView />
            ) : app.isComposeDetailsOpen ? (
              <ClassNoteDetailWizard />
            ) : app.isWizardOpen ? (
              <WizardRouter />
            ) : app.isMoodViewOpen ? (
              <EstadoDeEspiritoView
                currentMood={currentMood}
                onSaveMood={handleSaveMood}
                onBackToHome={closeMoodView}
              />
            ) : (
              <>
                {activeTab === 'home' && <HomeView />}
                {activeTab === 'faculdade' && <FaculdadeView />}
                {activeTab === 'estudos' && <EstudosView />}
                {activeTab === 'biblioteca' && <BibliotecaView />}
                {activeTab === 'perfil' && <PerfilView />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation Bar (escondida em telas auxiliares) */}
      {app.isBottomNavVisible && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => handleNavigate(tab)}
          onOpenWizard={app.openWizard}
          onOpenTaskExamWizard={app.openTaskExamWizard}
          onOpenCompose={() => openCompose()}
        />
      )}

      {/* Quick Add (escolha de tipo → abre o wizard em tela cheia) */}
      <QuickAddModal
        isOpen={app.isQuickAddOpen}
        onClose={closeQuickAdd}
        onPick={(type) => {
          if (type === 'class') openCompose();
          else app.openWizard(type);
        }}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
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
      <EditCourseModal
        isOpen={app.isEditCourseOpen}
        course={app.focusedCourse}
        onClose={app.closeEditCourse}
        onSave={app.handleUpdateCourse}
      />

      {/* Prompt "quer dar mais detalhes?" após salvar uma aula */}
      <Modal
        open={app.isDetailPromptOpen}
        onClose={app.closeDetailPrompt}
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
              if (app.detailNoteId) app.openComposeDetails(app.detailNoteId);
              app.closeDetailPrompt();
            }}
            className="w-full bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
          >
            dar mais detalhes
          </button>
          <button
            onClick={() => {
              app.closeDetailPrompt();
              app.showToast('aula registrada no diário ♡');
            }}
            className="w-full bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
          >
            fazer depois
          </button>
        </div>
      </Modal>

      {/* Toast de feedback */}
      <Toast message={app.toast} />

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
