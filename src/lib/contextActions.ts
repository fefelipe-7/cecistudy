import type { ManagedItemKind } from '../types';
import type { ManagedDB } from './entityOps';

/**
 * Ações contextuais do menu universal (long-press) — docs/modais-wizards.md §3.
 *
 * A lógica é **pura**: `buildItemContext` recebe o tipo de entidade, o id e um
 * banco plano (`ManagedDB`) e devolve o contexto declarativo (nome, status,
 * ação recomendada e ações comuns). O modal apenas renderiza o resultado e
 * mapeia cada `ContextActionId` para um handler real do `AppContext`.
 */

export type ContextActionId =
  | 'edit'
  | 'toggle-done'
  | 'reading-progress'
  | 'review-flashcard'
  | 'open-class'
  | 'add-course-record'
  | 'transform-note'
  | 'create-flashcard'
  | 'view-related'
  | 'open-link'
  | 'view-history'
  | 'review-quiz'
  | 'toggle-save';

/** Ícones suportados (chaves — o mapa Lucide vive no modal, a lib fica pura). */
export type ContextIconKey =
  | 'check'
  | 'undo'
  | 'book-open'
  | 'book-plus'
  | 'eye'
  | 'pencil'
  | 'wand'
  | 'sparkles'
  | 'link'
  | 'timer'
  | 'brain'
  | 'plus'
  | 'bookmark'
  | 'user';

export interface ContextActionDef {
  id: ContextActionId;
  label: string;
  description?: string;
  icon: ContextIconKey;
  tone: 'primary' | 'neutral' | 'danger';
}

export interface ManagedItemContext {
  kind: ManagedItemKind;
  id: string;
  name: string;
  /** Estado curto (ex.: "em andamento", "pendente", "para revisar"). */
  status?: string;
  /** Linha de meta (ex.: "42 de 180 páginas"). */
  meta?: string;
  /** Ação recomendada pelo estado atual do item. */
  recommended?: ContextActionDef;
  /** Ações comuns (sem a recomendada; exclusão é renderizada à parte). */
  actions: ContextActionDef[];
}

const EDIT_ACTION = (): ContextActionDef => ({
  id: 'edit',
  label: 'editar',
  icon: 'pencil',
  tone: 'neutral',
});

const todayISO = () => new Date().toISOString().split('T')[0];

const fmtDate = (iso: string | undefined): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
};

/**
 * Valida/limita uma entrada de páginas para o mini-editor de progresso.
 * Retorna `null` quando o valor é inválido (menor que a página atual ou acima
 * do total conhecido). Total desconhecido aceita qualquer valor ≥ atual.
 */
export function clampPageInput(
  current: number,
  raw: string | number,
  totalPages?: number
): number | null {
  const n = typeof raw === 'number' ? Math.floor(raw) : parseInt(String(raw), 10);
  if (Number.isNaN(n)) return null;
  if (n < current) return null;
  if (totalPages !== undefined && n > totalPages) return null;
  return n;
}

function readingProgressAction(pages: number): ContextActionDef {
  return pages > 0
    ? {
        id: 'reading-progress',
        label: 'adicionar páginas lidas',
        description: 'registrar seu avanço nesta leitura',
        icon: 'book-plus',
        tone: 'primary',
      }
    : {
        id: 'reading-progress',
        label: 'começar leitura',
        description: 'registrar as primeiras páginas lidas',
        icon: 'book-plus',
        tone: 'primary',
      };
}

/**
 * Monta o contexto declarativo de um item para o menu universal.
 * Retorna `null` quando o item não existe mais no banco.
 */
