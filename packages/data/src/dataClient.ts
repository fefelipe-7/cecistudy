/**
 * DataClient — camada de dados canônica do cecistudy.
 *
 * Centraliza a lógica pura de acesso/transformação de dados que hoje está
 * espalhada pelo `AppContext`:
 *
 * - `repositories`: CRUD puro sobre as coleções persistidas (sem React).
 * - `applyDatabaseToSetters`: fan-out banco → setters do contexto (a única
 *   parte que conhece o mapa de setters; o merge de stickers é injetado para
 *   manter `packages/data` livre de dependência de `src`/`react`).
 * - `snapshotFromState`: normaliza o instantâneo do estado para o backup.
 * - `buildBackupPayload` / `importAppDatabase` / `resetDatabase`: backup/restore.
 * - `createSyncAdapter`: adapta o merge de `packages/sync` por injeção de
 *   dependência (evita ciclo `packages/data → packages/sync`).
 *
 * Não importa react nem APIs nativas (Capacitor/Tauri) — regra de boundary.
 */
import type {
  UserProfile,
  Course,
  ClassNote,
  Task,
  Exam,
  PsychologyAuthor,
  PsychologyConcept,
  ReadingItem,
  Flashcard,
  MaterialItem,
  InternshipLog,
  TccData,
  Sticker,
  StudySession,
  StreakData,
  Technique,
  OnboardingState,
  QuizSession,
  LooseNote,
  SyncIndex,
} from '@/types';
import {
  emptyDatabase,
} from '@/data/empty';
import {
  PersistedDatabase,
  PersistedStateSnapshot,
  resetDatabase,
  STATIC_BANKS,
} from './persistentData';
import {
  buildBackupPayload,
  importAppDatabase,
  BackupV2,
} from './exportImport';

export type { PersistedDatabase, PersistedStateSnapshot, BackupV2 };
export { resetDatabase, STATIC_BANKS, buildBackupPayload, importAppDatabase };

const DEFAULT_SYNC_INDEX: SyncIndex = { stamps: {}, records: {}, tombstones: {} };

/** Coleções do banco que são arrays de entidades com `id`. */
export type ArrayCollectionKey =
  | 'courses'
  | 'classes'
  | 'tasks'
  | 'exams'
  | 'authors'
  | 'concepts'
  | 'readings'
  | 'flashcards'
  | 'materials'
  | 'internshipLogs'
  | 'stickers'
  | 'sessions'
  | 'techniques'
  | 'quizSessions'
  | 'looseNotes';

type ElementOf<K extends keyof PersistedStateSnapshot> =
  PersistedStateSnapshot[K] extends Array<infer U> ? U : never;

/** Repositório puro (sem React) sobre uma coleção do banco. */
export interface Repository<T extends { id: string }> {
  /** Lê a coleção inteira a partir de um instantâneo/banco. */
  getAll(db: PersistedStateSnapshot): T[];
  /** Busca por id (undefined se ausente). */
  getById(db: PersistedStateSnapshot, id: string): T | undefined;
  /** Insere ou atualiza por id (retorna nova lista, imutável). */
  upsert(items: T[], item: T): T[];
  /** Remove por id (retorna nova lista, imutável). */
  remove(items: T[], id: string): T[];
  /** Substitui toda a coleção. */
  replaceAll(next: T[]): T[];
}

/** Cria um repositório tipado para a coleção `key`. */
export function createRepository<K extends ArrayCollectionKey>(key: K) {
  type T = ElementOf<K> & { id: string };
  const getAll = (db: PersistedStateSnapshot): T[] =>
    db[key] as unknown as T[];
  return {
    getAll,
    getById(db: PersistedStateSnapshot, id: string): T | undefined {
      return getAll(db).find((x) => x.id === id);
    },
    upsert(items: T[], item: T): T[] {
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx === -1) return [...items, item];
      const next = items.slice();
      next[idx] = item;
      return next;
    },
    remove(items: T[], id: string): T[] {
      return items.filter((x) => x.id !== id);
    },
    replaceAll(next: T[]): T[] {
      return next;
    },
  };
}

/** Repositórios por coleção (acesso puro, usado nas migrações de view). */
export const repositories = {
  courses: createRepository('courses'),
  classes: createRepository('classes'),
  tasks: createRepository('tasks'),
  exams: createRepository('exams'),
  authors: createRepository('authors'),
  concepts: createRepository('concepts'),
  readings: createRepository('readings'),
  flashcards: createRepository('flashcards'),
  materials: createRepository('materials'),
  internshipLogs: createRepository('internshipLogs'),
  stickers: createRepository('stickers'),
  sessions: createRepository('sessions'),
  techniques: createRepository('techniques'),
  quizSessions: createRepository('quizSessions'),
  looseNotes: createRepository('looseNotes'),
} as const;

