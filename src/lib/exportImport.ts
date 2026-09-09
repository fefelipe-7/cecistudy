/**
 * Compat re-export → `@cecistudy/data` (Fase 3).
 * A lógica pura de backup/import vive em `packages/data`; a escrita física
 * (web/nativo) vive em `./exportFile`.
 */
export * from '../../packages/data/src/exportImport';
export { exportAppDatabase } from './exportFile';
