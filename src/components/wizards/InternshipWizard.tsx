import React, { useMemo } from 'react';
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
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldLabel, ReviewCard, TextArea, TextInput, DateInput } from './wizardFields';
import { TagField } from '../ui/TagField';
import { today } from './note/constants';

const KINDS: {
  value: InternshipLogType;
  label: string;
  caption: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'estagio', label: 'estágio', caption: 'dia de campo na clínica escola', Icon: HeartHandshake },
  { value: 'supervisao', label: 'supervisão', caption: 'orientação da supervisora', Icon: Compass },
  { value: 'intervisao', label: 'intervisão', caption: 'troca com colegas de estágio', Icon: Users },
  { value: 'outro', label: 'outro', caption: 'registro avulso de campo', Icon: Sparkles },
];

const KIND_META: Record<InternshipLogType, { title: string; icon: React.ReactNode }> = {
  estagio: { title: 'novo registro de estágio', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
  supervisao: { title: 'nova supervisão', icon: <Compass className="w-3.5 h-3.5" /> },
  intervisao: { title: 'nova intervisão', icon: <Users className="w-3.5 h-3.5" /> },
  outro: { title: 'novo registro', icon: <Sparkles className="w-3.5 h-3.5" /> },
};

/** Rascunho do registro essencial. */
interface InternshipDraft {
  kind?: InternshipLogType | null;
  activity?: string;
  hours?: string;
  date?: string;
  reflections?: string;
  discussedClinicalIds?: string[];
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
}

export const InternshipWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    internshipLogs,
    internshipClinical,
    handleAddInternshipLog,
    handleUpdateInternshipLog,
    closeWizard,
    showToast,
  } = useMobileApp();
  const editingLog = editing?.kind === 'internship'
    ? internshipLogs.find((l) => l.id === editing.id)
    : undefined;

  const { values, patch, step, setStep, clearDraft, isDirty } = useWizardForm<InternshipDraft>({
    draftKey: 'internship',
    initial: {
      kind: editingLog?.type ?? null,
      // comuns
      activity: editingLog?.activity ?? '',
      hours: editingLog ? String(editingLog.hours) : '',
      date: editingLog?.date ?? '',
      reflections: editingLog?.reflections ?? '',
      // atendimento clínico
      // supervisão / intervisão
      supervisor: editingLog?.supervisor ?? '',
      topics: editingLog?.topics ?? [],
      orientations: editingLog?.orientations ?? '',
      doubts: editingLog?.doubts ?? '',
      nextSteps: editingLog?.nextSteps ?? [],
      beforeNotes: editingLog?.beforeNotes ?? '',
      afterNotes: editingLog?.afterNotes ?? '',
      selfAssessment: editingLog?.selfAssessment
        ? {
            confidence: editingLog.selfAssessment.confidence,
            limits: editingLog.selfAssessment.limits,
            themes: editingLog.selfAssessment.themes,
          }
        : undefined,
    },
    editing: !!editingLog,
    isDirty: (v) =>
      !editingLog && (v.activity?.trim().length > 0 || v.reflections?.trim().length > 0),
  });
  const {
    kind,
    activity,
    hours,
    date,
    reflections,
    supervisor,
    topics,
    orientations,
    doubts,
    nextSteps,
    discussedClinicalIds,
    beforeNotes,
    afterNotes,
    selfAssessment,
  } = values;
  const confidence = selfAssessment?.confidence ?? '';
  const limits = selfAssessment?.limits ?? '';
  const themes = selfAssessment?.themes ?? '';
  const setKind = (k: InternshipLogType | null) => patch({ kind: k });

  /**
   * Ids das projeções já discutidas em alguma supervisão.
   *
   * A relação mora na **supervisão** (`discussedClinicalIds`), e não na projeção:
   * a projeção não sabe se foi discutida, e afirmar que sabe seria inventar estado
   * que o tradutor não tem como enviar.
   */
  const discutidas = useMemo(
    () =>
      new Set(
        internshipLogs.flatMap((l) => (l.type === 'supervisao' ? (l.discussedClinicalIds ?? []) : [])),
      ),
    [internshipLogs],
  );

  // Projeções de atendimento disponíveis para discussão em supervisão.
  //
  // `SPEC-M-013` `D1`: a fonte é a **projeção** de cinco campos, não o registro
  // clínico. Antes, esta lista vinha de `internshipLogs` com
  // `type === 'atendimento_clinico'` e lia `supervisionLogId` e `sessionNumber` —
  // dois campos que §4.8 linha 472 proíbe no aparelho.
  //
  // A ordenação põe as não discutidas primeiro, que é o que a supervisora precisa
  // ver, e ordena por data porque a projeção **não** tem número de sessão: ela não
  // guarda `sessionNumber` porque §4.8 linha 466 não autoriza dado além das
  // iniciais.
  const attendanceLogs = useMemo(() => {
    return [...internshipClinical].sort((a, b) => {
      const aPending = !discutidas.has(a.id);
      const bPending = !discutidas.has(b.id);
      if (aPending !== bPending) return aPending ? -1 : 1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });
    // `discutidas` é derivado de `internshipLogs`, que já está na depêndencia.
  }, [internshipClinical, internshipLogs]);

  const finish = () => {
    clearDraft();
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
              onChange={(e) => patch({ hours: e.target.value })}
              placeholder="ex: 4"
            />
          </div>
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => patch({ date: e.target.value })} />
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
          onChange={(e) => patch({ reflections: e.target.value })}
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
        onChange={(e) => patch({ activity: e.target.value })}
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

  const supervisionSteps: WizardStep[] = [
    essentialStep(
      <TextInput
        value={activity}
        onChange={(e) => patch({ activity: e.target.value })}
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
            <TextInput value={supervisor} onChange={(e) => patch({ supervisor: e.target.value })} placeholder="ex: supervisora do estágio básico" />
          </div>
          <TagField
            tags={topics}
            onChange={(v) => patch({ topics: v })}
            placeholder="ex: caso de ansiedade"
            emptyMessage="toque em + para adicionar os temas"
          />
          <div>
            <FieldLabel>orientações recebidas</FieldLabel>
            <TextArea rows={4} value={orientations} onChange={(e) => patch({ orientations: e.target.value })} placeholder="o que foi orientado..." />
          </div>
          <div>
            <FieldLabel>dúvidas para investigar</FieldLabel>
            <TextArea rows={3} value={doubts} onChange={(e) => patch({ doubts: e.target.value })} placeholder="perguntas que ficaram no ar..." />
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
            {attendanceLogs.map((projecao) => (
              <div key={projecao.id} className="flex items-start gap-3 p-2 rounded-lg border border-ceci-border-subtle">
                <input
                  type="checkbox"
                  checked={discussedClinicalIds.includes(projecao.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      patch({ discussedClinicalIds: [...discussedClinicalIds, projecao.id] });
                    } else {
                      patch({ discussedClinicalIds: discussedClinicalIds.filter((id) => id !== projecao.id) });
                    }
                  }}
                  className="h-4 w-4 flex-shrink-0 text-ceci-primary"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ceci-primary">{projecao.iniciais}</span>
                    <span className="text-xs text-ceci-secondary">
                      {new Date(projecao.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className="text-xs text-ceci-secondary truncate max-w-[200px]">
                    {projecao.paraLevar.trim() || 'sem "para levar"'}
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
          onChange={(e) => patch({ beforeNotes: e.target.value })}
          placeholder="suas hipóteses e perguntas que levou..."
        />
        <FieldLabel>o que ficou combinado</FieldLabel>
        <TextArea
          rows={3}
          value={afterNotes}
          onChange={(e) => patch({ afterNotes: e.target.value })}
          placeholder="as orientações e decisões da supervisão..."
        />
        <FieldLabel>autoavaliação</FieldLabel>
        <div className="space-y-2">
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
            onChange={(v) => patch({ nextSteps: v })}
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
            { label: 'atendimentos discutidos', value: discussedClinicalIds.length ? `${discussedClinicalIds.length} sessões` : '—' },
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
    // Não existe ramo clínico. §4.8 linha 471 é `[D]`: a camada clínica é só
    // desktop, e `SPEC-M-013` `D1` tirou o registro do aparelho. O que o celular
    // mostra de um atendimento é a projeção, que vem pronta do desktop — e por
    // isso este `buildLog` nunca produz um.
    return kind === 'supervisao' || kind === 'intervisao'
      ? {
          ...base,
          supervisor: supervisor.trim() || undefined,
          topics: topics.length ? topics : undefined,
          orientations: orientations.trim() || undefined,
          doubts: doubts.trim() || undefined,
          discussedClinicalIds: discussedClinicalIds.length ? discussedClinicalIds : undefined,
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
      // Sem efeito colateral em registro clínico. Antes, salvar uma supervisão
      // reescrevia `supervisionLogId` em cada `atendimento_clinico` — ou seja,
      // cada gravação de supervisão escreva em registro de paciente. A relação
      // agora mora na supervisão (`discussedClinicalIds`), que o `buildLog` acima
      // já grava, e `SPEC-M-013` `D1` tirou o registro clínico do aparelho.
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

  // O mascote de atendimento clínico saiu com o registro clínico: §4.8 linha 471
  // é `[D]` e o celular não registra atendimento.
  const mascote =
    kind === 'supervisao' || kind === 'intervisao' ? 'supervision-reflect' : 'field-prepare';

  return (
    <WizardScaffold
      title={editing ? `editar ${meta.title.replace('novo ', '')}` : meta.title}
      subtitle={kind === null ? 'estágio, supervisão, intervisão...' : undefined}
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