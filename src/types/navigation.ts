// Domínio: navegação por pilha, wizards e header dinâmico (MOD-001 / B.3).
//
// Os tipos de navegação PUROS (sem React) vivem em `packages/navigation`
// (o pacote é o dono da lógica de pilha/rota). Aqui re-exportamos daquele pacote
// (caminho relativo — ver AGENTS.md: stubs de compat usam caminho RELATIVO ao pacote,
// nunca `@/packages/...`), mantendo os imports existentes via barrel `../types`.
//
// Ficam definidos AQUI os tipos que dependem de React (`DynamicHeaderConfig`/`HeaderAction`),
// pois os pacotes `packages/*` não podem importar React (regra do check-boundaries).

export type {
  NavTab,
  SubTabFaculdade,
  StudyScreen,
  SubTabBiblioteca,
  NavScreen,
  WizardFlow,
  ManagedItemKind,
  ManagedItem,
  CourseIconName,
} from '../../packages/navigation/src/types';
import type { CourseIconName } from '../../packages/navigation/src/types';

import type { ComponentType, ReactNode } from 'react';

export interface HeaderAction {
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface DynamicHeaderConfig {
  type?: 'default' | 'detail' | 'custom';
  title?: string;
  subtitle?: string;
  code?: string;
  badge?: string;
  badgeColor?: string;
  icon?: CourseIconName | string;
  color?: string;
  onBack?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  rightActions?: ReactNode;
  /** Menu de ações contextuais renderizado no lado direito do header (padrão de telas auxiliares). */
  actions?: HeaderAction[];
}
