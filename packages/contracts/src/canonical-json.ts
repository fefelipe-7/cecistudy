/**
 * Canonical JSON v1 — serialização determinística compartilhada TS/Rust.
 *
 * Regras (ver `cecistudy-rust/docs/canonical-json-v1.md`):
 * - chaves de objeto ordenadas alfabeticamente (byte-a-tempo, UTF-8);
 * - arrays preservam a ordem original (nunca ordenar);
 * - strings normalizadas NFC;
 * - `undefined` exige a omissão da chave no objeto pai (e vira `null` em array);
 * - números seguem ECMAScript `Number::toString` (integrais sem `.0`,
 *   decimais sem notação científica exceto fora de [1e-6, 1e21));
 * - `NaN`/`±Infinity` não existem nos dados de domínio.
 *
 * O lado Rust replica o mesmo algoritmo sobre `serde_json::Value` → bytes
 * idênticos (golden files / content hash de sync).
 */
export function canonicalize(value: unknown): string {
  return serialize(value);
}

function serialize(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v.normalize('NFC'));
  if (typeof v === 'number') return numberToString(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    return '[' + v.map((x) => serialize(x === undefined ? null : x)).join(',') + ']';
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return (
      '{' + entries.map(([k, val]) => JSON.stringify(k) + ':' + serialize(val)).join(',') + '}'
    );
  }
  throw new Error(`canonicalize: tipo não suportado (${typeof v})`);
}

/** ECMAScript Number::toString — `String(n)` (JSON.stringify usa o mesmo literal). */
function numberToString(n: number): string {
  // Invariante de domínio: NaN/Infinity não ocorrem nos dados persistidos.
  if (!Number.isFinite(n)) {
    throw new Error(`canonicalize: número não finito (${n})`);
  }
  return String(n);
}