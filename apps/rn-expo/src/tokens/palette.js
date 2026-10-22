/**
 * palette.js — a ponte entre o `@theme` do index.css (app web) e o RN.
 *
 * Este e o arquivo que o `tailwind.config.js` carrega, e por isso ele tem que
 * ser JS puro e CommonJS: o Tailwind roda em Node e nao resolveria `require`
 * de imagem nem TypeScript. O TypeScript reexporta daqui (`src/tokens/index.ts`),
 * entao existe **uma** fonte da verdade (SPEC-015 D1/D3).
 *
 * Fonte: `src/index.css:17-246` (@theme + primitivas).
 */

/* ── primitivas de marca ─────────────────────────────────────────────────── */
const rose = {
  50: '#FFF5F7', 100: '#FFE9EE', 200: '#FFD3DD', 300: '#FFB8C7', 400: '#F596AA',
  500: '#E97891', 600: '#D85F79', 700: '#B94862', 800: '#963B51', 900: '#71303F',
};
const blue = {
  50: '#F3F9FC', 100: '#E6F2F7', 200: '#CEE7F0', 300: '#ADD4E2', 400: '#83BCD0',
  500: '#609FB8', 600: '#4A879F', 700: '#396D82', 800: '#2F596A', 900: '#284955',
};
const cream = {
  50: '#FFFCF8', 100: '#FFF8F1', 200: '#FFF1E5', 300: '#F9E7D5', 400: '#EFD5BE', 500: '#DEC0A4',
};
const beige = {
  50: '#FAF8F5', 100: '#F3EEE8', 200: '#E8DFD5', 300: '#D9CDC0', 400: '#C6B6A5',
  500: '#AD9986', 600: '#927D6B', 700: '#756354',
};
const green = {
  50: '#F2FAF5', 100: '#DDF3E5', 200: '#C2E8D0', 300: '#A8D8B9', 400: '#8BC7A2',
  500: '#72B98D', 600: '#5A9F76', 700: '#43805B', 800: '#356647', 900: '#2A513A',
};
const yellow = {
  50: '#FFF9ED', 100: '#FFF0CC', 200: '#FCE4A8', 300: '#F3D48B', 400: '#E8C36D',
  500: '#DCAF55', 600: '#BD913C', 700: '#96702B', 800: '#765824', 900: '#5E471F',
};
const red = {
  50: '#FFF5F4', 100: '#FFE2DF', 200: '#FACCC8', 300: '#F1AAA4', 400: '#E89189',
  500: '#D97A72', 600: '#C5665E', 700: '#A8514B', 800: '#843F3A', 900: '#68332F',
};

const primitives = { rose, blue, cream, beige, green, yellow, red };

/* ── tokens semanticos ───────────────────────────────────────────────────── */
const canvas = '#FFF9F0';
const surface = {
  DEFAULT: '#FFFDF8',
  // Alias para ClassNames: o Tailwind mapeia a chave `DEFAULT` para a classe
  // base (`bg-surface`) e ignora `*-default`. Sem o alias, `bg-surface-default`
  // e `border-border-default` não compilam para nada — botão transparente,
  // sem borda (achado do gate de classe da revisão visual).
  default: '#FFFDF8',
  subtle: '#FFF3E7',
  muted: '#F7F1EA',
  rose: '#FFEFF3',
  blue: '#F1F7FA',
  input: '#FBF5EF',
  warm: '#FFF6E9',
  glass: 'rgba(255,253,248,0.72)',
  glassStrong: 'rgba(255,253,248,0.88)',
};
const ceci = {
  primary: '#3B3233',
  'primary-hover': '#2D2728',
  secondary: '#6B5F5E',
  tertiary: '#8E7F7B',
  muted: '#A99A94',
  faded: '#BEB4B6',
  ink: '#282022',
  'text-soft': '#524B4D',
  brand: '#D4617C',
  'brand-strong': '#AF465F',
  'brand-soft': '#EA718F',
  'brand-hover': '#A03B52',
  academic: '#4A879F',
  'academic-strong': '#396D82',
  // texto sobre fundo escuro. `on-primary` e o unico hex que o componente
  // usava "por costume" em texto branco — agora ele tem nome.
  'on-primary': '#FFFFFF',
  'on-brand': '#FFFFFF',
  'on-academic': '#FFFFFF',
};
const border = {
  subtle: '#F0E6DD',
  DEFAULT: '#E7DACF',
  default: '#E7DACF',
  strong: '#D8C7BA',
  brand: '#FFD0DB',
  academic: '#CEE7F0',
};
/**
 * Status com as tres pecas que o RN precisa.
 *
 * O web resolve a superficie e a borda com `color-mix(in srgb, base 12% | 38%,
 * surface-default)`, que **nao existe em RN**. Pre-resolver aqui e o que
 * permite ao chip de status existir sem hex no componente.
 */
