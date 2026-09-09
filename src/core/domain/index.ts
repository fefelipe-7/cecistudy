/**
 * Re-export de compatibilidade (Fase 2 — migração gradual).
 *
 * Código legado ainda importa de '../domain' ou '../../domain'.
 * Este barrel repassa para @cecistudy/domain sem alterar comportamento.
 * Será removido quando todos os imports forem migrados para o package.
 */
export * from '../../../packages/domain/src/core/domain';