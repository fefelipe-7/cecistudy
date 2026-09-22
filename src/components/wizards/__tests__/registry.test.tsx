import { describe, expect, it } from 'vitest';
import type { WizardFlow } from '../../../types';
import { WIZARD_REGISTRY } from '../registry';

const flows: WizardFlow[] = [
  'task', 'exam', 'task-exam', 'course', 'reading', 'flashcard',
  'internship', 'session', 'author', 'concept', 'material',
];

describe('WIZARD_REGISTRY', () => {
  it('cobre todos os fluxos de wizard', () => {
    for (const flow of flows) {
      expect(typeof WIZARD_REGISTRY[flow], flow).toBe('function');
    }
    expect(Object.keys(WIZARD_REGISTRY)).toHaveLength(flows.length);
  });

  it('cada entrada renderiza um elemento válido', () => {
    for (const flow of flows) {
      const node = WIZARD_REGISTRY[flow](null);
      expect(node, flow).toBeTruthy();
      expect(typeof node === 'object' && node !== null && 'type' in (node as object), flow).toBe(true);
    }
  });
});
