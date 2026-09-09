import type { EntityId } from '../../core/domain/common';
import { makeId } from '../../core/domain/ids';

export type WorkspaceKind = 'academico' | 'profissional' | 'pessoal';
export type DefaultModule = 'home' | 'conhecimento' | 'calendario' | 'projetos' | 'estudos' | 'marketing';

export interface WorkspaceSettings {
  defaultModule: DefaultModule;
}

/**
 * Workspace = universo isolado de conhecimento, trabalho e contexto.
 * Por padrão não vaza contexto para outros Workspaces.
 */
export interface Workspace {
  id: EntityId;
  name: string;
  kind: WorkspaceKind;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
  isolated: boolean;
}

export function createWorkspace(input: {
  name: string;
  kind?: WorkspaceKind;
  defaultModule?: DefaultModule;
}): Workspace {
  const now = new Date().toISOString();
  return {
    id: makeId('ws'),
    name: input.name,
    kind: input.kind ?? 'academico',
    createdAt: now,
    updatedAt: now,
    settings: { defaultModule: input.defaultModule ?? 'conhecimento' },
    isolated: true,
  };
}