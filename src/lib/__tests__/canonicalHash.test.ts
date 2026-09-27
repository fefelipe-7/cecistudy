import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalize } from '../canonicalJson';
import { canonicalSha256, canonicalPayloadHash, sha256HexUtf8 } from '../canonicalHash';

/**
 * Vetores compartilhados TS ↔ Rust de Canonical JSON v1 + SHA-256 (T0.4).
 *
 * Lê o MESMO arquivo que `cecistudy-rust/crates/cecistudy-common/tests/
 * canonical_hash_vectors_test.rs`. As expectativas foram calculadas fora de TS
 * e Rust, então o teste não é tautológico: se este lado canonicalizar ou hashear
 * diferente, ele quebra — e o lado Rust quebra junto.
 */

const VECTORS_PATH = join(
  import.meta.dirname,
  '../../../cecistudy-rust/contracts/golden/canonical_hash_vectors.json'
);

interface Vector {
  name: string;
  input: unknown;
  canonical: string;
  sha256: string;
}
interface VectorDoc {
  version: number;
  vectors: Vector[];
  knownAnswers: { input: string; sha256: string }[];
}

function load(): VectorDoc {
  return JSON.parse(readFileSync(VECTORS_PATH, 'utf8')) as VectorDoc;
}

describe('canonical hash — vetores compartilhados (T0.4)', () => {
  it('o arquivo de vetores existe e tem conteúdo', () => {
    const doc = load();
    expect(doc.version).toBe(1);
    expect(doc.vectors.length).toBeGreaterThanOrEqual(8);
  });

  it('canonicaliza cada vetor como o esperado', () => {
    for (const v of load().vectors) {
      expect(canonicalize(v.input), `canonical divergente no vetor ${v.name}`).toBe(v.canonical);
    }
  });

  it('o sha256 de cada vetor bate com o esperado', async () => {
    for (const v of load().vectors) {
      expect(await canonicalSha256(v.input), `sha256 divergente no vetor ${v.name}`).toBe(v.sha256);
    }
  });

  it('bate com os known answers (NIST sha256("abc"))', async () => {
    for (const ka of load().knownAnswers) {
      expect(await sha256HexUtf8(ka.input), `sha256 divergente em ${ka.input}`).toBe(ka.sha256);
    }
  });

  it('NFC: mesma string normalizada gera o mesmo hash', async () => {
    // "cafe" + U+0301 (combinando) vs. "café" já composto (U+00E9).
    // O decomposto é montado por código de caractere de propósito: colar os
    // literais acentuados deixa o teste comparando a string com ela mesma
    // (o editor normaliza para NFC).
    const decomposto = { nota: 'cafe' + String.fromCharCode(0x301) };
    const composto = { nota: 'café' };
    expect(decomposto.nota).not.toBe(composto.nota);
    expect(canonicalize(decomposto)).toBe(canonicalize(composto));
    expect(await canonicalSha256(decomposto)).toBe(await canonicalSha256(composto));
  });

  it('hash não depende da ordem das chaves no input', async () => {
    expect(await canonicalSha256({ b: 1, a: 2 })).toBe(await canonicalSha256({ a: 2, b: 1 }));
  });

  it('hash muda quando o dado muda', async () => {
    expect(await canonicalSha256({ a: 1 })).not.toBe(await canonicalSha256({ a: 2 }));
  });

  it('canonicalPayloadHash usa o prefixo sha256:', async () => {
    const hash = await canonicalPayloadHash({ a: 1 });
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('vetores não podem ter hash vazio ou em maiúsculas', () => {
    for (const v of load().vectors) {
      expect(v.sha256, v.name).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
