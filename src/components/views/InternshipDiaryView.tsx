import React, { useMemo, useState } from 'react';
import { HeartHandshake, Compass, AlertCircle, Users, Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { InternshipLogCard } from '../InternshipLogCard';
import { SupervisionView } from './SupervisionView';
import { HeroCard } from '../ui/HeroCard';
import { Mascote } from '../ui/Mascote';
import { EmptyState } from '../ui/EmptyState';
import { DitherGrowthChart } from '../ui/dither-growth';
import { UnderlineTabBar } from '../ui/UnderlineTabBar';
import { PillGroup } from '../ui/PillGroup';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusChip } from '../internship/StatusChip';
import { InternshipCaseCard } from '../internship/InternshipCaseCard';
import {
  deriveCases,
  computeStats,
  computePendencies,
  groupByWeek,
} from '../../lib/internshipCases';
import { todayKeyLocal } from '../../lib/dateBR';
import { formatHours } from '../../lib/formatHours';
import { pluralPt } from '../../lib/pluralPt';
import { isDarkTheme } from '../../lib/themes';
import type { InternshipLog } from '../../types';
import type { LogGroupId } from '../../types';

export type InternshipTab = 'diario' | 'pacientes' | 'supervisao';

type Filter = 'todos' | 'campo' | 'clinico' | 'supervisao';
type PendingFilter = 'reflexao' | 'supervisao' | null;

const FILTER_TYPES: Record<Filter, InternshipLog['type'][]> = {
  todos: [],
  campo: ['estagio', 'outro'],
  clinico: ['atendimento_clinico'],
  supervisao: ['supervisao', 'intervisao'],
};

/**
 * Tela do Estágio — v2 (`SPEC-009 §9.2`–`§9.3`).
 *
 * **Uma derivação só.** Antes as horas eram somadas em três lugares diferentes
 * (`F6`) e as pendências eram derivadas por caso, o que fazia atendimento sem
 * iniciais sumir de todo contador (`F9`). Agora um `useMemo` produz
 * `stats`, `pendências`, `linkIndex` e `casos`, e as abas recebem por props.
 */
