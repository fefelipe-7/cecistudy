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
  Bookmark,
  Pencil,
  Trash2,
  Check,
  Undo2,
  Eye,
  Wand2,
  Link2,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Modal } from './Modal';
import { Mascote } from './Mascote';
import { ReadingProgressEditor } from './ReadingProgressEditor';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItemKind } from '../../types';
import { MANAGED_KIND_LABEL, type ManagedDB } from '../../lib/entityOps';
import {
  buildItemContext,
  type ContextActionDef,
  type ContextIconKey,
} from '../../lib/contextActions';
import { catalogBooks, interdisciplinaryBooks } from '../../data/books';
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
  catalogBook: <BookOpen className="w-5 h-5" />,
};

/** Mapa de ícones declarativos → componentes Lucide (a lib pura só guarda chaves). */
const ACTION_ICON: Record<ContextIconKey, LucideIcon> = {
  check: CheckCircle2,
  undo: Undo2,
  'book-open': BookOpen,
  'book-plus': BookOpen,
  eye: Eye,
  pencil: Pencil,
  wand: Wand2,
  sparkles: Sparkles,
  link: Link2,
  timer: Timer,
  brain: Brain,
  plus: Plus,
  bookmark: Bookmark,
  user: User,
};

/** Aviso de cascata ao excluir entidades com dependências. */
const CASCADE_WARNING: Partial<Record<ManagedItemKind, string>> = {
  course: 'leva junto as aulas, provas, tarefas, leituras e materiais dela.',
  concept: 'flashcards, aulas e notas ligados a ele ficam sem esse conceito.',
  author: 'aulas, conceitos e notas perdem a referência a este autor.',
  class: 'as tarefas da aula ficam sem a referência a ela.',
};

type Phase = 'menu' | 'progress' | 'confirm-delete';

/** Referências leves dos livros do catálogo estático (nome + total desconhecido). */
const CATALOG_REFS: { id: string; title: string; author: string; totalPages?: number }[] = [
  ...catalogBooks.map((b) => ({ id: b.id, title: b.nome, author: b.autor })),
  ...interdisciplinaryBooks.map((b) => ({ id: b.id, title: b.nome, author: b.autor })),
];

/**
 * Menu universal de ações do item (long-press / clique direito) — docs/modais-wizards.md §3.
 * Renderiza a ação recomendada pelo estado atual + ações comuns + exclusão isolada.
 * A lógica vive em `src/lib/contextActions.ts` (pura); aqui só mapeamos ids → handlers.
 */
