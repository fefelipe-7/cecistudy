import { describe, expect, it } from 'vitest';
import {
  SyncProviderError,
  hashContent,
  SYNC_PROTOCOL_VERSION,
  type RemotePackage,
  type SyncManifest,
  type SyncPackage,
  type SyncProvider,
} from '../provider';

/** Provider em memória para validar o contrato sem rede. */
class InMemoryProvider implements SyncProvider {
  private pkg: RemotePackage | null = null;
  public failUpload = false;

  async getManifest(): Promise<SyncManifest | null> {
    return this.pkg?.package.manifest ?? null;
  }
  async downloadPackage(): Promise<RemotePackage | null> {
    return this.pkg;
  }
  async uploadPackage(
    pkg: SyncPackage,
    _baseSha?: string,
  ): Promise<{ revision: number; sha: string }> {
    if (this.failUpload) {
      throw new SyncProviderError('REMOTE_CHANGED', 'simulado');
    }
    const sha = `sha-${pkg.manifest.revision}`;
    this.pkg = { package: pkg, sha };
    return { revision: pkg.manifest.revision, sha };
  }
}

describe('SyncProvider contract', () => {
  it('SYNC_PROTOCOL_VERSION é 1', () => {
    expect(SYNC_PROTOCOL_VERSION).toBe(1);
  });

  it('hashContent é estável e sensível', () => {
    expect(hashContent('abc')).toBe(hashContent('abc'));
    expect(hashContent('abc')).not.toBe(hashContent('abd'));
  });

  it('provider implementa o contrato de upload/download/manifest', async () => {
    const p = new InMemoryProvider();
    expect(await p.getManifest()).toBeNull();
    expect(await p.downloadPackage()).toBeNull();

    const manifest: SyncManifest = {
      schemaVersion: 10,
      protocolVersion: 1,
      appVersion: '1.0.0',
      revision: 1,
      deviceId: 'notebook',
      workspaceScope: 'default',
      parentRevision: null,
      contentHash: 'deadbeef',
      createdAt: new Date().toISOString(),
    };
    const pkg: SyncPackage = { manifest, snapshot: { profile: {} } };
    const res = await p.uploadPackage(pkg);
    expect(res.revision).toBe(1);
    expect(res.sha).toBe('sha-1');
    expect((await p.getManifest())?.revision).toBe(1);
    expect((await p.downloadPackage())?.package.manifest.revision).toBe(1);
  });

  it('SyncProviderError carrega o kind', () => {
    const e = new SyncProviderError('AUTH', 'sem token');
    expect(e.kind).toBe('AUTH');
    expect(e.name).toBe('SyncProviderError');
  });
});
