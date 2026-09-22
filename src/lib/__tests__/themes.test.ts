import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_THEME_ID,
  THEMES,
  THEME_ORDER,
  TOKEN_KEYS,
  applyTheme,
  contrastRatio,
  firstWcagFail,
  getActiveTheme,
  getThemeById,
  initTheme,
  isDarkTheme,
  readThemePreference,
  relativeLuminance,
  removeTheme,
  wcagPairs,
} from '../themes';
import { THEME_PREF_KEY } from '../themes';
import { STORAGE_PREFIX } from '../storage';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.cssText = '';
  delete document.documentElement.dataset.theme;
});

describe('THEMES — inventário', () => {
  it('tem exatamente 6 temas: 3 claros + 3 escuros', () => {
    const all = Object.values(THEMES);
    expect(all).toHaveLength(6);
    expect(all.filter((t) => !t.isDark)).toHaveLength(3);
    expect(all.filter((t) => t.isDark)).toHaveLength(3);
  });

  it('ids únicos e na ordem do picker', () => {
    const ids = Object.values(THEMES).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(THEME_ORDER).toEqual(ids);
    expect(THEME_ORDER.filter((id) => THEMES[id].isDark).length).toBe(3);
  });

  it('cada tema tem todas as chaves do contrato de tokens', () => {
    for (const theme of Object.values(THEMES)) {
      for (const key of TOKEN_KEYS) {
        expect(typeof theme.tokens[key], `${theme.id}.${key}`).toBe('string');
        expect(theme.tokens[key].length, `${theme.id}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('cada tema tem meta chrome válida', () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.chartTheme).toBe(theme.isDark ? 'dark' : 'light');
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
    }
  });

  it('rosa-claro é o default e espelha os valores do index.css atual', () => {
    expect(DEFAULT_THEME_ID).toBe('rosa-claro');
    const t = THEMES['rosa-claro'].tokens;
    expect(t['canvas']).toBe('#FFF9F0');
    expect(t['surface-default']).toBe('#FFFDF8');
    expect(t['ceci-primary']).toBe('#3B3233');
    expect(t['ceci-brand']).toBe('#D4617C');
    expect(t['ceci-brand-strong']).toBe('#AF465F');
    expect(t['ceci-academic']).toBe('#4A879F');
    expect(t['shadow-rgb']).toBe('122, 88, 72');
    expect(THEMES['rosa-claro'].chartTheme).toBe('light');
  });

  it('dark não invertem on-fill de forma ingênua (neon mantém on-brand branco)', () => {
    expect(THEMES['noturno']['tokens']['ceci-on-primary']).toBe('#161214');
    expect(THEMES['neon']['tokens']['ceci-on-brand']).toBe('#FFFFFF');
    expect(THEMES['amanhecer']['tokens']['ceci-brand-strong']).toBe('#B84E2E');
  });
});

describe('applyTheme / removeTheme', () => {
  it('aplica todos os tokens no :root com prefixo --color-', () => {
    applyTheme(THEMES['noturno']);
    const root = document.documentElement;
    for (const key of TOKEN_KEYS) {
      expect(root.style.getPropertyValue(`--color-${key}`)).toBe(THEMES['noturno'].tokens[key]);
    }
  });

  it('aplica color-scheme, data-theme e meta theme-color', () => {
    applyTheme(THEMES['neon']);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
    expect(root.dataset.theme).toBe('neon');
    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#0F0F12');

    applyTheme(THEMES['oceano']);
    expect(root.style.getPropertyValue('color-scheme')).toBe('light');
    expect(root.dataset.theme).toBe('oceano');
  });

  it('trocar de tema sobrescreve os tokens anteriores', () => {
    applyTheme(THEMES['neon']);
    applyTheme(THEMES['rosa-claro']);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-canvas')).toBe('#FFF9F0');
    expect(root.dataset.theme).toBe('rosa-claro');
  });

  it('removeTheme limpa vars, color-scheme, data-theme e devolve o default', () => {
    applyTheme(THEMES['noturno']);
    removeTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-canvas')).toBe('');
    expect(root.style.getPropertyValue('color-scheme')).toBe('');
    expect(root.dataset.theme).toBeUndefined();
    expect(getActiveTheme().id).toBe(DEFAULT_THEME_ID);
  });

  it('getActiveTheme/getThemeById/isDarkTheme', () => {
    applyTheme(THEMES['noturno']);
    expect(getActiveTheme().id).toBe('noturno');
    expect(isDarkTheme('noturno')).toBe(true);
    expect(isDarkTheme('rosa-claro')).toBe(false);
    expect(getThemeById('nao-existe').id).toBe(DEFAULT_THEME_ID);
  });
});

describe('persistência', () => {
  it('readThemePreference lê a preferência salva', () => {
    localStorage.setItem(STORAGE_PREFIX + THEME_PREF_KEY, 'mar-profundo');
    expect(readThemePreference()).toBe('mar-profundo');
  });

  it('readThemePreference degrada para o default quando inválido/ausente', () => {
    expect(readThemePreference()).toBe(DEFAULT_THEME_ID);
    localStorage.setItem(STORAGE_PREFIX + THEME_PREF_KEY, 'hexa');
    expect(readThemePreference()).toBe(DEFAULT_THEME_ID);
  });

  it('initTheme aplica o tema salvo no boot', () => {
    localStorage.setItem(STORAGE_PREFIX + THEME_PREF_KEY, 'oceano');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('oceano');
    expect(document.documentElement.style.getPropertyValue('--color-canvas')).toBe('#F7FAFB');
  });

  it('initTheme sem preferência aplica o default', () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('rosa-claro');
  });
});

describe('contraste WCAG (E.1)', () => {
  it('relativeLuminance/contrastRatio matemática básica', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 1);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#000000', '#000000')).toBe(1);
  });

  it('os 6 temas passam os pares WCAG AA principais (≥ 4.5:1)', () => {
    for (const theme of Object.values(THEMES)) {
      const fail = firstWcagFail(theme);
      expect(fail, `${theme.id}: ${fail?.label} = ${fail?.ratio?.toFixed(2)}`).toBeNull();
    }
  });

  it('wcagPairs expõe os pares de corpo + status', () => {
    const labels = wcagPairs(THEMES['rosa-claro']).map((p) => p.label);
    expect(labels).toContain('on-primary/on-primary-fill');
    expect(labels).toContain('status-success-strong/on-default');
    expect(labels).toContain('status-danger-on/on-fill');
    expect(labels).toContain('status-warning-strong/on-default');
    expect(labels).toHaveLength(12);
  });

  it('os tokens de status existem nos 6 temas', () => {
    for (const theme of Object.values(THEMES)) {
      for (const key of [
        'status-success',
        'status-success-strong',
        'status-success-on',
        'status-danger',
        'status-danger-strong',
        'status-danger-on',
        'status-warning',
        'status-warning-strong',
        'status-warning-on',
      ] as const) {
        expect(theme.tokens[key], `${theme.id}.${key}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('on-brand do amanhecer tem contraste AA sobre brand-strong', () => {
    const ratio = contrastRatio(THEMES['amanhecer'].tokens['ceci-on-brand'], THEMES['amanhecer'].tokens['ceci-brand-strong']);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});