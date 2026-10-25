/**
 * Preferência de movimento (SPEC-M-027 D9).
 *
 * `sistema` delega ao `prefers-reduced-motion`; `reduzido`/`completo` são
 * escolha explícita e **vencem** o sistema. É o caminho garantido no WebView
 * Android, onde o sinal do sistema não é confiável.
 */
import { describe, expect, it } from 'vitest';
import {
  MOTION_PREF_OPTIONS,
  motionPrefLabel,
  motionPrefOverride,
} from '../../motion/preference';

describe('preferência de movimento', () => {
  it('sistema delega; reduzido e completo vencem o sistema', () => {
    expect(motionPrefOverride('sistema')).toBeUndefined();
    expect(motionPrefOverride('reduzido')).toBe(true);
    expect(motionPrefOverride('completo')).toBe(false);
  });

  it('toda opção tem rótulo, e o rótulo do valor atual vem dela', () => {
    expect(MOTION_PREF_OPTIONS).toHaveLength(3);
    for (const { value, label } of MOTION_PREF_OPTIONS) {
      expect(label).toBeTruthy();
      expect(motionPrefLabel(value)).toBe(label);
    }
  });
});
