import React, { useState } from 'react';
import { Timer } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldHint, FieldLabel, ReviewCard, TextInput } from './wizardFields';
import { Picker } from '../ui/Picker';

const today = () => new Date().toISOString().split('T')[0];

export const SessionWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { courses, sessions, wizardCourseId, handleAddSession, handleUpdateSession, closeWizard, showToast } = useMobileApp();
  const editingSession = editing?.kind === 'session'
    ? sessions.find((s) => s.id === editing.id)
    : undefined;
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState(editingSession?.topic ?? '');
  const [minutes, setMinutes] = useState(String(editingSession?.durationMinutes ?? '25'));
  const [courseId, setCourseId] = useState(
    editingSession?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'sessao-tema',
      title: 'tema',
      headline: 'o que você vai estudar?',
      subtitle: 'o assunto da sessão de foco — ex: revisar semiologia dos transtornos do humor.',
      content: (
        <TextInput
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="ex: revisar semiologia dos transtornos do humor"
          autoFocus
        />
      ),
    },
    {
      id: 'sessao-ritmo',
      title: 'ritmo',
      headline: 'por quanto tempo?',
      subtitle: 'a duração que combina com a sua disponibilidade de agora.',
      content: (
        <div>
          <FieldLabel>duração (minutos)</FieldLabel>
          <TextInput
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="ex: 25"
          />
          <FieldHint>25 minutos é um bom começo — você ajusta sempre que quiser.</FieldHint>
        </div>
      ),
    },
    {
      id: 'sessao-disciplina',
      title: 'disciplina',
      headline: 'quer conectar a uma disciplina?',
      subtitle: 'opcional — ajuda a separar o foco por matéria no seu histórico ♡',
      content: (
        <Picker
          value={courseId}
          onChange={setCourseId}
          options={courses.map((c) => ({ value: c.id, label: c.name }))}
          emptyMessage="ainda não há disciplinas cadastradas."
        />
      ),
    },
    {
      id: 'sessao-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      subtitle: 'confere o tema e a duração da sessão antes de guardar no histórico.',
      content: (
        <ReviewCard
          rows={[
            { label: 'estudo', value: topic.trim() },
            { label: 'duração', value: `${minutes} min` },
            { label: 'disciplina', value: courseName || 'sem disciplina' },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    if (editingSession) {
      handleUpdateSession({
        ...editingSession,
        courseId: courseId || undefined,
        topic: topic.trim(),
        durationMinutes: parseInt(minutes) || 25,
      });
      hapticSuccess();
      closeWizard();
      showToast('sessão atualizada ♡');
      return;
    }
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: courseId || undefined,
      topic: topic.trim(),
      date: today(),
      durationMinutes: parseInt(minutes) || 25,
    });
    hapticSuccess();
    closeWizard();
    showToast('sessão guardada no seu histórico ♡');
  };

  return (
    <WizardScaffold
      title={editing ? 'editar sessão' : 'nova sessão de estudo'}
      icon={<Timer className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={topic.trim().length > 0}
      blockedReason="dê um assunto para a sessão"
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar sessão ♡'}
    />
  );
};
