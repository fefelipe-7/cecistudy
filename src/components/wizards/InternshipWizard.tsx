import React, { useMemo } from 'react';
import { HeartHandshake, Stethoscope, Compass, Users, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { InternshipLog, InternshipLogType, ManagedItem } from '../../types';
import type { InternshipWizardSeed } from '../../types/internshipSeed';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldLabel, ReviewCard, TextArea, TextInput, DateInput } from './wizardFields';
import { TagField } from '../ui/TagField';
import { PillGroup } from '../ui/PillGroup';
import { ToggleRow } from '../ui/ToggleRow';
import { formatDateBR, formatDateShortBR } from '../../lib/dateBR';
import { pluralPt } from '../../lib/pluralPt';
import { formatHours } from '../../lib/formatHours';
import {
  suggestTitle,
  normalizePatientKey,
  formatPatientLabel,
  deriveCases,
  nextSessionNumber,
  statusOf,
  buildLinkIndex,
  isDone,
  camposDeReferencia,
  comDeclinados,
  CAMPO_REFERENCIA_LABEL,
  CAMPO_REFERENCIA_DESCRICAO,
  type CampoPendencia,
} from '../../lib/internshipCases';

/**
 * Wizard de estágio — v4 (`SPEC-009 §9.9`).
 *
 * O que mudou em relação ao v3, e por quê:
 *
 * - **Resumo (`activity`) é opcional** (`D10`). Era a maior fricção do wizard: a
 *   usuária era obrigada a escrever um título pra poder avançar. Vazio salva com
 *   `suggestTitle`, que é um **rótulo**, não conteúdo inventado.
 * - **Só atendimento clínico exige iniciais** (`D9`). Antes `canNext` exigia
 *   `activity` para *todos* os tipos, o que travava a supervisionão por causa de um
 *   campo de texto.
 * - **Uma escrita só** (`D3`). O v3 salvava a supervisão e depois chamava
 *   `handleUpdateInternshipLog` uma vez por sessão marcada — `1 + n` `setState`.
 * - **Aceita seed** (§8.4) e, com seed, não lê nem grava rascunho.
 * - **Checkbox customizado** no seletor de discutidas: o `<input type="checkbox">`
 *   nativo é pequeno demais para alvo de toque e não aceita `role`/estilo do app.
 * - **Horas decimais** (`D18`): `1,5` era perdido pelo `parseFloat` em string com
 *   vírgula.
 */

const KINDS: {
  value: InternshipLogType;
  label: string;
  caption: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'estagio', label: 'estágio', caption: 'dia de campo na clínica escola', Icon: HeartHandshake },
  { value: 'atendimento_clinico', label: 'atendimento clínico', caption: 'sessão com paciente', Icon: Stethoscope },
  { value: 'supervisao', label: 'supervisão', caption: 'orientação da supervisora', Icon: Compass },
  { value: 'intervisao', label: 'intervisão', caption: 'troca com colegas de estágio', Icon: Users },
  { value: 'outro', label: 'outro', caption: 'registro avulso de campo', Icon: Sparkles },
];

