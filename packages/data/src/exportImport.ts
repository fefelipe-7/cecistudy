/**
 * Backup v2 — formato `cecistudy-user-backup` (lógica pura, sem plataforma).
 *
 * Estrutura explícita de `metadata`/`payload`, versão de schema da usuária
 * (`userSchemaVersion`, independente do catálogo) e versão do catálogo
 * (`catalogRelease`). O catálogo NÃO é exportado (release próprio); apenas os
 * IDs de itens salvos/respostas são preservados no `payload`.
 *
 * - Export: a partir do snapshot do estado (exclui bancos estáticos).
 * - Import: valida formato + Zod por coleção; aplica só após validação completa.
 *
 * A escrita física do arquivo (nativo vs. web) vive em `src/lib/exportFile.ts`,
 * que importa as constantes/tipos daqui — este módulo não toca em Capacitor.
 */

import { EmptyDatabase, emptyDatabase } from '@/data/empty';
import { backupDataSchema } from './backupSchema';
import { PersistedStateSnapshot, buildBackupData } from './persistentData';
import { SCHEMA_VERSION, USER_SCHEMA_VERSION, migrateDatabase } from '@/data/schema';

export const BACKUP_FILE_NAME = 'cecistudy-backup.json';
export const BACKUP_FORMAT = 'cecistudy-user-backup';
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupV2 {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  userSchemaVersion: number;
  /** Versão do schema de dados no momento do export (sincronização/import entre versões). */
  schemaVersion?: number;
  catalogRelease: string | null;
  exportedAt: string;
  payload: Record<string, unknown>;
}

/**
 * Monta o payload v2 a partir de um instantâneo do estado do contexto.
 * (Centraliza a conversão banco → payload de exportação.)
 */
export async function buildBackupPayload(snapshot: PersistedStateSnapshot): Promise<BackupV2> {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    userSchemaVersion: USER_SCHEMA_VERSION,
    schemaVersion: SCHEMA_VERSION,
    catalogRelease: null,
    exportedAt: new Date().toISOString(),
    payload: buildBackupData(snapshot),
  };
}

/** Extrai a prévia de importação (metadados) sem validar o payload. */
export function previewBackup(json: string): {
  userSchemaVersion: number;
  catalogRelease: string | null;
  exportedAt: string;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Partial<BackupV2>;
  if (p.format !== BACKUP_FORMAT || typeof p.formatVersion !== 'number') return null;
  return {
    userSchemaVersion: p.userSchemaVersion ?? 0,
    catalogRelease: p.catalogRelease ?? null,
    exportedAt: p.exportedAt ?? '',
  };
}

/**
 * Valida e restaura um backup v2. Rejeita formatos desconhecidos e payloads
 * estruturalmente inválidos. Retorna `null` quando inválido — nunca retorna um
 * banco parcial.
 */
export function importAppDatabase(json: string): EmptyDatabase | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Partial<BackupV2>;
  if (p.format !== BACKUP_FORMAT) return null;
  if (p.formatVersion !== BACKUP_FORMAT_VERSION) return null;
  if (!p.payload || typeof p.payload !== 'object') return null;

  // Migração entre versões de schema: backups antigos sobem até a versão atual;
  // backups de versão futura são recusados (app desatualizado).
  const payloadVersion = typeof p.schemaVersion === 'number' ? p.schemaVersion : null;
  let payloadData = p.payload;
  if (payloadVersion !== null) {
    if (payloadVersion > SCHEMA_VERSION) return null;
    const migrated = payloadVersion < SCHEMA_VERSION ? migrateDatabase(payloadVersion, p.payload) : p.payload;
    if (!migrated) return null;
    payloadData = migrated;
  }

  // Validação runtime por coleção (Zod): rejeita shapes inválidos com erro
  // específico. O estado atual NUNCA é substituído antes da validação completa.
  const validated = backupDataSchema.safeParse(payloadData);
  if (!validated.success) {
    console.warn('[import] backup inválido:', validated.error.flatten());
    return null;
  }

  const base = emptyDatabase();
  return { ...base, ...validated.data } as EmptyDatabase;
}
