import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
   UserProfile,
   SupervisionNotebook,
   Course,
   ClassNote,
   Task,
   Exam,
   PsychologyAuthor,
   PsychologyConcept,
   PsychologyApproach,
   ReadingItem,
   Flashcard,
   MaterialItem,
   InternshipLog,
   TccData,
   Sticker,
   StudySession,
   Technique,
   StudyQuestion,
   QuizSession,
   LooseNote,
   StreakData,
   SyncIndex,
 } from '../types';
import type {
  Workspace,
  Relation,
  Suggestion,
  AssociationPolicy,
  Project,
  Output,
} from '../core/domain';
import {
  emptyProfile,
  emptyTcc,
  emptyStreakData,
  emptyReminder,
  emptyOnboarding,
  emptyDatabase,
} from '../data/empty';
import { DEFAULT_WORKSPACE_ID, SCHEMA_VERSION } from '../data/schema';
import { useSqliteState } from '../lib/useSqliteState';
import { useStampedState } from '../lib/useStampedState';
import { usePersistentState } from '../lib/usePersistentState';
import { emptySyncIndex, maxStamp } from '../lib/sync/stamp';
import { lockedStickerCatalog } from '../data/stickerCatalog';
import { mergeCatalogWithProgress } from '../lib/stickers';
import { parseLegacySchedule } from '../lib/schedule';
import { ensureApproaches, ensureQuestions } from '../lib/bootPreload';
import { migrateSupervisionNotebook } from '../lib/migrations';
import { exportAppDatabase } from '../lib/exportImport';
import {
  applyDatabaseToSetters,
  snapshotFromState,
  dataClient,
  type DataClient,
  buildBackupPayload,
  importAppDatabase,
} from '../lib/dataClient';
import { GitHubSyncProvider } from '../lib/sync/providers/github';
import {
  SyncEngine,
  INITIAL_CHECKPOINT,
  type SyncCheckpoint,
  type SyncPreview,
} from '../lib/sync/engine';
import type { SyncManifest } from '../lib/sync/provider';
import { getUserDb, clearUserData } from '../lib/db/userDb';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM"
}

/**
 * Fatias coarse do cliente de dados (PERF-001 A.3): vistas por domínio que
 * permitem aos consumidores re-renderizar SÓ quando o domínio relevante muda.
 * Cada fatia é memoizada com as referências de valor/setter (estáveis desde o
 * `useStampedState`/`useSqliteState`); um novel objeto só nasce quando aquele
 * domínio muda. O valor monolítico (`DataClientValue`) continua igual para o
 * restante do app — estas fatias são um acréscimo para os consumidores pesados.
 */
