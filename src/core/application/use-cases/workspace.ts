import type { Workspace } from '../../domain';
import { createWorkspace } from '../../domain';

export interface CreateWorkspaceInput {
  name: string;
  kind?: Workspace['kind'];
  defaultModule?: Workspace['settings']['defaultModule'];
}

export function createWorkspaceUseCase(input: CreateWorkspaceInput, _existing: Workspace[]): Workspace {
  return createWorkspace(input);
}
