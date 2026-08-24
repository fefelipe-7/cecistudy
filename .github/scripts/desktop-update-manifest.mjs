/**
 * Monta o `latest.json` do Tauri updater a partir dos artefatos de desktop
 * baixados no job de release (bundles + arquivos .sig gerados pela assinatura).
 *
 * Uso:
 *   node desktop-update-manifest.mjs <tag> <diretório dos artefatos> <arquivo de saída>
 *
 * Ex.: node desktop-update-manifest.mjs v1.2.3 desktop-assets latest.json
 *
 * Mapeamento plataforma → artefato:
 *   windows-x86_64 → *.exe  (NSIS setup)
 *   darwin-aarch64 → *.app.tar.gz
 *   linux-x86_64   → *.AppImage
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [tag, assetsDir, outFile] = process.argv.slice(2);
if (!tag || !assetsDir || !outFile) {
  console.error('uso: node desktop-update-manifest.mjs <tag> <assets-dir> <out>');
  process.exit(1);
}

const REPO_DOWNLOAD = `https://github.com/fefelipe-7/cecistudy/releases/download/${tag}`;
const version = tag.replace(/^v/, '');

const PLATFORM_PATTERNS = [
  { key: 'windows-x86_64', test: /\.exe$/ },
  { key: 'darwin-aarch64', test: /\.app\.tar\.gz$/ },
  { key: 'linux-x86_64', test: /\.AppImage$/ },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(assetsDir);
const platforms = {};

for (const p of PLATFORM_PATTERNS) {
  const bundle = files.find((f) => p.test.test(f) && !f.endsWith('.sig'));
  if (!bundle) continue;
  const sigFile = files.find((f) => f === `${bundle}.sig`);
  if (!sigFile) {
    console.warn(`⚠ ${p.key}: bundle sem .sig (${bundle}) — pulando (updater precisa de assinatura)`);
    continue;
  }
  platforms[p.key] = {
    signature: readFileSync(sigFile, 'utf8').trim(),
    url: `${REPO_DOWNLOAD}/${bundle.split(/[/\\]/).pop()}`,
  };
}

if (Object.keys(platforms).length === 0) {
  console.error('nenhum par bundle+.sig encontrado — latest.json não gerado');
  process.exit(1);
}

const manifest = {
  version,
  notes: `cecistudy v${version} — atualização do app desktop.`,
  pub_date: new Date().toISOString(),
  platforms,
};

writeFileSync(outFile, JSON.stringify(manifest, null, 2));
console.log(`✓ latest.json gerado (${Object.keys(platforms).join(', ')})`);
