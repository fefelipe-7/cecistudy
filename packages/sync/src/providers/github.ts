/**
 * GitHubSyncProvider — primeiro provedor de sincronização do cecistudy.
 *
 * Armazena UM arquivo (`cecistudy/sync-package.json`) num repositório privado
 * do usuário. O GitHub NÃO é o banco: guardamos apenas o SyncPackage (snapshot
 * do domínio + manifesto). O CAS (compare-and-swap) usa o `sha` do blob que a
 * própria Contents API exige no PUT — se o remoto mudou, ela responde 409 e nós
 * recusamos o upload (REMOTE_CHANGED).
 *
 * Credenciais: o token NUNCA é hardcoded. Chega via `getToken()` (injetado pelo
 * shell a partir de storage seguro). Este arquivo vive em `packages/sync` e só
 * usa `fetch` global — sem acoplamento a frameworks de UI ou runtime nativo.
 */

import {
  SyncProviderError,
  type RemotePackage,
  type SyncManifest,
  type SyncPackage,
  type SyncProvider,
} from '../provider';

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  /** Resolve o token em runtime (PAT da usuária). Nunca embaralhado no bundle. */
  getToken: () => string | Promise<string>;
  /** Caminho do arquivo dentro do repo. Default: cecistudy/sync-package.json */
  path?: string;
}

const DEFAULT_PATH = 'cecistudy/sync-package.json';

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

interface GitHubContentResponse {
  content?: string;
  sha?: string;
  message?: string;
}

export class GitHubSyncProvider implements SyncProvider {
  private readonly path: string;

  constructor(private readonly config: GitHubSyncConfig) {
    this.path = config.path ?? DEFAULT_PATH;
  }

  private apiUrl(): string {
    return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.path}`;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.config.getToken();
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private mapError(status: number, message?: string): SyncProviderError {
    if (status === 401 || status === 403) {
      return new SyncProviderError('AUTH', message ?? 'token inválido ou sem acesso');
    }
    if (status === 409) {
      return new SyncProviderError('REMOTE_CHANGED', 'o remoto mudou desde a última leitura');
    }
    return new SyncProviderError('UNKNOWN', message ?? `github ${status}`);
  }

  async getManifest(): Promise<SyncManifest | null> {
    const remote = await this.downloadPackage();
    return remote?.package.manifest ?? null;
  }

  async downloadPackage(): Promise<RemotePackage | null> {
    let res: Response;
    try {
      res = await fetch(this.apiUrl(), { headers: await this.headers() });
    } catch (e) {
      throw new SyncProviderError('NETWORK', (e as Error).message);
    }
    if (res.status === 404) return null;
    if (!res.ok) throw this.mapError(res.status);
    const data = (await res.json()) as GitHubContentResponse;
    if (!data.content || !data.sha) {
      throw new SyncProviderError('UNKNOWN', 'resposta sem conteúdo/sha');
    }
    const pkg = JSON.parse(fromBase64(data.content)) as SyncPackage;
    return { package: pkg, sha: data.sha };
  }

  async uploadPackage(
    pkg: SyncPackage,
    baseSha?: string,
  ): Promise<{ revision: number; sha: string }> {
    const body = JSON.stringify({
      message: `cecistudy sync r${pkg.manifest.revision}`,
      content: toBase64(JSON.stringify(pkg)),
      ...(baseSha ? { sha: baseSha } : {}),
    });
    let res: Response;
    try {
      res = await fetch(this.apiUrl(), {
        method: 'PUT',
        headers: await this.headers(),
        body,
      });
    } catch (e) {
      throw new SyncProviderError('NETWORK', (e as Error).message);
    }
    if (!res.ok) throw this.mapError(res.status);
    const data = (await res.json()) as GitHubContentResponse;
    if (!data.sha) throw new SyncProviderError('UNKNOWN', 'upload sem sha de retorno');
    return { revision: pkg.manifest.revision, sha: data.sha };
  }
}
