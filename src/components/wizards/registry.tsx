// Registry de wizards (Fase 3): mapeia cada `WizardFlow` ao componente.
// O `WizardRouter` só consulta o mapa — adicionar um wizard novo é adicionar
// uma entrada aqui, sem tocar em switch.
import type { ReactNode } from 'react';
import type { ManagedItem, WizardFlow } from '../../types';
import { TaskExamWizard } from './TaskExamWizard';
import { FlashcardWizard } from './FlashcardWizard';
import { ReadingWizard } from './ReadingWizard';
import { SessionWizard } from './SessionWizard';
import { InternshipWizard } from './InternshipWizard';
import { AuthorWizard } from './AuthorWizard';
import { ConceptWizard } from './ConceptWizard';
import { MaterialWizard } from './MaterialWizard';
import { CourseWizard } from './CourseWizard';

export const WIZARD_REGISTRY: Record<WizardFlow, (editing: ManagedItem | null) => ReactNode> = {
  task: (editing) => <TaskExamWizard preset="task" editing={editing} />,
  exam: (editing) => <TaskExamWizard preset="exam" editing={editing} />,
  'task-exam': () => <TaskExamWizard />,
  course: () => <CourseWizard />,
  flashcard: (editing) => <FlashcardWizard editing={editing} />,
  reading: (editing) => <ReadingWizard editing={editing} />,
  session: (editing) => <SessionWizard editing={editing} />,
  internship: (editing) => <InternshipWizard editing={editing} />,
  author: (editing) => <AuthorWizard editing={editing} />,
  concept: (editing) => <ConceptWizard editing={editing} />,
  material: (editing) => <MaterialWizard editing={editing} />,
};
