import { useCallback, useEffect, useState } from 'react';
import { useWizardDraft } from './useWizardDraft';

interface UseWizardFormOptions<T extends object> {
  /**
   * Chave do rascunho persistente (`wizard_draft_<key>`). Quando definida e
   * `editing` é falso, os valores são salvos a cada mudança e restaurados ao
   * reabrir — mesmo padrão do InternshipWizard (§5.1). Omita para wizards sem
   * rascunho (comportamento idêntico a vários `useState`).
   */
  draftKey?: string;
  /** Valores iniciais (já com `editing` aplicado pelo chamador). */
  initial: T;
  /** Editando item existente: nunca lê nem escreve rascunho. */
  editing?: boolean;
  /** Deriva `isDirty` para a confirmação de descarte do WizardScaffold. */
  isDirty?: (values: T) => boolean;
}

/**
 * Estado consolidado de wizard: um objeto `values` + `patch` parcial no lugar
 * de N `useState` por campo, mais `step`/`setStep`, rascunho opcional e
 * `isDirty` derivado. O comportamento sem `draftKey` é idêntico aos `useState`
 * anteriores — a migração é mecânica e sem mudança visual.
 */
export function useWizardForm<T extends object>({
  draftKey,
  initial,
  editing = false,
  isDirty,
}: UseWizardFormOptions<T>) {
  const draft = useWizardDraft<T>(draftKey ?? 'transient');
  const [values, setValues] = useState<T>(() => {
    if (!draftKey || editing) return initial;
    const saved = draft.load();
    return saved ? { ...initial, ...saved } : initial;
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (draftKey && !editing) draft.save(values);
    // draft.save é estável por storageKey; values/draftKey/editing dirigem o efeito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, draftKey, editing]);

  const patch = useCallback((p: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...p }));
  }, []);

  const clearDraft = useCallback(() => {
    if (draftKey && !editing) draft.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, editing]);

  return {
    values,
    patch,
    setValues,
    step,
    setStep,
    clearDraft,
    isDirty: isDirty ? isDirty(values) : false,
  };
}
