import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskExamWizard } from './TaskExamWizard';
import { FlashcardWizard } from './FlashcardWizard';
import { ReadingWizard } from './ReadingWizard';
import { SessionWizard } from './SessionWizard';
import { InternshipWizard } from './InternshipWizard';
import { AuthorWizard } from './AuthorWizard';

/** Renderiza o wizard correspondente ao topo da pilha (`currentWizardType`). */
export const WizardRouter: React.FC = () => {
  const { currentWizardType } = useApp();
  if (!currentWizardType) return null;
  switch (currentWizardType) {
    case 'task':
      return <TaskExamWizard preset="task" />;
    case 'exam':
      return <TaskExamWizard preset="exam" />;
    case 'task-exam':
      return <TaskExamWizard />;
    case 'flashcard':
      return <FlashcardWizard />;
    case 'reading':
      return <ReadingWizard />;
    case 'session':
      return <SessionWizard />;
    case 'internship':
      return <InternshipWizard />;
    case 'author':
      return <AuthorWizard />;
    default:
      return null;
  }
};
