import type { EntityId } from './common';
import { makeId } from './ids';

export type ProjectType =
  | 'tcc'
  | 'artigo'
  | 'iniciacao'
  | 'relatorio'
  | 'revisao'
  | 'caso'
  | 'apresentacao'
  | 'livre';

export type ProjectStatus = 'ativo' | 'pausado' | 'concluido' | 'arquivado';

/** Limite global de projetos ativos (todos os tipos contam juntos). */
export const MAX_ACTIVE_PROJECTS = 5;

export interface Project {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  badgeColor?: string;
  templateId?: string;
  tree: AcademicNode[];
  baseDocIds: EntityId[];
  createdAt: string;
  updatedAt: string;
}

export type AcademicNodeKind = 'preatextual' | 'capitulo' | 'secao' | 'subsecao' | 'postextual' | 'opcional';
export type Requiredness = 'obrigatorio' | 'recomendado' | 'opcional' | 'oculto' | 'nao_aplicavel';

export interface AcademicNode {
  id: EntityId;
  title: string;
  kind: AcademicNodeKind;
  requiredness: Requiredness;
  children: AcademicNode[];
  docId?: EntityId;
}

export type OutputFormat = 'docx' | 'pdf' | 'md' | 'latex' | 'pptx';
export type CitationProfile = 'abnt' | 'apa' | 'vancouver' | 'chicago' | 'custom';

export interface Output {
  id: EntityId;
  projectId: EntityId;
  name: string;
  type: ProjectType;
  citationProfile: CitationProfile;
  rootNodeIds: EntityId[];
  format: OutputFormat;
}

export type ReferenceType = 'book' | 'article' | 'web' | 'thesis' | 'other';

export interface Reference {
  id: EntityId;
  workspaceId: EntityId;
  type: ReferenceType;
  title: string;
  authors: string[];
  year?: string;
  doi?: string;
  isbn?: string;
  raw?: string;
}

export interface Citation {
  id: EntityId;
  referenceId: EntityId;
  docId: EntityId;
  locator?: string;
  kind: 'direta' | 'indireta';
}

export function activeProjectCount(projects: Project[]): number {
  return projects.filter((p) => p.status === 'ativo').length;
}

export function canAddProject(projects: Project[]): boolean {
  return activeProjectCount(projects) < MAX_ACTIVE_PROJECTS;
}

export function createProject(input: {
  workspaceId: EntityId;
  title: string;
  type?: ProjectType;
  templateId?: string;
}): Project {
  const now = new Date().toISOString();
  const tree: AcademicNode[] =
    input.type === 'tcc'
      ? [
          { id: makeId('acn'), title: 'Introdução', kind: 'capitulo', requiredness: 'obrigatorio', children: [] },
          { id: makeId('acn'), title: 'Referencial Teórico', kind: 'capitulo', requiredness: 'obrigatorio', children: [] },
          { id: makeId('acn'), title: 'Metodologia', kind: 'capitulo', requiredness: 'obrigatorio', children: [] },
          { id: makeId('acn'), title: 'Considerações Finais', kind: 'capitulo', requiredness: 'obrigatorio', children: [] },
        ]
      : [];
  return {
    id: makeId('prj'),
    workspaceId: input.workspaceId,
    title: input.title,
    type: input.type ?? 'livre',
    status: 'ativo',
    templateId: input.templateId,
    tree,
    baseDocIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
