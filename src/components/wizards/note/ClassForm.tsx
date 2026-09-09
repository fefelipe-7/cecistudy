// Wizard "transformar nota" — formulário de aula (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import { DateInput, FieldLabel, TextInput } from '../wizardFields';

interface ClassFormProps {
  value: string;
  onChange: (v: string) => void;
  courseSelect: ReactNode;
  classNumber: number;
  onClassNumberChange: (n: number) => void;
  classDate: string;
  onClassDateChange: (d: string) => void;
}

const ClassForm: React.FC<ClassFormProps> = ({
  value,
  onChange,
  courseSelect,
  classNumber,
  onClassNumberChange,
  classDate,
  onClassDateChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="título da aula"
      autoFocus
    />
    {courseSelect}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>número da aula</FieldLabel>
        <TextInput
          type="number"
          value={classNumber}
          onChange={(e) => onClassNumberChange(parseInt(e.target.value) || 0)}
        />
      </div>
      <div>
        <FieldLabel>data</FieldLabel>
        <DateInput value={classDate} onChange={(e) => onClassDateChange(e.target.value)} />
      </div>
    </div>
  </div>
);

export default ClassForm;