export const ManageDataModal: React.FC = () => {
  const ctx = useMobileApp();
  const { managedItem, closeManageItem, deleteManagedItem } = ctx;
  const [phase, setPhase] = useState<Phase>('menu');

const db: ManagedDB = useMemo(
     () => ({
       courses: ctx.courses,
       classes: ctx.classes,
       tasks: ctx.tasks,
       exams: ctx.exams,
       authors: ctx.authors,
       concepts: ctx.concepts,
       readings: ctx.readings,
       flashcards: ctx.flashcards,
       materials: ctx.materials,
       internshipLogs: ctx.internshipLogs,
       sessions: ctx.sessions,
       quizSessions: ctx.quizSessions,
       looseNotes: ctx.looseNotes,
       bookmarkedCourseIds: ctx.bookmarkedCourseIds,
       savedBookIds: ctx.savedBookIds,
       readingProgress: ctx.readingProgress,
       catalogBooks: CATALOG_REFS,
     }),
     [
       ctx.courses, ctx.classes, ctx.tasks, ctx.exams, ctx.authors, ctx.concepts,
       ctx.readings, ctx.flashcards, ctx.materials, ctx.internshipLogs,
       ctx.sessions, ctx.quizSessions, ctx.looseNotes, ctx.bookmarkedCourseIds,
       ctx.savedBookIds, ctx.readingProgress,
     ]
   );

  const itemContext = useMemo(
    () => (managedItem ? buildItemContext(managedItem.kind, managedItem.id, db) : null),
    [managedItem, db]
  );

  const reset = () => {
    setPhase('menu');
    closeManageItem();
  };

  const backToMenu = () => setPhase('menu');

  /** Executa uma ação declarativa mapeando o id para o handler do contexto. */
  const runAction = (action: ContextActionDef) => {
    if (!managedItem) return;
    const { kind, id } = managedItem;
    switch (action.id) {
      case 'edit':
        // editManagedItem fecha o modal internamente
        ctx.editManagedItem(kind, id);
        return;
      case 'toggle-done':
        if (kind === 'task') ctx.handleToggleTask(id);
        else if (kind === 'exam') ctx.handleToggleExam(id);
        reset();
        return;
      case 'reading-progress':
        setPhase('progress');
        return;
      case 'review-flashcard':
        reset();
        ctx.openStudy('revisar');
        return;
      case 'open-class':
        reset();
        ctx.openComposeDetails(id);
        return;
      case 'add-course-record':
        reset();
        ctx.openCompose(id);
        return;
      case 'transform-note':
        reset();
        ctx.openNoteTransform(id);
        return;
      case 'create-flashcard':
        reset();
        // degradação: pré-seleção do conceito ainda não existe no wizard
        ctx.openWizard('flashcard', ctx.concepts.find((c) => c.id === id)?.courseIds[0]);
        return;
      case 'view-related':
        reset();
        ctx.setActiveTab('biblioteca');
        ctx.setSubTabBiblioteca('conceitos');
        return;
      case 'open-link': {
        const url = ctx.materials.find((m) => m.id === id)?.url;
        reset();
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      case 'view-history':
        reset();
        ctx.openStudy('historico');
        return;
      case 'review-quiz': {
        const quiz = ctx.quizSessions.find((q) => q.id === id);
        reset();
        if (quiz) {
          ctx.openQuizResult(quiz.answers, quiz.config, quiz.startedAt, quiz.correctCount, quiz.totalCount);
        }
        return;
      }
      case 'toggle-save':
        ctx.toggleSaveBook(id);
        reset();
        return;
    }
  };

  const saveProgress = (pages: number) => {
    if (!managedItem) return;
    const { kind, id } = managedItem;
    if (kind === 'reading') {
      // handleUpdateReadingPages já trata clamp, streak, confete e toast
      ctx.handleUpdateReadingPages(id, pages === Number.MAX_SAFE_INTEGER ? 9999 : pages);
    } else if (kind === 'catalogBook') {
      ctx.updateReadingProgress(id, pages);
      ctx.showToast(pages > 0 ? 'progresso guardado com carinho ♡' : 'progresso atualizado ♡');
    }
    reset();
  };

  if (!managedItem || !itemContext) {
    return (
      <Modal open={false} onClose={reset} position="bottom" className="max-w-md">
        <div />
      </Modal>
    );
  }

  const canDelete = itemContext.kind !== 'catalogBook';
  const warning = CASCADE_WARNING[itemContext.kind];
  const kindLabel = MANAGED_KIND_LABEL[itemContext.kind];

  // ---- fase: mini-editor de progresso de leitura ----
  if (phase === 'progress') {
    const isCatalog = itemContext.kind === 'catalogBook';
    const currentPages = isCatalog
      ? ctx.readingProgress[itemContext.id] ?? 0
      : ctx.readings.find((r) => r.id === itemContext.id)?.readPages ?? 0;
    const totalPages = isCatalog
      ? CATALOG_REFS.find((b) => b.id === itemContext.id)?.totalPages
      : ctx.readings.find((r) => r.id === itemContext.id)?.totalPages;

    return (
      <Modal open onClose={reset} position="bottom" className="max-w-md">
        <div className="rounded-t-3xl sm:rounded-3xl bg-surface-default px-5 pt-2 pb-6 shadow-floating">
          <div className="flex items-center gap-3 mt-1 mb-4">
            <span className="w-10 h-10 rounded-2xl bg-surface-rose text-ceci-brand-strong flex items-center justify-center shrink-0">
              {KIND_ICON[itemContext.kind]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ceci-tertiary uppercase tracking-wider">
                progresso de leitura
              </p>
              <p className="font-display font-bold text-ceci-primary truncate">{itemContext.name}</p>
            </div>
            <Mascote expression="reading-curious" className="w-10 h-10 shrink-0" decorative alt="" />
          </div>

          <ReadingProgressEditor
            currentPages={currentPages}
            totalPages={totalPages}
            allowMarkDone={!isCatalog}
            onSave={saveProgress}
            onCancel={backToMenu}
          />
        </div>
      </Modal>
    );
  }

  // ---- fase: confirmação de exclusão (duas etapas, cascata explícita) ----
  if (phase === 'confirm-delete') {
    return (
      <Modal open onClose={reset} position="bottom" className="max-w-md">
        <div className="rounded-t-3xl sm:rounded-3xl bg-surface-default px-5 pt-2 pb-6 shadow-floating">
          <div className="flex items-center gap-3 mt-1 mb-4">
            <span className="w-10 h-10 rounded-2xl bg-surface-rose text-red-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ceci-tertiary uppercase tracking-wider">
                excluir {kindLabel}
              </p>
              <p className="font-display font-bold text-ceci-primary truncate">{itemContext.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <Mascote expression="boundaries-care" className="w-12 h-12 shrink-0" decorative alt="" />
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
              onClick={backToMenu}
              className="flex-1 py-3.5 rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              não, deixa
            </button>
            <button
              onClick={() => deleteManagedItem(itemContext.kind, itemContext.id)}
              className="flex-1 py-3.5 rounded-2xl bg-red-700 text-white text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              sim, excluir ♡
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ---- fase: menu de ações (recomendada + comuns + destrutiva isolada) ----
  const renderActionButton = (action: ContextActionDef) => {
    const Icon = ACTION_ICON[action.icon];
    const isRecommended = action.id === itemContext.recommended?.id &&
      action.label === itemContext.recommended?.label;
    return (
      <button
        key={`${action.id}-${action.label}`}
        onClick={() => runAction(action)}
        aria-label={action.label}
        className={cn(
          'flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer',
          isRecommended
            ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
            : action.tone === 'danger'
              ? 'border-ceci-border-default bg-surface-default text-red-700'
              : 'border-ceci-border-default bg-surface-default text-ceci-primary'
        )}
      >
        <span
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isRecommended
              ? 'bg-surface-default text-ceci-brand-strong border border-ceci-border-brand'
              : action.tone === 'danger'
                ? 'bg-surface-rose text-red-700'
                : 'bg-surface-blue text-ceci-academic-strong'
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-left min-w-0">
          <span className="block truncate">{action.label}</span>
          {isRecommended && action.description && (
            <span className="block text-[11px] font-medium text-ceci-secondary leading-snug">
              {action.description}
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <Modal open onClose={reset} position="bottom" className="max-w-md">
      <div className="rounded-t-3xl sm:rounded-3xl bg-surface-default px-5 pt-2 pb-6 shadow-floating">
        <div className="flex items-center gap-3 mt-1 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-surface-rose text-ceci-brand-strong flex items-center justify-center shrink-0">
            {KIND_ICON[itemContext.kind]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ceci-tertiary uppercase tracking-wider">
              {kindLabel}
              {itemContext.status ? ` · ${itemContext.status}` : ''}
            </p>
            <p className="font-display font-bold text-ceci-primary truncate">{itemContext.name}</p>
            {itemContext.meta && (
              <p className="text-[11px] text-ceci-tertiary truncate">{itemContext.meta}</p>
            )}
          </div>
          <Mascote
            expression="listening-hello"
            className="w-10 h-10 shrink-0"
            decorative
            alt=""
          />
        </div>

        <div className="flex flex-col gap-2.5">
          {/* ação recomendada — destaque de marca, nunca a aparência da exclusão */}
          {itemContext.recommended && renderActionButton(itemContext.recommended)}

          {/* ações comuns */}
          {itemContext.actions
            .filter((a) => a.id !== itemContext.recommended?.id)
            .map(renderActionButton)}
        </div>

        {/* ação destrutiva — sempre separada, no rodapé */}
        {canDelete && (
          <div className="mt-4 pt-4 border-t border-ceci-border-subtle">
            <button
              onClick={() => setPhase('confirm-delete')}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-red-700 active:scale-[0.98] transition-all cursor-pointer hover:bg-surface-rose"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              excluir {kindLabel}
            </button>
          </div>
        )}

        <button
          onClick={reset}
          className="mt-2 w-full py-3 text-sm text-ceci-tertiary font-semibold active:opacity-70 transition-opacity cursor-pointer"
        >
          fechar
        </button>
      </div>
    </Modal>
  );
};