const status = {
  success: '#427E5B', 'success-strong': '#2D6A4F', 'success-surface': '#EAF3EC', 'success-border': '#C7E2D1',
  danger: '#B2554D', 'danger-strong': '#A8514B', 'danger-surface': '#FBEDEC', 'danger-border': '#F2D3D0',
  warning: '#8A6524', 'warning-strong': '#725016', 'warning-surface': '#FAF1DE', 'warning-border': '#EEDFBE',
  info: '#4A879F', 'info-strong': '#396D82', 'info-surface': '#EAF3F7', 'info-border': '#CBE3EE',
};
const cover = { base: '#FFFFFF', ink: '#3B3233' };

/** Aurora do canvas: os dois brilhos de fundo que o app web so tem no web. */
const aurora = { rose: '#FFE9E6', amber: '#FFE6C4', blue: '#DCEAF2' };

/* ── geometria ───────────────────────────────────────────────────────────── */
const radius = {
  none: 0, xs: 6, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
  hero: 26, soft: 18, pill: 999,
};
const space = {
  0: 0, 1: 4, 2: 8, 2.5: 10, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32,
  10: 40, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
};

/**
 * Elevacao em duas camadas. Todo `shadow*` vem sempre com `elevation` — no
 * Android `shadowOffset` nao existe, e sem o `elevation` o card fica plano
 * (SPEC-015 D6).
 */
const cocoa = '#7A5848';
const elevation = (opacity, radius_, offsetY, elevation_) => ({
  shadowColor: cocoa,
  shadowOpacity: opacity,
  shadowRadius: radius_,
  shadowOffset: { width: 0, height: offsetY },
  elevation: elevation_,
});
const shadow = {
  none: {},
  xs: elevation(0.05, 2, 1, 1),
  sm: elevation(0.06, 8, 2, 2),
  md: elevation(0.08, 18, 6, 4),
  lg: elevation(0.1, 32, 12, 8),
  floating: elevation(0.14, 28, 8, 10),
  brand: {
    shadowColor: '#AF465F',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
};

/** Famílias — mesma divisao do web. */
const fonts = {
  sans: ['Inter_400Regular'],
  'sans-medium': ['Inter_500Medium'],
  'sans-semibold': ['Inter_600SemiBold'],
  'sans-bold': ['Inter_700Bold'],
  display: ['PlusJakartaSans_400Regular'],
  'display-medium': ['PlusJakartaSans_500Medium'],
  'display-semibold': ['PlusJakartaSans_600SemiBold'],
  'display-bold': ['PlusJakartaSans_700Bold'],
  'display-extrabold': ['PlusJakartaSans_800ExtraBold'],
  serif: ['DMSerifDisplay_400Regular'],
};

/** Gradientes nomeados — cada hero so declara o nome, nunca dois hex. */
const gradients = {
  heroRose: ['#FFFDF8', '#FFEFF3'],
  heroBlue: ['#FFFDF8', '#F1F7FA'],
  heroWarm: ['#FFFDF8', '#FFF6E9'],
  brand: ['#D4617C', '#AF465F'],
  academic: ['#4A879F', '#396D82'],
  green: ['#72B98D', '#43805B'],
  sheen: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'],
  fadeBottom: ['rgba(255,249,240,0)', 'rgba(255,249,240,0.92)'],
  /** Dia futuro na semana: a mesma familia rosa, sem contraste. */
  future: ['#FFE9EE', '#FFD3DD'],
};

module.exports = {
  primitives,
  canvas,
  surface,
  ceci,
  border,
  status,
  cover,
  aurora,
  radius,
  space,
  shadow,
  fonts,
  gradients,
};