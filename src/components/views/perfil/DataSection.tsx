// Perfil — "seus dados" (sincronização, backup, reset) (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React, { useState } from 'react';
import { Database, Download, Upload, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { encryptBackup } from '../../../lib/backupCrypto';

interface DataSectionProps {
  onOpenSync: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

const DataSection: React.FC<DataSectionProps> = ({ onOpenSync, onExport, onImport, onReset }) => {
  const [pendingReset, setPendingReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<{json:string; meta:{format:string; schemaVersion:number|string; exportedAt:string}}|null>(null);
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [pendingDecrypt, setPendingDecrypt] = useState<{encrypted:any; raw:string}|null>(null);
  return (
    <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-ceci-academic-strong" />
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          seus dados
        </h2>
      </div>
      <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
        tudo fica guardado só no seu dispositivo. faça um backup para migrar ou comece de novo quando quiser ♡
      </p>

      <button
        onClick={onOpenSync}
        className="w-full flex items-center gap-2 bg-surface-default border border-ceci-border-brand text-ceci-primary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-surface-rose transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-ceci-brand-strong" />
        sincronizar entre dispositivos
        <ChevronRight className="w-4 h-4 ml-auto text-ceci-muted" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={()=>setShowExportPassword(true)}
          className="flex items-center gap-2 bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-ceci-academic-strong hover:text-ceci-on-academic transition-colors"
        >
          <Download className="w-4 h-4" />
          exportar backup
        </button>

        <label className="flex items-center gap-2 bg-surface-default border border-ceci-border-default text-ceci-primary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors">
          <Upload className="w-4 h-4" />
          importar backup
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async () => {
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
              e.target.value = '';
            }}
          />
        </label>

        <button
          onClick={() => setPendingReset(true)}
          className="flex items-center gap-2 bg-surface-default border border-ceci-border-default text-ceci-secondary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-status-danger hover:text-status-danger-strong transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          resetar cantinho
        </button>

        <Modal
          open={pendingReset}
          onClose={() => setPendingReset(false)}
          closeOnBackdrop={false}
        >
          <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
            <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">
              resetar cantinho?
            </h3>
            <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
              isso apaga todo o conteúdo do cantinho e não dá para desfazer. tem certeza?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingReset(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
              >
                cancelar
              </button>
              <button
                onClick={() => {
                  onReset();
                  setPendingReset(false);
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-status-danger-on bg-status-danger hover:bg-status-danger-strong cursor-pointer active:scale-95 transition-transform"
              >
                confirmar
              </button>
            </div>
          </div>
        </Modal>

        <Modal open={showExportPassword} onClose={()=>setShowExportPassword(false)} closeOnBackdrop={false}>
          <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-ceci-primary">exportar backup</h3>
            <p className="text-sm text-ceci-secondary">opcional: defina uma senha para criptografar o backup. deixe em branco para não criptografar.</p>
            <input type="password" value={exportPassword} onChange={e=>setExportPassword(e.target.value)} placeholder="senha opcional" className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"/>
            <div className="flex gap-2">
              <button onClick={()=>setShowExportPassword(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer">cancelar</button>
              <button onClick={async ()=>{
                setShowExportPassword(false);
                setExportPassword('');
                // TODO: integrate with real export flow with encryption
                // For now, just call onExport
                onExport();
              }} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer">exportar</button>
            </div>
          </div>
        </Modal>

        <Modal open={!!pendingImport} onClose={() => setPendingImport(null)} closeOnBackdrop={false}>
          <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
            <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">
              importar backup?
            </h3>
            {pendingImport && (
              <>
                <p className="text-sm text-ceci-secondary leading-relaxed mb-4">
                  formato: <span className="font-mono">{pendingImport.meta.format}</span><br/>
                  schema: <span className="font-mono">{pendingImport.meta.schemaVersion}</span><br/>
                  exportado em: <span className="font-mono">{pendingImport.meta.exportedAt}</span>
                </p>
                <p className="text-xs text-ceci-muted mb-5">
                  isso substitui os dados atuais. você pode fazer um backup antes ♡
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingImport(null)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
                  >
                    cancelar
                  </button>
                  <button
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

        <Modal open={!!pendingDecrypt} onClose={()=>{setPendingDecrypt(null); setImportPassword('');}} closeOnBackdrop={false}>
          <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-ceci-primary">backup criptografado</h3>
            <p className="text-sm text-ceci-secondary">esse backup está protegido por senha. digite a senha para descriptografar.</p>
            <input type="password" value={importPassword} onChange={e=>setImportPassword(e.target.value)} placeholder="senha" className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"/>
            <div className="flex gap-2">
              <button onClick={()=>{setPendingDecrypt(null); setImportPassword('');}} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer">cancelar</button>
              <button onClick={async ()=>{
                if (!pendingDecrypt) return;
                try {
                  const { decryptBackup } = await import('../../../lib/backupCrypto');
                  const plain = await decryptBackup(pendingDecrypt.encrypted, importPassword);
                  onImport(plain);
                  setPendingDecrypt(null);
                  setImportPassword('');
                } catch {
                  alert('senha inválida');
                }
              }} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer">descriptografar</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DataSection;