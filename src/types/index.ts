// Barrel de tipos do cecistudy — delega por domínio (MOD-001 / B.3).
// Mantém todos os imports existentes (`from '../types'`) funcionando.

export * from './entity';
export * from './navigation';
export * from './quiz';
export * from './internship';
export * from './profile';
export * from './temple';
// SPEC-005: o período letivo é domínio (`packages/domain`) — re-exportado aqui
// para o app falar de `AcademicTerm` pelo barrel de tipos, sem duplicar o
// contrato em dois lugares.
export type {
  AcademicTerm,
  TermStatus,
  TermSummary,
  TermGrade,
  TermScopedCourse,
} from '@/core/domain';
