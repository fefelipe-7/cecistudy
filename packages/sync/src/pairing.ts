/**
 * Pareamento entre dispositivos (Fase Sync S3 — UI).
 *
 * Código curto + conteúdo do QR. Puro, sem rede — a conexão em si fica no
 * transporte (Fase S2, pausada: ver `transport-bridge.ts` e
 * `docs/device-sync-plano.md`).
 */

/** Alfabeto sem caracteres ambíguos (sem 0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PAIR_CODE_LENGTH = 6;

/** Código exibido como `XXX-XXX`. */
export function formatPairCode(code: string): string {
  const clean = normalizePairCode(code);
  if (clean.length !== PAIR_CODE_LENGTH) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

/** Remove separadores/espaços e uppercase. */
export function normalizePairCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Gera um código de pareamento válido (crypto quando disponível). */
export function generatePairCode(): string {
  const bytes = new Uint8Array(PAIR_CODE_LENGTH);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

export function isValidPairCode(code: string): boolean {
  const clean = normalizePairCode(code);
  if (clean.length !== PAIR_CODE_LENGTH) return false;
  for (const ch of clean) {
    if (!CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

/** Conteúdo codificado no QR gerado pelo dispositivo host. */
export function qrPayloadFor(code: string, deviceName?: string): string {
  const params = new URLSearchParams({ v: '1', c: normalizePairCode(code) });
  if (deviceName) params.set('n', deviceName);
  return `cecistudy://sync?${params.toString()}`;
}

/** Extrai o código de um payload de QR escaneado. `null` se não for de sync. */
export function parseQrPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed.startsWith('cecistudy://sync')) return null;
  try {
    const url = new URL(trimmed);
    const code = normalizePairCode(url.searchParams.get('c') ?? '');
    return isValidPairCode(code) ? code : null;
  } catch {
    return null;
  }
}
