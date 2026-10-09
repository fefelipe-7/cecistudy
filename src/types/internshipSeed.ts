import type { InternshipLogType } from '../types';

/**
 * Pré-preenchimento do wizard de estágio (`SPEC-009 §8.4`).
 *
 * `openWizard(type, courseId)` não aceita seed, e era por isso que três botões
 * promising mais do que o wizard podia entregar: "nova sessão com M.S." (não
 * sabia as iniciais nem o número), "levar pendentes pra supervisão" (não
 * pré-selecionava as sessões) e "sem reflexão · adicionar" (não abria no passo
 * certo). Todos os três Now sabem dizer de onde vêm.
 *
 * **Regra dura:** com seed, o wizard **não lê nem grava rascunho**. Se ele
 * lesse `wizard_draft_internship`, o rascunho antigo sobrescreveria o seed — e o
 * rascunho existente precisa ficar intacto para voltar quando abrir sem seed.
 */
export interface InternshipWizardSeed {
  kind?: InternshipLogType;
  patient?: string;
  sessionNumber?: number;
  patientAge?: string;
  approach?: string;
  date?: string;
  /** "levar para supervisão": as sessões já marcadas. */
  discussedLogIds?: string[];
  /** Abre em edição direta, sem passar pelo menu. */
  editId?: string;
  startAtStep?: 'tipo' | 'essencial' | 'contexto' | 'discutidos' | 'reflexao' | 'combinados';
}