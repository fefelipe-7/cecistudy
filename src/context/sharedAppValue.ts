import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Exam, Task } from '../types';
import type { Workspace } from '../core/domain';
import { DEFAULT_WORKSPACE_ID } from '../data/schema';
import type { DataClientValue, ReminderSettings } from './DataClientProvider';
import { useDataActions, type DataActions, type DataActionGroups } from './dataActions';
import { useWorkspaceActions, type WorkspaceActions } from './workspaceActions';
import { computeStreak, getWeekProgress, isStudyDay, toDateKey } from '../lib/streak';
import type { StreakStats, WeekDayCell } from '../lib/streak';
import { applyStickerUnlocks, countUnlocked, mergeCatalogWithProgress } from '../lib/stickers';
import { celebrate } from '../lib/celebrate';
import { hapticSuccess } from '../lib/haptics';
import { storage } from '../lib/storage';
import {
  cancelClassReminders,
  cancelDailyReminder,
  scheduleDailyReminder,
  syncClassReminders,
} from '../lib/notifications';
import { connectGcal, disconnectGcal, syncExam, syncTask, unsyncEvent } from '../lib/gcal';

/**
 * Valor compartilhado entre as cascas (spec 07): o que independe da navegação
 * por app — dados (DataClient) + workspace ativo + streak + stickers + handlers
 * comuns (bookmark, lembrete, agenda Google, livros salvos) + as camadas de
 * ações (`useDataActions`/`useWorkspaceActions`). Os providers de cada plataforma
 * consomem este hook + o motor de navegação para montar o `AppContextValue`.
 */
export interface SharedAppValue {
  data: DataClientValue;
  currentWorkspaceId: string;
  currentWorkspace: Workspace;
  streakStats: StreakStats;
  currentWeekProgress: WeekDayCell[];
  toggleBookmarkCourse: (courseId: string) => void;
  registerActivity: () => void;
  updateReminder: (settings: ReminderSettings) => void;
  setGcalEnabled: (on: boolean) => Promise<boolean>;
  gcalSyncExam: (exam: Exam, op: 'upsert' | 'delete') => Promise<void>;
  gcalSyncTask: (task: Task, op: 'upsert' | 'delete') => Promise<void>;
  toggleSaveBook: (bookId: string) => void;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  dataActions: DataActions & DataActionGroups;
  workspaceActions: WorkspaceActions;
}

