/**
 * Helpers compartilhados dos charts dithered (canvas).
 * Tudo aqui é puro (sem React) — testável com vitest.
 * Hex aparece apenas como DADO (cor de série, usada via ctx/style), nunca em className.
 */

export type ChartTheme = 'dark' | 'light';

/** Interpolação suave 0→1 (usada no brilho/wave dos pixels dithered). */
export const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

/** Hash determinístico por célula — dá a textura "jitter" do dither. */
export const hash = (x: number, y: number) => {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Desenha uma "fatia" de donut com cantos arredondados (wedge). */
export const drawRoundedWedge = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  aStart: number,
  aEnd: number,
  cr: number
) => {
  const sweep = aEnd - aStart;
  const maxCr = Math.min(cr, (rOut - rIn) / 2, (sweep * rIn) / 2);
  if (sweep <= 0.001) return;
  const crIn = maxCr;
  const crOut = maxCr;

  const aStartIn = aStart + crIn / rIn;
  const aEndIn = aEnd - crIn / rIn;
  const aStartOut = aStart + crOut / rOut;
  const aEndOut = aEnd - crOut / rOut;

  ctx.moveTo(cx + rIn * Math.cos(aStartIn), cy + rIn * Math.sin(aStartIn));
  ctx.arc(cx, cy, rIn, aStartIn, aEndIn);
  ctx.arcTo(
    cx + rIn * Math.cos(aEnd), cy + rIn * Math.sin(aEnd),
    cx + rOut * Math.cos(aEnd), cy + rOut * Math.sin(aEnd),
    crIn
  );
  ctx.arcTo(
    cx + rOut * Math.cos(aEnd), cy + rOut * Math.sin(aEnd),
    cx + rOut * Math.cos(aEndOut), cy + rOut * Math.sin(aEndOut),
    crOut
  );
  ctx.arc(cx, cy, rOut, aEndOut, aStartOut, true);
  ctx.arcTo(
    cx + rOut * Math.cos(aStart), cy + rOut * Math.sin(aStart),
    cx + rIn * Math.cos(aStart), cy + rIn * Math.sin(aStart),
    crOut
  );
  ctx.arcTo(
    cx + rIn * Math.cos(aStart), cy + rIn * Math.sin(aStart),
    cx + rIn * Math.cos(aStartIn), cy + rIn * Math.sin(aStartIn),
    crIn
  );
};

/** Paleta pastel padrão — espelha os tokens do design system (rose/green/blue/gold/beige/red/brand). */
export const CHART_PASTELS = [
  '#E97891', // rose-500
  '#8BC7A2', // green-400
  '#609FB8', // blue-500
  '#BD913C', // yellow-600
  '#AD9986', // beige-500
  '#E89189', // red-400
  '#D85F79', // ceci-brand
  '#4A879F', // ceci-academic
];

export const formatCount = (n: number) => Math.round(n).toLocaleString('pt-BR');

export function formatShortDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ---- Tipos de dados dos componentes ----

export interface GrowthRange {
  label: string;
  data: number[];
  dates?: string[];
}

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutPeriod {
  label: string;
  data: DonutSegment[];
}

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelVariant {
  label: string;
  stages: FunnelStage[];
}

export interface RevenueVariant {
  label: string;
  data: number[];
}

// ---- Datasets demo (fallback quando não há dados reais) ----

export function buildDemoGrowthRanges(): GrowthRange[] {
  const spans = [7, 14, 30, 90];
  return spans.map((days) => {
    const data: number[] = [];
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const t = days > 1 ? i / (days - 1) : 0;
      const base = 9 + t * 23;
      const wave = 6 * Math.sin(i * 0.7 + 1) + 3 * Math.sin(i * 1.9);
      const val = Math.max(3, Math.round(base + wave));
      data.push(val);
      dates.push(formatShortDate(days - 1 - i));
    }
    return { label: `${days}d`, data, dates };
  });
}

const DEMO_DONUT_BASE: DonutSegment[] = [
  { label: 'sessões de foco', value: 1240 },
  { label: 'leituras', value: 980 },
  { label: 'revisões', value: 620 },
  { label: 'quizzes', value: 410 },
  { label: 'estágio', value: 300 },
];

export function buildDemoDonutPeriods(): DonutPeriod[] {
  const scale = (mult: number) =>
    DEMO_DONUT_BASE.map((s) => ({ ...s, value: Math.round(s.value * mult) }));
  return [
    { label: 'semana', data: scale(0.42) },
    { label: 'mês', data: DEMO_DONUT_BASE },
    { label: 'trimestre', data: scale(2.6) },
    { label: 'ano', data: scale(8.4) },
  ];
}

export const DEMO_FUNNEL_STAGES: FunnelStage[] = [
  { label: 'disciplinas', value: 5 },
  { label: 'aulas anotadas', value: 3 },
  { label: 'leituras', value: 2 },
  { label: 'flashcards revisados', value: 1 },
];

export const DEMO_FUNNEL_VARIANTS: FunnelVariant[] = [
  { label: 'agora', stages: DEMO_FUNNEL_STAGES },
  {
    label: 'semestre passado',
    stages: [
      { label: 'disciplinas', value: 4 },
      { label: 'aulas anotadas', value: 2 },
      { label: 'leituras', value: 1 },
      { label: 'flashcards revisados', value: 0 },
    ],
  },
];

export const DEMO_REVENUE_VARIANTS: RevenueVariant[] = [
  { label: 'esta semana', data: [1200, 1500, 1100, 1800, 2200, 2900, 1750] },
  { label: 'semana passada', data: [900, 1100, 800, 1300, 1600, 2100, 2000] },
];