// Perfil — a memória da formação (SPEC-013 D1; reestrutura `JourneyTimeline`).
//
// Mostra o período **atual** e até **dois anteriores** por id, sem repetir o CTA
// de virada (que agora vive só em `JourneyNow` — SPEC-013 I3). O detalhamento
// completo fica a um toque (`ver histórico completo`). A reflexão de jornada saiu
// do bloco para a leitura não depender de um texto longo no meio da página.
import React from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { ProfileJourney } from '../../../lib/profileViewModel';

interface JourneyHistoryProps {
  journey: ProfileJourney;
  onOpenTermHistory: () => void;
}

/** Quantos períodos fechados aparecem no resumo (o resto fica no histórico). */
const VISIBLE = 2;

const JourneyHistory: React.FC<JourneyHistoryProps> = ({ journey, onOpenTermHistory }) => {
  const previous = journey.history.slice(0, VISIBLE);

  return (
    <section
      aria-labelledby="perfil-historia-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-ceci-academic-strong" aria-hidden="true" />
          <h2 id="perfil-historia-titulo" className="font-display font-bold text-xl text-ceci-primary">
            memória da graduação
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenTermHistory}
          className="touch-target shrink-0 inline-flex items-center gap-1 rounded-full border border-ceci-border-default px-3 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          histórico
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {previous.length === 0 ? (
        <p className="text-xs text-ceci-secondary">
          {journey.hasActiveTerm
            ? 'quando este semestre for encerrado, ele aparece aqui como memória ♡'
            : 'sua memória da graduação começa quando o primeiro semestre for encerrado ♡'}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {previous.map((term) => (
            <li
              key={term.ordinal}
              className="rounded-2xl bg-surface-muted border border-ceci-border-subtle px-3.5 py-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-ceci-primary">{term.label}</span>
                <span className="text-[11px] text-ceci-tertiary">
                  {term.courses} {term.courses === 1 ? 'disciplina' : 'disciplinas'}
                </span>
              </div>
              {term.highlights.length > 0 ? (
                <p className="text-[11px] text-ceci-secondary leading-relaxed">{term.highlights[0]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default JourneyHistory;
