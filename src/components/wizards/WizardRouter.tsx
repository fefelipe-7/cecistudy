import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskExamWizard } from './TaskExamWizard';
import { FlashcardWizard } from './FlashcardWizard';
import { ReadingWizard } from './ReadingWizard';
import { SessionWizard } from './SessionWizard';
import { InternshipWizard } from './InternshipWizard';
import { AuthorWizard } from './AuthorWizard';
import { ConceptWizard } from './ConceptWizard';
import { MaterialWizard } from './MaterialWizard';
import { CourseWizard } from './CourseWizard';

/** Renderiza o wizard correspondente ao topo da pilha (`currentWizardType`). */
export const WizardRouter: React.FC = () => {
  const { currentWizardType, wizardEdit } = useApp();
  if (!currentWizardType) return null;
  switch (currentWizardType) {
    case 'task':
      return <TaskExamWizard preset="task" editing={wizardEdit} />;
    case 'exam':
      return <TaskExamWizard preset="exam" editing={wizardEdit} />;
    case 'task-exam':
      return <TaskExamWizard />;
    case 'course':
      return <CourseWizard />;
    case 'flashcard':
      return <FlashcardWizard editing={wizardEdit} />;
    case 'reading':
      return <ReadingWizard editing={wizardEdit} />;
    case 'session':
      return <SessionWizard editing={wizardEdit} />;
    case 'internship':
      return <InternshipWizard editing={wizardEdit} />;
    case 'author':
      return <AuthorWizard editing={wizardEdit} />;
    case 'concept':
      return <ConceptWizard editing={wizardEdit} />;
    case 'material':
      return <MaterialWizard editing={wizardEdit} />;
    default:
      return null;
  }
};