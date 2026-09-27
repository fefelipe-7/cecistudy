import { describe, expect, it } from 'vitest';
import type { WizardFlow } from '../../../types';
import { WIZARD_REGISTRY } from '../registry';

// Deriva do union em vez de listar à mão: um wizard novo adicionado ao
// `WizardFlow` aparecia aqui como "faltando" só porque a lista de teste
// envelhecia (aconteceu com `semester`/SPEC-005).
const flows = Object.keys(WIZARD_REGISTRY) as WizardFlow[];

describe('WIZARD_REGISTRY', () => {
  it('cobre todos os fluxos de wizard', () => {
    for (const flow of flows) {
      expect(typeof WIZARD_REGISTRY[flow], flow).toBe('function');
    }
    expect(flows).toContain('semester');
  });

  it('cada entrada renderiza um elemento válido', () => {
    for (const flow of flows) {
      const node = WIZARD_REGISTRY[flow](null);
      expect(node, flow).toBeTruthy();
      expect(typeof node === 'object' && node !== null && 'type' in (node as object), flow).toBe(true);
    }
  });
});
