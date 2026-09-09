import type { Project } from '../../domain';
import { createProject, canAddProject } from '../../domain';

export interface CreateProjectInput {
  workspaceId: string;
  title: string;
  type?: Project['type'];
  templateId?: string;
}

/**
 * Cria um projeto acadêmico, respeitando a invariante de no máximo 5 projetos ativos.
 * Levanta erro se o limite foi atingido (quem chama decide como informar a Ceci).
 */
export function createProjectUseCase(input: CreateProjectInput, projects: Project[]): Project {
  if (!canAddProject(projects)) {
    throw new Error('limite de 5 projetos ativos atingido');
  }
  return createProject(input);
}
