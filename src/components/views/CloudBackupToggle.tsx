// Perfil — backup em nuvem (SPEC-M-024 D5).
//
// O switch usa o `ToggleRow` padrão do cecistudy (mesmo de Preferências), não um
// switch inline customizado. A configuração do PAT/abertura de repo acontece
// dentro de um `Modal` (mesmo padrão de export/import em `ProfileDataMaintenance`).
//
// Fluxo de setup único (roda só quando a usuária configura):
// 1. Usuária informa o PAT do GitHub.
// 2. App verifica se existe repo privado `cecistudy-sync` na conta.
// 3. Se não existir, cria um privado.
// 4. Se existir público → erro (não reconfigura automaticamente).
// 5. Salva owner + repo + token; o `GitHubSyncProvider` já existente usa esses
//    dados e faz CAS (compare-and-swap) a cada push — nunca cria repos
//    duplicados, nunca sobrescreve sem saber.
import React, { useState } from 'react';
import { Cloud, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { ToggleRow } from '../ui/ToggleRow';
import { useDataClient } from '../../context/DataClientProvider';
import { ensureSyncRepository } from '../../lib/githubRepoSetup';
import { frase, VAZIO } from '../../lib/voice';

export function CloudBackupToggle() {
  const { githubSyncConfig, configureGithubSync, clearGithubSync, syncStatus } = useDataClient();
  const [isEnabled, setIsEnabled] = useState(!!githubSyncConfig);
  const [configuring, setConfiguring] = useState(false);
  const [token, setToken] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);

  const handleToggle = () => {
    if (isEnabled) {
      clearGithubSync();
      setIsEnabled(false);
      setSetupError(null);
      setToken('');
    } else {
      setConfiguring(true);
      setSetupError(null);
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setSetupBusy(true);
    setSetupError(null);
    try {
      const ensured = await ensureSyncRepository(token, 'cecistudy-sync');
      configureGithubSync({ owner: ensured.owner, repo: ensured.repo, token });
      setIsEnabled(true);
      setConfiguring(false);
      setSetupError(null);
    } catch (e) {
      const err = e as { kind?: string; message?: string };
      if (err.kind === 'AUTH') {
        setSetupError('token inválido ou sem permissão para criar repositórios.');
      } else if (err.kind === 'REPO_PUBLIC') {
        setSetupError(err.message ?? 'repositório existente é público.');
      } else if (err.kind === 'NETWORK') {
        setSetupError('não consegui contatar o GitHub. tente novamente.');
      } else {
        setSetupError('não foi possível configurar o repositório de sincronização.');
      }
    } finally {
      setSetupBusy(false);
    }
  };

  const handleCancelConfig = () => {
    setConfiguring(false);
    setIsEnabled(!!githubSyncConfig);
    setSetupError(null);
    setToken('');
  };

  const statusDescription =
    syncStatus === 'synced'
      ? 'sincronizado ♡'
      : syncStatus === 'upToDate'
        ? 'tudo em dia.'
        : syncStatus === 'error'
          ? 'erro na última sincronização.'
          : syncStatus === 'checking' || syncStatus === 'syncing'
            ? 'sincronizando…'
            : '';

  return (
    <section
      aria-labelledby="perfil-backup-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />
        <h2 id="perfil-backup-titulo" className="font-display font-bold text-xl text-ceci-primary">
          backup em nuvem
        </h2>
      </div>

      <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
        opcional. desligado por padrão: seus dados ficam no dispositivo. ligue para enviar para seu
        próprio repositório privado no GitHub.
      </p>

      {/* Switch principal, padrão do cecistudy (ToggleRow). */}
      <ToggleRow
        icon={<ShieldAlert className="w-4 h-4 text-ceci-tertiary" />}
        label="sincronizar entre dispositivos"
        description={
          syncStatus && syncStatus !== 'idle'
            ? `${frase(VAZIO, 'rowSync')} — ${statusDescription}`
            : frase(VAZIO, 'rowSync')
        }
        checked={isEnabled}
        onChange={handleToggle}
        disabled={setupBusy}
      />

      {/* Modal de configuração (mesmo padrão de export/import). */}
      <Modal
        open={configuring && !githubSyncConfig}
        onClose={handleCancelConfig}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            configurar backup em nuvem
          </h3>
          <p className="text-sm text-ceci-secondary">
            informe seu token de acesso pessoal (PAT) do GitHub com permissão
            <code className="font-mono text-xs">repo</code>. o app acessa apenas seu repositório
            privado <code className="font-mono text-xs">cecistudy-sync</code>.
          </p>

          {setupError && (
            <p role="alert" className="text-xs text-status-danger-strong">
              {setupError}
            </p>
          )}

          <div className="space-y-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="cole seu PAT do GitHub"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
              disabled={setupBusy}
            />
            <p className="text-xs text-ceci-muted">
              o token é guardado apenas no seu dispositivo (Preferences) e usado somente para
              acessar seu repositório privado.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveConfig} disabled={setupBusy || !token} className="flex-1">
              {setupBusy ? 'configurando…' : 'ativar sync'}
            </Button>
            <Button variant="outline" onClick={handleCancelConfig} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {githubSyncConfig && (
        <p className="text-xs text-ceci-muted mt-2">
          repositório:{' '}
          <code className="font-mono text-xs">
            {githubSyncConfig.owner}/{githubSyncConfig.repo}
          </code>
          .
        </p>
      )}
    </section>
  );
}
