/**
 * Centralized UI copy and shared visual constants for the cecistudy app.
 * All strings in pt-BR, lowercase, warm tone (copy-and-voice.md).
 */
import type { WeekDayStatus } from './streak';

// ---------------------------------------------------------------------------
// Shared visual constants
// ---------------------------------------------------------------------------

/** Week cell styles for streak calendars (HomeView + EstudosView). */
export const WEEK_CELL_STYLE: Record<WeekDayStatus, string> = {
  done: 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong',
  today: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand ring-2 ring-rose-300/50',
  upcoming: 'bg-surface-default text-ceci-tertiary border-ceci-border-default',
  weekend: 'bg-surface-muted text-ceci-faded border-ceci-border-subtle',
};

// ---------------------------------------------------------------------------
// Toast messages (shared across files)
// ---------------------------------------------------------------------------

export const TOAST = {
  /** Shown when a course needs to be registered before proceeding. */
  courseRegistered: 'cadastre a matéria — quando voltar, ela aparece aqui ♡',
  /** Author saved successfully. */
  authorSaved: 'autor guardado no cantinho ♡',
  /** Sync completed. */
  synced: 'sincronizado com carinho ♡',
} as const;

// ---------------------------------------------------------------------------
// Section headings
// ---------------------------------------------------------------------------

export const HEADING = {
  // Home
  homeAttention: 'sua atenção hoje',
  homeRhythm: 'seu ritmo',
  homeAction: 'bora cuidar disso?',

  // Faculdade
  faculdadeTitle: 'faculdade',
  faculdadeWeek: 'minha semana',
  faculdadeGrid: 'grade de disciplinas',
  faculdadeInternship: 'diário de estágio',
  faculdadeInternshipPreview: 'próximos e últimos estágios',
  faculdadeCalendar: 'sua semana acadêmica',

  // Estudos
  estudosTitle: 'estudos',
  estudosNow: 'pra agora',
  estudosReading: 'leitura',
  estudosDrill: 'treinar & concluir',
  estudosQuiz: 'quiz de questões',
  estudosTcc: 'meu tcc',
  estudosRhythm: 'seu ritmo',

  // Biblioteca
  bibliotecaTitle: 'biblioteca & repertório',
  bibliotecaCollections: 'minhas coleções ♡',
  bibliotecaMaterials: 'meus materiais',
  bibliotecaNotes: 'suas notas',
  bibliotecaReading: 'continuar lendo',
  bibliotecaSaved: 'salvos pra depois',
  bibliotecaExplore: 'explorar o acervo',
  bibliotecaReadingRecs: 'repertório & leituras recomendadas',
  bibliotecaPsychotherapy: 'catálogo de psicoterapias',
  bibliotecaMixed: 'categorias mistas',
  bibliotecaTests: 'testes, escalas & avaliação clínica',
  bibliotecaAuthors: 'autores & grandes obras',
  bibliotecaConcepts: 'conceitos-chave & fichamentos',
  bibliotecaApproaches: 'abordagens & correntes da psicologia',
  bibliotecaComplementary: 'bagagem complementar & visão expandida',
  bibliotecaArticles: 'artigos científicos',

  // Perfil
  perfilTitle: 'meu espaço',
  perfilJourney: 'resumo da minha jornada',
  perfilJourneyDesc: 'do começo aos revisados',
  perfilTimeline: 'linha do tempo da minha graduação',
  perfilStickers: 'stickers & conquistas',
  perfilPersonalize: 'personalize seu cantinho',
  perfilData: 'seus dados',
  perfilOta: 'atualização do app',
} as const;

// ---------------------------------------------------------------------------
// Empty state messages
// ---------------------------------------------------------------------------