export const InternshipDiaryView: React.FC = () => {
  const {
    internshipLogs,
    openWizard,
    openInternshipWizard,
    themePref,
    profile,
    handleUpdateProfile,
    internshipTab,
    openInternshipDiary,
    openInternshipCase,
  } = useMobileApp();
  const appIsDark = isDarkTheme(themePref);
  // A aba vem da **navegação** (D16), não de useState: voltar do caso ou do
  // wizard reabre na mesma aba, e a aba é deep-link.
  const tab: InternshipTab = internshipTab ?? 'diario';
  const setTab = (t: InternshipTab) => openInternshipDiary(t);
  const [filter, setFilter] = useState<Filter>('todos');
  const [pending, setPending] = useState<PendingFilter>(null);
  const [extraWeeks, setExtraWeeks] = useState(0);

  const today = todayKeyLocal();

  // A única derivação da tela. Tudo abaixo lê daqui.
  const derived = useMemo(() => {
    const stats = computeStats(internshipLogs, today);
    const pend = computePendencies(internshipLogs, today);
    const { cases, orphans } = deriveCases(internshipLogs, today);
    const groups = groupByWeek(internshipLogs, today);
    return { stats, pend, cases, orphans, groups };
  }, [internshipLogs, today]);

  const { stats, pend, cases, orphans, groups } = derived;

  const filtered = useMemo(() => {
    const byType = (logs: InternshipLog[]) => {
      const allowed = FILTER_TYPES[filter];
      if (!allowed.length) return logs;
      return logs.filter((l) => allowed.includes(l.type));
    };
    const byPending = (logs: InternshipLog[]) => {
      if (!pending) return logs;
      const ids = pending === 'reflexao' ? pend.noReflection : pend.noSupervision;
      return logs.filter((l) => ids.includes(l.id));
    };
    return groups
      .filter((g) => !(pending && g.id === 'upcoming'))
      .map((g) => ({ ...g, logs: byPending(byType(g.logs)) }))
      .filter((g) => g.logs.length > 0);
  }, [groups, filter, pending, pend]);

  const goal = profile?.internshipGoalHours;
  const goalPct = goal ? Math.min(100, (stats.doneHours / goal) * 100) : 0;
  const hasPending = pend.noReflection.length > 0 || pend.noSupervision.length > 0;

  const togglePending = (which: Exclude<PendingFilter, null>) => {
    setPending((p) => (p === which ? null : which));
  };

  const openWizardForTab = () => {
    if (tab === 'pacientes') openInternshipWizard({ kind: 'atendimento_clinico' });
    else if (tab === 'supervisao') openInternshipWizard({ kind: 'supervisao' });
    else openWizard('internship');
  };

  // Hero único, acima da barra de abas (SPEC-010 D1/D3): o conteúdo muda com a
  // aba, a identidade não — trocar de aba não pula o topo da tela.
  const encontros = internshipLogs.filter(
    (l) => l.type === 'supervisao' || l.type === 'intervisao'
  ).length;
  const pendencias: string[] = [];
  if (pend.noReflection.length) pendencias.push(`${pend.noReflection.length} sem reflexão`);
  if (pend.noSupervision.length) pendencias.push(`${pend.noSupervision.length} sem supervisão`);
  const pendenciasSummary = pendencias.length ? pendencias.join(' · ') : 'tudo em dia ♡';

  const hero =
    tab === 'pacientes'
      ? {
          title: pluralPt(cases.length, 'paciente', 'pacientes'),
          summary:
            orphans.length > 0
              ? `${pluralPt(stats.clinicalDoneCount, 'sessão clínica feita', 'sessões clínicas feitas')} · ${pluralPt(orphans.length, 'sem iniciais', 'sem iniciais')}`
              : pluralPt(stats.clinicalDoneCount, 'sessão clínica feita', 'sessões clínicas feitas'),
          expression: 'connection-link' as const,
          actionLabel: 'anotar atendimento',
        }
      : tab === 'supervisao'
        ? {
            title: pluralPt(encontros, 'encontro', 'encontros'),
            summary: pend.noSupervision.length
              ? `${pluralPt(pend.noSupervision.length, 'sessão esperando supervisão', 'sessões esperando supervisão')}`
              : pendenciasSummary,
            expression: 'supervision-reflect' as const,
            actionLabel: 'anotar supervisão',
          }
        : {
            title: `${formatHours(stats.doneHours)} h de campo`,
            summary: `${goal ? `meta ${formatHours(goal)} h` : 'sem meta ainda'} · ${pendenciasSummary}`,
            expression: 'field-prepare' as const,
            actionLabel: 'anotar',
          };

  return (
    <div className="space-y-4 pb-1">
      {/* Hero (SPEC-010 D1) — acima da barra de abas */}
      <HeroCard
        eyebrow="estágio"
        title={hero.title}
        summary={hero.summary}
        expression={hero.expression}
        action={{
          label: hero.actionLabel,
          onClick: openWizardForTab,
          ariaLabel: `${hero.actionLabel} no estágio`,
        }}
      />

      {/* Abas com badge de pendência */}
      <UnderlineTabBar<InternshipTab>
        active={tab}
        onChange={(t) => {
          setTab(t);
          setPending(null);
        }}
        tabs={[
          { id: 'diario', label: 'diário', icon: <HeartHandshake className="w-4 h-4" />, badge: pend.noReflection.length },
          { id: 'pacientes', label: 'pacientes', icon: <Users className="w-4 h-4" /> },
          {
            id: 'supervisao',
            label: 'supervisão',
            icon: <Compass className="w-4 h-4" />,
            badge: pend.noSupervision.length,
          },
        ]}
      />

      {tab === 'supervisao' ? (
        <SupervisionView today={today} cases={cases} pendingIds={pend.noSupervision} />
      ) : tab === 'pacientes' ? (
        <section className="space-y-3">
          {cases.length > 0 && (
            <p className="text-[11px] text-ceci-tertiary">
              {pluralPt(cases.length, 'paciente', 'pacientes')} ·{' '}
              {pluralPt(stats.clinicalDoneCount, 'sessão feita', 'sessões feitas')}
            </p>
          )}
          {cases.length === 0 && orphans.length === 0 ? (
            <EmptyState
              description="nenhum paciente por aqui ainda — anote um atendimento clínico e ele aparece aqui ♡"
              actionLabel="anotar atendimento"
              onAction={() => openInternshipWizard({ kind: 'atendimento_clinico' })}
            />
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <InternshipCaseCard
                  key={c.patientKey}
                  caseData={c}
                  onPress={() => openInternshipCase(c.patientKey)}
                />
              ))}
              {orphans.length > 0 && (
                <button
                  type="button"
                  onClick={() => openInternshipCase('')}
                  className="w-full text-left p-4 rounded-2xl bg-surface-muted border border-status-warning-border shadow-sm cursor-pointer tap-interactive"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-status-warning-strong" />
                    <span className="text-xs font-semibold text-status-warning-strong">
                      {pluralPt(orphans.length, 'atendimento sem iniciais', 'atendimentos sem iniciais')}
                    </span>
                  </div>
                  <p className="text-[11px] text-ceci-secondary mt-1">toque pra completar</p>
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* a) Resumo */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-lg">{formatHours(stats.doneHours)}</p>
              <p className="text-[12px] text-ceci-secondary">
                {goal ? `de ${formatHours(goal)} h` : 'horas feitas'}
              </p>
            </div>
            <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-lg">{formatHours(stats.weekHours)}</p>
              <p className="text-[12px] text-ceci-secondary">esta semana</p>
            </div>
            <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
              <p className="font-bold text-ceci-academic-strong text-lg">{stats.clinicalDoneCount}</p>
              <p className="text-[12px] text-ceci-secondary">
                {pluralPt(stats.clinicalDoneCount, 'sessão', 'sessões')}
              </p>
            </div>
          </div>

          {/* Meta de horas (D2) */}
          {goal ? (
            <div className="space-y-1.5">
              <ProgressBar
                value={goalPct}
                barClassName={goalPct >= 100 ? 'bg-status-success' : undefined}
              />
              <p className="text-[11px] text-ceci-secondary">
                {goalPct >= 100
                  ? 'meta batida ♡'
                  : `faltam ${formatHours(Math.max(0, goal - stats.doneHours))} h`}
              </p>
            </div>
          ) : (
            <GoalCta onSet={(h) => handleUpdateProfile({ internshipGoalHours: h })} />
          )}

          {/* c) Pendências — somem quando zeradas (D13) */}
          {hasPending && (
            <div className="rounded-2xl p-4 bg-surface-muted border border-status-warning-border space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-status-warning-strong">
                <AlertCircle className="w-4 h-4" aria-hidden />
                pendências
              </div>
              <div className="flex flex-wrap gap-2">
                {pend.noReflection.length > 0 && (
                  <StatusChip
                    tone="warning"
                    pressed={pending === 'reflexao'}
                    onClick={() => togglePending('reflexao')}
                    label={`${pend.noReflection.length} sem reflexão`}
                  />
                )}
                {pend.noSupervision.length > 0 && (
                  <StatusChip
                    tone="warning"
                    pressed={pending === 'supervisao'}
                    onClick={() => togglePending('supervisao')}
                    label={`${pend.noSupervision.length} sem supervisão`}
                  />
                )}
              </div>
            </div>
          )}

          {/* d) Gráfico — só com 2+ semanas de dado (U7) */}
          {stats.weeksWithData >= 2 && (
            <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm">
              <DitherGrowthChart
                theme={appIsDark ? 'dark' : 'light'}
                data={stats.weeklySeries}
                title="horas de campo por semana"
                unitLabel="h"
                accentColor="#4A879F"
                className="w-full"
              />
            </div>
          )}

          {/* e) Filtros */}
          <PillGroup<Filter>
            size="sm"
            variant="rose"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'todos' },
              { value: 'campo', label: 'campo' },
              { value: 'clinico', label: 'clínico' },
              { value: 'supervisao', label: 'supervisão' },
            ]}
          />

          {pending && (
            <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default flex items-center justify-between gap-2 text-[12px] text-ceci-secondary">
              <span>
                mostrando {pending === 'reflexao' ? pend.noReflection.length : pend.noSupervision.length}{' '}
                {pending === 'reflexao' ? 'sem reflexão' : 'sem supervisão'}
              </span>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="min-h-[44px] px-4 rounded-full text-[12px] font-semibold bg-surface-default border border-ceci-border-default cursor-pointer tap-interactive"
              >
                limpar
              </button>
            </div>
          )}

          {/* f) Lista agrupada por semana */}
          {internshipLogs.length === 0 ? (
            <EmptyState
              description="ainda não tem registro de estágio — que tal anotar o primeiro? ♡"
              actionLabel="anotar"
              onAction={() => openWizard('internship')}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              description="nada por aqui com esse filtro"
              actionLabel="limpar filtros"
              onAction={() => { setFilter('todos'); setPending(null); }}
            />
          ) : (
            <div className="space-y-4">
              {visibleGroups(filtered, extraWeeks).map((g) => (
                <section key={g.id as LogGroupId}>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary">
                      {g.label}
                    </h3>
                    {g.hours > 0 && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary">
                        · {formatHours(g.hours)} h
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {g.logs.map((log) => (
                      <InternshipLogCard
                        key={log.id}
                        log={log}
                        today={today}
                        allLogs={internshipLogs}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {countDoneGroups(filtered) > 4 && (
                <button
                  type="button"
                  onClick={() => setExtraWeeks((n) => n + 8)}
                  className="w-full min-h-[44px] rounded-full text-xs font-semibold bg-surface-default border border-ceci-border-default cursor-pointer tap-interactive"
                >
                  ver semanas anteriores
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/** `E11`: as 4 semanas mais recentes, mais o que a usuária pediu ver. */
const visibleGroups = (groups: ReturnType<typeof groupByWeek>, extra: number) => {
  const done = groups.filter((g) => g.id !== 'upcoming');
  const keep = 4 + extra;
  if (done.length <= keep) return groups;
  return [...groups.filter((g) => g.id === 'upcoming'), ...done.slice(0, keep)];
};

const countDoneGroups = (groups: ReturnType<typeof groupByWeek>) =>
  groups.filter((g) => g.id !== 'upcoming').length;

const GoalCta: React.FC<{ onSet: (hours: number) => void }> = ({ onSet }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const n = Number(value.replace(',', '.'));
    if (!Number.isInteger(n) || n < 1 || n > 5000) {
      setError('coloque um número entre 1 e 5000');
      return;
    }
    onSet(n);
    setOpen(false);
    setValue('');
    setError('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] rounded-full text-xs font-semibold text-ceci-brand-strong border border-ceci-border-brand bg-surface-rose cursor-pointer tap-interactive"
      >
        definir meta
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default space-y-2">
      <p className="text-[11px] font-semibold text-ceci-secondary">meta de horas</p>
      <input
        autoFocus
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError('');
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="ex.: 300"
        aria-label="meta de horas"
        className="w-full rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary min-h-[44px]"
      />
      <p className="text-[11px] text-ceci-tertiary">
        quantas horas seu estágio pede no total? dá pra mudar quando quiser
      </p>
      {error && <p className="text-[11px] text-status-warning-strong">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-ceci-primary text-ceci-on-primary cursor-pointer tap-interactive"
        >
          guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
        >
          cancelar
        </button>
      </div>
    </div>
  );
};