import type { ComponentType, ReactNode } from 'react';

export type NavTab = 'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil';

/** Seções do templo de conhecimento acessíveis pela pilha (`#/biblioteca/templo/<slug>`). */
export type TempleSection = 'conceitos' | 'autores' | 'tecnicas';

export const TEMPLE_SECTION_SLUGS: Record<TempleSection, string> = {
  conceitos: 'conceitos',
  autores: 'autores',
  tecnicas: 'tecnicas',
};

export type SubTabFaculdade = 'disciplinas' | 'calendario';
export type SubTabEstudos = 'sessoes' | 'leituras' | 'flashcards' | 'questoes' | 'historico';

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
  | { kind: 'notes' }
  | { kind: 'temple' }
  /** Seção interna do templo (`#/biblioteca/templo/<slug>`), empilhada sobre o templo. */
  | { kind: 'templeSection'; section: TempleSection }
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
  | { kind: 'quiz-category' }
  | { kind: 'quiz-loading'; config: QuizConfig }
  | { kind: 'quiz-play'; state: QuizPlayState }
  | { kind: 'quiz-result'; answers: QuizAnswer[]; config: QuizConfig; startTime: number; correctCount: number; totalCount: number; pool: StudyQuestion[] }
  /** Sincronização entre dispositivos (pareamento P2P), empilhada sobre o perfil. */
  | { kind: 'sync' }
  /** Telas dedicadas do estudo (empurradas sobre a aba estudos pelo feed). */
  | { kind: 'study'; screen: StudyScreen };

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

export interface HeaderAction {
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
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

export interface DynamicHeaderConfig {
  type?: 'default' | 'detail' | 'custom';
  title?: string;
  subtitle?: string;
  code?: string;
  badge?: string;
  badgeColor?: string;
  icon?: CourseIconName;
  color?: string;
  onBack?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  rightActions?: ReactNode;
  /** Menu de ações contextuais renderizado no lado direito do header (padrão de telas auxiliares). */
  actions?: HeaderAction[];
}

export interface Task {
  id: string;
  title: string;
  disciplineId?: string;
  classId?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'alta' | 'media' | 'baixa';
  category: 'leitura' | 'trabalho' | 'revisao' | 'estagio' | 'outro';
}

export interface CourseScheduleSlot {
  /** Dia da semana: 0=domingo … 6=sábado (mesma convenção de Date.getDay()). */
  day: number;
  /** Hora de início no formato HH:MM. */
  start: string;
  /** Hora de término opcional no formato HH:MM. */
  end?: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  professor: string;
  semester: string; // e.g. "6º Semestre"
  /** Horários estruturados da disciplina (dias da semana + início/término). */
  schedule: CourseScheduleSlot[];
  room?: string;
  category?: 'obrigatoria' | 'complementar';
  color: string; // hex code or style class
  icon: string; // Lucide icon name
  /** Média mínima para aprovação (0-10, ex.: 7). Fallback de exibição: 7. */
  minGrade?: number;
  description?: string;
  /** Atendimento & monitoria (ex.: "quartas, 14h - 15h30, sala dos professores"). */
  officeHours?: string;
  /** Frequência registrada (ex.: presenças totais). */
  attendance?: { attended: number; total: number };
}

export interface ClassNote {
  id: string;
  courseId: string;
  title: string;
  number: number;
  date: string;
  summary: string;
  fullNotes?: string;
  conceptIds?: string[];
  authorIds?: string[];
  approachIds?: string[];
  materials?: string[];
  hasQuestions?: boolean;
  /** Avaliação da aula de 1 a 5 estrelas (opcional — preenchida no wizard de detalhes). */
  rating?: number;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string;
  weight: string; // e.g. "40% da nota"
  /** Peso numérico (0-100) — derivável para breakdowns (ex.: 35). */
  weightValue?: number;
  topics: string[];
  completed: boolean;
  grade?: number;
}

export interface StudySession {
  id: string;
  courseId?: string;
  topic: string;
  date: string;
  durationMinutes: number;
  notes?: string;
}

/** Configuração de um quiz (filtros escolhidos pelo usuário). */
export interface QuizConfig {
  areas: string[];                    // ex: ["Psicologia Clínica", "Psicopatologia"]
  temas: string[];                    // ex: ["luto", "memória"]
  escolas: string[];                  // ex: ["Psicanálise", "TCC"]
  dificuldades: ('basica' | 'intermediaria' | 'avancada')[];
  count: number;                      // 5, 10, 15, 20
}

/** Resposta do usuário a uma questão no quiz. */
export interface QuizAnswer {
  questionId: string;
  userAnswer: string;                 // letra: "A" | "B" | "C" | "D" | "E"
  correct: boolean;
  timeMs: number;                     // tempo gasto nesta questão
  question: StudyQuestion;            // snapshot da questão para revisão
  explanation?: string;               // explicação da questão (para revisão)
}

/** Sessão de quiz persistida (histórico rico). */
export interface QuizSession {
  id: string;                         // qs-<timestamp>
  config: QuizConfig;
  answers: QuizAnswer[];
  startedAt: number;                  // epoch ms
  finishedAt: number;                 // epoch ms
  totalTimeMs: number;
  correctCount: number;
  totalCount: number;
  scorePct: number;                   // 0-100
  createdAt: string;                  // YYYY-MM-DD
}

/** Estado de navegação do quiz (passado via stack, não URL). */
export interface QuizPlayState {
  pool: StudyQuestion[];
  config: QuizConfig;
  answers: QuizAnswer[];
  currentIdx: number;
  startTime: number;
  questionStartTime: number;          // epoch ms da questão atual
}

export interface ReadingChapter {
  id: string;
  title: string;
  body: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  courseId?: string;
  type: 'livro' | 'artigo' | 'capitulo' | 'pdf';
  totalPages?: number;
  readPages?: number;
  status: 'nao_iniciado' | 'lendo' | 'concluido';
  highlights?: string[];
  /** Conteúdo real do leitor — capítulos/anotações da própria usuária (livros completos não são embutidos). */
  chapters?: ReadingChapter[];
}

export interface Flashcard {
  id: string;
  conceptId?: string;
  courseId?: string;
  question: string;
  answer: string;
  lastReviewed?: string;
  easeFactor?: number;
  timesReviewed?: number;
}

export interface PsychologyConcept {
  id: string;
  name: string;
  definition: string;
  approachId?: string; // TCC, Psicanálise, etc.
  authorIds: string[];
  courseIds: string[];
  tags: string[];
}

export interface PsychologyAuthor {
  id: string;
  name: string;
  bio: string;
  lifespan?: string;
  approachId?: string;
  keyConcepts: string[];
  majorWorks: string[];
  imageUrl?: string;
}

export interface PsychologyApproach {
  id: string;
  name: string;
  shortName: string;
  description: string;
  foundingAuthors: string[];
  color: string;
  
