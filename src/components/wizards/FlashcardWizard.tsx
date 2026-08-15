import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { ReviewCard, SelectField, TextArea, TextInput } from './wizardFields';

export const FlashcardWizard: React.FC = () => {
  const {
    courses,
    concepts,
    wizardCourseId,
    handleAddFlashcard,
    closeWizard,
    showToast,
  } = useApp();

  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [courseId, setCourseId] = useState(wizardCourseId || courses[0]?.id || '');
  const [conceptId, setConceptId] = useState('');

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
          <SelectField
            label="conceito relacionado (opcional)"
            value={conceptId}
            onChange={setConceptId}
            options={concepts.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há conceitos no cantinho."
          />
          <SelectField
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
      title="novo flashcard"
      icon={<Brain className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar flashcard ♡"
    />
  );
};
