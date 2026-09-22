import React from 'react';
import { useMobileApp } from '@/context/mobileApp';
import { WIZARD_REGISTRY } from './registry';

/** Renderiza o wizard correspondente ao topo da pilha (`currentWizardType`). */
export const WizardRouter: React.FC = () => {
  const { currentWizardType, wizardEdit } = useMobileApp();
  if (!currentWizardType) return null;
  const render = WIZARD_REGISTRY[currentWizardType];
  if (!render) return null;
  return <>{render(wizardEdit)}</>;
};
