import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { InternshipLogCard } from '../InternshipLogCard';
import { EmptyState } from '../ui/EmptyState';
import { PillGroup } from '../ui/PillGroup';
import { StatusChip } from '../internship/StatusChip';
import type { DerivedCase } from '../../lib/internshipCases';
import type { InternshipLog } from '../../types';
import { formatDateShortBR } from '../../lib/dateBR';
import { pluralPt } from '../../lib/pluralPt';

type Filtro = 'todas' | 'supervisao' | 'intervisao';

const FILTRO_TYPES: Record<Filtro, InternshipLog['type'][]> = {
  todas: ['supervisao', 'intervisao'],
  supervisao: ['supervisao'],
  intervisao: ['intervisao'],
};

/**
 * Aba de supervisão — v2 (`SPEC-009 §9.6`).
 *
 * **A porta dupla fechou (`F10`).** Antes esta tela tinha estado, formulário e
 * `emptyEntry` próprios: criava supervisão com `activity` fixo `"supervisão"`,
 * `hours: 0` fixo, **sem nenhuma forma de vincular sessões**, e decidia novo vs
 * edição pelo **prefixo do id** (`sup-`). O wizard gravava horas reais. Duas telas,
 * dois comportamentos, e a intervisão não aparecia em lugar nenhum — era gravada
 * (`InternshipWizard.tsx:27`) e não tinha tela.
 *
 * Agora é uma **vista filtrada** dos logs, e a criação é pelo wizard.
 */
export const SupervisionView: React.FC<{
  today: string;
  cases: DerivedCase[];
  pendingIds: string[];
}> = ({ today, cases, pendingIds }) => {
  const { internshipLogs, openWizard } = useMobileApp();
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const logs = internshipLogs.filter((l) => FILTRO_TYPES[filtro].includes(l.type));
  const agendadas = logs.filter((l) => l.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const feitas = logs.filter((l) => l.date <= today).sort((a, b) => b.date.localeCompare(a.date));

  const porPaciente = pendingIds
    .map((id) => internshipLogs.find((l) => l.id === id))
    .filter((l): l is InternshipLog => Boolean(l))
    .map((l) => ({
      log: l,
      key: `${l.patient ?? ''} ${l.sessionNumber ?? ''}`.trim(),
    }));

  const abrirWizard = (seed?: Record<string, unknown>) =>
    openWizard('internship', undefined, { kind: 'supervisao', ...(seed ?? {}) });

  return (
    <div className="space-y-4">
      {/* Sem cabeçalho próprio (SPEC-010 D3): o hero do Diário é o topo da aba.
          O que restava aqui era o segundo cabeçalho empilhado na mesma tela. */}

      <PillGroup<Filtro>
        size="sm"
        variant="rose"
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: 'todas', label: 'todas' },
          { value: 'supervisao', label: 'supervisão' },
          { value: 'intervisao', label: 'intervisão' },
        ]}
      />

      {porPaciente.length > 0 && (
        <div className="rounded-2xl p-3 bg-surface-muted border border-status-warning-border space-y-2">
          <p className="text-[11px] font-semibold text-status-warning-strong inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" aria-hidden />
            {pluralPt(porPaciente.length, 'sessão esperando supervisão', 'sessões esperando supervisão')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {porPaciente.slice(0, 6).map(({ log, key }) => (
              <span
                key={log.id}
                className="text-[10px] px-2 py-1 rounded-full bg-surface-default border border-ceci-border-default text-ceci-secondary"
              >
                {key}
              </span>
            ))}
            <button
              type="button"
              onClick={() => abrirWizard()}
              className="min-h-[44px] px-3 rounded-full text-[11px] font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand cursor-pointer tap-interactive"
            >
              levar pra próxima
            </button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <EmptyState
          description="ainda não tem supervisão anotada — que tal registrar a próxima? ♡"
          actionLabel="anotar supervisão"
          onAction={() => abrirWizard()}
        />
      ) : (
        <div className="space-y-4">
          {agendadas.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                próximas
              </h3>
              <div className="space-y-3">
                {agendadas.map((log) => (
                  <InternshipLogCard
                    key={log.id}
                    log={log}
                    today={today}
                    allLogs={internshipLogs}
                  />
                ))}
              </div>
            </section>
          )}
          {feitas.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                anteriores
              </h3>
              <div className="space-y-3">
                {feitas.map((log) => (
                  <InternshipLogCard
                    key={log.id}
                    log={log}
                    today={today}
                    allLogs={internshipLogs}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

/** Reexportado para os testes de formatação da faixa. */
export { formatDateShortBR, StatusChip };