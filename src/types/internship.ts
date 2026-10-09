// Domínio: estágio supervisionado — diário, supervisão, intervisão e a camada
// clínica do atendimento (MOD-001 / B.3 · SPEC-009).
//
// **O contrato mora em `packages/domain`** (`core/domain/internship.ts`) desde
// 2026-10-05, junto com a regra que o consome. Este arquivo só reexporta, para
// manter `import { InternshipLog } from '../types'` funcionando.
//
// Caminho **relativo** de propósito: `@/packages/...` resolve `./src/*` primeiro e
// não faz fallback para `./packages/*`, então compila no `tsc` e quebra no build
// do Vite (ver `AGENTS.md`).

export type {
  InternshipLogType,
  InternshipNextStepLink,
  InternshipLog,
  SupervisionNotebook,
  DateKey,
  LinkIndexEntry,
  LinkIndex,
  LogStatus,
  InternshipStats,
  DerivedCase,
  LogGroup,
  LogGroupId,
  RenamePatientResult,
} from '../../packages/domain/src/core/domain/internship';

export {
  // datas civis
  toDateKey,
  todayKey,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDays,
  weekStartKey,
  inWeek,
  // estado derivado
  isScheduled,
  isDone,
  buildLinkIndex,
  statusOf,
  reflectionExpectedFor,
  computePendencies,
  WEEKS_IN_SERIES,
  computeStats,
  // casos
  isClinical,
  normalizePatientKey,
  formatPatientLabel,
  deriveCases,
  nextSessionNumber,
  // agrupamento e título
  groupByWeek,
  suggestTitle,
  // escrita
  sanitizeLog,
  planSave,
  planDelete,
  planRenamePatient,
  planSetPatient,
  planLinkNextStep,
  hasLiveNextStepLink,
  legacyNotebookToLog,
} from '../../packages/domain/src/core/domain/internship';