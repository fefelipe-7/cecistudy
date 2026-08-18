import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  FileText,
  CheckCircle2,
  ClipboardList,
  BookOpen,
  Layers,
  Timer,
  HeartHandshake,
  Sparkles,
  User,
  StickyNote,
  Brain,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Modal } from './Modal';
import { Kitty } from './Kitty';
import { useApp } from '../../context/AppContext';
import type { ManagedItemKind } from '../../types';
import { MANAGED_KIND_LABEL } from '../../lib/entityOps';
import { cn } from '../../lib/utils';

const KIND_ICON: Record<ManagedItemKind, React.ReactNode> = {
  course: <GraduationCap className="w-5 h-5" />,
  class: <FileText className="w-5 h-5" />,
  task: <CheckCircle2 className="w-5 h-5" />,
  exam: <ClipboardList className="w-5 h-5" />,
  reading: <BookOpen className="w-5 h-5" />,
  flashcard: <Layers className="w-5 h-5" />,
  session: <Timer className="w-5 h-5" />,
  internship: <HeartHandshake className="w-5 h-5" />,
  concept: <Sparkles className="w-5 h-5" />,
  author: <User className="w-5 h-5" />,
  material: <FileText className="w-5 h-5" />,
  looseNote: <StickyNote className="w-5 h-5" />,
  quizSession: <Brain className="w-5 h-5" />,
};

/** Aviso de cascata ao excluir entidades com dependências. */
const CASCADE_WARNING: Partial<Record<ManagedItemKind, string>> = {
  course: 'leva junto as aulas, provas, tarefas, leituras e materiais dela.',
  concept: 'flashcards, aulas e notas ligados a ele ficam sem esse conceito.',
  author: 'aulas, conceitos e notas perdem a referência a este autor.',
  class: 'as tarefas da aula ficam sem a referência a ela.',
};

/** Nome curto para exibir no menu (title, name, etc). */
function itemName(kind: ManagedItemKind, id: string, ctx: ReturnType<typeof useApp>): string {
  switch (kind) {
    case 'course':
      return ctx.courses.find((c) => c.id === id)?.name ?? 'matéria';
    case 'class':
      return ctx.classes.find((c) => c.id === id)?.title ?? 'aula';
    case 'task':
      return ctx.tasks.find((t) => t.id === id)?.title ?? 'tarefa';
    case 'exam':
      return ctx.exams.find((e) => e.id === id)?.title ?? 'prova';
    case 'reading':
      return ctx.readings.find((r) => r.id === id)?.title ?? 'leitura';
    case 'flashcard':
      return ctx.flashcards.find((f) => f.id === id)?.question ?? 'flashcard';
    case 'session':
      return ctx.sessions.find((s) => s.id === id)?.topic ?? 'sessão';
    case 'internship':
      return ctx.internshipLogs.find((l) => l.id === id)?.activity ?? 'registro';
    case 'concept':
      return ctx.concepts.find((c) => c.id === id)?.name ?? 'conceito';
    case 'author':
      return ctx.authors.find((a) => a.id === id)?.name ?? 'autor';
    case 'material':
      return ctx.materials.find((m) => m.id === id)?.title ?? 'material';
    case 'looseNote':
      return ctx.looseNotes.find((n) => n.id === id)?.title ?? 'nota avulsa';
    case 'quizSession':
      return ctx.quizSessions.find((q) => q.id === id)
        ? `quiz de ${new Date(ctx.quizSessions.find((q) => q.id === id)!.finishedAt).toLocaleDateString('pt-BR')}`
        : 'quiz';
  }
}

/** Menu universal de editar/excluir um registro (long-press / clique direito). */
export const ManageDataModal: React.FC = () => {
  const ctx = useApp();
  const { managedItem, closeManageItem, deleteManagedItem, editManagedItem } = ctx;
  const [confirming, setConfirming] = useState(false);

  const item = useMemo(
    () => (managedItem ? { ...managedItem, name: itemName(managedItem.kind, managedItem.id, ctx) } : null),
    [managedItem, ctx]
  );

  const reset = () => {
    setConfirming(false);
    closeManageItem();
  };

  if (!item) {
    return (
      <Modal open={false} onClose={reset} position="bottom" className="max-w-md">
        <div />
      </Modal>
    );
  }
  const canEdit = item.kind !== 'quizSession';
  const warning = CASCADE_WARNING[item.kind];

  return (
    <Modal open onClose={reset} position="bottom" className="max-w-md">
      <div className="rounded-t-3xl sm:rounded-3xl bg-white px-5 pt-2 pb-6 shadow-[0_8px_28px_rgba(64,56,58,0.12)]">
        {!confirming ? (
          <>
            <div className="flex items-center gap-3 mt-1 mb-4">
              <span className="w-10 h-10 rounded-2xl bg-surface-rose text-ceci-brand-strong flex items-center justify-center">
                {KIND_ICON[item.kind]}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ceci-tertiary uppercase tracking-wider">
                  {MANAGED_KIND_LABEL[item.kind]}
                </p>
                <p className="font-display font-bold text-ceci-primary truncate">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Kitty expression="curiosa" className="w-12 h-12 shrink-0" decorative alt="" />
              <p className="text-sm text-ceci-secondary">
                o que você quer fazer com este registro?
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {canEdit && (
                <button
                  onClick={() => editManagedItem(item.kind, item.id)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-ceci-border-default bg-white text-ceci-primary text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-xl bg-surface-blue text-ceci-academic-strong flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </span>
                  editar {MANAGED_KIND_LABEL[item.kind]}
                </button>
              )}
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-ceci-border-default bg-white text-red-700 text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="w-9 h-9 rounded-xl bg-surface-rose text-red-700 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </span>
                excluir {MANAGED_KIND_LABEL[item.kind]}
              </button>
            </div>

            <button
              onClick={reset}
              className="mt-3 w-full py-3 text-sm text-ceci-tertiary font-semibold active:opacity-70 transition-opacity cursor-pointer"
            >
              voltar
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mt-1 mb-4">
              <span className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center',
                'bg-surface-rose text-red-700'
              )}>
                <Trash2 className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ceci-tertiary uppercase tracking-wider">
                  excluir {MANAGED_KIND_LABEL[item.kind]}
                </p>
                <p className="font-display font-bold text-ceci-primary truncate">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Kitty expression="pensativa" className="w-12 h-12 shrink-0" decorative alt="" />
              <div>
                <p className="text-sm text-ceci-secondary">
                  excluir mesmo? isso some do cantinho de vez ♡
                </p>
                {warning && (
                  <p className="text-xs text-ceci-tertiary mt-1">
                    <span className="font-semibold text-ceci-secondary">cuidado:</span> {warning}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3.5 rounded-2xl border border-ceci-border-default bg-white text-ceci-secondary text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                não, deixa
              </button>
              <button
                onClick={() => deleteManagedItem(item.kind, item.id)}
                className="flex-1 py-3.5 rounded-2xl bg-red-700 text-white text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                sim, excluir ♡
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};