import React, { useState } from 'react';
import { Smartphone, RefreshCw } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  desktopCheckForUpdate,
  desktopDownloadAndInstallUpdate,
  desktopRelaunch,
} from '../../../apps/desktop/lib/desktop';

/** Card de atualização no desktop (Tauri updater via GitHub Releases).
 *  Vive em `src/desktop` (camada desktop) e é injetado no perfil via
 *  `shellExtras.updateSection` — a view compartilhada não sabe da plataforma. */
export const DesktopUpdateSection: React.FC = () => {
  const { showToast } = useDesktopApp();
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error'>('idle');
  const [version, setVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const busy = status === 'checking' || status === 'downloading';

  const check = async () => {
    setStatus('checking');
    try {
      const info = await desktopCheckForUpdate();
      if (info) {
        setVersion(info.version);
        setStatus('ready');
      } else {
        showToast('tudo em dia ✨');
        setStatus('idle');
      }
    } catch {
      setStatus('error');
    }
  };

  const install = async () => {
    setStatus('downloading');
    setProgress(0);
    try {
      await desktopDownloadAndInstallUpdate(setProgress);
      showToast('atualização instalada ♡ reiniciando…');
      setTimeout(() => void desktopRelaunch(), 1200);
    } catch {
      setStatus('error');
    }
  };

  const statusText =
    status === 'checking'
      ? 'procurando novidades…'
      : status === 'downloading'
        ? `baixando atualização (${progress}%)…`
        : status === 'ready'
          ? version
            ? `a versão ${version} está pronta ♡`
            : 'atualização disponível ♡'
          : status === 'error'
            ? 'não consegui verificar agora — tenta de novo.'
            : 'tudo em dia ✨';

  return (
    <div className="rounded-2xl p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-ceci-academic-strong" />
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          atualização do app
        </h2>
      </div>

      <div className="rounded-2xl p-4 border bg-surface-blue border-ceci-border-academic space-y-3">
        <div>
          <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">
            {statusText}
          </p>
        </div>

        {status === 'downloading' && <ProgressBar value={progress} className="h-2" />}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void check()}
            disabled={busy}
            className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-primary px-4 py-2.5 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
            verificar atualização
          </button>

          {status === 'ready' && (
            <button
              onClick={() => void install()}
              className="flex items-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-4 py-2.5 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer transition-colors"
            >
              baixar e instalar
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-ceci-tertiary -mt-1">
        o cantinho se atualiza sozinho pelo github releases; instalar pode pedir para reiniciar o app.
      </p>
    </div>
  );
};
