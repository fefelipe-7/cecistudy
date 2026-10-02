// Perfil — "linha do tempo da graduação" (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React, { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { AcademicTerm, UserProfile } from '../../../types';
import { getJourneyReflection } from '../../../lib/profileMeta';
import { degreeProgress, sortedTerms, useActiveTerm } from '../../../lib/termScope';
import { canRollover, shouldNudgeRollover } from '../../../core/domain';

interface JourneyTimelineProps {
  profile: UserProfile;
  percentDegree: number;
  /** Períodos letivos (SPEC-005) — a timeline passa a mostrar o que aconteceu. */
  academicTerms: AcademicTerm[];
  onOpenSemesterWizard: () => void;
  onOpenTermHistory: () => void;
}

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  profile,
  percentDegree,
  academicTerms,
  onOpenSemesterWizard,
  onOpenTermHistory,
}) => {
  const activeTerm = useActiveTerm(academicTerms);
  // A timeline é quem decide se o semestre acabou: a grade usa o período ativo,
  // mas o "você está no 6º" vem do `ordinal` do termo, não do perfil (§D4).
  const currentOrdinal = activeTerm?.ordinal ?? profile.semester;
  /**
   * Período de cada slot da timeline, resolvido por **id** e não por `find` de
   * `ordinal` (SPEC-008 F4.10). Dois períodos podem ocupar o mesmo `ordinal` — a
   * correção de número (F3) e a virada podem colidir nisso, e um import antigo
   * traz duplicata direto. Com `find`, o vencedor era o primeiro do array, e a
   * ordem do array não é a ordem da recência: o slot mostrava o resumo do
   * período errado.
   *
   * `sortedTerms` vem do mais novo ao mais velho, então o **primeiro** a cair
   * no Map é o mais recente — e `Map` não sobrescreve chave já presente.
   */
  const termBySlot = useMemo(() => {
    const map = new Map<number, AcademicTerm>();
    for (const t of sortedTerms(academicTerms)) {
      if (!map.has(t.ordinal)) map.set(t.ordinal, t);
    }
    return map;
  }, [academicTerms]);
  const canRolloverTerm = canRollover(activeTerm);
  const rolloverNudge = shouldNudgeRollover(
    activeTerm,
    new Date().toISOString().slice(0, 10),
    profile.totalSemesters,
  );

  return (
  <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          linha do tempo da minha graduação
        </h2>
        <p className="text-xs text-ceci-secondary">
          acompanhando a caminhada desde o primeiro dia até a formação clínica.
        </p>
      </div>
      <span className="text-xs bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand px-3 py-1 rounded-full font-medium shrink-0">
        {percentDegree}% do caminho 🎓
      </span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
      {Array.from({ length: profile.totalSemesters }, (_, i) => i + 1).map((sem) => {
        // Passado/presente saem dos **períodos reais** (com resumo), não do
        // contador do perfil — é o que dá substance à linha do tempo. O lookup é
        // pelo `Map` de `termBySlot` (mais recente vence), não por `find`.
        const term = termBySlot.get(sem);
        const isCurrent = sem === currentOrdinal;
        const isPast = sem < currentOrdinal;

        return (
          <div
            key={sem}
            className={`p-3.5 rounded-2xl border text-center ${
              isCurrent
                ? 'bg-surface-rose border-2 border-ceci-border-brand text-ceci-brand-strong shadow-2xs font-bold'
                : isPast
                ? 'bg-surface-blue/80 border-ceci-border-academic text-ceci-academic-strong'
                : 'bg-surface-default border-ceci-border-default opacity-60 text-ceci-secondary'
            }`}
          >
            <p className="text-xs opacity-80">semestre</p>
            <p className="font-display text-2xl font-bold my-1">{sem}º</p>
            <p className="text-[10px] font-medium">
              {isCurrent ? '🌸 em andamento' : term?.summary ? '✓ concluído' : isPast ? '✓ concluído' : 'aguardando'}
            </p>
            {term?.summary && (
              <p className="mt-1 text-[10px] text-ceci-tertiary">
                {term.summary.courses} disciplina{term.summary.courses === 1 ? '' : 's'}
              </p>
            )}
          </div>
        );
      })}
    </div>

    <div className="p-4 rounded-2xl bg-surface-muted border border-ceci-border-default text-xs space-y-2">
      <p className="font-semibold text-ceci-primary">💭 reflexão de jornada:</p>
      <p className="text-ceci-secondary leading-relaxed">
        “{getJourneyReflection(currentOrdinal, profile.totalSemesters)}”
      </p>
    </div>

    {/* CTA de virada (SPEC-008 D1): o convite fica sempre à mão com um período
        aberto e só vira destaque quando o semestre chega no fim. */}
    {canRolloverTerm ? (
      <div
        className={`rounded-2xl border p-4 space-y-3 ${
          rolloverNudge
            ? 'border-ceci-border-brand bg-surface-rose'
            : 'border-ceci-border-default bg-surface-default'
        }`}
      >
        <p className="text-sm font-semibold text-ceci-primary">
          {rolloverNudge
            ? `seu ${activeTerm?.label} tá pra acabar ♡`
            : `seu ${activeTerm?.label} tá guardando tudo que você anota ♡`}
        </p>
        <p className="text-xs text-ceci-secondary">
          quando terminar, eu guardo um resumo do semestre e abro o próximo — nada se perde, e dá
          pra voltar atrás.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenSemesterWizard}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              rolloverNudge
                ? 'bg-ceci-brand-strong text-white hover:bg-ceci-brand'
                : 'border border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted'
            }`}
          >
            {rolloverNudge && <Sparkles className="w-3.5 h-3.5" />}
            virar o semestre ♡
          </button>
          <button
            type="button"
            onClick={onOpenTermHistory}
            className="inline-flex items-center gap-1.5 rounded-full border border-ceci-border-brand bg-white px-4 py-2 text-xs font-semibold text-ceci-brand-strong hover:bg-surface-rose"
          >
            ver o histórico
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={onOpenTermHistory}
        className="w-full rounded-full border border-ceci-border-default bg-white py-2 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted"
      >
        ver meus semestres ({academicTerms.length})
      </button>
    )}
  </div>
  );
};

export default JourneyTimeline;