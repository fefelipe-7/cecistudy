// Faculdade — convite de virada de semestre (SPEC-005 §D6, refinado na SPEC-008 D1).
//
// Duas perguntas, e elas não são a mesma:
//  - `available`: existe um caminho para virar? (basta um período aberto)
//  - `nudge`: vale *destacar* agora? (o semestre está acabando)
//
// A versão anterior decidia as duas com um booleano só, o que escondia a virada
// durante quase todo o semestre. Agora o convite fica sempre à mão e só muda de
// intensidade — nada de nudge permanente, nada de caminho perdido.
import React from 'react';
import { Archive, Sparkles } from 'lucide-react';
import type { AcademicTerm } from '../../../types';
import { semestersLeft, degreeProgress } from '../../../lib/termScope';

interface TermRolloverCtaProps {
  term: AcademicTerm | null;
  totalSemesters: number;
  /** Disciplinas arquivadas (continuam pesquisáveis, saem da grade). */
  archivedCount: number;
  /** `canRollover()` — existe período aberto, logo existe caminho. */
  available: boolean;
  /** `shouldNudgeRollover()` — o semestre está no fim: aí sim a gente destaca. */
  nudge: boolean;
  onOpenWizard: () => void;
}

const TermRolloverCta: React.FC<TermRolloverCtaProps> = ({
  term,
  totalSemesters,
  archivedCount,
  available,
  nudge,
  onOpenWizard,
}) => {
  if (!available) return null;

  if (!term) {
    return (
      <button
        type="button"
        onClick={onOpenWizard}
        className="w-full rounded-[22px] border border-dashed border-ceci-border-brand bg-surface-rose px-4 py-4 text-left hover:bg-surface-rose/70 transition-colors"
      >
        <p className="text-sm font-semibold text-ceci-primary">nenhum semestre aberto ainda ♡</p>
        <p className="text-xs text-ceci-secondary mt-0.5">
          abre o primeiro período e daqui pra frente cada virada fica guardada com o resumo dela.
        </p>
      </button>
    );
  }

  const left = semestersLeft(term.ordinal, totalSemesters);
  const lastSemester = left <= 0;

  return (
    <div
      className={`rounded-[22px] border p-4 space-y-3 ${
        nudge
          ? 'border-ceci-border-brand bg-surface-rose'
          : 'border-ceci-border-default bg-surface-default'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ceci-primary">
            {!nudge
              ? `seu ${term.label} tá guardando tudo que você anota`
              : lastSemester
                ? `seu ${term.label} é o último da graduação`
                : `seu ${term.label} tá chegando no fim`}
          </p>
          <p className="text-xs text-ceci-secondary mt-0.5">
            {degreeProgress(term.ordinal, totalSemesters)}% do caminho
            {lastSemester
              ? ' · formatura à vista 🌷'
              : ` · faltam ${left} semestre${left === 1 ? '' : 's'}`}
            {archivedCount > 0
              ? ` · ${archivedCount} disciplina${archivedCount === 1 ? '' : 's'} arquivada${archivedCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenWizard}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            nudge
              ? 'bg-ceci-brand-strong text-white hover:bg-ceci-brand'
              : 'border border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted'
          }`}
        >
          {nudge && <Sparkles className="w-3.5 h-3.5" />}
          virar
        </button>
      </div>
      <p className="text-[11px] text-ceci-tertiary flex items-start gap-1.5">
        <Archive className="w-3 h-3 mt-0.5 shrink-0" />
        arquivar tira da grade, mas nunca apaga: a disciplina continua no histórico e na busca.
      </p>
    </div>
  );
};

export default TermRolloverCta;
