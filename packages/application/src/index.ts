export * from '../../../src/core/application/use-cases';
// SPEC-005: virada de semestre (cálculo puro do rollover). Fica no package
// porque é regra de negócio sem React/storage — o app consome via
// `src/lib/termRollover.ts` (stub de compat, mesmo padrão de focus/quiz).
export * from './term/rollover';