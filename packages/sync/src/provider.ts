/**
 * Contrato de um provedor de sincronização (Fase Sync — GitHub provider).
 *
 * O cecistudy NÃO depende do GitHub: o `SyncProvider` é apenas um meio de
 * transporte/armazenamento do pacote de sincronização. O app conhece o
 * protocolo (SyncPackage/SyncManifest); o provider conhece a API do GitHub.
 *
 * Regra de arquitetura: este arquivo vive em `packages/sync` e NÃO pode importar
 * `react`, plugins nativos ou APIs de runtime desktop. A camada de transporte usa apenas
 * `fetch` (global) e recebe credenciais via injeção de dependência.
 */

/** Versão do protocolo de sincronização do cecistudy (independente do schema de dados). */
export const SYNC_PROTOCOL_VERSION = 1;

/** Manifesto versionado do pacote — permite CAS, auditoria e migração futura. */
export interface SyncManifest {
  /** SCHEMA_VERSION do domínio (BancoPersistido). */
  schemaVersion: number;
  /** Versão deste protocolo de sync (SYNC_PROTOCOL_VERSION). */
  protocolVersion: number;
  /** Versão do app que gerou o pacote. */
  appVersion: string;
  /** Revisão global monotônica (compare-and-swap). */
  revision: number;
  /** Identificador estável do dispositivo que gerou o pacote. */
  deviceId: string;
  /** Escopo de workspaces sincronizados (MVP: 'default'). */
  workspaceScope: string;
  /** Revisão da qual este pacote é derivado (null na primeira versão). */
  parentRevision: number | null;
  /** Hash de conteúdo do snapshot (detecta alteração sem baixar tudo). */
  contentHash: string;
  /** ISO timestamp da geração. */
  createdAt: string;
}

/** Pacote de sincronização próprio do cecistudy (não um dump de Git). */
export interface SyncPackage {
  manifest: SyncManifest;
  /** Snapshot do domínio (BackupV2 puro, com syncIndex). */
  snapshot: unknown;
}

/** Pacote remoto já com o sha do blob (usado para CAS no próximo upload). */
export interface RemotePackage {
  package: SyncPackage;
  sha: string;
}

export type SyncProviderErrorKind =
  | 'REMOTE_CHANGED'
  | 'NETWORK'
  | 'AUTH'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export class SyncProviderError extends Error {
  constructor(
    public readonly kind: SyncProviderErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'SyncProviderError';
  }
}

/**
 * Meio de transporte do pacote de sincronização. Implementações:
 * GitHubSyncProvider, P2PSyncProvider (futuro), WebDAVSyncProvider (futuro)…
 *
 * O CAS (compare-and-swap) é feito pelo provider: `uploadPackage` recebe o
 * `baseSha` do blob remoto conhecido e recusa (REMOTE_CHANGED) se o remoto
 * mudou nesse meio-tempo.
 */
export interface SyncProvider {
  /** Manifesto remoto atual, ou null se não houver pacote ainda. */
  getManifest(): Promise<SyncManifest | null>;
  /** Pacote remoto + sha do blob, ou null se não houver. */
  downloadPackage(): Promise<RemotePackage | null>;
  /** Sobe o pacote; exige o sha base para CAS. Devolve nova revisão + sha. */
  uploadPackage(
    pkg: SyncPackage,
    baseSha?: string,
  ): Promise<{ revision: number; sha: string }>;
}

/**
 * Hash de conteúdo estável e barato (FNV-1a 32-bit), usado para detectar
 * alteração no snapshot sem baixá-lo por completo. Não é criptográfico.
 */
export function hashContent(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
