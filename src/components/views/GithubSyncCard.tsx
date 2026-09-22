import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Modal } from '../ui/Modal';

type MergeStatsSide = { added: number; updated: number; removed: number };

function StatLine({ label, stat }: { label: string; stat: MergeStatsSide }) {
  return (
    <div className="flex items-center justify-between text-xs text-ceci-secondary">
      <span>{label}</span>
      <span className="font-semibold text-ceci-primary">
        +{stat.added} ~{stat.updated} -{stat.removed}
      </span>
    </div>
  );
}

function StatusBadge({ status, errorMessage }: { status: string; errorMessage: string | null }) {
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-status-danger-strong">
        <AlertCircle className="w-3.5 h-3.5" /> {errorMessage ?? 'algo deu errado'}
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ceci-academic-strong">
        <CheckCircle2 className="w-3.5 h-3.5" /> sincronizado
      </span>
    );
  }
  if (status === 'upToDate') {
    return <span className="text-xs text-ceci-secondary">em dia</span>;
  }
  if (status === 'checking' || status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ceci-secondary">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> verificando
      </span>
    );
  }
  return <span className="text-xs text-ceci-muted">desconectado</span>;
}

export function GithubSyncCard() {
  const {
    githubSyncConfig,
    syncStatus,
    syncErrorMessage,
    pendingSyncPreview,
    syncNow,
    configureGithubSync,
    clearGithubSync,
    applySyncPreview,
    discardSyncPreview,
  } = useMobileApp();

  const [owner, setOwner] = useState(githubSyncConfig?.owner ?? '');
  const [repo, setRepo] = useState(githubSyncConfig?.repo ?? '');
  const [token, setToken] = useState(githubSyncConfig?.token ?? '');

  const connect = () => {
    if (!owner.trim() || !repo.trim() || !token.trim()) return;
    configureGithubSync({ owner: owner.trim(), repo: repo.trim(), token: token.trim() });
  };

  return (
    <>
      <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-brand shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-ceci-brand-strong" />
          <h2 className="font-display font-bold text-xl text-ceci-primary">sincronização (github)</h2>
        </div>
        <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
          conecta seu notebook e seu celular por um repositório privado. seus dados ficam no
          dispositivo e no github — e nunca em lugar nenhum além disso ♡
        </p>

        {!githubSyncConfig ? (
          <div className="space-y-2.5">
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="dono do repo (ex.: seu-usuario)"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs text-ceci-primary bg-surface-subtle focus:outline-none focus:border-ceci-border-brand"
            />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="repo (ex.: cecistudy-sync)"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs text-ceci-primary bg-surface-subtle focus:outline-none focus:border-ceci-border-brand"
            />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="token do github (PAT, repo scope)"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs text-ceci-primary bg-surface-subtle focus:outline-none focus:border-ceci-border-brand"
            />
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-2 bg-ceci-brand text-ceci-on-brand px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              <Cloud className="w-4 h-4" /> conectar e sincronizar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ceci-secondary">
                conectado: <span className="text-ceci-primary font-semibold">{owner}/{repo}</span>
              </span>
              <StatusBadge status={syncStatus} errorMessage={syncErrorMessage} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={syncNow}
                className="flex items-center justify-center gap-2 bg-ceci-academic-strong text-ceci-on-academic px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
              >
                <RefreshCw className="w-4 h-4" /> sincronizar agora
              </button>
              <button
                onClick={clearGithubSync}
                className="flex items-center justify-center gap-2 bg-surface-default border border-ceci-border-default text-ceci-secondary px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
              >
                <CloudOff className="w-4 h-4" /> desconectar
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={pendingSyncPreview != null} onClose={discardSyncPreview}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">ha uma versao mais nova</h3>
          <p className="text-sm text-ceci-secondary leading-relaxed">
            seu outro dispositivo enviou mudancas. quer mesclar com o que voce tem aqui?
          </p>
          {pendingSyncPreview && (
            <div className="rounded-2xl bg-surface-subtle border border-ceci-border-default p-3 space-y-1.5">
              <StatLine label="o que chega para voce" stat={pendingSyncPreview.preview.local} />
              <StatLine label="o que vai para o outro lado" stat={pendingSyncPreview.preview.remote} />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={discardSyncPreview}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
            >
              depois
            </button>
            <button
              onClick={applySyncPreview}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer active:scale-95 transition-transform"
            >
              mesclar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
