// Domínio: quiz de questões (banco de questões + sessões) (MOD-001 / B.3).

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

/**
 * Grupo pré-definido de questões do banco (origem editorial).
 * O usuário seleciona o grupo → vê detalhes → começa o quiz.
 * `filterConfig` alimenta diretamente o `QuizLoadingScreen` / `buildQuizPool()`.
 */
export interface QuestionGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
  authors: string[];
  approaches: string[];
  concepts: string[];
  areas: string[];
  dificuldades: string[];
  escolas: string[];
  banca?: string;
  prova?: string;
  filterConfig: QuizConfig;
}

/** Configuração de um quiz (filtros derivados do grupo selecionado). */
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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
