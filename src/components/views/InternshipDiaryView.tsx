import React, { useMemo, useState } from 'react';
import { HeartHandshake, Compass, Plus, AlertCircle, Clock, Users } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { InternshipLogCard } from '../InternshipLogCard';
import { SupervisionView } from './SupervisionView';
import { Mascote } from '../ui/Mascote';
import { DitherGrowthChart } from '../ui/dither-growth';
import { deriveCases } from '../../lib/internshipCases';
import { InternshipCaseCard } from '../internship/InternshipCaseCard';
import { InternshipCaseDetail } from '../internship/InternshipCaseDetail';

function weekStart(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // segunda = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Tela do estágio 2.0: diário + supervisão + pendências. */
export const InternshipDiaryView: React.FC = () => {
  const { internshipLogs, openWizard } = useMobileApp();
  const [tab, setTab] = useState<'diario' | 'supervisao' | 'pacientes'>('diario');
  const [selectedCase, setSelectedCase] = useState<ReturnType<typeof deriveCases>[0] | null>(null);

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

  const supervisionCount = internshipLogs.filter((l) => l.type === 'supervisao').length;

  // pendências derivadas
  const cases = useMemo(() => deriveCases(internshipLogs), [internshipLogs]);
  const pendingReflection = cases.reduce((a, c) => a + c.pendingReflection, 0);
  const pendingSupervision = cases.reduce((a, c) => a + c.pendingSupervision, 0);

  return (
    <div className="space-y-4 pb-1">
      <div className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-white border border-ceci-border-default shadow-sm">
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
            { key: 'pacientes', label: 'pacientes', Icon: Users },
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

          {/* Pendências */}
          {(pendingReflection > 0 || pendingSupervision > 0) && (
            <div className="rounded-2xl p-3 bg-surface-rose border border-ceci-border-brand shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-ceci-brand-strong mb-2">
                <AlertCircle className="w-4 h-4" />
                pendências
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/60 rounded-xl p-2 text-center">
                  <p className="font-bold text-ceci-primary">{pendingReflection}</p>
                  <p className="text-ceci-secondary">reflexões em aberto</p>
                </div>
                <div className="bg-white/60 rounded-xl p-2 text-center">
                  <p className="font-bold text-ceci-primary">{pendingSupervision}</p>
                  <p className="text-ceci-secondary">supervisões pendentes</p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de horas por semana */}
          {internshipLogs.length > 0 ? (
            <div className="rounded-2xl p-4 bg-white border border-ceci-border-default shadow-sm">
              <DitherGrowthChart
                data={weeklySeries}
                title="horas de campo por semana"
                unitLabel="h"
                accentColor="#4A879F"
                className="w-full"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            {internshipLogs.map((log) => (
              <InternshipLogCard key={log.id} log={log} />
            ))}
            {internshipLogs.length === 0 && (
              <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-5 text-center space-y-2">
                <Mascote expression="field-prepare" className="w-14 h-14 mx-auto" decorative />
                <p className="text-xs text-ceci-secondary">
                  ainda não tem registro de estágio — que tal anotar o primeiro? ♡
                </p>
              </div>
            )}
          </div>
        </>
      ) : tab === 'supervisao' ? (
        <SupervisionView />
      ) : (
        <>
          {cases.length === 0 ? (
            <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-5 text-center space-y-2">
              <Mascote expression="field-prepare" className="w-14 h-14 mx-auto" decorative />
              <p className="text-xs text-ceci-secondary">
                nenhum paciente registrado ainda — anote um atendimento clínico para aparecer aqui ♡
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <InternshipCaseCard key={c.patientKey} caseData={c} onPress={() => setSelectedCase(c)} />
              ))}
            </div>
          )}
          <InternshipCaseDetail caseData={selectedCase!} isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} />
        </>
      )}
    </div>
  );
};
