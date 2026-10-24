// Perfil — sheet de edição de identidade (SPEC-013 D5).
//
// Antes, nome/universidade/frase viviam num `<form>` no fim da página
// (`PersonalizationSection.tsx:107-144`): corrigir o nome custava vários scrolls.
// Aqui a edição é um gesto explícito (`editar perfil`), o rascunho é local e o
// salvar é consciente — `guardar perfil` só habilita quando algo mudou e o nome
// está preenchido. Fechar com alterações pendentes pede confirmação (estado sujo).
import React, { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Toggle } from '../../ui/Toggle';
import { ONBOARDING, frase } from '../../../lib/voice';

export interface ProfileEditValues {
  name: string;
  university: string;
  dailyQuote: string;
  /**
   * Autorização do tratamento por nome (`SPEC-C-014` D8). Viaja junto da edição
   * de identidade porque é decisão **dela**, feita onde ela escreve o nome.
   */
  nomeAutorizado: boolean;
}

interface ProfileEditSheetProps {
  open: boolean;
  onClose: () => void;
  /** Valores atuais do perfil; o rascunho reinicia a cada abertura. */
  initial: ProfileEditValues;
  onSave: (values: ProfileEditValues) => void;
}

const hasChanges = (a: ProfileEditValues, b: ProfileEditValues): boolean =>
  a.name !== b.name ||
  a.university !== b.university ||
  a.dailyQuote !== b.dailyQuote ||
  a.nomeAutorizado !== b.nomeAutorizado;

const ProfileEditSheet: React.FC<ProfileEditSheetProps> = ({ open, onClose, initial, onSave }) => {
  const [draft, setDraft] = useState<ProfileEditValues>(initial);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Cada abertura começa do estado atual do perfil — nunca do rascunho anterior.
  useEffect(() => {
    if (open) {
      setDraft(initial);
      setConfirmDiscard(false);
    }
    // `initial` é um objeto novo a cada render; ancoramos na abertura para não
    // apagar o que a usuária digita a cada re-render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = hasChanges(draft, initial);
  const nameError = draft.name.trim().length === 0;

  const requestClose = () => {
    if (dirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const save = () => {
    if (nameError) return;
    onSave({
      name: draft.name.trim(),
      university: draft.university.trim(),
      dailyQuote: draft.dailyQuote.trim(),
      // Sem nome não há tratamento: ligar o interruptor com o campo vazio é a
      // ordem invertida, e a voz falaria "de " com espaço a mais.
      nomeAutorizado: draft.name.trim().length > 0 && draft.nomeAutorizado,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={requestClose}
      position="bottom"
      showGrabber
      labelledBy="perfil-edit-titulo"
    >
      <div className="w-full bg-surface-default rounded-t-3xl sm:rounded-3xl shadow-floating p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
        <h2 id="perfil-edit-titulo" className="font-display font-bold text-lg text-ceci-primary">
          editar perfil
        </h2>

        <div>
          <label
            htmlFor="perfil-edit-nome"
            className="block text-xs font-medium text-ceci-secondary mb-1"
          >
            seu nome
          </label>
          <input
            id="perfil-edit-nome"
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            aria-invalid={nameError}
            aria-describedby={nameError ? 'perfil-edit-nome-erro' : undefined}
            className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary"
          />
          {nameError ? (
            <p id="perfil-edit-nome-erro" className="mt-1 text-[11px] text-status-danger-strong">
              como quer ser chamada?
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="perfil-edit-universidade"
            className="block text-xs font-medium text-ceci-secondary mb-1"
          >
            universidade
          </label>
          <input
            id="perfil-edit-universidade"
            type="text"
            value={draft.university}
            onChange={(e) => setDraft((d) => ({ ...d, university: e.target.value }))}
            className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary"
          />
        </div>

        <div>
          <label
            htmlFor="perfil-edit-frase"
            className="block text-xs font-medium text-ceci-secondary mb-1"
          >
            frase motivacional de entrada
          </label>
          <textarea
            id="perfil-edit-frase"
            rows={2}
            value={draft.dailyQuote}
            onChange={(e) => setDraft((d) => ({ ...d, dailyQuote: e.target.value }))}
            className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand rounded-xl px-3.5 py-2.5 text-xs text-ceci-primary"
          />
        </div>

        {/**
         * `SPEC-C-014 D8` — o interruptor do nome mora **aqui**, colado no campo
         * onde ela o escreve: autorizar sem ver o nome é aceitar no escuro. É a
         * última coisa antes dos botões porque é a decisão mais fácil de deixar
         * para depois — e a frase da voz diz exatamente o que muda.
         */}
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-surface-muted border border-ceci-border-subtle px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ceci-primary">
              {frase(ONBOARDING, 'nomeAutorizadoTitulo')}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ceci-secondary">
              {frase(ONBOARDING, 'nomeAutorizadoDescricao', { nome: draft.name.trim() || 'você' })}
            </p>
          </div>
          <Toggle
            checked={draft.nomeAutorizado}
            onChange={() => setDraft((d) => ({ ...d, nomeAutorizado: !d.nomeAutorizado }))}
            label={frase(ONBOARDING, 'nomeAutorizadoTitulo')}
          />
        </div>

        {confirmDiscard ? (
          <p className="rounded-xl bg-status-warning-surface border border-status-warning-border px-3 py-2 text-[11px] text-status-warning-strong">
            há alterações não guardadas. descartar?
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={requestClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
          >
            {confirmDiscard ? 'descartar' : 'cancelar'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || nameError}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            guardar perfil
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileEditSheet;
