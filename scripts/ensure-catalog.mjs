/**
 * content:ensure — gera o catálogo quando ele falta ou quando o conteúdo mudou.
 *
 * O `.db` não é versionado (SPEC-026 D11): roda antes de `dev`, `build` e
 * `verify`, para que um clone novo funcione só com `npm ci`.
 *
 * shortcut: a decisão usa o `contentHash` de `content/last-build.json`. Se o
 * build passar a depender de algo fora do conteúdo, trocar por mtime.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeContentHash } from '../content/content-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = path.join(ROOT, 'public', 'assets', 'databases', 'cecistudy_catalog.db');
const MANIFEST = path.join(ROOT, 'public', 'assets', 'databases', 'version.json');
const LAST = path.join(ROOT, 'content', 'last-build.json');

function hashDoUltimoBuild() {
  try {
    return JSON.parse(readFileSync(LAST, 'utf8')).contentHash ?? null;
  } catch {
    return null;
  }
}

if (existsSync(DB) && existsSync(MANIFEST) && hashDoUltimoBuild() === computeContentHash()) {
  process.exit(0);
}

console.log('· catálogo ausente ou desatualizado — gerando com `npm run content:build`');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const r = spawnSync(npm, ['run', 'content:build'], { cwd: ROOT, stdio: 'inherit' });
process.exit(r.status ?? 1);
