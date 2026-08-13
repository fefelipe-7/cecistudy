import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { setupNativeShell } from './lib/native';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

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
    <div className="min-h-screen text-[#40383A] flex flex-col font-sans antialiased selection:bg-[#FFE9EE] selection:text-[#B94862]">

      {/* Top Header */}
      <HeaderNav
        profile={profile}
        headerConfig={headerConfig}
        onOpenSearch={openSearch}
        onOpenQuickAdd={openQuickAdd}
        onNavigateToPerfil={() => handleNavigate('perfil', 'jornada')}
      />

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-4 sm:px-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        {isMoodViewOpen ? (
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
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => handleNavigate(tab)}
        onOpenQuickAddWithType={openQuickAddWithType}
      />

      {/* Quick Add Modal (+ Novo) */}
      <QuickAddModal
        isOpen={app.isQuickAddOpen}
        onClose={closeQuickAdd}
        initialType={quickAddType}
        courses={courses}
        onAddTask={handleAddTask}
        onAddClassNote={handleAddClassNote}
        onAddReading={handleAddReading}
        onAddFlashcard={handleAddFlashcard}
        onAddConcept={handleAddConcept}
        onAddInternshipLog={handleAddInternshipLog}
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

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
