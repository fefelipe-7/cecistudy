// Perfil — "eu estou aqui": semestre atual, progresso e o CTA de virada
// (SPEC-013 D1/D4; reestrutura `JourneyTermCard`).
//
// Concentra o que estava espalhado: o progresso da graduação aparece **uma vez**
// (aqui — SPEC-013 I2) e o CTA de virar semestre aparece **uma vez**
// (SPEC-013 I3). O `ordinal` e o `totalSemesters` continuam coisas diferentes
// (SPEC-008 D3): o ordinal é o fato, corrigível por id; o total é um palpite que
// se ajusta aqui; o teto do ordinal é `MAX_TERM_ORDINAL`, e passar do total é
// **aviso**, nunca bloqueio.
import React, { useEffect, useState } from 'react';
import { GraduationCap, Minus, Pencil, Plus, Sparkles, X } from 'lucide-react';
import type { ProfileJourney } from '../../../lib/profileViewModel';
import { MAX_TERM_ORDINAL } from '../../../lib/termScope';
import JourneyRail from './JourneyRail';

interface JourneyNowProps {
  journey: ProfileJourney;
  /** Corrige o ordinal do período ativo (`activeTermId`) — SPEC-006 D6. */
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  /** Ajusta o total do curso, `1..MAX_TERM_ORDINAL` (SPEC-008 D2). */
  onSetTotalSemesters: (total: number) => void;
  onOpenSemesterWizard: () => void;
  onShowToast: (message: string) => void;
}

function leftLabel(left: number): string {
  if (left <= 0) return 'curso completo';
  return left === 1 ? 'falta 1 semestre' : `faltam ${left} semestres`;
}

const JourneyNow: React.FC<JourneyNowProps> = ({
  journey,
  onCorrectOrdinal,
  onSetTotalSemesters,
  onOpenSemesterWizard,
  onShowToast,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(journey.currentOrdinal);

  // Reentra do zero quando muda o período ativo — senão o rascunho guardaria o
  // número do semestre anterior.
  useEffect(() => {
    setDraft(journey.currentOrdinal);
    setEditing(false);
  }, [journey.activeTermId, journey.currentOrdinal]);

  const submit = () => {
    if (!journey.activeTermId) return;
    const next = Math.max(1, Math.min(MAX_TERM_ORDINAL, draft));
    onCorrectOrdinal(journey.activeTermId, next);
    setEditing(false);
    onShowToast(`agora seu ${next}º semestre é o atual ♡`);
  };

  const stepTotal = (delta: number) => {
    const next = Math.max(1, Math.min(MAX_TERM_ORDINAL, journey.totalSemesters + delta));
    if (next === journey.totalSemesters) return;
    onSetTotalSemesters(next);
  };

  return (
    <section
      aria-labelledby="perfil-jornada-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-ceci-brand" aria-hidden="true" />
        <h2 id="perfil-jornada-titulo" className="font-display font-bold text-xl text-ceci-primary">
          sua jornada
        </h2>
      </div>

      {!journey.hasActiveTerm ? (
        <div className="space-y-3">
          <p className="text-xs text-ceci-secondary">
            você ainda não abriu um semestre. dá pra começar pelo primeiro quando quiser ♡
          </p>
          <button
            type="button"
            onClick={onOpenSemesterWizard}
            className="touch-target w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2.5 text-xs font-semibold text-ceci-on-brand hover:bg-ceci-brand transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            abrir meu 1º semestre ♡
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-surface-rose border border-ceci-border-brand px-2.5 py-0.5 text-[11px] font-semibold text-ceci-brand-strong">
                semestre atual
              </span>
              <p className="mt-1.5 font-display text-xl font-bold text-ceci-primary">
                {journey.activeTermLabel ?? `${journey.currentOrdinal}º semestre`}
              </p>
            </div>

            {editing ? null : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={`corrigir semestre atual (${journey.currentOrdinal}º)`}
                className="touch-target shrink-0 inline-flex items-center gap-1.5 rounded-full border border-ceci-border-default px-3 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                corrigir
              </button>
            )}
          </div>

          <JourneyRail slots={journey.slots} />

          {editing ? (
            <div className="space-y-2">
              <label htmlFor="term-ordinal" className="block text-xs font-medium text-ceci-secondary">
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
                  className="touch-target inline-flex items-center justify-center rounded-xl border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-[11px] text-ceci-tertiary">
                o histórico anterior fica como registro — cada período é o registro de como ele foi.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-ceci-brand-strong">
                  {journey.percent}% do curso
                </span>
                <span className="text-xs text-ceci-secondary">{leftLabel(journey.semestersLeft)}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={journey.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${journey.percent}% da graduação concluída`}
                className="h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-ceci-brand"
                  style={{ width: `${journey.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-ceci-secondary">
                {journey.currentOrdinal}º de {journey.totalSemesters} semestres
              </p>
            </div>
          )}

          {journey.beyondCourseEstimate ? (
            <p className="rounded-xl bg-surface-rose border border-ceci-border-brand px-3 py-2 text-[11px] text-ceci-secondary">
              seu {journey.currentOrdinal}º está além dos {journey.totalSemesters} do curso — se esse
              palpite estiver errado, ajusta o total aqui embaixo ♡
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-ceci-border-subtle pt-3">
            <span className="text-xs text-ceci-secondary">curso de</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepTotal(-1)}
                aria-label="diminuir o total do curso"
                className="touch-target w-9 h-9 inline-flex items-center justify-center rounded-full border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-6 text-center text-sm font-semibold text-ceci-primary tabular-nums">
                {journey.totalSemesters}
              </span>
              <button
                type="button"
                onClick={() => stepTotal(1)}
                aria-label="aumentar o total do curso"
                className="touch-target w-9 h-9 inline-flex items-center justify-center rounded-full border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="ml-1 text-xs text-ceci-tertiary">semestres</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSemesterWizard}
            className="touch-target w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2.5 text-xs font-semibold text-ceci-on-brand hover:bg-ceci-brand transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            virar o semestre ♡
          </button>
        </>
      )}
    </section>
  );
};

export default JourneyNow;
