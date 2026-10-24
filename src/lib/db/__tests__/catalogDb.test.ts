/**
 * Teste de `catalogDb.ts` — D3: o banco do catálogo se auto-atualiza quando o
 * bundle traz `content_hash` diferente do armazenado.
 *
 * Testa `bootstrapCatalogDbForTests` com um `sqlite` mocado, sem depender do
 * import dinâmico de `@capacitor-community/sqlite`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../../storage.ts';
import {
  bootstrapCatalogDbForTests,
  resetCatalogDbCache,
} from '../catalogDb.ts';

const mockIsDBExists = vi.fn();
const mockCopyFromAssets = vi.fn();
const mockCreateConnection = vi.fn();
const mockOpen = vi.fn();
const mockClose = vi.fn();
const mockQuery = vi.fn();
const mockRun = vi.fn();
const mockExec = vi.fn();

const mockSqlite = {
  isDBExists: mockIsDBExists,
  copyFromAssets: mockCopyFromAssets,
  createConnection: mockCreateConnection,
  open: mockOpen,
  close: mockClose,
  query: mockQuery,
  run: mockRun,
  execute: mockExec,
};

function mockCatalogRelease(contentHash: string | null): void {
  mockQuery.mockResolvedValue({
    values: contentHash ? [{ content_hash: contentHash }] : [],
  });
}

describe('catalogDb — auto-atualização por content_hash (D3)', () => {
  beforeEach(() => {
    resetCatalogDbCache();
    localStorage.clear();
    mockIsDBExists.mockResolvedValue({ value: false });
    mockCopyFromAssets.mockResolvedValue(undefined);
    mockCreateConnection.mockResolvedValue(undefined);
    mockOpen.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockRun.mockResolvedValue(undefined);
    mockExec.mockResolvedValue(undefined);
  });

  it('não chama copyFromAssets quando o banco já existe e o hash não mudou', async () => {
    mockIsDBExists.mockResolvedValue({ value: true });
    mockCatalogRelease('hash-abc');
    await storage.set('catalog_content_hash', 'hash-abc');

    await bootstrapCatalogDbForTests(mockSqlite);

    expect(mockCopyFromAssets).not.toHaveBeenCalled();
  });

  it('chama copyFromAssets com overwrite:true quando o hash mudou (OTA)', async () => {
    mockIsDBExists.mockResolvedValue({ value: true });
    mockCatalogRelease('hash-novo');
    await storage.set('catalog_content_hash', 'hash-velho');

    await bootstrapCatalogDbForTests(mockSqlite);

    expect(mockCopyFromAssets).toHaveBeenCalledWith({ overwrite: true });
  });

  it('chama copyFromAssets com overwrite:false quando o banco não existe ainda', async () => {
    mockIsDBExists.mockResolvedValue({ value: false });
    mockCatalogRelease('hash-abc');

    await bootstrapCatalogDbForTests(mockSqlite);

    expect(mockCopyFromAssets).toHaveBeenCalledWith({ overwrite: false });
  });

  it('salva o content_hash lido do banco', async () => {
    mockIsDBExists.mockResolvedValue({ value: true });
    mockCatalogRelease('hash-xyz');

    await bootstrapCatalogDbForTests(mockSqlite);

    const stored = await storage.get('catalog_content_hash');
    expect(stored).toBe('hash-xyz');
  });
});
