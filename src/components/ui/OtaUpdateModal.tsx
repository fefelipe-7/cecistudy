import React from 'react';
import { Modal } from './Modal';
import { Kitty } from './Kitty';
import { applyNow, dismissUpdate, useOtaStatus } from '@/lib/ota';

/**
 * Aviso acolhedor de atualização OTA disponível. Só aparece no app nativo
 * quando um bundle novo já foi baixado (status `ready`).
 */
export const OtaUpdateModal: React.FC = () => {
  const ota = useOtaStatus();
  const open = ota.supported && ota.status === 'ready' && !!ota.availableVersion;

  return (
    <Modal
      open={open}
      onClose={dismissUpdate}
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl p-6 space-y-4 text-ceci-primary animate-in zoom-in-95 duration-200"
    >
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0 overflow-hidden">
          <Kitty expression="rindo" className="w-9 h-9" decorative />
        </span>
        <div>
          <h3 className="font-display font-bold text-lg text-ceci-primary leading-tight">
            atualização pronta ♡
          </h3>
          <p className="text-xs text-ceci-secondary">
            a versão {ota.availableVersion} chegou e já está baixada.
          </p>
        </div>
      </div>

      <p className="text-xs text-ceci-secondary leading-relaxed">
        sem pressa: ela entra sozinha na próxima abertura do cantinho. se quiser,
        pode aplicar agora.
      </p>

      <div className="space-y-2 pt-1">
        <button
          onClick={() => void applyNow()}
          className="w-full bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
        >
          aplicar agora
        </button>
        <button
          onClick={dismissUpdate}
          className="w-full bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
        >
          fazer depois
        </button>
      </div>
    </Modal>
  );
};