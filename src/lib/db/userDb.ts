/**
 * Banco da usuária em SQLite (`cecistudy_user`) — **nativo only**.
 *
 * - Web/PWA: `getUserDb()` retorna `null` — o app segue 100% JSON
 *   (localStorage via `usePersistentState`/`useSqliteState`). Nada muda na web.
 * - Nativo: singleton do driver com migrações aplicadas + import legado
 *   (Preferences → SQLite) executado uma única vez por coleção.
 *
 * Se o SQLite falhar por qualquer motivo (plugin ausente, base corrompida),
 * o singleton vira `null` e o app degrada para o caminho legado sem travar.
 */
import { isNativePlatform, storage, STORAGE_PREFIX } from '../storage.ts';
import { createNativeSqliteDriver, type SqlDriver } from './driver.ts';
import { runUserMigrations, USER_DB_NAME } from './migrations.ts';
import { USER_COLLECTION_KEYS } from './normalize.ts';
import { importLegacyCollections, hasLegacyImport } from './legacyImport.ts';

let userDbPromise: Promise<SqlDriver | null> | undefined;

/**
 * Singleton da base da usuária. Resolve uma única vez; chamadas seguintes
 * reutilizam a promessa. `null` = web ou falha (usar caminho legado).
 */
export function getUserDb(): Promise<SqlDriver | null> {
  if (!isNativePlatform) return Promise.resolve(null);
  if (!userDbPromise) userDbPromise = bootstrapUserDb();
  return userDbPromise;
}

async function bootstrapUserDb(): Promise<SqlDriver | null> {
  try {
    const driver = await createNativeSqliteDriver(USER_DB_NAME, async (d) => {
      await runUserMigrations(d);
    });

    // Import legado (Preferences → SQLite), uma vez por chave. Só remove as
    // chaves legadas quando TODAS as coleções conhecidas já estiverem mapeadas.
    await importLegacyCollections(driver, USER_COLLECTION_KEYS, (key) => storage.get(key));
    await cleanupLegacyKeys(driver);

    return driver;
  } catch (e) {
    console.error('[userDb] SQLite indisponível — usando caminho legado', e);
    return null;
  }
}

/** Remove as chaves `cecistudy_*` do Preferences após import completo. */
async function cleanupLegacyKeys(driver: SqlDriver): Promise<void> {
  try {
    const pending = [] as string[];
    for (const key of USER_COLLECTION_KEYS) {
      if (!(await hasLegacyImport(driver, key))) pending.push(key);
    }
    // Só limpa se não há nenhuma coleção pendente de decisão.
    if (pending.length > 0) return;
    for (const key of USER_COLLECTION_KEYS) {
      await storage.remove(key);
    }
  } catch (e) {
    console.warn('[userDb] limpeza legada adiada', e);
  }
}

/** Apaga TODO o conteúdo da base da usuária (mantém schema/migrações). */
export async function clearUserData(driver: SqlDriver): Promise<void> {
  const tables = [
    'profile',
    'course',
    'course_schedule',
    'class_note',
    'class_note_link',
    'task',
    'task_link',
    'assessment',
    'assessment_topic',
    'study_session',
    'flashcard',
    'reading',
    'reading_highlight',
    'reading_progress',
    'author',
    'concept',
    'concept_course',
    'concept_author',
    'material',
    'technique',
    'note',
    'note_link',
    'internship',
    'internship_concept',
    'internship_topic',
    'supervision_notebook',
    'thesis_project',
    'thesis_chapter',
    'thesis_reference',
    'achievement',
    'quiz_session',
    'quiz_answer',
    'saved_catalog_item',
    'streak',
    'activity_event',
    'legacy_import_map',
  ];
  await driver.exec(`DELETE FROM ${tables.join('; DELETE FROM ')}`);
}

/** Uso interno de testes: descarta o singleton memoizado. */
export function resetUserDbCache(): void {
  userDbPromise = undefined;
}

/** Chaves legadas (`cecistudy_*`) que hoje vivem fora do domínio SQLite. */
export const LEGACY_PREFERENCE_PREFIX = STORAGE_PREFIX;
