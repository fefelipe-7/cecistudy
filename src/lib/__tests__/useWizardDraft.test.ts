import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardDraft } from '../useWizardDraft';

describe('useWizardDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva e recarrega um rascunho', () => {
    const a = renderHook(() => useWizardDraft<{ title: string }>('teste'));
    act(() => a.result.current.save({ title: 'rascunho da Ceci' }));

    const b = renderHook(() => useWizardDraft<{ title: string }>('teste'));
    expect(b.result.current.load()).toEqual({ title: 'rascunho da Ceci' });
  });

  it('usa chaves independentes por wizard', () => {
    const a = renderHook(() => useWizardDraft<{ x: number }>('um'));
    act(() => a.result.current.save({ x: 1 }));

    const b = renderHook(() => useWizardDraft<{ y: number }>('dois'));
    expect(b.result.current.load()).toBeNull();
  });

  it('clear remove o rascunho', () => {
    const a = renderHook(() => useWizardDraft<{ t: string }>('limpar'));
    act(() => a.result.current.save({ t: 'x' }));
    act(() => a.result.current.clear());
    expect(a.result.current.load()).toBeNull();
  });
});
