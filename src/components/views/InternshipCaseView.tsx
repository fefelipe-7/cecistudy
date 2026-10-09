import React, { useMemo, useState } from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { EmptyState } from '../ui/EmptyState';
import { HeroCard } from '../ui/HeroCard';
import { ProgressBar } from '../ui/ProgressBar';
import { PillGroup } from '../ui/PillGroup';
import { InternshipLogCard } from '../InternshipLogCard';
import { StatusChip } from '../internship/StatusChip';
import { todayKeyLocal, formatDateShortBR } from '../../lib/dateBR';
import { formatHours } from '../../lib/formatHours';
import { pluralPt } from '../../lib/pluralPt';
import { deriveCases, normalizePatientKey, nextSessionNumber } from '../../lib/internshipCases';

type FiltroCaso = 'todas' | 'sem reflexao' | 'sem supervisao';

/**
 * Tela do caso (paciente) — empilhada, não modal (`SPEC-009 D15`, §9.7).
 *
 * **O que muda em relação ao `InternshipCaseDetail`:** aquele era um `Modal`
 * position="bottom" que guardava o **objeto** do caso no estado, então o snapshot
 * ficava velho depois de editar (`U5`). Aqui a tela lê o `patientKey` da rota e
 * deriva o caso do estado **vivo** — editar uma sessão reflete imediatamente.
 *
 * A barra de ações é a parte que o modal não tinha: "+ nova sessão com M.S."
 * (pré-preenchida com número, idade e abordagem) e "levar pendentes pra
 * supervisão" (pré-seleciona as sessões do próprio caso).
 */
