// Stub de compat (SPEC-009 §7). A data civil é **regra de domínio**, não glue de
// apresentação: o dono é `packages/domain`, e este arquivo só reexporta para os
// importadores existentes (`../../lib/dateBR`) não mudarem de um dia para outro.
//
// Por que existiu aqui: entre 2026-10-05 (hotfix, `F4`/`F5`) e a fase 1 da spec, os
// helpers nasceram em `src/lib` porque é glue puro. Viraram domínio quando o módulo
// `internship` entrou, e a regra é uma só (fonte única).

export {
  toDateKey as localDateKey,
  todayKey as todayKeyLocal,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDays as addDaysKey,
  daysBetween,
  weekStartKey,
  inWeek,
} from '../../packages/domain/src/core/domain/internship';

import { isScheduled as _isScheduled } from '../../packages/domain/src/core/domain/internship';
import type { InternshipLog } from '../../packages/domain/src/core/domain/internship';

/** Data futura em relação a hoje? Wrapper de nome curto, reexportado por `internshipPreview`. */
export const isScheduledDate = (date: string, today: string): boolean =>
  _isScheduled({ date } as InternshipLog, today);