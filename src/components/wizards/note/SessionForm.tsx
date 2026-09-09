// Wizard "transformar nota" — formulário de sessão de estudo (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import { DateInput, FieldLabel, TextInput } from '../wizardFields';

interface SessionFormProps {
  topic: string;
  onTopicChange: (v: string) => void;
  courseSelect: ReactNode;
  date: string;
  onDateChange: (d: string) => void;
  duration: number;
  onDurationChange: (n: number) => void;
}

const SessionForm: React.FC<SessionFormProps> = ({
  topic,
  onTopicChange,
  courseSelect,
  date,
  onDateChange,
  duration,
  onDurationChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={topic}
      onChange={(e) => onTopicChange(e.target.value)}
      placeholder="tópico da sessão"
      autoFocus
    />
    {courseSelect}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>data</FieldLabel>
        <DateInput value={date} onChange={(e) => onDateChange(e.target.value)} />
      </div>
      <div>
        <FieldLabel>duração (min)</FieldLabel>
        <TextInput
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  </div>
);

export default SessionForm;