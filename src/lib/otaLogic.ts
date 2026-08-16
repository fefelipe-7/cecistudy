/**
 * Lógica pura do OTA (sem dependência do plugin nativo) — testável em jsdom.
 * O cliente real (src/lib/ota.ts) usa essas funções para comparar versões e
 * validar o manifest vindo do GitHub Pages.
 */

export interface OtaManifest {
  /** Versão semver do bundle (ex.: "1.0.17"). */
  version: string;
  /** URL do zip do bundle (HTTPS). */
  url: string;
  /** SHA-256 (hex) do zip — o plugin valida a integridade antes de instalar. */
  checksum: string;
  /** Data de publicação (opcional, informativa). */
  releasedAt?: string;
}

const SEMVER_RE = /^\d+(\.\d+){1,2}([-+].*)?$/;

export function isSemver(version: string): boolean {
  return SEMVER_RE.test(version);
}

function parseParts(version: string): number[] {
  return version
    .split(/[-+]/)[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

/**
 * Comparação semver numérica (ignora prerelease/build metadata).
 * Retorna >0 se a > b, <0 se a < b, 0 se iguais.
 */
export function semverCompare(a: string, b: string): number {
  const pa = parseParts(a);
  const pb = parseParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Valida o manifest baixado; lança erro se estiver malformado. */
export function parseOtaManifest(raw: unknown): OtaManifest {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('manifest ota inválido: não é um objeto');
  }
  const data = raw as Record<string, unknown>;
  if (!isNonEmptyString(data.version) || !isSemver(data.version)) {
    throw new Error('manifest ota inválido: version semver ausente');
  }
  if (!isNonEmptyString(data.url)) {
    throw new Error('manifest ota inválido: url ausente');
  }
  if (!isNonEmptyString(data.checksum)) {
    throw new Error('manifest ota inválido: checksum ausente');
  }
  return {
    version: data.version,
    url: data.url,
    checksum: data.checksum,
    releasedAt: isNonEmptyString(data.releasedAt) ? data.releasedAt : undefined,
  };
}

/**
 * Decide se o app deve baixar o bundle anunciado no manifest.
 * - current === "builtin" (sem OTA aplicado) → sempre atualiza.
 * - current não-semver (ex.: versão nativa) → atualiza para não ficar preso.
 * - Semver válido → compara e só atualiza se o manifest for maior.
 */
export function shouldUpdate(current: string | null | undefined, manifestVersion: string): boolean {
  if (!current || current === 'builtin') return true;
  if (!isSemver(current)) return true;
  if (!isSemver(manifestVersion)) return false;
  return semverCompare(manifestVersion, current) > 0;
}