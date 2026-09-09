import type {
  Workspace,
  Relation,
  Suggestion,
  AssociationPolicy,
  RelationKind,
  SuggestionType,
  Project,
  Output,
  ProjectType,
  OutputFormat,
  CitationProfile,
} from '../core/domain';
import { makeId } from '../core/domain';
import {
  addRelation,
  acceptSuggestion as acceptSuggestionUC,
  rejectSuggestion as rejectSuggestionUC,
  createProjectUseCase,
} from '../core/application/use-cases';

/**
 * Ações de espaços de trabalho (workspaces), Grafo de Conhecimento (relations/
 * suggestions/policies) e produção acadêmica (projects/outputs) — Fase B.2 (MOD-001).
 *
 * Extraídas do AppContext. Consomem settlers do DataClient + `showToast`,
 * passados explicitamente.
 */

export interface WorkspaceActionsDeps {
  currentWorkspaceId: string;
  workspaces: Workspace[];
  relations: Relation[];
  associationPolicies: AssociationPolicy[];
  projects: Project[];

  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  setCurrentWorkspaceId: React.Dispatch<React.SetStateAction<string>>;
  setRelations: React.Dispatch<React.SetStateAction<Relation[]>>;
  setAssociationPolicies: React.Dispatch<React.SetStateAction<AssociationPolicy[]>>;
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setOutputs: React.Dispatch<React.SetStateAction<Output[]>>;

  showToast: (message: string) => void;
}

export interface WorkspaceActions {
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, kind: Workspace['kind']) => void;
  addExplicitRelation: (input: {
    sourceId: string;
    targetId: string;
    kind: RelationKind;
    label?: string;
  }) => Relation;
  createSuggestion: (input: {
    type: SuggestionType;
    payload: Record<string, unknown>;
  }) => Suggestion;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  setAssociationPolicy: (rule: string, action: 'block' | 'reject') => void;
  createProject: (input: {
    title: string;
    type?: ProjectType;
    templateId?: string;
  }) => Project | null;
  updateProject: (updated: Project) => void;
  createOutput: (input: {
    projectId: string;
    name: string;
    type?: ProjectType;
    format?: OutputFormat;
    citationProfile?: CitationProfile;
  }) => Output;
  updateOutput: (updated: Output) => void;
  deleteOutput: (id: string) => void;
}

export function useWorkspaceActions(deps: WorkspaceActionsDeps): WorkspaceActions {
  const {
    currentWorkspaceId,
    workspaces,
    relations,
    associationPolicies,
    projects,
    setWorkspaces,
    setCurrentWorkspaceId,
    setRelations,
    setAssociationPolicies,
    setSuggestions,
    setProjects,
    setOutputs,
    showToast,
  } = deps;

  const switchWorkspace = (id: string) => {
    setCurrentWorkspaceId(id);
  };

  const createWorkspace = (name: string, kind: Workspace['kind']) => {
    const id = `ws-${Date.now()}`;
    const now = new Date().toISOString();
    const ws: Workspace = {
      id,
      name,
      kind,
      createdAt: now,
      updatedAt: now,
      settings: { defaultModule: 'conhecimento' },
      isolated: true,
    };
    setWorkspaces((prev) => [...prev, ws]);
    setCurrentWorkspaceId(id);
  };

  const addExplicitRelation = (input: {
    sourceId: string;
    targetId: string;
    kind: RelationKind;
    label?: string;
  }): Relation => {
    const rel = addRelation(
      { ...input, workspaceId: currentWorkspaceId },
      relations,
      associationPolicies
    );
    setRelations((prev) => (prev.some((r) => r.id === rel.id) ? prev : [...prev, rel]));
    return rel;
  };

  const createSuggestion = (input: {
    type: SuggestionType;
    payload: Record<string, unknown>;
  }): Suggestion => {
    const s: Suggestion = {
      id: makeId('sgt'),
      workspaceId: currentWorkspaceId,
      ...input,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setSuggestions((prev) => [...prev, s]);
    return s;
  };

  const acceptSuggestion = (id: string) =>
    setSuggestions((prev) => prev.map((s) => (s.id === id ? acceptSuggestionUC(s) : s)));

  const rejectSuggestion = (id: string) =>
    setSuggestions((prev) => prev.map((s) => (s.id === id ? rejectSuggestionUC(s) : s)));

  const setAssociationPolicy = (rule: string, action: 'block' | 'reject') => {
    setAssociationPolicies((prev) =>
      prev.some((p) => p.rule === rule)
        ? prev
        : [
            ...prev,
            {
              id: makeId('asp'),
              workspaceId: currentWorkspaceId,
              rule,
              action,
              createdAt: new Date().toISOString(),
            },
          ]
    );
  };

  const createProject = (input: {
    title: string;
    type?: ProjectType;
    templateId?: string;
  }): Project | null => {
    try {
      const p = createProjectUseCase(
        { ...input, workspaceId: currentWorkspaceId },
        projects
      );
      setProjects((prev) => [...prev, p]);
      showToast(`projeto "${p.title}" criado ♡`);
      return p;
    } catch (err) {
      const msg = (err as Error).message;
      showToast(
        msg.includes('limite')
          ? 'você já tem 5 projetos ativos — conclui um para começar outro ♡'
          : 'não foi possível criar o projeto'
      );
      return null;
    }
  };

  const updateProject = (updated: Project) =>
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const createOutput = (input: {
    projectId: string;
    name: string;
    type?: ProjectType;
    format?: OutputFormat;
    citationProfile?: CitationProfile;
  }): Output => {
    const o: Output = {
      id: makeId('out'),
      projectId: input.projectId,
      name: input.name,
      type: input.type ?? 'tcc',
      citationProfile: input.citationProfile ?? 'abnt',
      rootNodeIds: [],
      format: input.format ?? 'docx',
    };
    setOutputs((prev) => [...prev, o]);
    return o;
  };

  const updateOutput = (updated: Output) =>
    setOutputs((prev) => prev.map((o) => (o.id === updated.id ? o : o)));

  const deleteOutput = (id: string) =>
    setOutputs((prev) => prev.filter((o) => o.id !== id));

  return {
    switchWorkspace,
    createWorkspace,
    addExplicitRelation,
    createSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    setAssociationPolicy,
    createProject,
    updateProject,
    createOutput,
    updateOutput,
    deleteOutput,
  };
}
