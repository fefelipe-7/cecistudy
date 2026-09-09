// Domínio: estágio supervisionado — diário, supervisão e intervisão (MOD-001 / B.3).
// Fonte única de verdade: InternshipLog. "Visão por caso" é derivada (internshipCases.ts).

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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
  nextSteps?: string[];

  // ---- campos absorvidos de SupervisionNotebook (type supervisao/intervisao) ----
  /** Referências (leituras/autores) ligadas à supervisão. */
  referenceIds?: string[];
  beforeNotes?: string;
  afterNotes?: string;
  selfAssessment?: {
    confidence?: string;
    limits?: string;
    themes?: string;
  };

  // ---- vínculo sessão ↔ supervisão ----
  /** Em logs tipo `atendimento_clinico`: id da supervisão que discutiu a sessão. */
  supervisionLogId?: string;
  /** Em logs tipo `supervisao`/`intervisao`: ids dos atendimentos discutidos. */
  discussedLogIds?: string[];

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
  /** Escopo de workspace (Fase 3). Default = ws-academico. */
  workspaceId?: string;
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
