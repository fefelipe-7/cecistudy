/**
 * Ponte do transporte de sincronização (Fase Sync S2 — PAUSADA).
 *
 * Ponto ÚNICO de encaixe entre a UI (S3, pronta) e o transporte WebRTC
 * (S2, pendente — Trystero/nostr). Quando a S2 for retomada:
 *
 *   1. Implementar `SyncTransport` em `src/lib/sync/channel.ts`
 *      (joinRoom do trystero + actions `meta`/`payload`).
 *   2. Trocar `resolveSyncTransport()` abaixo para devolver o canal real.
 *
 * NADA mais muda: a UI já renderiza todos os estados (waiting/connecting/
 * preview/stats) contra esta interface. Ver `docs/device-sync-plano.md` §5.
 */
import type { MergeStatsSide } from './merge';

/** Papel do dispositivo na sessão de sync. */
export type SyncRole = 'host' | 'join';

export interface SyncTransport {
  /** Abre a sala e aguarda o par. Resolve quando conectado. */
  connect(code: string): Promise<void>;
  /** Envia o snapshot local e devolve o payload do par (JSON backup v2). */
  exchange(localPayloadJson: string): Promise<string>;
  /** Fecha sala/canais (idempotente). */
  close(): void;
}

/**
 * Versão atual: transporte ainda não implementado (Fase S2 pausada).
 * Retorna `null` → a UI mostra o aviso carinhoso de "em breve".
 */
export function resolveSyncTransport(): SyncTransport | null {
  return null;
}

/** Stats consolidados para a UI (o que este lado vai receber). */
export interface SyncPreview {
  local: MergeStatsSide;
  remote: MergeStatsSide;
}