export const InternshipCaseView: React.FC = () => {
  const {
    internshipLogs,
    openInternshipWizard,
    handleRenamePatient,
    handleSetPatient,
    closeInternshipCase,
    showToast,
  } = useMobileApp();

  const patientKey = usePatientKeyFromNav();
  const today = todayKeyLocal();
  const [filtro, setFiltro] = useState<FiltroCaso>('todas');

  const derived = useMemo(() => deriveCases(internshipLogs, today), [internshipLogs, today]);

  const caso = patientKey === '' ? undefined : derived.cases.find((c) => c.patientKey === patientKey);
  const orfaos = patientKey === '' ? derived.orphans : [];

  // O caso sumiu (última sessão apagada, ou iniciais corrigidas para outro caso).
  if (patientKey !== '' && !caso) {
    React.useEffect(() => {
      showToast('esse paciente não tem mais sessões');
      closeInternshipCase();
    }, []);
    return null;
  }

  const label = caso?.patientLabel ?? 'sem iniciais';
  const logs = caso?.logs ?? orfaos;
  const agendados = (caso?.scheduledLogs ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const feitos = (caso?.doneLogs ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));

  const porFiltro = (list: typeof feitos) => {
    if (filtro === 'todas') return list;
    if (filtro === 'sem reflexao') return list.filter((l) => !(l.reflections ?? '').trim());
    return list.filter((l) => l.sessionNumber && !(l.reflections ?? '').trim() && !l.supervisionLogId);
  };

  const visiveis = [...porFiltro(feitos), ...(filtro === 'todas' ? agendados : [])];
  const temFiltro = (caso?.pendingReflection ?? 0) > 0 || (caso?.pendingSupervision ?? 0) > 0;

  const pendentesDoCaso = caso?.doneLogs.filter((l) => !l.reflections?.trim()).map((l) => l.id) ?? [];

  const novaSessao = () =>
    openInternshipWizard({
      kind: 'atendimento_clinico',
      patient: caso?.patientLabel,
      sessionNumber: caso ? nextSessionNumber(caso) : undefined,
      patientAge: caso?.latestAge,
      approach: caso?.latestApproach,
      date: today,
    });

  // Resumo do hero (SPEC-010 D3): o que a usuária precisa saber sobre a
  // pessoa numa linha — sessões, horas, última, contexto clínico e pendências.
  const resumo: string[] = [];
  if (caso) {
    resumo.push(pluralPt(caso.sessionsDone, 'sessão', 'sessões'));
    resumo.push(`${formatHours(caso.totalHours)} h`);
    if (caso.lastSessionDate) resumo.push(`última ${formatDateShortBR(caso.lastSessionDate)}`);
    if (caso.latestAge) resumo.push(`${caso.latestAge} anos`);
    if (caso.latestApproach) resumo.push(caso.latestApproach);
    if (caso.pendingReflection) resumo.push(`${caso.pendingReflection} sem reflexão`);
    if (caso.pendingSupervision) resumo.push(`${caso.pendingSupervision} sem supervisão`);
  }
  if (patientKey === '') {
    resumo.push(pluralPt(orfaos.length, 'registro sem iniciais', 'registros sem iniciais'));
  }

  return (
    <div className="space-y-4 pb-1">
        {/* Hero (SPEC-010 D1/D3) — ação primária aqui, secundárias embaixo */}
        <HeroCard
          accent="blue"
          eyebrow="paciente"
          title={label}
          summary={resumo.length ? resumo.join(' · ') : 'nenhuma sessão ainda ♡'}
          expression="connection-link"
          action={{
            label: 'nova sessão',
            onClick: novaSessao,
            ariaLabel: patientKey === '' ? 'nova sessão' : `nova sessão com ${label}`,
          }}
        />

        {caso && (
          <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary">
                sessões
              </p>
              <RenamePatientButton caso={caso} onRename={handleRenamePatient} />
            </div>

            {caso.sessionsDone > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat value={String(caso.sessionsDone)} label="sessões" />
                  <MiniStat value={formatHours(caso.totalHours)} label="total" suffix="h" />
                  <MiniStat
                    value={`${caso.sessionsSupervised}/${caso.sessionsDone}`}
                    label="superv."
                  />
                </div>
                <ProgressBar
                  value={caso.progress}
                  barClassName={caso.progress >= 100 ? 'bg-status-success' : undefined}
                />
              </>
            )}
          </div>
        )}

        {temFiltro && (
          <PillGroup<FiltroCaso>
            size="sm"
            variant="rose"
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'todas', label: 'todas' },
              ...(caso && caso.pendingReflection > 0
                ? [{ value: 'sem reflexao' as const, label: `sem reflexão ${caso.pendingReflection}` }]
                : []),
              ...(caso && caso.pendingSupervision > 0
                ? [{ value: 'sem supervisao' as const, label: `sem superv. ${caso.pendingSupervision}` }]
                : []),
            ]}
          />
        )}

        {/* Linha do tempo — mais recente primeiro */}
        {visiveis.length === 0 ? (
          <EmptyState
            description={filtro === 'todas' ? 'nenhuma sessão ainda por aqui ♡' : 'nada pendente nesse filtro ♡'}
            actionLabel="nova sessão"
            onAction={() =>
              openInternshipWizard({
                kind: 'atendimento_clinico',
                patient: caso?.patientLabel,
                sessionNumber: caso ? nextSessionNumber(caso) : undefined,
                patientAge: caso?.latestAge,
                approach: caso?.latestApproach,
                date: today,
              })
            }
          />
        ) : (
          <ol className="space-y-3 border-l border-ceci-border-subtle pl-4 ml-3">
            {agendados.map((log) => (
              <li key={`s-${log.id}`} className="relative">
                <TimelineNode label="próxima" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">
                  próxima · {formatDateShortBR(log.date)}
                </p>
                <InternshipLogCard log={log} today={today} allLogs={internshipLogs} variant="inCase" />
              </li>
            ))}
            {porFiltro(feitos).map((log) => (
              <li key={log.id} className="relative">
                <TimelineNode label={log.sessionNumber ? String(log.sessionNumber) : 'sessão'} />
                <p className="text-[11px] text-ceci-secondary mb-1">
                  {log.sessionNumber ? `sessão ${log.sessionNumber}` : 'sessão'} ·{' '}
                  {formatDateShortBR(log.date)}
                </p>
                <InternshipLogCard log={log} today={today} allLogs={internshipLogs} variant="inCase" />
              </li>
            ))}
          </ol>
        )}

        {/* Órfãos: cada registro recebe iniciais, nunca em bloco (`D9`) */}
        {patientKey === '' && orfaos.length > 0 && (
          <div className="rounded-2xl p-3 bg-surface-muted border border-status-warning-border">
            <p className="text-[11px] font-semibold text-status-warning-strong inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden />
              {pluralPt(orfaos.length, 'atendimento sem iniciais', 'atendimentos sem iniciais')}
            </p>
            <p className="text-[11px] text-ceci-secondary mt-1">
              cada um pode ser uma pessoa diferente — por isso as iniciais são por registro.
            </p>
          </div>
        )}

        {/* Barra de ações — só secundárias: a primária ("nova sessão") está no hero (D3) */}
        <div className="flex flex-col gap-2">
          {caso && caso.pendingSupervision > 0 && (
            <button
              type="button"
              onClick={() =>
                openInternshipWizard({
                  kind: 'supervisao',
                  discussedLogIds: caso.doneLogs
                    .filter((l) => !l.supervisionLogId && (l.reflections ?? '').trim())
                    .map((l) => l.id)
                    .length
                    ? caso.doneLogs
                        .filter((l) => !l.supervisionLogId && (l.reflections ?? '').trim())
                        .map((l) => l.id)
                    : pendentesDoCaso,
                })
              }
              className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic cursor-pointer tap-interactive"
            >
              levar pendentes pra supervisão
            </button>
          )}

          {patientKey === '' && orfaos.length > 0 && (
            <SetPatientButton logs={orfaos} onSet={handleSetPatient} />
          )}
        </div>
      </div>
  );
};

