import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubSyncProvider } from '../providers/github';
import type { GitHubSyncConfig } from '../providers/github';
import type { SyncManifest, SyncPackage } from '../provider';

function makeManifest(revision: number): SyncManifest {
  return {
    schemaVersion: 10,
    protocolVersion: 1,
    appVersion: '1.0.0',
    revision,
    deviceId: 'notebook',
    workspaceScope: 'default',
    parentRevision: revision > 1 ? revision - 1 : null,
    contentHash: 'abc123',
    createdAt: new Date().toISOString(),
  };
}

function makePackage(revision: number): SyncPackage {
  return { manifest: makeManifest(revision), snapshot: { profile: { name: 'ceci' } } };
}

/** Servidor GitHub fake em memória, controlado pelo teste. */
function fakeGitHub(opts: {
  initial?: { pkg: SyncPackage; sha: string };
  authOk?: boolean;
}) {
  let store: { pkg: SyncPackage; sha: string } | null = opts.initial ?? null;
  const calls: Array<{ method: string }> = [];
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push({ method });
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    if (!opts.authOk) {
      return new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 });
    }
    if (method === 'GET') {
      if (!store) return new Response('', { status: 404 });
      return new Response(
        JSON.stringify({
          content: Buffer.from(JSON.stringify(store.pkg)).toString('base64'),
          sha: store.sha,
        }),
        { status: 200 },
      );
    }
    if (method === 'PUT') {
      if (body?.sha && body.sha !== store?.sha) {
        return new Response(JSON.stringify({ message: 'sha mismatch' }), { status: 409 });
      }
      const newSha = `sha-${store ? store.sha.length + 1 : 1}`;
      store = {
        pkg: body.content ? JSON.parse(atob(body.content)) : store!.pkg,
        sha: newSha,
      };
      return new Response(
        JSON.stringify({ sha: newSha, content: { sha: newSha } }),
        { status: 200 },
      );
    }
    return new Response('', { status: 405 });
  });
  return { fetchMock, getCalls: () => calls, getStore: () => store };
}

function makeProvider(cfg: Partial<GitHubSyncConfig> = {}) {
  return new GitHubSyncProvider({
    owner: 'fefelipe-7',
    repo: 'cecistudy-sync',
    getToken: () => 'ghp_test',
    ...cfg,
  });
}

describe('GitHubSyncProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('retorna null quando não há pacote remoto (404)', async () => {
    const { fetchMock } = fakeGitHub({ authOk: true });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    expect(await p.getManifest()).toBeNull();
    expect(await p.downloadPackage()).toBeNull();
  });

  it('baixa pacote remoto e decodifica o snapshot', async () => {
    const { fetchMock } = fakeGitHub({ initial: { pkg: makePackage(3), sha: 's3' }, authOk: true });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    const remote = await p.downloadPackage();
    expect(remote?.sha).toBe('s3');
    expect(remote?.package.manifest.revision).toBe(3);
    expect(
      (remote?.package.snapshot as { profile: { name: string } }).profile.name,
    ).toBe('ceci');
  });

  it('sobe pacote novo (sem sha) e retorna nova revisão', async () => {
    const { fetchMock } = fakeGitHub({ authOk: true });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    const res = await p.uploadPackage(makePackage(1));
    expect(res.revision).toBe(1);
    expect(res.sha).toBe('sha-1');
  });

  it('atualiza pacote com sha base correto (CAS ok)', async () => {
    const { fetchMock } = fakeGitHub({ initial: { pkg: makePackage(2), sha: 's2' }, authOk: true });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    const res = await p.uploadPackage(makePackage(3), 's2');
    expect(res.revision).toBe(3);
  });

  it('recusa upload quando o sha base está obsoleto (409 → REMOTE_CHANGED)', async () => {
    const { fetchMock } = fakeGitHub({ initial: { pkg: makePackage(2), sha: 's2' }, authOk: true });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    await expect(p.uploadPackage(makePackage(3), 'stale')).rejects.toMatchObject({
      kind: 'REMOTE_CHANGED',
    });
  });

  it('erro 401 vira SyncProviderError AUTH', async () => {
    const { fetchMock } = fakeGitHub({ authOk: false });
    vi.stubGlobal('fetch', fetchMock);
    const p = makeProvider();
    await expect(p.downloadPackage()).rejects.toMatchObject({ kind: 'AUTH' });
  });
});
