/**
 * Backup v2 — formato `cecistudy-user-backup`.
 *
 * Estrutura explícita de `metadata`/`payload`, versão de schema da usuária
 * (`userSchemaVersion`, independente do catálogo) e versão do catálogo
 * (`catalogRelease`). O catálogo NÃO é exportado (release próprio); apenas os
 * IDs de itens salvos/respostas são preservados no `payload`.
 *
 * - Export: a partir do snapshot do estado (exclui bancos estáticos).
 * - Import: valida formato + Zod por coleção; aplica só após validação completa.
 */

import { Capacitor } from '@capacitor/core';
import { EmptyDatabase, emptyDatabase } from '../data/empty';
import { backupDataSchema } from './backupSchema';
import { PersistedStateSnapshot, buildBackupData } from './persistentData';
import { USER_SCHEMA_VERSION } from '../data/schema';

export const BACKUP_FILE_NAME = 'cecistudy-backup.json';
export const BACKUP_FORMAT = 'cecistudy-user-backup';
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupV2 {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  userSchemaVersion: number;
  catalogRelease: string | null;
  exportedAt: string;
  payload: Record<string, unknown>;
}

/**
 * Exporta o banco local como arquivo JSON versionado (backup v2).
 * - Web/PWA  → download via blob.
 * - Nativo   → grava na pasta Documents (@capacitor/filesystem) e abre a share sheet.
 */
export async function exportAppDatabase(payload: BackupV2): Promise<void> {
  const json = JSON.stringify(payload, null, 2);

  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const fileName = `cecistudy-backup-${Date.now()}.json`;
      await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: 'backup do cantinho',
        text: 'seu backup do cecistudy ♡',
        url: fileName,
        dialogTitle: 'guardar backup',
      });
      return;
    } catch (e) {
      console.error('native export failed, falling back to download', e);
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BACKUP_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  // Validação runtime por coleção (Zod): rejeita shapes inválidos com erro
  // específico. O estado atual NUNCA é substituído antes da validação completa.
  const validated = backupDataSchema.safeParse(p.payload);
  if (!validated.success) {
    console.warn('[import] backup inválido:', validated.error.flatten());
    return null;
  }

  const base = emptyDatabase();
  return { ...base, ...validated.data } as EmptyDatabase;
}

/** Versão de schema da usuária (metadados de export). */
export { USER_SCHEMA_VERSION };