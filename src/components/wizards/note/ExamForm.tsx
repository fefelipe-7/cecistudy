// Wizard "transformar nota" — formulário de prova/avaliação (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import { DateInput, FieldLabel, TextInput } from '../wizardFields';
import { TagField } from '../../ui/TagField';

interface ExamFormProps {
  value: string;
  onChange: (v: string) => void;
  courseSelect: ReactNode;
  date: string;
  onDateChange: (d: string) => void;
  weight: string;
  onWeightChange: (w: string) => void;
  topics: string[];
  onTopicsChange: (t: string[]) => void;
}

const ExamForm: React.FC<ExamFormProps> = ({
  value,
  onChange,
  courseSelect,
  date,
  onDateChange,
  weight,
  onWeightChange,
  topics,
  onTopicsChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="título da prova"
      autoFocus
    />
    {courseSelect}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>data</FieldLabel>
        <DateInput value={date} onChange={(e) => onDateChange(e.target.value)} />
      </div>
      <div>
        <FieldLabel>peso</FieldLabel>
        <TextInput
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          placeholder="ex: 40% da nota"
        />
      </div>
    </div>
    <TagField
      tags={topics}
      onChange={onTopicsChange}
      placeholder="tópicos da prova (ex: transtornos de ansiedade)"
      emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
    />
  </div>
);

export default ExamForm;