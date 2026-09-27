// Faculdade — convite de virada de semestre (SPEC-005 §D6).
//
// Aparece em dois momentos, e só neles:
//  - `due`: o semestre tá acabando (passou do meio, ou já é o último);
//  - sem período ativo: a usuária precisa abrir o primeiro de mano.
//
// Fora disso a tela fica limpa — nada de nudge permanentes.
import React from 'react';
import { Archive, Sparkles } from 'lucide-react';
import type { AcademicTerm } from '../../../types';
import { semestersLeft, degreeProgress } from '../../../lib/termScope';

interface TermRolloverCtaProps {
  term: AcademicTerm | null;
  totalSemesters: number;
  /** Disciplinas arquivadas (continuam pesquisáveis, saem da grade). */
  archivedCount: number;
  /** `shouldOfferRollover()` já avaliado pela view (evita `Date.now()` no componente). */
  due: boolean;
  onOpenWizard: () => void;
}

const TermRolloverCta: React.FC<TermRolloverCtaProps> = ({
  term,
  totalSemesters,
  archivedCount,
  due,
  onOpenWizard,
}) => {
  if (!due && term) return null;

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

  return (
    <div className="rounded-[22px] border border-ceci-border-brand bg-surface-rose p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ceci-primary">
            {left > 0
              ? `seu ${term.label} tá chegando no fim`
              : `seu ${term.label} é o último da graduação`}
          </p>
          <p className="text-xs text-ceci-secondary mt-0.5">
            {degreeProgress(term.ordinal, totalSemesters)}% do caminho
            {left > 0 ? ` · faltam ${left} semestre${left === 1 ? '' : 's'}` : ' · formatura à vista 🌷'}
            {archivedCount > 0 ? ` · ${archivedCount} disciplina${archivedCount === 1 ? '' : 's'} arquivada${archivedCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenWizard}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ceci-brand-strong px-4 py-2 text-xs font-semibold text-white hover:bg-ceci-brand transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
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
