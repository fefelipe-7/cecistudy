import React, { Suspense, lazy, memo, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { AppContextValue } from '@/context/AppContext';
import { initOta } from '@/lib/ota';
import { QuickType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

// B.3 — modais pesados fora do chunk de boot (só carregam ao montar, e como
// chunks próprios): QuickAdd/Search/EditCourse são formulários densos; só
// aparecem por interação. `Modal`/`Toast` ficam eager (leves e instantâneos).
const loadQuickAddModal = () => import('@/components/QuickAddModal').then((m) => ({ default: m.QuickAddModal }));
const loadGlobalSearchModal = () => import('@/components/GlobalSearchModal').then((m) => ({ default: m.GlobalSearchModal }));
const loadEditCourseModal = () => import('@/components/courses/EditCourseModal').then((m) => ({ default: m.EditCourseModal }));
const loadEditTccModal = () => import('@/components/tcc/EditTccModal').then((m) => ({ default: m.EditTccModal }));
const loadManageDataModal = () => import('@/components/ui/ManageDataModal').then((m) => ({ default: m.ManageDataModal }));
const loadOtaUpdateModal = () => import('@/components/ui/OtaUpdateModal').then((m) => ({ default: m.OtaUpdateModal }));
const QuickAddModal = lazy(loadQuickAddModal);
const GlobalSearchModal = lazy(loadGlobalSearchModal);
const EditCourseModal = lazy(loadEditCourseModal);
const EditTccModal = lazy(loadEditTccModal);
const ManageDataModal = lazy(loadManageDataModal);
const OtaUpdateModal = lazy(loadOtaUpdateModal);

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
      className="w-full max-w-sm bg-surface-default rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-4 text-ceci-primary"
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
 * Overlays globais por casca (spec 07 §6.4): mobile monta `MobileOverlays`
 * (lê `useMobileApp()`), desktop monta `DesktopOverlays` (lê `useDesktopApp()`).
 * Este componente é agnóstico de plataforma — recebe o `AppContextValue` via
 * props, sem hook de casca. A moldura de montagem (tela cheia vs. janela
 * centralizada) fica na shell. Efeitos globais: atalho ⌘K e checagem OTA.
 */
export const OverlaysContent: React.FC<{ app: AppContextValue }> = ({ app }) => {
  const onPickQuickAdd = useCallback(
    (type: QuickType) => {
      if (type === 'class') app.openCompose();
      else app.openWizard(type);
    },
    [app.openCompose, app.openWizard],
  );

  // Keyboard shortcut (Cmd/Ctrl+K) for search
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
    <Suspense fallback={null}>
      <QuickAddModalMemo
        isOpen={app.isQuickAddOpen}
        onClose={app.closeQuickAdd}
        onPick={onPickQuickAdd}
      />

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

      <ManageDataModal />

      <EditTccModal
        isOpen={app.isEditTccOpen}
        tcc={app.tcc}
        onClose={app.closeEditTcc}
        onSave={app.handleUpdateTcc}
      />

      <DetailPromptModal
        open={app.isDetailPromptOpen}
        noteId={app.detailNoteId}
        onClose={app.closeDetailPrompt}
        onOpenComposeDetails={app.openComposeDetails}
        onShowToast={app.showToast}
      />

      <OtaUpdateModal />

      <ToastMemo message={app.toast} />
    </Suspense>
  );
};