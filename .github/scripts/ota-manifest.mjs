#!/usr/bin/env node
/**
 * Gera o version.json do OTA e mantém as últimas N versões em bundles/.
 *
 * Usado pelo pipeline de release (.github/workflows/release.yml). Lê o
 * manifest anterior do GitHub Pages (best effort), adiciona a versão nova
 * (semver = versão do release) e carrega os zips antigos que ainda cabem.
 *
 * Entradas (env):
 *   OTA_DIR       diretório de saída (conterá version.json + bundles/)
 *   OTA_BASE_URL  base do site (ex.: https://fefelipe-7.github.io/cecistudy)
 *   VERSION       versão semver do release (ex.: 1.2.3)
 *   SHA           sha256 hex do zip do bundle novo
 *   KEEP          quantas versões manter em available (padrão 5)
 */
import fs from 'node:fs';
import path from 'node:path';

const otaDir = process.env.OTA_DIR;
const base = process.env.OTA_BASE_URL;
const version = process.env.VERSION;
const sha = process.env.SHA;
const keep = Number(process.env.KEEP || 5);

if (!otaDir || !base || !version || !sha) {
  console.error('uso: OTA_DIR, OTA_BASE_URL, VERSION e SHA são obrigatórios');
  process.exit(1);
}

const prevUrl = `${base}/version.json`;

let prev = { available: [] };
try {
  const res = await fetch(prevUrl, { headers: { Accept: 'application/json' } });
  if (res.ok) prev = (await res.json()) || { available: [] };
} catch {
  /* primeiro deploy — sem manifest anterior */
}
if (!Array.isArray(prev.available)) prev.available = [];

const newEntry = {
  version,
  url: `${base}/bundles/cecistudy-${version}.zip`,
  checksum: sha,
  releasedAt: new Date().toISOString(),
};

const kept = [newEntry];
const zips = new Set([`cecistudy-${version}.zip`]);

for (const entry of prev.available) {
  if (kept.length >= keep) break;
  if (!entry || !entry.url || entry.version === version) continue;
  const name = path.basename(new URL(entry.url).pathname);
  if (zips.has(name)) continue;
  try {
    const res = await fetch(entry.url);
    if (!res.ok) continue;
    fs.writeFileSync(path.join(otaDir, 'bundles', name), Buffer.from(await res.arrayBuffer()));
    zips.add(name);
    kept.push(entry);
  } catch {
    /* zips antigos são best-effort; sem eles, o histórico encolhe */
  }
}

const manifest = { ...newEntry, available: kept };
const manifestPath = path.join(otaDir, 'version.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));