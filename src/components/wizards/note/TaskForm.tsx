// Wizard "transformar nota" — formulário de tarefa (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import type { Task } from '../../../types';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { DateInput, FieldLabel, TextInput } from '../wizardFields';
import { PRIORITIES, TASK_CATEGORIES } from './constants';

interface TaskFormProps {
  value: string;
  onChange: (v: string) => void;
  category: Task['category'];
  onCategoryChange: (v: Task['category']) => void;
  priority: Task['priority'];
  onPriorityChange: (v: Task['priority']) => void;
  courseSelect: ReactNode;
  dueDate: string;
  onDueDateChange: (d: string) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  value,
  onChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  courseSelect,
  dueDate,
  onDueDateChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="título da tarefa"
      autoFocus
    />
    <ChoiceCardGrid
      label="categoria"
      options={TASK_CATEGORIES}
      value={category}
      onChange={onCategoryChange}
    />
    <ChoiceCardGrid
      label="prioridade"
      options={PRIORITIES}
      value={priority}
      onChange={onPriorityChange}
    />
    {courseSelect}
    <div>
      <FieldLabel>prazo</FieldLabel>
      <DateInput value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} />
    </div>
  </div>
);

export default TaskForm;