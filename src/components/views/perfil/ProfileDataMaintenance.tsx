// Perfil — "seus dados": manutenção em rows (SPEC-013 D1/D6; reestrutura
// `DataSection` e absorve a `OtaSection`).
//
// Sync vem **primeiro** (é a ação que protege tudo o resto), backup vira row, e o
// OTA — que só existe no nativo — entra como row condicionada ao `native` do view
// model, nunca a um `isNativePlatform` consultado dentro do componente (regra de
// fronteira do `check-boundaries.mjs`). Os modais de export/import/decrypt são os
// mesmos do `DataSection`, apenas reabrigados.
import React, { useRef, useState } from 'react';
import { Database, Download, RefreshCw, ShieldAlert, Smartphone, Upload } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { ProgressBar } from '../../ui/ProgressBar';
import { applyNow, checkForUpdates, formatVersionLabel, useOtaStatus } from '../../../lib/ota';
import type { EncryptedBackup } from '../../../lib/backupCrypto';
import type { ProfileMaintenance } from '../../../lib/profileViewModel';
import DangerZone from './DangerZone';
import PreferenceRow from './PreferenceRow';
import { CloudBackupToggle } from '../../views/CloudBackupToggle';
import { erro, VAZIO, frase } from '../../../lib/voice';

interface ProfileDataMaintenanceProps {
  maintenance: ProfileMaintenance;
  onOpenSync: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

interface PendingImport {
  json: string;
  meta: { format: string; schemaVersion: number | string; exportedAt: string };
}

const ProfileDataMaintenance: React.FC<ProfileDataMaintenanceProps> = ({
  maintenance,
  onOpenSync,
  onExport,
  onImport,
  onReset,
}) => {
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [pendingDecrypt, setPendingDecrypt] = useState<{ encrypted: EncryptedBackup; raw: string } | null>(
    null,
  );
  const [erroDescriptografar, setErroDescriptografar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ota = useOtaStatus();
  const otaBusy = ota.status === 'checking' || ota.status === 'downloading';
  const otaStatusText =
    ota.status === 'checking'
      ? 'procurando novidades…'
      : ota.status === 'downloading'
        ? `baixando atualização (${ota.progress}%)…`
        : ota.status === 'ready'
          ? `a versão ${ota.availableVersion} está pronta ♡`
          : ota.status === 'error'
            ? 'não consegui verificar agora — tenta de novo.'
            : ota.availableVersion && ota.availableVersion !== ota.currentVersion
              ? `novidade disponível: ${ota.availableVersion}`
              : 'tudo em dia ✨';

  const handleFileChosen = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result);
      try {
        const parsed = JSON.parse(json);
        if (parsed.v === 1 && parsed.alg === 'AES-GCM' && parsed.salt && parsed.iv && parsed.data) {
          setPendingDecrypt({ encrypted: parsed, raw: json });
          return;
        }
        setPendingImport({
          json,
          meta: {
            format: parsed.format ?? 'desconhecido',
            schemaVersion: parsed.schemaVersion ?? parsed.userSchemaVersion ?? 'n/a',
            exportedAt: parsed.exportedAt ?? 'n/a',
          },
        });
      } catch {
        onImport(json);
      }
    };
    reader.readAsText(file);
  };

  return (
    <section
      aria-labelledby="perfil-dados-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-ceci-academic-strong" aria-hidden="true" />
        <h2 id="perfil-dados-titulo" className="font-display font-bold text-xl text-ceci-primary">
          seus dados
        </h2>
      </div>

      <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
        tudo fica guardado só no seu dispositivo. faça um backup para migrar ou comece de novo
        quando quiser ♡
      </p>

      {/* Sync primeiro: é a ação que protege todo o resto (SPEC-013 D6). */}
      <PreferenceRow
        icon={<RefreshCw className="w-4 h-4" />}
        label="sincronizar entre dispositivos"
        description={frase(VAZIO, 'rowSync')}
        ariaLabel="sincronizar entre dispositivos. abrir a tela de sincronização."
        onClick={onOpenSync}
      />

      <PreferenceRow
        icon={<Download className="w-4 h-4" />}
        label="exportar backup"
        description={frase(VAZIO, 'rowBackup')}
        ariaLabel="exportar backup do cantinho."
        onClick={() => setShowExportPassword(true)}
      />

      <PreferenceRow
        icon={<Upload className="w-4 h-4" />}
        label="importar backup"
        description={frase(VAZIO, 'rowRestaurar')}
        ariaLabel="importar backup de um arquivo."
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
          e.target.value = '';
        }}
      />

      {maintenance.native ? (
        <div className="space-y-1">
          <PreferenceRow
            icon={<Smartphone className="w-4 h-4" />}
            label="atualização do app"
            description={otaStatusText}
            value={formatVersionLabel(ota.currentVersion)}
            ariaLabel={`atualização do app, versão ${formatVersionLabel(
              ota.currentVersion,
            )}. ${otaStatusText}`}
            onClick={() =>
              void (ota.status === 'ready' ? applyNow() : checkForUpdates({ manual: true }))
            }
          />
          {ota.status === 'downloading' ? (
            <div className="pl-16 pr-3 pb-1">
              <ProgressBar value={ota.progress} className="h-2" />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Backup em nuvem opcional — desligado por padrão (SPEC-M-024 D5). */}
      <CloudBackupToggle />

      <Modal open={showExportPassword} onClose={() => setShowExportPassword(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">exportar backup</h3>
          <p className="text-sm text-ceci-secondary">
            opcional: defina uma senha para criptografar o backup. deixe em branco para não
            criptografar.
          </p>
          <input
            type="password"
            value={exportPassword}
            onChange={(e) => setExportPassword(e.target.value)}
            placeholder="senha opcional"
            className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
          />
          <p className="text-xs text-status-danger-strong mt-1">
            <ShieldAlert className="w-3 h-3 shrink-0 mr-1" aria-hidden="true" />
            se perder essa senha, não dá para recuperar o backup. guarde-a ou
            deixe em branco para exportar sem criptografia.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowExportPassword(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExportPassword(false);
                setExportPassword('');
                onExport();
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer"
            >
              exportar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!pendingImport} onClose={() => setPendingImport(null)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">importar backup?</h3>
          {pendingImport && (
            <>
              <p className="text-sm text-ceci-secondary leading-relaxed mb-4">
                formato: <span className="font-mono">{pendingImport.meta.format}</span>
                <br />
                schema: <span className="font-mono">{pendingImport.meta.schemaVersion}</span>
                <br />
                exportado em: <span className="font-mono">{pendingImport.meta.exportedAt}</span>
              </p>
              <p className="text-xs text-ceci-muted mb-5">
                isso substitui os dados atuais. você pode fazer um backup antes ♡
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingImport) {
                      onImport(pendingImport.json);
                      setPendingImport(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer active:scale-95 transition-transform"
                >
                  importar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={!!pendingDecrypt}
        onClose={() => {
          setPendingDecrypt(null);
          setImportPassword('');
          setErroDescriptografar(null);
        }}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">backup criptografado</h3>
          <p className="text-sm text-ceci-secondary">
            esse backup está protegido por senha. digite a senha para descriptografar.
          </p>
          <input
            type="password"
            value={importPassword}
            onChange={(e) => setImportPassword(e.target.value)}
            placeholder="senha"
            className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
          />
          {erroDescriptografar ? (
            <p role="alert" className="text-xs text-status-danger-strong">
              {erroDescriptografar}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingDecrypt(null);
                setImportPassword('');
                setErroDescriptografar(null);
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!pendingDecrypt) return;
                try {
                  const { decryptBackup } = await import('../../../lib/backupCrypto');
                  const plain = await decryptBackup(pendingDecrypt.encrypted, importPassword);
                  onImport(plain);
                  setPendingDecrypt(null);
                  setImportPassword('');
                  setErroDescriptografar(null);
                } catch {
                  // `window.alert` foi removido aqui: era a única superfície do app
                  // que ignorava o sistema visual da marca (`SPEC-M-018` D19).
                  setErroDescriptografar(erro('senhaInvalida'));
                }
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer"
            >
              descriptografar
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset isolado em zona de cuidado (SPEC-013 D6): a única ação destrutiva
          da tela mora sozinha, com tinta de aviso, longe das rows do dia a dia. */}
      <DangerZone onReset={onReset} />
    </section>
  );
};

export default ProfileDataMaintenance;
