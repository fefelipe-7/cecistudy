/**
 * Sistema de Temas — TEM-001 (spec: specs/TEM-001-sistema-de-temas.md).
 *
 * Trocamos tokens semânticos no `:root` via CSS variables (setProperty): os
 * utilitários Tailwind (`bg-surface-rose`, `text-ceci-primary`, …) resolvem a
 * cor corrente automaticamente (Tailwind v4 emite `var(--color-*)`). Além das
 * vars, `applyTheme` ajusta `color-scheme`, `data-theme` (hook p/ charts/branches
 * CSS) e o `meta[name="theme-color"]`. A status bar nativa fica em `native.ts`
 * (estes módulos são puros DOM — seguros em vitest/jsdom e no boot web).
 */
import { storage } from './storage';

export type ThemeId =
  | 'rosa-claro'
  | 'oceano'
  | 'amanhecer'
  | 'noturno'
  | 'mar-profundo'
  | 'neon';

export type Scheme = 'light' | 'dark';

export interface ThemeTokens {
  canvas: string;
  'surface-default': string;
  'surface-subtle': string;
  'surface-muted': string;
  'surface-rose': string;
  'surface-blue': string;
  'surface-input': string;
  'surface-warm': string;
  'canvas-glow-rose': string;
  'canvas-glow-amber': string;
  'ceci-primary': string;
  'ceci-secondary': string;
  'ceci-tertiary': string;
  'ceci-muted': string;
  'ceci-faded': string;
  'ceci-ink': string;
  'ceci-primary-hover': string;
  'ceci-text-soft': string;
  'ceci-on-primary': string;
  'ceci-on-brand': string;
  'ceci-on-academic': string;
  'ceci-brand': string;
  'ceci-brand-strong': string;
  'ceci-brand-soft': string;
  'ceci-brand-hover': string;
  'ceci-academic': string;
  'ceci-academic-strong': string;
  'ceci-border-subtle': string;
  'ceci-border-default': string;
  'ceci-border-strong': string;
  'ceci-border-brand': string;
  'ceci-border-academic': string;
  'shadow-rgb': string;
  'shadow-brand-rgb': string;
  'glass-hairline': string;
  'glass-pill-start': string;
  'glass-pill-end': string;
  'glass-pill-border': string;
  'status-success': string;
  'status-success-strong': string;
  'status-success-on': string;
  'status-danger': string;
  'status-danger-strong': string;
  'status-danger-on': string;
  'status-warning': string;
  'status-warning-strong': string;
  'status-warning-on': string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  isDark: boolean;
  chartTheme: 'light' | 'dark';
  themeColor: string;
  tokens: ThemeTokens;
}

/** Chave de persistência da preferência de tema (pref de app, não dado de usuário). */
export const THEME_PREF_KEY = 'themePref';

export const DEFAULT_THEME_ID: ThemeId = 'rosa-claro';

/** Chaves de `ThemeTokens` na ordem de aplicação (mapeiam 1:1 para `--color-*`). */
export const TOKEN_KEYS = [
  'canvas',
  'surface-default',
  'surface-subtle',
  'surface-muted',
  'surface-rose',
  'surface-blue',
  'surface-input',
  'surface-warm',
  'canvas-glow-rose',
  'canvas-glow-amber',
  'ceci-primary',
  'ceci-secondary',
  'ceci-tertiary',
  'ceci-muted',
  'ceci-faded',
  'ceci-ink',
  'ceci-primary-hover',
  'ceci-text-soft',
  'ceci-on-primary',
  'ceci-on-brand',
  'ceci-on-academic',
  'ceci-brand',
  'ceci-brand-strong',
  'ceci-brand-soft',
  'ceci-brand-hover',
  'ceci-academic',
  'ceci-academic-strong',
  'ceci-border-subtle',
  'ceci-border-default',
  'ceci-border-strong',
  'ceci-border-brand',
  'ceci-border-academic',
  'shadow-rgb',
  'shadow-brand-rgb',
  'glass-hairline',
  'glass-pill-start',
  'glass-pill-end',
  'glass-pill-border',
  'status-success',
  'status-success-strong',
  'status-success-on',
  'status-danger',
  'status-danger-strong',
  'status-danger-on',
  'status-warning',
  'status-warning-strong',
  'status-warning-on',
] as const;

