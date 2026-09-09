import type { SyncManifest, SyncPackage, MergeResult } from '@/core/serialization';

export interface RemoteManifest {
  revision: number;
  appVersion: string;
  protocolVersion: number;
  createdAt: string;
}

export interface UploadPackageInput {
  manifest: SyncManifest;
  data: Uint8Array;
}

/**
 * Provider de transporte/sincronização (GitHub, P2P, futuros). Conhece transporte e
 * armazenamento remoto, mas NÃO a lógica de merge (essa é do SyncEngine).
 */
export interface SyncProvider {
  inspectRemote(): Promise<RemoteManifest>;
  downloadPackage(ref: string): Promise<Uint8Array>;
  uploadPackage(input: UploadPackageInput): Promise<RemoteManifest>;
  listRevisions(): Promise<RemoteManifest[]>;
  getMetadata(): Promise<{ name: string }>;
}

export type RevisionComparison = 'ahead' | 'behind' | 'equal';

/**
 * Engine de sincronização: dono do protocolo, revisão, merge, conflitos e aplicação.
 * Independente de provider (GitHub/P2P/Blob).
 */
export interface SyncEngine {
  inspectRemote(): Promise<RemoteManifest>;
  checkRevision(remote: number): RevisionComparison;
  createPackage(): Promise<SyncPackage>;
  merge(theirs: SyncPackage): Promise<MergeResult>;
  preview(theirs: SyncPackage): Promise<unknown>;
  resolveConflict(id: string, take: 'local' | 'remote' | 'merge'): Promise<void>;
  apply(): Promise<void>;
}