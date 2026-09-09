// Perfil — "seus dados" (sincronização, backup, reset) (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React, { useState } from 'react';
import { Database, Download, Upload, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';
import { Modal } from '../../ui/Modal';

interface DataSectionProps {
  onOpenSync: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

const DataSection: React.FC<DataSectionProps> = ({ onOpenSync, onExport, onImport, onReset }) => {
  const [pendingReset, setPendingReset] = useState(false);
  return (
    <div className="rounded-2xl p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
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
        className="w-full flex items-center gap-2 bg-white border border-ceci-border-brand text-ceci-primary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-surface-rose transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-ceci-brand-strong" />
        sincronizar entre dispositivos
        <ChevronRight className="w-4 h-4 ml-auto text-ceci-muted" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-ceci-academic-strong hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          exportar backup
        </button>

        <label className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-primary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors">
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
              reader.onload = () => onImport(String(reader.result));
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </label>

        <button
          onClick={() => setPendingReset(true)}
          className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-secondary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-red-400 hover:text-red-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          resetar cantinho
        </button>

        <Modal
          open={pendingReset}
          onClose={() => setPendingReset(false)}
          closeOnBackdrop={false}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-floating p-6">
            <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">
              resetar cantinho?
            </h3>
            <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
              isso apaga todo o conteúdo do cantinho e não dá para desfazer. tem certeza?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingReset(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-white border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
              >
                cancelar
              </button>
              <button
                onClick={() => {
                  onReset();
                  setPendingReset(false);
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 cursor-pointer active:scale-95 transition-transform"
              >
                confirmar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DataSection;