// Wizard "transformar nota" — formulário de flashcard (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import { Picker } from '../../ui/Picker';
import { FieldLabel, TextArea, TextInput } from '../wizardFields';

interface FlashcardFormProps {
  question: string;
  onQuestionChange: (v: string) => void;
  answer: string;
  onAnswerChange: (v: string) => void;
  courseSelect: ReactNode;
  conceptId: string;
  onConceptIdChange: (v: string) => void;
  conceptOptions: { value: string; label: string }[];
}

const FlashcardForm: React.FC<FlashcardFormProps> = ({
  question,
  onQuestionChange,
  answer,
  onAnswerChange,
  courseSelect,
  conceptId,
  onConceptIdChange,
  conceptOptions,
}) => (
  <div className="space-y-4">
    <TextInput
      value={question}
      onChange={(e) => onQuestionChange(e.target.value)}
      placeholder="pergunta do cartão"
      autoFocus
    />
    <div>
      <FieldLabel>resposta</FieldLabel>
      <TextArea
        rows={5}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="resposta (o conteúdo da sua nota)"
      />
    </div>
    {courseSelect}
    <Picker
      label="conceito (opcional)"
      value={conceptId}
      onChange={(v) => onConceptIdChange(v)}
      options={conceptOptions}
      placeholder="sem conceito"
      emptyMessage="ainda não há conceitos no cantinho."
    />
  </div>
);

export default FlashcardForm;