const KIND_META: Record<InternshipLogType, { title: string; icon: React.ReactNode }> = {
  estagio: { title: 'novo registro de estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
  atendimento_clinico: { title: 'novo atendimento clínico', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  supervisao: { title: 'nova supervisão', icon: <Compass className="w-3.5 h-3.5" /> },
  intervisao: { title: 'nova intervisão', icon: <Users className="w-3.5 h-3.5" /> },
  outro: { title: 'novo registro', icon: <Sparkles className="w-3.5 h-3.5" /> },
};

/** Atalhos de horas — evita digitar o número mais comum. */
const HOUR_SHORTCUTS = ['1', '2', '3', '4', '6'];

interface InternshipDraft {
  kind?: InternshipLogType | null;
  activity?: string;
  hours?: string;
  date?: string;
  reflections?: string;
  discussedLogIds?: string[];
  beforeNotes?: string;
  afterNotes?: string;
  selfAssessment?: { confidence?: string; limits?: string; themes?: string };
  nextSteps?: string[];
  supervisor?: string;
  topics?: string[];
  orientations?: string;
  doubts?: string;
  patient?: string;
  sessionNumber?: string;
  patientAge?: string;
  theme?: string;
  approach?: string;
  interventionNotes?: string;
  observations?: string;
  /** `SPEC-011 D11`: campos de referência que a usuária optou por não responder. */
  declinedFields?: CampoPendencia[];
}

/** `"1,5"` e `"1.5"` são a mesma hora (`E9`). `parseFloat` só entende o ponto. */
export const parseHours = (raw?: string): number => {
  const n = Number((raw ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};

const MAX_HOURS = 24; // `D18`

export const InternshipWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    internshipLogs,
    wizardSeed,
    handleSaveInternshipLog,
    closeWizard,
    showToast,
  } = useMobileApp();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const editingLog =
    editing?.kind === 'internship' ? internshipLogs.find((l) => l.id === editing.id) : undefined;

  // Seed ou edição direta (`editId`) — a edição pelo seed não passa pelo menu.
  const seedTarget = useMemo(() => {
    if (editingLog) return editingLog;
    if (!wizardSeed?.editId) return undefined;
    return internshipLogs.find((l) => l.id === wizardSeed.editId);
  }, [editingLog, wizardSeed, internshipLogs]);

  // **Com seed, o wizard não lê nem grava rascunho.** Se lesse
  // `wizard_draft_internship`, o rascunho antigo sobrescreveria o seed — e o
  // rascunho precisa ficar intacto para voltar quando abrir sem seed.
  const useDraft = !seedTarget && !wizardSeed;

  const { values, patch, step, setStep, clearDraft, isDirty } = useWizardForm<InternshipDraft>({
    draftKey: useDraft ? 'internship' : undefined,
    initialStep: 0,
    initial: {
      kind: seedTarget?.type ?? wizardSeed?.kind ?? null,
      activity: seedTarget?.activity ?? '',
      hours: seedTarget ? String(seedTarget.hours) : '',
      date: seedTarget?.date ?? wizardSeed?.date ?? todayKey,
      reflections: seedTarget?.reflections ?? '',
      patient: seedTarget?.patient ?? wizardSeed?.patient ?? '',
      sessionNumber: seedTarget?.sessionNumber
        ? String(seedTarget.sessionNumber)
        : wizardSeed?.sessionNumber
        ? String(wizardSeed.sessionNumber)
        : '',
      patientAge: seedTarget?.patientAge ?? wizardSeed?.patientAge ?? '',
      theme: seedTarget?.theme ?? '',
      approach: seedTarget?.approach ?? wizardSeed?.approach ?? '',
      interventionNotes: seedTarget?.interventionNotes ?? '',
      observations: seedTarget?.observations ?? '',
      // `SPEC-011 D11`: ausência = todos os cinco campos ativos.
      declinedFields: seedTarget?.declinedFields ?? undefined,
      supervisor: seedTarget?.supervisor ?? '',
      topics: seedTarget?.topics ?? [],
      orientations: seedTarget?.orientations ?? '',
      doubts: seedTarget?.doubts ?? '',
      nextSteps: seedTarget?.nextSteps ?? [],
      // Em edição, as já vinculadas ficam marcadas e visíveis (não podem sumir do
      // passo). Com seed, o `discussedLogIds` do seed entra como pré-seleção.
      discussedLogIds: seedTarget?.discussedLogIds ?? wizardSeed?.discussedLogIds ?? [],
      beforeNotes: seedTarget?.beforeNotes ?? '',
      afterNotes: seedTarget?.afterNotes ?? '',
      selfAssessment: seedTarget?.selfAssessment
        ? {
            confidence: seedTarget.selfAssessment.confidence,
            limits: seedTarget.selfAssessment.limits,
            themes: seedTarget.selfAssessment.themes,
          }
        : undefined,
    },
    editing: !!seedTarget,
    // `isDirty` passou a considerar **qualquer campo de conteúdo**: o v3 só olhava
    // título e reflexão, então um registro salvo com tema e sem reflexão era
    // descartado sem avisar.
    isDirty: (v) =>
      !seedTarget &&
      [
        v.activity,
        v.reflections,
        v.patient,
        v.theme,
        v.approach,
        v.interventionNotes,
        v.observations,
        v.doubts,
        v.orientations,
        v.supervisor,
      ].some((s) => !!s?.trim()),
  });

  const {
    kind, activity, hours, date, reflections, patient, sessionNumber, patientAge,
    theme, approach, interventionNotes, observations, supervisor, topics,
    orientations, doubts, nextSteps, discussedLogIds, beforeNotes, afterNotes, selfAssessment,
    declinedFields,
  } = values;
  const confidence = selfAssessment?.confidence ?? '';
  const limits = selfAssessment?.limits ?? '';
  const themes = selfAssessment?.themes ?? '';
  const setKind = (k: InternshipLogType | null) => patch({ kind: k });

  const index = useMemo(() => buildLinkIndex(internshipLogs, todayKey), [internshipLogs, todayKey]);
  const derived = useMemo(() => deriveCases(internshipLogs, todayKey), [internshipLogs, todayKey]);

  const hourNumber = parseHours(hours);
  const hoursTooHigh = hourNumber > MAX_HOURS;
  const isFuture = !!date && date > todayKey; // `D7`

  // Validação mínima: só o atendimento exige iniciais (`D9`).
  const missingInitials = kind === 'atendimento_clinico' && !patient.trim();
  const canAdvance = kind !== null && !missingInitials && !hoursTooHigh;

  /** Título sugerido, que muda conforme o contexto preenchido (`D10`). */
  const titleHint = suggestTitle({
    id: 'preview',
    type: kind ?? 'estagio',
    date: date ?? todayKey,
    hours: hourNumber,
    activity: '',
    reflections: '',
    patient: patient.trim(),
    sessionNumber: sessionNumber ? Number(sessionNumber) : undefined,
    supervisor: supervisor.trim(),
  });

  const finish = () => {
    clearDraft();
    closeWizard();
  };

  // ----patients para o picker ------------------------------------------------
  const existingPatients = derived.cases.map((c) => ({
    key: c.patientKey,
    label: c.patientLabel,
    case: c,
  }));

  const typedKey = normalizePatientKey(patient);
  const duplicateCase =
    kind === 'atendimento_clinico' && typedKey
      ? derived.cases.find((c) => c.patientKey === typedKey)
      : undefined;
  // "M. S. Pereira" tem 3 palavras com 3+ letras: parece nome completo.
  const looksFullName =
    kind === 'atendimento_clinico' &&
    patient.trim().length > 12 &&
    patient.trim().split(/\s+/).filter((w) => w.replace(/\./g, '').length >= 3).length >= 2;
  const duplicateSession = (() => {
    if (kind !== 'atendimento_clinico' || !typedKey || !sessionNumber) return undefined;
    const caso = derived.cases.find((c) => c.patientKey === typedKey);
    return caso?.logs.find(
      (l) => String(l.sessionNumber ?? '') === sessionNumber.trim() && l.id !== seedTarget?.id
    );
  })();

  // ----sessões discutíveis: só feitas -----------------------------------------
  const linkIndex = index;
  const attendanceLogs = useMemo(() => {
    return internshipLogs
      .filter((l) => l.type === 'atendimento_clinico' && isDone(l, todayKey))
      .sort((a, b) => {
        const aSup = statusOf(a, linkIndex, todayKey).supervised;
        const bSup = statusOf(b, linkIndex, todayKey).supervised;
        if (aSup !== bSup) return aSup ? 1 : -1; // pendentes primeiro
        const an = a.sessionNumber ?? 0;
        const bn = b.sessionNumber ?? 0;
        if (an !== bn) return an - bn;
        return a.date.localeCompare(b.date);
      });
  }, [internshipLogs, linkIndex, todayKey]);

  const inThisSupervision = seedTarget?.discussedLogIds ?? [];
  const pendingAttendance = attendanceLogs.filter(
    (l) => !statusOf(l, linkIndex, todayKey).supervised && !inThisSupervision.includes(l.id)
  );
  const discussedElsewhere = attendanceLogs.filter(
    (l) => statusOf(l, linkIndex, todayKey).supervised && !inThisSupervision.includes(l.id)
  );
  const hereAttendance = attendanceLogs.filter((l) => inThisSupervision.includes(l.id));

  const toggleDiscussed = (id: string) =>
    patch({
      discussedLogIds: discussedLogIds.includes(id)
        ? discussedLogIds.filter((x) => x !== id)
        : [...discussedLogIds, id],
    });

  // ==========================================================================
  // Passos
  // ==========================================================================

  const choiceStep: WizardStep = {
    id: 'tipo',
    title: 'tipo',
    headline: 'o que você quer registrar agora?',
    subtitle: 'cada tipo tem campos próprios — escolhe o que combina com o que viveu hoje.',
    content: (
      <div className="space-y-3">
        {KINDS.map((k) => {
          const Icon = k.Icon;
          return (
            <button
              key={k.value}
              onClick={() => {
                setKind(k.value);
                setStep(0);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm min-h-[44px]"
            >
              <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-display font-bold text-base text-ceci-primary">{k.label}</span>
                <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">{k.caption}</span>
              </span>
            </button>
          );
        })}
      </div>
    ),
  };

  const hoursField = (
    <div>
      <FieldLabel>horas</FieldLabel>
      <TextInput
        inputMode="decimal"
        value={hours}
        onChange={(e) => patch({ hours: e.target.value })}
        placeholder="ex: 1,5"
      />
      {hoursTooHigh ? (
        <p className="text-[11px] text-status-warning-strong mt-1">até 24 h por registro</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {HOUR_SHORTCUTS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => patch({ hours: h })}
              className="min-h-[44px] px-3 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
            >
              {h} h
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const futureNotice = isFuture ? (
    <p className="text-[11px] text-status-warning-strong inline-flex items-center gap-1.5">
      <AlertCircle className="w-3.5 h-3.5" aria-hidden />
      essa data ainda não chegou — vai ficar como agendado ♡
    </p>
  ) : null;

  /** Passo essencial, com variantes por tipo (`D9`: só clínico exige iniciais). */
  const essentialStep = (extra?: React.ReactNode): WizardStep => ({
    id: 'essencial',
    title: 'essencial',
    headline: 'o que aconteceu e quando?',
    subtitle: 'horas e data são opcionais e dá para ajustar depois.',
    content: (
      <div className="space-y-4">
        {kind === 'atendimento_clinico' && missingInitials && (
          <p className="text-[11px] text-status-warning-strong">coloque as iniciais do paciente</p>
        )}
        {extra}
        <div>
          <FieldLabel>título (opcional)</FieldLabel>
          <TextInput
            value={activity}
            onChange={(e) => patch({ activity: e.target.value })}
            placeholder={titleHint}
          />
          {!activity.trim() && (
            <p className="text-[11px] text-ceci-tertiary mt-1">vazio salva como “{titleHint}”</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hoursField}
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => patch({ date: e.target.value })} />
            {futureNotice}
          </div>
        </div>
      </div>
    ),
  });

  const reflectionStep = (extra?: React.ReactNode): WizardStep => ({
    id: 'reflexao',
    title: 'reflexão',
    headline: 'como foi essa experiência pra você?',
    subtitle: 'suas impressões e aprendizados — é o coração do diário de estágio ♡',
    content: (
      <div className="space-y-4">
        {isFuture && (
          <p className="text-[11px] text-ceci-tertiary">dá pra preencher depois</p>
        )}
        {extra}
        <TextArea
          rows={5}
          value={reflections}
          onChange={(e) => patch({ reflections: e.target.value })}
          placeholder="como foi pra você? o que aprendeu?"
        />
      </div>
    ),
  });

  /** `SPEC-011 D10/D11`: só os switches — a escolha de campos persiste no log. */
  const camposStep = (): WizardStep => ({
    id: 'campos',
    title: 'campos',
    headline: 'quais campos você quer responder?',
    subtitle:
      'os que você desligar ficam anotados como não respondidos — dá pra ligar de novo depois.',
    content: (
      <div className="space-y-3">
        {camposDeReferencia(kind ?? 'estagio').map((c) => (
          <ToggleRow
            key={c}
            label={CAMPO_REFERENCIA_LABEL[c]}
            description={CAMPO_REFERENCIA_DESCRICAO[c]}
            checked={!(declinedFields ?? []).includes(c)}
            onChange={() =>
              patch({
                declinedFields: (declinedFields ?? []).includes(c)
                  ? declinedFields.filter((k) => k !== c)
                  : [...(declinedFields ?? []), c],
              })
            }
          />
        ))}
      </div>
    ),
  });

  const pacienteField = (
    <div className="space-y-2">
      <FieldLabel>paciente (só iniciais, sem nome completo ♡)</FieldLabel>
      <TextInput
        value={patient}
        onChange={(e) => patch({ patient: e.target.value })}
        placeholder="ex: M. S."
        onBlur={() => patch({ patient: formatPatientLabel(patient) })}
      />
      {existingPatients.length > 0 && (
        <PillGroup
          size="sm"
          variant="rose"
          value={typedKey || '__none__'}
          onChange={(key) => {
            const alvo = existingPatients.find((p) => p.key === key);
            if (!alvo) return;
            // Preenche o resto **só se o campo ainda estiver vazio**: sobrescrever
            // o que a usuária digitou é pior do que não sugerir.
            patch({
              patient: alvo.label,
              sessionNumber: sessionNumber.trim()
                ? sessionNumber
                : String(nextSessionNumber(alvo.case)),
              patientAge: patientAge.trim() ? patientAge : (alvo.case.latestAge ?? ''),
              approach: approach.trim() ? approach : (alvo.case.latestApproach ?? ''),
            });
          }}
          options={[
            ...existingPatients.slice(0, 8).map((p) => ({ value: p.key, label: p.label })),
            { value: '__none__', label: '+ novo' },
          ]}
        />
      )}
      {duplicateCase && duplicateCase.patientKey !== undefined && (
        <p className="text-[11px] text-status-warning-strong inline-flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden /> já existe “{duplicateCase.patientLabel}” — as duas
          vão virar o mesmo caso
        </p>
      )}
      {looksFullName && (
        <p className="text-[11px] text-status-warning-strong">
          isso parece um nome completo — iniciais protegem o paciente
        </p>
      )}
    </div>
  );

  const attendanceRow = (log: InternshipLog) => {
    const checked = discussedLogIds.includes(log.id);
    const st = statusOf(log, linkIndex, todayKey);
    const depoisDaSupervisao = !!date && log.date > date;
    return (
      <button
        key={log.id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => toggleDiscussed(log.id)}
        className="w-full flex items-start gap-3 p-3 rounded-xl border border-ceci-border-default bg-surface-default text-left cursor-pointer tap-interactive min-h-[44px]"
      >
        <span
          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
            checked
              ? 'bg-ceci-primary border-ceci-primary text-ceci-on-primary'
              : 'bg-surface-muted border-ceci-border-subtle'
          }`}
        >
          {checked && <Check className="w-4 h-4" aria-hidden />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-ceci-primary">
            {log.sessionNumber ? `sessão ${log.sessionNumber}` : 'sessão'}
            <span className="text-[10px] text-ceci-secondary">{log.patient?.trim()}</span>
            <span className="text-[11px] text-ceci-secondary">{formatDateShortBR(log.date)}</span>
          </span>
          {log.theme?.trim() && (
            <span className="block text-[11px] text-ceci-secondary truncate">{log.theme}</span>
          )}
          {depoisDaSupervisao && (
            <span className="block text-[10px] text-status-warning-strong">
              essa sessão é depois da data da supervisão
            </span>
          )}
          {st.intervised && !st.supervised && (
            <span className="block text-[10px] text-ceci-academic-strong">
              discutida em intervisão
            </span>
          )}
        </span>
      </button>
    );
  };

  const discussedStep: WizardStep = {
    id: 'discutidos',
    title: 'discutidos',
    headline: 'quais atendimentos foram discutidos?',
    subtitle: 'só atendimentos que já aconteceram podem ser discutidos.',
    content: (
      <div className="space-y-4">
        <p className="text-[11px] text-ceci-secondary text-center">
          {discussedLogIds.length} {discussedLogIds.length === 1 ? 'selecionada' : 'selecionadas'}
        </p>
        {attendanceLogs.length === 0 ? (
          <p className="text-xs text-ceci-secondary text-center py-6">
            nenhum atendimento feito ainda — quando anotar sessões, elas aparecem aqui ♡
          </p>
        ) : (
          <div className="space-y-4">
            {inThisSupervision.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                  nesta supervisão
                </h4>
                <div className="space-y-2">{hereAttendance.map(attendanceRow)}</div>
              </section>
            )}
            {pendingAttendance.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                  sem supervisão ainda
                </h4>
                <div className="space-y-2">{pendingAttendance.map(attendanceRow)}</div>
              </section>
            )}
            {discussedElsewhere.length > 0 && (
              <details>
                <summary className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary cursor-pointer min-h-[44px] flex items-center">
                  já discutidas antes ({discussedElsewhere.length})
                </summary>
                <div className="space-y-2 mt-1.5">{discussedElsewhere.map(attendanceRow)}</div>
              </details>
            )}
          </div>
        )}
      </div>
    ),
  };

  const estagioSteps: WizardStep[] = [
    essentialStep(),
    camposStep(),
    reflectionStep(),
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'título', value: activity.trim() || `${titleHint} (sugerido)` },
            { label: 'horas', value: `${formatHours(hourNumber)} h` },
            { label: 'data', value: date ? formatDateBR(date) : todayKey },
            {
              label: 'reflexão',
              value: reflections.trim() || 'ainda não — dá pra adicionar depois',
            },
          ]}
        />
      ),
    },
  ];

  const atendimentoSteps: WizardStep[] = [
    essentialStep(pacienteField),
    camposStep(),
    {
      id: 'contexto',
      title: 'contexto',
      headline: 'qual foi a demanda e o que você usou?',
      subtitle: 'a sessão guarda o que sustenta o acompanhamento depois.',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>sessão nº</FieldLabel>
              <TextInput
                inputMode="numeric"
                value={sessionNumber}
                onChange={(e) => patch({ sessionNumber: e.target.value })}
                placeholder="ex: 3"
              />
            </div>
            <div>
              <FieldLabel>idade</FieldLabel>
              <TextInput
                value={patientAge}
                onChange={(e) => patch({ patientAge: e.target.value })}
                placeholder="ex: 28 anos"
              />
            </div>
          </div>
          <div>
            <FieldLabel>tema / queixa central</FieldLabel>
            <TextArea
              rows={4}
              value={theme}
              onChange={(e) => patch({ theme: e.target.value })}
              placeholder="o que trouxe hoje..."
            />
          </div>
          <div>
            <FieldLabel>abordagem teórica (opcional)</FieldLabel>
            <TextInput
              value={approach}
              onChange={(e) => patch({ approach: e.target.value })}
              placeholder="ex: TCC, psicanálise..."
            />
          </div>
          <div>
            <FieldLabel>intervenções / técnicas</FieldLabel>
            <TextArea
              rows={4}
              value={interventionNotes}
              onChange={(e) => patch({ interventionNotes: e.target.value })}
              placeholder="ex: escuta ativa, perguntas abertas..."
            />
          </div>
        </div>
      ),
    },
    reflectionStep(
      <div>
        <FieldLabel>impressões clínicas / observações</FieldLabel>
        <TextArea
          rows={4}
          value={observations}
          onChange={(e) => patch({ observations: e.target.value })}
          placeholder="como foi o vínculo, o estado emocional, algo que chamou atenção..."
        />
      </div>
    ),
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'título', value: activity.trim() || `${titleHint} (sugerido)` },
            { label: 'paciente', value: patient.trim() || '—' },
            { label: 'sessão', value: sessionNumber ? `sessão ${sessionNumber}` : '—' },
            { label: 'idade', value: patientAge.trim() || '—' },
            { label: 'tema / queixa', value: theme.trim() || '—' },
            { label: 'abordagem', value: approach.trim() || '—' },
            { label: 'intervenções', value: interventionNotes.trim() || '—' },
            { label: 'impressões', value: observations.trim() || '—' },
            { label: 'horas', value: `${formatHours(hourNumber)} h` },
            { label: 'data', value: date ? formatDateBR(date) : todayKey },
            {
              label: 'reflexão',
              value: reflections.trim() || 'ainda não — dá pra adicionar depois',
            },
          ]}
        />
      ),
    },
  ];

  const supervisionSteps: WizardStep[] = [
    essentialStep(),
    ...(kind === 'intervisao' ? [camposStep()] : []),
    {
      id: 'preparo',
      title: 'preparo',
      headline: 'o que você levou pra conversa?',
      subtitle: 'temas, o que já estava na cabeça e dúvidas para investigar.',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>{kind === 'intervisao' ? 'grupo' : 'supervisora / orientadora'}</FieldLabel>
            <TextInput
              value={supervisor}
              onChange={(e) => patch({ supervisor: e.target.value })}
              placeholder="ex: supervisora do estágio básico"
            />
          </div>
          <div>
            <FieldLabel>temas</FieldLabel>
            <TagField
              tags={topics}
              onChange={(v) => patch({ topics: v })}
              placeholder="ex: caso de ansiedade"
              emptyMessage="toque em + para adicionar os temas"
            />
          </div>
          <div>
            <FieldLabel>o que você levou</FieldLabel>
            <TextArea
              rows={3}
              value={beforeNotes}
              onChange={(e) => patch({ beforeNotes: e.target.value })}
              placeholder="suas hipóteses e perguntas que levou..."
            />
          </div>
          <div>
            <FieldLabel>dúvidas</FieldLabel>
            <TextArea
              rows={3}
              value={doubts}
              onChange={(e) => patch({ doubts: e.target.value })}
              placeholder="perguntas que ficaram no ar..."
            />
          </div>
        </div>
      ),
    },
    discussedStep,
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'título', value: activity.trim() || `${titleHint} (sugerido)` },
            {
              label: kind === 'intervisao' ? 'grupo' : 'supervisora',
              value: supervisor.trim() || '—',
            },
            { label: 'temas', value: topics.length ? topics.join(' · ') : '—' },
            { label: 'o que você levou', value: beforeNotes.trim() || '—' },
            { label: 'dúvidas', value: doubts.trim() || '—' },
            {
              label: 'sessões discutidas',
              value: discussedLogIds.length
                ? pluralPt(discussedLogIds.length, 'sessão', 'sessões')
                : '—',
            },
            { label: 'horas', value: `${formatHours(hourNumber)} h` },
            { label: 'data', value: date ? formatDateBR(date) : todayKey },
          ]}
        />
      ),
    },
    {
      id: 'combinados',
      title: 'combinados',
      headline: 'o que ficou combinado?',
      subtitle: 'orientações e próximos passos — cada passo vira tarefa, leitura ou foco quando você quiser.',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>orientações recebidas</FieldLabel>
            <TextArea
              rows={3}
              value={orientations}
              onChange={(e) => patch({ orientations: e.target.value })}
              placeholder="o que foi orientado..."
            />
          </div>
          <div>
            <FieldLabel>próximos passos</FieldLabel>
            <TagField
              tags={nextSteps}
              onChange={(v) => patch({ nextSteps: v })}
              placeholder="ex: revisar capítulo de TCC, tentar nova técnica..."
              emptyMessage="toque em + para adicionar"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'autoavaliacao',
      title: 'autoavaliação',
      headline: 'como você saiu dessa conversa?',
      subtitle: 'tudo aqui é opcional — dá pra deixar pra depois.',
      content: (
        <div className="space-y-4">
          {isFuture && (
            <p className="text-[11px] text-ceci-tertiary">dá pra preencher depois</p>
          )}
          <div>
            <FieldLabel>confiança</FieldLabel>
            <TextArea
              rows={2}
              value={confidence}
              onChange={(e) => patch({ selfAssessment: { confidence: e.target.value, limits, themes } })}
              placeholder="o que já consigo fazer bem..."
            />
          </div>
          <div>
            <FieldLabel>limites</FieldLabel>
            <TextArea
              rows={2}
              value={limits}
              onChange={(e) => patch({ selfAssessment: { confidence, limits: e.target.value, themes } })}
              placeholder="o que ainda é difícil ou incerto..."
            />
          </div>
          <div>
            <FieldLabel>temas para aprofundar</FieldLabel>
            <TextArea
              rows={2}
              value={themes}
              onChange={(e) => patch({ selfAssessment: { confidence, limits, themes: e.target.value } })}
              placeholder="assuntos que quer revisar ou estudar mais..."
            />
          </div>
          <div>
            <FieldLabel>como foi pra você</FieldLabel>
            <TextArea
              rows={3}
              value={reflections}
              onChange={(e) => patch({ reflections: e.target.value })}
              placeholder="o que essa conversa te deixou..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'revisar-final',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'título', value: activity.trim() || `${titleHint} (sugerido)` },
            {
              label: kind === 'intervisao' ? 'grupo' : 'supervisora',
              value: supervisor.trim() || '—',
            },
            { label: 'orientações', value: orientations.trim() || '—' },
            { label: 'próximos passos', value: nextSteps.length ? nextSteps.join(' · ') : '—' },
            {
              label: 'sessões discutidas',
              value: discussedLogIds.length
                ? pluralPt(discussedLogIds.length, 'sessão', 'sessões')
                : '—',
            },
            { label: 'horas', value: `${formatHours(hourNumber)} h` },
            { label: 'data', value: date ? formatDateBR(date) : todayKey },
            { label: 'como foi pra você', value: reflections.trim() || '—' },
          ]}
        />
      ),
    },
  ];

  const steps =
    kind === null
      ? [choiceStep]
      : kind === 'atendimento_clinico'
      ? atendimentoSteps
      : kind === 'supervisao' || kind === 'intervisao'
      ? supervisionSteps
      : estagioSteps;

  // O seed pode abrir direto num passo ("sem reflexão · adicionar" → `reflexao`).
  React.useEffect(() => {
    const target = wizardSeed?.startAtStep;
    if (!target) return;
    const ids = steps.map((s) => s.id);
    const idx = ids.indexOf(target);
    if (idx > 0) setStep(idx);
    // Só no primeiro render do seed; depende do `seed`, não dos passos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardSeed?.startAtStep]);

  const buildLog = (): InternshipLog | null => {
    if (!kind) return null;
    const base: InternshipLog = {
      id: seedTarget ? seedTarget.id : `ilog-${Date.now()}`,
      type: kind,
      date: date || todayKey,
      hours: Math.min(MAX_HOURS, Math.max(0, hourNumber)),
      // `D10`: título vazio vira o sugerido, dentro do domínio (`sanitizeLog`).
      activity: activity.trim(),
      reflections: reflections.trim(), // `I4`: nunca fabricado
    };
    let log: InternshipLog;
    if (kind === 'atendimento_clinico') {
      log = {
        ...base,
        patient: formatPatientLabel(patient) || undefined,
        sessionNumber: sessionNumber ? Number(sessionNumber) : undefined,
        patientAge: patientAge.trim() || undefined,
        theme: theme.trim() || undefined,
        approach: approach.trim() || undefined,
        interventionNotes: interventionNotes.trim() || undefined,
        observations: observations.trim() || undefined,
      };
    } else if (kind === 'supervisao' || kind === 'intervisao') {
      log = {
        ...base,
        supervisor: supervisor.trim() || undefined,
        topics: topics.length ? topics : undefined,
        orientations: orientations.trim() || undefined,
        doubts: doubts.trim() || undefined,
        // `D3`: o vínculo é gravado **aqui**, e só aqui.
        discussedLogIds: discussedLogIds.length ? discussedLogIds : undefined,
        beforeNotes: beforeNotes.trim() || undefined,
        afterNotes: afterNotes.trim() || undefined,
        selfAssessment: confidence || limits || themes ? { confidence, limits, themes } : undefined,
        nextSteps: nextSteps.length ? nextSteps : undefined,
        // Preserva o vínculo de passos já convertido, se o texto não mudou.
        nextStepLinks: seedTarget?.nextStepLinks,
      };
    } else {
      log = base;
    }
    // `SPEC-011 D11`: supervisão nunca declina; os demais aplicam a escolha dos
    // switches antes do save — o `comDeclinados` é a única porta do auto-texto
    // (D12) e nada disso passa pelo `sanitizeLog`.
    return kind === 'supervisao' ? log : comDeclinados(log, declinedFields ?? []);
  };

  const doSave = () => {
    const log = buildLog();
    if (!log) return;
    // **Uma** escrita. O v3 fazia `1 + n` chamadas, uma por sessão marcada.
    handleSaveInternshipLog(log);
    hapticSuccess();
    finish();
    const discusses = discussedLogIds.length;
    if (isFuture) showToast('agendado ♡');
    else if (seedTarget) showToast('registro atualizado ♡');
    else if (kind === 'supervisao' || kind === 'intervisao')
      showToast(
        discusses
          ? `supervisão guardada · ${pluralPt(discusses, 'sessão ligada', 'sessões ligadas')} ♡`
          : 'supervisão guardada ♡'
      );
    else showToast('registro guardado ♡');
  };

  const onSaveMinimal = () => {
    const log = buildLog();
    if (!log) return;
    handleSaveInternshipLog(log);
    hapticSuccess();
    finish();
    showToast(isFuture ? 'agendado ♡' : 'registro guardado ♡');
  };

  const meta = kind ? KIND_META[kind] : { title: 'novo registro de estágio', icon: <Sparkles className="w-3.5 h-3.5" /> };

  return (
    <WizardScaffold
      title={meta.title}
      icon={meta.icon}
      step={step}
      subtitle={kind ? `campo, supervisão e entregas ♡` : 'registro do estágio'}
      steps={steps}
      onStepChange={setStep}
      canNext={canAdvance}
      onSave={doSave}
      onSaveMinimal={step >= 1 && canAdvance ? onSaveMinimal : undefined}
      onClose={finish}
      isDirty={isDirty}
    />
  );
};