/** `patientKey` vem da tela; `undefined` só durante a hidratação da rota. */
function usePatientKeyFromNav(): string {
  const app = useMobileApp() as unknown as { internshipPatientKey?: string };
  return app.internshipPatientKey ?? '';
}

const MiniStat: React.FC<{ value: string; label: string; suffix?: string }> = ({
  value,
  label,
  suffix,
}) => (
  <div className="rounded-xl bg-surface-muted border border-ceci-border-default p-3 text-center min-w-0">
    <p className="font-display font-bold text-lg text-ceci-primary leading-none break-words">
      {value}
      {suffix ? <span className="text-[12px] text-ceci-secondary ml-0.5">{suffix}</span> : null}
    </p>
    <p className="text-[12px] text-ceci-tertiary mt-1 truncate">{label}</p>
  </div>
);

const TimelineNode: React.FC<{ label: string }> = ({ label }) => (
  <span className="absolute -left-[26px] top-1 w-7 h-7 rounded-full bg-surface-default border border-ceci-border-academic flex items-center justify-center text-[10px] font-bold text-ceci-academic-strong">
    {label.length > 2 ? '•' : label}
  </span>
);

const RenamePatientButton: React.FC<{
  caso: { patientKey: string; patientLabel: string };
  onRename: (fromKey: string, toLabel: string) => void;
}> = ({ caso, onRename }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(caso.patientLabel);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] px-3 rounded-full text-[11px] font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive shrink-0"
      >
        corrigir iniciais
      </button>
    );
  }
  return (
    <div className="w-full space-y-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="iniciais do paciente"
        placeholder="M. S."
        className="w-full rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary min-h-[44px]"
      />
      <p className="text-[11px] text-ceci-tertiary">só iniciais, sem nome completo ♡</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => {
            onRename(caso.patientKey, value);
            setOpen(false);
          }}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand disabled:opacity-40 cursor-pointer tap-interactive"
        >
          guardar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
        >
          cancelar
        </button>
      </div>
    </div>
  );
};

const SetPatientButton: React.FC<{
  logs: { id: string }[];
  onSet: (ids: string[], label: string) => void;
}> = ({ logs, onSet }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
      >
        adicionar iniciais
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="iniciais"
        placeholder="M. S."
        className="w-full rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary min-h-[44px]"
      />
      <p className="text-[11px] text-ceci-tertiary">
        {pluralPt(logs.length, 'registro será corrigido', 'registros serão corrigidos')}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => {
            onSet(
              logs.map((l) => l.id),
              value
            );
            setOpen(false);
            setValue('');
          }}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand disabled:opacity-40 cursor-pointer tap-interactive"
        >
          guardar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
        >
          cancelar
        </button>
      </div>
    </div>
  );
};

export { Stethoscope, normalizePatientKey };