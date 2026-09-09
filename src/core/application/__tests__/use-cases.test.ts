import { describe, it, expect } from 'vitest';
import {
  addRelation,
  acceptSuggestion,
  rejectSuggestion,
  createProjectUseCase,
  createWorkspaceUseCase,
  planResponsibility,
  scheduleEvent,
  createContentBaseUseCase,
  approveChannelVariant,
} from '../use-cases';
import type { Relation, AssociationPolicy, Project, Suggestion, ChannelVariant } from '../../domain';
import { createProject, makeId } from '../../domain';

describe('use-cases — conhecimento', () => {
  const base = {
    workspaceId: 'ws-1',
    sourceId: 'doc-a',
    targetId: 'doc-b',
    kind: 'explicita' as const,
  };

  it('addRelation cria relação e evita duplicata', () => {
    const r1 = addRelation(base, [], []);
    const r2 = addRelation(base, [r1], []);
    expect(r1.id).toBe(r2.id);
  });

  it('addRelation bloqueia por AssociationPolicy', () => {
    const policy: AssociationPolicy = { id: 'asp-1', workspaceId: 'ws-1', rule: 'doc-a->doc-b:explicita', action: 'block', createdAt: '' };
    expect(() => addRelation(base, [], [policy])).toThrow(/bloqueada/);
  });

  it('relação semântica nasce não-aceita (Inbox)', () => {
    const r = addRelation({ ...base, kind: 'semantica' }, [], []);
    expect(r.accepted).toBe(false);
  });

  it('accept/reject alteram status da sugestão', () => {
    const s: Suggestion = { id: 'sgt-1', workspaceId: 'ws-1', type: 'relation', payload: {}, status: 'pending', createdAt: '' };
    expect(acceptSuggestion(s).status).toBe('accepted');
    expect(rejectSuggestion(s).status).toBe('rejected');
  });
});

describe('use-cases — projetos (invariante de limite)', () => {
  function fiveActive(): Project[] {
    return Array.from({ length: 5 }, () => createProject({ workspaceId: 'ws-1', title: 'p' }));
  }
  it('cria projeto quando há vaga', () => {
    const p = createProjectUseCase({ workspaceId: 'ws-1', title: 'TCC' }, []);
    expect(p.status).toBe('ativo');
  });
  it('recusa criação ao atingir 5 ativos', () => {
    expect(() => createProjectUseCase({ workspaceId: 'ws-1', title: 'x' }, fiveActive())).toThrow(/limite/);
  });
});

describe('use-cases — workspace/calendar/marketing', () => {
  it('createWorkspaceUseCase delega para o domínio', () => {
    const ws = createWorkspaceUseCase({ name: 'Profissional', kind: 'profissional' }, []);
    expect(ws.kind).toBe('profissional');
  });
  it('planResponsibility e scheduleEvent geram entidades válidas', () => {
    const r = planResponsibility({ workspaceId: 'ws-1', title: 'escrever', dueDate: '2026-09-01' });
    const e = scheduleEvent({ workspaceId: 'ws-1', title: 'prova', start: '2026-09-01T10:00:00Z', origin: 'faculdade' });
    expect(r.status).toBe('planejado');
    expect(e.id.startsWith('cal-')).toBe(true);
  });
  it('approveChannelVariant aprova apenas a variante', () => {
    const v: ChannelVariant = { id: makeId('cvr'), contentBaseId: 'cbe-1', channel: 'instagram', status: 'rascunho', format: 'carrossel', body: {}, approved: false };
    expect(approveChannelVariant(v).approved).toBe(true);
    expect(approveChannelVariant(v).status).toBe('aprovado');
  });
  it('createContentBaseUseCase cria conteúdo-base', () => {
    const c = createContentBaseUseCase({ ideaId: 'ide-1', message: 'sobre recalque' });
    expect(c.ideaId).toBe('ide-1');
  });
});
