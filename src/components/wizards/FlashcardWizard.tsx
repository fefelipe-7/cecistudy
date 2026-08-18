import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { ReviewCard, TextArea, TextInput } from './wizardFields';
import { Picker } from '../ui/Picker';

export const FlashcardWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    courses,
    concepts,
    flashcards,
    wizardCourseId,
    handleAddFlashcard,
    handleUpdateFlashcard,
    closeWizard,
    showToast,
  } = useApp();
  const editingCard = editing?.kind === 'flashcard'
    ? flashcards.find((c) => c.id === editing.id)
    : undefined;

  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState(editingCard?.question ?? '');
  const [answer, setAnswer] = useState(editingCard?.answer ?? '');
  const [courseId, setCourseId] = useState(
    editingCard?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );
  const [conceptId, setConceptId] = useState(editingCard?.conceptId ?? '');

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';
  const conceptName = concepts.find((c) => c.id === conceptId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'card-frente',
      title: 'frente',
      headline: 'qual a pergunta do card?',
      content: (
        <TextInput
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ex: o que é a tríade cognitiva da depressão?"
          autoFocus
        />
      ),
    },
    {
      id: 'card-verso',
      title: 'verso',
      headline: 'e qual é a resposta?',
      content: (
        <TextArea
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="explique a resposta com suas palavras..."
        />
      ),
    },
    {
      id: 'card-contexto',
      title: 'contexto',
      headline: 'quer conectar a um conceito ou disciplina?',
      content: (
        <div className="space-y-4">
          <Picker
            label="conceito relacionado (opcional)"
            value={conceptId}
            onChange={setConceptId}
            options={concepts.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há conceitos no cantinho."
          />
          <Picker
            label="disciplina (opcional)"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
          />
        </div>
      ),
    },
    {
      id: 'card-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'pergunta', value: question.trim() },
            { label: 'resposta', value: answer.trim() },
            { label: 'conceito', value: conceptName || 'sem conceito' },
            { label: 'disciplina', value: courseName || 'sem disciplina' },
          ]}
        />
      ),
    },
  ];

  const canNext =
    step === 0 ? question.trim().length > 0 : step === 1 ? answer.trim().length > 0 : true;

  const handleSave = () => {
    if (editingCard) {
      handleUpdateFlashcard({
        ...editingCard,
        courseId: courseId || undefined,
        conceptId: conceptId || undefined,
        question: question.trim(),
        answer: answer.trim(),
      });
      hapticSuccess();
      closeWizard();
      showToast('flashcard atualizado ♡');
      return;
    }
    handleAddFlashcard({
      id: 'f-' + Date.now(),
      courseId: courseId || undefined,
      conceptId: conceptId || undefined,
      question: question.trim(),
      answer: answer.trim(),
      timesReviewed: 0,
    });
    hapticSuccess();
    closeWizard();
    showToast('flashcard guardado no cantinho ♡');
  };

  return (
    <WizardScaffold
      title={editing ? 'editar flashcard' : 'novo flashcard'}
      icon={<Brain className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar flashcard ♡'}
    />
  );
};