export function useSharedAppValue(data: DataClientValue): SharedAppValue {
  const {
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
    profile,
    setProfile,
    courses,
    setCourses,
    classes,
    setClasses,
    tasks,
    setTasks,
    exams,
    setExams,
    authors,
    setAuthors,
    concepts,
    setConcepts,
    readings,
    setReadings,
    flashcards,
    setFlashcards,
    materials,
    setMaterials,
    internshipLogs,
    setInternshipLogs,
    sessions,
    setSessions,
    quizSessions,
    setQuizSessions,
    techniques,
    setTechniques,
    questions,
    stickers,
    setStickers,
    tcc,
    setTcc,
    savedBookIds,
    setSavedBookIds,
    readingProgress,
    setReadingProgress,
    looseNotes,
    setLooseNotes,
    streakData,
    setStreakData,
    reminderSettings,
    setReminderSettings,
    gcalEnabled,
    setGcalEnabledState,
    gcalMap,
    setGcalMap,
    setBookmarkedCourseIds,
    showToast,
  } = data;

  // ---------- Sincronização com a nuvem (GitHub provider) ----------

  // workspace ativo (compartilhado): tagueia os registros de domínio. No desktop,
  // a sessão visual espelha esse ponteiro (session.activeWorkspaceId) para fins de UI.
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(
    workspaces[0]?.id ?? DEFAULT_WORKSPACE_ID,
  );
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  // Streak — derivados (a data é calculada uma vez por sessão; o app entende
  // "qual dia é" por aqui). Memoizados: só recomputam quando os dias ativos mudam.
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const streakStats = useMemo(
    () => computeStreak(streakData.activeDays, todayKey),
    [streakData.activeDays, todayKey]
  );
  const currentWeekProgress = useMemo(
    () => getWeekProgress(streakData.activeDays, todayKey),
    [streakData.activeDays, todayKey]
  );

  // Stickers: reconcilia o catálogo com o progresso persistido (uma vez, ao iniciar)
  useEffect(() => {
    setStickers((prev) => mergeCatalogWithProgress(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Janela de boot: enquanto o app "acorda" (hidratação assíncrona no nativo), conquistas
  // desbloqueadas por reconhecimento do estado persistido são aplicadas em silêncio —
  // só celebramos (confete/vibração/toast) desbloqueios que acontecem em sessão.
  const bootWindowRef = useRef(true);
  useEffect(() => {
    const t = window.setTimeout(() => {
      bootWindowRef.current = false;
    }, 2500);
    return () => window.clearTimeout(t);
  }, []);

  // Stickers: avalia desbloqueios (conquistas) quando o estado de estudo muda.
  // `applyStickerUnlocks` devolve a mesma referência quando nada muda — sem loop.
  useEffect(() => {
    const state = {
      profile,
      readings,
      flashcards,
      sessions,
      classes,
      tasks,
      exams,
      authors,
      materials,
      courses,
      questions,
      techniques,
      internshipLogs,
      currentStreak: streakStats.current,
      streakTotal: streakStats.total,
      streakLongest: streakStats.longest,
      tcc,
      savedBookIds,
      concepts,
      looseNotes,
    };
    const { updated, newlyUnlocked } = applyStickerUnlocks(stickers, state, todayKey);
    const hasRealNewUnlock = newlyUnlocked.some((item) => !stickers.some((existing) => existing.id === item.id && existing.unlocked));
    if (newlyUnlocked.length > 0 && hasRealNewUnlock) {
      setStickers(updated);
      setProfile((p) => ({
        ...p,
        stickersCollected: countUnlocked(updated),
      }));
      if (!bootWindowRef.current) {
        celebrate('sticker-unlocked');
        hapticSuccess();
        showToast(
          `conquista desbloqueada: ${newlyUnlocked[0].emoji} ${newlyUnlocked[0].name} ♡`
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stickers,
    profile,
    readings,
    flashcards,
    sessions,
    classes,
    tasks,
    exams,
    authors,
    materials,
    courses,
    questions,
    techniques,
    internshipLogs,
    streakStats.current,
    streakStats.total,
    streakStats.longest,
    tcc,
    savedBookIds,
    concepts,
    looseNotes,
    todayKey,
  ]);

  // Limpeza pontual: remove as chaves órfãs do recurso de humor removido (uma vez, ao iniciar)
  useEffect(() => {
    void storage.remove('currentMood');
    void storage.remove('moodHistory');
  }, []);

  const toggleBookmarkCourse = useCallback((courseId: string) => {
    setBookmarkedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }, []);

  // Handlers
  /** Registra "hoje" como dia ativo na streak (só em dia útil; idempotente). */
  const registerActivity = useCallback(() => {
    const key = toDateKey(new Date());
    if (!isStudyDay(key)) return;
    setStreakData((prev) =>
      prev.activeDays.includes(key) ? prev : { activeDays: [...prev.activeDays, key] }
    );
  }, []);

  const updateReminder = useCallback(
    (settings: ReminderSettings) => {
      setReminderSettings(settings);
      if (settings.enabled) {
        void scheduleDailyReminder(settings.time).then((scheduled) => {
          if (scheduled) hapticSuccess();
        });
        void syncClassReminders(courses);
      } else {
        void cancelDailyReminder();
        void cancelClassReminders();
      }
    },
    [courses, setReminderSettings]
  );

  // mantém os lembretes de aula em dia quando o horário das matérias muda
  useEffect(() => {
    if (reminderSettings.enabled) void syncClassReminders(courses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const setGcalEnabled = useCallback(
    async (on: boolean) => {
      if (on) {
        const ok = await connectGcal();
        setGcalEnabledState(ok);
        if (!ok) {
          showToast('configura o client id do google para usar a agenda ♡');
        }
        return ok;
      }
      disconnectGcal();
      setGcalEnabledState(false);
      return false;
    },
    [setGcalEnabledState, showToast]
  );

  const gcalSyncExam = useCallback(
    async (exam: Exam, op: 'upsert' | 'delete') => {
      if (!gcalEnabled) return;
      try {
        if (op === 'upsert') {
          const gid = await syncExam(exam, courses);
          if (gid) setGcalMap((m) => ({ ...m, [`exam-${exam.id}`]: gid }));
        } else {
          const gid = gcalMap[`exam-${exam.id}`];
          if (gid) {
            await unsyncEvent(gid);
            setGcalMap((m) => {
              const next = { ...m };
              delete next[`exam-${exam.id}`];
              return next;
            });
          }
        }
      } catch {
        /* falha silenciosa: a agenda é um espelho opcional */
      }
    },
    [gcalEnabled, courses, gcalMap, setGcalMap]
  );

  const gcalSyncTask = useCallback(
    async (task: Task, op: 'upsert' | 'delete') => {
      if (!gcalEnabled) return;
      try {
        if (op === 'upsert') {
          const gid = await syncTask(task, courses);
          if (gid) setGcalMap((m) => ({ ...m, [`task-${task.id}`]: gid }));
        } else {
          const gid = gcalMap[`task-${task.id}`];
          if (gid) {
            await unsyncEvent(gid);
            setGcalMap((m) => {
              const next = { ...m };
              delete next[`task-${task.id}`];
              return next;
            });
          }
        }
      } catch {
        /* falha silenciosa */
      }
    },
    [gcalEnabled, courses, gcalMap, setGcalMap]
  );

  const toggleSaveBook = useCallback((bookId: string) => {
    setSavedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  }, []);

  const updateReadingProgress = useCallback((bookId: string, readPages: number) => {
    setReadingProgress((prev) => ({ ...prev, [bookId]: Math.max(0, Math.floor(readPages)) }));
  }, []);

  const dataActions = useDataActions({
    tasks,
    readings,
    exams,
    courses,
    concepts,
    authors,
    profile,
    currentWorkspaceId,
    setTasks,
    setClasses,
    setLooseNotes,
    setExams,
    setConcepts,
    setMaterials,
    setReadings,
    setFlashcards,
    setInternshipLogs,
    setCourses,
    setAuthors,
    setSessions,
    setQuizSessions,
    setTechniques,
    setProfile,
    setTcc,
    registerActivity,
    showToast,
    gcalSyncTask,
    gcalSyncExam,
  });

  const workspaceActions = useWorkspaceActions({
    currentWorkspaceId,
    workspaces,
    relations,
    associationPolicies,
    projects,
    setWorkspaces,
    setCurrentWorkspaceId,
    setRelations,
    setAssociationPolicies,
    setSuggestions,
    setProjects,
    setOutputs,
    showToast,
  });

  return useMemo(
    () => ({
      data,
      currentWorkspaceId,
      currentWorkspace,
      streakStats,
      currentWeekProgress,
      toggleBookmarkCourse,
      registerActivity,
      updateReminder,
      setGcalEnabled,
      gcalSyncExam,
      gcalSyncTask,
      toggleSaveBook,
      updateReadingProgress,
      dataActions,
      workspaceActions,
    }),
    [
      data,
      currentWorkspaceId,
      currentWorkspace,
      streakStats,
      currentWeekProgress,
      toggleBookmarkCourse,
      registerActivity,
      updateReminder,
      setGcalEnabled,
      gcalSyncExam,
      gcalSyncTask,
      toggleSaveBook,
      updateReadingProgress,
      dataActions,
      workspaceActions,
    ]
  );
}