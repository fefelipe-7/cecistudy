import { CONFIRMACAO, frase } from '../../../lib/voice';
// Perfil - zona de cuidado: reset isolado (SPEC-013 D6).
//
// O reset é a única ação destrutiva da tela; conviver com "exportar backup" no
// mesmo grid convidava ao clique distraído. Aqui ele mora sozinho, com tinta de
// aviso, longe das ações do dia a dia, e continua exigindo confirmação no modal.
import React, { useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import PreferenceRow from './PreferenceRow';

interface DangerZoneProps {
  onReset: () => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ onReset }) => {
  const [pendingReset, setPendingReset] = useState(false);

  return (
    <section
      aria-labelledby="perfil-cuidado-titulo"
      className="rounded-3xl p-5 bg-surface-muted border border-status-danger/40 space-y-3"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-status-danger-strong" aria-hidden="true" />
        <h2 id="perfil-cuidado-titulo" className="font-display font-bold text-xl text-ceci-primary">
          zona de cuidado
        </h2>
      </div>

      <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
        uma ação só, bem guardada: recomeçar o cantinho do zero.
      </p>

      <PreferenceRow
        icon={<RotateCcw className="w-4 h-4" />}
        label="resetar cantinho"
        description={frase(CONFIRMACAO, 'resetarAviso')}
        ariaLabel="resetar cantinho. apaga todo o conteúdo e não dá para desfazer."
        onClick={() => setPendingReset(true)}
      />

      <Modal open={pendingReset} onClose={() => setPendingReset(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">resetar cantinho?</h3>
          <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
            isso apaga todo o conteúdo do cantinho e não dá para desfazer. tem certeza?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingReset(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
            >
              cancelar
            </button>
            <button
              type="button"
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
    </section>
  );
};

export default DangerZone;