  // Extended fields for detailed approach view
  family?: string; // Família da abordagem
  historicalPeriod?: string; // Período de surgimento
  tags?: string[]; // Tags para categorização
  summary?: string; // Uma frase-resumo
  
  // Conteúdo detalhado conforme solicitado
  definition?: string; // O que é? (2-4 parágrafos)
  centralIdea?: string; // Ideia central (seção destacada)
  humanUnderstanding?: string; // Como entende a pessoa?
  sufferingUnderstanding?: string; // Como entende o sofrimento?
  changeMechanism?: string; // Como acontece a mudança?
  practicePresentation?: string; // Como se apresenta na prática?
  therapistObservation?: string; // O que o terapeuta procura observar?
  
  // Campos para seções adicionais
  academicView?: {
    historicalPosition?: string;
    currentState?: string;
    evidence?: string;
    debates?: string;
    limitations?: string;
  };
  
  fundamentalBooks?: Array<{
    title: string;
    author: string;
    year: string;
    importance: string;
    content: string;
    centralIdeas: string;
    reasonToRead: string;
  }>;
  
  criticismsAndControversies?: string;
  applications?: string; // Onde é mais utilizada
  relationsWithOtherApproaches?: {
    similar?: string[];
    influences?: string[];
    contrasts?: string[];
  };
  
  // Relacionamentos existentes (manter compatibilidade)
  conceptIds?: string[];
  techniqueIds?: string[];
  authorIds?: string[];

