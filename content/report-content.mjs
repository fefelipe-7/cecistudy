/**
 * content:report — estatísticas do banco do catálogo embutido (somente leitura).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'public', 'assets', 'databases', 'cecistudy_catalog.db');

async function main() {
  const SQL = await initSqlJs({
    locateFile: () => path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  });
  const db = new SQL.Database(readFileSync(DB_PATH));

  const release = db.exec(
    'SELECT version, content_hash, built_at FROM catalog_release WHERE id = 1'
  )[0]?.values?.[0];
  console.log(`release: ${release?.[0]} (hash ${release?.[1].slice(0, 12)}…, ${release?.[2]})`);

  const query = (sql) => Number(db.exec(sql)[0]?.values?.[0]?.[0] ?? 0);
  console.log('contagens:');
  console.log(`  áreas:             ${query('SELECT COUNT(*) FROM area')}`);
  console.log(`  famílias:          ${query('SELECT COUNT(*) FROM approach_family')}`);
  console.log(`  abordagens:        ${query('SELECT COUNT(*) FROM approach')}`);
  console.log(`  questões:          ${query('SELECT COUNT(*) FROM question')}`);
  console.log(`  obras:             ${query('SELECT COUNT(*) FROM work')}`);
  console.log(`    · catálogo:      ${query("SELECT COUNT(*) FROM work WHERE type='catalog'")}`);
  console.log(`    · interdiscipl:  ${query("SELECT COUNT(*) FROM work WHERE type='interdisciplinary'")}`);
  console.log(`    · artigos:       ${query("SELECT COUNT(*) FROM work WHERE type='article'")}`);

  db.close();
}

main().catch((e) => {
  console.error('[content:report] falhou:', e);
  process.exit(1);
});