export interface DataClientCoursesSlice {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setCoursesRaw: React.Dispatch<React.SetStateAction<Course[]>>;
  classes: ClassNote[];
  setClasses: React.Dispatch<React.SetStateAction<ClassNote[]>>;
  setClassesRaw: React.Dispatch<React.SetStateAction<ClassNote[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTasksRaw: React.Dispatch<React.SetStateAction<Task[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setExamsRaw: React.Dispatch<React.SetStateAction<Exam[]>>;
  materials: MaterialItem[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
  setMaterialsRaw: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
  bookmarkedCourseIds: string[];
  setBookmarkedCourseIds: React.Dispatch<React.SetStateAction<string[]>>;
  setBookmarkedCourseIdsRaw: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface DataClientStudySlice {
  sessions: StudySession[];
  setSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  setSessionsRaw: React.Dispatch<React.SetStateAction<StudySession[]>>;
  readings: ReadingItem[];
  setReadings: React.Dispatch<React.SetStateAction<ReadingItem[]>>;
  setReadingsRaw: React.Dispatch<React.SetStateAction<ReadingItem[]>>;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  setFlashcardsRaw: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  streakData: StreakData;
  setStreakData: React.Dispatch<React.SetStateAction<StreakData>>;
  setStreakDataRaw: React.Dispatch<React.SetStateAction<StreakData>>;
  quizSessions: QuizSession[];
  setQuizSessions: React.Dispatch<React.SetStateAction<QuizSession[]>>;
  setQuizSessionsRaw: React.Dispatch<React.SetStateAction<QuizSession[]>>;
  techniques: Technique[];
  setTechniques: React.Dispatch<React.SetStateAction<Technique[]>>;
  setTechniquesRaw: React.Dispatch<React.SetStateAction<Technique[]>>;
  questions: StudyQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<StudyQuestion[]>>;
}

export interface DataClientKnowledgeSlice {
  authors: PsychologyAuthor[];
  setAuthors: React.Dispatch<React.SetStateAction<PsychologyAuthor[]>>;
  setAuthorsRaw: React.Dispatch<React.SetStateAction<PsychologyAuthor[]>>;
  concepts: PsychologyConcept[];
  setConcepts: React.Dispatch<React.SetStateAction<PsychologyConcept[]>>;
  setConceptsRaw: React.Dispatch<React.SetStateAction<PsychologyConcept[]>>;
  approaches: PsychologyApproach[];
  setApproaches: React.Dispatch<React.SetStateAction<PsychologyApproach[]>>;
  savedBookIds: string[];
  setSavedBookIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSavedBookIdsRaw: React.Dispatch<React.SetStateAction<string[]>>;
  readingProgress: Record<string, number>;
  setReadingProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setReadingProgressRaw: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  looseNotes: LooseNote[];
  setLooseNotes: React.Dispatch<React.SetStateAction<LooseNote[]>>;
  setLooseNotesRaw: React.Dispatch<React.SetStateAction<LooseNote[]>>;
}

export interface DataClientAppSlice {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setProfileRaw: React.Dispatch<React.SetStateAction<UserProfile>>;
  internshipLogs: InternshipLog[];
  setInternshipLogs: React.Dispatch<React.SetStateAction<InternshipLog[]>>;
  setInternshipLogsRaw: React.Dispatch<React.SetStateAction<InternshipLog[]>>;
  tcc: TccData;
  setTcc: React.Dispatch<React.SetStateAction<TccData>>;
  setTccRaw: React.Dispatch<React.SetStateAction<TccData>>;
  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;
  setStickersRaw: React.Dispatch<React.SetStateAction<Sticker[]>>;
  reminderSettings: ReminderSettings;
  setReminderSettings: React.Dispatch<React.SetStateAction<ReminderSettings>>;
  gcalEnabled: boolean;
  setGcalEnabledState: React.Dispatch<React.SetStateAction<boolean>>;
  gcalMap: Record<string, string>;
  setGcalMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onboarding: import('../types').OnboardingState;
  setOnboarding: React.Dispatch<React.SetStateAction<import('../types').OnboardingState>>;
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  relations: Relation[];
  setRelations: React.Dispatch<React.SetStateAction<Relation[]>>;
  suggestions: Suggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  associationPolicies: AssociationPolicy[];
  setAssociationPolicies: React.Dispatch<React.SetStateAction<AssociationPolicy[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  outputs: Output[];
  setOutputs: React.Dispatch<React.SetStateAction<Output[]>>;
  toast: string | null;
  showToast: (message: string) => void;
  deviceId: string;
  syncCheckpoint: SyncCheckpoint;
  setSyncCheckpoint: React.Dispatch<React.SetStateAction<SyncCheckpoint>>;
  githubSyncConfig: { owner: string; repo: string; token: string } | null;
  setGithubSyncConfig: React.Dispatch<
    React.SetStateAction<{ owner: string; repo: string; token: string } | null>
  >;
  syncStatus: 'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview';
  setSyncStatus: React.Dispatch<
    React.SetStateAction<'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview'>
  >;
  syncErrorMessage: string | null;
  setSyncErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  pendingSyncPreview: {
    preview: SyncPreview;
    mergedJson: string;
    remoteManifest: SyncManifest;
    remoteSha: string;
  } | null;
  setPendingSyncPreview: React.Dispatch<
    React.SetStateAction<{
      preview: SyncPreview;
      mergedJson: string;
      remoteManifest: SyncManifest;
      remoteSha: string;
    } | null>
  >;
  applyDatabase: (db: ReturnType<typeof emptyDatabase>) => void;
  resetApp: () => void;
  completeOnboarding: (profileUpdate: Partial<UserProfile>) => void;
  exportData: () => Promise<void>;
  importData: (json: string) => void;
  getSyncPayloadJson: () => Promise<string>;
  applySyncedDatabase: (db: ReturnType<typeof emptyDatabase>) => void;
  configureGithubSync: (cfg: { owner: string; repo: string; token: string }) => void;
  clearGithubSync: () => void;
  syncNow: () => Promise<void>;
  syncInBackground: () => Promise<void>;
  applySyncPreview: () => void;
  discardSyncPreview: () => void;
  dataClient: DataClient;
}

/**
 * Cliente de dados (Fase 10.5-b): dono do estado de entidades/domínio.
 * Centraliza todo o `useState`/`useStampedState`/`usePersistentState` das
 * coleções de dados + os seeds estáticos (abordagens/questões) e o merge
 * inicial do catálogo de stickers. Os handlers de orquestração ficam nos
 * providers por casca (via `buildAppContextValue`), consumindo estes setters —
 * o formato público (`value`) não muda, então views e testes ficam intactos.
 */
export interface DataClientValue {
  syncIndex: SyncIndex;
  setSyncIndex: React.Dispatch<React.SetStateAction<SyncIndex>>;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setProfileRaw: React.Dispatch<React.SetStateAction<UserProfile>>;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setCoursesRaw: React.Dispatch<React.SetStateAction<Course[]>>;
  classes: ClassNote[];
  setClasses: React.Dispatch<React.SetStateAction<ClassNote[]>>;
  setClassesRaw: React.Dispatch<React.SetStateAction<ClassNote[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTasksRaw: React.Dispatch<React.SetStateAction<Task[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setExamsRaw: React.Dispatch<React.SetStateAction<Exam[]>>;
  authors: PsychologyAuthor[];
  setAuthors: React.Dispatch<React.SetStateAction<PsychologyAuthor[]>>;
  setAuthorsRaw: React.Dispatch<React.SetStateAction<PsychologyAuthor[]>>;
  concepts: PsychologyConcept[];
  setConcepts: React.Dispatch<React.SetStateAction<PsychologyConcept[]>>;
  setConceptsRaw: React.Dispatch<React.SetStateAction<PsychologyConcept[]>>;
  approaches: PsychologyApproach[];
  setApproaches: React.Dispatch<React.SetStateAction<PsychologyApproach[]>>;
  readings: ReadingItem[];
  setReadings: React.Dispatch<React.SetStateAction<ReadingItem[]>>;
  setReadingsRaw: React.Dispatch<React.SetStateAction<ReadingItem[]>>;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  setFlashcardsRaw: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  materials: MaterialItem[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
  setMaterialsRaw: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
internshipLogs: InternshipLog[];
   setInternshipLogs: React.Dispatch<React.SetStateAction<InternshipLog[]>>;
   setInternshipLogsRaw: React.Dispatch<React.SetStateAction<InternshipLog[]>>;
  tcc: TccData;
  setTcc: React.Dispatch<React.SetStateAction<TccData>>;
  setTccRaw: React.Dispatch<React.SetStateAction<TccData>>;
  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;
  setStickersRaw: React.Dispatch<React.SetStateAction<Sticker[]>>;
  sessions: StudySession[];
  setSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  setSessionsRaw: React.Dispatch<React.SetStateAction<StudySession[]>>;
  techniques: Technique[];
  setTechniques: React.Dispatch<React.SetStateAction<Technique[]>>;
setTechniquesRaw: React.Dispatch<React.SetStateAction<Technique[]>>;
   quizSessions: QuizSession[];
  setQuizSessions: React.Dispatch<React.SetStateAction<QuizSession[]>>;
  setQuizSessionsRaw: React.Dispatch<React.SetStateAction<QuizSession[]>>;
questions: StudyQuestion[];
    setQuestions: React.Dispatch<React.SetStateAction<StudyQuestion[]>>;
    streakData: StreakData;
    setStreakData: React.Dispatch<React.SetStateAction<StreakData>>;
    setStreakDataRaw: React.Dispatch<React.SetStateAction<StreakData>>;
    reminderSettings: ReminderSettings;
    setReminderSettings: React.Dispatch<React.SetStateAction<ReminderSettings>>;
    gcalEnabled: boolean;
    setGcalEnabledState: React.Dispatch<React.SetStateAction<boolean>>;
    gcalMap: Record<string, string>;
    setGcalMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    onboarding: import('../types').OnboardingState;
    setOnboarding: React.Dispatch<React.SetStateAction<import('../types').OnboardingState>>;
    workspaces: Workspace[];
    setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
    relations: Relation[];
    setRelations: React.Dispatch<React.SetStateAction<Relation[]>>;
    suggestions: Suggestion[];
    setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
    associationPolicies: AssociationPolicy[];
    setAssociationPolicies: React.Dispatch<React.SetStateAction<AssociationPolicy[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    outputs: Output[];
    setOutputs: React.Dispatch<React.SetStateAction<Output[]>>;
    savedBookIds: string[];
    setSavedBookIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSavedBookIdsRaw: React.Dispatch<React.SetStateAction<string[]>>;
    readingProgress: Record<string, number>;
    setReadingProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setReadingProgressRaw: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    bookmarkedCourseIds: string[];
    setBookmarkedCourseIds: React.Dispatch<React.SetStateAction<string[]>>;
    setBookmarkedCourseIdsRaw: React.Dispatch<React.SetStateAction<string[]>>;
    looseNotes: LooseNote[];
    setLooseNotes: React.Dispatch<React.SetStateAction<LooseNote[]>>;
    setLooseNotesRaw: React.Dispatch<React.SetStateAction<LooseNote[]>>;

    // ---------- Backup / onboarding / reset / sync (orquestração de banco) ----------
    toast: string | null;
    showToast: (message: string) => void;
    deviceId: string;
    syncCheckpoint: SyncCheckpoint;
    setSyncCheckpoint: React.Dispatch<React.SetStateAction<SyncCheckpoint>>;
    githubSyncConfig: { owner: string; repo: string; token: string } | null;
    setGithubSyncConfig: React.Dispatch<
      React.SetStateAction<{ owner: string; repo: string; token: string } | null>
    >;
    syncStatus: 'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview';
    setSyncStatus: React.Dispatch<
      React.SetStateAction<'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview'>
    >;
    syncErrorMessage: string | null;
    setSyncErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
    pendingSyncPreview: {
      preview: SyncPreview;
      mergedJson: string;
      remoteManifest: SyncManifest;
      remoteSha: string;
    } | null;
    setPendingSyncPreview: React.Dispatch<
      React.SetStateAction<{
        preview: SyncPreview;
        mergedJson: string;
        remoteManifest: SyncManifest;
        remoteSha: string;
      } | null>
    >;
    applyDatabase: (db: ReturnType<typeof emptyDatabase>) => void;
    resetApp: () => void;
    completeOnboarding: (profileUpdate: Partial<UserProfile>) => void;
    exportData: () => Promise<void>;
    importData: (json: string) => void;
    getSyncPayloadJson: () => Promise<string>;
    applySyncedDatabase: (db: ReturnType<typeof emptyDatabase>) => void;
    configureGithubSync: (cfg: { owner: string; repo: string; token: string }) => void;
    clearGithubSync: () => void;
    syncNow: () => Promise<void>;
    syncInBackground: () => Promise<void>;
    applySyncPreview: () => void;
    discardSyncPreview: () => void;
    dataClient: DataClient;
    domainCourses: DataClientCoursesSlice;
    domainStudy: DataClientStudySlice;
    domainKnowledge: DataClientKnowledgeSlice;
    domainApp: DataClientAppSlice;
}

export function useDataClient(): DataClientValue {
  // State — defaults vazios (produção); dados de exemplo entram via onboarding/demo
  // Domínio persiste via useSqliteState: web = localStorage (intacto), nativo = SQLite.
  // Coleções de domínio usam `useStampedState`: além do valor, mantém o SyncIndex
  // (carimbos por coleção/registro + tombstones) p/ sincronização entre dispositivos.
  const [syncIndex, setSyncIndex] = useSqliteState<SyncIndex>('syncIndex', emptySyncIndex());
  const { value: profile, set: setProfile, setRaw: setProfileRaw } = useStampedState<UserProfile>('profile', emptyProfile, syncIndex, setSyncIndex);
  const { value: courses, set: setCourses, setRaw: setCoursesRaw } = useStampedState<Course[]>('courses', [], syncIndex, setSyncIndex);

  // normaliza schedule legado (string) persistido por versões anteriores à v9
  useEffect(() => {
    setCourses((prev) =>
      prev.every((c) => Array.isArray(c.schedule))
        ? prev
        : prev.map((c) => (Array.isArray(c.schedule) ? c : { ...c, schedule: parseLegacySchedule(c.schedule) }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { value: classes, set: setClasses, setRaw: setClassesRaw } = useStampedState<ClassNote[]>('classes', [], syncIndex, setSyncIndex);
  const { value: tasks, set: setTasks, setRaw: setTasksRaw } = useStampedState<Task[]>('tasks', [], syncIndex, setSyncIndex);
  const { value: exams, set: setExams, setRaw: setExamsRaw } = useStampedState<Exam[]>('exams', [], syncIndex, setSyncIndex);
  const { value: authors, set: setAuthors, setRaw: setAuthorsRaw } = useStampedState<PsychologyAuthor[]>('authors', [], syncIndex, setSyncIndex);
  const { value: concepts, set: setConcepts, setRaw: setConceptsRaw } = useStampedState<PsychologyConcept[]>('concepts', [], syncIndex, setSyncIndex);
  // Abordagens (97, ~1MB): banco estático do catálogo — NÃO é dado da usuária.
  // Web: seed lazy do módulo embutido. Nativo: lido do catálogo SQLite.
  // Fonte única via bootPreload: se a splash já carregou, reaproveita a promise.
  const [approaches, setApproaches] = useState<PsychologyApproach[]>([]);
  useEffect(() => {
    if (approaches.length > 0) return;
    let cancelled = false;
    ensureApproaches<PsychologyApproach>()
      .then((data) => {
        if (cancelled || data.length === 0) return;
        setApproaches(data);
      })
      .catch(() => {
        /* mantém vazio; o efeito re-tenta no próximo ciclo se o app ainda estiver montado */
      });
    return () => {
      cancelled = true;
    };
  }, [approaches.length]);

  const { value: readings, set: setReadings, setRaw: setReadingsRaw } = useStampedState<ReadingItem[]>('readings', [], syncIndex, setSyncIndex);
  const { value: flashcards, set: setFlashcards, setRaw: setFlashcardsRaw } = useStampedState<Flashcard[]>('flashcards', [], syncIndex, setSyncIndex);
  const { value: materials, set: setMaterials, setRaw: setMaterialsRaw } = useStampedState<MaterialItem[]>('materials', [], syncIndex, setSyncIndex);
  const { value: internshipLogs, set: setInternshipLogs, setRaw: setInternshipLogsRaw } = useStampedState<InternshipLog[]>('internship', [], syncIndex, setSyncIndex);
  const { value: tcc, set: setTcc, setRaw: setTccRaw } = useStampedState<TccData>('tcc', emptyTcc, syncIndex, setSyncIndex);
  const { value: stickers, set: setStickers, setRaw: setStickersRaw } = useStampedState<Sticker[]>('stickers', lockedStickerCatalog(), syncIndex, setSyncIndex);
  const { value: sessions, set: setSessions, setRaw: setSessionsRaw } = useStampedState<StudySession[]>('sessions', [], syncIndex, setSyncIndex);
  const { value: techniques, set: setTechniques, setRaw: setTechniquesRaw } = useStampedState<Technique[]>('techniques', [], syncIndex, setSyncIndex);
   const { value: quizSessions, set: setQuizSessions, setRaw: setQuizSessionsRaw } = useStampedState<QuizSession[]>('quizSessions', [], syncIndex, setSyncIndex);

  // Questões (745): banco estático do catálogo — mesmo tratamento de abordagens.
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  useEffect(() => {
    if (questions.length > 0) return;
    let cancelled = false;
    ensureQuestions<StudyQuestion>()
      .then((data) => {
        if (cancelled || data.length === 0) return;
        setQuestions(data);
      })
      .catch(() => {
        /* mantém vazio; o efeito re-tenta no próximo ciclo se o app ainda estiver montado */
      });
    return () => {
      cancelled = true;
    };
  }, [questions.length]);

  // Streak de estudos (dias ativos; derivados calculados abaixo)
  const { value: streakData, set: setStreakData, setRaw: setStreakDataRaw } = useStampedState<StreakData>('streakData', emptyStreakData, syncIndex, setSyncIndex);

  // Lembrete diário de estudo (só efetivo no app nativo)
  const [reminderSettings, setReminderSettings] = usePersistentState<ReminderSettings>('reminder', emptyReminder);

  // Integração com Google Calendar (apenas provas e tarefas; toggle próprio)
  const [gcalEnabled, setGcalEnabledState] = usePersistentState<boolean>('gcalEnabled', false);
  const [gcalMap, setGcalMap] = usePersistentState<Record<string, string>>('gcalMap', {});

  // Onboarding (primeiro acesso)
  const [onboarding, setOnboarding] = usePersistentState<import('../types').OnboardingState>('onboarding', emptyOnboarding);
  // Fase 3 — registry local de workspaces. O padrão é o Workspace Acadêmico.
  // (o estado de sessão desktop — incluindo activeWorkspaceId — vive no
  // DesktopSessionProvider em apps/desktop; aqui só guardamos o registry.)
  const [workspaces, setWorkspaces] = usePersistentState<Workspace[]>('workspaces', [
    {
      id: DEFAULT_WORKSPACE_ID,
      name: 'acadêmico',
      kind: 'academico',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      settings: { defaultModule: 'conhecimento' },
      isolated: true,
    },
  ]);

  // Fase 6 — Relations + Inbox (fundação do Grafo de Conhecimento).
  const [relations, setRelations] = usePersistentState<Relation[]>('relations', []);
  const [suggestions, setSuggestions] = usePersistentState<Suggestion[]>('suggestions', []);
  const [associationPolicies, setAssociationPolicies] = usePersistentState<AssociationPolicy[]>(
    'associationPolicies',
    []
  );

  // Fase 8 — Projetos & TCC (produção acadêmica). Slice 1: gestão de projetos/outputs.
  const [projects, setProjects] = usePersistentState<Project[]>('projects', []);
  const [outputs, setOutputs] = usePersistentState<Output[]>('outputs', []);

  // Livros salvos da biblioteca (no contexto → entram no export/import)
  const { value: savedBookIds, set: setSavedBookIds, setRaw: setSavedBookIdsRaw } = useStampedState<string[]>('savedBookIds', [], syncIndex, setSyncIndex);

  // Progresso de leitura por obra (id → páginas lidas), registrado no modal do livro
  const { value: readingProgress, set: setReadingProgress, setRaw: setReadingProgressRaw } = useStampedState<Record<string, number>>(
    'readingProgress',
    {},
    syncIndex,
    setSyncIndex
  );

  // Favoritos de disciplinas (persistidos globalmente)
  const { value: bookmarkedCourseIds, set: setBookmarkedCourseIds, setRaw: setBookmarkedCourseIdsRaw } = useStampedState<string[]>('bookmarkedCourseIds', [], syncIndex, setSyncIndex);

  // Notas avulsas (global — a tela de composição salva fora da biblioteca)
  const { value: looseNotes, set: setLooseNotes, setRaw: setLooseNotesRaw } = useStampedState<LooseNote[]>('looseNotes', [], syncIndex, setSyncIndex);

  // ---------- Feedback compartilhado (toast) ----------
  // O toast da camada de dados (backup/sync/onboarding) vive aqui — as cascas
  // renderizam o estado via os overlays por app; views continuam usando `showToast`.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, 2600);
  }, []);
  // Limpa o timer do toast ao desmontar o provider.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ---------- Sincronização com a nuvem (GitHub provider) ----------
  const [deviceId] = usePersistentState(
    'deviceId',
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `dev-${Math.random().toString(36).slice(2)}`,
  );
  const [syncCheckpoint, setSyncCheckpoint] = usePersistentState<SyncCheckpoint>(
    'syncCheckpoint',
    INITIAL_CHECKPOINT,
  );
  const [githubSyncConfig, setGithubSyncConfig] = usePersistentState<{
    owner: string;
    repo: string;
    token: string;
  } | null>('githubSyncConfig', null);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview'
  >('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [pendingSyncPreview, setPendingSyncPreview] = useState<{
    preview: SyncPreview;
    mergedJson: string;
    remoteManifest: SyncManifest;
    remoteSha: string;
  } | null>(null);

  /** Aplica um banco completo (empty/demo/import/sincronizado) sem carimbar o SyncIndex. */
  const applyDatabase = (db: ReturnType<typeof emptyDatabase>) => {
    // Migração one-shot (Fase 3): caderno de supervisão legado → InternshipLog.
    // O `supervisionNotebook` não é mais um estado persistido; convertemos em
    // registros de `type: 'supervisao'` na primeira aplicação.
    const legacyNotebook = (db as unknown as { supervisionNotebook?: SupervisionNotebook[] }).supervisionNotebook ?? [];
    const migratedLogs = migrateSupervisionNotebook(db.internshipLogs, legacyNotebook);
    const nextDb = { ...db, internshipLogs: migratedLogs, supervisionNotebook: undefined };
    applyDatabaseToSetters(
      nextDb as any,
      {
        profile: setProfileRaw,
        courses: setCoursesRaw,
        classes: setClassesRaw,
        tasks: setTasksRaw,
        exams: setExamsRaw,
        authors: setAuthorsRaw,
        concepts: setConceptsRaw,
        readings: setReadingsRaw,
        flashcards: setFlashcardsRaw,
        materials: setMaterialsRaw,
        internshipLogs: setInternshipLogsRaw,
        tcc: setTccRaw,
        stickers: setStickersRaw,
        sessions: setSessionsRaw,
        techniques: setTechniquesRaw,
        quizSessions: setQuizSessionsRaw,
        streakData: setStreakDataRaw,
        reminder: setReminderSettings,
        looseNotes: setLooseNotesRaw,
        savedBookIds: setSavedBookIdsRaw,
        readingProgress: setReadingProgressRaw,
        bookmarkedCourseIds: setBookmarkedCourseIdsRaw,
        onboarding: setOnboarding,
        syncIndex: setSyncIndex,
      },
      // approaches/questions são bancos estáticos (seed lazy): não são aplicados
      // aqui — backups não os trazem e o catálogo é re-semeado sob demanda.
      { transformStickers: mergeCatalogWithProgress },
    );
  };

  /** Limpa tudo e volta ao estado inicial (zerado) — onboarding é reaberto. */
  const resetApp = () => {
    applyDatabase(emptyDatabase());
    // Bancos estáticos (approaches/questions) também são zerados para refletir o
    // "primeiro acesso"; o efeito de seed do DataClient re-semeia sob demanda
    // (agora que o array está vazio).
    setApproaches([]);
    setQuestions([]);
    // Nativo: apaga também a base SQLite (conteúdo + mapa de import legado —
    // assim uma futura reinstalação reimporta do Preferences, se houver).
    void (async () => {
      try {
        const db = await getUserDb();
        if (db) await clearUserData(db);
      } catch (e) {
        console.error('[resetApp] falha ao limpar SQLite', e);
      }
    })();
    showToast('cantinho resetado — vamos começar de novo? ♡');
  };

  /** Conclui o onboarding: grava o perfil e parte do cantinho vazio (zero). */
  const completeOnboarding = (profileUpdate: Partial<UserProfile>) => {
    applyDatabase(emptyDatabase());
    setProfile((prev) => ({ ...prev, ...profileUpdate }));
    setOnboarding({ completed: true, completedAt: new Date().toISOString() });
    showToast('cantinho pronto — bora começar? ♡');
  };

  /** Coleta todos os estados persistidos num payload versionado (backup). */
  const exportData = async () => {
    const payload = await buildBackupPayload(snapshotFromState({
      profile, courses, classes, tasks, exams, authors, concepts, approaches,
      readings, flashcards, materials, internshipLogs, tcc, stickers, sessions,
      streakData, reminder: reminderSettings, looseNotes, savedBookIds,
      bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions,
      onboarding, syncIndex,
    }));
    await exportAppDatabase(payload);
  };

  /** Restaura um payload exportado (backup/migração), validando a versão do schema. */
  const importData = (json: string) => {
    const db = importAppDatabase(json);
    if (!db) {
      showToast('ops, esse arquivo de backup não é compatível ♡');
      return;
    }
    applyDatabase(db);
    showToast('backup restaurado com carinho ♡');
  };

  /** Snapshot local (JSON do backup v2) para enviar na sincronização entre dispositivos. */
  const getSyncPayloadJson = useCallback(async () => {
    const payload = await buildBackupPayload(snapshotFromState({
      profile, courses, classes, tasks, exams, authors, concepts, approaches,
      readings, flashcards, materials, internshipLogs, tcc, stickers, sessions,
      streakData, reminder: reminderSettings, looseNotes, savedBookIds,
      bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions,
      onboarding, syncIndex,
    }));
    return JSON.stringify(payload);
  }, [profile, courses, classes, tasks, exams, authors, concepts, approaches,
    readings, flashcards, materials, internshipLogs, tcc, stickers, sessions,
    streakData, reminderSettings, looseNotes, savedBookIds,
    bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions, onboarding, syncIndex]);

  /** Aplica o banco mesclado pela sincronização (mesmo caminho do import). */
  const applySyncedDatabase = useCallback((db: ReturnType<typeof emptyDatabase>) => {
    applyDatabase(db);
  }, []);

  const APP_VERSION = '1.0.0';

  const resolveSyncEngine = useCallback((): SyncEngine | null => {
    if (!githubSyncConfig) return null;
    const provider = new GitHubSyncProvider({
      owner: githubSyncConfig.owner,
      repo: githubSyncConfig.repo,
      getToken: () => githubSyncConfig.token,
    });
    return new SyncEngine(provider, {
      deviceId,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      parseBackup: (json) => importAppDatabase(json),
      stringifyBackup: (db) => JSON.stringify(db),
    });
  }, [githubSyncConfig, deviceId]);

  const applyMerged = useCallback(
    (mergedJson: string, remoteManifest: SyncManifest, remoteSha: string) => {
      const db = importAppDatabase(mergedJson);
      if (db) applyDatabase(db);
      setSyncCheckpoint({
        baseRevision: remoteManifest.revision,
        baseBlobSha: remoteSha,
        lastSyncAt: new Date().toISOString(),
        lastDeviceId: deviceId,
        lastLocalMaxStamp: maxStamp(db?.syncIndex),
      });
    },
    [applyDatabase, deviceId],
  );

  const performSync = useCallback(
    async (interactive: boolean) => {
      const engine = resolveSyncEngine();
      if (!engine) {
        setSyncStatus('error');
        setSyncErrorMessage('configure a sincronização nas configurações ♡');
        return;
      }
      setSyncStatus('checking');
      setSyncErrorMessage(null);
      try {
        const { hasRemote, manifest } = await engine.inspect();
        const localJson = await getSyncPayloadJson();
        const localStamp = maxStamp(syncIndex);
        const cp = syncCheckpoint;
        if (hasRemote && manifest && manifest.revision > cp.baseRevision) {
          const { mergedJson, preview, remoteManifest, remoteSha } =
            await engine.pullAndMerge(localJson);
          if (interactive) {
            setPendingSyncPreview({ preview, mergedJson, remoteManifest, remoteSha });
            setSyncStatus('preview');
            return;
          }
          applyMerged(mergedJson, remoteManifest, remoteSha);
          showToast('sincronizado com carinho ♡');
          setSyncStatus('synced');
        } else if (engine.needsUpload(cp, localStamp) || !hasRemote) {
          const res = await engine.push(localJson, cp);
          setSyncCheckpoint(res.checkpoint);
          showToast('dados enviados para a nuvem ♡');
          setSyncStatus('synced');
        } else {
          setSyncStatus('upToDate');
        }
      } catch (e) {
        setSyncErrorMessage((e as Error).message);
        setSyncStatus('error');
      }
    },
    [resolveSyncEngine, getSyncPayloadJson, syncIndex, syncCheckpoint, applyMerged],
  );

  const syncNow = useCallback(() => performSync(true), [performSync]);
  const syncInBackground = useCallback(() => performSync(false), [performSync]);

  const configureGithubSync = useCallback(
    (cfg: { owner: string; repo: string; token: string }) => {
      setGithubSyncConfig(cfg);
      setTimeout(() => syncInBackground(), 0);
    },
    [syncInBackground],
  );
  const clearGithubSync = useCallback(() => {
    setGithubSyncConfig(null);
    setSyncStatus('idle');
    setPendingSyncPreview(null);
  }, []);
  const applySyncPreview = useCallback(() => {
    if (!pendingSyncPreview) return;
    applyMerged(
      pendingSyncPreview.mergedJson,
      pendingSyncPreview.remoteManifest,
      pendingSyncPreview.remoteSha,
    );
    setPendingSyncPreview(null);
    showToast('sincronizado com carinho ♡');
    setSyncStatus('synced');
  }, [pendingSyncPreview, applyMerged]);
  const discardSyncPreview = useCallback(() => {
    setPendingSyncPreview(null);
    setSyncStatus('upToDate');
  }, []);

  // Gatilhos de fundo: abrir, fechar, 30 min e ao recuperar conexão.
  useEffect(() => {
    if (!githubSyncConfig) return;
    const id = setInterval(() => syncInBackground(), 30 * 60 * 1000);
    const onOnline = () => syncInBackground();
    window.addEventListener('online', onOnline);
    const onBeforeUnload = () => {
      void syncInBackground();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const t = setTimeout(() => syncInBackground(), 1500);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('beforeunload', onBeforeUnload);
      clearTimeout(t);
    };
  }, [githubSyncConfig, syncInBackground]);

  // Stickers: reconcilia o catálogo com o progresso persistido (uma vez, ao iniciar)
  useEffect(() => {
    setStickers((prev) => mergeCatalogWithProgress(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Fatias coarse por domínio (PERF-001 A.3) ----------
  // Cada fatia é memoizada com as próprias referências de valor/setter (estáveis
  // desde `useStampedState`/`useSqliteState`): um novo objeto só nasce quando
  // aquele domínio muda, permitindo re-render seletivo nos consumidores pesados.
  const domainCourses = useMemo(
    () => ({
      courses,
      setCourses,
      setCoursesRaw,
      classes,
      setClasses,
      setClassesRaw,
      tasks,
      setTasks,
      setTasksRaw,
      exams,
      setExams,
      setExamsRaw,
      materials,
      setMaterials,
      setMaterialsRaw,
      bookmarkedCourseIds,
      setBookmarkedCourseIds,
      setBookmarkedCourseIdsRaw,
    }),
    [
      courses, setCourses, setCoursesRaw,
      classes, setClasses, setClassesRaw,
      tasks, setTasks, setTasksRaw,
      exams, setExams, setExamsRaw,
      materials, setMaterials, setMaterialsRaw,
      bookmarkedCourseIds, setBookmarkedCourseIds, setBookmarkedCourseIdsRaw,
    ]
  );

  const domainStudy = useMemo(
    () => ({
      sessions,
      setSessions,
      setSessionsRaw,
      readings,
      setReadings,
      setReadingsRaw,
      flashcards,
      setFlashcards,
      setFlashcardsRaw,
      streakData,
      setStreakData,
      setStreakDataRaw,
      quizSessions,
      setQuizSessions,
      setQuizSessionsRaw,
      techniques,
      setTechniques,
      setTechniquesRaw,
      questions,
      setQuestions,
    }),
    [
      sessions, setSessions, setSessionsRaw,
      readings, setReadings, setReadingsRaw,
      flashcards, setFlashcards, setFlashcardsRaw,
      streakData, setStreakData, setStreakDataRaw,
      quizSessions, setQuizSessions, setQuizSessionsRaw,
      techniques, setTechniques, setTechniquesRaw,
      questions, setQuestions,
    ]
  );

  const domainKnowledge = useMemo(
    () => ({
      authors,
      setAuthors,
      setAuthorsRaw,
      concepts,
      setConcepts,
      setConceptsRaw,
      approaches,
      setApproaches,
      savedBookIds,
      setSavedBookIds,
      setSavedBookIdsRaw,
      readingProgress,
      setReadingProgress,
      setReadingProgressRaw,
      looseNotes,
      setLooseNotes,
      setLooseNotesRaw,
    }),
    [
      authors, setAuthors, setAuthorsRaw,
      concepts, setConcepts, setConceptsRaw,
      approaches, setApproaches,
      savedBookIds, setSavedBookIds, setSavedBookIdsRaw,
      readingProgress, setReadingProgress, setReadingProgressRaw,
      looseNotes, setLooseNotes, setLooseNotesRaw,
    ]
  );

  const domainApp = useMemo(
    () => ({
      profile,
      setProfile,
      setProfileRaw,
      internshipLogs,
      setInternshipLogs,
      setInternshipLogsRaw,
      tcc,
      setTcc,
      setTccRaw,
      stickers,
      setStickers,
      setStickersRaw,
      reminderSettings,
      setReminderSettings,
      gcalEnabled,
      setGcalEnabledState,
      gcalMap,
      setGcalMap,
      onboarding,
      setOnboarding,
      workspaces,
      setWorkspaces,
      relations,
      setRelations,
      suggestions,
      setSuggestions,
      associationPolicies,
      setAssociationPolicies,
      projects,
      setProjects,
      outputs,
      setOutputs,
      toast,
      showToast,
      deviceId,
      syncCheckpoint,
      setSyncCheckpoint,
      githubSyncConfig,
      setGithubSyncConfig,
      syncStatus,
      setSyncStatus,
      syncErrorMessage,
      setSyncErrorMessage,
      pendingSyncPreview,
      setPendingSyncPreview,
      applyDatabase,
      resetApp,
      completeOnboarding,
      exportData,
      importData,
      getSyncPayloadJson,
      applySyncedDatabase,
      configureGithubSync,
      clearGithubSync,
      syncNow,
      syncInBackground,
      applySyncPreview,
      discardSyncPreview,
      dataClient,
    }),
    [
      profile, setProfile, setProfileRaw,
      internshipLogs, setInternshipLogs, setInternshipLogsRaw,
      tcc, setTcc, setTccRaw,
      stickers, setStickers, setStickersRaw,
      reminderSettings, setReminderSettings,
      gcalEnabled, setGcalEnabledState, gcalMap, setGcalMap,
      onboarding, setOnboarding,
      workspaces, setWorkspaces,
      relations, setRelations,
      suggestions, setSuggestions,
      associationPolicies, setAssociationPolicies,
      projects, setProjects,
      outputs, setOutputs,
      toast, showToast,
      deviceId,
      syncCheckpoint, setSyncCheckpoint,
      githubSyncConfig, setGithubSyncConfig,
      syncStatus, setSyncStatus,
      syncErrorMessage, setSyncErrorMessage,
      pendingSyncPreview, setPendingSyncPreview,
      applyDatabase, resetApp, completeOnboarding,
      exportData, importData, getSyncPayloadJson,
      applySyncedDatabase, configureGithubSync, clearGithubSync,
      syncNow, syncInBackground, applySyncPreview, discardSyncPreview,
      dataClient,
    ]
  );

  return {
    syncIndex,
    setSyncIndex,
    profile,
    setProfile,
    setProfileRaw,
    courses,
    setCourses,
    setCoursesRaw,
    classes,
    setClasses,
    setClassesRaw,
    tasks,
    setTasks,
    setTasksRaw,
    exams,
    setExams,
    setExamsRaw,
    authors,
    setAuthors,
    setAuthorsRaw,
    concepts,
    setConcepts,
    setConceptsRaw,
    approaches,
    setApproaches,
    readings,
setReadings,
     setReadingsRaw,
     flashcards,
     setFlashcards,
     setFlashcardsRaw,
     materials,
     setMaterials,
     setMaterialsRaw,
     internshipLogs,
     setInternshipLogs,
     setInternshipLogsRaw,
     tcc,
     setTcc,
     setTccRaw,
     stickers,
     setStickers,
     setStickersRaw,
     sessions,
     setSessions,
     setSessionsRaw,
     techniques,
     setTechniques,
      setTechniquesRaw,
      quizSessions,
     setQuizSessions,
     setQuizSessionsRaw,
questions,
      setQuestions,
      streakData,
      setStreakData,
      setStreakDataRaw,
      reminderSettings,
      setReminderSettings,
      gcalEnabled,
      setGcalEnabledState,
      gcalMap,
      setGcalMap,
      onboarding,
      setOnboarding,
      workspaces,
      setWorkspaces,
      relations,
      setRelations,
      suggestions,
      setSuggestions,
      associationPolicies,
      setAssociationPolicies,
      projects,
      setProjects,
      outputs,
      setOutputs,
      savedBookIds,
      setSavedBookIds,
      setSavedBookIdsRaw,
      readingProgress,
      setReadingProgress,
      setReadingProgressRaw,
      bookmarkedCourseIds,
      setBookmarkedCourseIds,
      setBookmarkedCourseIdsRaw,
      looseNotes,
      setLooseNotes,
      setLooseNotesRaw,
      toast,
      showToast,
      deviceId,
      syncCheckpoint,
      setSyncCheckpoint,
      githubSyncConfig,
      setGithubSyncConfig,
      syncStatus,
      setSyncStatus,
      syncErrorMessage,
      setSyncErrorMessage,
      pendingSyncPreview,
      setPendingSyncPreview,
      applyDatabase,
      resetApp,
      completeOnboarding,
      exportData,
      importData,
      getSyncPayloadJson,
      applySyncedDatabase,
      configureGithubSync,
      clearGithubSync,
      syncNow,
      syncInBackground,
      applySyncPreview,
      discardSyncPreview,
      dataClient,
      domainCourses,
      domainStudy,
      domainKnowledge,
      domainApp,
  };
}

export const DataClientContext = createContext<DataClientValue | undefined>(undefined);

export const DataClientCoursesContext = createContext<DataClientCoursesSlice | undefined>(undefined);
export const DataClientStudyContext = createContext<DataClientStudySlice | undefined>(undefined);
export const DataClientKnowledgeContext = createContext<DataClientKnowledgeSlice | undefined>(undefined);
export const DataClientAppContext = createContext<DataClientAppSlice | undefined>(undefined);

/** Lê o contexto canônico de dados (dono: DataClientProvider). Lança se usado fora do provider. */
export function useDataClientContext(): DataClientValue {
  const ctx = useContext(DataClientContext);
  if (!ctx) {
    throw new Error('useDataClientContext must be used within a DataClientProvider');
  }
  return ctx;
}

/** Fatia coarse "faculdade" (cursos/aulas/tarefas/provas/materiais/favoritos). */
export function useDataClientCourses(): DataClientCoursesSlice {
  const ctx = useContext(DataClientCoursesContext);
  if (!ctx) {
    throw new Error('useDataClientCourses must be used within a DataClientProvider');
  }
  return ctx;
}

/** Fatia coarse "estudos" (sessões/leituras/flashcards/streak/quiz/técnicas). */
export function useDataClientStudy(): DataClientStudySlice {
  const ctx = useContext(DataClientStudyContext);
  if (!ctx) {
    throw new Error('useDataClientStudy must be used within a DataClientProvider');
  }
  return ctx;
}

/** Fatia coarse "biblioteca/conhecimento" (autores/conceitos/abordagens/livros/notas). */
export function useDataClientKnowledge(): DataClientKnowledgeSlice {
  const ctx = useContext(DataClientKnowledgeContext);
  if (!ctx) {
    throw new Error('useDataClientKnowledge must be used within a DataClientProvider');
  }
  return ctx;
}

/** Fatia coarse "app/perfil/sync" (perfil, stickers, TCC, agenda, workspaces, backup). */
export function useDataClientApp(): DataClientAppSlice {
  const ctx = useContext(DataClientAppContext);
  if (!ctx) {
    throw new Error('useDataClientApp must be used within a DataClientProvider');
  }
  return ctx;
}

export function DataClientProvider({ children }: { children: React.ReactNode }) {
  const data = useDataClient();
  return (
    <DataClientContext.Provider value={data}>
      <DataClientCoursesContext.Provider value={data.domainCourses}>
        <DataClientStudyContext.Provider value={data.domainStudy}>
          <DataClientKnowledgeContext.Provider value={data.domainKnowledge}>
            <DataClientAppContext.Provider value={data.domainApp}>
              {children}
            </DataClientAppContext.Provider>
          </DataClientKnowledgeContext.Provider>
        </DataClientStudyContext.Provider>
      </DataClientCoursesContext.Provider>
    </DataClientContext.Provider>
  );
}