export type TokenKey = (typeof TOKEN_KEYS)[number];

export const THEMES: Record<ThemeId, Theme> = {
  'rosa-claro': {
    id: 'rosa-claro',
    label: 'cantinho',
    emoji: '🌷',
    description: 'o clima de sempre — cozy academia, luz de abajur e rosinha. (default)',
    isDark: false,
    chartTheme: 'light',
    themeColor: '#FFEAF0',
    tokens: {
      canvas: '#FFF9F0',
      'surface-default': '#FFFDF8',
      'surface-subtle': '#FFF3E7',
      'surface-muted': '#F7F1EA',
      'surface-rose': '#FFEFF3',
      'surface-blue': '#F1F7FA',
      'surface-input': '#FBF5EF',
      'surface-warm': '#FFF6E9',
      'canvas-glow-rose': '#FFE9E6',
      'canvas-glow-amber': '#FFE6C4',
      'ceci-primary': '#3B3233',
      'ceci-secondary': '#6B5F5E',
      'ceci-tertiary': '#8E7F7B',
      'ceci-muted': '#A99A94',
      'ceci-faded': '#BEB4B6',
      'ceci-ink': '#282022',
      'ceci-primary-hover': '#2D2728',
      'ceci-text-soft': '#524B4D',
      'ceci-on-primary': '#FFFFFF',
      'ceci-on-brand': '#FFFFFF',
      'ceci-on-academic': '#FFFFFF',
      'ceci-brand': '#D4617C',
      'ceci-brand-strong': '#AF465F',
      'ceci-brand-soft': '#EA718F',
      'ceci-brand-hover': '#A03B52',
      'ceci-academic': '#4A879F',
      'ceci-academic-strong': '#396D82',
      'ceci-border-subtle': '#F0E6DD',
      'ceci-border-default': '#E7DACF',
      'ceci-border-strong': '#D8C7BA',
      'ceci-border-brand': '#FFD0DB',
      'ceci-border-academic': '#CEE7F0',
      'shadow-rgb': '122, 88, 72',
      'shadow-brand-rgb': '175, 70, 95',
      'glass-hairline': 'rgba(255,255,255,0.50)',
      'glass-pill-start': 'rgba(255,255,255,0.90)',
      'glass-pill-end': 'rgba(255,255,255,0.50)',
      'glass-pill-border': 'rgba(255,255,255,0.70)',
      'status-success': '#427E5B',
      'status-success-strong': '#2D6A4F',
      'status-success-on': '#FFFFFF',
      'status-danger': '#B2554D',
      'status-danger-strong': '#A8514B',
      'status-danger-on': '#FFFFFF',
      'status-warning': '#8A6524',
      'status-warning-strong': '#725016',
      'status-warning-on': '#FFFFFF',
    },
  },
  oceano: {
    id: 'oceano',
    label: 'calmaria azul',
    emoji: '🌊',
    description: 'calma, profundidade e erudição fluida — teal-petróleo.',
    isDark: false,
    chartTheme: 'light',
    themeColor: '#E3F0F6',
    tokens: {
      canvas: '#F7FAFB',
      'surface-default': '#FFFFFF',
      'surface-subtle': '#F2F7F9',
      'surface-muted': '#F0F4F6',
      'surface-rose': '#EBF4F8',
      'surface-blue': '#E3F0F6',
      'surface-input': '#F6FAFB',
      'surface-warm': '#EFF5F4',
      'canvas-glow-rose': '#E3F1F7',
      'canvas-glow-amber': '#E3F1EE',
      'ceci-primary': '#243440',
      'ceci-secondary': '#556A78',
      'ceci-tertiary': '#7A8E9B',
      'ceci-muted': '#9BA6AD',
      'ceci-faded': '#BCC4C9',
      'ceci-ink': '#18242C',
      'ceci-primary-hover': '#1C2830',
      'ceci-text-soft': '#4E5B67',
      'ceci-on-primary': '#FFFFFF',
      'ceci-on-brand': '#FFFFFF',
      'ceci-on-academic': '#FFFFFF',
      'ceci-brand': '#3C8EA0',
      'ceci-brand-strong': '#2A7587',
      'ceci-brand-soft': '#7DB8C8',
      'ceci-brand-hover': '#236372',
      'ceci-academic': '#4A879F',
      'ceci-academic-strong': '#396D82',
      'ceci-border-subtle': '#E4ECF0',
      'ceci-border-default': '#D5E2E8',
      'ceci-border-strong': '#C2D4DC',
      'ceci-border-brand': 'rgba(60,142,160,0.22)',
      'ceci-border-academic': 'rgba(74,135,159,0.22)',
      'shadow-rgb': '36, 52, 64',
      'shadow-brand-rgb': '42, 117, 135',
      'glass-hairline': 'rgba(255,255,255,0.50)',
      'glass-pill-start': 'rgba(255,255,255,0.90)',
      'glass-pill-end': 'rgba(255,255,255,0.50)',
      'glass-pill-border': 'rgba(255,255,255,0.70)',
      'status-success': '#427E5B',
      'status-success-strong': '#2D6A4F',
      'status-success-on': '#FFFFFF',
      'status-danger': '#B2554D',
      'status-danger-strong': '#A8514B',
      'status-danger-on': '#FFFFFF',
      'status-warning': '#8A6524',
      'status-warning-strong': '#725016',
      'status-warning-on': '#FFFFFF',
    },
  },
  amanhecer: {
    id: 'amanhecer',
    label: 'energia coral',
    emoji: '🌅',
    description: 'quente e otimista — coral/terracota, energia nova.',
    isDark: false,
    chartTheme: 'light',
    themeColor: '#FFEDE3',
    tokens: {
      canvas: '#FFFAF5',
      'surface-default': '#FFFFFF',
      'surface-subtle': '#FFF7EE',
      'surface-muted': '#FAF5ED',
      'surface-rose': '#FFEDE3',
      'surface-blue': '#F2F7FB',
      'surface-input': '#FBF5EE',
      'surface-warm': '#FFF3E6',
      'canvas-glow-rose': '#FFE0D4',
      'canvas-glow-amber': '#FFE6C4',
      'ceci-primary': '#3D2E28',
      'ceci-secondary': '#6B5A52',
      'ceci-tertiary': '#917F77',
      'ceci-muted': '#ADA094',
      'ceci-faded': '#C4B7B0',
      'ceci-ink': '#271C18',
      'ceci-primary-hover': '#33231C',
      'ceci-text-soft': '#55463E',
      'ceci-on-primary': '#FFFFFF',
      'ceci-on-brand': '#FFFFFF',
      'ceci-on-academic': '#FFFFFF',
      'ceci-brand': '#E8785A',
      'ceci-brand-strong': '#B84E2E',
      'ceci-brand-soft': '#F2A48D',
      'ceci-brand-hover': '#9E3E22',
      'ceci-academic': '#5A8FA8',
      'ceci-academic-strong': '#407090',
      'ceci-border-subtle': '#F2E8DF',
      'ceci-border-default': '#E9D8C8',
      'ceci-border-strong': '#DCC8B5',
      'ceci-border-brand': 'rgba(232,120,90,0.22)',
      'ceci-border-academic': 'rgba(90,143,168,0.25)',
      'shadow-rgb': '60, 46, 40',
      'shadow-brand-rgb': '184, 78, 46',
      'glass-hairline': 'rgba(255,255,255,0.50)',
      'glass-pill-start': 'rgba(255,255,255,0.90)',
      'glass-pill-end': 'rgba(255,255,255,0.50)',
      'glass-pill-border': 'rgba(255,255,255,0.70)',
      'status-success': '#427E5B',
      'status-success-strong': '#2D6A4F',
      'status-success-on': '#FFFFFF',
      'status-danger': '#B2554D',
      'status-danger-strong': '#A8514B',
      'status-danger-on': '#FFFFFF',
      'status-warning': '#8A6524',
      'status-warning-strong': '#725016',
      'status-warning-on': '#FFFFFF',
    },
  },
  noturno: {
    id: 'noturno',
    label: 'cantinho aceso',
    emoji: '🌙',
    description: 'dark suave, brand rosa sem cansar — legível de noite.',
    isDark: true,
    chartTheme: 'dark',
    themeColor: '#161214',
    tokens: {
      canvas: '#161214',
      'surface-default': '#221E20',
      'surface-subtle': '#2A2628',
      'surface-muted': '#1E1B1C',
      'surface-rose': '#2B2024',
      'surface-blue': '#1F262C',
      'surface-input': '#262123',
      'surface-warm': '#262021',
      'canvas-glow-rose': 'rgba(232,145,156,0.05)',
      'canvas-glow-amber': 'rgba(255,200,180,0.03)',
      'ceci-primary': '#E8DFDB',
      'ceci-secondary': '#B5ADAB',
      'ceci-tertiary': '#8A8385',
      'ceci-muted': '#6D6668',
      'ceci-faded': '#4E484A',
      'ceci-ink': '#F5F0EC',
      'ceci-primary-hover': '#D9D0CC',
      'ceci-text-soft': '#C6BFBC',
      'ceci-on-primary': '#161214',
      'ceci-on-brand': '#161214',
      'ceci-on-academic': '#161214',
      'ceci-brand': '#E8919C',
      'ceci-brand-strong': '#D4728A',
      'ceci-brand-soft': '#F2B8C4',
      'ceci-brand-hover': '#C25E76',
      'ceci-academic': '#8FC5D4',
      'ceci-academic-strong': '#6BAABB',
      'ceci-border-subtle': '#2E2A2C',
      'ceci-border-default': '#3A3538',
      'ceci-border-strong': '#4A4548',
      'ceci-border-brand': 'rgba(232,145,156,0.25)',
      'ceci-border-academic': 'rgba(143,197,212,0.25)',
      'shadow-rgb': '0, 0, 0',
      'shadow-brand-rgb': '212, 114, 138',
      'glass-hairline': 'rgba(255,255,255,0.06)',
      'glass-pill-start': 'rgba(255,255,255,0.16)',
      'glass-pill-end': 'rgba(255,255,255,0.05)',
      'glass-pill-border': 'rgba(255,255,255,0.12)',
      'status-success': '#5FA87C',
      'status-success-strong': '#8FD3A8',
      'status-success-on': '#161214',
      'status-danger': '#D9756D',
      'status-danger-strong': '#F0A29A',
      'status-danger-on': '#161214',
      'status-warning': '#D9A23C',
      'status-warning-strong': '#EFCB7E',
      'status-warning-on': '#161214',
    },
  },
  'mar-profundo': {
    id: 'mar-profundo',
    label: 'profundeza azul',
    emoji: '🐋',
    description: 'dark oceânico — calma profunda, teal/azul petróleo.',
    isDark: true,
    chartTheme: 'dark',
    themeColor: '#10161B',
    tokens: {
      canvas: '#10161B',
      'surface-default': '#1A242B',
      'surface-subtle': '#212E36',
      'surface-muted': '#161F25',
      'surface-rose': '#1C2B31',
      'surface-blue': '#1E2A33',
      'surface-input': '#202C33',
      'surface-warm': '#212B31',
      'canvas-glow-rose': 'rgba(95,179,196,0.05)',
      'canvas-glow-amber': 'rgba(127,187,208,0.04)',
      'ceci-primary': '#E2EBEF',
      'ceci-secondary': '#ACBEC7',
      'ceci-tertiary': '#8297A1',
      'ceci-muted': '#647882',
      'ceci-faded': '#4A5B64',
      'ceci-ink': '#F2F7FA',
      'ceci-primary-hover': '#D3DEE4',
      'ceci-text-soft': '#C2D1D9',
      'ceci-on-primary': '#10161B',
      'ceci-on-brand': '#10161B',
      'ceci-on-academic': '#10161B',
      'ceci-brand': '#5FB3C4',
      'ceci-brand-strong': '#4A9CAE',
      'ceci-brand-soft': '#8CCDD9',
      'ceci-brand-hover': '#3B8496',
      'ceci-academic': '#7FBBD0',
      'ceci-academic-strong': '#5FA3BB',
      'ceci-border-subtle': '#232F37',
      'ceci-border-default': '#2E3C46',
      'ceci-border-strong': '#3F505B',
      'ceci-border-brand': 'rgba(95,179,196,0.25)',
      'ceci-border-academic': 'rgba(127,187,208,0.25)',
      'shadow-rgb': '0, 0, 0',
      'shadow-brand-rgb': '74, 156, 174',
      'glass-hairline': 'rgba(255,255,255,0.06)',
      'glass-pill-start': 'rgba(255,255,255,0.16)',
      'glass-pill-end': 'rgba(255,255,255,0.05)',
      'glass-pill-border': 'rgba(255,255,255,0.12)',
      'status-success': '#5FA87C',
      'status-success-strong': '#8FD3A8',
      'status-success-on': '#10161B',
      'status-danger': '#D9756D',
      'status-danger-strong': '#F0A29A',
      'status-danger-on': '#10161B',
      'status-warning': '#D9A23C',
      'status-warning-strong': '#EFCB7E',
      'status-warning-on': '#10161B',
    },
  },
  neon: {
    id: 'neon',
    label: 'néon vibrante',
    emoji: '⚡',
    description: 'urbano e sintético — grafite, magenta e ciano-elétrico.',
    isDark: true,
    chartTheme: 'dark',
    themeColor: '#0F0F12',
    tokens: {
      canvas: '#0F0F12',
      'surface-default': '#1A1A20',
      'surface-subtle': '#22222B',
      'surface-muted': '#16161C',
      'surface-rose': '#241B24',
      'surface-blue': '#1C2230',
      'surface-input': '#201F28',
      'surface-warm': '#232029',
      'canvas-glow-rose': 'rgba(233,59,140,0.06)',
      'canvas-glow-amber': 'rgba(0,212,170,0.05)',
      'ceci-primary': '#E6E0F0',
      'ceci-secondary': '#B0A8C0',
      'ceci-tertiary': '#86809A',
      'ceci-muted': '#68627A',
      'ceci-faded': '#504A5C',
      'ceci-ink': '#F4F0FF',
      'ceci-primary-hover': '#D8D1E8',
      'ceci-text-soft': '#C8C2DA',
      'ceci-on-primary': '#0F0F12',
      'ceci-on-brand': '#FFFFFF',
      'ceci-on-academic': '#0F0F12',
      'ceci-brand': '#E93B8C',
      'ceci-brand-strong': '#D42A7C',
      'ceci-brand-soft': '#F27AAA',
      'ceci-brand-hover': '#B8206A',
      'ceci-academic': '#00D4AA',
      'ceci-academic-strong': '#00B894',
      'ceci-border-subtle': '#26252E',
      'ceci-border-default': '#33313C',
      'ceci-border-strong': '#44424E',
      'ceci-border-brand': 'rgba(233,59,140,0.30)',
      'ceci-border-academic': 'rgba(0,212,170,0.25)',
      'shadow-rgb': '0, 0, 0',
      'shadow-brand-rgb': '212, 42, 124',
      'glass-hairline': 'rgba(255,255,255,0.08)',
      'glass-pill-start': 'rgba(255,255,255,0.18)',
      'glass-pill-end': 'rgba(255,255,255,0.05)',
      'glass-pill-border': 'rgba(255,255,255,0.14)',
      'status-success': '#3FC98A',
      'status-success-strong': '#7BF0B8',
      'status-success-on': '#0F0F12',
      'status-danger': '#F0607E',
      'status-danger-strong': '#FF9EB2',
      'status-danger-on': '#0F0F12',
      'status-warning': '#E8C34D',
      'status-warning-strong': '#F7DE8E',
      'status-warning-on': '#0F0F12',
    },
  },
};

