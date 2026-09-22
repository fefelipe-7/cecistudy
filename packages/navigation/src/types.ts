// Tipos de navegação por pilha — puros e sem React (dono: packages/navigation).
// Os tipos acoplados a React (DynamicHeaderConfig/HeaderAction) ficam em src/types/navigation.
//
// Bridge de domínio: NavScreen referencia tipos de quiz que hoje ainda vivem em
// src/types. import type (apenas types); TempleSection virá de ./temple (local),
// NUNCA de src — evita o ciclo src/types/temple → packages/navigation → src.
import type {
  StudyQuestion,
  QuizConfig,
  QuizAnswer,
  QuizPlayState,
  QuestionGroup,
} from '../../../src/types/quiz';
// re-exportado para o resto do pacote (hash/stack/derive) consumir de ./types
export type {
  StudyQuestion,
  QuizConfig,
  QuizAnswer,
  QuizPlayState,
  QuestionGroup,
} from '../../../src/types/quiz';
import type { TempleSection } from './temple';

export type NavTab = 'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil';

export type SubTabFaculdade = 'disciplinas' | 'calendario' | 'estagio';

/** Telas dedicadas abertas a partir do feed de estudos. */
export type StudyScreen = 'focus' | 'revisar' | 'leituras' | 'historico';
export type SubTabBiblioteca = 'materiais' | 'autores' | 'conceitos' | 'abordagens' | 'mapa';

/**
 * Tela da pilha de navegação nativa (push/pop).
 * Base = tab; telas auxiliares são empurradas por cima da base.
 */
export type NavScreen =
  | { kind: 'tab'; tab: NavTab }
  | { kind: 'course'; courseId: string }
  /** Detalhe full-screen de uma aula (`#/faculdade/:courseId/aula/:classNoteId`), empilhado sobre o curso. */
  | { kind: 'classNote'; classNoteId: string; courseId: string }
  | { kind: 'notes' }
  | { kind: 'temple' }
  /** Seção interna do templo (`#/biblioteca/templo/<slug>`), empilhada sobre o templo. */
  | { kind: 'templeSection'; section: TempleSection }
  /** Detalhe de uma comparação do templo (`#/biblioteca/templo/comparacoes/:slug`). */
  | { kind: 'comparison'; slug: string }
  | { kind: 'streak' }
  | { kind: 'internshipDiary' }
  | { kind: 'tcc' }
  | { kind: 'stickers' }
  | { kind: 'compose' }
  | { kind: 'composeDetails' }
  | { kind: 'noteDetail'; noteId: string }
  | { kind: 'noteTransform'; noteId: string }
  | { kind: 'wizard'; type: WizardFlow }
  | { kind: 'approach'; approachId: string }
  | { kind: 'families' }
  | { kind: 'family'; familyId: string }
  | { kind: 'quiz-group-detail'; group: QuestionGroup }
  | { kind: 'quiz-category' }
  | { kind: 'quiz-loading'; config: QuizConfig }
  | { kind: 'quiz-play'; state: QuizPlayState }
  | { kind: 'quiz-result'; answers: QuizAnswer[]; config: QuizConfig; startTime: number; correctCount: number; totalCount: number; pool: StudyQuestion[] }
  /** Sincronização entre dispositivos (pareamento P2P), empilhada sobre o perfil. */
  | { kind: 'sync' }
  /** Telas dedicadas do estudo (empurradas sobre a aba estudos pelo feed). */
  | { kind: 'study'; screen: StudyScreen }
  /** Desktop: grafo de conhecimento (nós + relações + detalhe). */
  | { kind: 'knowledge-graph' }
  /** Desktop: projetos & TCC (lista + detalhe com saídas). */
  | { kind: 'projects' }
  /** Desktop: inbox de curadoria (sugestões pendentes + ações). */
  | { kind: 'inbox' };

/**
 * Tipos de wizard de criação em tela cheia (substitui o quick add em modal).
 * `task-exam` é o fluxo combinado do FAB: 1º passo escolhe entre tarefa e prova.
 */
export type WizardFlow =
  | 'task'
  | 'exam'
  | 'task-exam'
  | 'course'
  | 'reading'
  | 'flashcard'
  | 'internship'
  | 'session'
  | 'author'
  | 'concept'
  | 'material';

/**
 * Entidades do usuário que podem ser editadas/excluídas pelo menu universal
 * (long-press no card ou clique com botão direito no desktop).
 */
export type ManagedItemKind =
  | 'course'
  | 'class'
  | 'task'
  | 'exam'
  | 'reading'
  | 'flashcard'
  | 'session'
  | 'internship'
  | 'concept'
  | 'author'
  | 'material'
  | 'looseNote'
  | 'quizSession'
  /** Livro do catálogo estático da biblioteca (não é dado da usuária — sem editar/excluir). */
  | 'catalogBook';

/** Item sob o menu de editar/excluir (payload fora da URL, igual `wizardNoteId`). */
export interface ManagedItem {
  kind: ManagedItemKind;
  id: string;
}

/** Nomes de ícones suportados pelo resolver `CourseIcon` (mapa em `components/ui/CourseIcon.tsx`). */
export type CourseIconName =
  | 'Brain'
  | 'FileText'
  | 'Sparkles'
  | 'Users'
  | 'HeartHandshake'
  | 'GraduationCap'
  | 'Landmark'
  | 'Flame'
  | 'Target'
  | 'Trophy'
  | 'Clock'
  | 'BookOpen'
  | 'History'
  | 'Lightbulb'
  | 'User'
  | 'Wrench';
