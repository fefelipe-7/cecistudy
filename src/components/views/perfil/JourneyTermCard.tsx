// Perfil — cartão do período letivo ativo (SPEC-006 D6, refinado na SPEC-008 D2).
//
// Substitui o input "semestre atual" que existia na personalização. Aquele input
// editava `profile.semester`, um campo que a UI já não lia (a fonte de verdade é
// o `AcademicTerm` ativo desde a SPEC-005) — a usuária digitava 6, apertava
// "guardar" e nada mudava na tela. Aqui o número que ela digita É o número do
// período ativo, corrigido via `retitleTerm` no domínio.
//
// **O `ordinal` e o `totalSemesters` são coisas diferentes** (SPEC-008 D3). O total
// do curso é um palpite que a usuária corrige a qualquer momento; o ordinal é o
// fato. O `total` nunca limita o `ordinal` — usar um como teto do outro prendia a
// usuária num curso de 8 enquanto o semestre real era o 9, sem nenhuma saída
// (o `total` não tinha editor, e o input do `ordinal` recusava o 9). O teto do
// `ordinal` é o global (`MAX_TERM_ORDINAL`); passar do total é um **aviso**, não
// um bloqueio.
import React, { useEffect, useState } from 'react';
import { GraduationCap, Minus, Pencil, Plus, Sparkles, X } from 'lucide-react';
import type { AcademicTerm } from '../../../types';
import { degreeProgress, semestersLeft } from '../../../lib/termScope';
import { MAX_TERM_ORDINAL } from '../../../core/domain';

interface JourneyTermCardProps {
  activeTerm: AcademicTerm | null;
  totalSemesters: number;
  /** Corrige o ordinal do período ativo (só ele é editável — ver SPEC-006 D6). */
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  /** Ajusta o total do curso, `1..MAX_TERM_ORDINAL` (SPEC-008 D2). */
  onSetTotalSemesters?: (total: number) => void;
  /** Abre o assistente: virar o semestre, ou abrir o primeiro se não há nenhum. */
  onOpenSemesterWizard?: () => void;
  onShowToast: (message: string) => void;
}

const JourneyTermCard: React.FC<JourneyTermCardProps> = ({
  activeTerm,
  totalSemesters,
  onCorrectOrdinal,
  onSetTotalSemesters,
  onOpenSemesterWizard,
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

  const stepTotal = (delta: number) => {
    if (!onSetTotalSemesters) return;
    const next = Math.max(1, Math.min(MAX_TERM_ORDINAL, totalSemesters + delta));
    if (next === totalSemesters) return;
    onSetTotalSemesters(next);
  };

  if (!activeTerm) {
    return (
      <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-ceci-brand" />
          <h3 className="font-display text-sm font-semibold text-ceci-primary">seu período letivo</h3>
        </div>
        <p className="text-xs text-ceci-secondary">
          você ainda não abriu um semestre. dá pra começar pelo primeiro quando quiser ♡
        </p>
        {onOpenSemesterWizard && (
          <button
            type="button"
            onClick={onOpenSemesterWizard}
            className="touch-target w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2.5 text-xs font-semibold text-white hover:bg-ceci-brand transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            abrir meu 1º semestre ♡
          </button>
        )}
      </div>
    );
  }

  const percent = degreeProgress(activeTerm.ordinal, totalSemesters);
  const left = semestersLeft(activeTerm.ordinal, totalSemesters);
  // ordinal acima do total não é erro — é o app sabendo de algo que o palpite do
  // curso não alcança. O `degreeProgress` satura em 100%, então sem esta frase a
  // usuária lia "100% do curso · faltam 0 semestres" e achava que já tinha formado.
  const beyondCourse = activeTerm.ordinal > totalSemesters;

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
              max={MAX_TERM_ORDINAL}
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
            className="touch-target shrink-0 inline-flex items-center gap-1.5 rounded-full border border-ceci-border-default px-3 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            corrigir
          </button>
        </div>
      )}

      {beyondCourse && (
        <p className="rounded-xl bg-surface-rose border border-ceci-border-brand px-3 py-2 text-[11px] text-ceci-secondary">
          seu {activeTerm.ordinal}º está além dos {totalSemesters} do curso — se esse palpite
          estiver errado, ajusta o total aqui embaixo ♡
        </p>
      )}

      {onSetTotalSemesters && (
        <div className="flex items-center justify-between gap-3 border-t border-ceci-border-subtle pt-3">
          <span className="text-xs text-ceci-secondary">curso de</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepTotal(-1)}
              aria-label="diminuir o total do curso"
              className="touch-target w-9 h-9 inline-flex items-center justify-center rounded-full border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold text-ceci-primary">
              {totalSemesters}
            </span>
            <button
              type="button"
              onClick={() => stepTotal(1)}
              aria-label="aumentar o total do curso"
              className="touch-target w-9 h-9 inline-flex items-center justify-center rounded-full border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="ml-1 text-xs text-ceci-tertiary">semestres</span>
          </div>
        </div>
      )}

      {onOpenSemesterWizard && (
        <button
          type="button"
          onClick={onOpenSemesterWizard}
          className="touch-target w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2.5 text-xs font-semibold text-white hover:bg-ceci-brand transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          virar o semestre ♡
        </button>
      )}
    </div>
  );
};

export default JourneyTermCard;