/** Ordem de exibição no picker (3 claras + 3 escuras). */
export const THEME_ORDER: ThemeId[] = ['rosa-claro', 'oceano', 'amanhecer', 'noturno', 'mar-profundo', 'neon'];

let activeThemeId: ThemeId = DEFAULT_THEME_ID;

export function getActiveTheme(): Theme {
  return THEMES[activeThemeId];
}

export function getThemeById(id: string): Theme {
  return THEMES[id as ThemeId] ?? THEMES[DEFAULT_THEME_ID];
}

export function isDarkTheme(id: string | ThemeId): boolean {
  return (THEMES[id as ThemeId] ?? THEMES[DEFAULT_THEME_ID]).isDark;
}

function setMetaThemeColor(color: string): void {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

const TRANSITION_CLASS = 'theme-transitioning';
const TRANSITION_MS = 500;

function beginTransition(root: HTMLElement): void {
  root.classList.add(TRANSITION_CLASS);
  window.setTimeout(() => {
    root.classList.remove(TRANSITION_CLASS);
  }, TRANSITION_MS);
}

export interface ApplyThemeOptions {
  /** Ativa a transição suave de troca (opt-in; nunca no boot). */
  transition?: boolean;
}

/** Aplica um tema: vars no `:root` + `color-scheme` + `data-theme` + meta theme-color. */
export function applyTheme(theme: Theme, options?: ApplyThemeOptions): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (options?.transition) beginTransition(root);
    for (const key of TOKEN_KEYS) {
      root.style.setProperty(`--color-${key}`, theme.tokens[key]);
    }
    root.style.setProperty('color-scheme', theme.isDark ? 'dark' : 'light');
    root.dataset.theme = theme.id;
    setMetaThemeColor(theme.themeColor);
  }
  activeThemeId = theme.id;
}

