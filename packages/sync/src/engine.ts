/**
 * SyncEngine — orquestrador independente de provider.
 *
 * Concentra inspeção de revisão, criação de pacote, merge (reutilizando o
 * `mergeSyncedDatabases` determinístico já existente), preview e upload.
 * NÃO conhece a API do GitHub: só fala com a interface `SyncProvider` e com
 * injeções puras de serialização (`parseBackup`/`stringifyBackup`), fornecidas
 * pelo AppContext. Assim o provider pode ser trocado (WebDAV/S3/P2P) sem tocar
 * nesta camada.
 */

import { mergeSyncedDatabases, type MergeStatsSide, type SyncableDatabase } from './merge';
import {
  SYNC_PROTOCOL_VERSION,
  SyncProviderError,
  hashContent,
  type SyncManifest,
  type SyncPackage,
  type SyncProvider,
} from './provider';

/** Injeções puras de (de)serialização do domínio — evitam acoplar packages/sync ao BackupV2. */
export interface SyncEngineDeps {
  deviceId: string;
  appVersion: string;
  schemaVersion: number;
  workspaceScope?: string;
  parseBackup(json: string): Promise<SyncableDatabase | null>;
  stringifyBackup(db: SyncableDatabase): string;
}

/** Ponto de controle de sincronização persistido localmente (fora do domínio). */
export interface SyncCheckpoint {
  baseRevision: number;
  baseBlobSha: string | null;
  lastSyncAt: string | null;
  lastDeviceId: string | null;
  lastLocalMaxStamp: number;
}

export const INITIAL_CHECKPOINT: SyncCheckpoint = {
  baseRevision: 0,
  baseBlobSha: null,
  lastSyncAt: null,
  lastDeviceId: null,
  lastLocalMaxStamp: 0,
};

export interface SyncPreview {
  local: MergeStatsSide;
  remote: MergeStatsSide;
}

export interface PullResult {
  mergedJson: string;
  preview: SyncPreview;
  remoteManifest: SyncManifest;
  remoteSha: string;
}

export class SyncEngine {
  constructor(
    private readonly provider: SyncProvider,
    private readonly deps: SyncEngineDeps,
  ) {}

  /** Verifica se há pacote remoto e sua revisão. */
  async inspect(): Promise<{ hasRemote: boolean; manifest: SyncManifest | null }> {
    const manifest = await this.provider.getManifest();
    return { hasRemote: manifest != null, manifest };
  }

  /** Verdadeiro se o local mudou desde o último sync (stamp maior que o checkpoint). */
  needsUpload(checkpoint: SyncCheckpoint, localMaxStamp: number): boolean {
    return localMaxStamp > checkpoint.lastLocalMaxStamp;
  }

  /** Baixa o remoto, funde com o local e devolve o JSON mesclado + preview. */
  async pullAndMerge(localJson: string): Promise<PullResult> {
    const remote = await this.provider.downloadPackage();
    if (!remote) throw new SyncProviderError('NOT_FOUND', 'sem pacote remoto');
    const [localDb, remoteDb] = await Promise.all([
      this.deps.parseBackup(localJson),
      this.deps.parseBackup(JSON.stringify(remote.package.snapshot)),
    ]);
    if (!localDb || !remoteDb) throw new SyncProviderError('UNKNOWN', 'backup inválido');
    const result = mergeSyncedDatabases(localDb, remoteDb);
    return {
      mergedJson: this.deps.stringifyBackup(result.merged),
      preview: { local: result.local, remote: result.remote },
      remoteManifest: remote.package.manifest,
      remoteSha: remote.sha,
    };
  }

  /** Sobe o pacote local. revision = base+1; CAS via baseBlobSha. */
  async push(
    localJson: string,
    checkpoint: SyncCheckpoint,
  ): Promise<{ checkpoint: SyncCheckpoint; sha: string; revision: number }> {
    const revision = checkpoint.baseRevision + 1;
    const manifest: SyncManifest = {
      schemaVersion: this.deps.schemaVersion,
      protocolVersion: SYNC_PROTOCOL_VERSION,
      appVersion: this.deps.appVersion,
      revision,
      deviceId: this.deps.deviceId,
      workspaceScope: this.deps.workspaceScope ?? 'default',
      parentRevision: checkpoint.baseRevision,
      contentHash: hashContent(localJson),
      createdAt: new Date().toISOString(),
    };
    const pkg: SyncPackage = { manifest, snapshot: JSON.parse(localJson) };
    const { sha } = await this.provider.uploadPackage(pkg, checkpoint.baseBlobSha ?? undefined);
    const next: SyncCheckpoint = {
      ...checkpoint,
      baseRevision: revision,
      baseBlobSha: sha,
      lastSyncAt: manifest.createdAt,
      lastDeviceId: this.deps.deviceId,
    };
    return { checkpoint: next, sha, revision };
  }
}
