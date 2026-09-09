/**
 * Contratos de serialização do protocolo de sincronização (Fase 10 se apoia aqui).
 * Definido cedo para que ports/sync possa referenciá-lo sem acoplar implementação.
 */
export interface SyncManifest {
  schemaVersion: number;
  protocolVersion: number;
  appVersion: string;
  revision: number;
  parentRevision: number;
  deviceId: string;
  workspaceScope: string;
  createdAt: string;
  contentHash: string;
  encryptionVersion?: string;
}

export interface SyncPackage {
  manifest: SyncManifest;
  operations?: unknown[];
  snapshot?: Record<string, unknown>;
  tombstones?: Record<string, number>;
  contentHashes?: Record<string, string>;
  encryptionMetadata?: Record<string, unknown>;
  integritySignature?: string;
}

export interface MergeResult {
  conflicts: string[];
  applied: number;
}