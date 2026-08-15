/**
 * Facade do banco de dados local — porta única de acesso aos dados do app.
 *
 * - Modelos: re-export de `src/types.ts` (fonte da verdade).
 * - Versão/migração: `schema.ts`.
 * - Defaults vazios (produção): `empty.ts`.
 * - Dados de exemplo: `seeds.ts`.
 * - Catálogo da biblioteca: `libraryData.ts`.
 * - Constantes de UI: `constants.ts` / `moodPresets.ts`.
 */
export * from '../types';
export * from './schema';
export * from './empty';
export * from './seeds';
export * from './libraryData';
export * from './moodPresets';
export * from './constants';
export * from './notesSeeds';
