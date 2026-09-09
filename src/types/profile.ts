// Domínio: perfil, streak, stickers, TCC e sincronização (MOD-001 / B.3).

export interface UserProfile {
  /** Escopo de workspace (Fase 3). Perfil é por workspace. */
  workspaceId?: string;
  name: string;
  semester: number;
  totalSemesters: number;
  university: string;
  targetCareer: string;
  dailyQuote: string;
  stickersCollected: number;
  /** Foto de perfil (data URL). Vazia quando não definida. */
  photoUrl?: string;
}

export interface StreakData {
  /** Dias (YYYY-MM-DD, fuso local) em que houve pelo menos uma ação de estudo que conta. */
  activeDays: string[];
}

export interface Sticker {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'faculdade' | 'estudo' | 'leituras' | 'jornada';
  /** Condição de desbloqueio (lida do catálogo em `src/data/stickerCatalog.ts`). */
  condition?: StickerCondition;
}

/** Regra de desbloqueio de um sticker (conquista), avaliada contra o estado do app. */
export type StickerCondition =
  | { type: 'reading-done' }
  | { type: 'profile-set' }
  | { type: 'flashcards-reviewed'; min: number }
  | { type: 'internship-first' }
  | { type: 'streak'; min: number }
  | { type: 'degree-half' }
  | { type: 'concepts-with-authors'; min: number }
  | { type: 'tcc-done' }
  | { type: 'sessions'; min: number }
  | { type: 'class-notes'; min: number }
  | { type: 'pages-read'; min: number }
  | { type: 'tasks-done'; min: number }
  | { type: 'saved-books'; min: number }
  | { type: 'exams-added'; min: number }
  | { type: 'exams-done'; min: number }
  | { type: 'concepts-known'; min: number }
  | { type: 'authors-known'; min: number }
  | { type: 'materials-added'; min: number }
  | { type: 'courses'; min: number }
  | { type: 'flashcards-count'; min: number }
  | { type: 'questions-created'; min: number }
  | { type: 'techniques-used'; min: number }
  | { type: 'study-minutes'; min: number }
  | { type: 'streak-total'; min: number }
  | { type: 'streak-longest'; min: number }
  | { type: 'reading-count'; min: number }
  | { type: 'reading-in-progress'; min: number }
  | { type: 'loose-notes'; min: number }
  | { type: 'internship-hours'; min: number }
  | { type: 'internship-logs'; min: number }
  | { type: 'tcc-created' }
  | { type: 'tcc-chapters-done'; min: number }
  | { type: 'penultimate-semester' }
  | { type: 'graduation' }
  | { type: 'streak-week'; min: number }
  | { type: 'streak-month'; min: number }
  | { type: 'flashcard-streak' }
  | { type: 'questions-mastered'; min: number }
  | { type: 'techniques-explored'; min: number };

export interface TccData {
  /** Escopo de workspace (Fase 3). TccData é singleton por workspace. */
  workspaceId?: string;
  title: string;
  advisor: string;
  field: string;
  problemStatement: string;
  objectives: string[];
  status: 'em_andamento' | 'revisao' | 'concluido';
  chapters: {
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
  references: string[];
}

/** Estado de onboarding (primeiro acesso). */
export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
}

/**
 * Índice de sincronização entre dispositivos (pareamento P2P).
 *
 * Os timestamps de alteração NÃO vivem nas entidades — vivem aqui, num mapa
 * paralelo mantido automaticamente pela camada de persistência
 * (`useStampedState`). Isso evita tocar em ~20 interfaces e mantém o formato
 * dos backups compatível (o índice viaja junto como campo opcional).
 *
 * - `stamps`: última alteração por coleção (LWW para valores únicos, ex.: profile).
 * - `records`: última alteração por registro (`[coleção][id]`), para merge LWW por item.
 * - `tombstones`: deleções propagáveis (`[coleção][id]`) — impedem que um registro
 *   apagado num dispositivo "ressuscite" vindo do outro.
 */
export interface SyncIndex {
  stamps: Record<string, number>;
  records: Record<string, Record<string, number>>;
  tombstones: Record<string, Record<string, number>>;
}