  /** Família de psicoterapia (id `fam-XX` do catálogo base de psicoterapias). */
  familyId?: string;
  /**
   * Campos crus (22) extraídos das entregas de psicoterapias — usados na página
   * de leitura da abordagem. Chaves = nomes dos campos do material (kebab-case).
   */
  detail?: Partial<Record<PsicoterapiaFieldKey, string>>;
}

/** Nomes dos 22 campos das entregas de psicoterapias (mapa `detail`). */
export type PsicoterapiaFieldKey =
  | 'descricao_curta'
  | 'definicao'
  | 'ideia_central'
  | 'origem'
  | 'periodo_historico'
  | 'contexto_historico'
  | 'visao_ser_humano'
  | 'visao_psique'
  | 'visao_desenvolvimento'
  | 'visao_sofrimento'
  | 'teoria_da_mudanca'
  | 'apresentacao_pratica'
  | 'papel_terapeuta'
  | 'papel_paciente'
  | 'relacao_terapeutica'
  | 'foco_clinico'
  | 'perspectiva_academica'
  | 'evidencias'
  | 'debates'
  | 'criticas_limitacoes'
  | 'leituras_fundamentais';

/** Família de psicoterapia do catálogo base (nome, descrição e cor). */
export interface PsicoterapiaFamily {
  id: string; // `fam-XX` (ordem de exibição)
  order: number;
  name: string;
  description: string;
  color: string;
  approachCount: number;
}

export interface MaterialItem {
  id: string;
  title: string;
  type: 'artigo' | 'livro' | 'pdf' | 'link' | 'slides';
  author: string;
  courseId?: string;
  url?: string;
  tags: string[];
  addedAt: string;
}

/** Tipos de registro do estágio (clínica escola / campo). */
export type InternshipLogType =
  | 'estagio'
  | 'atendimento_clinico'
  | 'supervisao'
  | 'intervisao'
  | 'outro';

/** Fase do ciclo de formação de um registro de estágio (Estágio 2.0). */
export type InternshipPhase =
  | 'preparar'
  | 'registrar'
  | 'refletir'
  | 'supervisionar'
  | 'entregar';

export interface InternshipLog {
  id: string;
  /** Tipo do registro (default `'estagio'` para dados antigos). */
  type: InternshipLogType;
  date: string;
  hours: number;
  /** Resumo curto do registro — usado como título/evento. */
  activity: string;
  reflections: string;
  /** Fase do ciclo de formação (Estágio 2.0). Opcional p/ retroativos. */
  phase?: InternshipPhase;
  /** Checklist de preparação para o campo (Estágio 2.0). */
  prepChecklist?: string[];
  conceptIds?: string[];

  // ---- atendimento clínico ----
  /** Iniciais anônimas do(a) paciente (sem nome completo). */
  patient?: string;
  /** Número da sessão do atendimento. */
  sessionNumber?: number;
  patientAge?: string;
  /** Tema central / queixa / demanda da sessão. */
  theme?: string;
  /** Abordagem teórica usada (ex.: TCC, psicanálise). */
  approach?: string;
  /** O que foi feito na sessão (intervenções, técnicas). */
  interventionNotes?: string;
  /** Impressões clínicas / observações. */
  observations?: string;

  // ---- supervisão / intervisão ----
  supervisor?: string;
  /** Temas discutidos na supervisão. */
  topics?: string[];
  /** Orientações recebidas. */
  orientations?: string;
  /** Dúvidas levadas / a investigar. */
  doubts?: string;
  /** Próximos passos combinados. */
  nextSteps?: string;

