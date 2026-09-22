import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardForm } from '../useWizardForm';

interface Vals { title: string; minutes: string; courseId: string }
const defaults: Vals = { title: '', minutes: '25', courseId: '' };

describe('useWizardForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('expõe valores iniciais e passo zero', () => {
    const { result } = renderHook(() => useWizardForm({ initial: defaults }));
    expect(result.current.values).toEqual(defaults);
    expect(result.current.step).toBe(0);
    expect(result.current.isDirty).toBe(false);
  });

  it('patch mescla parcial sem perder os outros campos', () => {
    const { result } = renderHook(() => useWizardForm({ initial: defaults }));
    act(() => result.current.patch({ title: 'revisar semiologia' }));
    expect(result.current.values).toEqual({ title: 'revisar semiologia', minutes: '25', courseId: '' });
  });

  it('setStep navega entre passos', () => {
    const { result } = renderHook(() => useWizardForm({ initial: defaults }));
    act(() => result.current.setStep(2));
    expect(result.current.step).toBe(2);
  });

  it('deriva isDirty pelo callback', () => {
    const { result } = renderHook(() =>
      useWizardForm({ initial: defaults, isDirty: (v) => v.title.trim().length > 0 })
    );
    expect(result.current.isDirty).toBe(false);
    act(() => result.current.patch({ title: 'algo escrito' }));
    expect(result.current.isDirty).toBe(true);
  });

  it('persiste o rascunho com draftKey e restaura ao reabrir', () => {
    const a = renderHook(() => useWizardForm({ draftKey: 'sessao-teste', initial: defaults }));
    act(() => a.result.current.patch({ title: 'foco de hoje', minutes: '50' }));

    const b = renderHook(() => useWizardForm({ draftKey: 'sessao-teste', initial: defaults }));
    expect(b.result.current.values).toEqual({ title: 'foco de hoje', minutes: '50', courseId: '' });
  });

  it('editing ignora o rascunho na leitura e na escrita', () => {
    const seed = renderHook(() => useWizardForm({ draftKey: 'sessao-edit', initial: defaults }));
    act(() => seed.result.current.patch({ title: 'rascunho antigo' }));

    const editingInitial = { title: 'sessão salva', minutes: '30', courseId: 'c1' };
    const { result } = renderHook(() =>
      useWizardForm({ draftKey: 'sessao-edit', initial: editingInitial, editing: true })
    );
    expect(result.current.values).toEqual(editingInitial);

    act(() => result.current.patch({ minutes: '45' }));
    // o rascunho antigo segue intacto (edição nunca escreve)
    const fresh = renderHook(() => useWizardForm({ draftKey: 'sessao-edit', initial: defaults }));
    expect(fresh.result.current.values.title).toBe('rascunho antigo');
  });

  it('clearDraft limpa o rascunho', () => {
    const { result } = renderHook(() => useWizardForm({ draftKey: 'sessao-limpar', initial: defaults }));
    act(() => result.current.patch({ title: 'temporário' }));
    act(() => result.current.clearDraft());

    const fresh = renderHook(() => useWizardForm({ draftKey: 'sessao-limpar', initial: defaults }));
    expect(fresh.result.current.values).toEqual(defaults);
  });

  it('sem draftKey não toca o storage', () => {
    const { result } = renderHook(() => useWizardForm({ initial: defaults }));
    act(() => result.current.patch({ title: 'só memória' }));
    act(() => result.current.clearDraft());
    expect(localStorage.length).toBe(0);
  });
});
