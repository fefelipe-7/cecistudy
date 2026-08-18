import React, { useState } from 'react';
import {
  Compass,
  HeartHandshake,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { InternshipLogType, ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { DateInput, FieldLabel, ReviewCard, TextArea, TextInput } from './wizardFields';
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

export const InternshipWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { internshipLogs, handleAddInternshipLog, handleUpdateInternshipLog, closeWizard, showToast } = useApp();
  const editingLog = editing?.kind === 'internship'
    ? internshipLogs.find((l) => l.id === editing.id)
    : undefined;

  const [kind, setKind] = useState<InternshipLogType | null>(editingLog?.type ?? null);
  const [step, setStep] = useState(0);

  // comuns
  const [activity, setActivity] = useState(editingLog?.activity ?? '');
  const [hours, setHours] = useState(String(editingLog?.hours ?? '4'));
  const [date, setDate] = useState(editingLog?.date ?? today());
  const [reflections, setReflections] = useState(editingLog?.reflections ?? '');

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

  const estagioSteps: WizardStep[] = [
    {
      id: 'estagio-atividade',
      title: 'atividade',
      headline: 'o que você fez no estágio hoje?',
      content: (
        <TextArea
          rows={5}
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="ex: acolhimento na triagem da clínica escola"
          autoFocus
        />
      ),
    },
    {
      id: 'estagio-horas',
      title: 'horas & data',
      headline: 'quantas horas e quando?',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>horas</FieldLabel>
            <TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="ex: 4" />
          </div>
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      id: 'estagio-reflexao',
      title: 'reflexão',
      headline: 'como foi essa experiência pra você?',
      content: (
        <TextArea
          rows={5}
          value={reflections}
          onChange={(e) => setReflections(e.target.value)}
          placeholder="como foi pra você? o que aprendeu?"
        />
      ),
    },
    {
      id: 'estagio-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'atividade', value: activity.trim() },
            { label: 'horas', value: `${hours} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
          ]}
        />
      ),
    },
  ];

  const atendimentoSteps: WizardStep[] = [
    {
      id: 'atendimento-resumo',
      title: 'resumo',
      headline: 'dá um resuminho da sessão.',
      content: (
        <div className="space-y-2">
          <TextInput
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="ex: sessão de escuta com paciente em acompanhamento"
            autoFocus
          />
          <p className="text-[11px] text-ceci-tertiary">
            uma linha para você encontrar o registro depois ✨
          </p>
        </div>
      ),
    },
    {
      id: 'atendimento-identificacao',
      title: 'identificação',
      headline: 'quem você atendeu nesta sessão?',
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
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      id: 'atendimento-demanda',
      title: 'demanda & abordagem',
      headline: 'qual foi o tema central da sessão?',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>tema / queixa central</FieldLabel>
            <TextArea rows={4} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="o que trouxe hoje..." />
          </div>
          <div>
            <FieldLabel>abordagem teórica (opcional)</FieldLabel>
            <TextInput value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="ex: TCC, psicanálise..." />
          </div>
        </div>
      ),
    },
    {
      id: 'atendimento-intervencoes',
      title: 'o que foi feito',
      headline: 'o que você fez e como percebeu o paciente?',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>intervenções / técnicas</FieldLabel>
            <TextArea rows={4} value={interventionNotes} onChange={(e) => setInterventionNotes(e.target.value)} placeholder="ex: escuta ativa, perguntas abertas..." />
          </div>
          <div>
            <FieldLabel>impressões clínicas / observações</FieldLabel>
            <TextArea rows={4} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="como foi o vínculo, o estado emocional, algo que chamou atenção..." />
          </div>
        </div>
      ),
    },
    {
      id: 'atendimento-horas-reflexao',
      title: 'horas & reflexão',
      headline: 'quantas horas durou e como foi pra você?',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>horas</FieldLabel>
            <TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="ex: 1" />
          </div>
          <div>
            <FieldLabel>reflexões da sessão</FieldLabel>
            <TextArea rows={4} value={reflections} onChange={(e) => setReflections(e.target.value)} placeholder="o que essa sessão te ensinou?" />
          </div>
        </div>
      ),
    },
    {
      id: 'atendimento-revisar',
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
            { label: 'horas', value: `${hours} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
          ]}
        />
      ),
    },
  ];

  const supervisionSteps: WizardStep[] = [
    {
      id: 'supervisao-resumo',
      title: 'resumo',
      headline: 'como você resume essa supervisão?',
      content: (
        <TextInput
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="ex: supervisão sobre caso de ansiedade"
          autoFocus
        />
      ),
    },
    {
      id: 'supervisao-quem',
      title: 'com quem',
      headline: 'com quem foi e quando?',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>{kind === 'intervisao' ? 'grupo de intervisão' : 'supervisora'}</FieldLabel>
            <TextInput value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="ex: supervisora do estágio básico" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>horas</FieldLabel>
              <TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="ex: 2" />
            </div>
            <div>
              <FieldLabel>data</FieldLabel>
              <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'supervisao-temas',
      title: 'temas',
      headline: 'o que foi discutido?',
      content: (
        <TagField
          tags={topics}
          onChange={setTopics}
          placeholder="ex: caso de ansiedade"
          emptyMessage="toque em + para adicionar os temas"
        />
      ),
    },
    {
      id: 'supervisao-orientacoes',
      title: 'orientações & dúvidas',
      headline: 'o que você levou para trabalhar depois?',
      content: (
        <div className="space-y-4">
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
      id: 'supervisao-proximos',
      title: 'próximos passos & reflexão',
      headline: 'e agora, o que vem pela frente?',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>próximos passos</FieldLabel>
            <TextArea rows={3} value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="o que combinaram de levar para a próxima..." />
          </div>
          <div>
            <FieldLabel>reflexões</FieldLabel>
            <TextArea rows={4} value={reflections} onChange={(e) => setReflections(e.target.value)} placeholder="como foi pra você?" />
          </div>
        </div>
      ),
    },
    {
      id: 'supervisao-revisar',
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
            { label: 'horas', value: `${hours} h` },
            { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
            { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
          ]}
        />
      ),
    },
  ];

  const outroSteps: WizardStep[] = [
    {
      id: 'outro-resumo',
      title: 'resumo',
      headline: 'o que foi esse registro?',
      content: (
        <TextArea
          rows={5}
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="ex: visita técnica, evento, plantão..."
          autoFocus
        />
      ),
    },
    {
      id: 'outro-horas',
      title: 'horas & data',
      headline: 'quantas horas e quando?',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>horas</FieldLabel>
            <TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="ex: 3" />
          </div>
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      id: 'outro-reflexao',
      title: 'reflexão',
      headline: 'como foi pra você?',
      content: (
        <TextArea
          rows={5}
          value={reflections}
          onChange={(e) => setReflections(e.target.value)}
          placeholder="o que você aprendeu com isso?"
        />
      ),
    },
    {
      id: 'outro-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'resumo', value: activity.trim() },
            { label: 'horas', value: `${hours} h` },
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
          : kind === 'outro'
            ? outroSteps
            : estagioSteps;

  const canNext = kind === null ? false : activity.trim().length > 0;

  const handleSave = () => {
    if (!kind) return;
    const base = {
      id: editingLog ? editingLog.id : 'ilog-' + Date.now(),
      type: kind,
      date: date || today(),
      hours: parseFloat(hours) || 4,
      activity: activity.trim(),
      reflections: reflections.trim() || 'reflexão registrada no diário do cecistudy.',
    };
    const log =
      kind === 'atendimento_clinico'
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
          : base;

    if (editingLog) {
      handleUpdateInternshipLog({ ...editingLog, ...log });
      hapticSuccess();
      closeWizard();
      showToast('registro de estágio atualizado ♡');
      return;
    }
    handleAddInternshipLog(log);
    hapticSuccess();
    closeWizard();
    showToast('registro de estágio guardado ♡');
  };

  const meta = kind
    ? KIND_META[kind]
    : { title: 'novo registro de estágio', icon: <Sparkles className="w-3.5 h-3.5" /> };

  return (
    <WizardScaffold
      title={editing ? `editar ${meta.title.replace('novo ', '')}` : meta.title}
      subtitle={kind === null ? 'estágio, atendimento, supervisão...' : undefined}
      icon={meta.icon}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      hideNext={kind === null}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar registro ♡'}
    />
  );
};
