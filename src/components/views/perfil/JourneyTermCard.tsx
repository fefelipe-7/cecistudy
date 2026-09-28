// Perfil — cartão do período letivo ativo (SPEC-006 D6).
//
// Substitui o input "semestre atual" que existia na personalização. Aquele input
// editava `profile.semester`, um campo que a UI já não lia (a fonte de verdade é
// o `AcademicTerm` ativo desde a SPEC-005) — a usuária digitava 6, apertava
// "guardar" e nada mudava na tela. Aqui o número que ela digita É o número do
// período ativo, corrigido via `retitleTerm` no domínio.
import React, { useEffect, useState } from 'react';
import { GraduationCap, Pencil, X } from 'lucide-react';
import type { AcademicTerm } from '../../../types';
import { degreeProgress, semestersLeft } from '../../../lib/termScope';

interface JourneyTermCardProps {
  activeTerm: AcademicTerm | null;
  totalSemesters: number;
  /** Corrige o ordinal do período ativo (só ele é editável — ver SPEC-006 D6). */
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  onShowToast: (message: string) => void;
}

const JourneyTermCard: React.FC<JourneyTermCardProps> = ({
  activeTerm,
  totalSemesters,
  onCorrectOrdinal,
  onShowToast,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(1);

  // Reentra no modo de edição sempre que o período ativo mudar de id/ordinal —
  // senão o rascunho ficaria com o número do semestre anterior.
  useEffect(() => {
    setDraft(activeTerm?.ordinal ?? 1);
    setEditing(false);
  }, [activeTerm?.id, activeTerm?.ordinal]);

  const submit = () => {
    if (!activeTerm) return;
    onCorrectOrdinal(activeTerm.id, draft);
    setEditing(false);
    onShowToast(`agora seu ${draft}º semestre é o atual ♡`);
  };

  if (!activeTerm) {
    return (
      <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-ceci-brand" />
          <h3 className="font-display text-sm font-semibold text-ceci-primary">seu período letivo</h3>
        </div>
        <p className="text-xs text-ceci-secondary">
          você ainda não abriu um semestre. dá pra começar pelo primeiro quando quiser ♡
        </p>
      </div>
    );
  }

  const percent = degreeProgress(activeTerm.ordinal, totalSemesters);
  const left = semestersLeft(activeTerm.ordinal, totalSemesters);

  return (
    <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-ceci-brand" />
        <h3 className="font-display text-sm font-semibold text-ceci-primary">seu período letivo</h3>
      </div>

      {editing ? (
        <div className="space-y-2">
          <label
            htmlFor="term-ordinal"
            className="block text-xs font-medium text-ceci-secondary"
          >
            em que semestre você está?
          </label>
          <div className="flex items-center gap-2">
            <input
              id="term-ordinal"
              type="number"
              min={1}
              max={totalSemesters}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-24 bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
            />
            <button
              type="button"
              onClick={submit}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-ceci-primary text-ceci-on-primary cursor-pointer active:scale-95 transition-transform"
            >
              guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="cancelar correção do semestre"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-ceci-tertiary">
            o histórico anterior fica como registro — cada período é o registro de como ele foi.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-bold text-ceci-primary">
              {activeTerm.label}
            </p>
            <p className="text-xs text-ceci-secondary mt-0.5">
              {percent}% do curso · {left === 1 ? 'falta 1 semestre' : `faltam ${left} semestres`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`corrigir o semestre atual (${activeTerm.label})`}
            className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JourneyTermCard;
