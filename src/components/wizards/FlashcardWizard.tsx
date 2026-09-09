import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { TOAST } from '../../lib/copy';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { ReviewCard, TextArea, TextInput } from './wizardFields';
import { Picker } from '../ui/Picker';
import { useAcervoTheory } from './useAcervoTheory';

export const FlashcardWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    courses,
    concepts,
    flashcards,
    wizardCourseId,
    handleAddFlashcard,
    handleUpdateFlashcard,
    closeWizard,
    openEditCourse,
    showToast,
  } = useMobileApp();
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
  const { conceptOptions, resolveIds } = useAcervoTheory();

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';
  const conceptName = concepts.find((c) => c.id === conceptId)?.name ?? '';

  const createCourseInline = () => {
    showToast(TOAST.courseRegistered);
    openEditCourse();
  };

  const steps: WizardStep[] = [
    {
      id: 'card-frente',
      title: 'frente',
      headline: 'qual a pergunta do card?',
      subtitle: 'uma pergunta curta, tipo "o que é...?" ou "como...?" — a resposta entra no próximo passo.',
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
      subtitle: 'explica com as suas palavras — quanto mais simples e direta, mais fácil revisar depois.',
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
      subtitle: 'vínculos são opcionais — ajudam a revisar o cartão por tema ou matéria ♡',
      content: (
        <div className="space-y-4">
          <Picker
            label="conceito relacionado (opcional)"
            value={conceptId}
            onChange={(v) => setConceptId(resolveIds([v])[0])}
            options={conceptOptions}
            emptyMessage="ainda não há conceitos no cantinho."
          />
          <Picker
            label="disciplina (opcional)"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
            createLabel="criar matéria agora"
            onCreate={createCourseInline}
          />
        </div>
      ),
    },
    {
      id: 'card-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      subtitle: 'confere pergunta e resposta antes de guardar o card.',
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
  const blockedReason =
    step === 0
      ? 'escreva a pergunta do card para continuar'
      : step === 1
        ? 'escreva a resposta para continuar'
        : undefined;

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
      mascote="review-card"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason={blockedReason}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar flashcard ♡'}
    />
  );
};