/** Mapa de setters do contexto para aplicação de um banco persistido. */
export interface DataClientSetters {
  profile: (v: UserProfile) => void;
  courses: (v: Course[]) => void;
  classes: (v: ClassNote[]) => void;
  tasks: (v: Task[]) => void;
  exams: (v: Exam[]) => void;
  authors: (v: PsychologyAuthor[]) => void;
  concepts: (v: PsychologyConcept[]) => void;
  readings: (v: ReadingItem[]) => void;
  flashcards: (v: Flashcard[]) => void;
  materials: (v: MaterialItem[]) => void;
   internshipLogs: (v: InternshipLog[]) => void;
   stickers: (v: Sticker[]) => void;
  sessions: (v: StudySession[]) => void;
  techniques: (v: Technique[]) => void;
  quizSessions: (v: QuizSession[]) => void;
  streakData: (v: StreakData) => void;
  reminder: (v: { enabled: boolean; time: string }) => void;
  looseNotes: (v: LooseNote[]) => void;
  savedBookIds: (v: string[]) => void;
  readingProgress: (v: Record<string, number>) => void;
bookmarkedCourseIds: (v: string[]) => void;
   tcc: (v: TccData) => void;
   onboarding: (v: OnboardingState) => void;
   syncIndex: (v: SyncIndex) => void;
}

export interface ApplyDatabaseOptions {
  /** Merge catálogo↔progresso dos stickers (vem de `src/lib/stickers`). */
  transformStickers?: (stickers: Sticker[]) => Sticker[];
}

/**
 * Aplica um banco persistido nos setters do contexto. Bancos estáticos
 * (`approaches`/`questions`) não são aplicados — são re-semeados sob demanda.
 * `syncIndex` cai no padrão quando ausente no banco.
 */
export function applyDatabaseToSetters(
  db: PersistedDatabase,
  setters: DataClientSetters,
  options?: ApplyDatabaseOptions,
): void {
  setters.profile(db.profile);
  setters.courses(db.courses);
  setters.classes(db.classes);
  setters.tasks(db.tasks);
  setters.exams(db.exams);
  setters.authors(db.authors);
  setters.concepts(db.concepts);
  setters.readings(db.readings);
  setters.flashcards(db.flashcards);
  setters.materials(db.materials);
  setters.internshipLogs(db.internshipLogs);
  setters.tcc(db.tcc);
  setters.stickers(
    options?.transformStickers ? options.transformStickers(db.stickers) : db.stickers,
  );
  setters.sessions(db.sessions);
  setters.techniques(db.techniques);
  setters.quizSessions(db.quizSessions);
  setters.streakData(db.streakData);
  setters.reminder(db.reminder);
  setters.looseNotes(db.looseNotes as LooseNote[]);
  setters.savedBookIds(db.savedBookIds);
  setters.readingProgress(db.readingProgress ?? {});
  setters.bookmarkedCourseIds(db.bookmarkedCourseIds);
  setters.onboarding(db.onboarding);
  setters.syncIndex(db.syncIndex ?? DEFAULT_SYNC_INDEX);
}

/**
 * Normaliza um instantâneo do estado para o formato de backup (garante
 * `readingProgress`/`syncIndex` não-nulos). Centraliza a montagem do snapshot
 * usado por `exportData`/`getSyncPayloadJson`.
 */
export function snapshotFromState(state: PersistedStateSnapshot): PersistedStateSnapshot {
  return {
    ...state,
    readingProgress: state.readingProgress ?? {},
    syncIndex: state.syncIndex ?? DEFAULT_SYNC_INDEX,
  };
}

/**
 * Adaptador de sincronização por injeção de dependência.
 * Mantém `packages/data` livre de import circular com `packages/sync`:
 * o `merge` real (de `packages/sync`) é passado pelo `AppContext`.
 */
export interface SyncAdapter<Remote = unknown, Manifest = unknown> {
  merge(local: PersistedDatabase, remote: Remote, manifest: Manifest): PersistedDatabase;
}

export function createSyncAdapter<Remote = unknown, Manifest = unknown>(
  mergeFn: (local: PersistedDatabase, remote: Remote, manifest: Manifest) => PersistedDatabase,
): SyncAdapter<Remote, Manifest> {
  return {
    merge: (local, remote, manifest) => mergeFn(local, remote, manifest),
  };
}

/** Tipo do cliente de dados exposto via `dataClient`. */
export interface DataClient {
  repositories: typeof repositories;
  snapshotFromState: typeof snapshotFromState;
  applyDatabaseToSetters: typeof applyDatabaseToSetters;
  buildBackupPayload: typeof buildBackupPayload;
  importAppDatabase: typeof importAppDatabase;
  resetDatabase: typeof resetDatabase;
  STATIC_BANKS: typeof STATIC_BANKS;
  createSyncAdapter: typeof createSyncAdapter;
}

/** Instância canônica do cliente de dados. */
export const dataClient: DataClient = {
  repositories,
  snapshotFromState,
  applyDatabaseToSetters,
  buildBackupPayload,
  importAppDatabase,
  resetDatabase,
  STATIC_BANKS,
  createSyncAdapter,
};
