// Domínio: entidades acadêmicas e de biblioteca (MOD-001 / B.3).

export interface Task {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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

/** Status de participação de uma aula registrada. */
export type AttendanceStatus = 'presente' | 'falta' | 'cancelada';

/** Registro de presença/falta/cancelamento de uma aula (frequência detalhada). */
export interface AttendanceRecord {
  id: string;
  /** Data da aula no formato YYYY-MM-DD (fuso local). */
  date: string;
  status: AttendanceStatus;
  /** Id da anotação de aula criada/vinculada (só em "presente"). */
  noteId?: string;
  /** Carga horária da aula em horas (derivada do slot ou editável). */
  hours?: number;
  updatedAt?: string;
}

/** Frequência de uma disciplina (substitui o par {attended,total}). */
export interface CourseAttendance {
  /** Total de aulas previstas/manual (ajustável; 0 = não configurado). */
  total: number;
  /** Percentual mínimo de presença da disciplina (default 75). */
  minPct: number;
  /** Presenças registradas antes dos registros detalhados (migração/manual). */
  baseAttended?: number;
  /** Histórico de participação por aula (mais recente primeiro). */
  records: AttendanceRecord[];
}

export interface Course {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
  /** Frequência da disciplina (total configurável + registros por aula). */
  attendance?: CourseAttendance;
  /**
   * Vínculos explícitos de repertório (SPEC-001): conceitos-chave, autores
   * fundamentais e bibliografia recomendada da disciplina. Opcionais — o
   * caminho legado (concept.courseIds, reading.courseId, autores transitivos)
   * continua valendo na renderização (união). Prefixos: `con-`/`aut-`
   * (banco pessoal), `r-`/`m-` (leituras/materiais pessoais) e
   * `cat-`/`inter-`/`art-` (catálogo estático).
   */
  conceptIds?: string[];
  authorIds?: string[];
  bibliographyIds?: string[];
}

export interface ClassNote {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  courseId: string;
  title: string;
  date: string;
  /** Horário da prova (HH:MM). Quando ausente, o calendário estima o início. */
  time?: string;
  weight: string; // e.g. "40% da nota"
  /** Peso numérico (0-100) — derivável para breakdowns (ex.: 35). */
  weightValue?: number;
  topics: string[];
  completed: boolean;
  grade?: number;
}

export interface StudySession {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  courseId?: string;
  topic: string;
  date: string;
  /** Horário de início do bloco (HH:MM). Quando ausente, o calendário estima. */
  startTime?: string;
  durationMinutes: number;
  notes?: string;
}

export interface ReadingChapter {
  id: string;
  title: string;
  body: string;
}

export interface ReadingItem {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  color?: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  deckId?: string;
  conceptId?: string;
  courseId?: string;
  question: string;
  answer: string;
  /** FSRS scheduling */
  due?: string;
  stability?: number;
  difficulty?: number;
  retrievability?: number;
  lapses?: number;
  reviews?: number;
  lastInterval?: number;
  state?: 'new' | 'learning' | 'review' | 'relearning';
  /** Legado — mantidos por migração */
  lastReviewed?: string;
  easeFactor?: number;
  timesReviewed?: number;
}

export interface PsychologyConcept {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  name: string;
  definition: string;
  approachId?: string; // TCC, Psicanálise, etc.
  authorIds: string[];
  courseIds: string[];
  tags: string[];
}

export interface PsychologyAuthor {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  title: string;
  type: 'artigo' | 'livro' | 'pdf' | 'link' | 'slides';
  author: string;
  courseId?: string;
  url?: string;
  tags: string[];
  addedAt: string;
}

/** Técnica clínica / instrumento (templo de conhecimento). */
export interface Technique {
  id: string;
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
  name: string;
  approachId?: string;
  description: string;
  steps?: string[];
  relatedConceptIds?: string[];
  color?: string;
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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
