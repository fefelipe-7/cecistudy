// Wizard "transformar nota" — formulário de estágio (MOD-001 / B.5).
import React from 'react';
import type { InternshipLogType } from '../../../types';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { DateInput, FieldLabel, TextArea, TextInput } from '../wizardFields';
import { INTERNSHIP_TYPES } from './constants';

interface InternshipFormProps {
  activity: string;
  onActivityChange: (v: string) => void;
  type: InternshipLogType;
  onTypeChange: (v: InternshipLogType) => void;
  date: string;
  onDateChange: (d: string) => void;
  hours: number;
  onHoursChange: (n: number) => void;
  reflections: string;
  onReflectionsChange: (v: string) => void;
}

const InternshipForm: React.FC<InternshipFormProps> = ({
  activity,
  onActivityChange,
  type,
  onTypeChange,
  date,
  onDateChange,
  hours,
  onHoursChange,
  reflections,
  onReflectionsChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={activity}
      onChange={(e) => onActivityChange(e.target.value)}
      placeholder="o que aconteceu (atividade/evento)"
      autoFocus
    />
    <ChoiceCardGrid
      label="tipo"
      options={INTERNSHIP_TYPES}
      value={type}
      onChange={onTypeChange}
    />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>data</FieldLabel>
        <DateInput value={date} onChange={(e) => onDateChange(e.target.value)} />
      </div>
      <div>
        <FieldLabel>horas</FieldLabel>
        <TextInput
          type="number"
          value={hours}
          onChange={(e) => onHoursChange(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
    <div>
      <FieldLabel>reflexões</FieldLabel>
      <TextArea
        rows={4}
        value={reflections}
        onChange={(e) => onReflectionsChange(e.target.value)}
        placeholder="reflexões sobre o registro"
      />
    </div>
  </div>
);

export default InternshipForm;