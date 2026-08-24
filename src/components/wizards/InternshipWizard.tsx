import React, { useEffect, useState } from 'react';
import {
  Compass,
  HeartHandshake,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { InternshipLogType, ManagedItem, InternshipPhase } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardDraft } from '../../lib/useWizardDraft';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldLabel, ReviewCard, TextArea, TextInput, DateInput } from './wizardFields';
import { TagField } from '../ui/TagField';

const today = () => new Date().toISOString().split('T')[0];

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

const PHASES: { value: InternshipPhase; label: string }[] = [
  { value: 'preparar', label: 'preparar' },
  { value: 'registrar', label: 'registrar' },
  { value: 'refletir', label: 'refletir' },
  { value: 'supervisionar', label: 'supervisionar' },
  { value: 'entregar', label: 'entregar' },
];

const KIND_META: Record<InternshipLogType, { title: string; icon: React.ReactNode }> = {
  estagio: { title: 'novo registro de estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
  atendimento_clinico: { title: 'novo atendimento clínico', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  supervisao: { title: 'nova supervisão', icon: <Compass className="w-3.5 h-3.5" /> },
  intervisao: { title: 'nova intervisão', icon: <Users className="w-3.5 h-3.5" /> },
  outro: { title: 'novo registro', icon: <Sparkles className="w-3.5 h-3.5" /> },
};

/** Rascunho do registro essencial (docs/modais-wizards.md §5.1/§5.7). */
interface InternshipDraft {
  kind?: InternshipLogType;
  activity?: string;
  hours?: string;
  date?: string;
  reflections?: string;
}

export const InternshipWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { internshipLogs, handleAddInternshipLog, handleUpdateInternshipLog, closeWizard, showToast } = useApp();
  const editingLog = editing?.kind === 'internship'
    ? internshipLogs.find((l) => l.id === editing.id)
    : undefined;

  // ---- rascunho: preserva o essencial se ela sair no meio (§5.7) ----
  const draft = useWizardDraft<InternshipDraft>('internship');
  const savedDraft = editingLog ? null : draft.load();

  const [kind, setKind] = useState<InternshipLogType | null>(editingLog?.type ?? savedDraft?.kind ?? null);
  const [step, setStep] = useState(0);

  // comuns
  const [activity, setActivity] = useState(editingLog?.activity ?? savedDraft?.activity ?? '');
  // duração começa vazia — nunca assumir 4 horas silenciosamente (§4.6)
  const [hours, setHours] = useState(editingLog ? String(editingLog.hours) : savedDraft?.hours ?? '');
  const [date, setDate] = useState(editingLog?.date ?? savedDraft?.date ?? '');
  const [reflections, setReflections] = useState(editingLog?.reflections ?? savedDraft?.reflections ?? '');

  // atendimento clínico
  const [patient, setPatient] = useState(editingLog?.patient ?? '');
  const [sessionNumber, setSessionNumber] = useState(editingLog?.sessionNumber ? String(editingLog.sessionNumber) : '');
  const [patientAge, setPatientAge] = useState(editingLog?.patientAge ?? '');
  const [theme, setTheme] = useState(editingLog?.theme ?? '');
  const [approach, setApproach] = useState(editingLog?.approach ?? '');
  const [interventionNotes, setInterventionNotes] = useState(editingLog?.interventionNotes ?? '');
  const [observations, setObservations] = useState(editingLog?.observations ?? '');

  // supervisão / intervisão
  const [supervisor, setSupervisor] = useState(editingLog?.supervisor ?? '');
  const [topics, setTopics] = useState<string[]>(editingLog?.topics ?? []);
  const [orientations, setOrientations] = useState(editingLog?.orientations ?? '');
  const [doubts, setDoubts] = useState(editingLog?.doubts ?? '');
  const [nextSteps, setNextSteps] = useState(editingLog?.nextSteps ?? '');

  // ciclo de formação (estágio 2.0)
  const [phase, setPhase] = useState<InternshipPhase | undefined>(editingLog?.phase);
  const [prepChecklist, setPrepChecklist] = useState<string[]>(editingLog?.prepChecklist ?? []);

  // persiste o rascunho do essencial a cada mudança (best-effort)
  useEffect(() => {
    if (editingLog) return;
    draft.save({ kind: kind ?? undefined, activity, hours, date, reflections });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, activity, hours, date, reflections, editingLog]);

  /** Fecha limpando o rascunho (salvou ou descartou de propósito). */
  const finish = () => {
    draft.clear();
    closeWizard();
  };

  const choiceStep: WizardStep = {
    id: 'tipo',
    title: 'tipo',
    headline: 'o que você quer registrar agora?',
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
              className="w-full flex items-center gap-4 p-4 rounded-[24px] bg-white border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm"
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

  const cycleStep: WizardStep = {
    id: 'estagio-fase',
    title: 'fase & preparação',
    headline: 'em qual passo do ciclo esse registro se encaixa?',
    content: (
      <div className="space-y-4">
        <div>
          <FieldLabel>ciclo de formação</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map((p) => {
              const active = phase === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setPhase(active ? undefined : p.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong'
                      : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel>preparar o campo (opcional)</FieldLabel>
          <TagField
            tags={prepChecklist}
            onChange={setPrepChecklist}
            placeholder="ex: revisar prontuário, levar formulário"
            emptyMessage="toque em + para listar o que você preparou"
          />
        </div>
      </div>
    ),
  };

  // ---- passo comum: o essencial (§5.7: tipo, data, resumo e duração) ----
  const essentialStep = (activityContent: React.ReactNode): WizardStep => ({
    id: 'essencial',
    title: 'essencial',
    headline: 'o que aconteceu e quando?',
    content: (
      <div className="space-y-4">
        {activityContent}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>horas (opcional)</FieldLabel>
            <TextInput
              type="number"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="ex: 4"
            />
          </div>
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>
    ),
  });

  const reflectionStep = (extra?: React.ReactNode): WizardStep => ({
    id: 'reflexao',
    title: 'reflexão',
    headline: 'como foi essa experiência pra você?',
    content: (
      <div className="space-y-4">
        {extra}
        <TextArea
          rows={5}
          value={reflections}
          onChange={(e) => setReflections(e.target.value)}
          placeholder="como foi pra você? o que aprendeu?"
        />
      </div>
    ),
  });

  const estagioSteps: WizardStep[] = [
    essentialStep(
      <TextArea
        rows={5}
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        placeholder="ex: acolhimento na triagem da clínica escola"
        autoFocus
      />
    ),
    cycleStep,
    reflectionStep(),
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'atividade', value: activity.trim() },
            { label: 'fase', value: phase ? PHASES.find((p) => p.value === phase)?.label ?? '—' : '—' },
            { label: 'horas', value: `${parseFloat(hours) || 0} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
          ]}
        />
      ),
    },
  ];

  const atendimentoSteps: WizardStep[] = [
    essentialStep(
      <TextInput
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        placeholder="ex: sessão de escuta com paciente em acompanhamento"
        autoFocus
      />
    ),
    {
      id: 'contexto-atendimento',
      title: 'contexto profissional',
      headline: 'quem você atendeu e qual foi a demanda?',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <FieldLabel>sessão nº</FieldLabel>
              <TextInput
                type="number"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                placeholder="ex: 3"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>idade</FieldLabel>
              <TextInput value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="ex: 28 anos" />
            </div>
          </div>
          <div>
            <FieldLabel>paciente (só iniciais, sem nome completo)</FieldLabel>
            <TextInput value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="ex: M. S." />
          </div>
          <div>
            <FieldLabel>tema / queixa central</FieldLabel>
            <TextArea rows={4} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="o que trouxe hoje..." />
          </div>
          <div>
            <FieldLabel>abordagem teórica (opcional)</FieldLabel>
            <TextInput value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="ex: TCC, psicanálise..." />
          </div>
          <div>
            <FieldLabel>intervenções / técnicas</FieldLabel>
            <TextArea rows={4} value={interventionNotes} onChange={(e) => setInterventionNotes(e.target.value)} placeholder="ex: escuta ativa, perguntas abertas..." />
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
          onChange={(e) => setObservations(e.target.value)}
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
            { label: 'resumo', value: activity.trim() },
            { label: 'sessão', value: sessionNumber ? `sessão ${sessionNumber}` : '—' },
            { label: 'paciente', value: patient.trim() || '—' },
            { label: 'idade', value: patientAge.trim() || '—' },
            { label: 'tema / queixa', value: theme.trim() || '—' },
            { label: 'abordagem', value: approach.trim() || '—' },
            { label: 'intervenções', value: interventionNotes.trim() || '—' },
            { label: 'impressões', value: observations.trim() || '—' },
            { label: 'horas', value: `${parseFloat(hours) || 0} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
          ]}
        />
      ),
    },
  ];

  const supervisionSteps: WizardStep[] = [
    essentialStep(
      <TextInput
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        placeholder="ex: supervisão sobre caso de ansiedade"
        autoFocus
      />
    ),
    {
      id: 'contexto-supervisao',
      title: 'contexto profissional',
      headline: "o que foi discutido nessa conversa?",
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>{kind === 'intervisao' ? 'grupo de intervisão' : 'supervisora'}</FieldLabel>
            <TextInput value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="ex: supervisora do estágio básico" />
          </div>
          <TagField
            tags={topics}
            onChange={setTopics}
            placeholder="ex: caso de ansiedade"
            emptyMessage="toque em + para adicionar os temas"
          />
          <div>
            <FieldLabel>orientações recebidas</FieldLabel>
            <TextArea rows={4} value={orientations} onChange={(e) => setOrientations(e.target.value)} placeholder="o que foi orientado..." />
          </div>
          <div>
            <FieldLabel>dúvidas para investigar</FieldLabel>
            <TextArea rows={3} value={doubts} onChange={(e) => setDoubts(e.target.value)} placeholder="perguntas que ficaram no ar..." />
          </div>
        </div>
      ),
    },
    reflectionStep(
      <div>
        <FieldLabel>próximos passos</FieldLabel>
        <TextArea
          rows={3}
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          placeholder="o que combinaram de levar para a próxima..."
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
            { label: 'resumo', value: activity.trim() },
            { label: kind === 'intervisao' ? 'grupo de intervisão' : 'supervisora', value: supervisor.trim() || '—' },
            { label: 'temas', value: topics.length ? topics.join(' · ') : '—' },
            { label: 'orientações', value: orientations.trim() || '—' },
            { label: 'dúvidas', value: doubts.trim() || '—' },
            { label: 'próximos passos', value: nextSteps.trim() || '—' },
            { label: 'horas', value: `${parseFloat(hours) || 0} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
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

  const canNext = kind === null ? false : activity.trim().length > 0;

  const buildLog = () => {
    if (!kind) return null;
    const base = {
      id: editingLog ? editingLog.id : 'ilog-' + Date.now(),
      type: kind,
      date: date || today(),
      hours: parseFloat(hours) || 0,
      activity: activity.trim(),
      reflections: reflections.trim() || 'reflexão registrada no diário do cecistudy.',
    };
    return kind === 'atendimento_clinico'
      ? {
          ...base,
          patient: patient.trim() || undefined,
          sessionNumber: sessionNumber ? Number(sessionNumber) : undefined,
          patientAge: patientAge.trim() || undefined,
          theme: theme.trim() || undefined,
          approach: approach.trim() || undefined,
          interventionNotes: interventionNotes.trim() || undefined,
          observations: observations.trim() || undefined,
        }
      : kind === 'supervisao' || kind === 'intervisao'
        ? {
            ...base,
            supervisor: supervisor.trim() || undefined,
            topics: topics.length ? topics : undefined,
            orientations: orientations.trim() || undefined,
            doubts: doubts.trim() || undefined,
            nextSteps: nextSteps.trim() || undefined,
          }
        : {
            ...base,
            phase: phase ?? undefined,
            prepChecklist: prepChecklist.length ? prepChecklist : undefined,
          };
  };

  const handleSave = () => {
    const log = buildLog();
    if (!log) return;
    if (editingLog) {
      handleUpdateInternshipLog({ ...editingLog, ...log });
      hapticSuccess();
      finish();
      showToast('registro de estágio atualizado ♡');
      return;
    }
    handleAddInternshipLog(log);
    hapticSuccess();
    finish();
    showToast('registro de estágio guardado ♡');
  };

  const meta = kind
    ? KIND_META[kind]
    : { title: 'novo registro de estágio', icon: <Sparkles className="w-3.5 h-3.5" /> };

  // expressão da mascotinha acompanha o tipo de registro
  const mascote =
    kind === 'supervisao' || kind === 'intervisao'
      ? 'supervision-reflect'
      : kind === 'atendimento_clinico'
        ? 'listening-hello'
        : 'field-prepare';

  const isDirty = !editingLog && (activity.trim().length > 0 || reflections.trim().length > 0);

  return (
    <WizardScaffold
      title={editing ? `editar ${meta.title.replace('novo ', '')}` : meta.title}
      subtitle={kind === null ? 'estágio, atendimento, supervisão...' : undefined}
      icon={meta.icon}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      mascote={mascote}
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason={kind === null ? undefined : 'escreva um resumo do que aconteceu'}
      hideNext={kind === null}
      onSave={handleSave}
      onClose={finish}
      isDirty={isDirty}
      onSaveMinimal={
        !editingLog && kind !== null && canNext && step > 0 && step < steps.length - 1
          ? handleSave
          : undefined
      }
      saveMinimalLabel="guardar só o essencial por enquanto ♡"
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar registro ♡'}
    />
  );
};
