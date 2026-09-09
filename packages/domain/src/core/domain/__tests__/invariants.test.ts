import { describe, it, expect } from 'vitest';
import {
  makeId,
  prefixOf,
  createWorkspace,
  createDocument,
  createRelation,
  activeProjectCount,
  canAddProject,
  createProject,
  createResponsibility,
  capabilityFor,
} from '../index';
import type { Project } from '../index';

describe('core/domain — ids', () => {
  it('makeId gera id com prefixo e único', () => {
    const a = makeId('doc');
    const b = makeId('doc');
    expect(a).not.toBe(b);
    expect(a.startsWith('doc-')).toBe(true);
    expect(prefixOf(a)).toBe('doc');
  });
});

describe('core/domain — workspace', () => {
  it('createWorkspace isola contexto por padrão', () => {
    const ws = createWorkspace({ name: 'Acadêmico' });
    expect(ws.isolated).toBe(true);
    expect(ws.kind).toBe('academico');
    expect(ws.settings.defaultModule).toBe('conhecimento');
  });
});

describe('core/domain — conhecimento', () => {
  it('createDocument carrega workspace e timestamps', () => {
    const doc = createDocument({ workspaceId: 'ws-1', title: 'anotação' });
    expect(doc.workspaceId).toBe('ws-1');
    expect(doc.blocks).toEqual([]);
    expect(doc.updatedAt).toBeTruthy();
  });

  it('createRelation aceita por padrão exceto semântica (vai para Inbox)', () => {
    const manual = createRelation({ workspaceId: 'ws-1', sourceId: 'a', targetId: 'b', kind: 'explicita' });
    const semantic = createRelation({ workspaceId: 'ws-1', sourceId: 'a', targetId: 'b', kind: 'semantica' });
    expect(manual.accepted).toBe(true);
    expect(semantic.accepted).toBe(false);
  });
});

describe('core/domain — projetos (invariante de limite)', () => {
  function active(n: number): Project[] {
    return Array.from({ length: n }, () => createProject({ workspaceId: 'ws-1', title: 'p' }));
  }
  it('conta apenas projetos ativos', () => {
    const list: Project[] = [...active(4), createProject({ workspaceId: 'ws-1', title: 'x' })];
    list[4].status = 'arquivado';
    expect(activeProjectCount(list)).toBe(4);
  });
  it('bloqueia criação ao atingir 5 ativos', () => {
    expect(canAddProject(active(4))).toBe(true);
    expect(canAddProject(active(5))).toBe(false);
    expect(canAddProject(active(6))).toBe(false);
  });
});

describe('core/domain — calendário', () => {
  it('createResponsibility nasce planejada e importante', () => {
    const r = createResponsibility({ workspaceId: 'ws-1', title: 'ler artigo' });
    expect(r.status).toBe('planejado');
    expect(r.level).toBe('importante');
    expect(r.subtasks).toEqual([]);
  });
});

describe('core/domain — capabilities matrix', () => {
  it('desktop edita documento; mobile só cria/edita (sem deletar)', () => {
    const d = capabilityFor('document', 'desktop')!;
    const m = capabilityFor('document', 'mobile')!;
    expect(d.canDelete).toBe(true);
    expect(m.canDelete).toBe(false);
    expect(d.projection).toBe('rich');
    expect(m.projection).toBe('standard');
  });
  it('projeto no mobile é somente leitura', () => {
    const m = capabilityFor('project', 'mobile')!;
    expect(m.canCreate).toBe(false);
    expect(m.canEdit).toBe(false);
    expect(m.canView).toBe(true);
  });
});
