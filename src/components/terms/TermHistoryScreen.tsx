import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { useTermActions } from '@/context/shellNavContexts';
import { sortedTerms, degreeProgress, useActiveTerm } from '@/lib/termScope';
import type { AcademicTerm } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Histórico de períodos letivos (SPEC-005) — o índice do wizard de semestre.
 *
 * Fica **empilhado sobre** o wizard (passo 1), não sobre a aba: o back volta
 * para o wizard e depois para o perfil, sem caso especial na cadeia.
 *
 * Um semestre encerrado tem o `summary` congelado e **nada é digitado** aqui —
 * o registro é o registro. A única ação é **reabrir** (SPEC-006 D7), o escape
 * para "era o 6º, não o 5º" quando a virada aconteceu com o número errado:
 * reabrir devolve o período para `ativo` (e ele passa a ser o atual), limpando
 * o transcript do encerramento, porque o semestre voltou a acontecer.
 */
export const TermHistoryScreen: React.FC = () => {
  const { academicTerms, profile, focusedTermId, openTermHistory } = useMobileApp();
  const { reopenTermById, showToast } = useTermActions();
  const terms = sortedTerms(academicTerms);
  // SPEC-005 §D4: o progresso vem do **período ativo**, nunca de
  // `profile.semester`. Ler o legado aqui fazia o histórico mentir sobre o
  // curso sempre que o número do período e o campo divergissem.
  const activeTerm = useActiveTerm(academicTerms);

  const handleReopen = (term: AcademicTerm) => {
    reopenTermById(term.id);
    showToast(`${term.label} voltou a ser o seu semestre atual ♡`);
  };

  if (terms.length === 0) {
    return (
      <div className="px-4 pt-6 pb-10 text-center">
        <p className="text-sm text-ceci-secondary">
          seu histórico de semestres começa no primeiro período que você abrir ♡
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 space-y-4">
      <p className="text-xs text-ceci-secondary">
        {degreeProgress(activeTerm?.ordinal ?? profile.semester, profile.totalSemesters)}% do curso ·
        cada semestre guardado com o resumo do momento em que ele fechou
      </p>

      <ol className="space-y-3">
        {terms.map((term) => (
          <li key={term.id}>
            <TermCard
              term={term}
              totalSemesters={profile.totalSemesters}
              expanded={focusedTermId === term.id}
              onOpen={() => openTermHistory(term.id)}
              onReopen={term.status === 'encerrado' ? () => handleReopen(term) : undefined}
            />
          </li>
        ))}
      </ol>
    </div>
  );
};

const TermCard: React.FC<{
  term: AcademicTerm;
  totalSemesters: number;
  expanded: boolean;
  onOpen: () => void;
  /** Só para períodos encerrados: reabrir torna este o semestre atual. */
  onReopen?: () => void;
}> = ({ term, totalSemesters, expanded, onOpen, onReopen }) => {
  const active = term.status === 'ativo';
  const s = term.summary;

  return (
    <div
      className={cn(
        'rounded-[24px] border bg-white p-4',
        active ? 'border-ceci-border-brand shadow-brand-soft' : 'border-ceci-border-default shadow-xs'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-2xl',
            active ? 'bg-surface-rose text-ceci-brand-strong' : 'bg-surface-muted text-ceci-tertiary'
          )}
        >
          {active ? <Sparkles className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ceci-primary">{term.label}</p>
          <p className="text-xs text-ceci-secondary">
            {active
              ? 'você está aqui agora ♡'
              : term.endedAt
                ? `encerrado em ${term.endedAt}`
                : 'encerrado'}
          </p>
        </div>
        <span className="text-xs font-semibold text-ceci-tertiary">
          {degreeProgress(term.ordinal, totalSemesters)}%
        </span>
      </div>

      {s ? (
        <>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'aulas', value: s.classNotes },
              { label: 'foco', value: `${Math.round(s.focusMinutes / 60)}h` },
              { label: 'leitura', value: s.pagesRead },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-surface-muted px-2 py-2">
                <dt className="text-[10px] uppercase tracking-wider text-ceci-tertiary">{m.label}</dt>
                <dd className="text-sm font-semibold text-ceci-primary">{m.value}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-3 space-y-1">
            {s.highlights.map((h) => (
              <li key={h} className="text-xs text-ceci-secondary">
                {h}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpen}
            aria-expanded={expanded}
            className="mt-3 w-full rounded-full border border-ceci-border-default py-2 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            {expanded ? 'esconder o resumo' : 'ver o resumo inteiro'}
          </button>
          {expanded && s.grades.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-ceci-border-subtle pt-2">
              {s.grades.map((g) => (
                <li key={`${g.courseId}-${g.label}`} className="flex justify-between text-xs">
                  <span className="text-ceci-secondary">{g.label}</span>
                  <span className="font-semibold text-ceci-primary">
                    {g.grade !== undefined ? g.grade : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-2 text-xs text-ceci-tertiary">
          {active ? 'o resumo aparece quando você virar o semestre ♡' : 'sem resumo registrado'}
        </p>
      )}

      {onReopen && (
        <button
          type="button"
          onClick={onReopen}
          className="mt-3 w-full rounded-full border border-ceci-border-default py-2 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          era este semestre mesmo — reabrir como atual
        </button>
      )}
    </div>
  );
};
