import type { ComponentType, ReactNode } from 'react';

export type NavTab = 'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil';

export type SubTabFaculdade = 'disciplinas' | 'aulas' | 'avaliacoes' | 'calendario';
export type SubTabEstudos = 'sessoes' | 'leituras' | 'flashcards' | 'questoes' | 'historico';
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
  | { kind: 'mood' }
  | { kind: 'streak' }
  | { kind: 'internshipDiary' }
  | { kind: 'compose' }
  | { kind: 'composeDetails' }
  | { kind: 'wizard'; type: WizardFlow }
  | { kind: 'approach'; approachId: string }
  | { kind: 'families' }
  | { kind: 'family'; familyId: string };

/**
 * Tipos de wizard de criação em tela cheia (substitui o quick add em modal).
 * `task-exam` é o fluxo combinado do FAB: 1º passo escolhe entre tarefa e prova.
 */
export type WizardFlow =
  | 'task'
  | 'exam'
  | 'task-exam'
  | 'reading'
  | 'flashcard'
  | 'internship'
  | 'session'
  | 'author'
  | 'question';

export interface HeaderAction {
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface DynamicHeaderConfig {
  type?: 'default' | 'detail' | 'custom';
  title?: string;
  subtitle?: string;
  code?: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
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

export interface Course {
  id: string;
  name: string;
  code?: string;
  professor: string;
  semester: string; // e.g. "6º Semestre"
  schedule: string; // e.g. "Segunda 09:00 - 12:00"
  room?: string;
  category?: 'obrigatoria' | 'complementar';
  color: string; // hex code or style class
  icon: string; // Lucide icon name
  progress: number; // 0-100%
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
  mood: 'com_foco' | 'tranquilo' | 'cansado' | 'produtivo';
  notes?: string;
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

export interface InternshipLog {
  id: string;
  /** Tipo do registro (default `'estagio'` para dados antigos). */
  type: InternshipLogType;
  date: string;
  hours: number;
  /** Resumo curto do registro — usado como título/evento. */
  activity: string;
  reflections: string;
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
}

export interface UserProfile {
  name: string;
  semester: number;
  totalSemesters: number;
  university: string;
  targetCareer: string;
  avatarMood: string;
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

export interface DailyMoodData {
  emoji: string;
  label: string;
  energyLevel: number; // 1-5
  vibeColor: string;
  reflection: string;
  intention: string;
  updatedAt: string;
}

export type QuickType =
  | 'task'
  | 'class'
  | 'reading'
  | 'flashcard'
  | 'internship'
  | 'session'
  | 'exam'
  | 'author';

/** Um registro de humor em um dia específico (alimenta o calendário de humor real). */
export interface MoodEntry extends DailyMoodData {
  id: string;
  /** YYYY-MM-DD (fuso local). */
  date: string;
}

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

/** Estado de onboarding (primeiro acesso). */
export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  loadedDemo?: boolean;
}
