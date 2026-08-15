import { Capacitor } from '@capacitor/core';
import { SCHEMA_VERSION, AppDatabase, migrateDatabase } from '../data/schema';
import { EmptyDatabase, emptyDatabase } from '../data/empty';

export const BACKUP_FILE_NAME = 'cecistudy-backup.json';

/**
 * Exporta o banco local como arquivo JSON versionado.
 * - Web/PWA  → download via blob.
 * - Nativo   → grava na pasta Documents (@capacitor/filesystem) e abre a share sheet
 *              (@capacitor/share). Sem os plugins nativos, cai no download por blob.
 */
export async function exportAppDatabase(payload: AppDatabase): Promise<void> {
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
 * Valida e restaura um backup. Aplica migrações de schema se a versão for antiga;
 * recusa versões desconhecidas/novas. Retorna `null` quando inválido.
 */
export function importAppDatabase(json: string): EmptyDatabase | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Partial<AppDatabase>;
  if (typeof p.version !== 'number' || !p.data || typeof p.data !== 'object') return null;

  const migrated = migrateDatabase(p.version, p.data);
  if (!migrated) return null;

  const base = emptyDatabase();
  return { ...base, ...migrated } as EmptyDatabase;
}

/** Versão ativa do schema (metadados de export). */
export { SCHEMA_VERSION };
