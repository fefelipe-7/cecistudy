// Gate de tokens de movimento (SPEC-007 §D6 / user story 1).
//
// Regras:
// - **Varia** token literal (`duration: 0.18`, `stiffness: 400`, `ease: 'easeInOut'`,
//   `ease: [0.4, 0, 0.2, 1]`) fora de `src/lib/motion/`.
// - **Não** varia referência a token (`ease: EASE.standard`, `ease: IOS_EASE`,
//   `transition: getTransition(...)`, `...BASE_T`) — usar o token é o objetivo.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = 'src';
/** Só os tokens de movimento decidem transição — o resto fica de fora. */
const EXEMPT_FILES = [
  // O próprio módulo de tokens. `src/lib/motion/` é a fonte; este é o shim legado
  // (que ainda define `IOS_EASE`/`iOS_SPRING`/`sheetVariants` e é re-exportado).
  // Migrado no Slice D; até lá, contar as definições dele aqui seria ruído.
  'src/lib/motion.ts',
];
const EXEMPT_DIRS = ['src/lib/motion/'];

/**
 * Ocorrências inline conhecidas. Este arquivo é um **ratchet**: só pode encolher.
 * Cada slice que limpa um ponto remove a linha daqui.
 *
 * Gerado por `audit-inline-tokens.mjs` (SPEC-007 Slice D).
 */
const KNOWN_INLINE: Record<string, number[]> = {
  'src/components/ui/floating-action-menu.tsx': [40, 41, 43, 44, 57, 68],
  'src/components/ui/bottom-nav-bar.tsx': [36, 66, 89, 90],
  'src/components/courses/detail/CourseCreateMenu.tsx': [68, 107],
  'src/components/flashcards/Card3D.tsx': [8, 95],
  'src/components/flashcards/CardBaúEnvelope.tsx': [34, 52],
  'src/components/quizzes/QuizExplanationOverlay.tsx': [23, 32],
  'src/components/quizzes/QuizGroupDetail.tsx': [64, 84],
  'src/components/ui/dither-growth.tsx': [95, 96],
  'src/components/ui/dither-revenue.tsx': [79, 80],
  'src/components/ui/EdgeSwipeBack.tsx': [96, 103],
  'src/components/views/CourseDetailView.tsx': [188, 189],
  'src/components/views/home/rows.tsx': [31, 80],
  'src/components/views/StreakView.tsx': [36, 124],
  'src/components/quizzes/QuizCategorySelector.tsx': [98],
  'src/components/quizzes/QuizGroupSelector.tsx': [89],
  'src/components/quizzes/QuizLoadingScreen.tsx': [70],
  'src/components/quizzes/QuizResultScreen.tsx': [61],
  'src/components/ui/AnimatedNumber.tsx': [12],
  'src/components/ui/BootSplash.tsx': [121],
  'src/components/ui/ProgressBar.tsx': [29],
  'src/components/ui/SegmentedControl.tsx': [67],
  'src/components/views/NoteTransformWizard.tsx': [45],
  'src/components/wizards/FlashcardWizard.tsx': [194],
  'src/components/wizards/note/fieldsFor.tsx': [175],
};

// `duration: 0.3` | `stiffness: 400` | `damping: 36` | `mass: 0.9`
const NUMERIC = /\b(duration|stiffness|damping|mass)\s*:\s*[-0-9.]+/;
// `ease: 'easeInOut'` | `ease: "linear"` | `ease: [0.4, 0, 0.2, 1]` — mas NÃO `ease: EASE.x`
const EASING_LITERAL = /\bease\s*:\s*('[^']*'|"[^"]*"|\[[^\]]*\])/;

/**
 * Remove comentários de linha e de bloco, **preservando a contagem de linhas**
 * (um bloco vira as mesmas '\n'). Sem isso, editar um comentário deslocaria todos
 * os números do ratchet e o gate quebraria por motivo errado.
 *
 * Um gate que dispara em **prosa** é um gate que as pessoas desabilitam — e este
 * precisa valer como barreira.
 */
const stripComments = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const collect = (dir: string, out: Map<string, number[]>) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collect(p, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const norm = p.split(path.sep).join('/');
    if (EXEMPT_FILES.includes(norm)) return;
    if (EXEMPT_DIRS.some((d) => norm.includes(d))) continue;
    const lines = stripComments(fs.readFileSync(p, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (NUMERIC.test(line) || EASING_LITERAL.test(line)) {
        const list = out.get(norm) ?? [];
        list.push(i + 1);
        out.set(norm, list);
      }
    });
  }
};

const found = new Map<string, number[]>();
collect(SRC, found);

describe('gate de tokens de movimento (SPEC-007 §D6)', () => {
  it('nenhuma transição nova com duração/spring/easing literal fora de src/lib/motion/', () => {
    const unexpected: string[] = [];
    for (const [file, lines] of found) {
      const known = KNOWN_INLINE[file] ?? [];
      for (const line of lines) {
        if (!known.includes(line)) unexpected.push(`${file}:${line}`);
      }
    }
    expect(
      unexpected,
      'Tokens de movimento literais novos. Use BASE_D / BASE_T / EASE de ' +
        '`src/lib/motion/`, ou `getTransition(...)` para respeitar o perfil reduzido. ' +
        'Se a dívida é pré-existente eKnown, adicione a linha em KNOWN_INLINE com comentário.',
    ).toEqual([]);
  });

  it('ratchet: nenhum Known já foi limpo (a lista só pode encolher)', () => {
    const stale: string[] = [];
    for (const [file, knownLines] of Object.entries(KNOWN_INLINE)) {
      const actual = found.get(file) ?? [];
      for (const line of knownLines) {
        if (!actual.includes(line)) stale.push(`${file}:${line}`);
      }
    }
    expect(
      stale,
      'Estas entradas de KNOWN_INLINE não encontram mais literal no arquivo — ' +
        'remova-as do ratchet (o slice limpou o ponto).',
    ).toEqual([]);
  });
});
