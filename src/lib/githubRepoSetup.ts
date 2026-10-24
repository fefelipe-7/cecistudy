/**
 * GitHubRepositorySetup — garante a existência de um repositório privado para
 * sincronização do cecistudy (SPEC-M-024 D5).
 *
 * Fluxo de **setup único** (executa só quando a usuária configura o sync):
 *
 * 1. Dado um PAT (token de acesso pessoal), lista os repositórios da conta.
 * 2. Procura um repositório com o nome esperado (`cecistudy-sync`).
 * 3. Se existir e for privado → usa ele (owner + repo).
 * 4. Se não existir → cria um repositório privado com esse nome (POST /user/repos).
 * 5. Se existir mas for público → erro (não reconfiguramos automaticamente para
 *    evitar expor dados sem intenção da usuária).
 *
 * Isso roda **uma única vez**, no momento da configuração. Nunca a cada push,
 * nunca em segundo plano. O resultado (owner + repo) é salvo em
 * `githubSyncConfig` e reutilizado em todos os syncs seguintes.
 *
 * Usa apenas `fetch` global — sem acoplamento a frameworks de UI ou runtime.
 */

export interface GitHubRepositoryEnsured {
  owner: string;
  repo: string;
  private: boolean;
}

export interface GitHubRepositorySetupError {
  kind: 'AUTH' | 'NETWORK' | 'UNKNOWN' | 'REPO_PUBLIC';
  message: string;
}

const REPO_NAME = 'cecistudy-sync';

/**
 * Cabeçalhos de autenticação para a API do GitHub.
 */
function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Mapeia erros de resposta da API do GitHub para o tipo de erro do setup.
 */
function mapSetupError(status: number, body?: string): GitHubRepositorySetupError {
  if (status === 401 || status === 403) {
    return { kind: 'AUTH', message: 'token inválido ou sem permissão' };
  }
  if (status === 403 && body && body.includes('rate limit')) {
    return { kind: 'NETWORK', message: 'limite de requisições do GitHub excedido' };
  }
  return { kind: 'UNKNOWN', message: `github ${status}` };
}

/**
 * Lista todos os repositórios do usuário autenticado (com paginação).
 * Retorna apenas nomes privados por simplicidade, mas traz tudo para checar
 * se o nome esperado já existe (público ou privado).
 */
async function listUserRepos(
  token: string,
): Promise<Array<{ name: string; private: boolean; owner: string }>> {
  const repos: Array<{ name: string; private: boolean; owner: string }> = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&direction=desc`;
    let res: Response;
    try {
      res = await fetch(url, { headers: authHeaders(token) });
    } catch (e) {
      throw { kind: 'NETWORK', message: (e as Error).message } as GitHubRepositorySetupError;
    }
    if (!res.ok) throw mapSetupError(res.status);

    const pageData = (await res.json()) as Array<{
      name: string;
      private: boolean;
      owner: { login: string };
    }>;
    if (!pageData || pageData.length === 0) break;

    for (const r of pageData) {
      repos.push({ name: r.name, private: r.private, owner: r.owner.login });
    }

    // Se vier menos que 100, é a última página.
    if (pageData.length < 100) break;
    page += 1;

    // Limite de segurança para não looping infinito.
    if (page > 10) break;
  }

  return repos;
}

/**
 * Cria um repositório privado autenticado pelo usuário.
 */
async function createPrivateRepo(
  token: string,
  name: string,
): Promise<{ owner: string; repo: string }> {
  let res: Response;
  try {
    res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        name,
        private: true,
        description: 'cecistudy ♡ — sincronização de backup (apenas dados do usuário)',
        auto_init: false,
      }),
    });
  } catch (e) {
    throw { kind: 'NETWORK', message: (e as Error).message } as GitHubRepositorySetupError;
  }
  if (!res.ok) throw mapSetupError(res.status);
  const data = (await res.json()) as { owner: { login: string }; name: string };
  return { owner: data.owner.login, repo: data.name };
}

/**
 * Garante que o repositório de sincronização exista e seja privado.
 *
 * - Se já existir um `cecistudy-sync` privado na conta → retorna seus dados.
 * - Se não existir → cria um privado e retorna.
 * - Se existir mas for público → lança erro `REPO_PUBLIC`.
 *
 * É responsabilidade do chamador (UI) exibir o erro para a usuária e não
 * prosseguir com o sync se falhar.
 */
export async function ensureSyncRepository(
  token: string,
  repoName: string = REPO_NAME,
): Promise<GitHubRepositoryEnsured> {
  const repos = await listUserRepos(token);

  const existing = repos.find((r) => r.name === repoName);
  if (existing) {
    if (!existing.private) {
      throw {
        kind: 'REPO_PUBLIC',
        message: `o repositório "${repoName}" já existe mas é público. torne-o privado ou use outro nome.`,
      } as GitHubRepositorySetupError;
    }
    return { owner: existing.owner, repo: existing.name, private: true };
  }

  const created = await createPrivateRepo(token, repoName);
  return { owner: created.owner, repo: created.repo, private: true };
}
