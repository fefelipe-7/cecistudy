import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  HeartHandshake,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { InternshipLogType, ManagedItem } from '../../types';
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

const KIND_META: Record<InternshipLogType, { title: string; icon: React.ReactNode }> = {
  estagio: { title: 'novo registro de estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
  atendimento_clinico: { title: 'novo atendimento clínico', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  supervisao: { title: 'nova supervisão', icon: <Compass className="w-3.5 h-3.5" /> },
  intervisao: { title: 'nova intervisão', icon: <Users className="w-3.5 h-3.5" /> },
  outro: { title: 'novo registro', icon: <Sparkles className="w-3.5 h-3.5" /> },
};

/** Rascunho do registro essencial. */
interface InternshipDraft {
  kind?: InternshipLogType;
  activity?: string;
  hours?: string;
  date?: string;
  reflections?: string;
  discussedLogIds?: string[];
  beforeNotes?: string;
  afterNotes?: string;
  selfAssessment?: {
    confidence?: string;
    limits?: string;
    themes?: string;
  };
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
}

export const InternshipWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    internshipLogs,
    handleAddInternshipLog,
    handleUpdateInternshipLog,
    closeWizard,
    showToast,
  } = useMobileApp();
  const editingLog = editing?.kind === 'internship'
    ? internshipLogs.find((l) => l.id === editing.id)
    : undefined;

  const draft = useWizardDraft<InternshipDraft>('internship');
  const savedDraft = editingLog ? null : draft.load();

  const [kind, setKind] = useState<InternshipLogType | null>(editingLog?.type ?? savedDraft?.kind ?? null);
  const [step, setStep] = useState(0);

  // comuns
  const [activity, setActivity] = useState(editingLog?.activity ?? savedDraft?.activity ?? '');
  const [hours, setHours] = useState(editingLog ? String(editingLog.hours) : savedDraft?.hours ?? '');
  const [date, setDate] = useState(editingLog?.date ?? savedDraft?.date ?? '');
  const [reflections, setReflections] = useState(editingLog?.reflections ?? savedDraft?.reflections ?? '');

  // atendimento clínico
  const [patient, setPatient] = useState(editingLog?.patient ?? savedDraft?.patient ?? '');
  const [sessionNumber, setSessionNumber] = useState(editingLog?.sessionNumber ? String(editingLog.sessionNumber) : savedDraft?.sessionNumber ?? '');
  const [patientAge, setPatientAge] = useState(editingLog?.patientAge ?? savedDraft?.patientAge ?? '');
  const [theme, setTheme] = useState(editingLog?.theme ?? savedDraft?.theme ?? '');
  const [approach, setApproach] = useState(editingLog?.approach ?? savedDraft?.approach ?? '');
  const [interventionNotes, setInterventionNotes] = useState(editingLog?.interventionNotes ?? savedDraft?.interventionNotes ?? '');
  const [observations, setObservations] = useState(editingLog?.observations ?? savedDraft?.observations ?? '');

  // supervisão / intervisão
  const [supervisor, setSupervisor] = useState(editingLog?.supervisor ?? savedDraft?.supervisor ?? '');
  const [topics, setTopics] = useState<string[]>(editingLog?.topics ?? savedDraft?.topics ?? []);
  const [orientations, setOrientations] = useState(editingLog?.orientations ?? savedDraft?.orientations ?? '');
  const [doubts, setDoubts] = useState(editingLog?.doubts ?? savedDraft?.doubts ?? '');
  const [nextSteps, setNextSteps] = useState<string[]>(editingLog?.nextSteps ?? savedDraft?.nextSteps ?? []);
  const [discussedLogIds, setDiscussedLogIds] = useState<string[]>(editingLog?.discussedLogIds ?? savedDraft?.discussedLogIds ?? []);
  const [beforeNotes, setBeforeNotes] = useState(editingLog?.beforeNotes ?? savedDraft?.beforeNotes ?? '');
  const [afterNotes, setAfterNotes] = useState(editingLog?.afterNotes ?? savedDraft?.afterNotes ?? '');
  const [confidence, setConfidence] = useState(editingLog?.selfAssessment?.confidence ?? savedDraft?.selfAssessment?.confidence ?? '');
  const [limits, setLimits] = useState(editingLog?.selfAssessment?.limits ?? savedDraft?.selfAssessment?.limits ?? '');
  const [themes, setThemes] = useState(editingLog?.selfAssessment?.themes ?? savedDraft?.selfAssessment?.themes ?? '');

  // atendimentos clínicos disponíveis para discussão
  const attendanceLogs = useMemo(() => {
    return internshipLogs
      .filter((l) => l.type === 'atendimento_clinico')
      .sort((a, b) => {
        const aPending = !a.supervisionLogId;
        const bPending = !b.supervisionLogId;
        if (aPending !== bPending) return aPending ? -1 : 1;
        const aNum = a.sessionNumber ?? 0;
        const bNum = b.sessionNumber ?? 0;
        if (aNum !== bNum) return aNum - bNum;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [internshipLogs]);

  // persiste rascunho
  useEffect(() => {
    if (editingLog) return;
    draft.save({
      kind: kind ?? undefined,
      activity,
      hours,
      date,
      reflections,
      discussedLogIds,
      beforeNotes,
      afterNotes,
      selfAssessment: (confidence || limits || themes) ? { confidence, limits, themes } : undefined,
      nextSteps,
      supervisor,
      topics,
      orientations,
      doubts,
      patient,
      sessionNumber,
      patientAge,
      theme,
      approach,
      interventionNotes,
      observations,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    kind,
    activity,
    hours,
    date,
    reflections,
    discussedLogIds,
    beforeNotes,
    afterNotes,
    confidence,
    limits,
    themes,
    nextSteps,
    supervisor,
    topics,
    orientations,
    doubts,
    patient,
    sessionNumber,
    patientAge,
    theme,
    approach,
    interventionNotes,
    observations,
    editingLog,
  ]);

  const finish = () => {
    draft.clear();
    closeWizard();
  };

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
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm"
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

  const essentialStep = (activityContent: React.ReactNode): WizardStep => ({
    id: 'essencial',
    title: 'essencial',
    headline: 'o que aconteceu e quando?',
    subtitle: 'um resumo do que rolou no campo — horas e data são opcionais e dá para ajustar depois.',
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
    subtitle: 'suas impressões e aprendizados — é o coração do diário de estágio ♡',
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
    reflectionStep(),
    {
      id: 'revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'atividade', value: activity.trim() },
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
      subtitle: 'só o necessário do paciente (iniciais bastam) e as intervenções que você usou.',
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
      subtitle: 'temas, orientações e dúvidas que ficaram no ar para investigar depois.',
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
    {
      id: 'discussed',
      title: 'atendimentos discutidos',
      headline: 'quais atendimentos foram discutidos nessa supervisão/intervisão?',
      subtitle: 'selecione as sessões que foram trazidas para conversa.',
      content: (
        <div className="space-y-3">
          <div className="max-h-[200px] overflow-y-auto border border-ceci-border-default rounded-xl p-3">
            {attendanceLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg border border-ceci-border-subtle">
                <input
                  type="checkbox"
                  checked={discussedLogIds.includes(log.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDiscussedLogIds([...discussedLogIds, log.id]);
                    } else {
                      setDiscussedLogIds(discussedLogIds.filter((id) => id !== log.id));
                    }
                  }}
                  className="h-4 w-4 flex-shrink-0 text-ceci-primary"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ceci-primary">Sessão {log.sessionNumber ?? '—'}</span>
                    <span className="text-xs text-ceci-secondary">
                      {log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                  <span className="text-xs text-ceci-secondary truncate max-w-[200px]">
                    {log.activity}
                  </span>
                </div>
              </div>
            ))}
            {attendanceLogs.length === 0 && (
              <p className="text-xs text-ceci-secondary text-center py-4">
                nenhum atendimento clínico registrado ainda
              </p>
            )}
          </div>
          <p className="text-xs text-ceci-secondary text-center mt-2">
            dica: marque primeiro os que ainda não têm supervisão (pendentes)
          </p>
        </div>
      ),
    },
    reflectionStep(
      <div className="space-y-4">
        <FieldLabel>o que você levou pra conversa</FieldLabel>
        <TextArea
          rows={3}
          value={beforeNotes}
          onChange={(e) => setBeforeNotes(e.target.value)}
          placeholder="suas hipóteses e perguntas que levou..."
        />
        <FieldLabel>o que ficou combinado</FieldLabel>
        <TextArea
          rows={3}
          value={afterNotes}
          onChange={(e) => setAfterNotes(e.target.value)}
          placeholder="as orientações e decisões da supervisão..."
        />
        <FieldLabel>autoavaliação</FieldLabel>
        <div className="space-y-2">
          <div>
            <FieldLabel>confiança</FieldLabel>
            <TextArea
              rows={2}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              placeholder="o que já consigo fazer bem..."
            />
          </div>
          <div>
            <FieldLabel>limites</FieldLabel>
            <TextArea
              rows={2}
              value={limits}
              onChange={(e) => setLimits(e.target.value)}
              placeholder="o que ainda é difícil ou incerto..."
            />
          </div>
          <div>
            <FieldLabel>temas para aprofundar</FieldLabel>
            <TextArea
              rows={2}
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
              placeholder="assuntos que quer revisar ou estudar mais..."
            />
          </div>
        </div>
      </div>
    ),
    {
      id: 'next-steps',
      title: 'próximos passos',
      headline: 'o que combinaram de levar para a próxima?',
      content: (
        <div className="space-y-2">
          <FieldLabel>próximos passos</FieldLabel>
          <TagField
            tags={nextSteps}
            onChange={setNextSteps}
            placeholder="ex: revisar capítulo de TCC, tentar nova técnica..."
            emptyMessage="toque em + para adicionar"
          />
        </div>
      ),
    },
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
            { label: 'atendimentos discutidos', value: discussedLogIds.length ? `${discussedLogIds.length} sessões` : '—' },
            { label: 'próximos passos', value: nextSteps.length ? nextSteps.join(' · ') : '—' },
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
      reflections: reflections.trim(),
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
          discussedLogIds: discussedLogIds.length ? discussedLogIds : undefined,
          beforeNotes: beforeNotes.trim() || undefined,
          afterNotes: afterNotes.trim() || undefined,
          selfAssessment: (confidence || limits || themes) ? { confidence, limits, themes } : undefined,
          nextSteps: nextSteps.length ? nextSteps : undefined,
        }
      : {
          ...base,
        };
  };

  const handleSave = () => {
    const log = buildLog();
    if (!log) return;
    if (editingLog) {
      handleUpdateInternshipLog({ ...editingLog, ...log });
      // side effect: sync supervisionLogId
      if ((log.type === 'supervisao' || log.type === 'intervisao') && discussedLogIds.length > 0) {
        const currentId = log.id;
        internshipLogs.forEach((target) => {
          if (target.type === 'atendimento_clinico') {
            const should = discussedLogIds.includes(target.id);
            const currently = target.supervisionLogId === currentId;
            if (should && !currently) {
              handleUpdateInternshipLog({ ...target, supervisionLogId: currentId });
            } else if (!should && currently) {
              handleUpdateInternshipLog({ ...target, supervisionLogId: undefined });
            }
          }
        });
      }
      hapticSuccess();
      finish();
      showToast('registro de estágio atualizado ♡');
      return;
    }
    handleAddInternshipLog(log);
    if ((log.type === 'supervisao' || log.type === 'intervisao') && discussedLogIds.length > 0) {
      const currentId = log.id;
      internshipLogs.forEach((target) => {
        if (target.type === 'atendimento_clinico') {
          const should = discussedLogIds.includes(target.id);
          const currently = target.supervisionLogId === currentId;
          if (should && !currently) {
            handleUpdateInternshipLog({ ...target, supervisionLogId: currentId });
          } else if (!should && currently) {
            handleUpdateInternshipLog({ ...target, supervisionLogId: undefined });
          }
        }
      });
    }
    hapticSuccess();
    finish();
    showToast('registro de estágio guardado ♡');
  };

  const meta = kind
    ? KIND_META[kind]
    : { title: 'novo registro de estágio', icon: <Sparkles className="w-3.5 h-3.5" /> };

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