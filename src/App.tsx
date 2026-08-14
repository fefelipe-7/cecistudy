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
    handleAddTask,
    handleAddClassNote,
    handleAddReading,
    handleAddFlashcard,
    handleAddConcept,
    handleAddInternshipLog,
    handleAddSession,
    handleAddExam,
    handleAddAuthor,
    handleSaveMood,
    openSearch,
    openQuickAdd,
    openQuickAddWithType,
    closeMoodView,
    closeQuickAdd,
    closeSearch,
    quickAddType
  } = app;

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
      <HeaderNav
        profile={profile}
        headerConfig={headerConfig}
        onOpenSearch={openSearch}
        onOpenQuickAdd={openQuickAdd}
        onNavigateToPerfil={() => handleNavigate('perfil', 'jornada')}
      />

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
            {app.isMoodViewOpen ? (
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
          onOpenQuickAddWithType={openQuickAddWithType}
        />
      )}

      {/* Quick Add Modal (+ Novo) */}
      <QuickAddModal
        isOpen={app.isQuickAddOpen}
        onClose={closeQuickAdd}
        initialType={quickAddType}
        presetCourseId={app.quickAddCourseId}
        courses={courses}
        onAddTask={handleAddTask}
        onAddClassNote={handleAddClassNote}
        onAddReading={handleAddReading}
        onAddFlashcard={handleAddFlashcard}
        onAddConcept={handleAddConcept}
        onAddInternshipLog={handleAddInternshipLog}
        onAddSession={handleAddSession}
        onAddExam={handleAddExam}
        onAddAuthor={handleAddAuthor}
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
