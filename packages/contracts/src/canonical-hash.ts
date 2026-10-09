/**
 * SHA-256 sobre Canonical JSON v1 (T0.4) — paridade byte a byte com
 * `cecistudy-rust/crates/cecistudy-common/src/hash.rs`.
 *
 * O `payloadHash` do envelope de sync é o SHA-256 dos bytes do Canonical JSON
 * v1 do snapshot. Hashar um `JSON.stringify` qualquer faria o mesmo dado
 * produzir hashes diferentes nos dois lados, e o push seria rejeitado sem
 * motivo — por isso a entrada é sempre `canonicalize()`.
 *
 * Os vetores compartilhados ficam em
 * `cecistudy-rust/contracts/golden/canonical_hash_vectors.json`.
 */
import { canonicalize } from './canonical-json';

/** SHA-256 em hex minúsculo dos bytes dados. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 dos bytes UTF-8 de `text`. */
export function sha256HexUtf8(text: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(text));
}

/** SHA-256 do Canonical JSON v1 de `value` — o `payloadHash` do envelope. */
export function canonicalSha256(value: unknown): Promise<string> {
  return sha256HexUtf8(canonicalize(value));
}

/** `sha256:<hex>` — o formato gravado no envelope (`payloadHash`). */
export async function canonicalPayloadHash(value: unknown): Promise<string> {
  return `sha256:${await canonicalSha256(value)}`;
}