export const EMPTY = {
  homeNoClasses: 'hoje não tem aula — dia livre para o cantinho ♡',
  homeNoUrgent: 'nada urgente por aqui ✨',
  homeFreeDay: 'dia livre! que tal adiantar uma revisão ou uma leitura?',
  homeCardsInDay: 'cartões em dia ♡',

  faculdadeNoClassesWeekday: (weekday: string) => `sem aulas de ${weekday}`,
  faculdadeLightWeek: 'essa semana está leve.',
  faculdadeNextClass: (weekday: string, date: string) => `a próxima é ${weekday} (${date}).`,
  faculdadeEmptyDay: 'nada anotado neste dia ♡',
  faculdadeNoInternship: 'ainda não tem registro de estágio — que tal anotar o primeiro? ♡',
  faculdadeNoEvents: 'sem eventos próximos anotados. que tal registrar uma prova ou tarefa?',

  estudosNoReadings: 'nenhuma leitura em andamento',
  estudosStartBook: 'que tal começar um livro ou artigo?',
  estudosFirstCard: 'crie seu primeiro cartão',
  estudosCardsOk: 'cartões em dia ♡',

  bibliotecaNoResults: 'nenhuma coleção ou obra encontrada',
  bibliotecaFilterEmpty: 'nenhum resultado com esses filtros. que tal afrouxar um pouco?',
  bibliotecaSavedEmpty: 'salve obras do acervo ♡ elas aparecem aqui, pertinho de você.',
  bibliotecaComparisonNotFound: 'comparação não encontrada ♡',
  bibliotecaLoadingComparison: 'carregando comparação…',
} as const;

// ---------------------------------------------------------------------------
// Body / descriptive text
// ---------------------------------------------------------------------------

export const BODY = {
  estudosTimerDesc: 'timer em tela cheia, sem distrações',
  bibliotecaNotesDesc: 'anotações rápidas e pensamentos avulsos guardados no app',
  perfilJourneyNote: 'tudo anotado com carinho ao longo dos semestres, reunido aqui ♡',
  perfilTimelineNote: 'acompanhando a caminhada desde o primeiro dia até a formação clínica.',
  perfilStickersNote: 'celebrando cada passo do cantinho ♡',
  perfilBackupNote: 'tudo fica guardado só no seu dispositivo. faça um backup para migrar ou comece de novo quando quiser ♡',
  perfilClosing: 'tudo aqui nasce do que você anota, com carinho ♡',
  otaDescription: 'mudanças de interface chegam direto pelo cantinho; mudanças nativas precisam de atualização pela loja.',
} as const;

// ---------------------------------------------------------------------------
// Button labels / CTAs
// ---------------------------------------------------------------------------

export const BUTTON = {
  focusNow: 'bora focar?',
  review: 'revisar',
  add: 'adicionar',
  seeAll: 'ver todas',
  seeAchievements: 'ver conquistas',
  saveSettings: 'guardar configurações do cantinho',
  exportBackup: 'exportar backup',
  importBackup: 'importar backup',
  resetApp: 'resetar cantinho',
  cancel: 'cancelar',
  confirm: 'confirmar',
  syncDevices: 'sincronizar entre dispositivos',
  checkUpdate: 'verificar atualização',
  applyNow: 'aplicar agora',
  filters: 'filtros',
  clearFilters: 'esquecer filtros',
  newFlashcard: 'novo flashcard',
  newCourse: 'nova matéria',
  internsipAction: 'anotar ou agendar um estágio',
} as const;

// ---------------------------------------------------------------------------
// Sub-tab labels
// ---------------------------------------------------------------------------

export const SUBTAB = {
  courses: 'disciplinas',
  calendar: 'calendário',
  internship: 'estágio',
} as const;

// ---------------------------------------------------------------------------
// Badge / inline labels
// ---------------------------------------------------------------------------

export const BADGE = {
  required: 'obrig.',
  complementary: 'compl.',
  bookFallback: 'livro',
  classBadge: 'aula',
  examBadge: 'prova',
  priorityHigh: 'alta',
  extras: 'bagagem extra',
  filtersApplied: 'filtros aplicados:',
  category: 'categoria:',
  status: 'status:',
  tag: 'tag:',
  hourLabel: 'horário:',
  everyNight: 'todas as noites',
  namePlaceholder: 'seu nome',
  semesterLabel: 'semestre atual',
  universityLabel: 'universidade',
  quotePlaceholder: 'frase motivacional de entrada',
  cecinhoTip: 'dica do cecinho ✨',
  semester: 'semestre',
  inProgress: 'em andamento',
  completed: 'concluído',
  awaiting: 'aguardando',
  journeyReflection: 'reflexão de jornada:',
} as const;
