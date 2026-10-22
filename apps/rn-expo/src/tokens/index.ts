/**
 * index.ts — a superficie TypeScript da paleta.
 *
 * O dado mora em `palette.js` (porque o Tailwind precisa carregar em Node).
 * Aqui mora so o **tipo**: nome de token, expressao do mascot e os atalhos
 * que o StyleSheet consome (`softShadow`, `heroRadius`...).
 */
import palette from './palette';

export const {
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
} = palette;

export type PrimitiveName = keyof typeof primitives;
export type Tone = 'rose' | 'blue' | 'warm';

/**
 * Gradientes sao **tuplas de dois**, nao `string[]`.
 *
 * `expo-linear-gradient` exige `readonly [ColorValue, ColorValue, ...]`. Como
 * `palette.js` e JS puro (o Tailwind carrega em Node), o TS inferiu `string[]` e
 * rejeitou em todo uso. Declarar o tipo aqui e o ponto unico de correcao.
 */
export type Gradient2 = readonly [string, string];
export const gradients = palette.gradients as unknown as {
  heroRose: Gradient2;
  heroBlue: Gradient2;
  heroWarm: Gradient2;
  brand: Gradient2;
  academic: Gradient2;
  green: Gradient2;
  sheen: Gradient2;
  fadeBottom: Gradient2;
  future: Gradient2;
};

/** Atalho usado por todo componente que precisa de `shadow*` + `elevation`. */
export const softShadow = shadow.sm;
export const liftShadow = shadow.md;
export const heroRadius = radius.hero;

export const MASCOTE_EXPRESSIONS = {
  'welcome-wave': require('../../assets/mascote/welcome-wave.webp'),
  'listening-hello': require('../../assets/mascote/listening-hello.webp'),
  'focus-ready': require('../../assets/mascote/focus-ready.webp'),
  'reading-curious': require('../../assets/mascote/reading-curious.webp'),
  'library-shelf': require('../../assets/mascote/library-shelf.webp'),
  'writing-note': require('../../assets/mascote/writing-note.webp'),
  'review-card': require('../../assets/mascote/review-card.webp'),
  'quiz-ready': require('../../assets/mascote/quiz-ready.webp'),
  'correct-soft': require('../../assets/mascote/correct-soft.webp'),
  'try-again': require('../../assets/mascote/try-again.webp'),
  'empty-invite': require('../../assets/mascote/empty-invite.webp'),
  'done-calm': require('../../assets/mascote/done-calm.webp'),
  'celebrate-small': require('../../assets/mascote/celebrate-small.webp'),
  'class-ready': require('../../assets/mascote/class-ready.webp'),
  'field-prepare': require('../../assets/mascote/field-prepare.webp'),
  'supervision-reflect': require('../../assets/mascote/supervision-reflect.webp'),
  'connection-link': require('../../assets/mascote/connection-link.webp'),
  'research-tcc': require('../../assets/mascote/research-tcc.webp'),
  'writing-flow': require('../../assets/mascote/writing-flow.webp'),
  'boundaries-care': require('../../assets/mascote/boundaries-care.webp'),
  'sync-wait': require('../../assets/mascote/sync-wait.webp'),
  'loading-patient': require('../../assets/mascote/loading-patient.webp'),
  'no-results': require('../../assets/mascote/no-results.webp'),
  'pause-kind': require('../../assets/mascote/pause-kind.webp'),
} as const;

export type MascoteExpression = keyof typeof MASCOTE_EXPRESSIONS;