  // ---- legado (dados antigos sem `type`) ----
  supervisionNotes?: string;
}

/**
 * Caderno de supervisão — encontro próprio que conecta teoria, prática e
 * responsabilidade, sem guardar dados identificáveis de atendidos.
 * `beforeNotes` / `afterNotes` formam a coluna "antes/depois da supervisão".
 */
export interface SupervisionNotebook {
  id: string;
  date: string;
  supervisor?: string;
  /** Perguntas levadas para a conversa (preparação). */
  questions: string[];
  conceptIds: string[];
  referenceIds: string[];
  /** Próximos passos combinados (viram tarefa/leitura/foco). */
  nextSteps: string[];
  /** Autoavaliação breve da estudante. */
  selfAssessment: {
    confidence?: string;
    limits?: string;
    themes?: string;
  };
  beforeNotes?: string;
  afterNotes?: string;
}

export interface TccData {
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

export interface Sticker {
  id: string;
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

export interface UserProfile {
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

/** Progresso de leitura por obra da biblioteca (id → páginas lidas). */
export type ReadingProgress = Record<string, number>;

/**
 * Nota avulsa transitória — rascunho que pode virar outras entidades
 * (aula, tarefa, prova, flashcard, conceito…). Campos de vínculo são opcionais
 * (retrocompatível com notas antigas).
 */
export interface LooseNote {
  id: string;
  title: string;
  content: string;
  category: 'reflexão' | 'estudo' | 'ideia' | 'lembrete';
  /** Timestamp ISO (ex.: "2026-08-17T14:30:00-03:00"). */
  date: string;
  /** Última edição (timestamp ISO). */
  updatedAt?: string;
  // ---- vínculos opcionais (matéria, conceitos, autores, abordagens, materiais) ----
  courseId?: string;
  conceptIds?: string[];
  authorIds?: string[];
  approachIds?: string[];
  materialIds?: string[];
}

/** Alvos possíveis ao transformar uma nota avulsa em outra entidade. */
export type NoteTargetType =
  | 'class'
  | 'task'
  | 'exam'
  | 'flashcard'
  | 'session'
  | 'internship'
  | 'concept'
  | 'author'
  | 'material';

export type QuickType =
  | 'task'
  | 'class'
  | 'reading'
  | 'flashcard'
  | 'internship'
  | 'session'
  | 'exam'
  | 'author';

/** Questão de estudo (banco de questões — aba `questoes`). */
export interface StudyQuestion {
  id: string;
  courseId?: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  conceptIds?: string[];
  tags?: string[];
  area?: string;
  tema?: string;
  subtema?: string;
  escolaOuAbordagem?: string;
  dificuldade?: 'basica' | 'intermediaria' | 'avancada';
  tipoConhecimento?: string;
  autores?: string[];
  referencias?: string[];
  formato?: string;
  origem?: string;
  gabarito?: string;
  respostaDiscursiva?: string;
  criteriosDeCorrecao?: string[];
  afirmativas?: string[];
  itensDeAssociacao?: string[];
}

/** Técnica clínica / instrumento (templo de conhecimento). */
export interface Technique {
  id: string;
  name: string;
  approachId?: string;
  description: string;
  steps?: string[];
  relatedConceptIds?: string[];
  color?: string;
}

/**
 * ===== Templo de Conhecimento (catálogo estático) =====
 * Entidades somente-leitura da pipeline editorial (`content/`): conceitos,
 * autores curados e técnicas canônicas. Na web vêm dos facades lazy
 * (`src/data/temple/`); no nativo, do `.db` embutido (`catalogDb.ts`).
 */

/**
 * Autor canônico do acervo editorial — entidade de CONSULTA, separada das
 * questões. Fonte: 139 fichas editoriais (`content/authors-curated/`),
 * parseadas por `content/build-authors-fichas.mjs`.
 */
export interface TempleAuthorSection {
  /** título original da seção (ex.: "A grande ideia", "Principais obras") */
  title: string;
  /** corpo em markdown (parágrafos, tabelas, listas, diagramas em code block) */
  body: string;
}

export interface TempleAuthor {
  id: string; // author-<slug>
  name: string;
  slug: string;
  /** ordem canônica do corpus editorial */
  order: number;
  /** famílias teóricas (1+ por autor, ex.: "Psicanalítica e Psicodinâmica") */
  families: string[];
  aliases: string[];
  /** "Em uma frase" do topo da ficha */
  oneLiner?: string | null;
  fullName?: string;
  born?: string;
  died?: string;
  origin?: string;
  family?: string;
  mainWork?: string;
  sections: TempleAuthorSection[];
}

/** Conceito oficial (fonte: content/concepts/, 12 domínios). */
export interface TempleConcept {
  id: string; // concept-01-fundamentos-psicologicos-<slug>
  name: string;
  slug?: string | null;
  domainId: string; // domain-01-…
  domainName?: string | null;
  definition: string;
  sections?: Record<string, string>;
  authorIds: string[];
  approachIds: string[];
  topicIds: string[];
  relatedConceptIds: string[];
  relationStatus?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
}

/** Entrada leve do índice de conceitos (fica no chunk inicial do templo). */
export interface TempleConceptIndexEntry {
  id: string;
  name: string;
  domainId: string;
  domainName: string | null;
  definition: string; // resumo curto p/ lista
}

/** Domínio de conceitos ("fundamentos psicológicos", "cognição"…). */
export interface TempleConceptDomain {
  id: string;
  name: string;
}

/** Categoria de técnicas clínicas (10 domínios editoriais). */
export interface TempleTechniqueCategory {
  id: string; // domain-cognitivas…
  nome: string;
  slug?: string;
  descricaoCurta?: string | null;
  ordemExibicao?: number;
}

/** Técnica clínica canônica (135, fonte oficial content/techniques/). */
export interface TempleTechnique {
  id: string; // tec-…
  nome: string;
  emUmaFrase?: string | null;
  definicao?: string | null;
  objetivo?: string | null;
  comoFunciona?: string | null;
  quandoEUtilizada?: string | null;
  comoEAplicada?: string | null;
  origem?: string | null;
  exemploPratico?: string | null;
  evidencias?: string | null;
  limitacoes?: string | null;
  slug?: string;
  dominioId: string;
  dominioNomes?: string[];
  ordemExibicao?: number;
  abordagemIds?: string[];
  modeloIds?: string[];
  fonteIds?: string[];
  tecnicasRelacionadasIds?: string[];
  status?: string;
}

/** Estado de onboarding (primeiro acesso). */
export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  loadedDemo?: boolean;
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