export function buildItemContext(
  kind: ManagedItemKind,
  id: string,
  db: ManagedDB
): ManagedItemContext | null {
  switch (kind) {
    case 'course': {
      const course = db.courses.find((c) => c.id === id);
      if (!course) return null;
      const recordCount =
        db.classes.filter((c) => c.courseId === id).length +
        db.tasks.filter((t) => t.disciplineId === id).length +
        db.exams.filter((e) => e.courseId === id).length +
        db.readings.filter((r) => r.courseId === id).length +
        db.materials.filter((m) => m.courseId === id).length;
      return {
        kind,
        id,
        name: course.name,
        status: recordCount > 0 ? `${recordCount} registro${recordCount > 1 ? 's' : ''}` : 'sem registros ainda',
        recommended: {
          id: 'add-course-record',
          label: recordCount > 0 ? 'adicionar registro' : 'adicionar primeiro registro',
          description: 'nova anotação de aula nesta matéria',
          icon: 'plus',
          tone: 'primary',
        },
        actions: [EDIT_ACTION()],
      };
    }

    case 'class': {
      const cls = db.classes.find((c) => c.id === id);
      if (!cls) return null;
      const complete = !!cls.fullNotes?.trim();
      return {
        kind,
        id,
        name: cls.title,
        status: complete ? 'completa' : 'para completar',
        meta: fmtDate(cls.date),
        recommended: complete
          ? {
              id: 'open-class',
              label: 'revisar anotação',
              description: 'abrir os detalhes desta aula',
              icon: 'eye',
              tone: 'primary',
            }
          : {
              id: 'open-class',
              label: 'continuar anotação',
              description: 'completar os campos que faltam',
              icon: 'pencil',
              tone: 'primary',
            },
        actions: [],
      };
    }

    case 'task': {
      const task = db.tasks.find((t) => t.id === id);
      if (!task) return null;
      return {
        kind,
        id,
        name: task.title,
        status: task.completed ? 'concluída' : 'pendente',
        meta: task.dueDate ? `prazo: ${fmtDate(task.dueDate)}` : 'sem prazo',
        recommended: task.completed
          ? {
              id: 'toggle-done',
              label: 'reabrir tarefa',
              description: 'voltar para o plano de ação',
              icon: 'undo',
              tone: 'neutral',
            }
          : {
              id: 'toggle-done',
              label: 'marcar como concluída',
              description: 'um clique e pronto ♡',
              icon: 'check',
              tone: 'primary',
            },
        actions: [EDIT_ACTION()],
      };
    }

    case 'exam': {
      const exam = db.exams.find((e) => e.id === id);
      if (!exam) return null;
      return {
        kind,
        id,
        name: exam.title,
        status: exam.completed ? 'concluída' : 'pendente',
        meta: exam.date ? `data: ${fmtDate(exam.date)}` : undefined,
        recommended: exam.completed
          ? {
              id: 'toggle-done',
              label: 'reabrir prova',
              description: 'voltar para as pendências',
              icon: 'undo',
              tone: 'neutral',
            }
          : {
              id: 'toggle-done',
              label: 'marcar como concluída',
              description: 'finalizar esta avaliação',
              icon: 'check',
              tone: 'primary',
            },
        actions: [EDIT_ACTION()],
      };
    }

    case 'reading':
    case 'catalogBook': {
      let name = '';
      let pages = 0;
      let total: number | undefined;
      let saved = false;

      if (kind === 'reading') {
        const reading = db.readings.find((r) => r.id === id);
        if (!reading) return null;
        name = reading.title;
        pages = reading.readPages ?? 0;
        total = reading.totalPages;
      } else {
        const book = db.catalogBooks?.find((b) => b.id === id);
        if (!book) return null;
        name = book.title;
        pages = db.readingProgress?.[id] ?? 0;
        total = book.totalPages;
        saved = db.savedBookIds?.includes(id) ?? false;
      }

      const done = total !== undefined && pages >= total;
      const commonActions: ContextActionDef[] =
        kind === 'catalogBook'
          ? [
              {
                id: 'toggle-save',
                label: saved ? 'remover dos salvos' : 'guardar livro',
                description: saved ? 'tirar da sua estante' : 'guardar na estante para depois',
                icon: 'bookmark',
                tone: 'neutral',
              },
            ]
          : [EDIT_ACTION()];

      return {
        kind,
        id,
        name,
        status: done ? 'concluída' : pages > 0 ? 'em andamento' : 'não iniciada',
        meta:
          total !== undefined
            ? `${pages} de ${total} páginas`
            : pages > 0
              ? `${pages} páginas`
              : undefined,
        recommended: done ? undefined : readingProgressAction(pages),
        actions: commonActions,
      };
    }

    case 'flashcard': {
      const card = db.flashcards.find((f) => f.id === id);
      if (!card) return null;
      const due = !card.lastReviewed || card.lastReviewed !== todayISO();
      const conceptName = card.conceptId
        ? db.concepts.find((c) => c.id === card.conceptId)?.name
        : undefined;
      return {
        kind,
        id,
        name: card.question,
        status: due ? 'para revisar' : 'revisado hoje',
        meta: conceptName ? `conceito: ${conceptName}` : undefined,
        recommended: due
          ? {
              id: 'review-flashcard',
              label: 'revisar agora',
              description: 'abrir a fila de revisão',
              icon: 'brain',
              tone: 'primary',
            }
          : undefined,
        actions: [EDIT_ACTION()],
      };
    }

    case 'session': {
      const session = db.sessions.find((s) => s.id === id);
      if (!session) return null;
      return {
        kind,
        id,
        name: session.topic,
        status: 'registrada',
        meta: `${session.durationMinutes} min · ${fmtDate(session.date)}`,
        recommended: {
          id: 'view-history',
          label: 'ver no histórico',
          description: 'abrir seu histórico de foco',
          icon: 'timer',
          tone: 'primary',
        },
        actions: [EDIT_ACTION()],
      };
    }

    case 'internship': {
      const log = db.internshipLogs.find((l) => l.id === id);
      if (!log) return null;
      return {
        kind,
        id,
        name: log.activity,
        status: log.reflections?.trim() ? 'completo' : 'incompleto',
        meta: `${log.hours}h · ${fmtDate(log.date)}`,
        recommended: {
          id: 'edit',
          label: 'continuar registro',
          description: 'completar os campos que faltam',
          icon: 'pencil',
          tone: 'primary',
        },
        actions: [],
      };
    }

    case 'concept': {
      const concept = db.concepts.find((c) => c.id === id);
      if (!concept) return null;
      return {
        kind,
        id,
        name: concept.name,
        recommended: {
          id: 'create-flashcard',
          label: 'criar flashcard',
          description: 'transformar esse conceito em revisão',
          icon: 'sparkles',
          tone: 'primary',
        },
        actions: [EDIT_ACTION()],
      };
    }

    case 'author': {
      const author = db.authors.find((a) => a.id === id);
      if (!author) return null;
      return {
        kind,
        id,
        name: author.name,
        meta: author.lifespan,
        recommended: {
          id: 'view-related',
          label: 'ver conceitos relacionados',
          description: 'explorar o repertório desse autor',
          icon: 'user',
          tone: 'primary',
        },
        actions: [EDIT_ACTION()],
      };
    }

    case 'material': {
      const material = db.materials.find((m) => m.id === id);
      if (!material) return null;
      return {
        kind,
        id,
        name: material.title,
        status: material.type,
        meta: material.url,
        recommended: material.url
          ? {
              id: 'open-link',
              label: 'abrir material',
              description: 'abrir o link em outra aba',
              icon: 'link',
              tone: 'primary',
            }
          : EDIT_ACTION(),
        actions: material.url ? [EDIT_ACTION()] : [],
      };
    }

    case 'looseNote': {
      const note = db.looseNotes.find((n) => n.id === id);
      if (!note) return null;
      const longContent = note.content.length > 280;
      return {
        kind,
        id,
        name: note.title,
        status: note.category,
        meta: longContent ? 'nota longa' : undefined,
        recommended: longContent
          ? {
              id: 'edit',
              label: 'continuar editando',
              description: 'essa nota ainda tem bastante conteúdo',
              icon: 'pencil',
              tone: 'primary',
            }
          : {
              id: 'transform-note',
              label: 'transformar em tarefa',
              description: 'ou escolher outro destino na sequência',
              icon: 'wand',
              tone: 'primary',
            },
        actions: longContent
          ? [
              {
                id: 'transform-note',
                label: 'transformar nota',
                description: 'virar tarefa, flashcard, aula e mais',
                icon: 'wand',
                tone: 'neutral',
              },
            ]
          : [],
      };
    }

    case 'quizSession': {
      const quiz = db.quizSessions.find((q) => q.id === id);
      if (!quiz) return null;
      const wrong = quiz.totalCount - quiz.correctCount;
      return {
        kind,
        id,
        name: `quiz de ${new Date(quiz.finishedAt).toLocaleDateString('pt-BR')}`,
        status: `${quiz.scorePct}% de acerto`,
        meta: wrong > 0 ? `${wrong} erro${wrong > 1 ? 's' : ''} para rever` : 'tudo certo!',
        recommended:
          wrong > 0
            ? {
                id: 'review-quiz',
                label: 'revisar erros',
                description: 'voltar às questões que ficaram para trás',
                icon: 'eye',
                tone: 'primary',
              }
            : undefined,
        // quiz não tem edição — somente revisão/exclusão
        actions: [],
      };
    }
  }
}
