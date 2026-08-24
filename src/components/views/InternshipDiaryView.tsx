import React, { useMemo, useState } from 'react';
import { HeartHandshake, Compass, Plus, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InternshipLogCard } from '../InternshipLogCard';
import { SupervisionView } from './SupervisionView';
import { Mascote } from '../ui/Mascote';
import { DitherGrowthChart } from '../ui/dither-growth';
import type { InternshipPhase } from '../../types';

const CYCLE: { key: string; label: string }[] = [
  { key: 'preparar', label: 'preparar' },
  { key: 'registrar', label: 'registrar' },
  { key: 'refletir', label: 'refletir' },
  { key: 'supervisionar', label: 'supervisionar' },
  { key: 'entregar', label: 'entregar' },
];

const PHASES: { key: InternshipPhase | 'todas'; label: string }[] = [
  { key: 'todas', label: 'todas' },
  { key: 'preparar', label: 'preparar' },
  { key: 'registrar', label: 'registrar' },
  { key: 'refletir', label: 'refletir' },
  { key: 'supervisionar', label: 'supervisionar' },
  { key: 'entregar', label: 'entregar' },
];

function weekStart(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // segunda = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Tela do estágio 2.0: ciclo de formação + caderno de supervisão. */
export const InternshipDiaryView: React.FC = () => {
  const { internshipLogs, supervision, openWizard } = useApp();
  const [tab, setTab] = useState<'diario' | 'supervisao'>('diario');
  const [phase, setPhase] = useState<InternshipPhase | 'todas'>('todas');

  const totalHours = internshipLogs.reduce((acc, l) => acc + l.hours, 0);

  const { hoursThisWeek, weeklySeries } = useMemo(() => {
    const now = new Date();
    const start = weekStart(now);
    const thisWeek = internshipLogs
      .filter((l) => new Date(l.date) >= start)
      .reduce((a, l) => a + l.hours, 0);
    const weeks: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = new Date(start);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const h = internshipLogs
        .filter((l) => {
          const d = new Date(l.date);
          return d >= ws && d < we;
        })
        .reduce((a, l) => a + l.hours, 0);
      weeks.push(h);
    }
    return { hoursThisWeek: thisWeek, weeklySeries: weeks };
  }, [internshipLogs]);

  const supervisionCount = supervision.length;
  const filteredLogs =
    phase === 'todas' ? internshipLogs : internshipLogs.filter((l) => l.phase === phase);

  return (
    <div className="space-y-4 pb-1">
      <div className="flex items-center justify-between gap-3 rounded-[24px] p-4 bg-white border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">estágio 2.0</h2>
            <p className="text-[11px] text-ceci-secondary">campo, supervisão e entregas ♡</p>
          </div>
        </div>
        <button
          onClick={() => openWizard('internship')}
          className="flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-ink text-white px-3.5 py-2 rounded-full text-xs font-semibold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> anotar
        </button>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-2 px-0.5">
        {(
          [
            { key: 'diario', label: 'diário', Icon: HeartHandshake },
            { key: 'supervisao', label: 'supervisão', Icon: Compass },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-ceci-primary text-white shadow-xs'
                  : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
              }`}
            >
              <t.Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'diario' ? (
        <>
          {/* Ciclo de formação (guia visual) */}
          <div className="flex items-center justify-between gap-1 px-1 py-2 overflow-x-auto scrollbar-none">
            {CYCLE.map((step, i) => (
              <React.Fragment key={step.key}>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-ceci-academic-strong">
                  <span className="w-5 h-5 rounded-full bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-[9px]">
                    {i + 1}
                  </span>
                  {step.label}
                </span>
                {i < CYCLE.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-ceci-muted shrink-0" />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl px-4 py-2.5">
            <p className="text-[11px] text-ceci-secondary">
              cada registro vira um passo do ciclo: prepare o campo, registre, reflita, leve à supervisão e entregue ♡
            </p>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl p-3 bg-white border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-base">{totalHours}</p>
              <p className="text-[10px] text-ceci-secondary">horas totais</p>
            </div>
            <div className="rounded-2xl p-3 bg-white border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-base">{hoursThisWeek}</p>
              <p className="text-[10px] text-ceci-secondary">esta semana</p>
            </div>
            <div className="rounded-2xl p-3 bg-white border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-base">{supervisionCount}</p>
              <p className="text-[10px] text-ceci-secondary">supervisões</p>
            </div>
          </div>

          {/* Gráfico de horas por semana */}
          {internshipLogs.length > 0 ? (
            <div className="rounded-[24px] p-4 bg-white border border-ceci-border-default shadow-sm">
              <DitherGrowthChart
                data={weeklySeries}
                title="horas de campo por semana"
                unitLabel="h"
                accentColor="#4A879F"
                className="w-full"
              />
            </div>
          ) : null}

          {/* Filtro por fase do ciclo */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-0.5 pb-1">
            {PHASES.map((p) => {
              const active = phase === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPhase(p.key)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-ceci-academic text-white shadow-xs'
                      : 'bg-white text-ceci-academic-strong border border-ceci-border-academic hover:bg-surface-blue'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <InternshipLogCard key={log.id} log={log} />
            ))}
            {filteredLogs.length === 0 && (
              <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-5 text-center space-y-2">
                <Mascote expression="field-prepare" className="w-14 h-14 mx-auto" decorative />
                <p className="text-xs text-ceci-secondary">
                  {internshipLogs.length === 0
                    ? 'ainda não tem registro de estágio — que tal anotar o primeiro? ♡'
                    : 'nada por aqui nessa fase do ciclo ainda ♡'}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <SupervisionView />
      )}
    </div>
  );
};
