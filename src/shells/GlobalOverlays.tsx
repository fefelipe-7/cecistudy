import React, { memo, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { initOta } from '../lib/ota';
import { QuickType } from '../types';

import { QuickAddModal } from '../components/QuickAddModal';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { EditCourseModal } from '../components/courses/EditCourseModal';
import { EditTccModal } from '../components/tcc/EditTccModal';
import { ManageDataModal } from '../components/ui/ManageDataModal';
import { Modal } from '../components/ui/Modal';
import { OtaUpdateModal } from '../components/ui/OtaUpdateModal';
import { Toast } from '../components/ui/Toast';

// Componentes orientados a props com memo: não re-renderizam quando a shell
// re-renderiza por mudança de dados (ex.: togglar tarefa) sem que suas props mudem.
const QuickAddModalMemo = memo(QuickAddModal);
const GlobalSearchModalMemo = memo(GlobalSearchModal);
const EditCourseModalMemo = memo(EditCourseModal);
const ToastMemo = memo(Toast);

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

/**
 * Modais/toasts globais de aplicação — independentes da shell (mobile/desktop).
 * Também hospeda efeitos globais: atalho ⌘K e checagem OTA.
 */
export const GlobalOverlays: React.FC = () => {
  const app = useApp();

  const onNavigateToPerfil = useCallback(() => app.handleNavigate('perfil'), [app.handleNavigate]);
  const onPickQuickAdd = useCallback(
    (type: QuickType) => {
      if (type === 'class') app.openCompose();
      else app.openWizard(type);
    },
    [app.openCompose, app.openWizard]
  );

  // Keyboard shortcut (Cmd/Ctrl+K) for search — nas duas shells
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        app.openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OTA self-hosted: checa atualização web (só nativo, após o onboarding concluído)
  useEffect(() => {
    if (app.onboarding.completed) void initOta();
  }, [app.onboarding.completed]);

  return (
    <>
      {/* Quick Add (escolha de tipo → abre o wizard em tela cheia) */}
      <QuickAddModalMemo
        isOpen={app.isQuickAddOpen}
        onClose={app.closeQuickAdd}
        onPick={onPickQuickAdd}
      />

      {/* Global Search Modal */}
      <GlobalSearchModalMemo
        isOpen={app.isSearchOpen}
        onClose={app.closeSearch}
        courses={app.courses}
        classes={app.classes}
        authors={app.authors}
        concepts={app.concepts}
        approaches={app.approaches}
        readings={app.readings}
        onNavigate={app.handleNavigate}
      />

      {/* Editar matéria (aberta pelo menu do header de disciplina ou long-press) */}
      <EditCourseModalMemo
        isOpen={app.isEditCourseOpen}
        course={
          app.editCourseId
            ? app.courses.find((c) => c.id === app.editCourseId) ?? app.focusedCourse
            : app.focusedCourse
        }
        onClose={app.closeEditCourse}
        onSave={app.handleUpdateCourse}
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
    </>
  );
};
