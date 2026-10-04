// Domínio: estágio supervisionado — diário, supervisão e intervisão (MOD-001 / B.3).
// Fonte única de verdade: InternshipLog. "Visão por caso" é derivada (internshipCases.ts).

import type { ClinicalProjection } from './clinical.ts';

/**
 * Tipos de registro **acadêmico** do estágio.
 *
 * `atendimento_clinico` **não** está aqui, e a ausência é a regra.
 * `SPEC-M-013` `D2`: §1.6 da spec referencial linha 23 é `[D]` — paciente de
 * estágio é um dos três domínios que nunca compartilham tabela, `id` nem vínculo.
 * Enquanto o tipo clínico valor do mesmo union do tipo acadêmico, a distinção
 * existe só em tempo de execução, e um `if` esquecido vira dado de paciente num
 * payload de sincronização.
 *
 * O que existe no lugar é a **projeção** de quatro campos, em
 * `ClinicalProjection`, e ela mora em coleção própria.
 */
export type InternshipLogType = 'estagio' | 'supervisao' | 'intervisao' | 'outro';

/**
 * Fase do ciclo de formação de um registro de estágio (Estágio 2.0).
 */
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

  /**
   * Ids das projeções de atendimento discutidas nesta supervisão.
   *
   * Aponta para `ClinicalProjection.id`, e **não** para um registro clínico: a
   * relação é com a projeção, que é o que existe fora do desktop. É esta a
   * distinção de §4.8 linha 473 — a camada clínica não é sincronizada, e o que
   * atravessa é a projeção de quatro campos.
   */
  discussedClinicalIds?: string[];

  // ---- legado (dados antigos sem `type`) ----
  supervisionNotes?: string;
}

export type { ClinicalProjection };

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
