// Stub de compat (SPEC-009 §7).
//
// `deriveCases` e `DerivedCase` passaram a morar em `packages/domain`, junto com a
// regra que os produz. Este arquivo só reexporta.
//
// **A assinatura mudou** e a mudança é o ponto: a versão antiga derivava
// `lastSessionDate` da última posição depois de ordenar por `sessionNumber` (o
// registro `F23`: sessão 1 em 2027 e sessão 2 em 2026 mostravam "última sessão"
// em 2026), e derivava `pendingSupervision` de `!log.supervisionLogId` — um campo
// que nada limpa ao apagar (`F3`). A versão nova usa a **maior data** e o índice de
// vínculos. Os consumidores foram atualizados junto (SPEC-009 §8.2).

export type {
  DerivedCase,
  DateKey,
  InternshipLog,
  CampoPendencia,
} from '../../packages/domain/src/core/domain/internship';

export {
  deriveCases,
  computeStats,
  computePendencies,
  proximasPendenciasDePreenchimento,
  camposDeReferencia,
  declinadosDe,
  comDeclinados,
  statusPreenchimento,
  valorCampoReferencia,
  CAMPOS_DE_REFERENCIA,
  CAMPO_REFERENCIA_LABEL,
  CAMPO_REFERENCIA_DESCRICAO,
  TEXTO_NAO_RESPONDER,
  statusOf,
  buildLinkIndex,
  isScheduled,
  isDone,
  hasLiveNextStepLink,
  groupByWeek,
  suggestTitle,
  normalizePatientKey,
  formatPatientLabel,
  nextSessionNumber,
  isClinical,
  sanitizeLog,
  planSave,
  planDelete,
  planRenamePatient,
  planSetPatient,
  planLinkNextStep,
  legacyNotebookToLog,
} from '../../packages/domain/src/core/domain/internship';