/** Reseta para os defaults do `@theme` (`rosa-claro`). */
export function removeTheme(): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    for (const key of TOKEN_KEYS) {
      root.style.removeProperty(`--color-${key}`);
    }
    root.style.removeProperty('color-scheme');
    delete root.dataset.theme;
  }
  activeThemeId = DEFAULT_THEME_ID;
}

/* ---------- Boot (anti-flash) ---------- */

/** Tema da preferência salva (web); no nativo a hidratação é assíncrona. */
export function readThemePreference(): ThemeId {
  const raw = storage.getSync(THEME_PREF_KEY);
  return raw && raw in THEMES ? (raw as ThemeId) : DEFAULT_THEME_ID;
}

/** Aplica o tema salvo antes do primeiro render. */
export function initTheme(): void {
  applyTheme(getThemeById(readThemePreference()));
}

/* ---------- Contraste (p/ testes E.1) ---------- */

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Contraste WCAG (1–21). Aceita hex `#rrggbb` de ambos os lados. */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pares de contraste que precisam de WCAG AA (≥ 4.5:1) em todos os temas. */
export function wcagPairs(theme: Theme): Array<{ label: string; a: string; b: string }> {
  const t = theme.tokens;
  return [
    { label: 'primary/on-canvas', a: t['ceci-primary'], b: t['canvas'] },
    { label: 'primary/on-default', a: t['ceci-primary'], b: t['surface-default'] },
    { label: 'primary/on-subtle', a: t['ceci-primary'], b: t['surface-subtle'] },
    { label: 'secondary/on-canvas', a: t['ceci-secondary'], b: t['canvas'] },
    { label: 'secondary/on-default', a: t['ceci-secondary'], b: t['surface-default'] },
    { label: 'on-primary/on-primary-fill', a: t['ceci-on-primary'], b: t['ceci-primary'] },
    { label: 'status-success-strong/on-default', a: t['status-success-strong'], b: t['surface-default'] },
    { label: 'status-success-on/on-fill', a: t['status-success-on'], b: t['status-success'] },
    { label: 'status-danger-strong/on-default', a: t['status-danger-strong'], b: t['surface-default'] },
    { label: 'status-danger-on/on-fill', a: t['status-danger-on'], b: t['status-danger'] },
    { label: 'status-warning-strong/on-default', a: t['status-warning-strong'], b: t['surface-default'] },
    { label: 'status-warning-on/on-fill', a: t['status-warning-on'], b: t['status-warning'] },
  ];
}

/** Retorna o primeiro par WCAG que falha (ou null se todos ≥ 4.5). */
export function firstWcagFail(theme: Theme): { label: string; ratio: number } | null {
  for (const pair of wcagPairs(theme)) {
    if (!pair.a.startsWith('#')) continue;
    const ratio = contrastRatio(pair.a, pair.b);
    if (ratio < 4.5) return { label: pair.label, ratio };
  }
  return null;
}